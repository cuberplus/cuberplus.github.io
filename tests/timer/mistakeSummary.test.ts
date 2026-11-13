import { expect, test } from '@jest/globals';
import { mistakeTrainingKey, potentialGain } from '../../timer/src/Analysis/mistakeSummary';
import { StepName } from '../../smartcubeanalyzer/src/Models/Types';
import { makeSolve, makeStep } from '../analyzer/testUtils';

test('gain excludes slow solve and counts only the worst overlapping mistake per step', () => {
  const solve = makeSolve({ time: 25, mistakes: [
    { kind: 'slowSolve', estimatedSeconds: 20 },
    { kind: 'crossMoves', estimatedSeconds: 3, stepCosts: { [StepName.Cross]: 3 } },
    { kind: 'sequenceUndo', step: StepName.Cross, estimatedSeconds: 2 },
    { kind: 'f2lPause', estimatedSeconds: 7, stepCosts: { [StepName.F2L_1]: 3, [StepName.F2L_2]: 4 } },
    { kind: 'f2lMoves', estimatedSeconds: 5, stepCosts: { [StepName.F2L_1]: 5 } },
    { kind: 'slowStep', step: StepName.F2L, estimatedSeconds: 6, stepCosts: { [StepName.F2L_2]: 6 } },
    { kind: 'ollRecognition', estimatedSeconds: 2, stepCosts: { [StepName.OLL]: 2 } },
  ] });
  expect(potentialGain(solve, [{ step: StepName.OLL, seconds: 4 }])).toBe(18);
  expect(solve.mistakes).toHaveLength(7);
});
test('mistakes link to the affected case, using the worst F2L slot and observed advanced-case identities', () => {
  const solve = makeSolve({ steps: [
    makeStep(StepName.F2L_1, 4, { case: '1' }),
    makeStep(StepName.F2L_2, 6, { case: '7' }),
    makeStep(StepName.OLL, 3, { case: '27' }),
    makeStep(StepName.PLL, 3, { case: 'T' }),
  ] });
  expect(mistakeTrainingKey(solve, { kind: 'f2lPause', stepCosts: { [StepName.F2L_1]: 1, [StepName.F2L_2]: 4 } })).toBe('F2L-7');
  expect(mistakeTrainingKey(solve, { kind: 'ollRecognition' })).toBe('OLL-27');
  expect(mistakeTrainingKey(solve, { kind: 'slowStep', step: StepName.PLL })).toBe('PLL-T');
  expect(mistakeTrainingKey(solve, { kind: 'crossMoves' })).toBeNull();
  expect(mistakeTrainingKey(solve, { kind: 'slowSolve', stepCosts: { [StepName.OLL]: 3 } })).toBeNull();
  expect(mistakeTrainingKey(makeSolve(), { kind: 'ollRecognition' })).toBeNull();
  expect(mistakeTrainingKey(solve, { kind: 'f2lPause', step: StepName.F2L_1 },
    [{ step: StepName.F2L_1, caseKey: 'OF2L-1' }])).toBe('OF2L-1');
});
test('gain handles old analysis without per-step costs and cannot exceed solve time', () => {
  expect(potentialGain(makeSolve({ time: 2, mistakes: [
    { kind: 'crossMoves', estimatedSeconds: 3 }, { kind: 'singleUndo', step: StepName.Cross, estimatedSeconds: 2 },
  ] }))).toBe(2);
  expect(potentialGain(makeSolve({ mistakes: [{ kind: 'slowSolve', estimatedSeconds: 8 }] }))).toBe(0);
});
