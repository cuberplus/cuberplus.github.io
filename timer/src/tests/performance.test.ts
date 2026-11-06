import { getAlgorithms } from '../../../src/database/customAlgorithms';
import { firstF2LPair } from '../../../shared/f2l';
import { algorithmMatcher } from '../algorithmMatching';
import { usedAlgorithms } from '../favoriteAlgorithms';
import { type Solve } from '../engine';
import { inverse, loadCube, type Cube } from '../puzzle';
import { backupJSON, newPersonalBests, sessionStats, validateBackup } from '../storage';

let cube: Cube;
let history: Solve[];
let recordings: Solve[];
beforeAll(async () => {
  cube = await loadCube();
  const matcher = algorithmMatcher(cube);
  recordings = getAlgorithms().filter(entry => entry.category !== 'AF2L').filter((_, i) => i % 4 === 0)
    .map((entry, i): Solve => {
      const moves = matcher.outerMoves(entry.options[0]).moves;
      const scramble = moves.slice().reverse().map(inverse).join(' ');
      return {
        version: 1, id: `recording-${i}`, session: 'Practice', device: 'Performance fixture',
        createdAt: new Date(2026, 0, 1, 0, 0, i).toISOString(), status: 'complete',
        scramble, startFacelets: cube.facelets(cube.solved().applyAlg(scramble)),
        duration: (moves.length - 1) * 100, reason: '', timingBasis: 'host',
        moves: moves.map((move, turn) => ({
          move, elapsed: turn * 100, hostTime: turn * 100, localTimestamp: turn * 100, cubeTimestamp: null,
        })),
      };
    });
  history = Array.from({ length: 50_000 }, (_, i): Solve => ({
    ...recordings[i % recordings.length], id: `history-${i}`,
    createdAt: new Date(Date.UTC(2026, 0, 1) + i * 60_000).toISOString(),
    duration: 10_000 + i * 7919 % 20_000,
    status: i % 97 === 0 ? 'incomplete' : 'complete',
  })).reverse();
}, 30_000);

function measured<T>(name: string, budget: number, run: () => T): T {
  const started = performance.now(), result = run(), elapsed = performance.now() - started;
  console.info(`${name}: ${elapsed.toFixed(0)} ms (budget ${budget} ms)`);
  expect(elapsed).toBeLessThan(budget);
  return result;
}

test('10,000 legal cube states parse within an interactive import budget', () => {
  const patterns = measured('10,000 cube-state parses', 300, () =>
    Array.from({ length: 10_000 }, (_, i) => cube.parse(recordings[i % recordings.length].startFacelets)));
  expect(cube.facelets(patterns.at(-1)!)).toBe(recordings[9999 % recordings.length].startFacelets);
});

test('50,000-solve session records and PB detection stay responsive', () => {
  const stats = measured('50,000-solve session statistics', 200, () => sessionStats(history));
  expect(stats.map(stat => stat.name)).toEqual(['Single', 'Ao5', 'Ao12', 'Ao100', 'Ao1000']);
  const records = measured('50,000-solve PB detection', 220, () =>
    newPersonalBests(history, { ...recordings[0], id: 'new-pb', duration: 1000 }));
  expect(records.some(record => record.name === 'Single')).toBe(true);
});

test('1,000 full recordings validate and roundtrip without skipping cube checks', () => {
  const solves = history.slice(0, 1000).map(solve => ({ ...solve, status: 'complete' as const }));
  const json = measured('1,000-solve JSON export', 25, () => backupJSON(solves));
  const restored = measured('1,000-solve backup validation', 450, () => validateBackup(json, cube));
  expect(restored).toEqual(solves);
});

test('uncached algorithm recognition handles a varied recording batch within budget', () => {
  const recognized = measured(`${recordings.length} uncached algorithm recordings`, 100, () =>
    recordings.flatMap(solve => usedAlgorithms(solve, cube)));
  expect(recognized.length).toBeGreaterThan(recordings.length / 2);
  expect(recognized.some(use => use.caseKey.startsWith('F2L-'))).toBe(true);
  expect(recognized.some(use => use.caseKey.startsWith('PLL-'))).toBe(true);
});

test('5,000 imported recordings reconstruct the first pair without tracking unrelated cubies', () => {
  const scramble = "R U R' U' R' F R2 U' R' U' R U R' F' R U R' U R U2 R' R U R' F U F' L U L' B U B' D";
  const pairs = measured('5,000 first-pair reconstructions', 100, () =>
    Array.from({ length: 5000 }, () => firstF2LPair(scramble, "D'[0] B[100] U'[200] B'[300]", 3)));
  expect(new Set(pairs)).toEqual(new Set(['Red/Blue']));
});
