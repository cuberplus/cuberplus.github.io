import { applyMoves, COLORS, CORNERS, CORNER_MOVES, EDGES, EDGE_MOVES, FACES, parseAlgorithm, solvedCube } from '../scrambler/src/cube/cube';

export const pairColors = (faces: readonly number[], colors: readonly string[] = COLORS): string =>
  faces.map(face => colors[face]).sort((a, b) => COLORS.indexOf(a as typeof COLORS[number]) - COLORS.indexOf(b as typeof COLORS[number])).join('/');
export const pairEmojis = (pair: string): string => pair.split('/').map(color =>
  ['\u2b1c', '\ud83d\udfe5', '\ud83d\udfe9', '\ud83d\udfe8', '\ud83d\udfe7', '\ud83d\udfe6'][COLORS.indexOf(color as typeof COLORS[number])] ?? '').join('');
const rotations: Record<string, string> = { x: 'FRDBLU', y: 'UBRDFL', z: 'LUFRDB' };
const layers = FACES.map((_, cross) => ({
  crossEdges: EDGES.flatMap((faces, i) => faces.includes(cross) ? [i] : []),
  slots: CORNERS.flatMap((faces, i) => faces.includes(cross) ? [{ corner: i,
    edge: EDGES.findIndex(edge => !edge.includes(cross) && edge.every(face => faces.includes(face))) }] : []),
}));

// Eliminate viewing rotations so imported recordings can be checked in their calibrated frame.
export function firstF2LPair(scramble: string, solution: string, cross: number, colors: readonly string[] = COLORS): string | undefined {
  if (cross < 0 || !scramble.trim() || !solution.trim()) return;
  try {
    const cube = applyMoves(solvedCube(), parseAlgorithm(scramble)), { crossEdges, slots } = layers[cross];
    const moves = solution.matchAll(/\S+/g);
    let frame: readonly number[] = [0, 1, 2, 3, 4, 5];
    for (let next = moves.next(); ; next = moves.next()) {
      if (crossEdges.every(edge => cube.edges[edge] === edge * 2)) {
        const done = slots.filter(({ corner, edge }) => cube.corners[corner] === corner * 3 && cube.edges[edge] === edge * 2);
        if (done.length) return done.length === 1 ? pairColors(EDGES[done[0].edge], colors) : undefined;
      }
      if (next.done) break;
      const token = next.value[0].replace(/\[[^\]]*\]$/, '');
      if (!/^[URFDLBxyz](?:[23]'?|')?$/.test(token)) return;
      const turns = ((Number(token[1]) || 1) * (token.endsWith("'") ? -1 : 1) + 4) % 4;
      if (rotations[token[0]]) {
        for (let i = 0; i < turns; i++) frame = [...rotations[token[0]]].map(face => frame[FACES.indexOf(face as typeof FACES[number])]);
      } else {
        const move = frame[FACES.indexOf(token[0] as typeof FACES[number])] * 3 + turns - 1;
        for (let i = 0; i < 12; i++) cube.edges[i] = EDGE_MOVES[cube.edges[i] * 18 + move];
        for (let i = 0; i < 8; i++) cube.corners[i] = CORNER_MOVES[cube.corners[i] * 18 + move];
      }
    }
  } catch { /* Missing or non-fixed-frame recordings have no reliable pair identity. */ }
}
