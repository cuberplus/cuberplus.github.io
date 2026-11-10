import { rankedMistakes, type Mistake } from '../../../smartcubeanalyzer/src/Analysis/MistakeAnalysis';
import { StepName, type Solve } from '../../../smartcubeanalyzer/src/Models/Types';

const kindStep: Partial<Record<Mistake['kind'], StepName>> = {
  crossMoves: StepName.Cross, f2lMoves: StepName.F2L, f2lPause: StepName.F2L,
  ollMoves: StepName.OLL, ollRecognition: StepName.OLL, pllMoves: StepName.PLL, pllRecognition: StepName.PLL,
};
export function potentialGain(solve: Solve, algorithms: { step: StepName; seconds: number }[] = []): number {
  const costs = new Map<string, number>();
  const add = (step: string, seconds: number) => costs.set(step, Math.max(costs.get(step) ?? 0, seconds));
  for (const mistake of rankedMistakes(solve)) {
    if (mistake.kind === 'slowSolve') continue;
    const steps = Object.entries(mistake.stepCosts ?? {});
    if (steps.length) steps.forEach(([step, seconds]) => add(step, seconds));
    else add(mistake.step ?? kindStep[mistake.kind] ?? 'Other', mistake.estimatedSeconds ?? 0);
  }
  algorithms.forEach(({ step, seconds }) => add(step, seconds));
  const pairs = [StepName.F2L_1, StepName.F2L_2, StepName.F2L_3, StepName.F2L_4];
  const f2l = Math.max(costs.get(StepName.F2L) ?? 0, pairs.reduce((sum, step) => sum + (costs.get(step) ?? 0), 0));
  return Math.min(solve.time, f2l + [...costs].filter(([step]) => step !== StepName.F2L && !pairs.includes(step as StepName)).reduce((sum, [, seconds]) => sum + seconds, 0));
}
