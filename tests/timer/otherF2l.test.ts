import { algorithms, baseAlgorithms, databaseCaseKeys, type AlgorithmCase } from '../../src/database/algorithms';
import images from '../../src/database/caseImages.json';
import { loadCube } from '../../timer/src/Core/puzzle';
import { normalized, recognizeCase } from '../../timer/src/Analysis/cases';
import { algorithmMatcher, cubeRotations } from '../../timer/src/Analysis/algorithmMatching';
import { validateUserAlgorithm } from '../../timer/src/Analysis/favoriteAlgorithms';
import type { KPattern } from 'cubing/kpuzzle';
import generated from '../../src/database/otherF2l.json';
import solutions from '../../src/database/f2lSolutions.json';
import { CORNER_MOVES, EDGE_MOVES, applyMoves, inverseMoves, parseAlgorithm, solvedCube } from '../../scrambler/src/cube/cube';

const cube = await loadCube(), matcher = algorithmMatcher(cube);
const frames = cubeRotations.map(rotation => cube.puzzle.algToTransformation(rotation));
const rotations = frames.map(frame => frame.toKPattern().patternData.CENTERS.pieces);
const pairEdges = [8, 9, 11, 10], others = algorithms.filter(entry => entry.category === 'OF2L');
const featuredCases = algorithms.filter(entry => entry.featured);
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
    const mask = [4, 5, 6, 7].reduce((mask, slot) => mask | (pairSolved(pattern, slot) ? 1 << (slot - 4) : 0), 0);
    return [corner, c.orientation[corner], edge, e.orientation[edge], mask].join(':');
  }).sort()[0];
}
test('F2L categories cover every placement, with no standard or advanced duplicates in Other F2L', () => {
  const expected = new Set<string>(), actual = new Set<string>();
  for (let corner = 0; corner < 8; corner++) for (let twist = 0; twist < 3; twist++) {
    for (const edge of [0, 1, 2, 3, 8, 9, 10, 11]) for (let flip = 0; flip < 2; flip++) {
      if (corner < 4 ? corner !== 0 : edge < 4 && edge !== 0) continue;
      if (corner === 4 && twist === 0 && edge === 8 && flip === 0) continue;
      const mask = [5, 6, 7].reduce((mask, slot) => mask | (corner !== slot && edge !== pairEdges[slot - 4] ? 1 << (slot - 4) : 0), 0);
      expected.add(`${corner}:${twist}:${edge}:${flip}:${mask}`);
    }
  }
  const known = new Set<string>();
  const traditional = new Set(algorithms.filter(entry => entry.category === 'F2L' || entry.category === 'AF2L').map(targetState));
  for (const entry of others) {
    const normalized = targetState(entry);
    expect(traditional.has(normalized)).toBe(false);
    expect(known.has(normalized)).toBe(false); known.add(normalized);
    const start = before(entry), { EDGES, CORNERS } = start.patternData;
    const corner = CORNERS.pieces.indexOf(4), edge = EDGES.pieces.indexOf(8);
    actual.add(normalized);
    for (let slot = 5; slot < 8; slot++) if (corner !== slot && edge !== pairEdges[slot - 4]) expect(pairSolved(start, slot)).toBe(true);
  }
  expect(others).toHaveLength(75);
  expect(traditional.size).toBe(92);
  expect(new Set([...actual, ...traditional])).toEqual(expected);
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
test.each(featuredCases)('$category $id has three engine-valid, rotation-distinct, no-B featured solutions', entry => {
  const options = entry.featured!, start = before(entry), target = entry.pair ?? 4;
  expect(options).toHaveLength(3);
  expect(entry.options.slice(0, 3)).toEqual(options);
  expect(new Set(options.map(algorithm => matcher.signature(algorithm))).size).toBe(3);
  expect(new Set(options.map(algorithm => rotations.map(centers => algorithm.split(' ').map(move =>
    'ULFRBD'[centers['ULFRBD'.indexOf(move[0])]] + move.slice(1)).join(' ')).sort()[0])).size).toBe(3);
  for (const algorithm of options) {
    expect(algorithm).toMatch(/^(?:[URFLD](?:2|')?)(?: [URFLD](?:2|')?)*$/);
    expect(validateUserAlgorithm(entry, algorithm, cube)).toBe(algorithm);
    const end = start.applyAlg(algorithm);
    expect(pairSolved(end, target)).toBe(true);
    for (const slot of [4, 5, 6, 7]) {
      expect(solved(end, 'EDGES', slot)).toBe(true);
      if (pairSolved(start, slot)) expect(pairSolved(end, slot)).toBe(true);
    }
  }
  const cost = (algorithm: string) => algorithm.split(' ').reduce((sum, move) => sum + ('RU'.includes(move[0]) ? 1 : 3), 0);
  expect(cost(options[1])).toBeLessThanOrEqual(cost(options[2]));
  const rank = (algorithm: string) => {
    const moves = matcher.outerMoves(algorithm).moves;
    return [moves.length, moves.reduce((sum, move) => sum + (move.includes('2') ? 2 : 1), 0), moves.filter(move => !'RU'.includes(move[0])).length];
  };
  const shortest = rank(options[0]);
  for (const algorithm of entry.options) {
    const moves = matcher.outerMoves(algorithm).moves;
    if (moves.some(move => move.startsWith('B'))) continue;
    // Curated variants can assume a different AUF from the illustrated setup.
    const end = start.applyAlg(moves.join(' '));
    if (!pairSolved(end, target) || [4, 5, 6, 7].some(slot =>
      !solved(end, 'EDGES', slot) || pairSolved(start, slot) && !pairSolved(end, slot))) continue;
    const candidate = rank(algorithm), different = shortest.findIndex((value, i) => value !== candidate[i]);
    if (different >= 0) expect(shortest[different]).toBeLessThan(candidate[different]);
  }
});
test.each(featuredCases)('$category $id is recognized from its target state, including trapped and simultaneous pairs', entry => {
  const start = before(entry), end = start.applyAlg(entry.featured![0]);
  const label = recognizeCase(1, cube, 3, start, end), keys = databaseCaseKeys('F2L', label);
  if (entry.category === 'OF2L') expect(keys).toContain(`OF2L-${entry.id}`);
  expect(keys.some(key => {
    const recognized = algorithms.find(candidate => `${candidate.category}-${candidate.id}` === key);
    return recognized && targetState(recognized) === targetState(entry);
  })).toBe(true);
  for (const frame of frames) {
    const rotate = (pattern: KPattern) => frame.invert().applyTransformation(pattern.experimentalToTransformation()!).applyTransformation(frame).toKPattern();
    const cross = 'URFDLB'.indexOf('ULFRBD'[frame.transformationData.CENTERS.permutation.indexOf(5)]);
    expect(new Set(databaseCaseKeys('F2L', recognizeCase(1, cube, cross, rotate(start), rotate(end))))).toEqual(new Set(keys));
  }
});
test('all original F2L and AF2L solutions remain available or have an equivalent retained choice', () => {
  const rotationSignature = (algorithm: string) => rotations.map(centers => matcher.outerMoves(algorithm).moves.map(move =>
    'ULFRBD'[centers['ULFRBD'.indexOf(move[0])]] + move.slice(1)).join(' ')).sort()[0];
  for (const original of baseAlgorithms.filter(entry => entry.category === 'F2L' || entry.category === 'AF2L')) {
    const entry = algorithms.find(entry => entry.category === original.category && entry.id === original.id)!;
    expect(entry.algorithm).toBe(original.algorithm);
    expect(entry.setup).toBe(original.setup);
    for (const algorithm of original.options) expect(entry.options.some(option =>
      matcher.signature(option) === matcher.signature(algorithm) || rotationSignature(option) === rotationSignature(algorithm))).toBe(true);
  }
});
function coordinates(entry: AlgorithmCase) {
  const moves = parseAlgorithm(matcher.outerMoves(entry.setup ?? entry.algorithm).moves.join(' '));
  const state = applyMoves(solvedCube(), entry.setup ? moves : inverseMoves(moves));
  const slots = [4, 5, 6, 7].filter(slot => slot === (entry.pair ?? 4) ||
    state.corners[slot] === slot * 3 && state.edges[slot + 4] === (slot + 4) * 2);
  const edges = [4, 5, 6, 7, ...slots.map(slot => slot + 4)];
  const tables = [...edges.map(() => EDGE_MOVES), ...slots.map(() => CORNER_MOVES)];
  const encode = (values: number[]) => String.fromCharCode(...values.map(value => value + 33));
  return {
    slots, start: encode([...edges.map(piece => state.edges[piece]), ...slots.map(piece => state.corners[piece])]),
    goal: encode([...edges.map(piece => piece * 2), ...slots.map(piece => piece * 3)]),
    expand: (key: string, move: number) => String.fromCharCode(...tables.map((table, i) => table[(key.charCodeAt(i) - 33) * 18 + move] + 33)),
  };
}
test('an independent bidirectional search proves every first solution shortest without B turns', () => {
  const backward = new Map<string, Map<string, number>>();
  const metadata = solutions.cases as Record<string, { optimalLength: number }>;
  for (const entry of featuredCases) {
    const key = `${entry.category}-${entry.id}`;
    const { slots, start, goal, expand } = coordinates(entry);
    const optimalLength = entry.category === 'OF2L' ? generated.cases.find(saved => saved.id === entry.id)!.optimalLength : metadata[key].optimalLength;
    expect(entry.featured![0].split(' ')).toHaveLength(optimalLength);
    const shorter = optimalLength - 1, depth = Math.floor(shorter / 2);
    let distances = backward.get(`${slots}:${depth}`);
    if (!distances) {
      distances = new Map([[goal, 0]]);
      let frontier = [goal];
      for (let step = 1; step <= depth; step++) {
        const next: string[] = [];
        for (const key of frontier) for (let move = 0; move < 15; move++) {
          const candidate = expand(key, move);
          if (!distances.has(candidate)) { distances.set(candidate, step); next.push(candidate); }
        }
        frontier = next;
      }
      backward.set(`${slots}:${depth}`, distances);
    }
    let frontier = [start];
    const visited = new Set(frontier);
    for (let step = 0; step <= shorter - depth; step++) {
      const next: string[] = [];
      for (const key of frontier) {
        if ((distances.get(key) ?? Infinity) + step <= shorter) throw new Error(`${entry.category}-${entry.id} has a shorter solution`);
        if (step === shorter - depth) continue;
        for (let move = 0; move < 15; move++) {
          const candidate = expand(key, move);
          if (!visited.has(candidate)) { visited.add(candidate); next.push(candidate); }
        }
      }
      frontier = next;
    }
  }
}, 120000);
test('independent meet-in-the-middle search proves QTM and ergonomic tie-breaks for short cases and regression cases', () => {
  const backward = new Map<string, Map<string, number>>(), quarterWeight = 32;
  for (const entry of featuredCases.filter(entry => entry.featured![0].split(' ').length <= 6 ||
    entry.category === 'AF2L' && ['2a', '39'].includes(entry.id) || entry.category === 'F2L' && entry.id === '7')) {
    const { slots, start, goal, expand } = coordinates(entry);
    const algorithm = entry.featured![0], length = algorithm.split(' ').length, depth = Math.floor(length / 2);
    const walk = (state: string, depth: number) => {
      let frontier = new Map([[state, 0]]);
      for (let step = 0; step < depth; step++) {
        const next = new Map<string, number>();
        for (const [key, cost] of frontier) for (let move = 0; move < 15; move++) {
          const candidate = expand(key, move);
          const score = cost + quarterWeight * (move % 3 === 1 ? 2 : 1) + (move >= 6 ? 1 : 0);
          if (score < (next.get(candidate) ?? Infinity)) next.set(candidate, score);
        }
        frontier = next;
      }
      return frontier;
    };
    const cacheKey = `${slots}:${depth}`;
    let tail = backward.get(cacheKey);
    if (!tail) { tail = walk(goal, depth); backward.set(cacheKey, tail); }
    let best = Infinity;
    for (const [key, score] of walk(start, length - depth)) best = Math.min(best, score + (tail.get(key) ?? Infinity));
    const actual = algorithm.split(' ').reduce((score, move) =>
      score + quarterWeight * (move.includes('2') ? 2 : 1) + ('RU'.includes(move[0]) ? 0 : 1), 0);
    expect({ case: `${entry.category}-${entry.id}`, score: actual }).toEqual({ case: `${entry.category}-${entry.id}`, score: best });
  }
}, 120000);
