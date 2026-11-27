import { readOption } from './display';
import { TOOLTIPS } from './tooltips';
const CASE_MOVES_RULE = TOOLTIPS.mistakes.caseMoves;
const EXTRA_LOOK_RULE = 'Inter-move gap above average + 2 standard deviations (5+ prior step/method samples; selected window). Loss: excess above average. Excludes initial recognition, first three turns, last-layer setup and final AUF.';
export const MISTAKES = {
  crossMoves: { label: 'Cross: Inefficient solution', rule: TOOLTIPS.mistakes.crossMoves },
  f2lMoves: { label: 'F2L pair: Inefficient solution', rule: TOOLTIPS.mistakes.f2lMoves },
  ollMoves: { label: 'OLL: Possible incorrect / inefficient algorithm', rule: CASE_MOVES_RULE },
  pllMoves: { label: 'PLL: Possible incorrect / inefficient algorithm', rule: CASE_MOVES_RULE },
  f2lPause: { label: 'F2L: Long recognition gap', rule: TOOLTIPS.mistakes.f2lPause },
  ollRecognition: { label: 'OLL: Long recognition', rule: TOOLTIPS.mistakes.ollRecognition },
  pllRecognition: { label: 'PLL: Long recognition', rule: TOOLTIPS.mistakes.pllRecognition },
  extraLookCross: { label: 'Cross: Extra Look', rule: EXTRA_LOOK_RULE },
  extraLookF2l: { label: 'F2L: Extra Look', rule: EXTRA_LOOK_RULE },
  extraLookOll: { label: 'OLL: Extra Look', rule: EXTRA_LOOK_RULE },
  extraLookPll: { label: 'PLL: Extra Look', rule: EXTRA_LOOK_RULE },
  singleUndo: { label: 'Single-move undo', rule: TOOLTIPS.mistakes.singleUndo },
  sequenceUndo: { label: 'Multi-move undo', rule: TOOLTIPS.mistakes.sequenceUndo },
  redundantTurns: { label: 'Redundant same-face turns', rule: TOOLTIPS.mistakes.redundantTurns },
  slowAuf: { label: 'AUF: Slow adjustment', rule: TOOLTIPS.mistakes.slowAuf },
  slowStep: { label: 'Unusually slow', rule: TOOLTIPS.mistakes.slowStep },
  slowSolve: { label: 'Unusually slow solve', rule: TOOLTIPS.mistakes.slowSolve },
  f2lChoice: { label: 'F2L: Non-suggested pair', rule: TOOLTIPS.mistakes.f2lChoice },
} as const;
export type MistakeCategory = keyof typeof MISTAKES | 'nonFavorite' | 'unlearn';
export function readDisabledMistakes(): MistakeCategory[] {
  try { const saved = JSON.parse(readOption('disabled-mistakes') ?? '["f2lChoice"]') as MistakeCategory[]; return Array.isArray(saved) ? saved.filter(key => key in MISTAKES || key === 'nonFavorite' || key === 'unlearn') : ['f2lChoice']; }
  catch { return ['f2lChoice']; }
}
