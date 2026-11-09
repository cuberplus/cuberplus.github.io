/** @jest-environment jsdom */
import { jest } from '@jest/globals';
import { IDBFactory } from 'fake-indexeddb';
import { deserialize, serialize } from 'node:v8';
import { importSolveCSVs, importedAnalysis } from '../../timer/src/Data/csvImport';
import { backupJSON, cubeastCSV, readSolves, saveSolves, turns, validateBackup } from '../../timer/src/Data/storage';
import { readLocalAnalysis } from '../../timer/src/Analysis/analyzer-data';
import { loadCube, SOLVED } from '../../timer/src/Core/puzzle';
import type { Solve } from '../../timer/src/Core/engine';
import { parseCsv } from '../../smartcubeanalyzer/src/Data/CsvParser';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const cube = await loadCube();
const cubeast = 'id,date,dnf,time,solving_method,session_name,step_0_name,step_0_time,step_0_recognition_time,step_0_execution_time,step_0_slice_turns,step_0_moves\r\nsame,2026-01-01 12:00:00 UTC,false,12000,CFOP,Practice,Cross,1000,200,800,4,"R U R\' U\'"\r\n';
const acubemy = 'solve_id,date,total_time,analysis_type\nsame,2026-01-02T12:00:00Z,14000,CFOP\n';
const file = (name: string, text: string) => ({ name, text: async () => text }) as File;
const native: Solve = {
  version: 1, id: 'native', createdAt: '2026-01-03T12:00:00.000Z', session: 'Default', device: 'Test',
  scramble: 'R', startFacelets: cube.facelets(cube.solved().applyAlg('R')), duration: 1000, status: 'complete',
  timingBasis: 'host', reason: '', moves: [{ move: "R'", elapsed: 1000, hostTime: 1000, localTimestamp: 1000, cubeTimestamp: null }],
};
beforeEach(() => {
  Object.defineProperty(globalThis, 'indexedDB', { configurable: true, value: new IDBFactory() });
  Object.defineProperty(globalThis, 'structuredClone', { configurable: true, value: <T>(value: T): T => deserialize(serialize(value)) as T });
});

test('multiple sources merge into native storage with provenance, skip duplicates, and refresh Analyzer', async () => {
  await saveSolves([native]);
  const refresh = jest.fn();
  window.addEventListener('timer-solves-changed', refresh);
  try {
    expect(await importSolveCSVs([file('cubeast.csv', cubeast), file('acubemy.csv', acubemy), file('again.csv', cubeast)])).toEqual({ added: 2, duplicates: 1 });
    const stored = await readSolves();
    expect(stored.map(solve => solve.id).sort()).toEqual(['acubemy:same', 'cubeast:same', 'native']);
    expect(stored.find(solve => solve.id === 'native')).toEqual(native);
    const imported = stored.find(solve => solve.id === 'cubeast:same')!;
    expect(imported).toMatchObject({ moves: [], startFacelets: SOLVED, duration: 12000, imported: { source: 'cubeast', rawSourceId: 'same', session: 'Practice' } });
    expect(imported.imported!.steps[0]).toMatchObject({ name: 'Cross', time: 1, turns: 4, recognitionTime: 0.2, executionTime: 0.8 });
    expect(turns(imported)).toBe(imported.imported!.turns);
    expect(refresh).toHaveBeenCalledTimes(1);
    expect((await readLocalAnalysis()).map(solve => solve.source).sort()).toEqual(['acubemy', 'cubeast', 'timer']);
    await saveSolves([{ ...imported, penalty: 2000, penaltyReason: 'manual' }]);
    expect(await importSolveCSVs([file('again.csv', cubeast)])).toEqual({ added: 0, duplicates: 1 });
    expect((await readSolves()).find(solve => solve.id === imported.id)!.penalty).toBe(2000);
  } finally { window.removeEventListener('timer-solves-changed', refresh); }
});

test('JSON backups and CSV exports preserve imported analysis and source without fabricating turns', async () => {
  await importSolveCSVs([file('cubeast.csv', cubeast), file('acubemy.csv', acubemy)]);
  const stored = await readSolves();
  expect(validateBackup(backupJSON(stored), cube)).toEqual(stored);
  const exported = parseCsv(cubeastCSV(stored, cube), ',');
  expect(exported.map(solve => solve.source).sort()).toEqual(['acubemy', 'cubeast']);
  expect(exported.find(solve => solve.source === 'cubeast')!.steps[0]).toMatchObject({ time: 1, turns: 4, moves: "R U R' U'" });
  const solve = stored.find(solve => solve.imported?.source === 'cubeast')!;
  expect(importedAnalysis({ ...solve, penalty: 2000 }).time).toBe(14);
  expect(importedAnalysis({ ...solve, status: 'incomplete', dnfReason: 'manual' }).dnf).toBe(true);
  const bad = { ...solve, imported: { ...solve.imported!, time: -1 } };
  expect(() => validateBackup(backupJSON([bad]), cube)).toThrow();
});

test.each([
  ['unrecognized.csv', 'name,value\nx,1'],
  ['invalid-date.csv', cubeast.replace('2026-01-01 12:00:00 UTC', 'not-a-date')],
  ['invalid-time.csv', cubeast.replace('12000', '-12000')],
])('an invalid file %s aborts the entire merge and preserves existing solves', async (name, csv) => {
  await saveSolves([native]);
  await expect(importSolveCSVs([file('valid.csv', acubemy), file(name, csv)])).rejects.toThrow();
  expect(await readSolves()).toEqual([native]);
});

test.each(['cfop-small.csv', 'acubemy.csv'])('rebuilds completed demo recordings from %s with real timing and a solved end state', async name => {
  const csv = readFileSync(join(process.cwd(), 'smartcubeanalyzer', 'public', 'demo', name), 'utf8').split(/\r?\n/).slice(0, 33).join('\n');
  const parsed = parseCsv(csv, ',', true);
  await importSolveCSVs([file(name, csv)]);
  const stored = await readSolves();
  for (const source of parsed.filter(solve => !solve.dnf)) {
    const solve = stored.find(solve => solve.id === `${source.source}:${source.rawSourceId || source.id}`)!;
    expect({ id: solve.id, replay: solve.moves.length > 0 }).toEqual({ id: solve.id, replay: true });
    expect(cube.equals(cube.parse(solve.startFacelets), cube.solved().applyAlg(source.scramble))).toBe(true);
    expect(cube.isSolved(cube.parse(solve.startFacelets).applyAlg(solve.moves.map(move => move.move).join(' ')))).toBe(true);
    expect(solve.moves.every(move => move.cubeTimestamp === null && move.localTimestamp === null)).toBe(true);
    expect(solve.moves.at(-1)!.elapsed).toBeLessThanOrEqual(solve.duration + 1);
    expect(solve.imported!.steps).toEqual(source.steps.filter(step => step.name));
    expect(solve.imported!.recording).toBeUndefined();
  }
  expect(validateBackup(backupJSON(stored), cube)).toEqual(stored);
  const first = stored.find(solve => solve.status === 'complete')!;
  const exported = cubeastCSV([first], cube);
  const fresh = first.imported!.source + ':' + first.imported!.rawSourceId;
  Object.defineProperty(globalThis, 'indexedDB', { configurable: true, value: new IDBFactory() });
  await importSolveCSVs([file('roundtrip.csv', exported)]);
  expect((await readSolves()).find(solve => solve.id === fresh)!.moves).toEqual(first.moves);
}, 60000);

test.each([
  ['R\'[50] U[500] U\'[1000]', true],
  ['R\'[0] U[1000] U\'[500]', true],
  ['R\'[0] broken U[500] U\'[1000]', false],
  ['R[0] U[500] U\'[1000]', false],
])('validates imported recording %s without losing analysis', async (solution, replay) => {
  const csv = `id,date,time,scramble,solution\nrecorded,2026-01-01 00:00:00 UTC,1000,R,${solution}\n`;
  await importSolveCSVs([file('recording.csv', csv)]);
  const [solve] = await readSolves();
  expect(solve.moves.length > 0).toBe(replay);
  expect(solve.imported!.source).toBe('cubeast');
  expect(validateBackup(backupJSON([solve]), cube)).toEqual([solve]);
  if (replay) {
    expect(solve.moves[0].elapsed).toBe(solution.includes('[50]') ? 50 : 0);
    expect(() => validateBackup(backupJSON([{ ...solve, moves: solve.moves.map((move, index) => index ? move : { ...move, elapsed: 2000 }) }]), cube)).toThrow();
    expect(() => validateBackup(backupJSON([{ ...solve, startFacelets: SOLVED }]), cube)).toThrow();
  }
});

test('reimport upgrades an analysis-only recording without replacing local edits or provenance', async () => {
  const header = 'id,date,time,scramble,solution\n';
  const details = 'upgrade,2026-01-01 00:00:00 UTC,1000,R,';
  await importSolveCSVs([file('analysis.csv', header + details + '\n')]);
  const [original] = await readSolves();
  const edited = { ...original, session: 'My practice', penalty: 2000, penaltyReason: 'manual', status: 'incomplete' as const, dnfReason: 'manual' as const };
  await saveSolves([edited]);
  expect(await importSolveCSVs([file('recording.csv', header + details + "R'[50] U[1000] U'[500]\n")])).toEqual({ added: 0, duplicates: 1 });
  const [rebuilt] = await readSolves();
  expect({ ...rebuilt, moves: [], startFacelets: SOLVED }).toEqual(edited);
  expect(rebuilt.moves.map(move => [move.elapsed, move.hostTime])).toEqual([[50, 50], [1000, 1000], [1000, 500]]);
  expect(validateBackup(backupJSON([rebuilt]), cube)).toEqual([rebuilt]);
});

test('uses Cubeast step recordings when the complete stream is absent', async () => {
  const csv = 'id,date,time,scramble,step_0_recorded_moves,step_1_recorded_moves\nsteps,2026-01-01 00:00:00 UTC,1000,R,R\'[0],U[500] U\'[1000]\n';
  await importSolveCSVs([file('steps.csv', csv)]);
  expect((await readSolves())[0].moves.map(move => [move.move, move.elapsed])).toEqual([["R'", 0], ['U', 500], ["U'", 1000]]);
});

test('rebuilds a reported DNF as an incomplete replay and retains its duration through CSV export', async () => {
  const csv = "id,date,time,scramble,solution,dnf\npartial,2026-01-01 00:00:00 UTC,1000,R U,U'[50],true\n";
  await importSolveCSVs([file('partial.csv', csv)]);
  const [solve] = await readSolves();
  expect(solve).toMatchObject({ duration: 1000, status: 'incomplete', dnfReason: 'solve interrupted' });
  expect(solve.moves.map(move => [move.move, move.elapsed])).toEqual([["U'", 50]]);
  expect(validateBackup(backupJSON([solve]), cube)).toEqual([solve]);
  const exported = cubeastCSV([solve], cube);
  Object.defineProperty(globalThis, 'indexedDB', { configurable: true, value: new IDBFactory() });
  await importSolveCSVs([file('roundtrip.csv', exported)]);
  const [restored] = await readSolves();
  expect(restored).toMatchObject({ duration: 1000, status: 'incomplete', dnfReason: 'solve interrupted', moves: solve.moves });
  expect(validateBackup(backupJSON([restored]), cube)).toEqual([restored]);
});
