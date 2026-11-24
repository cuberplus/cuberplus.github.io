import { readOption } from './display';
import { TOOLTIPS } from './tooltips';
const CASE_MOVES_RULE = TOOLTIPS.mistakes.caseMoves;
export const MISTAKES = {
  crossMoves: { label: 'Cross: Inefficient solution', rule: TOOLTIPS.mistakes.crossMoves },
  f2lMoves: { label: 'F2L pair: Inefficient solution', rule: TOOLTIPS.mistakes.f2lMoves },
  ollMoves: { label: 'OLL: Inefficient solution', rule: CASE_MOVES_RULE },
  pllMoves: { label: 'PLL: Inefficient solution', rule: CASE_MOVES_RULE },
  f2lPause: { label: 'F2L: Long recognition gap', rule: TOOLTIPS.mistakes.f2lPause },
  ollRecognition: { label: 'OLL: Long recognition', rule: TOOLTIPS.mistakes.ollRecognition },
  pllRecognition: { label: 'PLL: Long recognition', rule: TOOLTIPS.mistakes.pllRecognition },
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
  try { const saved = JSON.parse(readOption('disabled-mistakes') ?? '[]') as MistakeCategory[]; return Array.isArray(saved) ? saved.filter(key => key in MISTAKES || key === 'nonFavorite' || key === 'unlearn') : []; }
  catch { return []; }
}
