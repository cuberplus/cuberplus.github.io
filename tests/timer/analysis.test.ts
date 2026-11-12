import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { jest } from '@jest/globals';
import { TimerEngine, type Solve } from '../../timer/src/Core/engine';
import { loadCube, SOLVED, type Cube } from '../../timer/src/Core/puzzle';
import { analyzeCFOP } from '../../timer/src/Analysis/cfop';
import { analysisKey, persistAnalysis, persistReplayAnalysis, reanalyzeAllSolves, reanalyzeSolve, solveAnalysis } from '../../timer/src/Analysis/analysis';
import { MethodName } from '../../smartcubeanalyzer/src/Models/Types';
import { backupJSON, deleteSolve, readSolves, saveSolves, validateBackup } from '../../timer/src/Data/storage';
import { readLocalAnalysis } from '../../timer/src/Analysis/analyzer-data';
import { readFileSync } from 'node:fs';
import { importSolveCSVs } from '../../timer/src/Data/csvImport';
import { CrossColor, StepName } from '../../smartcubeanalyzer/src/Models/Types';

let cube: Cube;
beforeAll(async () => { cube = await loadCube(); });
beforeEach(() => { globalThis.indexedDB = new IDBFactory(); });
function sample(): Solve {
  const timer = new TimerEngine(cube, () => {}, () => {});
  timer.connect('Cube'); timer.synchronize(SOLVED); timer.prepare('R U2');
  ['R', 'U2', 'U2', "R'"].forEach((move, i) => timer.turn({ move, hostTime: i * 100, localTimestamp: i * 100, cubeTimestamp: null }));
  return timer.result!;
}
test('changing cross color recalculates boundaries, preserves recording and permits returning to automatic', () => {
  const solve = sample(), automatic = solveAnalysis(solve, cube);
  const overridden = reanalyzeSolve(solve, cube, 0);
  expect(analyzeCFOP(overridden, cube).cross).toBe(0);
  expect(overridden.analysis!.key).not.toBe(solve.analysis!.key);
  expect(overridden.moves).toBe(solve.moves);
  expect(overridden.duration).toBe(solve.duration);
  expect(solveAnalysis(reanalyzeSolve(overridden, cube, undefined), cube).steps).toEqual(automatic.steps);
  expect(solve.crossOverride).toBeUndefined();
});
test('persisted analysis and CFOP are reused after an IndexedDB and backup roundtrip', async () => {
  await saveSolves([sample()]);
  const first = await readLocalAnalysis(), [stored] = await readSolves();
  expect(stored.analysis!.data.mistakeContext).toBeDefined();
  const [restored] = validateBackup(backupJSON([stored]), cube);
  expect(restored.analysis).toEqual(stored.analysis);
  expect(restored.cfop).toEqual(stored.cfop);
  const parse = jest.spyOn(cube, 'parse').mockImplementation(() => { throw new Error('Should use cache'); });
  try {
    expect(solveAnalysis(restored, cube)).toEqual(first[0]);
    expect(analyzeCFOP(restored, cube).ends).toEqual(stored.cfop!.ends);
    expect(await readLocalAnalysis()).toEqual(first);
  } finally { parse.mockRestore(); }
});
test('recent analysis skips historical CFOP, preserves original caches and recordings, and All restores details', async () => {
  const cached = { ...sample(), id: 'cached', createdAt: '2026-01-01T00:00:00.000Z' };
  solveAnalysis(cached, cube);
  const uncached = { ...sample(), id: 'uncached', createdAt: '2026-01-02T00:00:00.000Z' };
  const newest = { ...sample(), id: 'newest', createdAt: '2026-01-03T00:00:00.000Z' };
  solveAnalysis(newest, cube);
  await saveSolves([cached, uncached, newest]);
  const before = await readSolves();
  const parse = jest.spyOn(cube, 'parse').mockImplementation(() => { throw new Error('Historical CFOP must not run'); });
  try {
    const records = await readLocalAnalysis(1);
    expect(records.map(record => record.id)).toEqual(['cached', 'uncached', 'newest']);
    expect(records.map(record => record.time)).toEqual([cached, uncached, newest].map(solve => solve.duration / 1000));
    expect(records[0].steps.every(step => !step.moves)).toBe(true);
    expect(records[0].recording).toBeUndefined();
    expect(records[1].steps).toEqual([]);
    expect(records[2].steps.some(step => !!step.moves)).toBe(true);
    const stored = await readSolves();
    for (const id of ['cached', 'uncached']) expect(stored.find(solve => solve.id === id)).toEqual(before.find(solve => solve.id === id));
  } finally { parse.mockRestore(); }
  const all = await readLocalAnalysis(0);
  expect(all.every(record => record.steps.some(step => !!step.moves))).toBe(true);
  const stored = await readSolves();
  expect(stored.find(solve => solve.id === 'uncached')!.analysis).toBeDefined();
  expect(stored.map(solve => solve.moves)).toEqual(before.map(solve => solve.moves));
});
test('background derived writes do not overwrite newer edits or resurrect deleted solves', async () => {
  const solve = sample(), record = solveAnalysis(solve, cube);
  await saveSolves([{ ...solve, penalty: 2000, penaltyReason: 'manual' }]);
  record.mistakes = [{ kind: 'crossMoves', estimatedSeconds: 1 }];
  await persistAnalysis([solve], [record]);
  expect((await readSolves())[0].penalty).toBe(2000);
  await deleteSolve(solve.id);
  record.mistakes = [];
  await persistAnalysis([solve], [record]);
  expect(await readSolves()).toEqual([]);
});
test('penalty and session changes invalidate analysis; invalid optional backup caches are discarded', () => {
  const solve = sample(); solveAnalysis(solve, cube);
  const changed = { ...solve, session: 'Different', penalty: 2000, penaltyReason: 'manual' };
  expect(solveAnalysis(changed, cube)).toMatchObject({ session: 'Different', time: (solve.duration + 2000) / 1000 });
  expect(changed.analysis!.key).toBe(analysisKey(changed));
  solve.analysis!.data.steps[0].time = -1;
  expect(validateBackup(backupJSON([solve]), cube)[0].analysis).toBeUndefined();
});
test('same-length recording edits invalidate saved and in-memory analysis', () => {
  const solve = sample();
  solveAnalysis(solve, cube);
  const previous = solve.analysis!.key;
  solve.moves[0] = { ...solve.moves[0], move: 'F' };
  solveAnalysis(solve, cube);
  expect(solve.analysis!.key).not.toBe(previous);
  const fresh = { ...solve, analysis: undefined, cfop: undefined };
  expect(analyzeCFOP(solve, cube)).toEqual(analyzeCFOP(fresh, cube));
});
test('imported chart analysis does not re-derive recordings; opened replay boundaries persist and are reused', async () => {
  const solve = sample();
  solveAnalysis(solve, cube);
  solve.imported = { ...solve.analysis!.data, source: 'cubeast' };
  solve.analysis = undefined; solve.cfop = undefined;
  await saveSolves([solve]);
  const parse = jest.spyOn(cube, 'parse').mockImplementation(() => { throw new Error('Unnecessary recording analysis'); });
  try { expect((await readLocalAnalysis())[0].steps).toEqual(solve.imported.steps); }
  finally { parse.mockRestore(); }
  const [stored] = await readSolves();
  expect(stored.cfop).toBeUndefined();
  await persistReplayAnalysis(stored, cube);
  const [cached] = await readSolves();
  expect(cached.cfop!.ends).toEqual(analyzeCFOP(solve, cube).ends);
  const again = jest.spyOn(cube, 'parse').mockImplementation(() => { throw new Error('Should use saved replay'); });
  try { await persistReplayAnalysis(cached, cube); }
  finally { again.mockRestore(); }
});
test('bulk reanalysis recovers cases, preserves source metadata and reports progress without fabricating inspection', async () => {
  const solve = sample();
  solve.createdAt = '2026-10-01T10:20:30.123Z';
  solveAnalysis(solve, cube);
  const imported = { ...solve.analysis!.data, source: 'acubemy' as const, id: 'original', rawSourceId: 'original', rawSource: 'acubemy', date: solve.createdAt,
    inspectionTime: null, endDate: '2026-10-01T10:20:40.456Z', steps: solve.analysis!.data.steps.filter(step => step.name).map(step => ({ ...step, case: '' })) };
  solve.imported = imported; solve.analysis = undefined; solve.cfop = undefined;
  const noMoves = { ...solve, id: 'missing', moves: [], startFacelets: SOLVED };
  const roux = { ...solve, id: 'roux', imported: { ...imported, method: MethodName.Roux } };
  await saveSolves([solve, noMoves, roux]);
  const progress = jest.fn();
  expect(await reanalyzeAllSolves(progress)).toMatchObject({ processed: 3, total: 3, analyzed: 1, skipped: 2, failed: 0, remainingMs: 0 });
  const stored = await readSolves(), updated = stored.find(record => record.id === solve.id)!;
  expect(updated.imported!.steps.find(step => step.name === 'PLL')!.case).toBe('Solved');
  expect(updated.imported).toMatchObject({ id: 'original', rawSourceId: 'original', source: 'acubemy', date: solve.createdAt,
    endDate: imported.endDate, inspectionTime: null });
  expect(updated.moves).toEqual(solve.moves);
  expect(updated.duration).toBe(solve.duration);
  expect(updated.session).toBe(solve.session);
  expect(validateBackup(backupJSON(stored), cube)).toHaveLength(3);
  expect(progress.mock.calls[0][0]).toMatchObject({ processed: 0, total: 3, remainingMs: null });
  expect(progress.mock.calls.at(-1)![0]).toMatchObject({ processed: 3, remainingMs: 0 });
});
test('reanalysis persistence retains later edits, deleted rows and unrelated metadata', async () => {
  const solve = sample(), updated = reanalyzeSolve(solve, cube, undefined);
  await saveSolves([{ ...solve, reason: 'local note' }]);
  await saveSolves([updated], 'reanalysis');
  expect((await readSolves())[0].reason).toBe('local note');
  await saveSolves([{ ...solve, penalty: 2000 }]);
  await saveSolves([updated], 'reanalysis');
  expect((await readSolves())[0].penalty).toBe(2000);
  await deleteSolve(solve.id);
  await saveSolves([updated], 'reanalysis');
  expect(await readSolves()).toEqual([]);
});
test('bulk reanalysis reports per-solve failures and handles an empty database', async () => {
  expect(await reanalyzeAllSolves(jest.fn())).toMatchObject({ total: 0, processed: 0, analyzed: 0, remainingMs: 0 });
  const solve = { ...sample(), startFacelets: 'invalid' };
  await saveSolves([solve]);
  expect(await reanalyzeAllSolves(jest.fn())).toMatchObject({ total: 1, analyzed: 0, failed: 1 });
  expect((await readSolves())[0]).toEqual(solve);
});
test('imported reanalysis ignores incidental crosses and repairs legacy inverted cross colors', async () => {
  const rows = readFileSync('smartcubeanalyzer\\public\\demo\\acubemy-all-solves.csv', 'utf8').split(/\r?\n/);
  const row = rows.find(line => line.startsWith('286820,'))!;
  expect(row).toBeDefined();
  await importSolveCSVs([{ name: 'actual.csv', text: async () => `${rows[0]}\n${row}\n` } as File]);
  const [solve] = await readSolves();
  expect(solve.moves).toHaveLength(93);
  expect(analyzeCFOP(solve, cube).cross).toBe(1);
  for (const crossColor of [CrossColor.White, CrossColor.Yellow]) {
    const legacy = { ...solve, imported: { ...solve.imported!, crossColor } };
    const updated = reanalyzeSolve(legacy, cube, undefined);
    expect(updated.imported!.crossColor).toBe(CrossColor.White);
    expect(updated.imported!.steps.find(step => step.name === StepName.OLL)!.case).toBe('10');
    expect(updated.imported!.steps.find(step => step.name === StepName.PLL)!.case).toBe(solve.imported!.steps.find(step => step.name === StepName.PLL)!.case);
    expect(analyzeCFOP(updated, cube).cross).toBe(0);
    expect(validateBackup(backupJSON([updated]), cube)).toHaveLength(1);
    expect(updated.moves).toEqual(solve.moves);
  }
});
