import { algorithms, casePattern, categories, illustrateCases } from '../../../src/database/algorithms';
import { CASE_IDS, recognizeCase } from '../cases';
import { type Cube, loadCube, SOLVED } from '../puzzle';
import { caseStates } from './fixtures/cfop-cases';
import { applyMoves, FACES, inverseMoves, parseAlgorithm, solvedCube, stickers } from '../../../scrambler/src/cube/cube';
import caseImages from '../../../src/database/caseImages.json';
import { validateUserAlgorithm } from '../favoriteAlgorithms';

let cube: Cube;
let images: ReturnType<typeof illustrateCases>;
const options = algorithms.flatMap(entry => entry.options.map(algorithm => ({ ...entry, algorithm })));
beforeAll(async () => { cube = await loadCube(); images = illustrateCases(cube); });
test('precomputed case images remain identical to validated runtime illustrations', () => {
  expect(caseImages).toEqual(Object.fromEntries(images.map(({ category, id, facelets, visibleStickers }) =>
    [`${category}-${id}`, { facelets, visibleStickers }])));
});
test.each(['F2L', 'OLL', 'PLL'] as const)('manual %s algorithms reject the wrong case and accept valid alternatives', category => {
  const entry = algorithms.find(entry => entry.category === category)!;
  expect(validateUserAlgorithm(entry, `  ${entry.options[1]}  `, cube)).toBe(entry.options[1]);
  expect(() => validateUserAlgorithm(entry, 'R', cube)).toThrow('does not match');
  expect(() => validateUserAlgorithm(entry, `D ${entry.algorithm}`, cube)).toThrow('does not match');
});
const f2lIndices = [...Array(54).keys()].filter(i => i >= 27 && i < 36 || i >= 9 && Math.floor(i / 9) !== 3 && i % 9 >= 3);
const target = (category: string, facelets: string) => category === 'PLL' ? facelets === SOLVED :
  f2lIndices.every(i => facelets[i] === SOLVED[i]) && (category !== 'OLL' || facelets.slice(0, 9) === 'U'.repeat(9));

test('database retains every recognized case and includes all advanced F2L variants', () => {
  for (const category of categories) {
    if (category === 'AF2L') continue;
    expect(algorithms.filter(entry => entry.category === category).map(entry => entry.id).sort()).toEqual([...CASE_IDS[category]].sort());
  }
  for (const entry of algorithms) {
    expect(entry.options.length).toBeGreaterThanOrEqual(2);
    expect(new Set(entry.options).size).toBe(entry.options.length);
    expect(entry.options[0]).toBe(entry.algorithm);
  }
  expect(algorithms.filter(entry => entry.category === 'AF2L').map(entry => entry.id))
    .toEqual(Array.from({ length: 42 }, (_, i) => i < 12 ? [String(i + 1), `${i + 1}a`] : [String(i + 1)]).flat());
});

test.each(options.filter(entry => entry.category !== 'AF2L'))('$category $id: $algorithm matches its case and solves independent case states', entry => {
  const before = casePattern(cube, entry.algorithm);
  expect(before.patternData.CENTERS.pieces).toEqual(cube.solved().patternData.CENTERS.pieces);
  expect(recognizeCase(entry.category === 'F2L' ? 4 : entry.category === 'OLL' ? 5 : 6,
    cube, 3, before, cube.solved())).toBe(entry.id);
  expect(cube.isSolved(before.applyAlg(entry.algorithm))).toBe(true);

  const facelets = caseStates.find(([category, id]) => category === entry.category && id === entry.id)![2];
  const fixture = cube.parse(facelets);
  // Independent fixtures have different AUFs, yaw and irrelevant last-layer pieces.
  const solutions = ['', 'y', 'y2', "y'"].flatMap(yaw => ['', 'U', 'U2', "U'"].map(auf => {
    const frame = cube.puzzle.algToTransformation(yaw);
    const aligned = fixture.applyTransformation(frame).applyAlg(auf);
    const end = aligned.applyAlg(entry.algorithm);
    const centers = end.patternData.CENTERS.pieces;
    const restore = ['', 'x', 'x2', "x'", 'z', "z'"].flatMap(tilt => ['', 'y', 'y2', "y'"].map(spin => `${tilt} ${spin}`))
      .find(rotation => cube.solved().applyAlg(rotation).patternData.CENTERS.pieces.every((piece, i) => piece === centers[i]))!;
    return target(entry.category, cube.facelets(end.applyTransformation(cube.puzzle.algToTransformation(restore).invert())));
  }));
  expect(solutions).toContain(true);
});

test.each(options.filter(entry => entry.category === 'AF2L'))('AF2L $id: $algorithm solves its canonical target pair and preserves the cross and occupied slots', entry => {
  expect(validateUserAlgorithm(entry, entry.algorithm, cube)).toBe(entry.algorithm);
  expect(() => validateUserAlgorithm(entry, 'R', cube)).toThrow('does not solve');
  const before = cube.parse(images.find(image => image.category === 'AF2L' && image.id === entry.id)!.facelets);
  expect(cube.equals(before, cube.solved().applyAlg(entry.setup!))).toBe(true);
  const raw = before.applyAlg(entry.algorithm), centers = raw.patternData.CENTERS.pieces;
  const restore = ['', 'x', 'x2', "x'", 'z', "z'"].flatMap(tilt => ['', 'y', 'y2', "y'"].map(yaw => `${tilt} ${yaw}`))
    .find(rotation => cube.solved().applyAlg(rotation).patternData.CENTERS.pieces.every((piece, i) => piece === centers[i]))!;
  const after = raw.applyTransformation(cube.puzzle.algToTransformation(restore).invert());
  const solved = (pattern: typeof before, orbit: 'EDGES' | 'CORNERS', position: number) =>
    pattern.patternData[orbit].pieces[position] === position && pattern.patternData[orbit].orientation[position] === 0;
  const pairSolved = (pattern: typeof before, corner: number) =>
    solved(pattern, 'CORNERS', corner) && solved(pattern, 'EDGES', [8, 9, 11, 10][corner - 4]);
  expect(pairSolved(before, entry.pair!)).toBe(false);
  expect(pairSolved(after, entry.pair!)).toBe(true);
  for (let edge = 4; edge < 8; edge++) {
    expect(solved(before, 'EDGES', edge)).toBe(true);
    expect(solved(after, 'EDGES', edge)).toBe(true);
  }
  for (let corner = 4; corner < 8; corner++) {
    if (pairSolved(before, corner)) expect(pairSolved(after, corner)).toBe(true);
  }
});

test('built-in full-cube solver independently verifies every illustrated setup', async () => {
  for (const entry of images) {
    const facelets = entry.facelets, before = cube.parse(facelets);
    const solution = await cube.solution(facelets);
    expect(cube.isSolved(before.applyAlg(solution.join(' ')))).toBe(true);
    // Cross-check the full solver against the site's independent face-turn cube model.
    const setup = applyMoves(solvedCube(), inverseMoves(parseAlgorithm(solution.join(' '))));
    const rendered = Array<string>(54);
    const visibleStickers: number[] = [];
    const corners = new Set([entry.pair ?? 4]);
    if (entry.category === 'AF2L') {
      for (let corner = 4; corner < 8; corner++) {
        if (setup.corners[corner] === corner * 3 && setup.edges[corner + 4] === (corner + 4) * 2) corners.add(corner);
      }
    }
    stickers(setup).forEach(({ face, row, col, color }, i) => {
      const index = face * 9 + row * 3 + col;
      rendered[index] = FACES[color];
      // Independent cube model emits stickers by piece identity, then centers.
      const piece = Math.floor(i / 2);
      if (i >= 48 || i < 24 && (piece >= 4 && piece <= 7 || corners.has(piece - 4)) ||
        i >= 24 && i < 48 && corners.has(Math.floor((i - 24) / 3))) visibleStickers.push(index);
    });
    expect(rendered.join('')).toBe(facelets);
    if (entry.category !== 'AF2L') expect(cube.isSolved(cube.parse(rendered.join('')).applyAlg(entry.algorithm))).toBe(true);
    if (entry.category === 'F2L' || entry.category === 'AF2L') {
      expect([...entry.visibleStickers].sort((a, b) => a - b)).toEqual(visibleStickers.sort((a, b) => a - b));
    }
  }
}, 120000);
