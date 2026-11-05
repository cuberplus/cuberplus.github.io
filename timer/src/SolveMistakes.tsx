import { useMemo, useRef } from 'react';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { parseCsv } from '../../smartcubeanalyzer/src/Helpers/CsvParser';
import { markMistakes, MISTAKES, mistakeKey, mistakeLabel, rankedMistakes } from '../../smartcubeanalyzer/src/Helpers/MistakeAnalysis';
import type { Solve as AnalyzedSolve } from '../../smartcubeanalyzer/src/Helpers/Types';
import { solveTime, type Solve } from './engine';
import type { Cube } from './puzzle';
import { cubeastCSV } from './storage';
import { useAlgorithmPreferences } from '../../src/database/favorites';
import { nonFavoriteAlgorithms } from './favoriteAlgorithms';
import { CFOP_STEPS } from './cfop';

const cache = new WeakMap<Cube, WeakMap<Solve, AnalyzedSolve>>();
const emptyHistory: Solve[] = [];
export function SolveMistakes({ solve, cube, history = emptyHistory, brief = false }: { solve: Solve; cube: Cube; history?: Solve[]; brief?: boolean }) {
  const feedback = useRef<HTMLElement>(null);
  const { favorites, enabled, categories } = useAlgorithmPreferences();
  const nonFavorites = useMemo(() => enabled ? nonFavoriteAlgorithms(solve, cube, favorites, categories) : [],
    [solve, solve.status, cube, favorites, enabled, categories]);
  const favoriteLabel = (use: typeof nonFavorites[number]) => `${CFOP_STEPS[use.step]}: Non-favorite algorithm (${use.caseKey.replace('-', ' ')})`;
  const analysis = useMemo(() => {
    if (solve.status !== 'complete') return null;
    let records = cache.get(cube);
    if (!records) cache.set(cube, records = new WeakMap());
    const solves = [...history.filter(item => item.id !== solve.id), solve]
      .filter(item => item.session === solve.session && item.status !== 'active').map(item => {
        let record = records!.get(item);
        if (!record || record.dnf !== (item.status !== 'complete') || record.time !== Math.round(solveTime(item)) / 1000) {
          record = { ...parseCsv(cubeastCSV([item], cube), ',')[0], source: 'timer', isCorrupt: false }; records!.set(item, record);
        }
        return record;
      }).sort((a, b) => a.date.getTime() - b.date.getTime());
    markMistakes(solves, 100);
    return solves.find(item => item.id === solve.id)!;
  }, [solve, solve.status, solve.penalty, cube, history]);
  const mistakes = analysis ? rankedMistakes(analysis) : [];
  return <section ref={feedback} className="mt-3" aria-label="Solve mistakes" aria-live="polite">
    <p className="mb-1">{!analysis ? 'Incomplete solve - mistakes could not be fully assessed.' : nonFavorites.length || mistakes.length
      ? <><strong>Biggest mistake: </strong>{nonFavorites.length ? favoriteLabel(nonFavorites[0]) : mistakeLabel(mistakes[0])}</> : 'No clear mistakes detected.'}</p>
    {!brief && !!(nonFavorites.length || mistakes.length) && <ul>
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
