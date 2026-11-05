import { algorithms, illustrateCases } from '../../src/database/algorithms';
import { favoriteId, type FavoriteCategories } from '../../src/database/favorites';
import type { KPattern } from 'cubing/kpuzzle';
import { algorithmMatcher } from './algorithmMatching';
import { normalized, recognizeCase } from './cases';
import { analyzeCFOP, cfopFrame } from './cfop';
import type { Solve } from './engine';
import { crossRotation, type Cube } from './puzzle';

export interface AlgorithmUse { step: number; caseKey: string; caseKeys: string[]; signature: string; matches: string[] }
const observations = new WeakMap<Cube, WeakMap<Solve, AlgorithmUse[]>>();
const advancedImages = new WeakMap<Cube, ReturnType<typeof illustrateCases>>();
export function usedAlgorithms(solve: Solve, cube: Cube): AlgorithmUse[] {
  if (solve.status !== 'complete') return [];
  let cache = observations.get(cube);
  if (!cache) observations.set(cube, cache = new WeakMap());
  const cached = cache.get(solve);
  if (cached) return cached;
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
            const corner = entry.pair!, edge = [8, 9, 11, 10][corner - 4];
            if (end.patternData.CORNERS.pieces[corner] !== corner || end.patternData.CORNERS.orientation[corner] ||
              end.patternData.EDGES.pieces[edge] !== edge || end.patternData.EDGES.orientation[edge]) continue;
            const solved = (pattern: KPattern, orbit: string, index: number) =>
              pattern.patternData[orbit].pieces[index] === index && !pattern.patternData[orbit].orientation[index];
            if ([4, 5, 6, 7].some(i => !solved(end, 'EDGES', i))) continue;
            if ([4, 5, 6, 7].some(i => {
              const edge = [8, 9, 11, 10][i - 4];
              return solved(start, 'CORNERS', i) && solved(start, 'EDGES', edge) &&
                (!solved(end, 'CORNERS', i) || !solved(end, 'EDGES', edge));
            })) continue;
            const signature = matcher.signature(solve.moves.slice(from, endIndex).map(item => frame(item.move)).join(' '));
            const matches = entry.options.filter(algorithm => matcher.signature(algorithm) === signature)
              .map(algorithm => favoriteId(entry, algorithm));
            uses.push({ endIndex, caseKey: `AF2L-${entry.id}`, signature, matches });
          }
          return uses;
        });
        const selected = possible.find(use => use.matches.length) ?? possible[0];
        if (selected) {
          const aliases = possible.filter(use => use.endIndex === selected.endIndex);
          result.push({ step, caseKey: selected.caseKey, signature: selected.signature,
            caseKeys: [...new Set(aliases.map(use => use.caseKey))], matches: [...new Set(aliases.flatMap(use => use.matches))] });
          cursor = selected.endIndex;
          if (cursor < to) step--;
          continue;
        }
      }
      const recognized = recognizeCase(step, cube, cross, states[from], states[to]);
      const caseKey = recognized && recognized !== 'Solved' ? `${step < 5 ? 'F2L' : step === 5 ? 'OLL' : 'PLL'}-${recognized}` : '';
      if (caseKey) {
        const signature = matcher.signature(solve.moves.slice(from, to).map(item => frame(item.move)).join(' '));
        const entry = algorithms.find(entry => `${entry.category}-${entry.id}` === caseKey);
        const matches = entry?.options.filter(algorithm => matcher.signature(algorithm) === signature)
          .map(algorithm => favoriteId(entry, algorithm)) ?? [];
        result.push({ step, caseKey, caseKeys: [caseKey], signature, matches });
      }
      cursor = to;
    }
  }
  cache.set(solve, result);
  return result;
}
function advancedCases(cube: Cube, before: KPattern) {
  let images = advancedImages.get(cube);
  if (!images) {
    images = illustrateCases(cube).filter(entry => entry.category === 'AF2L');
    advancedImages.set(cube, images);
  }
  const candidates: { entry: typeof images[number]; yaw: string }[] = [];
  for (const yaw of ['', 'y', 'y2', "y'"]) {
    for (const auf of ['', 'U', 'U2', "U'"]) {
      const start = cube.facelets(normalized(cube, before, yaw).applyAlg(auf));
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
    if (!categories[use.caseKey.startsWith('AF2L-') ? 'F2L' : use.caseKey.split('-')[0] as keyof FavoriteCategories]) return false;
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
