import { useEffect, useRef, useState } from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { markMistakes, MISTAKES, mistakeKey, mistakeLabel, rankedMistakes } from '../../../smartcubeanalyzer/src/Analysis/MistakeAnalysis';
import type { Solve as AnalyzedSolve } from '../../../smartcubeanalyzer/src/Models/Types';
import { type Solve } from '../Core/engine';
import type { Cube } from '../Core/puzzle';
import { useAlgorithmPreferences } from '../../../src/database/favorites';
import { algorithmTimeCost, nonFavoriteAlgorithms, unlearnAlgorithms, type AlgorithmUse } from '../Analysis/favoriteAlgorithms';
import { getAlgorithms } from '../../../src/database/customAlgorithms';
import { InfoTip } from '../../../shared/Components/InfoTip';
import { CFOP_STEPS } from '../Analysis/cfop';
import { persistAnalysis, solveAnalysis } from '../Analysis/analysis';

const emptyHistory: Solve[] = [];
export function SolveMistakes({ solve, cube, history = emptyHistory, brief = false }: { solve: Solve; cube: Cube; history?: Solve[]; brief?: boolean }) {
  const feedback = useRef<HTMLElement>(null);
  const { favorites, unlearn, enabled, categories } = useAlgorithmPreferences();
  const [result, setResult] = useState<{ solve: Solve; analysis: AnalyzedSolve; nonFavorites: AlgorithmUse[]; unlearned: AlgorithmUse[] } | null>(null);
  const [failure, setFailure] = useState<Solve | null>(null);
  const analysis = result?.solve === solve ? result.analysis : null;
  const nonFavorites = result?.solve === solve ? result.nonFavorites : [], unlearned = result?.solve === solve ? result.unlearned : [];
  const favoriteLabel = (use: typeof nonFavorites[number]) => `${CFOP_STEPS[use.step]}: Non-favorite algorithm (${use.caseKey.replace('-', ' ')})`;
  useEffect(() => {
    if (solve.status !== 'complete') return;
    let active = true;
    setFailure(null); setResult(null);
    const yieldToBrowser = () => new Promise(resolve => setTimeout(resolve, 0));
    async function analyze() {
      await yieldToBrowser();
      const solves: AnalyzedSolve[] = [], session = [...history.filter(item => item.id !== solve.id), solve]
        .filter(item => item.session === solve.session && item.status !== 'active');
      for (let i = 0; i < session.length; i++) {
        if (!active) return;
        const item = session[i];
        solves.push(solveAnalysis(item, cube));
        if (i % 20 === 19) await yieldToBrowser();
      }
      if (!active) return;
      solves.sort((a, b) => a.date.getTime() - b.date.getTime());
      markMistakes(solves, 100);
      await persistAnalysis(session, solves);
      const nonFavorites = enabled && !solve.imported ? nonFavoriteAlgorithms(solve, cube, favorites, categories) : [];
      const unlearned = solve.imported ? [] : unlearnAlgorithms(solve, cube, unlearn);
      if (active) setResult({ solve, analysis: solves.find(item => item.id === solve.id)!, nonFavorites, unlearned });
    }
    void analyze().catch(() => { if (active) setFailure(solve); });
    return () => { active = false; };
  }, [solve, solve.status, solve.penalty, cube, history, favorites, enabled, categories, unlearn]);
  const mistakes = analysis ? rankedMistakes(analysis) : [];
  const cost = (use: AlgorithmUse, avoid = false) => algorithmTimeCost(use, analysis?.steps[use.step], cube, avoid
    ? getAlgorithms().filter(entry => use.caseKeys.includes(`${entry.category}-${entry.id}`)).flatMap(entry =>
      entry.options.filter(algorithm => !unlearn.has(`${entry.category}-${entry.id}:${algorithm}`)))
    : [...favorites].filter(id => use.caseKeys.some(key => id.startsWith(`${key}:`))).map(id => id.slice(id.indexOf(':') + 1)));
  const totalGain = [
    ...unlearned.map(use => cost(use, true)),
    ...nonFavorites.map(use => cost(use)),
    ...mistakes.map(mistake => mistake.estimatedSeconds ?? 0),
  ].reduce((total, seconds) => total + seconds, 0);
  const loss = (seconds: number) => `~${seconds.toFixed(2)}s estimated loss`;
  return <section ref={feedback} className="mt-3" aria-label="Solve mistakes" aria-live="polite">
    <p className="mb-1">{solve.status !== 'complete' ? 'Incomplete solve - mistakes could not be fully assessed.' : failure === solve ? 'Solve mistakes could not be assessed.' : !analysis ? 'Analyzing solve mistakes...' : unlearned.length || nonFavorites.length || mistakes.length
      ? <><strong>Potential time gain: </strong>~{totalGain.toFixed(2)}s <InfoTip>The sum of the estimated time losses listed below. Estimates use excess recognition time, wasted moves at your recorded execution speed, or time above your rolling baseline. Algorithm preferences use potential move savings, not an assumed speed advantage. Overlapping mistakes can overstate the total.</InfoTip></> : 'No clear mistakes detected.'}</p>
    {!brief && !!(unlearned.length || nonFavorites.length || mistakes.length) && <ul>
      {unlearned.map(use => <li key={`unlearn-${use.step}`}><strong>{CFOP_STEPS[use.step]}: Unlearn algorithm ({use.caseKey.replace('-', ' ')})</strong> ({loss(cost(use, true))})</li>)}
      {nonFavorites.map(use => <li key={`favorite-${use.step}`}><strong>{favoriteLabel(use)}</strong>{' '}
        ({loss(cost(use))}) <a href={`/database/#${use.caseKey}`} target="_blank" rel="noopener noreferrer">Choose favorites</a>
      </li>)}
      {mistakes.map(mistake => <li key={mistakeKey(mistake)}>
      <strong>{mistakeLabel(mistake)}</strong> ({loss(mistake.estimatedSeconds ?? 0)}){' '}
      <OverlayTrigger placement="top" container={feedback} overlay={<Tooltip id={`replay-mistake-${mistakeKey(mistake)}`}>{MISTAKES[mistake.kind].rule}</Tooltip>}>
        <button type="button" className="btn btn-link btn-sm p-0 border-0 text-secondary text-decoration-none" aria-label={`About ${mistakeLabel(mistake)}`}>&#9432;</button>
      </OverlayTrigger>
    </li>)}</ul>}
  </section>;
}
