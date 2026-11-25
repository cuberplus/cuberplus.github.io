import { memo, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import Navigation, { Footer, PageLocation, PageVisible, SettingsContext, usePageDialog } from '@cuberplus/navigation';
import { cubeConnection, useCubeConnection, type CubeEvent } from '../../shared/cube/connection';
import { CubeConnectionMenu } from '../../shared/Components/CubeConnection';
import { PageOptionsButton } from '../../shared/Components/PageOptionsButton';
import { CubeView } from '../../timer/src/Components/CubeView';
import { loadCube, type Cube } from '../../timer/src/Core/puzzle';
import { cfopFrame } from '../../timer/src/Analysis/cfop';
import CaseImage from '../database/CaseImage';
import { InfoTip } from '../../shared/Components/InfoTip';
import { Blitz, BLITZ_SETTINGS_STORAGE, readBlitzRuns, readBlitzSettings, saveBlitzRun, type BlitzKind, type BlitzRun, type BlitzSettings } from './blitz';
import { BlitzCaseImage } from './BlitzCaseImage';
import { CasePractice } from './CasePractice';
import { findTrainingCase } from './cases';
import { SolutionProgress } from './SolutionProgress';
import { relativeTime } from '../../timer/src/Data/relativeTime';
import './trainer.css';
import { formatMilliseconds } from '../../shared/display';
import { DrillSettings } from './DrillSettings';
import { OrientationFlashcards } from './OrientationFlashcards';
import { DrillBackButton } from './DrillBackButton';
import { TOOLTIPS } from '../../shared/tooltips';

const seconds = (milliseconds: number) => `${formatMilliseconds(milliseconds)}s`;
const recordedTime = (milliseconds?: number) => milliseconds === undefined ? 'Not recorded' : seconds(milliseconds);
export default function Trainer() {
  useContext(SettingsContext);
  const visible = useContext(PageVisible);
  const address = useContext(PageLocation);
  const requestedCase = new URLSearchParams((address || location.pathname + location.search).split('?')[1] ?? '').get('case') ?? '';
  const [mode, setMode] = useState<'single' | 'custom' | 'orientation' | null>(() => findTrainingCase(requestedCase) ? 'single' : null);
  const [practiceCase, setPracticeCase] = useState({ key: requestedCase, revision: 0 });
  const [cube, setCube] = useState<Cube | null>(null);
  const [kind, setKind] = useState<BlitzKind | null>(null);
  const { connection: connected } = useCubeConnection();
  const [settings, setSettings] = useState(readBlitzSettings);
  const [error, setError] = useState(''), [status, setStatus] = useState('');
  const [runs, setRuns] = useState<BlitzRun[]>([]), [result, setResult] = useState<BlitzRun | null>(null);
  const [unsaved, setUnsaved] = useState(false);
  const optionsDialog = useRef<HTMLDialogElement>(null), drillOptionsDialog = useRef<HTMLDialogElement>(null);
  usePageDialog(optionsDialog, false);
  const [, render] = useReducer((value: number) => value + 1, 0);
  const drill = useRef<Blitz | null>(null);
  useEffect(() => {
    if (!visible || !requestedCase) return;
    if (!findTrainingCase(requestedCase)) { setError('That training case could not be found. Choose a case below.'); return; }
    drill.current = null; setKind(null); setResult(null);
    setPracticeCase(previous => ({ key: requestedCase, revision: previous.revision + 1 })); setMode('single');
  }, [requestedCase, address, visible]);
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
  function finishDrill() {
    if (drill.current?.phase !== 'complete') return;
    const run = drill.current.result(); setResult(run); persist(run); drill.current = null;
  }
  function receive(event: CubeEvent) {
    if (event.type === 'CALIBRATE') {
      if (drill.current) drill.current.phase = 'cancelled';
      setStatus('Cube recalibrated. Start a new drill.'); render(); return;
    }
    if (!mounted.current || (event.type !== 'MOVE' && event.type !== 'DISCONNECT')) return;
    if (event.type === 'DISCONNECT') {
      setStatus('');
      if (drill.current && ['countdown', 'running'].includes(drill.current.phase)) {
        drill.current.phase = 'cancelled'; setError('Blitz cancelled: reconnect your cube and start again.');
      }
    }
    if (event.type === 'MOVE' && active.current) {
      const current = drill.current;
      if (current) current.move(cfopFrame(current.cube, current.queue[current.index]?.colorFrame ?? '')(event.move), performance.now());
      finishDrill();
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
  const previews = current?.phase === 'running' && settings.upcomingCases ? current.queue.slice(current.index, current.index + 4) : [];
  const entry = current?.queue[current.index];
  const visibleRuns = useMemo(() => runs.filter(run => run.kind === kind), [runs, kind]);
  const best = useMemo(() => runs.reduce((best, run) => {
    if (!run.dnf) best[run.kind] = Math.min(best[run.kind], run.milliseconds);
    return best;
  }, { OLL: Infinity, PLL: Infinity }), [runs]);
  return <div className="cuberplus-page trainer-page">
    <header className="cuberplus-header"><Navigation current="trainer" /></header>
    <main className="container py-4 trainer-main">
      <div className="page-heading"><h1 className="route-heading">Trainer</h1><div className="page-actions">
      <CubeConnectionMenu />
      {(mode || kind) && <PageOptionsButton open={() => (mode ? drillOptionsDialog : optionsDialog).current?.showModal()} />}
      </div></div>
      <dialog ref={optionsDialog} className="panel options-dialog trainer-settings" aria-labelledby="trainer-options-title">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 id="trainer-options-title" className="mb-0">{kind ? `${kind} Blitz` : 'Trainer'} options</h2>
          <button className="btn-close" aria-label="Close options" onClick={() => optionsDialog.current?.close()} />
        </div>
        {!mode && kind && <DrillSettings settings={settings} change={changeSettings} disabled={busy} hidePLL={kind === 'OLL'} />}
      </dialog>
      {mode === 'orientation' ? <OrientationFlashcards cube={cube} optionsDialog={drillOptionsDialog} back={() => setMode(null)} /> : mode ? <CasePractice key={`${mode}:${practiceCase.revision}`} cube={cube} mode={mode} initialCase={practiceCase.key} settings={settings} changeSettings={changeSettings} optionsDialog={drillOptionsDialog} back={() => { setMode(null); setPracticeCase(previous => ({ key: '', revision: previous.revision + 1 })); }} /> : !kind ? <><div className="trainer-drills">{(['OLL', 'PLL'] as const).map(group => <button key={group} className="card trainer-drill" onClick={() => choose(group)}>
        <CaseImage category={group} id={group === 'OLL' ? '27' : 'T'} />
        <h3>{group} Blitz</h3>
      </button>)}<button className="card trainer-drill" onClick={() => setMode('single')}><CaseImage category="F2L" id="1" /><h3>Single-case drill</h3></button>
        <button className="card trainer-drill" onClick={() => setMode('custom')}><CaseImage category="PLL" id="T" /><h3>Make your own drill</h3></button>
        <button className="card trainer-drill" onClick={() => setMode('orientation')}><CaseImage category="OLL" id="45" /><h3>Orientation Flashcards</h3></button></div></> : <>
        <div className="d-flex align-items-center gap-3 mb-3">
          <DrillBackButton disabled={busy} back={() => { drill.current = null; setKind(null); setResult(null); }} />
          <h2 className="mb-0">{kind} Blitz <InfoTip>{TOOLTIPS.trainer.blitz}</InfoTip></h2>
        </div>
        {!navigator.bluetooth && <p>Use a browser with Web Bluetooth, such as Chrome or Edge.</p>}
        <section className="card p-3 text-center" aria-label={`${kind} Blitz drill`}>
          {busy && <div className="trainer-drill-controls">
            {current?.phase === 'running' && <><button type="button" className="btn btn-outline-secondary" onClick={() => { current.retry(performance.now()); render(); }}>Retry case</button>
              <button type="button" className="btn btn-outline-secondary" onClick={() => { current.skip(performance.now()); finishDrill(); render(); }}>Skip case</button></>}
            <button type="button" className="btn btn-danger" onClick={() => { current.phase = 'cancelled'; setStatus('Blitz aborted. No result saved.'); render(); }}>Stop drill</button>
            <InfoTip>{TOOLTIPS.trainer.retryAndSkip}</InfoTip>
          </div>}
          {!!previews.length && <div className="trainer-case-queue" aria-label="Current and upcoming cases">
            {previews.map((entry, i) => <div key={`${entry.category}-${entry.id}`} data-auf={entry.auf} data-pre-auf={entry.preAuf} data-post-auf={entry.postAuf} data-color-frame={entry.colorFrame} className={i === 0 ? 'trainer-case-current' : ''}>
              <p>{i === 0 ? 'Current' : `Next ${i}`}</p><BlitzCaseImage cube={cube!} kind={kind} {...entry} hidePLL={kind === 'OLL'} />
              {settings.caseNames && <strong>{entry.category} {entry.id}</strong>}
            </div>)}
          </div>}
          <BlitzClock blitz={current} result={result} changed={render} />
          {current?.phase === 'running' && <><p>Case {current.index + 1} of {current.queue.length}</p>
            {settings.caseNames && !settings.upcomingCases && <strong>{kind} {entry!.id}</strong>}
            <CubeView cube={current.cube} facelets={current.cube.facelets(current.pattern)} moves={current.moves} animateSeeks cross={3} colorFrame={entry!.colorFrame} height={230} hidePLL={kind === 'OLL' && settings.hidePLL} />
            {settings.solutionAlgorithms !== false && <SolutionProgress cube={current.cube} start={current.initialPattern} pattern={current.pattern}
              algorithm={`${entry!.preAuf ?? ''} ${entry!.algorithm} ${entry!.postAuf ?? ''}`.trim()} />}
          </>}
          {!busy && <p id="blitz-prerequisite" role="status">{!connected ? 'Connect a smart cube above to start Blitz.' : !cube ? 'Loading puzzle tools...' : 'Cube connected. Ready for the countdown.'}</p>}
          {!busy ? <button className="btn btn-primary align-self-center" aria-describedby="blitz-prerequisite" disabled={!connected || !cube} onClick={() => {
            try { drill.current = new Blitz(cube!, kind, Math.random, settings); drill.current.start(performance.now()); }
            catch (failure) { setError(failure instanceof Error ? failure.message : 'Could not start Blitz.'); return; }
            setResult(null); setUnsaved(false); setError(''); setStatus(''); render();
          }}>{result ? 'Try again' : 'Start Blitz'}</button> : null}
        </section>
      </>}
      {!mode && kind && status && <p role="status" className="mt-3">{status}</p>}
      {error && <p role="alert" className="mt-3">{error}</p>}
      {result && <section className="card p-3 mt-4" aria-label="Blitz result"><h3>Blitz complete: {result.dnf ? 'DNF' : seconds(result.milliseconds)}</h3>
        {unsaved ? <button className="btn btn-primary" onClick={() => persist(result)}>Retry saving result</button> : <p>Result and case splits saved.</p>}
        <Splits run={result} cube={cube} />
      </section>}
      {!mode && kind && !!visibleRuns.length && <section className="mt-4 trainer-history">
        <div className="d-flex align-items-baseline justify-content-between gap-2 mb-3"><h3 className="h5 mb-0">Blitz history</h3><span className="text-secondary small">{visibleRuns.length} {visibleRuns.length === 1 ? 'run' : 'runs'}</span></div>
        {visibleRuns.map(run => <details className="card trainer-run" key={run.id}>
          <summary>
            <span className="trainer-run-kind">{run.kind} Blitz<span className="small text-secondary">{run.splits.length} attempts</span></span>
            <strong className="trainer-run-time">{run.dnf ? 'DNF' : seconds(run.milliseconds)}{!run.dnf && run.milliseconds === best[run.kind] && <span className="trainer-best">Best</span>}</strong>
            <time dateTime={run.date} title={new Date(run.date).toLocaleString()}>{relativeTime(run.date)}</time>
          </summary>
          <div className="trainer-run-content"><Splits run={run} cube={cube} /></div>
        </details>)}
      </section>}
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
      result?.dnf ? 'DNF' : seconds(result?.milliseconds ?? blitz?.elapsed(performance.now()) ?? 0)}
  </div>;
}
const Splits = memo(function Splits({ run, cube }: { run: BlitzRun; cube: Cube | null }) {
  useContext(SettingsContext);
  const [sort, setSort] = useState<{ column: 'order' | 'caseId' | 'milliseconds' | 'recognitionMilliseconds' | 'executionMilliseconds'; ascending: boolean }>({ column: 'caseId', ascending: true });
  const splits = run.splits.map((split, index) => ({ ...split, retry: split.retry ?? (!!split.dnf && run.splits[index + 1]?.caseId === split.caseId), order: index + 1 })).sort((a, b) => {
    const first = a[sort.column], second = b[sort.column];
    if (first === undefined || second === undefined) return first === second ? 0 : first === undefined ? 1 : -1;
    return (typeof first === 'string' ? first.localeCompare(String(second), undefined, { numeric: true }) : first - Number(second)) * (sort.ascending ? 1 : -1);
  });
  const timings = (['recognitionMilliseconds', 'executionMilliseconds'] as const).map(column =>
    run.splits.every(split => split[column] !== undefined) ? run.splits.reduce((sum, split) => sum + split[column]!, 0) : undefined);
  return <>
    <dl className="trainer-run-settings mt-3" aria-label="Timing breakdown">
      <div><dt>Recognition <InfoTip>{TOOLTIPS.trainer.recognitionTime}</InfoTip></dt><dd>{recordedTime(timings[0])}</dd></div>
      <div><dt>Execution <InfoTip>{TOOLTIPS.trainer.executionTime}</InfoTip></dt><dd>{recordedTime(timings[1])}</dd></div>
    </dl>
    <details className="settings-disclosure trainer-run-options"><summary>Run settings</summary>
    {run.settings ? <dl className="trainer-run-settings">
      <div><dt>Upcoming cases</dt><dd>{run.settings.upcomingCases ? 'Shown' : 'Hidden'}</dd></div>
      <div><dt>Case names shown</dt><dd>{run.settings.caseNames ? 'Yes' : 'No'}</dd></div>
      {run.kind === 'OLL' && <div><dt>PLL stickers</dt><dd>{run.settings.hidePLL ? 'Gray' : 'Shown'}</dd></div>}
      <div><dt>Cross color</dt><dd>{run.settings.crossColor}</dd></div><div><dt>Front color</dt><dd>{run.settings.frontColor}</dd></div>
    </dl> : <p className="text-secondary">Settings were not recorded for this older Blitz.</p>}
    </details>
    <div className="table-responsive trainer-splits-scroll" role="region" aria-label={`${run.kind} case splits`} tabIndex={0}><table className="table table-sm trainer-splits">
      <caption className="visually-hidden">{run.kind} Blitz case timings</caption>
      <thead><tr>{([['order', 'Order'], ['caseId', 'Case'], ['recognitionMilliseconds', 'Recognition'], ['executionMilliseconds', 'Execution'], ['milliseconds', 'Split']] as const).map(([column, label]) =>
      <th key={column} scope="col" aria-sort={sort.column === column ? sort.ascending ? 'ascending' : 'descending' : 'none'}>
        <button className="trainer-sort" onClick={() => setSort({ column, ascending: sort.column === column ? !sort.ascending : true })}>
          {label}{sort.column === column ? sort.ascending ? ' \u2191' : ' \u2193' : ''}
        </button>
      </th>)}</tr></thead><tbody>
      {splits.map(split => <tr key={split.order}><td>{split.order}</td><td><div className="d-flex align-items-center gap-2">
        {cube && <BlitzCaseImage cube={cube} kind={run.kind} id={split.caseId} {...split} hidePLL={run.kind === 'OLL'} />}
        <span><strong>{run.kind} {split.caseId}</strong>{(split.preAuf !== undefined || split.auf !== undefined || split.crossColor) && <details className="trainer-case-setup"><summary>Setup</summary>{split.preAuf !== undefined ? <>
          <small className="d-block text-secondary">Pre-AUF: {split.preAuf || 'None'}</small>
          <small className="d-block text-secondary">Post-AUF: {split.postAuf || 'None'}</small>
        </> : split.auf !== undefined && <small className="d-block text-secondary">AUF: {split.auf || 'None'}</small>}
          {split.crossColor && <small className="d-block text-secondary">{split.crossColor} cross / {split.frontColor} front</small>}</details>}</span>
      </div></td><td>{recordedTime(split.recognitionMilliseconds)}</td><td>{recordedTime(split.executionMilliseconds)}</td><td>{split.dnf ? `${split.retry ? 'Retry' : 'Skipped'} - DNF (${seconds(split.milliseconds)})` : seconds(split.milliseconds)}</td></tr>)}
    </tbody></table></div>
  </>;
});
