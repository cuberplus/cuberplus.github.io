import { useContext } from 'react';
import Navigation, { Footer, SettingsContext } from '@cuberplus/navigation';
import { themeColors, type Theme } from '../../../shared/navigation/settings';
import { InstallControl } from '../../pwa/pwa';
import { CloudOptions } from '../../cloud/CloudOptions';
import { ImportOptions } from './ImportOptions';
import { MyCubes } from '../../../shared/Components/CubeConnection';
import { SolveLimit } from '../../../shared/Components/SolveLimit';
import { InfoTip } from '../../../shared/Components/InfoTip';

export default function Options() {
  const { theme, setTheme, precision, setPrecision, solveLimit, setSolveLimit, allSessions, setAllSessions, error } = useContext(SettingsContext);
  const themes = Object.keys(themeColors) as Theme[];
  const nextTheme = (offset: number) => setTheme(themes[(themes.indexOf(theme) + offset + themes.length) % themes.length]);
  return <div className="cuberplus-page options-page">
    <header className="cuberplus-header"><Navigation current="options" /></header>
    <main className="container py-4"><h1 className="route-heading">Options</h1><section className="card p-4">
      <div className="settings-section options-general">
      <section aria-label="Theme picker" aria-roledescription="carousel">
        <h3>Theme</h3>
        <div className="theme-carousel">
          <button className="btn btn-outline-secondary" aria-label="Previous theme" onClick={() => nextTheme(-1)}>&#10094;</button>
          <div className="theme-preview" data-theme={theme} role="group" aria-roledescription="slide" aria-label={`${themes.indexOf(theme) + 1} of ${themes.length}`}>
            <div className="theme-preview-swatches" aria-hidden="true"><i /><i /><i /></div>
            <strong aria-live="polite">{theme[0].toUpperCase() + theme.slice(1)}</strong>
            <div className="theme-dots">{themes.map(value => <button key={value} aria-label={`${value[0].toUpperCase() + value.slice(1)} theme`} aria-pressed={value === theme} onClick={() => setTheme(value)} />)}</div>
          </div>
          <button className="btn btn-outline-secondary" aria-label="Next theme" onClick={() => nextTheme(1)}>&#10095;</button>
        </div>
      </section>
      <label className="d-block">Time precision<select aria-label="Time precision" className="form-select mt-2" value={precision} onChange={event => setPrecision(event.target.value === '3' ? 3 : 2)}>
        <option value="2">Hundredths (0.00)</option><option value="3">Thousandths (0.000)</option>
      </select></label>
      <SolveLimit value={solveLimit} change={setSolveLimit} />
      <div className="d-flex align-items-center gap-2"><label className="form-check mb-0" htmlFor="all-sessions"><input id="all-sessions" type="checkbox" className="form-check-input" checked={allSessions} aria-describedby="all-sessions-help" onChange={event => setAllSessions(event.target.checked)} />Show all sessions</label>
        <InfoTip id="all-sessions-help">Include every session in Timer history, recent solves, records, and Analyzer. Otherwise, these follow the session selected in Timer. New solves still use that session. Analyzer session filters can override this selection.</InfoTip></div>
      <div><InstallControl /></div>
      </div>
      <MyCubes />
      <ImportOptions />
      <CloudOptions />
      {error && <p role="alert">{error}</p>}
    </section></main>
    <Footer />
  </div>;
}
