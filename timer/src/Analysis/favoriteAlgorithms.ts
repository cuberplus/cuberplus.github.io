import { casePattern, type AlgorithmCase } from '../../../src/database/algorithms';
import caseImages from '../../../src/database/caseImages.json';
import { getAlgorithms, readCustomAlgorithms, saveCustomAlgorithms } from '../../../src/database/customAlgorithms';
import { favoriteId, type FavoriteCategories } from '../../../src/database/favorites';
import type { KPattern } from 'cubing/kpuzzle';
import { algorithmMatcher } from './algorithmMatching';
import { normalized, recognizeCase } from './cases';
import { analyzeCFOP, cfopFrame } from './cfop';
import type { Solve } from '../Core/engine';
import { crossRotation, simplifyMoves, type Cube } from '../Core/puzzle';
import type { Step } from '../../../smartcubeanalyzer/src/Models/Types';

export interface AlgorithmUse { step: number; caseKey: string; caseKeys: string[]; signature: string; matches: string[]; algorithm: string }
export function algorithmTimeCost(use: AlgorithmUse, step: Step | undefined, cube: Cube, alternatives: string[]): number {
  if (!step?.turns || !alternatives.length) return 0;
  const matcher = algorithmMatcher(cube), turns = (algorithm: string) => matcher.outerMoves(algorithm).moves.length;
  const saved = Math.max(0, turns(use.algorithm) - Math.min(...alternatives.map(turns)));
  return Math.min(step.executionTime, saved * step.executionTime / step.turns);
}
const observations = new WeakMap<Cube, WeakMap<Solve, { catalog: AlgorithmCase[]; uses: AlgorithmUse[] }>>();
export function usedAlgorithms(solve: Solve, cube: Cube): AlgorithmUse[] {
  if (solve.status !== 'complete' || !solve.moves.length) return [];
  let cache = observations.get(cube);
  if (!cache) observations.set(cube, cache = new WeakMap());
  const algorithms = getAlgorithms(), cached = cache.get(solve);
  if (cached?.catalog === algorithms) return cached.uses;
  const { cross, ends } = analyzeCFOP(solve, cube), matcher = algorithmMatcher(cube);
  if (cross === null) return [];
  const result: AlgorithmUse[] = [], frame = cfopFrame(cube, cross);
  const states = [cube.parse(solve.startFacelets)];
  for (const { move } of solve.moves) states.push(states.at(-1)!.applyMove(move));
  let cursor = ends[0] ?? 0;
  for (let step = 1; step < ends.length; step++) {
    const from = cursor, to = ends[step];
    if (to > from) {
      if (step < 5) {
        const candidates = advancedCases(cube, normalized(cube, states[from], crossRotation(cross)));
        const possible = candidates.flatMap(({ entry, yaw }) => {
          const uses = [];
          const start = normalized(cube, states[from], `${crossRotation(cross)} ${yaw}`);
          for (let endIndex = from + 1; endIndex <= ends[4]; endIndex++) {
            const end = normalized(cube, states[endIndex], `${crossRotation(cross)} ${yaw}`);
            if (!pairSolved(end, entry.pair!)) continue;
            if ([4, 5, 6, 7].some(i => !solved(end, 'EDGES', i))) continue;
            if ([4, 5, 6, 7].some(i => pairSolved(start, i) && !pairSolved(end, i))) continue;
            const algorithm = solve.moves.slice(from, endIndex).map(item => frame(item.move)).join(' ');
            const signature = matcher.signature(algorithm);
            const matches = entry.options.filter(algorithm => matcher.signature(algorithm) === signature)
              .map(algorithm => favoriteId(entry, algorithm));
            uses.push({ endIndex, caseKey: `${entry.category}-${entry.id}`, signature, matches, algorithm });
          }
          return uses;
        });
        const selected = possible.find(use => use.matches.length) ?? possible[0];
        if (selected) {
          const aliases = possible.filter(use => use.endIndex === selected.endIndex);
          result.push({ step, caseKey: selected.caseKey, signature: selected.signature, algorithm: selected.algorithm,
            caseKeys: [...new Set(aliases.map(use => use.caseKey))], matches: [...new Set(aliases.flatMap(use => use.matches))] });
          cursor = selected.endIndex;
          if (cursor < to) step--;
          continue;
        }
      }
      const recognized = recognizeCase(step, cube, cross, states[from], states[to]);
      const caseKey = recognized && recognized !== 'Solved' ? `${step < 5 ? 'F2L' : step === 5 ? 'OLL' : 'PLL'}-${recognized}` : '';
      if (caseKey) {
        const algorithm = solve.moves.slice(from, to).map(item => frame(item.move)).join(' '), signature = matcher.signature(algorithm);
        const entry = algorithms.find(entry => `${entry.category}-${entry.id}` === caseKey);
        const matches = entry?.options.filter(algorithm => matcher.signature(algorithm) === signature)
          .map(algorithm => favoriteId(entry, algorithm)) ?? [];
        result.push({ step, caseKey, caseKeys: [caseKey], signature, matches, algorithm });
      }
      cursor = to;
    }
  }
  cache.set(solve, { catalog: algorithms, uses: result });
  return result;
}
const solved = (pattern: KPattern, orbit: string, index: number) =>
  pattern.patternData[orbit].pieces[index] === index && !pattern.patternData[orbit].orientation[index];
const pairSolved = (pattern: KPattern, corner: number) =>
  solved(pattern, 'CORNERS', corner) && solved(pattern, 'EDGES', [8, 9, 11, 10][corner - 4]);
function advancedCases(cube: Cube, before: KPattern) {
  const images = getAlgorithms().filter(entry => entry.pair !== undefined).map(entry => ({
    ...entry, ...caseImages[`${entry.category}-${entry.id}` as keyof typeof caseImages],
  }));
  const candidates: { entry: typeof images[number]; yaw: string }[] = [];
  for (const yaw of ['', 'y', 'y2', "y'"]) {
    const oriented = normalized(cube, before, yaw);
    for (const auf of ['', 'U', 'U2', "U'"]) {
      const start = cube.facelets(oriented.applyAlg(auf));
      for (const entry of images) if (entry.visibleStickers.every(index => start[index] === entry.facelets[index]) &&
        !candidates.some(candidate => candidate.entry === entry && candidate.yaw === yaw)) candidates.push({ entry, yaw });
    }
  }
  return candidates;
}
export function nonFavoriteAlgorithms(solve: Solve, cube: Cube, favorites: Set<string>,
  categories: FavoriteCategories = { F2L: true, OLL: true, PLL: true }): AlgorithmUse[] {
  if (!favorites.size || !Object.values(categories).some(Boolean)) return [];
  const matcher = algorithmMatcher(cube);
  return usedAlgorithms(solve, cube).filter(use => {
    if (!categories[use.step < 5 ? 'F2L' : use.caseKey.split('-')[0] as keyof FavoriteCategories]) return false;
    const selected = [...favorites].filter(id => use.caseKeys.some(key => id.startsWith(`${key}:`)));
    return selected.length > 0 && !selected.some(id => matcher.signature(id.slice(id.indexOf(':') + 1)) === use.signature);
  });
}
export async function discoverFavorites(history: Solve[], cube: Cube, favorites: Set<string>): Promise<Set<string>> {
  const found = new Set(favorites);
  const recent = history.filter(solve => solve.status === 'complete')
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 2000);
  for (let i = 0; i < recent.length; i++) {
    usedAlgorithms(recent[i], cube).forEach(use => use.matches.forEach(id => found.add(id)));
    if (i % 20 === 0) await new Promise(resolve => setTimeout(resolve, 0));
  }
  return found;
}

export function unlearnAlgorithms(solve: Solve, cube: Cube, unlearn: Set<string>): AlgorithmUse[] {
  if (!unlearn.size) return [];
  const matcher = algorithmMatcher(cube);
  return usedAlgorithms(solve, cube).filter(use => [...unlearn].some(id =>
    use.caseKeys.some(key => id.startsWith(`${key}:`)) && matcher.signature(id.slice(id.indexOf(':') + 1)) === use.signature));
}

export function comfortableAlgorithm(algorithm: string, cube: Cube): string {
  const variants = ['', 'y', 'y2', "y'"].map(yaw =>
    simplifyMoves(algorithm.split(/\s+/).filter(Boolean).map(cfopFrame(cube, yaw))));
  const cost = (moves: string[]) => moves.reduce((sum, move) => sum + (move[0].toUpperCase() === 'B' ? moves.length + 1 :
    'UR'.includes(move[0].toUpperCase()) ? 0 : 1), 0);
  return variants.sort((a, b) => cost(a) - cost(b) || a.length - b.length || a.join(' ').localeCompare(b.join(' ')))[0].join(' ');
}

export async function learnAlgorithms(history: Solve[], cube: Cube): Promise<Set<string>> {
  const matcher = algorithmMatcher(cube), counts = new Map<string, { count: number; use: AlgorithmUse }>();
  const solves = [...new Map(history.filter(solve => solve.status === 'complete').map(solve => [solve.id, solve])).values()];
  for (let i = 0; i < solves.length; i++) {
    const seen = new Set<string>();
    for (const use of usedAlgorithms(solves[i], cube)) {
      if (use.step < 5 || use.matches.length || !use.signature) continue;
      const key = `${use.caseKey}:${use.signature}`;
      if (seen.has(key)) continue;
      seen.add(key);
      const previous = counts.get(key);
      counts.set(key, { count: (previous?.count ?? 0) + 1, use });
    }
    if (i % 20 === 0) await new Promise(resolve => setTimeout(resolve, 0));
  }
  const custom = readCustomAlgorithms(), found = new Set<string>();
  for (const { count, use } of counts.values()) {
    if (count < 5) continue;
    const entry = getAlgorithms().find(entry => `${entry.category}-${entry.id}` === use.caseKey)!;
    if (entry.options.some(algorithm => matcher.signature(algorithm) === use.signature)) continue;
    const algorithm = comfortableAlgorithm(use.algorithm, cube);
    custom[use.caseKey] = [...new Set([...(custom[use.caseKey] ?? []), algorithm])];
    found.add(favoriteId(entry, algorithm));
  }
  if (found.size) saveCustomAlgorithms(custom);
  return found;
}

export function validateUserAlgorithm(entry: AlgorithmCase, algorithm: string, cube: Cube): string {
  const matcher = algorithmMatcher(cube);
  const canonical = algorithm.trim().replace(/\s+/g, ' ');
  if (!canonical || canonical.length > 1000) throw new Error('Enter an algorithm of at most 1,000 characters.');
  if (entry.pair !== undefined) {
    const image = caseImages[`${entry.category}-${entry.id}` as keyof typeof caseImages];
    const before = cube.parse(image.facelets), after = before.applyAlg(matcher.outerMoves(canonical).moves.join(' '));
    if (!pairSolved(after, entry.pair) || [4, 5, 6, 7].some(i =>
      !solved(after, 'EDGES', i) || pairSolved(before, i) && !pairSolved(after, i))) {
      throw new Error(`This algorithm does not solve the selected ${entry.category === 'AF2L' ? 'Advanced' : 'Other'} F2L case.`);
    }
  } else {
    const before = casePattern(cube, canonical), { EDGES, CORNERS } = before.patternData;
    const solved = (data: typeof EDGES, index: number) => data.pieces[index] === index && !data.orientation[index];
    const intact = [4, 5, 6, 7].every(i => solved(EDGES, i)) && (entry.category === 'F2L' ||
      [4, 5, 6, 7].every(i => solved(CORNERS, i) && solved(EDGES, i + 4))) &&
      (entry.category !== 'PLL' || [...EDGES.orientation, ...CORNERS.orientation].every(value => !value));
    if (!intact || recognizeCase(entry.category === 'OLL' ? 5 : entry.category === 'PLL' ? 6 : 1,
      cube, 3, before, cube.solved()) !== entry.id) throw new Error('This algorithm does not match the selected case.');
  }
  return canonical;
}
