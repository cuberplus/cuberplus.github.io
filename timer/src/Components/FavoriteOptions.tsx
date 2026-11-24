import { useContext } from 'react';
import { SettingsContext } from '@cuberplus/navigation';
import { useAlgorithmPreferences } from '../../../src/database/favorites';
import { DiscoverAlgorithms } from '../../../src/database/DiscoverAlgorithms';
import { InfoTip } from '../../../shared/Components/InfoTip';
import type { Cube } from '../Core/puzzle';
import type { Solve } from '../Core/engine';
import { TOOLTIPS } from '../../../shared/tooltips';

export function FavoriteOptions({ cube, history, labelId = 'favorite-mistakes-title' }: { cube?: Cube | null; history?: Solve[]; labelId?: string }) {
  const { enabled, categories, setEnabled, setCategories, error } = useAlgorithmPreferences();
  const { disabledMistakes, setDisabledMistakes } = useContext(SettingsContext);
  const active = enabled && !disabledMistakes.includes('nonFavorite');
  const selected = active ? Object.values(categories).filter(Boolean).length : 0;
  function change(next: typeof categories) {
    const enabled = Object.values(next).some(Boolean);
    setCategories(next); setEnabled(enabled);
    setDisabledMistakes([...disabledMistakes.filter(kind => kind !== 'nonFavorite'), ...enabled ? [] : ['nonFavorite' as const]]);
  }
  return <div className="mt-3">
    <fieldset className="border rounded p-3 d-flex flex-column">
      <legend className="float-none w-auto h6 mb-2 px-2 d-flex align-items-center gap-2">
        <label className="form-check d-flex align-items-center gap-2 mb-0" style={{ minHeight: 48 }}>
          <input type="checkbox" className="form-check-input" checked={selected === 3}
            ref={input => { if (input) input.indeterminate = selected > 0 && selected < 3; }}
            onChange={event => change({ F2L: event.target.checked, OLL: event.target.checked, PLL: event.target.checked })} />
          <span id={labelId}>Mark non-favorite algs as mistakes</span>
        </label>
        <InfoTip>{TOOLTIPS.favoriteOptions.overview}</InfoTip>
      </legend>
      {(['F2L', 'OLL', 'PLL'] as const).map(category => <label className="form-check d-flex align-items-center gap-2 mb-0" style={{ minHeight: 48 }} key={category}>
        <input type="checkbox" className="form-check-input" checked={active && categories[category]}
          onChange={event => change({ ...active ? categories : { F2L: false, OLL: false, PLL: false }, [category]: event.target.checked })} />
        <span className="form-check-label">{category === 'F2L' ? 'F2L (including Advanced and Other F2L)' : category}</span>
      </label>)}
    </fieldset>
    {history && <div className="mt-3"><DiscoverAlgorithms cube={cube ?? null} history={history} /></div>}
    {error && <p role="alert" className="text-warning mt-2 mb-0">{error}</p>}
  </div>;
}
