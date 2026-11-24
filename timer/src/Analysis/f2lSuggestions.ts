import type { KPattern, KTransformation } from 'cubing/kpuzzle';
import { algorithms } from '../../../src/database/algorithms';
import { crossRotation, inverse, locations, simplifyMoves, type Cube } from '../Core/puzzle';
import type { Solve } from '../Core/engine';
import { algorithmMatcher } from './algorithmMatching';
import { analyzeCFOP, cfopFrame } from './cfop';
import { normalized } from './cases';
export type PieceSelection = Partial<Record<'CORNERS' | 'EDGES' | 'CENTERS', number[]>>;
type Candidate = { moves: number; mixed: number; transformation: KTransformation };
export type PairSuggestion = { corner: number; edge: number; moves: number; trapped: number; mixed: number };
const pairEdges = [8, 9, 11, 10], slots = [4, 5, 6, 7];
const solved = (pattern: KPattern, orbit: string, piece: number) => pattern.patternData[orbit].pieces[piece] === piece && pattern.patternData[orbit].orientation[piece] === 0;
const pairKey = (pattern: KPattern, corner: number) => [corner, ...(['CORNERS', 'EDGES'] as const).flatMap((orbit, i) => {
  const data = pattern.patternData[orbit], position = data.pieces.indexOf(i ? pairEdges[corner - 4] : corner);
  return [position, data.orientation[position]];
})].join(',');
const catalogs = new WeakMap<Cube['puzzle'], Map<string, Candidate[]>>();
function catalog(cube: Cube) {
  let result = catalogs.get(cube.puzzle);
  if (result) return result;
  result = new Map(); catalogs.set(cube.puzzle, result);
  const seen = new Set<string>(), frames = ['', 'y', 'y2', "y'"].map(yaw => cfopFrame(cube, yaw));
  for (const entry of algorithms.filter(entry => entry.category.endsWith('F2L'))) for (const algorithm of entry.options) {
    const outer = simplifyMoves(algorithmMatcher(cube).outerMoves(algorithm).moves);
    for (const frame of frames) {
      const base = outer.map(frame), text = base.join(' ');
      if (seen.has(text)) continue; seen.add(text);
      const start = [...base].reverse().reduce((pattern, move) => cube.applyMove(pattern, inverse(move)), cube.solved());
      for (const auf of ['', 'U', 'U2', "U'"]) {
        const before = auf ? cube.applyMove(start, inverse(auf)) : start, moves = simplifyMoves([...(auf ? [auf] : []), ...base]);
        if (![4, 5, 6, 7].every(edge => solved(before, 'EDGES', edge))) continue;
        const transformation = before.experimentalToTransformation()!.invert();
        for (const corner of slots) {
          if (solved(before, 'CORNERS', corner) && solved(before, 'EDGES', pairEdges[corner - 4])) continue;
          const key = pairKey(before, corner), candidates = result.get(key) ?? [];
          candidates.push({ moves: moves.length, mixed: Number(moves.some(move => /^[RL]/.test(move)) && moves.some(move => /^[FB]/.test(move))), transformation });
          result.set(key, candidates);
        }
      }
    }
  }
  for (const candidates of result.values()) candidates.sort((a, b) => a.moves - b.moves || a.mixed - b.mixed);
  return result;
}
export const comparePairs = (a: PairSuggestion, b: PairSuggestion) => a.moves - b.moves || a.trapped - b.trapped || a.mixed - b.mixed;
export function suggestedPairs(cube: Cube, pattern: KPattern, cross: number): PairSuggestion[] {
  const aligned = normalized(cube, pattern, crossRotation(cross)), data = aligned.patternData;
  const complete = slots.filter(corner => solved(aligned, 'CORNERS', corner) && solved(aligned, 'EDGES', pairEdges[corner - 4]));
  if (complete.length === 4) return [];
  const lookup = catalog(cube);
  const frame = cube.solved().applyAlg(crossRotation(cross)).patternData;
  return slots.filter(corner => !complete.includes(corner)).flatMap(corner => {
    const edge = pairEdges[corner - 4], candidates = lookup.get(pairKey(aligned, corner)) ?? [];
    const best = candidates.find(candidate => {
      const after = aligned.applyTransformation(candidate.transformation);
      return solved(after, 'CORNERS', corner) && solved(after, 'EDGES', edge) &&
        complete.every(slot => solved(after, 'CORNERS', slot) && solved(after, 'EDGES', pairEdges[slot - 4]));
    });
    if (!best) return [];
    const cornerPosition = data['CORNERS'].pieces.indexOf(corner), edgePosition = data['EDGES'].pieces.indexOf(edge);
    return [{ corner: frame['CORNERS'].pieces[corner], edge: frame['EDGES'].pieces[edge], moves: best.moves,
      trapped: Number(cornerPosition >= 4 && cornerPosition !== corner) + Number(edgePosition >= 8 && edgePosition !== edge), mixed: best.mixed }];
  }).sort(comparePairs);
}
const suggestions = new WeakMap<Solve, { key: string; choices: { step: number; actual: number | null; ranked: PairSuggestion[] }[] }>();
export function solvePairChoices(solve: Solve, cube: Cube) {
  const { cross, ends, pairs } = analyzeCFOP(solve, cube), key = `${solve.crossOverride}:${ends.join(',')}:${solve.startFacelets}:${solve.moves.map(move => move.move).join(' ')}`;
  const cached = suggestions.get(solve);
  if (cached?.key === key) return cached.choices;
  const choices: { step: number; actual: number | null; ranked: PairSuggestion[] }[] = [];
  let pattern = cube.parse(solve.startFacelets), cursor = 0;
  if (cross !== null) for (let step = 1; step <= 4; step++) {
    const boundary = ends[step - 1];
    if (boundary === undefined) break;
    while (cursor < boundary) pattern = cube.applyMove(pattern, solve.moves[cursor++].move);
    choices.push({ step, actual: pairs[step - 1] ?? null, ranked: suggestedPairs(cube, pattern, cross) });
  }
  suggestions.set(solve, { key, choices }); return choices;
}
export function stepPieces(cross: number | null, step: number, corner?: number | null): PieceSelection {
  if (cross === null) return {};
  const hasFace = (indices: number[], face: number) => indices.some(index => Math.floor(index / 9) === face);
  if (step === 0) return { EDGES: locations.EDGES.flatMap((indices, i) => hasFace(indices, cross) ? [i] : []) };
  if (step < 5) return corner == null ? {} : { CORNERS: [corner], EDGES: locations.EDGES.flatMap((indices, i) => !hasFace(indices, cross) && indices.every(index => hasFace(locations.CORNERS[corner], Math.floor(index / 9))) ? [i] : []) };
  const top = [3, 4, 5, 0, 1, 2][cross];
  return Object.fromEntries((['CORNERS', 'EDGES'] as const).map(orbit => [orbit, locations[orbit].flatMap((indices, i) => hasFace(indices, top) ? [i] : [])]));
}
