import { writeFileSync } from 'node:fs';
import { CORNERS, CORNER_MOVES, FACES, MOVES, ROTATIONS, applyMoves, inverseMoves, parseAlgorithm, rotateCube, solvedCube, stickers, type Cube as SearchCube } from '../scrambler/src/cube/cube';
import { PatternTables } from '../scrambler/src/cube/patterns';
import { loadCube } from '../timer/src/Core/puzzle';
import { algorithmMatcher } from '../timer/src/Analysis/algorithmMatching';
import { baseAlgorithms, type AlgorithmCase } from '../src/database/algorithms';
import caseImages from '../src/database/caseImages.json';
import previousOther from '../src/database/otherF2l.json';
import previousSolutions from '../src/database/f2lSolutions.json';

const pairEdges = [8, 9, 10, 11];
const targetKey = (state: SearchCube) => `${state.corners[4]}:${state.edges[8]}`;
const solvedSlots = (state: SearchCube) => [4, 5, 6, 7].reduce((mask, slot) => mask |
  (state.corners[slot] === slot * 3 && state.edges[pairEdges[slot - 4]] === pairEdges[slot - 4] * 2 ? 1 << (slot - 4) : 0), 0);
const caseKey = (state: SearchCube) => `${targetKey(state)}:${solvedSlots(state)}`;
function canonical(state: SearchCube): SearchCube {
  for (let turn = 0; turn < 4; turn++) {
    if (state.corners[4] < 12 ? Math.floor(state.corners[4] / 3) === 0 :
      state.edges[8] < 8 ? Math.floor(state.edges[8] / 2) === 1 : true) return state;
    state = applyMoves(state, [0]);
  }
  throw new Error('Cannot align F2L case.');
}
function complete(corner: number, edge: number): SearchCube {
  const state = { corners: new Uint8Array(8).fill(255), edges: new Uint8Array(12).fill(255) };
  state.corners[4] = corner; state.edges[8] = edge;
  for (let piece = 4; piece < 8; piece++) state.edges[piece] = piece * 2;
  // Only slots occupied by either target piece remain open; the target's home cannot be filled twice.
  for (let slot = 5; slot < 8; slot++) {
    if (Math.floor(corner / 3) !== slot && Math.floor(edge / 2) !== pairEdges[slot - 4]) {
      state.corners[slot] = slot * 3; state.edges[pairEdges[slot - 4]] = pairEdges[slot - 4] * 2;
    }
  }
  for (const [orbit, size] of [['corners', 3], ['edges', 2]] as const) {
    const data = state[orbit], occupied = new Set([...data].filter(value => value !== 255).map(value => Math.floor(value / size)));
    const positions = [...data.keys()].filter(position => !occupied.has(position));
    for (let piece = 0; piece < data.length; piece++) if (data[piece] === 255) data[piece] = positions.shift()! * size;
    const sum = [...data].reduce((sum, value) => sum + value % size, 0) % size;
    if (sum) data[0] += size - sum;
  }
  const parity = (data: Uint8Array, size: number) => [...data].reduce((sum, value, i) =>
    sum + [...data.slice(i + 1)].filter(other => Math.floor(other / size) < Math.floor(value / size)).length, 0) % 2;
  if (parity(state.edges, 2) !== parity(state.corners, 3)) [state.edges[0], state.edges[1]] = [state.edges[1], state.edges[0]];
  return state;
}

export async function generateOtherF2l() {
  const cube = await loadCube(), matcher = algorithmMatcher(cube), tables = new PatternTables();
  const rotationSignature = (algorithm: string) => 'rotation:' + ROTATIONS.map(rotation =>
    matcher.outerMoves(algorithm).moves.map(move => FACES[rotation.faces['URFDLB'.indexOf(move[0])]] + move.slice(1)).join(' ')).sort()[0];
  const rotations = ROTATIONS.filter(rotation => rotation.faces[3] === 3);
  const cases = new Map<string, SearchCube>();
  for (let corner = 0; corner < 24; corner++) for (const position of [0, 1, 2, 3, 8, 9, 10, 11]) for (let flip = 0; flip < 2; flip++) {
    const state = canonical(complete(corner, position * 2 + flip));
    if (state.corners[4] !== 12 || state.edges[8] !== 16) cases.set(targetKey(state), state);
  }
  const faceletsOf = (state: SearchCube) => {
    const facelets = Array<string>(54);
    stickers(state).forEach(({ face, row, col, color }) => { facelets[face * 9 + row * 3 + col] = FACES[color]; });
    return facelets.join('');
  };
  const stateOf = (entry: AlgorithmCase) => {
    const moves = parseAlgorithm(matcher.outerMoves(entry.setup ?? entry.algorithm).moves.join(' '));
    const state = applyMoves(solvedCube(), entry.setup ? moves : inverseMoves(moves));
    const image = caseImages[`${entry.category}-${entry.id}` as keyof typeof caseImages];
    if (image && faceletsOf(state) !== image.facelets)
      throw new Error(`Unexpected setup frame: ${entry.category}-${entry.id}`);
    return state;
  };
  const align = (state: SearchCube, target: number) => {
    const yaw = rotations.find(rotation => CORNERS[target].every(face => CORNERS[4].includes(rotation.faces[face])))!;
    const turned = rotateCube(state, yaw), aligned = canonical(turned);
    const auf = [0, 1, 2, 3].find(turns => targetKey(applyMoves(turned, Array<number>(turns).fill(0))) === targetKey(aligned))!;
    return { state: aligned, yaw, auf };
  };
  const existing = new Map<string, AlgorithmCase>();
  const traditional = baseAlgorithms.filter(entry => entry.category === 'F2L' || entry.category === 'AF2L');
  for (const entry of traditional) {
    const key = caseKey(align(stateOf(entry), entry.pair ?? 4).state);
    if (!existing.has(key)) existing.set(key, entry);
  }
  const solve = (state: SearchCube, target: number, restricted: boolean, excluded: Set<string>, rankShortest = false): string => {
    const required = [4, 5, 6, 7].filter(slot => slot === target ||
      state.corners[slot] === slot * 3 && state.edges[pairEdges[slot - 4]] === pairEdges[slot - 4] * 2);
    const patterns = required.flatMap(slot => {
      const rotation = rotations.find(rotation => {
        const colors = CORNERS[slot];
        return colors.every(face => [3, 2, 1].includes(rotation.faces[face]));
      })!;
      const aligned = rotateCube(state, rotation);
      return [tables.pairs.a, tables.pairs.b].map((pattern, i) => ({
        edge: tables.four.index((i ? [4, 5, 7, 8] : [4, 5, 6, 8]).map(piece => aligned.edges[piece])),
        corner: aligned.corners[4], distances: pattern.distances,
        moves: Uint8Array.from(MOVES, (_, move) => rotation.faces[Math.floor(move / 3)] * 3 + move % 3),
      }));
    });
    const width = patterns.length, path: number[] = [];
    const edges = new Uint32Array(41 * width), corners = new Uint8Array(41 * width);
    patterns.forEach((pattern, i) => { edges[i] = pattern.edge; corners[i] = pattern.corner; });
    const lower = Math.max(...patterns.map(pattern => pattern.distances[pattern.edge * 24 + pattern.corner]));
    // Admissible cross/pair pattern databases make iterative deepening exact, not a full-cube approximation.
    let best: string | null = null, bestQtm = Infinity, bestPoor = Infinity;
    const search = (level: number, remaining: number, lastFace: number, qtm = 0, poor = 0): string | null => {
      if (rankShortest && (qtm + remaining > bestQtm || qtm + remaining === bestQtm && poor >= bestPoor)) return null;
      if (!remaining) {
        const algorithm = path.slice(0, level).map(move => MOVES[move]).join(' ');
        if (excluded.has(matcher.signature(algorithm)) || excluded.has(rotationSignature(algorithm))) return null;
        if (!rankShortest) return algorithm;
        best = algorithm; bestQtm = qtm; bestPoor = poor;
        return null;
      }
      for (let move = 0; move < 15; move++) {
        const face = Math.floor(move / 3), cost = restricted && face !== 0 && face !== 1 ? 3 : 1;
        if (face === lastFace || lastFace >= 0 && (face + 3) % 6 === lastFace && face < lastFace) { move += 2; continue; }
        if (cost > remaining) continue;
        let valid = true;
        for (let i = 0; i < width; i++) {
          const pattern = patterns[i], mapped = pattern.moves[move];
          const edge = tables.four.moves[edges[level * width + i] * 18 + mapped];
          const corner = CORNER_MOVES[corners[level * width + i] * 18 + mapped];
          if (pattern.distances[edge * 24 + corner] > remaining - cost) { valid = false; break; }
          edges[(level + 1) * width + i] = edge; corners[(level + 1) * width + i] = corner;
        }
        if (valid) {
          path[level] = move;
          const found = search(level + 1, remaining - cost, face, qtm + (move % 3 === 1 ? 2 : 1), poor + (face > 1 ? 1 : 0));
          if (found) return found;
        }
      }
      return null;
    };
    for (let bound = lower; bound < 40; bound++) {
      const found = search(0, bound, -1);
      if (found || best) return found ?? best!;
    }
    throw new Error(`No solution for ${targetKey(state)}`);
  };
  const featuredFor = (state: SearchCube, target: number) => {
    const options: string[] = [], signatures = new Set<string>();
    for (const restricted of [false, true, false]) {
      const algorithm = solve(state, target, restricted, signatures, !options.length);
      options.push(algorithm); signatures.add(matcher.signature(algorithm)); signatures.add(rotationSignature(algorithm));
    }
    return options;
  };
  type Solutions = { featured: string[]; options: string[]; optimalLength: number };
  const solutions: Record<string, Solutions> = {};
  const aliases: Record<string, string> = { ...previousSolutions.aliases };
  const previous = previousSolutions.cases as Record<string, Solutions>;
  const appendUnique = (key: string, algorithm: string) => {
    const options = solutions[key].options, signature = matcher.signature(algorithm), rotation = rotationSignature(algorithm);
    const equivalent = options.find(option => matcher.signature(option) === signature || rotationSignature(option) === rotation);
    if (!equivalent) options.push(algorithm);
    if (equivalent && equivalent !== algorithm) aliases[`${key}:${algorithm}`] = `${key}:${equivalent}`;
    else delete aliases[`${key}:${algorithm}`];
    return equivalent ?? algorithm;
  };
  for (const entry of traditional) {
    const key = `${entry.category}-${entry.id}`, featured = featuredFor(stateOf(entry), entry.pair ?? 4);
    solutions[key] = { featured, options: [...featured], optimalLength: featured[0].split(' ').length };
    for (const algorithm of [...entry.options, ...(previous[key]?.options ?? [])]) appendUnique(key, algorithm);
    aliases[key] = aliases[`${key}:${entry.algorithm}`] ?? `${key}:${entry.algorithm}`;
    console.log(`${key}: ${featured.map(option => option.split(' ').length).join('/')} moves; ${solutions[key].options.length} unique algorithms`);
  }
  const known = new Map(previousOther.cases.map(entry => [
    caseKey(align(stateOf({ ...entry, category: 'OF2L' }), entry.pair).state), entry,
  ]));
  for (const entry of previousOther.cases) {
    const matched = existing.get(caseKey(align(stateOf({ ...entry, category: 'OF2L' }), entry.pair).state));
    if (!matched) continue;
    const key = `${matched.category}-${matched.id}`, { yaw, auf } = align(stateOf(matched), matched.pair ?? 4);
    for (const algorithm of entry.options) {
      const converted = [...Array<string>(auf).fill('U'), ...matcher.outerMoves(algorithm).moves]
        .map(move => FACES[yaw.inverse['URFDLB'.indexOf(move[0])]] + move.slice(1)).join(' ');
      const chosen = appendUnique(key, converted);
      aliases[`OF2L-${entry.id}:${algorithm}`] = `${key}:${chosen}`;
    }
    aliases[`OF2L-${entry.id}`] = aliases[`OF2L-${entry.id}:${entry.algorithm}`];
  }
  const generated: typeof previousOther.cases = [];
  const reserved = new Set(previousOther.cases.map(entry => entry.id));
  let next = 1;
  for (const state of cases.values()) {
    const key = caseKey(state);
    if (existing.has(key)) continue;
    const saved = known.get(key);
    const options = featuredFor(state, 4);
    if (saved) {
      const name = `OF2L-${saved.id}`;
      solutions[name] = { featured: options, options: [...options], optimalLength: options[0].split(' ').length };
      for (const algorithm of [...saved.options, ...(previous[name]?.options ?? [])]) appendUnique(name, algorithm);
      aliases[name] ??= aliases[`${name}:${saved.algorithm}`] ?? `${name}:${saved.algorithm}`;
      generated.push({ ...saved, algorithm: options[0], options: solutions[name].options, optimalLength: solutions[name].optimalLength });
      continue;
    }
    const facelets = faceletsOf(state);
    cube.parse(facelets);
    const setup = (await cube.solution(facelets)).reverse().map(move => move.includes('2') ? move : move.endsWith("'") ? move[0] : move + "'").join(' ');
    while (reserved.has(String(next))) next++;
    const id = String(next++);
    generated.push({ id, algorithm: options[0], options, setup, pair: 4, optimalLength: options[0].split(' ').length });
    console.log(`${generated.length}/${cases.size} OF2L-${id}: ${options.map(option => option.split(' ').length).join('/')}`);
  }
  const orientation = (entry: typeof generated[number]) => {
    const { EDGES } = cube.parse(faceletsOf(stateOf({ ...entry, category: 'OF2L' }))).patternData;
    return EDGES.orientation[EDGES.pieces.indexOf(8)];
  };
  generated.sort((a, b) => orientation(a) - orientation(b) || Number(a.id) - Number(b.id));
  const keys = new Map(generated.map((entry, index) => [`OF2L-${entry.id}`, `OF2L-${index + 1}`]));
  const rename = (value: string) => {
    const key = value.match(/^OF2L-\d+(?=:|$)/)?.[0];
    return key ? keys.has(key) ? keys.get(key)! + value.slice(key.length) : undefined : value;
  };
  const numberedAliases: Record<string, string> = {};
  for (const id of Object.keys(aliases)) {
    let target = aliases[id];
    while (aliases[target] && aliases[target] !== target) target = aliases[target];
    const source = rename(id), renamed = rename(target);
    if (source && renamed && source !== renamed) numberedAliases[source] = renamed;
  }
  const numberedSolutions = Object.fromEntries(Object.entries(solutions).filter(([key]) => !key.startsWith('OF2L-')));
  generated.forEach((entry, index) => {
    entry.id = String(index + 1);
    const key = `OF2L-${entry.id}`;
    numberedSolutions[key] = { featured: entry.options.slice(0, 3), options: entry.options, optimalLength: entry.optimalLength };
    numberedAliases[key] ??= `${key}:${entry.algorithm}`;
  });
  writeFileSync(new URL('../src/database/f2lSolutions.json', import.meta.url), JSON.stringify({ cases: numberedSolutions, aliases: numberedAliases }, null, 2) + '\n');
  writeFileSync(new URL('../src/database/otherF2l.json', import.meta.url), JSON.stringify({ metric: 'HTM, no B turns', ergonomicCosts: { R: 1, U: 1, L: 3, D: 3, F: 3 }, cases: generated }, null, 2) + '\n');
  console.log(`Saved featured solutions for ${traditional.length} F2L/AF2L cases; ${generated.length} Other F2L cases remain.`);
}
