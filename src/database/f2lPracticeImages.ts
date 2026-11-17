import type { Cube } from '../../timer/src/Core/puzzle';
import type { Solve } from '../../smartcubeanalyzer/src/Models/Types';
import { normalized, recognizeCase } from '../../timer/src/Analysis/cases';
import { locations } from '../../shared/cube/cubeLocations';
import { algorithms, casePattern, databaseCaseKeys } from './algorithms';

export type PracticeImage = { key?: string; facelets: string; visibleStickers: number[] };
const pairSolved = (pattern: ReturnType<Cube['solved']>) => ['CORNERS', 'EDGES'].every((orbit, i) => {
  const slot = i ? 8 : 4;
  return pattern.patternData[orbit].pieces[slot] === slot && pattern.patternData[orbit].orientation[slot] === 0;
});
export function f2lPracticeImages(cube: Cube, solve: Solve, caseName: string): PracticeImage[] {
  const index = solve.steps.findIndex(step => step.name.startsWith('F2L') && step.case === caseName);
  if (index < 0) return [];
  // Later F2L solutions reconstruct the pair state without depending on imported case numbering.
  const moves = solve.steps.slice(index).filter(step => step.name.startsWith('F2L')).map(step => step.moves);
  const before = casePattern(cube, moves.join(' ')), after = casePattern(cube, moves.slice(1).join(' '));
  const targets = ['', 'y', 'y2', "y'"].map(spin => ({ before: normalized(cube, before, spin), after: normalized(cube, after, spin) }))
    .filter(target => !pairSolved(target.before) && pairSolved(target.after));
  if (!targets.length) targets.push({ before, after });
  return targets.map(target => {
    const key = databaseCaseKeys('F2L', recognizeCase(1, cube, 3, target.before, target.after))[0];
    const visibleStickers = [4, 13, 22, 31, 40, 49];
    for (const orbit of ['EDGES', 'CORNERS'] as const) target.before.patternData[orbit].pieces.forEach((piece, position) => {
      if (orbit === 'EDGES' ? piece >= 4 && piece <= 8 : piece === 4) visibleStickers.push(...locations[orbit][position]);
    });
    return { key: algorithms.some(entry => `${entry.category}-${entry.id}` === key) ? key : undefined,
      facelets: cube.facelets(target.before), visibleStickers };
  });
}
