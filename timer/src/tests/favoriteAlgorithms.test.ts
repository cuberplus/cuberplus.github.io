import { algorithms, casePattern } from '../../../src/database/algorithms';
import { favoriteId } from '../../../src/database/favorites';
import { algorithmMatcher, cubeRotations } from '../algorithmMatching';
import { usedAlgorithms, nonFavoriteAlgorithms, discoverFavorites } from '../favoriteAlgorithms';
import { loadCube } from '../puzzle';
import type { Solve } from '../engine';

const cube = await loadCube(), matcher = algorithmMatcher(cube);
const tPerm = algorithms.find(entry => entry.category === 'PLL' && entry.id === 'T')!;
function recording(algorithm: string, id = algorithm): Solve {
  const moves = matcher.outerMoves(algorithm).moves.map((move, index) => ({
    move, elapsed: index * 100, hostTime: index * 100, localTimestamp: index * 100, cubeTimestamp: null,
  }));
  return {
    version: 1, id, session: 'Default', createdAt: '2026-11-05T00:00:00Z', device: 'Test',
    scramble: '', startFacelets: cube.facelets(casePattern(cube, algorithm)), duration: moves.length * 100,
    status: 'complete', reason: '', timingBasis: 'host', moves,
  };
}
test.each(algorithms.filter(entry => entry.category !== 'AF2L').flatMap(entry =>
  entry.options.map(algorithm => ({ ...entry, selected: algorithm }))))('$category $id matches recorded $selected', entry => {
  const uses = usedAlgorithms(recording(entry.selected), cube);
  expect(uses.some(use => use.caseKey === `${entry.category}-${entry.id}` &&
    use.matches.includes(favoriteId(entry, entry.selected)))).toBe(true);
});
test.each(algorithms.filter(entry => entry.category === 'AF2L').flatMap(entry =>
  entry.options.map(algorithm => ({ ...entry, algorithm }))))('advanced F2L $id: $algorithm is recognized with occupied neighboring slots', async entry => {
  const solve = recording(entry.algorithm);
  const start = cube.solved().applyAlg(entry.setup!);
  solve.startFacelets = cube.facelets(start);
  const remaining = await cube.solution(cube.facelets(start.applyAlg(solve.moves.map(move => move.move).join(' '))));
  for (const move of remaining) {
    const time = solve.moves.length * 100;
    solve.moves.push({ move, elapsed: time, hostTime: time, localTimestamp: time, cubeTimestamp: null });
  }
  const uses = usedAlgorithms(solve, cube);
  expect(uses.some(use => use.caseKeys.includes(`AF2L-${entry.id}`) && use.matches.includes(favoriteId(entry, entry.algorithm)))).toBe(true);
  expect(nonFavoriteAlgorithms(solve, cube, new Set([favoriteId(entry, entry.algorithm)]), { F2L: false, OLL: true, PLL: true })).toEqual([]);
}, 15000);
test('only checks cases with favorites and accepts any favorited alternative', () => {
  const alternate = tPerm.options.find(algorithm => matcher.signature(algorithm) !== matcher.signature(tPerm.algorithm))!;
  expect(alternate).toBeDefined();
  const solve = recording(alternate);
  expect(nonFavoriteAlgorithms(solve, cube, new Set())).toEqual([]);
  expect(nonFavoriteAlgorithms(solve, cube, new Set([favoriteId(tPerm, tPerm.algorithm)]))).toHaveLength(1);
  expect(nonFavoriteAlgorithms(solve, cube, new Set([favoriteId(tPerm, tPerm.algorithm), favoriteId(tPerm, alternate)]))).toEqual([]);
});
test.each(['F2L', 'OLL', 'PLL'] as const)('%s mistakes respect the group switch independently', category => {
  const entry = algorithms.find(entry => entry.category === category)!;
  const alternate = entry.options.find(algorithm => matcher.signature(algorithm) !== matcher.signature(entry.algorithm))!;
  const solve = recording(alternate), favorites = new Set([favoriteId(entry, entry.algorithm)]);
  expect(nonFavoriteAlgorithms(solve, cube, favorites)).not.toHaveLength(0);
  expect(nonFavoriteAlgorithms(solve, cube, favorites, { F2L: true, OLL: true, PLL: true, [category]: false })).toEqual([]);
});
test.each(['', 'y', 'y2', "y'"])('favorite matching accepts %s rotations and U adjustments', rotation => {
  const solve = recording(`${rotation} U2 ${tPerm.algorithm} U'`);
  expect(nonFavoriteAlgorithms(solve, cube, new Set([favoriteId(tPerm, tPerm.algorithm)]))).toEqual([]);
  expect(usedAlgorithms(solve, cube).some(use => use.matches.includes(favoriteId(tPerm, tPerm.algorithm)))).toBe(true);
});
test.each(cubeRotations)('favorites match with the cross rotated by %s', rotation => {
  const { moves } = matcher.outerMoves(`D' B U' B' L U' L' F U' F' R U' R' R U R' U R U2 R' ${tPerm.algorithm}`);
  const centers = cube.solved().applyAlg(rotation).patternData.CENTERS.pieces;
  const remap = (move: string) => 'ULFRBD'[centers['ULFRBD'.indexOf(move[0])]] + move.slice(1);
  const algorithm = moves.map(remap).join(' ');
  const solve = recording(algorithm);
  expect(usedAlgorithms(solve, cube).some(use => use.matches.includes(favoriteId(tPerm, tPerm.algorithm)))).toBe(true);
});
test('discovery adds matches without deleting existing favorites and excludes incomplete solves', async () => {
  const favorite = favoriteId(tPerm, tPerm.algorithm);
  const found = await discoverFavorites([recording(tPerm.algorithm), { ...recording(tPerm.options[1]), status: 'incomplete' }],
    cube, new Set(['F2L-1:existing']));
  expect(found.has(favorite)).toBe(true);
  expect(found.has('F2L-1:existing')).toBe(true);
  expect(found.has(favoriteId(tPerm, tPerm.options[1]))).toBe(false);
});
test('discovery uses the newest 2000 completed solves across sessions', async () => {
  const old = recording(tPerm.algorithm, 'old');
  const recent = Array.from({ length: 2000 }, (_, i) => ({
    ...recording('', `recent-${i}`), session: 'Other session', createdAt: '2026-11-06T00:00:00Z',
  }));
  const found = await discoverFavorites([old, ...recent.reverse()], cube, new Set());
  expect(found.has(favoriteId(tPerm, tPerm.algorithm))).toBe(false);
  const within = await discoverFavorites([old, ...recent.slice(1)], cube, new Set());
  expect(within.has(favoriteId(tPerm, tPerm.algorithm))).toBe(true);
});
