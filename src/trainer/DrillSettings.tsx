import { InfoTip } from '../../shared/Components/InfoTip';
import { adjacentColors, cubeColors, type BlitzSettings } from './blitz';
import { TOOLTIPS } from '../../shared/tooltips';

export function DrillSettings({ settings, change, disabled = false, hidePLL = true }: {
  settings: BlitzSettings; change: (next: BlitzSettings) => void; disabled?: boolean; hidePLL?: boolean;
}) {
  return <fieldset className="d-grid gap-3 trainer-settings">
    <legend className="visually-hidden">Drill settings</legend>
    {([['upcomingCases', 'Upcoming cases'], ['caseNames', 'Case names shown'], ['solutionAlgorithms', 'Solution algorithm shown'],
      ['randomPreAuf', 'Random pre-AUF'], ['randomPostAuf', 'Random post-AUF']] as const).map(([key, label]) =>
      <label key={key} className="form-check"><input className="form-check-input" type="checkbox" disabled={disabled}
        checked={settings[key] !== false} onChange={event => change({ ...settings, [key]: event.target.checked })} />{label}</label>)}
    {hidePLL && <div className="d-flex align-items-center">
      <label className="form-check"><input className="form-check-input" type="checkbox" disabled={disabled} checked={settings.hidePLL}
        onChange={event => change({ ...settings, hidePLL: event.target.checked })} />Hide PLL stickers</label>
      <InfoTip>{TOOLTIPS.drillSettings.hidePLL}</InfoTip>
    </div>}
    {(['crossColor', 'frontColor'] as const).map(key => <label key={key}>{key === 'crossColor' ? 'Cross color' : 'Front color'}
      <select disabled={disabled} className="form-select" aria-label={key === 'crossColor' ? 'Cross color' : 'Front color'} value={settings[key]} onChange={event => change({ ...settings, [key]: event.target.value })}>
        {[...cubeColors, 'Random'].map(color => <option key={color} disabled={color !== 'Random' && settings[key === 'crossColor' ? 'frontColor' : 'crossColor'] !== 'Random' &&
          !adjacentColors(color as typeof cubeColors[number], settings[key === 'crossColor' ? 'frontColor' : 'crossColor'] as typeof cubeColors[number])}>{color}</option>)}
      </select>
    </label>)}
  </fieldset>;
}
