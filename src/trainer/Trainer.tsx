import { memo, useContext, useEffect, useReducer, useRef, useState } from 'react';
import Navigation, { Footer, PageVisible, usePageDialog } from '@cuberplus/navigation';
import type { SmartCubeEvent } from 'smartcube-web-bluetooth';
import { cubeConnection, useCubeConnection } from '../../shared/cube/connection';
import { CubeConnectionControls } from '../../shared/Components/CubeConnection';
import { CubeView } from '../../timer/src/Components/CubeView';
import { loadCube, type Cube } from '../../timer/src/Core/puzzle';
import { cfopFrame } from '../../timer/src/Analysis/cfop';
import CaseImage from '../database/CaseImage';
import { InfoTip } from '../../shared/Components/InfoTip';
import { adjacentColors, Blitz, BLITZ_SETTINGS_STORAGE, cubeColors, readBlitzRuns, readBlitzSettings, saveBlitzRun, type BlitzKind, type BlitzRun, type BlitzSettings } from './blitz';
import { BlitzCaseImage } from './BlitzCaseImage';
import './trainer.css';

const seconds = (milliseconds: number) => `${(milliseconds / 1000).toFixed(2)}s`;
const recordedTime = (milliseconds?: number) => milliseconds === undefined ? 'Not recorded' : seconds(milliseconds);
export default function Trainer() {
  const visible = useContext(PageVisible);
  const [cube, setCube] = useState<Cube | null>(null);
  const [kind, setKind] = useState<BlitzKind | null>(null);
  const { connection: connected } = useCubeConnection();
  const [settings, setSettings] = useState(readBlitzSettings);
  const [error, setError] = useState(''), [status, setStatus] = useState('');
  const [runs, setRuns] = useState<BlitzRun[]>([]), [result, setResult] = useState<BlitzRun | null>(null);
  const [unsaved, setUnsaved] = useState(false);
  const optionsDialog = useRef<HTMLDialogElement>(null);
  usePageDialog(optionsDialog, false);
  const [, render] = useReducer((value: number) => value + 1, 0);
  const drill = useRef<Blitz | null>(null);
  const mounted = useRef(true), active = useRef(visible);
  active.current = visible;
  useEffect(() => {
    mounted.current = true;
    void loadCube().then(loaded => { if (mounted.current) setCube(loaded); }).catch(() => { if (mounted.current) setError('The cube could not load. Reload to try again.'); });
    try { setRuns(readBlitzRuns()); } catch { setError('Saved Blitz results could not be read. New results will not overwrite them.'); }
    const unsubscribe = cubeConnection.onEvent(event => receive(event));
    return () => { mounted.current = false; unsubscribe(); };
  }, []);
  useEffect(() => {
    if (!visible && drill.current && ['countdown', 'running'].includes(drill.current.phase)) {
      drill.current.phase = 'cancelled'; setStatus('Blitz cancelled because you left the trainer.'); render();
    }
  }, [visible]);
  function persist(run: BlitzRun) {
    try { saveBlitzRun(run); setRuns(readBlitzRuns()); setUnsaved(false); setError(''); }
    catch { setUnsaved(true); setError('Your result is shown below, but could not be saved in this browser.'); }
  }
  function receive(event: SmartCubeEvent) {
    if (!mounted.current || (event.type !== 'MOVE' && event.type !== 'DISCONNECT')) return;
    if (event.type === 'DISCONNECT') {
      setStatus('Cube disconnected.');
      if (drill.current && ['countdown', 'running'].includes(drill.current.phase)) {
        drill.current.phase = 'cancelled'; setError('Blitz cancelled: reconnect your cube and start again.');
      }
    }
    if (event.type === 'MOVE' && active.current) {
      const current = drill.current;
      if (current) current.move(cfopFrame(current.cube, current.queue[current.index]?.colorFrame ?? '')(event.move), performance.now());
      if (current?.phase === 'complete') {
        const run = current.result(); setResult(run); persist(run);
        // A completed drill must not save again when the cube sends another turn.
        drill.current = null;
      }
    }
    render();
  }
  function changeSettings(next: BlitzSettings) {
    setSettings(next);
    try { localStorage.setItem(BLITZ_SETTINGS_STORAGE, JSON.stringify(next)); }
    catch { setError('Settings changed, but could not be saved in this browser.'); }
  }
  function choose(next: BlitzKind) { drill.current = null; setKind(next); setResult(null); setUnsaved(false); setStatus(''); render(); }
  const current = drill.current, busy = !!current && ['countdown', 'running'].includes(current.phase);
  const previews = current?.phase === 'running' && current.settings.upcomingCases ? current.queue.slice(current.index, current.index + 3) : [];
  const entry = current?.queue[current.index];
  return <div className="cuberplus-page trainer-page">
    <header className="cuberplus-header"><Navigation current="trainer" /><div className="cuberplus-header-controls">
      {kind && <button className="btn btn-outline-secondary" onClick={() => optionsDialog.current?.showModal()}>Options</button>}
      <CubeConnectionControls />
    </div></header>
    <main className="container py-4 trainer-main">
      <dialog ref={optionsDialog} className="panel options-dialog trainer-settings" aria-labelledby="trainer-options-title">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 id="trainer-options-title" className="mb-0">{kind} Blitz options</h2>
          <button className="btn-close" aria-label="Close options" onClick={() => optionsDialog.current?.close()} />
        </div>
        <fieldset disabled={busy} className="d-grid gap-3">
          <legend className="visually-hidden">Blitz settings</legend>
          <label className="form-check"><input className="form-check-input" type="checkbox" checked={settings.upcomingCases}
            onChange={event => changeSettings({ ...settings, upcomingCases: event.target.checked })} />Upcoming cases</label>
          <label className="form-check"><input className="form-check-input" type="checkbox" checked={settings.caseNames}
            onChange={event => changeSettings({ ...settings, caseNames: event.target.checked })} />Case names shown</label>
          {kind === 'OLL' && <div className="d-flex align-items-center">
            <label className="form-check"><input className="form-check-input" type="checkbox" checked={settings.hidePLL}
              onChange={event => changeSettings({ ...settings, hidePLL: event.target.checked })} />Hide PLL stickers</label>
            <InfoTip>Gray out the non-top-color stickers on last-layer pieces in the live cube. The stickers stay gray as you turn; the cube state and OLL completion rules are unchanged. OLL previews and result diagrams always hide PLL stickers.</InfoTip>
          </div>}
          {(['crossColor', 'frontColor'] as const).map(key => <label key={key}>{key === 'crossColor' ? 'Cross color' : 'Front color'}
            <select className="form-select" aria-label={key === 'crossColor' ? 'Cross color' : 'Front color'} value={settings[key]} onChange={event => changeSettings({ ...settings, [key]: event.target.value })}>
              {[...cubeColors, 'Random'].map(color => <option key={color} disabled={color !== 'Random' && settings[key === 'crossColor' ? 'frontColor' : 'crossColor'] !== 'Random' &&
                !adjacentColors(color as typeof cubeColors[number], settings[key === 'crossColor' ? 'frontColor' : 'crossColor'] as typeof cubeColors[number])}>{color}</option>)}
            </select>
          </label>)}
        </fieldset>
      </dialog>
      {!kind ? <><h2>Trainer</h2><div className="trainer-drills">{(['OLL', 'PLL'] as const).map(group => <button key={group} className="card trainer-drill" onClick={() => choose(group)}>
        <CaseImage category={group} id={group === 'OLL' ? '27' : 'T'} />
        <h3>{group} Blitz</h3>
      </button>)}</div></> : <>
        <div className="d-flex align-items-center gap-3 mb-3">
          <button className="btn btn-outline-secondary" aria-label="Back to drills" disabled={busy} onClick={() => { drill.current = null; setKind(null); setResult(null); }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M20 12H4m7-7-7 7 7 7" /></svg>
          </button>
          <h2 className="mb-0">{kind} Blitz <InfoTip>Bluetooth turns control the virtual cube in the displayed frame. Each completed case immediately loads the next virtual case; do not reset or scramble your physical cube. OLL finishes when F2L is intact and the top is oriented. PLL independently randomizes the AUF before and after the algorithm, and includes the final U adjustment. Timing starts after the countdown and includes recognition. Random colors are chosen separately for each case.</InfoTip></h2>
        </div>
        {!navigator.bluetooth && <p>Use a browser with Web Bluetooth, such as Chrome or Edge.</p>}
        <section className="card p-3 text-center" aria-label={`${kind} Blitz drill`}>
          {!!previews.length && <div className="trainer-case-queue" aria-label="Current and upcoming cases">
            {previews.map((entry, i) => <div key={`${entry.category}-${entry.id}`} data-auf={entry.auf} data-pre-auf={entry.preAuf} data-post-auf={entry.postAuf} data-color-frame={entry.colorFrame} className={i === 0 ? 'trainer-case-current' : ''}>
              <p>{i === 0 ? 'Current' : `Next ${i}`}</p><BlitzCaseImage cube={cube!} kind={kind} {...entry} hidePLL={kind === 'OLL'} />
              {current!.settings.caseNames && <strong>{entry.category} {entry.id}</strong>}
            </div>)}
          </div>}
          <BlitzClock blitz={current} result={result} changed={render} />
          {current?.phase === 'running' && <><p>Case {current.index + 1} of {current.queue.length}</p>
            {current.settings.caseNames && !current.settings.upcomingCases && <strong>{kind} {entry!.id}</strong>}
            <CubeView cube={current.cube} facelets={current.cube.facelets(current.pattern)} moves={current.moves} animateSeeks cross={3} colorFrame={entry!.colorFrame} height={230} hidePLL={kind === 'OLL' && current.settings.hidePLL} />
          </>}
          {!busy ? <button className="btn btn-primary align-self-center" disabled={!connected || !cube} onClick={() => {
            try { drill.current = new Blitz(cube!, kind, Math.random, settings); drill.current.start(performance.now()); }
            catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not start Blitz.'); return; }
            setResult(null); setUnsaved(false); setError(''); setStatus(''); render();
          }}>{result ? 'Try again' : 'Start Blitz'}</button> :
            <button className="btn btn-outline-danger align-self-center" onClick={() => { current!.phase = 'cancelled'; setStatus('Blitz aborted. No result saved.'); render(); }}>Give up</button>}
        </section>
      </>}
      {status && <p role="status" className="mt-3">{status}</p>}
      {error && <p role="alert" className="mt-3">{error}</p>}
      {result && <section className="card p-3 mt-4" aria-label="Blitz result"><h3>Blitz complete: {seconds(result.milliseconds)}</h3>
        {unsaved ? <button className="btn btn-primary" onClick={() => persist(result)}>Retry saving result</button> : <p>Result and case splits saved.</p>}
        <Splits run={result} cube={cube} />
      </section>}
      {!!runs.length && <section className="mt-4"><h3>Blitz history</h3>{runs.filter(run => !kind || run.kind === kind).map(run =>
        <details className="card p-3 mb-2" key={run.id}><summary>{run.kind} Blitz - {seconds(run.milliseconds)} - {new Date(run.date).toLocaleString()}</summary><Splits run={run} cube={cube} /></details>)}</section>}
    </main><Footer />
  </div>;
}
function BlitzClock({ blitz, result, changed }: { blitz: Blitz | null; result: BlitzRun | null; changed: () => void }) {
  const visible = useContext(PageVisible);
  const [, render] = useReducer((value: number) => value + 1, 0);
  const phase = blitz?.phase;
  useEffect(() => {
    if (!visible || !blitz || !['countdown', 'running'].includes(phase ?? '')) return;
    const interval = setInterval(() => {
      const previous = blitz.phase;
      blitz.tick(performance.now());
      render();
      if (previous !== blitz.phase) changed();
    }, 40);
    return () => clearInterval(interval);
  }, [blitz, phase, visible, changed]);
  return <div className="trainer-clock" role="timer" aria-label="Blitz time">
    {phase === 'countdown' ? Math.max(1, 3 - Math.floor((performance.now() - blitz!.countdownAt) / 1000)) :
      seconds(result?.milliseconds ?? blitz?.elapsed(performance.now()) ?? 0)}
  </div>;
}
const Splits = memo(function Splits({ run, cube }: { run: BlitzRun; cube: Cube | null }) {
  const [sort, setSort] = useState<{ column: 'order' | 'caseId' | 'milliseconds' | 'recognitionMilliseconds' | 'executionMilliseconds'; ascending: boolean }>({ column: 'caseId', ascending: true });
  const splits = run.splits.map((split, index) => ({ ...split, order: index + 1 })).sort((a, b) => {
    const first = a[sort.column], second = b[sort.column];
    if (first === undefined || second === undefined) return first === second ? 0 : first === undefined ? 1 : -1;
    return (typeof first === 'string' ? first.localeCompare(String(second), undefined, { numeric: true }) : first - Number(second)) * (sort.ascending ? 1 : -1);
  });
  const timings = (['recognitionMilliseconds', 'executionMilliseconds'] as const).map(column =>
    run.splits.every(split => split[column] !== undefined) ? run.splits.reduce((sum, split) => sum + split[column]!, 0) : undefined);
  return <>
    <dl className="trainer-run-settings mt-3" aria-label="Timing breakdown">
      <div><dt>Recognition <InfoTip>Time from each case loading to its first turn, excluding the countdown. Older results without timing data show Not recorded.</InfoTip></dt><dd>{recordedTime(timings[0])}</dd></div>
      <div><dt>Execution <InfoTip>Time from the first turn to case completion, including pauses between turns.</InfoTip></dt><dd>{recordedTime(timings[1])}</dd></div>
    </dl>
    {run.settings ? <dl className="trainer-run-settings mt-3">
      <div><dt>Upcoming cases</dt><dd>{run.settings.upcomingCases ? 'Shown' : 'Hidden'}</dd></div>
      <div><dt>Case names shown</dt><dd>{run.settings.caseNames ? 'Yes' : 'No'}</dd></div>
      {run.kind === 'OLL' && <div><dt>PLL stickers</dt><dd>{run.settings.hidePLL ? 'Gray' : 'Shown'}</dd></div>}
      <div><dt>Cross color</dt><dd>{run.settings.crossColor}</dd></div><div><dt>Front color</dt><dd>{run.settings.frontColor}</dd></div>
    </dl> : <p className="text-secondary mt-3">Settings were not recorded for this older Blitz.</p>}
    <div className="table-responsive"><table className="table table-sm trainer-splits"><thead><tr>{([['order', 'Order'], ['caseId', 'Case'], ['recognitionMilliseconds', 'Recognition'], ['executionMilliseconds', 'Execution'], ['milliseconds', 'Split']] as const).map(([column, label]) =>
      <th key={column} aria-sort={sort.column === column ? sort.ascending ? 'ascending' : 'descending' : 'none'}>
        <button className="btn btn-link p-0" onClick={() => setSort({ column, ascending: sort.column === column ? !sort.ascending : true })}>
          {label}{sort.column === column ? sort.ascending ? ' \u2191' : ' \u2193' : ''}
        </button>
      </th>)}</tr></thead><tbody>
      {splits.map(split => <tr key={split.caseId}><td>{split.order}</td><td><div className="d-flex align-items-center gap-2">
        {cube && <BlitzCaseImage cube={cube} kind={run.kind} id={split.caseId} {...split} hidePLL={run.kind === 'OLL'} />}
        <span>{run.kind} {split.caseId}{split.preAuf !== undefined ? <>
          <small className="d-block text-secondary">Pre-AUF: {split.preAuf || 'None'}</small>
          <small className="d-block text-secondary">Post-AUF: {split.postAuf || 'None'}</small>
        </> : split.auf !== undefined && <small className="d-block text-secondary">AUF: {split.auf || 'None'}</small>}
          {split.crossColor && <small className="d-block text-secondary">{split.crossColor} cross / {split.frontColor} front</small>}</span>
      </div></td><td>{recordedTime(split.recognitionMilliseconds)}</td><td>{recordedTime(split.executionMilliseconds)}</td><td>{seconds(split.milliseconds)}</td></tr>)}
    </tbody></table></div>
  </>;
});
