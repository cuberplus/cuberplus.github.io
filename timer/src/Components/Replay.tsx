import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { getDnfReason, getPenaltyReasons, setPenalty, solveTime, type Solve } from '../Core/engine';
import { Cube, movesOf } from '../Core/puzzle';
import { CubeView } from './CubeView';
import { deleteSolve, formatTime, turns } from '../Data/storage';
import { analyzeCFOP, cfopFrame, cfopRotation, CFOP_STEPS, elapsedAt, f2lPair } from '../Analysis/cfop';
import { pairEmojis } from '../../../shared/cube/f2l';
import { SettingsContext, usePageDialog } from '@cuberplus/navigation';
import { SolveMistakes } from './SolveMistakes';
import { SolveTimeline } from './SolveTimeline';
import { CaseModal } from '../../../src/database/CaseModal';
import { sourceLabel } from '../Data/csvImport';
import { InfoTip } from '../../../shared/Components/InfoTip';
import { algorithms, databaseCaseKey, databaseCaseKeys } from '../../../src/database/algorithms';
import { caseKeyLabel } from '../../../src/database/caseLabels';
import { persistReplayAnalysis, reanalyzeSolve } from '../Analysis/analysis';
import '../CSS/Replay.css';
import { solvePairChoices, stepPieces } from '../Analysis/f2lSuggestions';
import { TOOLTIPS } from '../../../shared/tooltips';
import { ShareButton } from '../../../src/sharing/ShareButton';
import { singleSnapshot } from '../../../src/sharing/snapshot';
import { ActionIcon } from '../../../shared/Components/ActionIcon';

export function Replay({ cube, solve, history, close, change, remove, retry, retryDisabled = false, readOnly = false, precision = 2, saveError }: { cube: Cube; solve: Solve; history?: Solve[] | (() => Promise<Solve[]>); close: () => void; change?: (solve: Solve) => void; remove?: (solve: Solve) => Promise<void>; retry?: (solve: Solve) => void; retryDisabled?: boolean; readOnly?: boolean; precision?: 2 | 3; saveError?: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [position, setPosition] = useState(0);
  const [cursor, setCursor] = useState(0);
  const [seekVersion, setSeekVersion] = useState(0);
  const playhead = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const { replayHighlight: highlightMode } = useContext(SettingsContext);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [caseKey, setCaseKey] = useState('');
  const [analysisError, setAnalysisError] = useState('');
  const [insightsOpen, setInsightsOpen] = useState(false);
  const reanalyze = (crossOverride: number | undefined) => {
    try { setAnalysisError(''); change?.(reanalyzeSolve(solve, cube, crossOverride)); }
    catch (failure) { setAnalysisError(failure instanceof Error ? failure.message : 'Unable to analyze solve.'); }
  };
  const moves = useMemo(() => solve.moves.map(turn => turn.move), [solve]);
  const timestamps = useMemo(() => solve.moves.map((_, i) => elapsedAt(solve, i + 1)), [solve]);
  const { cross, ends, cases, pairs } = useMemo(() => analyzeCFOP(solve, cube), [solve, cube]);
  useEffect(() => { if (!readOnly) void persistReplayAnalysis(solve, cube).catch(() => {}); }, [solve, cube, readOnly]);
  const rotation = useMemo(() => cfopRotation(cube, cross, pairs[0]), [cube, cross, pairs]);
  const choices = useMemo(() => highlightMode === 'suggested' ? solvePairChoices(solve, cube) : [], [solve, cube, highlightMode]);
  const step = ends.findIndex(end => end > position);
  const highlight = useMemo(() => {
    if (highlightMode === 'none' || step < 0 || step >= 5) return {};
    const corner = highlightMode === 'suggested' && step > 0 && step < 5
      ? choices.find(choice => choice.step === step)?.ranked[0]?.corner : pairs[step - 1];
    return stepPieces(cross, step, corner);
  }, [highlightMode, step, cross, pairs, choices]);
  const visible = usePageDialog(dialog);
  const hasReplay = !solve.imported || solve.moves.length > 0;
  const seekPosition = (next: number) => {
    setPlaying(false); setPosition(next);
    setSeekVersion(version => version + 1);
    playhead.current = next ? timestamps[next - 1] : 0;
    setCursor(playhead.current);
  };
  const dismiss = () => { dialog.current?.close(); close(); };
  async function removeSolve() {
    if (!window.confirm('Are you sure you want to delete this solve? This cannot be undone.')) return;
    setDeleting(true); setDeleteError('');
    try { await (remove ? remove(solve) : deleteSolve(solve.id)); dismiss(); }
    catch (error) { setDeleteError(error instanceof Error ? error.message : 'Unable to delete solve.'); setDeleting(false); }
  }
  const steps = useMemo(() => {
    const frame = cfopFrame(cube, rotation);
    let importedEnd = 0, importedTime = 0;
    return (solve.imported ? solve.imported.steps.map(step => step.name) : CFOP_STEPS).map((name, step) => {
      const start = solve.imported ? importedEnd : step ? ends[step - 1] ?? solve.moves.length : 0;
      importedTime += (solve.imported?.steps[step]?.time ?? 0) * 1000;
      const end = solve.imported ? step === solve.imported.steps.length - 1 ? solve.moves.length
        : solve.moves.reduce((last, turn, i) => turn.elapsed <= importedTime + 1 ? i + 1 : last, start)
        : step === 6 ? solve.moves.length : ends[step] ?? solve.moves.length;
      importedEnd = end;
      const groups: { notation: string; start: number; end: number; amount: number }[] = [];
      for (let i = start; i < end; i++) {
        const notation = frame(solve.moves[i].move), amount = notation.includes('2') ? 2 : notation.endsWith("'") ? -1 : 1;
        const previous = groups.at(-1);
        if (previous?.notation === notation) { previous.end = i + 1; previous.amount += amount; }
        else groups.push({ notation, start: i, end: i + 1, amount });
      }
      const caseName = (step > 0 && step < 5 && solve.moves.length ? cases[step] : '') || (solve.imported?.steps[step]?.case ?? cases[step]);
      const caseSet = name === 'PLL' ? 'PLL' : name === 'OLL' ? 'OLL' : 'F2L', key = databaseCaseKey(caseSet, caseName ?? '');
      const caseKeys = (name === 'PLL' || name === 'OLL' || name.startsWith('F2L Slot')) ?
        databaseCaseKeys(caseSet, caseName ?? '').filter(key => algorithms.some(entry => `${entry.category}-${entry.id}` === key)) : [];
      return {
        name: name.replace('Slot', 'Pair'),
        pair: step > 0 && step < 5 ? f2lPair(pairs[step - 1], cross) : '',
        case: !caseName ? '' : caseName === 'Solved' ? 'Solved' : caseSet === 'PLL' ? `${caseName} perm` : caseKeyLabel(key),
        caseKey: caseKeys.length === 1 ? caseKeys[0] : '', caseKeys,
        importedMoves: solve.imported?.steps[step]?.moves,
        empty: step > ends.length ? 'Not reached' : ends[step] === undefined ? 'No moves recorded' : 'Skipped',
        groups: groups.map(group => ({ ...group, move: group.notation[0] + ['4', '', '2', "'"][(group.amount % 4 + 4) % 4] })),
      };
    });
  }, [ends, cases, solve, cube, rotation, pairs, cross]);
  useEffect(() => {
    const pause = () => { if (document.hidden) setPlaying(false); };
    document.addEventListener('visibilitychange', pause);
    return () => document.removeEventListener('visibilitychange', pause);
  }, []);
  useEffect(() => {
    if (!visible || !playing || !solve.moves.length) { setPlaying(false); return; }
    const started = performance.now(), from = playhead.current;
    let frame: number;
    const advance = (now: number) => {
      playhead.current = Math.min(solve.duration, from + (now - started) * speed);
      setCursor(playhead.current);
      setPosition(timestamps.reduce((count, time) => time <= playhead.current ? count + 1 : count, 0));
      if (playhead.current >= solve.duration) setPlaying(false);
      else frame = requestAnimationFrame(advance);
    };
    frame = requestAnimationFrame(advance);
    return () => cancelAnimationFrame(frame);
  }, [playing, speed, solve, timestamps, visible]);
  const facelets = useMemo(() => cube.facelets(cube.parse(solve.startFacelets).applyAlg(moves.slice(0, position).join(' '))), [cube, solve.startFacelets, moves, position]);
  return <dialog ref={dialog} className="panel replay-dialog" aria-label="Solve replay" onCancel={event => { event.preventDefault(); if (!deleting) dismiss(); }}>
    <div className="replay-header">
      <div className="replay-summary">
        <h2 className="replay-title">Solve replay</h2>
        <strong className="replay-time" aria-label="Solve time">{formatTime(solveTime(solve), precision)}s</strong>
        <span className="d-inline-flex align-items-baseline gap-3 flex-wrap">
          <span>{turns(solve)} turns</span>
          {solve.duration > 0 && <span>{(turns(solve) * 1000 / solve.duration).toFixed(2)} TPS</span>}
        </span>
        <span className="small text-secondary" aria-label="Solve date">{new Date(solve.createdAt).toLocaleString()}</span>
      </div>
      <button autoFocus className="btn-close" aria-label="Close replay" disabled={deleting} onClick={dismiss} />
    </div>
    {deleteError && <p className="alert alert-danger" role="alert">{deleteError}</p>}
    {saveError && <p className="alert alert-danger" role="alert">{saveError}</p>}
    <div className="replay-scramble">
      <div><h3 className="h6 mb-1">Scramble</h3><p className="scramble mb-0">{movesOf(solve.scramble).join(' ')}</p></div>
      {hasReplay && !readOnly && (retry
        ? <button className="btn btn-outline-primary" disabled={deleting || retryDisabled} onClick={() => { dismiss(); retry(solve); }}>Retry</button>
        : <a className={`btn btn-outline-primary${deleting ? ' disabled' : ''}`} aria-disabled={deleting || undefined} tabIndex={deleting ? -1 : undefined} href={`/timer/?retry=${encodeURIComponent(solve.id)}`} onClick={event => { if (deleting) event.preventDefault(); else dismiss(); }}>Retry</a>)}
    </div>
    {hasReplay && <section className="replay-playback" aria-label="Playback"><CubeView cube={cube} facelets={facelets} moves={moves} position={position} speed={speed} playback seekVersion={seekVersion} cross={cross} rotation={rotation} height={220} highlight={highlight} />
    <div className="replay-controls">
      <button className="btn btn-primary" disabled={!solve.moves.length} onClick={() => { if (position >= solve.moves.length) seekPosition(0); setPlaying(!playing); }}>{playing ? 'Pause' : 'Play'}</button>
      <button className="btn btn-outline-secondary" disabled={position === 0} onClick={() => seekPosition(position - 1)}>Previous move</button>
      <button className="btn btn-outline-secondary" disabled={position >= solve.moves.length} onClick={() => seekPosition(position + 1)}>Next move</button>
      <select className="form-select replay-speed" aria-label="Replay speed" value={speed} onChange={event => setSpeed(Number(event.target.value))}>
        {[0.25, 0.5, 1, 2, 4].map(value => <option key={value} value={value}>{value}x</option>)}
      </select>
      <span className="replay-position">{position}/{solve.moves.length} moves - {formatTime(cursor, precision)}s</span>
    </div></section>}
    <section className="replay-section"><h3>Step timing</h3>
    <SolveTimeline cube={cube} solve={solve} elapsed={solve.duration} precision={precision} position={position} cursor={cursor} seekMove={hasReplay ? seekPosition : undefined}
      seek={hasReplay && solve.moves.length ? time => seekPosition(time < 0 ? 0 : timestamps.reduce((closest, stamp, i) => Math.abs(stamp - time) <= Math.abs((timestamps[closest - 1] ?? 0) - time) ? i + 1 : closest, 0)) : undefined} />
    </section>
    <div className="replay-disclosure-row replay-section"><details className="replay-disclosure"><summary>Solution moves</summary>
    <div className="move-timeline" role="group" aria-label="Solution steps">{steps.map((step, index) => <div key={`${index}-${step.name}`} role="group" aria-label={`${step.name} solution`} className="mb-2">
      <div className="d-flex align-items-baseline gap-2">
        <h3 className="replay-step-name">{step.caseKey ? <button type="button" className="replay-case-link" aria-label={`${step.name}: open ${step.case} case`} onClick={() => { setPlaying(false); setCaseKey(step.caseKey); }}>{step.name}</button> : step.name}</h3>
        {step.case && (step.caseKeys.length
          ? step.caseKeys.map(key => <button key={key} className="badge text-bg-secondary border-0" aria-label={`${step.name}${step.caseKeys.length > 1 ? ` ${caseKeyLabel(key)}` : ''} case`} onClick={() => { setPlaying(false); setCaseKey(key); }}>{step.caseKeys.length === 1 ? step.case : caseKeyLabel(key)}</button>)
          : <span className="badge text-bg-secondary" aria-label={`${step.name} case`}>{step.case}</span>)}
        {step.pair && <span role="img" aria-label={`${step.pair.replace('/', ' / ')} pair`} title={step.pair.replace('/', ' / ')}>{pairEmojis(step.pair)}</span>}
      </div>
      {hasReplay && step.name === 'Cross' && rotation && <span className="move" aria-label="Initial rotation">{rotation}</span>}
      {!hasReplay ? <span>{step.importedMoves || 'No moves reported'}</span> : step.groups.length ? step.groups.map(group => {
        const current = position === 0 ? group.start === 0 : group.start < position && position <= group.end;
        return <button key={group.start} className={`move ${group.end <= position ? 'done' : ''} ${current ? 'current' : ''} ${current && position > group.start && position < group.end ? 'partial' : ''}`}
          title={TOOLTIPS.replay.moveTime(formatTime(timestamps[group.end - 1], precision))} aria-current={current ? 'step' : undefined}
          aria-label={`${group.move}, recorded moves ${group.start + 1} to ${group.end}: ${solve.moves.slice(group.start, group.end).map(move => move.move).join(' ')}`}
          onClick={() => seekPosition(group.end)}>{group.move}</button>;
      }) : <span className="small text-secondary">{step.empty}</span>}
    </div>)}</div>
    </details><InfoTip>{TOOLTIPS.replay.timeline}</InfoTip></div>
    {solve.status === 'incomplete' && <p className="text-warning mt-2" aria-label="Penalty reason">DNF reason: {getDnfReason(solve)}</p>}
    {!!solve.penalty && <p className="text-warning mt-2" aria-label="Penalty reason">+{solve.penalty / 1000} {solve.penalty === 2000 ? 'reason' : 'reasons'}: {getPenaltyReasons(solve).join(', ')}</p>}
    {solve.reason && solve.reason !== 'Solve aborted by user.' && <p className="text-secondary small mt-2">{solve.reason}</p>}
    <details className="replay-disclosure replay-section" onToggle={event => setInsightsOpen(event.currentTarget.open)}><summary>Insights</summary>{insightsOpen && <SolveMistakes cube={cube} solve={solve} history={history} />}</details>
    {change && <div className="replay-disclosure-row replay-section"><details className="replay-disclosure"><summary>Analysis settings</summary>
    <div className="d-flex gap-2 align-items-center flex-wrap mt-3">
      <button className="btn btn-outline-primary" disabled={deleting} onClick={() => reanalyze(solve.crossOverride)}>Re-run analysis</button>
      {hasReplay && <label className="d-flex gap-2 align-items-center">Base cross color
        <select className="form-select w-auto" aria-label="Base cross color" disabled={deleting} value={solve.crossOverride ?? ''}
          onChange={event => reanalyze(event.target.value === '' ? undefined : Number(event.target.value))}>
          <option value="">Automatic</option>
          {['White', 'Red', 'Green', 'Yellow', 'Orange', 'Blue'].map((color, face) => <option key={color} value={face}>{color}</option>)}
        </select>
      </label>}
    </div></details><InfoTip>{TOOLTIPS.replay.reanalysis}</InfoTip></div>}
    {analysisError && <p role="alert" className="alert alert-warning">{analysisError}</p>}
    {caseKey && <CaseModal caseKey={caseKey} close={() => setCaseKey('')} />}
    <div className="replay-actions" role="group" aria-label="Solve penalties and deletion">
      <ShareButton label="Share" load={() => singleSnapshot(solve)} disabled={deleting || solve.status === 'active'} />
      {!readOnly && <div className="replay-edit-actions">
      {change && <>
        <button className={`btn ${getPenaltyReasons(solve).includes('manual') ? 'btn-warning' : 'btn-outline-warning'}`}
          aria-pressed={getPenaltyReasons(solve).includes('manual')} disabled={deleting || (solve.status !== 'complete' && solve.dnfReason !== 'manual')}
          onClick={() => change(setPenalty({ ...solve }, 'manual', !getPenaltyReasons(solve).includes('manual')))}>+2</button>
        <button className={`btn ${solve.dnfReason === 'manual' ? 'btn-warning' : 'btn-outline-warning'}`}
          aria-pressed={solve.dnfReason === 'manual'} disabled={deleting || (solve.status !== 'complete' && solve.dnfReason !== 'manual')}
          onClick={() => change({ ...solve, status: solve.dnfReason === 'manual' ? 'complete' : 'incomplete', dnfReason: solve.dnfReason === 'manual' ? undefined : 'manual' })}>DNF</button>
      </>}
      <button className="btn btn-outline-danger" disabled={deleting} onClick={removeSolve}><ActionIcon action="delete" />{deleting ? 'Deleting...' : 'Delete'}</button>
      </div>}
    </div>
    <div className="replay-disclosure-row replay-recording"><details className="replay-disclosure"><summary>Recording details</summary>
    <div className="d-grid gap-2 small text-secondary text-break mt-3">
      <span aria-label="Inspection time">Inspection: {solve.inspection === undefined ? 'Not recorded' : `${formatTime(solve.inspection, precision)}s`}</span>
      <span aria-label="Solve ID">Solve ID: <span className="font-monospace">{solve.id}</span></span>
      <span aria-label="Solve source">{sourceLabel(solve)}</span>
    </div></details>{solve.imported && <InfoTip>{hasReplay ? TOOLTIPS.replay.recording : TOOLTIPS.replay.recordingAlternative}</InfoTip>}</div>
  </dialog>;
}
