import { algorithms, type AlgorithmCase } from '../../src/database/algorithms';
import images from '../../src/database/caseImages.json';
import { loadCube } from '../../timer/src/Core/puzzle';
import { normalized } from '../../timer/src/Analysis/cases';
import { algorithmMatcher } from '../../timer/src/Analysis/algorithmMatching';
import { validateUserAlgorithm } from '../../timer/src/Analysis/favoriteAlgorithms';
import type { KPattern } from 'cubing/kpuzzle';

const cube = await loadCube(), matcher = algorithmMatcher(cube);
const pairEdges = [8, 9, 11, 10], others = algorithms.filter(entry => entry.category === 'OF2L');
const before = (entry: AlgorithmCase) => cube.parse(images[`${entry.category}-${entry.id}` as keyof typeof images].facelets);
const solved = (pattern: KPattern, orbit: string, index: number) =>
  pattern.patternData[orbit].pieces[index] === index && !pattern.patternData[orbit].orientation[index];
const pairSolved = (pattern: KPattern, pair: number) => solved(pattern, 'CORNERS', pair) && solved(pattern, 'EDGES', pairEdges[pair - 4]);
function targetState(entry: AlgorithmCase): string {
  const pair = entry.pair ?? 4;
  const yaw = ['', 'y', 'y2', "y'"].find(yaw => cube.solved().applyAlg(yaw).patternData.CORNERS.pieces[4] === pair)!;
  const pattern = normalized(cube, before(entry), yaw);
  return ['', 'U', 'U2', "U'"].map(auf => {
    const { CORNERS: c, EDGES: e } = pattern.applyAlg(auf).patternData, corner = c.pieces.indexOf(4), edge = e.pieces.indexOf(8);
    return [corner, c.orientation[corner], edge, e.orientation[edge]].join(',');
  }).sort()[0];
}
test('Other F2L adds distinct trapped-pair states not already covered by F2L or Advanced F2L', () => {
  expect(others.length).toBeGreaterThan(0);
  const known = new Set(algorithms.filter(entry => entry.category === 'F2L' || entry.category === 'AF2L').map(targetState));
  for (const entry of others) {
    const state = targetState(entry), [corner, , edge] = state.split(',').map(Number);
    expect({ id: entry.id, duplicated: known.has(state) }).toEqual({ id: entry.id, duplicated: false });
    expect(corner).toBeGreaterThanOrEqual(4);
    expect(edge).toBeGreaterThanOrEqual(8);
    known.add(state);
  }
});
test.each(others)('Other F2L $id solves its target and preserves the cross and occupied slots', entry => {
  const start = before(entry), end = start.applyAlg(matcher.outerMoves(entry.algorithm).moves.join(' '));
  expect(pairSolved(start, entry.pair!)).toBe(false);
  expect(pairSolved(end, entry.pair!)).toBe(true);
  for (const slot of [4, 5, 6, 7]) {
    expect(solved(start, 'EDGES', slot)).toBe(true);
    expect(solved(end, 'EDGES', slot)).toBe(true);
    if (pairSolved(start, slot)) expect(pairSolved(end, slot)).toBe(true);
  }
  expect(validateUserAlgorithm(entry, entry.algorithm, cube)).toBe(entry.algorithm);
  expect(() => validateUserAlgorithm(entry, 'R', cube)).toThrow('Other F2L');
});
