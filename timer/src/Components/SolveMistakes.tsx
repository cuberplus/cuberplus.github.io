import { useContext, useEffect, useRef, useState } from 'react';
import { PageVisible } from '@cuberplus/navigation';
import { MISTAKES, mistakeKey, mistakeLabel, rankedMistakes } from '../../../smartcubeanalyzer/src/Analysis/MistakeAnalysis';
import { StepName, type Solve as AnalyzedSolve } from '../../../smartcubeanalyzer/src/Models/Types';
import { type Solve } from '../Core/engine';
import type { Cube } from '../Core/puzzle';
import { useAlgorithmPreferences } from '../../../src/database/favorites';
import { algorithmTimeCost, nonFavoriteAlgorithms, unlearnAlgorithms, type AlgorithmUse } from '../Analysis/favoriteAlgorithms';
import { getAlgorithms } from '../../../src/database/customAlgorithms';
import { InfoTip } from '../../../shared/Components/InfoTip';
import { CFOP_STEPS } from '../Analysis/cfop';
import { solveFeedback } from '../../../shared/workers/dataClient';
import { potentialGain } from '../Analysis/mistakeSummary';

const emptyHistory: Solve[] = [];
export function SolveMistakes({ solve, cube, history = emptyHistory, brief = false }: { solve: Solve; cube: Cube; history?: Solve[]; brief?: boolean }) {
  const feedback = useRef<HTMLElement>(null);
  const visible = useContext(PageVisible);
  const { favorites, unlearn, enabled, categories } = useAlgorithmPreferences();
  const [result, setResult] = useState<{ solve: Solve; analysis: AnalyzedSolve; nonFavorites: AlgorithmUse[]; unlearned: AlgorithmUse[] } | null>(null);
  const [failure, setFailure] = useState<Solve | null>(null);
  const analysis = result?.solve === solve ? result.analysis : null;
  const nonFavorites = result?.solve === solve ? result.nonFavorites : [], unlearned = result?.solve === solve ? result.unlearned : [];
  const favoriteLabel = (use: typeof nonFavorites[number]) => `${CFOP_STEPS[use.step]}: Non-favorite algorithm (${use.caseKey.replace('-', ' ')})`;
  useEffect(() => {
    if (!visible || solve.status !== 'complete') return;
    let active = true;
    setFailure(null); setResult(null);
    async function analyze() {
      const result = await solveFeedback(solve, history, () => active);
      if (!active || !('analysis' in result) || !result.analysis) return;
      const nonFavorites = enabled && !solve.imported ? nonFavoriteAlgorithms(solve, cube, favorites, categories) : [];
      const unlearned = solve.imported ? [] : unlearnAlgorithms(solve, cube, unlearn);
      setResult({ solve, analysis: result.analysis, nonFavorites, unlearned });
    }
    void analyze().catch(() => { if (active) setFailure(solve); });
    return () => { active = false; };
  }, [solve, solve.status, solve.penalty, cube, history, favorites, enabled, categories, unlearn, visible]);
  const mistakes = analysis ? rankedMistakes(analysis) : [];
  const cost = (use: AlgorithmUse, avoid = false) => algorithmTimeCost(use, analysis?.steps[use.step], cube, avoid
    ? getAlgorithms().filter(entry => use.caseKeys.includes(`${entry.category}-${entry.id}`)).flatMap(entry =>
      entry.options.filter(algorithm => !unlearn.has(`${entry.category}-${entry.id}:${algorithm}`)))
    : [...favorites].filter(id => use.caseKeys.some(key => id.startsWith(`${key}:`))).map(id => id.slice(id.indexOf(':') + 1)));
  const algorithmCosts = [
    ...unlearned.map(use => ({ use, seconds: cost(use, true), label: `${CFOP_STEPS[use.step]}: Unlearn algorithm (${use.caseKey.replace('-', ' ')})` })),
    ...nonFavorites.map(use => ({ use, seconds: cost(use), label: favoriteLabel(use) })),
  ];
  const worst = [...algorithmCosts, ...mistakes.map(mistake => ({ seconds: mistake.estimatedSeconds ?? 0, label: mistakeLabel(mistake) }))]
    .sort((a, b) => b.seconds - a.seconds)[0];
  const steps = [StepName.Cross, StepName.F2L_1, StepName.F2L_2, StepName.F2L_3, StepName.F2L_4, StepName.OLL, StepName.PLL];
  const totalGain = analysis ? potentialGain(analysis, algorithmCosts.map(({ use, seconds }) => ({ step: steps[use.step], seconds }))) : 0;
  const loss = (seconds: number) => `~${seconds.toFixed(2)}s estimated loss`;
  return <section ref={feedback} className="mt-3" aria-label="Solve mistakes" aria-live="polite">
    <p className="mb-1">{solve.status !== 'complete' ? 'Incomplete solve - mistakes could not be fully assessed.' : failure === solve ? 'Solve mistakes could not be assessed.' : !analysis ? 'Analyzing solve mistakes...' : unlearned.length || nonFavorites.length || mistakes.length
      ? brief ? <><strong>Worst mistake: </strong>{worst.label} ({loss(worst.seconds)})</>
        : <><strong>Potential time gain: </strong>~{totalGain.toFixed(2)}s <InfoTip>Only the largest estimated loss per step is counted, excluding unusually slow solve. The estimate is capped at the solve time. Estimates use excess recognition time, wasted moves at your recorded execution speed, or time above your rolling baseline. Algorithm preferences use potential move savings, not an assumed speed advantage.</InfoTip></> : 'No clear mistakes detected.'}</p>
    {!brief && !!(unlearned.length || nonFavorites.length || mistakes.length) && <ul>
      {unlearned.map(use => <li key={`unlearn-${use.step}`}><strong>{CFOP_STEPS[use.step]}: Unlearn algorithm ({use.caseKey.replace('-', ' ')})</strong> ({loss(cost(use, true))})</li>)}
      {nonFavorites.map(use => <li key={`favorite-${use.step}`}><strong>{favoriteLabel(use)}</strong>{' '}
        ({loss(cost(use))}) <a href={`/database/#${use.caseKey}`} target="_blank" rel="noopener noreferrer">Choose favorites</a>
      </li>)}
      {mistakes.map(mistake => <li key={mistakeKey(mistake)}>
      <strong>{mistakeLabel(mistake)}</strong> ({loss(mistake.estimatedSeconds ?? 0)}){' '}
      <InfoTip id={`replay-mistake-${mistakeKey(mistake)}`}>{MISTAKES[mistake.kind].rule}</InfoTip>
    </li>)}</ul>}
  </section>;
}
