import { useRef, useState } from 'react';
import type { Cube } from '../../timer/src/puzzle';
import type { Solve } from '../../timer/src/engine';
import { useAlgorithmPreferences } from './favorites';
import { getAlgorithms } from './customAlgorithms';
import './discovery.css';

export interface AlgorithmNotice { message: string; missing?: string[]; failed?: boolean }
export function AlgorithmNotification({ notice, close }: { notice: AlgorithmNotice | null; close: () => void }) {
  return notice && <aside className="algorithm-notification" aria-label="Algorithm notification">
    <div className="d-flex justify-content-between align-items-center gap-3 mb-2">
      <strong>Algorithm update</strong><button type="button" className="btn-close" aria-label="Dismiss algorithm notification" onClick={close} />
    </div>
    <p role={notice.failed ? 'alert' : 'status'} className="mb-0">{notice.message}</p>
    {!!notice.missing?.length && <p role="alert" className="small text-warning mt-2 mb-0">
      Missing favorites for {notice.missing.join(' and ')}. Those cases won&apos;t be tracked as mistakes.{' '}
      <a href="/database/" target="_blank" rel="noopener noreferrer">Choose favorites</a>
    </p>}
  </aside>;
}
export function DiscoverAlgorithms({ cube, history, learn = false, notify }: {
  cube?: Cube | null; history?: Solve[]; learn?: boolean; notify?: (notice: AlgorithmNotice) => void;
}) {
  const { favorites, unlearn, setFavorites, error } = useAlgorithmPreferences();
  const latest = useRef(favorites);
  latest.current = favorites;
  const [busy, setBusy] = useState(false), [notice, setNotice] = useState<AlgorithmNotice | null>(null);
  async function discover() {
    if (busy) return;
    if (!window.confirm(learn ? 'Learn OLL/PLL algorithms used in at least 5 completed solves and favorite them?'
      : 'Are you sure you want to automatically add favorites from your most recent 2,000 completed solves? Existing favorites will be kept.')) return;
    setBusy(true); setNotice(null);
    try {
      const model = cube ?? await (await import('../../timer/src/puzzle')).loadCube();
      const solves = history ?? await (await import('../../timer/src/storage')).readSolves();
      const { discoverFavorites, learnAlgorithms } = await import('../../timer/src/favoriteAlgorithms');
      const found = learn ? await learnAlgorithms(solves, model) : await discoverFavorites(solves, model, favorites);
      const merged = new Set([...latest.current, ...[...found].filter(id => !unlearn.has(id))]);
      const added = merged.size - latest.current.size;
      const count = Math.min(2000, solves.filter(solve => solve.status === 'complete').length);
      const missing = learn ? [] : (['OLL', 'PLL'] as const).flatMap(category => {
        const count = getAlgorithms().filter(entry => entry.category === category &&
          ![...merged].some(id => id.startsWith(`${category}-${entry.id}:`))).length;
        return count ? [`${count} ${category} ${count === 1 ? 'case' : 'cases'}`] : [];
      });
      setFavorites(merged);
      (notify ?? setNotice)({ missing, message: learn ? `Learned ${found.size} algorithms; added ${added} favorites.`
        : `Added ${added} ${added === 1 ? 'favorite' : 'favorites'} from your most recent ${count} completed ${count === 1 ? 'solve' : 'solves'}.` });
    } catch { (notify ?? setNotice)({ failed: true, message: 'Algorithms could not be detected. Your existing favorites have not changed.' }); }
    finally { setBusy(false); }
  }
  return <div>
    <button type="button" className="btn btn-outline-secondary btn-sm" disabled={busy || cube === null}
      onClick={() => void discover()}>{busy ? (learn ? 'Learning algorithms...' : 'Finding favorites...')
        : learn ? 'Learn algorithms from solves' : 'Automatically find favorites'}</button>
    <AlgorithmNotification notice={notice} close={() => setNotice(null)} />
    {error && <p role="alert" className="text-warning mt-2 mb-0">{error}</p>}
  </div>;
}
