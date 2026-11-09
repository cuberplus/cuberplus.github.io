import { AlgorithmMatcher, cubeRotations } from '../../timer/src/Analysis/algorithmMatching';
import { loadCube } from '../../timer/src/Core/puzzle';

const cube = await loadCube(), matcher = new AlgorithmMatcher(cube);
test.each(["R U R'", " R2' \n U' R ", "y R U R'", "x R U M' r Fw S E' x'", "M2 U M2 U2 M2 U M2",
  ...['R', 'U', 'F', 'D', 'L', 'B', 'r', 'u', 'f', 'd', 'l', 'b', 'M', 'E', 'S', 'x', 'y', 'z']
    .flatMap(move => ['', '2', "'"].map(suffix => move + suffix))])('%s expands to the same physical turns and final frame', algorithm => {
  const { moves, rotation } = matcher.outerMoves(algorithm);
  const actual = cube.solved().applyAlg(moves.join(' ')).applyTransformation(rotation);
  const expected = cube.solved().applyAlg(algorithm);
  for (const orbit of ['EDGES', 'CORNERS']) expect(actual.patternData[orbit]).toEqual(expected.patternData[orbit]);
  expect(actual.patternData.CENTERS.pieces).toEqual(expected.patternData.CENTERS.pieces);
});
test('ordinary-turn normalization preserves callback indices and half-turn direction', () => {
  const observed: [string, number][] = [];
  expect(matcher.outerMoves(" R2' \n U' R ", (move, index) => observed.push([move, index])).moves)
    .toEqual(['R2', "U'", 'R']);
  expect(observed).toEqual([['R2', 0], ["U'", 1], ['R', 2]]);
});
test('ordinary-turn fast path does not accept an invalid combined move token', () => {
  expect(() => matcher.outerMoves("RUR'")).toThrow('Invalid move');
});
test.each(['', 'y', 'y2', "y'"])('ignores %s rotations and added or removed AUF', rotation => {
  const algorithm = "R U R' U R U2 R'";
  expect(matcher.signature(`${rotation} U2 ${algorithm} U'`)).toBe(matcher.signature(algorithm));
});
test('matches slice/wide notation and split smartcube turns', () => {
  const algorithm = "r U R' U' M U R U' R'";
  const { moves } = matcher.outerMoves(algorithm);
  expect(matcher.signature(moves.map(move => move.endsWith('2') ? `${move[0]} ${move[0]}` : move).join(' ')))
    .toBe(matcher.signature(algorithm));
});
test('different sequences with the same net transformation remain different algorithms', () => {
  const a = "R U R' U R U2 R'";
  const b = "R U2 R' U' R U' R'";
  expect(matcher.signature(a)).not.toBe(matcher.signature(`${b} ${b}`));
  expect(matcher.signature("R U R'")).not.toBe(matcher.signature("R U2 R'"));
});
test('all calibrated cube frames normalize consistently', () => {
  for (const rotation of cubeRotations) {
    const algorithm = `${rotation} r U M' Fw' E S2 x'`;
    const { moves, rotation: final } = matcher.outerMoves(algorithm);
    const actual = cube.solved().applyAlg(moves.join(' ')).applyTransformation(final);
    const expected = cube.solved().applyAlg(algorithm);
    expect(actual.patternData.CORNERS).toEqual(expected.patternData.CORNERS);
    expect(actual.patternData.EDGES).toEqual(expected.patternData.EDGES);
  }
});
