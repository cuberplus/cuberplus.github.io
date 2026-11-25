import 'fake-indexeddb/auto';
import { makeSnapshot, publicSolve, singleSnapshot, validateSnapshot } from '../../src/sharing/snapshot';
import { readSolves, saveSolves } from '../../timer/src/Data/storage';
import { loadCube, type Cube } from '../../timer/src/Core/puzzle';
import type { Solve } from '../../timer/src/Core/engine';
import { makeSolve } from '../analyzer/testUtils';

let cube: Cube;
beforeAll(async () => { cube = await loadCube(); });
const native = (): Solve => ({
  version: 1, id: 'private-original-id', session: 'Private session', device: 'Private device', reason: 'Private note',
  createdAt: '2026-11-24T12:00:00Z', scramble: 'R', startFacelets: cube.facelets(cube.solved().applyAlg('R')),
  duration: 12345, status: 'complete', timingBasis: 'device-fit',
  moves: [{ move: "R'", elapsed: 0, hostTime: 1234567, serial: 18, localTimestamp: 1234, cubeTimestamp: 5678 }],
});
test('native snapshots retain playable data, omit identity/notes/raw clocks, and never mutate the original', async () => {
  const solve = native(), before = JSON.stringify(solve);
  const snapshot = await singleSnapshot(solve);
  const text = JSON.stringify(snapshot);
  expect(snapshot.rows[0].solve).toEqual({ ...publicSolve(solve, 0), imported: undefined });
  expect(text).not.toMatch(/Private|private-original-id|1234567|1234,|5678|serial/);
  expect(snapshot.rows[0].solve.moves[0]).toEqual({ move: "R'", elapsed: 0, hostTime: 0, localTimestamp: null, cubeTimestamp: null });
  expect(snapshot.rows[0].time).toBe(12.345);
  expect(JSON.stringify(solve)).toBe(before);
  expect((await validateSnapshot(JSON.parse(text))).rows[0].solve.startFacelets).toBe(solve.startFacelets);
});
test('every average preserves displayed times, ordering, DNF and exact trimming, not just ao5/ao12', async () => {
  const rows = Array.from({ length: 7 }, (_, index) => ({
    solve: { ...native(), id: String(index) }, number: index + 10, time: index === 6 ? 'DNF' as const : index + 10,
    turns: 30, tps: 3, trimmed: index === 0 ? 'best' as const : index === 6 ? 'worst' as const : null,
  }));
  const snapshot = await makeSnapshot(rows, 13, 'average');
  expect(snapshot.rows.map(row => [row.number, row.time, row.trimmed])).toEqual(rows.map(row => [row.number, row.time, row.trimmed]));
  expect(snapshot.rows.map(row => row.solve.id)).toEqual(rows.map((_, index) => `shared-${index + 1}`));
  expect(snapshot.time).toBe(13);
});
test('Analyzer snapshots retain imported analysis and reconstruct available replay without source IDs or notes', async () => {
  const solve = Object.assign(makeSolve({ id: 'private-id', rawSource: 'private-file.csv', session: 'Private session',
    scramble: 'R', time: 12, recording: { solution: "R'", timestamps: '12000' } }), { notes: 'Private note' });
  const snapshot = await makeSnapshot([{ solve, number: 1, time: 12, turns: 50, tps: 5, trimmed: null }], 12, 'solve');
  expect(snapshot.rows[0].solve.imported?.steps).toEqual(solve.steps);
  expect(snapshot.rows[0].solve.moves).toHaveLength(1);
  expect(JSON.stringify(snapshot)).not.toMatch(/private-|Private|rawSource|notes|recording/);
});
test('Analyzer averages recover complete recordings with one selected-ID read and preserve displayed partial-step times', async () => {
  const solve = native();
  await saveSolves([solve, { ...native(), id: 'unselected' }]);
  const analyzed = makeSolve({ id: solve.id, source: 'timer', time: 3, recording: undefined, steps: [] });
  const snapshot = await makeSnapshot([{ solve: analyzed, number: 2, time: 3, turns: 20, tps: 4, trimmed: null }], 3, 'average');
  expect(snapshot.rows[0].solve.moves).toHaveLength(1);
  expect(snapshot.rows[0].solve.imported).toBeUndefined();
  expect(snapshot.rows[0].time).toBe(3);
  expect(snapshot.rows).toHaveLength(1);
  expect((await readSolves()).find(item => item.id === solve.id)?.session).toBe('Private session');
});
test('shared readers reject active solves, invalid cube recordings, invalid rows and oversized selections', async () => {
  const value = await singleSnapshot(native());
  await expect(validateSnapshot({ ...value, rows: [] })).rejects.toThrow('valid');
  await expect(validateSnapshot({ ...value, rows: Array(10001).fill(value.rows[0]) })).rejects.toThrow('valid');
  await expect(validateSnapshot({ ...value, rows: [{ ...value.rows[0], number: NaN }] })).rejects.toThrow('row');
  await expect(validateSnapshot({ ...value, rows: [{ ...value.rows[0], solve: { ...value.rows[0].solve, status: 'active' } }] })).rejects.toThrow('row');
  await expect(validateSnapshot({ ...value, rows: [{ ...value.rows[0], solve: { ...value.rows[0].solve, moves: [] } }] })).rejects.toThrow('solved');
  await expect(validateSnapshot({ ...value, rows: [{ ...value.rows[0], tps: Infinity }] })).rejects.toThrow('row');
});
