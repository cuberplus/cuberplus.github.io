import { useContext } from 'react';
import { SettingsContext } from '../navigation/settings';
import { InfoTip } from './InfoTip';
import { TOOLTIPS } from '../tooltips';
export function ReplayHighlightOptions() {
  const { replayHighlight, setReplayHighlight } = useContext(SettingsContext);
  return <div className="d-flex align-items-center gap-2 mt-3"><label>Replay highlight<select aria-label="Replay highlight" className="form-select" value={replayHighlight} onChange={event => setReplayHighlight(event.target.value)}>
    <option value="none">No highlight</option><option value="current">Current step</option><option value="suggested">Suggested</option>
  </select></label><InfoTip>{TOOLTIPS.replayHighlightOptions.overview}</InfoTip></div>;
}
