import { COLORS, CORNERS, CORNER_MOVES, EDGES, EDGE_MOVES, FACES, parseAlgorithm } from '../../scrambler/src/cube/cube';

export const pairColors = (faces: readonly number[], colors: readonly string[] = COLORS): string =>
  faces.map(face => colors[face]).sort((a, b) => COLORS.indexOf(a as typeof COLORS[number]) - COLORS.indexOf(b as typeof COLORS[number])).join('/');
export const pairEmojis = (pair: string): string => pair.split('/').map(color =>
  ['\u2b1c', '\ud83d\udfe5', '\ud83d\udfe9', '\ud83d\udfe8', '\ud83d\udfe7', '\ud83d\udfe6'][COLORS.indexOf(color as typeof COLORS[number])] ?? '').join('');
const rotations: Record<string, string> = { x: 'FRDBLU', y: 'UBRDFL', z: 'LUFRDB' };
const solutionTokens = new Map<string, { face: string; turns: number }>();
const firstPairs = new Map<string, string | undefined>();
const layers = FACES.map((_, cross) => {
  const corners = CORNERS.flatMap((faces, i) => faces.includes(cross) ? [i] : []);
  const edges = [...EDGES.flatMap((faces, i) => faces.includes(cross) ? [i] : []), ...corners.map(corner =>
    EDGES.findIndex(edge => !edge.includes(cross) && edge.every(face => CORNERS[corner].includes(face))))];
  return { edges: edges.map(edge => edge * 2), corners: corners.map(corner => corner * 3) };
});

// Eliminate viewing rotations so imported recordings can be checked in their calibrated frame.
export function firstF2LPair(scramble: string, solution: string, cross: number, colors: readonly string[] = COLORS): string | undefined {
  const key = JSON.stringify([scramble, solution, cross, colors]);
  if (firstPairs.has(key)) return firstPairs.get(key);
  const pair = findFirstF2LPair(scramble, solution, cross, colors);
  if (firstPairs.size >= 256) firstPairs.delete(firstPairs.keys().next().value!);
  firstPairs.set(key, pair);
  return pair;
}
function findFirstF2LPair(scramble: string, solution: string, cross: number, colors: readonly string[]): string | undefined {
  if (cross < 0 || !scramble.trim() || !solution.trim()) return;
  try {
    const home = layers[cross], edges = Uint8Array.from(home.edges), corners = Uint8Array.from(home.corners);
    // Only the cross and its four pairs can determine the first solved slot.
    const apply = (move: number) => {
      for (let i = 0; i < edges.length; i++) edges[i] = EDGE_MOVES[edges[i] * 18 + move];
      for (let i = 0; i < corners.length; i++) corners[i] = CORNER_MOVES[corners[i] * 18 + move];
    };
    for (const move of parseAlgorithm(scramble)) apply(move);
    const moves = solution.matchAll(/\S+/g);
    let frame: readonly number[] = [0, 1, 2, 3, 4, 5];
    for (let next = moves.next(); ; next = moves.next()) {
      if (edges[0] === home.edges[0] && edges[1] === home.edges[1] && edges[2] === home.edges[2] && edges[3] === home.edges[3]) {
        let done = -1;
        for (let i = 0; i < 4; i++) if (corners[i] === home.corners[i] && edges[i + 4] === home.edges[i + 4]) {
          if (done >= 0) return;
          done = i;
        }
        if (done >= 0) return pairColors(EDGES[home.edges[done + 4] / 2], colors);
      }
      if (next.done) break;
      const token = next.value[0].replace(/\[[^\]]*\]$/, '');
      let parsed = solutionTokens.get(token);
      if (!parsed) {
        if (!/^[URFDLBxyz](?:[23]'?|')?$/.test(token)) return;
        const turns = ((Number(token[1]) || 1) * (token.endsWith("'") ? -1 : 1) + 4) % 4;
        solutionTokens.set(token, parsed = { face: token[0], turns });
      }
      const { face, turns } = parsed;
      if (rotations[face]) {
        for (let i = 0; i < turns; i++) frame = [...rotations[face]].map(face => frame[FACES.indexOf(face as typeof FACES[number])]);
      } else {
        apply(frame[FACES.indexOf(face as typeof FACES[number])] * 3 + turns - 1);
      }
    }
  } catch { /* Missing or non-fixed-frame recordings have no reliable pair identity. */ }
}
