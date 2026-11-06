import { useAlgorithmPreferences } from '../../src/database/favorites';
import { DiscoverAlgorithms } from '../../src/database/DiscoverAlgorithms';
import { InfoTip } from './InfoTip';
import type { Cube } from './puzzle';
import type { Solve } from './engine';

export function FavoriteOptions({ cube, history }: { cube: Cube | null; history: Solve[] }) {
  const { enabled, categories, setEnabled, setCategories, error } = useAlgorithmPreferences();
  return <div className="mt-3">
    <div className="d-flex align-items-center">
      <label className="form-check mb-0"><input type="checkbox" className="form-check-input" checked={enabled}
        onChange={event => setEnabled(event.target.checked)} />
        <span className="form-check-label">Mark non-favorite algs as mistakes</span>
      </label>
      <InfoTip>Only checks cases with favorites. Any favorite is accepted, including rotations and U adjustments.</InfoTip>
    </div>
    <fieldset className="ms-3 mt-2 d-flex flex-column gap-2" disabled={!enabled}>
      <legend className="visually-hidden">Non-favorite algorithm groups</legend>
      {(['F2L', 'OLL', 'PLL'] as const).map(category => <label className="form-check mb-0" key={category}>
        <input type="checkbox" className="form-check-input" checked={categories[category]}
          onChange={event => setCategories({ ...categories, [category]: event.target.checked })} />
        <span className="form-check-label">{category === 'F2L' ? 'F2L (including Advanced F2L)' : category}</span>
      </label>)}
    </fieldset>
    <div className="mt-3"><DiscoverAlgorithms cube={cube} history={history} /></div>
    {error && <p role="alert" className="text-warning mt-2 mb-0">{error}</p>}
  </div>;
}
