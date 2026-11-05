import { useRef, useState } from 'react';
import { useAlgorithmPreferences } from '../../src/database/favorites';
import { algorithms } from '../../src/database/algorithms';
import { discoverFavorites } from './favoriteAlgorithms';
import type { Cube } from './puzzle';
import type { Solve } from './engine';

export function FavoriteOptions({ cube, history }: { cube: Cube | null; history: Solve[] }) {
  const { favorites, enabled, categories, setFavorites, setEnabled, setCategories, error } = useAlgorithmPreferences();
  const latestFavorites = useRef(favorites);
  latestFavorites.current = favorites;
  const [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const [discovered, setDiscovered] = useState(false);
  const missing = (['OLL', 'PLL'] as const).flatMap(category => {
    const count = algorithms.filter(entry => entry.category === category &&
      ![...favorites].some(id => id.startsWith(`${category}-${entry.id}:`))).length;
    return count ? [`${count} ${category} ${count === 1 ? 'case' : 'cases'}`] : [];
  });
  async function findFavorites() {
    if (!cube || busy) return;
    if (!window.confirm('Are you sure you want to automatically add favorites from your most recent 2,000 completed solves? This may add many favorites. Your existing favorites will be kept.')) return;
    setBusy(true); setMessage('');
    try {
      const found = await discoverFavorites(history, cube, favorites);
      const merged = new Set([...latestFavorites.current, ...found]);
      setFavorites(merged);
      setDiscovered(true);
      const added = merged.size - latestFavorites.current.size;
      const count = Math.min(2000, history.filter(solve => solve.status === 'complete').length);
      setMessage(`Added ${added} ${added === 1 ? 'favorite' : 'favorites'} from your most recent ${count} completed ${count === 1 ? 'solve' : 'solves'}.`);
    } catch { setMessage('Favorites could not be detected. Your existing favorites have not changed.'); }
    finally { setBusy(false); }
  }
  return <div className="mt-3">
    <div className="d-flex flex-wrap align-items-center gap-2">
      <label className="form-check mb-0"><input type="checkbox" className="form-check-input" checked={enabled}
        aria-describedby="favorite-mistakes-help" onChange={event => setEnabled(event.target.checked)} />
        <span className="form-check-label">Mark non-favorite algs as mistakes</span>
      </label>
      <button type="button" className="btn btn-outline-secondary btn-sm" disabled={!cube || busy} onClick={() => void findFavorites()}>
        {busy ? 'Finding favorites...' : 'Automatically find favorites'}
      </button>
    </div>
    <fieldset className="ms-3 mt-2 d-flex flex-wrap gap-3" disabled={!enabled}>
      <legend className="visually-hidden">Non-favorite algorithm groups</legend>
      {(['F2L', 'OLL', 'PLL'] as const).map(category => <label className="form-check mb-0" key={category}>
        <input type="checkbox" className="form-check-input" checked={categories[category]}
          onChange={event => setCategories({ ...categories, [category]: event.target.checked })} />
        <span className="form-check-label">{category === 'F2L' ? 'F2L (including Advanced F2L)' : category}</span>
      </label>)}
    </fieldset>
    <p id="favorite-mistakes-help" className="small text-secondary mt-2 mb-0">Only checks cases with favorites. Any favorite is accepted, including rotations and U adjustments.</p>
    {message && <p role="status" className="small mt-2 mb-0">{message}</p>}
    {discovered && missing.length > 0 && <p role="alert" className="small text-warning mt-2 mb-0">
      Missing favorites for {missing.join(' and ')}. Those cases won&apos;t be tracked as mistakes.{' '}
      <a href="/database/" target="_blank" rel="noopener noreferrer">Choose favorites</a>
    </p>}
    {error && <p role="alert" className="text-warning mt-2 mb-0">{error}</p>}
  </div>;
}
