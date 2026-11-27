import { useContext } from 'react';
import Navigation, { Footer, SettingsContext } from '@cuberplus/navigation';
import { themeColors, type Theme } from '../../../shared/navigation/settings';
import { InstallControl } from '../../pwa/pwa';
import { CloudOptions } from '../../cloud/CloudOptions';
import { ImportOptions } from './ImportOptions';
import { MyCubes } from '../../../shared/Components/CubeConnection';
import { SolveLimit } from '../../../shared/Components/SolveLimit';
import { InfoTip } from '../../../shared/Components/InfoTip';
import { BreakReminderOptions } from '../../../shared/Components/BreakReminderOptions';
import { SettingsSection } from '../../../shared/Components/SettingsSection';
import { MISTAKES, type MistakeCategory } from '../../../shared/mistakes';
import { FavoriteOptions } from '../../../timer/src/Components/FavoriteOptions';
import { TOOLTIPS } from '../../../shared/tooltips';
import { StreakReminderOptions } from '../../pwa/StreakReminderOptions';

export default function Options() {
  const { theme, setTheme, precision, setPrecision, solveLimit, setSolveLimit, allSessions, setAllSessions, error, showMinutes, setShowMinutes, fontSize, setFontSize, disabledMistakes, setDisabledMistakes, highlightAura, setHighlightAura } = useContext(SettingsContext);
  const themes = Object.keys(themeColors) as Theme[];
  const nextTheme = (offset: number) => setTheme(themes[(themes.indexOf(theme) + offset + themes.length) % themes.length]);
  return <div className="cuberplus-page options-page">
    <header className="cuberplus-header"><Navigation current="options" /></header>
    <main className="container py-4"><h1 className="route-heading">Options</h1><section className="card p-4">
      <SettingsSection title="General" className="options-general-section"><div className="options-general">
      <fieldset className="options-general-group">
      <legend>Appearance</legend>
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
      <label>Font size<select aria-label="Font size" className="form-select mt-2" value={fontSize} onChange={event => setFontSize(event.target.value as typeof fontSize)}>
        <option value="small">Small</option><option value="normal">Normal</option><option value="large">Large</option>
      </select></label>
      <label>Highlight aura<select aria-label="Highlight aura" className="form-select mt-2" value={highlightAura} onChange={event => setHighlightAura(event.target.value as typeof highlightAura)}>
        <option value="black">Black</option><option value="white">White</option><option value="color">Darker sticker color</option>
      </select></label>
      </fieldset>
      <fieldset className="options-general-group">
      <legend>Time display</legend>
      <label className="d-block">Time precision<select aria-label="Time precision" className="form-select mt-2" value={precision} onChange={event => setPrecision(event.target.value === '3' ? 3 : 2)}>
        <option value="2">Hundredths (0.00)</option><option value="3">Thousandths (0.000)</option>
      </select></label>
      <div className="d-flex align-items-center gap-2"><label className="form-check mb-0"><input type="checkbox" className="form-check-input" checked={showMinutes} onChange={event => setShowMinutes(event.target.checked)} />Show minutes</label><InfoTip>{TOOLTIPS.options.showMinutes}</InfoTip></div>
      </fieldset>
      <fieldset className="options-general-group">
      <legend>History</legend>
      <SolveLimit value={solveLimit} change={setSolveLimit} />
      <div className="d-flex align-items-center gap-2"><label className="form-check mb-0" htmlFor="all-sessions"><input id="all-sessions" type="checkbox" className="form-check-input" checked={allSessions} aria-describedby="all-sessions-help" onChange={event => setAllSessions(event.target.checked)} />Show all sessions</label>
        <InfoTip id="all-sessions-help">{TOOLTIPS.options.allSessions}</InfoTip></div>
      </fieldset>
      <fieldset className="options-general-group">
      <legend>App &amp; reminders</legend>
      <StreakReminderOptions />
      <div className="options-general-app-actions"><InstallControl /></div>
      </fieldset>
      </div></SettingsSection>
      <MyCubes />
      <BreakReminderOptions />
      <SettingsSection title="Mistakes">
        <div className="d-grid gap-3">{mistakeGroups.map(([label, categories]) => {
          const enabled = categories.filter(key => !disabledMistakes.includes(key)).length;
          return <fieldset key={label} className="border rounded p-3"><legend className="float-none w-auto h6 mb-2 px-2">
            <label className="form-check d-flex align-items-center gap-2 mb-0" style={{ minHeight: 44 }}><input type="checkbox" className="form-check-input" checked={enabled === categories.length}
              ref={input => { if (input) input.indeterminate = enabled > 0 && enabled < categories.length; }}
              onChange={event => setDisabledMistakes([...disabledMistakes.filter(key => categories.every(category => category !== key)), ...event.target.checked ? [] : categories])} />{label}</label>
          </legend>{categories.map(category => {
            const detail = category === 'unlearn' ? { label: 'Unlearn algorithms', rule: TOOLTIPS.mistakes.unlearn } : MISTAKES[category];
            return <div key={category} className="d-flex align-items-center gap-2"><label className="form-check d-flex align-items-center gap-2 mb-0" style={{ minHeight: 44 }}><input type="checkbox" className="form-check-input" checked={!disabledMistakes.includes(category)} onChange={event => setDisabledMistakes(event.target.checked ? disabledMistakes.filter(item => item !== category) : [...disabledMistakes, category])} />{detail.label}</label><InfoTip>{detail.rule}</InfoTip></div>;
          })}</fieldset>;
        })}</div>
        <FavoriteOptions labelId="site-favorite-mistakes-title" />
      </SettingsSection>
      <ImportOptions />
      <CloudOptions />
      <SettingsSection title="Community"><div className="d-flex gap-2">
        {/* Bootstrap Icons (MIT): /licenses/bootstrap-icons.txt */}
        <a className="btn btn-link d-inline-flex p-2" href="https://discord.gg/ft7tmsSWs" target="_blank" rel="noopener noreferrer" aria-label="Join the CuberPlus Discord server" title={TOOLTIPS.options.discord}>
          <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" focusable="false">
            <path d="M13.545 2.907a13.2 13.2 0 0 0-3.257-1.011.05.05 0 0 0-.052.025c-.141.25-.297.577-.406.833a12.2 12.2 0 0 0-3.658 0 8 8 0 0 0-.412-.833.05.05 0 0 0-.052-.025c-1.125.194-2.22.534-3.257 1.011a.04.04 0 0 0-.021.018C.356 6.024-.213 9.047.066 12.032q.003.022.021.037a13.3 13.3 0 0 0 3.995 2.02.05.05 0 0 0 .056-.019q.463-.63.818-1.329a.05.05 0 0 0-.01-.059l-.018-.011a9 9 0 0 1-1.248-.595.05.05 0 0 1-.02-.066l.015-.019q.127-.095.248-.195a.05.05 0 0 1 .051-.007c2.619 1.196 5.454 1.196 8.041 0a.05.05 0 0 1 .053.007q.121.1.248.195a.05.05 0 0 1-.004.085 8 8 0 0 1-1.249.594.05.05 0 0 0-.03.03.05.05 0 0 0 .003.041c.24.465.515.909.817 1.329a.05.05 0 0 0 .056.019 13.2 13.2 0 0 0 4.001-2.02.05.05 0 0 0 .021-.037c.334-3.451-.559-6.449-2.366-9.106a.03.03 0 0 0-.02-.019m-8.198 7.307c-.789 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.45.73 1.438 1.613 0 .888-.637 1.612-1.438 1.612m5.316 0c-.788 0-1.438-.724-1.438-1.612s.637-1.613 1.438-1.613c.807 0 1.451.73 1.438 1.613 0 .888-.631 1.612-1.438 1.612" />
          </svg>
        </a>
        <a className="btn btn-link d-inline-flex p-2" href="https://github.com/CuberPlus/cuberplus.github.io" target="_blank" rel="noopener noreferrer" aria-label="CuberPlus on GitHub" title={TOOLTIPS.options.gitHub}>
          <svg width="24" height="24" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true" focusable="false">
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8" />
          </svg>
        </a>
      </div></SettingsSection>
      {error && <p role="alert">{error}</p>}
      <SettingsSection title="Dev Note">
        <div className="mt-3">
          <p>Hey! My name is Fifey</p>
          <p>If you're reading this, thank you for using CuberPlus!</p>
          <p>I've been a member of the Cubing community for 20+ years. I wanted this to be my way of saying thank you! Growing up, every Rubik's cube resource (Alg PDFs, YouTube Tutorials, Reddit Solve Critiques) I've ever learned from has been provided to me for free. As such, I wanted to make Bluetooth timers free!</p>
          <p className="dev-note-promise"><strong>My promise to you is that CuberPlus and all its features will be 100% Free, and will never show advertising. Ever.</strong></p>
          <p>Thank you to the entire cubing community!</p>
          <p>If you notice any bugs or want to request any features, please join my Discord and tell me! I may not get to it immediately because I am a solo developer, and this is a hobby project. But I'm always looking to make CuberPlus better!</p>
          <p>I hope that this site helps you learn and improve!</p>
          <p className="mb-0">-Fifey</p>
        </div>
      </SettingsSection>
    </section></main>
    <Footer />
  </div>;
}
const mistakeGroups: [string, Exclude<MistakeCategory, 'nonFavorite'>[]][] = [
  ['Inefficient solutions', ['crossMoves', 'f2lMoves', 'ollMoves', 'pllMoves']],
  ['Long recognition', ['f2lPause', 'ollRecognition', 'pllRecognition']],
  ['Extra Look', ['extraLookCross', 'extraLookF2l', 'extraLookOll', 'extraLookPll']],
  ['Move undos', ['singleUndo', 'sequenceUndo']],
  ['Redundant turns', ['redundantTurns']],
  ['Slow adjustments', ['slowAuf']],
  ['Unusually slow times', ['slowStep', 'slowSolve']],
  ['Pair selection', ['f2lChoice']],
  ['Algorithm preferences', ['unlearn']],
];
