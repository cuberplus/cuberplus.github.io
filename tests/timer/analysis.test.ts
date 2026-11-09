import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { jest } from '@jest/globals';
import { TimerEngine, type Solve } from '../../timer/src/Core/engine';
import { loadCube, SOLVED, type Cube } from '../../timer/src/Core/puzzle';
import { analyzeCFOP } from '../../timer/src/Analysis/cfop';
import { analysisKey, persistAnalysis, persistReplayAnalysis, reanalyzeSolve, solveAnalysis } from '../../timer/src/Analysis/analysis';
import { backupJSON, deleteSolve, readSolves, saveSolves, validateBackup } from '../../timer/src/Data/storage';
import { readLocalAnalysis } from '../../timer/src/Analysis/analyzer-data';

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
