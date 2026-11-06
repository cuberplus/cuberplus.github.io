import { useEffect, useRef, useState } from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { parseCsv } from '../../smartcubeanalyzer/src/Helpers/CsvParser';
import { markMistakes, MISTAKES, mistakeKey, mistakeLabel, rankedMistakes } from '../../smartcubeanalyzer/src/Helpers/MistakeAnalysis';
import type { Solve as AnalyzedSolve } from '../../smartcubeanalyzer/src/Helpers/Types';
import { solveTime, type Solve } from './engine';
import type { Cube } from './puzzle';
import { cubeastCSV } from './storage';
import { useAlgorithmPreferences } from '../../src/database/favorites';
import { nonFavoriteAlgorithms, unlearnAlgorithms, type AlgorithmUse } from './favoriteAlgorithms';
import { CFOP_STEPS } from './cfop';

const cache = new WeakMap<Cube, WeakMap<Solve, AnalyzedSolve>>();
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
      let records = cache.get(cube);
      if (!records) cache.set(cube, records = new WeakMap());
      const solves: AnalyzedSolve[] = [], session = [...history.filter(item => item.id !== solve.id), solve]
        .filter(item => item.session === solve.session && item.status !== 'active');
      for (let i = 0; i < session.length; i++) {
        if (!active) return;
        const item = session[i];
        let record = records!.get(item);
        if (!record || record.dnf !== (item.status !== 'complete') || record.time !== Math.round(solveTime(item)) / 1000) {
          record = { ...parseCsv(cubeastCSV([item], cube), ',')[0], source: 'timer', isCorrupt: false }; records!.set(item, record);
        }
        solves.push(record);
        if (i % 20 === 19) await yieldToBrowser();
      }
      if (!active) return;
      solves.sort((a, b) => a.date.getTime() - b.date.getTime());
      markMistakes(solves, 100);
      const nonFavorites = enabled ? nonFavoriteAlgorithms(solve, cube, favorites, categories) : [];
      const unlearned = unlearnAlgorithms(solve, cube, unlearn);
      if (active) setResult({ solve, analysis: solves.find(item => item.id === solve.id)!, nonFavorites, unlearned });
    }
    void analyze().catch(() => { if (active) setFailure(solve); });
    return () => { active = false; };
  }, [solve, solve.status, solve.penalty, cube, history, favorites, enabled, categories, unlearn]);
  const mistakes = analysis ? rankedMistakes(analysis) : [];
  return <section ref={feedback} className="mt-3" aria-label="Solve mistakes" aria-live="polite">
    <p className="mb-1">{solve.status !== 'complete' ? 'Incomplete solve - mistakes could not be fully assessed.' : failure === solve ? 'Solve mistakes could not be assessed.' : !analysis ? 'Analyzing solve mistakes...' : unlearned.length || nonFavorites.length || mistakes.length
      ? <><strong>Biggest mistake: </strong>{unlearned.length ? `Unlearn algorithm (${unlearned[0].caseKey.replace('-', ' ')})` : nonFavorites.length ? favoriteLabel(nonFavorites[0]) : mistakeLabel(mistakes[0])}</> : 'No clear mistakes detected.'}</p>
    {!brief && !!(unlearned.length || nonFavorites.length || mistakes.length) && <ul>
      {unlearned.map(use => <li key={`unlearn-${use.step}`}><strong>{CFOP_STEPS[use.step]}: Unlearn algorithm ({use.caseKey.replace('-', ' ')})</strong></li>)}
      {nonFavorites.map(use => <li key={`favorite-${use.step}`}><strong>{favoriteLabel(use)}</strong>{' '}
        <a href={`/database/#${use.caseKey}`} target="_blank" rel="noopener noreferrer">Choose favorites</a>
      </li>)}
      {mistakes.map(mistake => <li key={mistakeKey(mistake)}>
      <strong>{mistakeLabel(mistake)}</strong>{' '}
      <OverlayTrigger placement="top" container={feedback} overlay={<Tooltip id={`replay-mistake-${mistakeKey(mistake)}`}>{MISTAKES[mistake.kind].rule}</Tooltip>}>
        <button type="button" className="btn btn-link btn-sm p-0 border-0 text-secondary text-decoration-none" aria-label={`About ${mistakeLabel(mistake)}`}>&#9432;</button>
      </OverlayTrigger>
    </li>)}</ul>}
  </section>;
}
