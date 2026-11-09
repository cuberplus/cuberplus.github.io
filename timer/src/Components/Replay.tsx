import { useEffect, useMemo, useRef, useState } from 'react';
import { getDnfReason, getPenaltyReasons, setPenalty, solveTime, type Solve } from '../Core/engine';
import { Cube, movesOf } from '../Core/puzzle';
import { CubeView } from './CubeView';
import { deleteSolve, formatTime, turns } from '../Data/storage';
import { analyzeCFOP, cfopFrame, cfopRotation, CFOP_STEPS, elapsedAt, f2lPair } from '../Analysis/cfop';
import { pairEmojis } from '../../../shared/cube/f2l';
import { usePageDialog } from '@cuberplus/navigation';
import { SolveMistakes } from './SolveMistakes';
import { SolveTimeline } from './SolveTimeline';
import { CaseModal } from '../../../src/database/CaseModal';
import { sourceLabel } from '../Data/csvImport';
import { InfoTip } from '../../../shared/Components/InfoTip';
import { algorithms } from '../../../src/database/algorithms';
import { persistReplayAnalysis, reanalyzeSolve } from '../Analysis/analysis';
import '../CSS/Replay.css';

export function Replay({ cube, solve, history, close, change, remove, retry, retryDisabled = false, precision = 2, saveError }: { cube: Cube; solve: Solve; history?: Solve[]; close: () => void; change?: (solve: Solve) => void; remove?: (solve: Solve) => Promise<void>; retry?: (solve: Solve) => void; retryDisabled?: boolean; precision?: 2 | 3; saveError?: string }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [position, setPosition] = useState(0);
  const [cursor, setCursor] = useState(0);
  const [seekVersion, setSeekVersion] = useState(0);
  const playhead = useRef(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [caseKey, setCaseKey] = useState('');
  const [analysisError, setAnalysisError] = useState('');
  const reanalyze = (crossOverride: number | undefined) => {
    try { setAnalysisError(''); change?.(reanalyzeSolve(solve, cube, crossOverride)); }
    catch (failure) { setAnalysisError(failure instanceof Error ? failure.message : 'Unable to analyze solve.'); }
  };
  const moves = useMemo(() => solve.moves.map(turn => turn.move), [solve]);
  const timestamps = useMemo(() => solve.moves.map((_, i) => elapsedAt(solve, i + 1)), [solve]);
  const { cross, ends, cases, pairs } = useMemo(() => analyzeCFOP(solve, cube), [solve, cube]);
  useEffect(() => { void persistReplayAnalysis(solve, cube).catch(() => {}); }, [solve, cube]);
  const rotation = useMemo(() => cfopRotation(cube, cross, pairs[0]), [cube, cross, pairs]);
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
      const caseName = solve.imported?.steps[step]?.case ?? cases[step], caseSet = name === 'PLL' ? 'PLL' : name === 'OLL' ? 'OLL' : 'F2L';
      return {
        name: name.replace('Slot', 'Pair'),
        pair: step > 0 && step < 5 ? f2lPair(pairs[step - 1], cross) : '',
        case: !caseName ? '' : caseName === 'Solved' ? 'Solved' : caseSet === 'PLL' ? `${caseName} perm` : `${caseSet} ${caseName}`,
        caseKey: (name === 'PLL' || name === 'OLL' || name.startsWith('F2L Slot')) && algorithms.some(entry => entry.category === caseSet && entry.id === caseName) ? `${caseSet}-${caseName}` : '',
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
        <strong className="replay-time" aria-label="Solve time">{formatTime(solveTime(solve), precision)}s</strong>
        <span className="d-inline-flex align-items-baseline gap-3 flex-wrap">
          <span>{turns(solve)} turns</span>
          <span className="small text-secondary" aria-label="Inspection time">Inspection: {solve.inspection === undefined ? 'Not recorded' : `${formatTime(solve.inspection, precision)}s`}</span>
          <span className="small text-secondary" aria-label="Solve date">{new Date(solve.createdAt).toLocaleString()}</span>
        </span>
      </div>
      <div className="d-flex gap-2">
        <button autoFocus className="btn-close" aria-label="Close replay" disabled={deleting} onClick={dismiss} />
      </div>
      <div className="d-flex gap-2 mb-3" role="group" aria-label="Solve penalties and deletion">
        {change && <>
          <button className={`btn ${getPenaltyReasons(solve).includes('manual') ? 'btn-warning' : 'btn-outline-warning'}`}
            aria-pressed={getPenaltyReasons(solve).includes('manual')} disabled={deleting || (solve.status !== 'complete' && solve.dnfReason !== 'manual')}
            onClick={() => change(setPenalty({ ...solve }, 'manual', !getPenaltyReasons(solve).includes('manual')))}>+2</button>
          <button className={`btn ${solve.dnfReason === 'manual' ? 'btn-warning' : 'btn-outline-warning'}`}
            aria-pressed={solve.dnfReason === 'manual'} disabled={deleting || (solve.status !== 'complete' && solve.dnfReason !== 'manual')}
            onClick={() => change({ ...solve, status: solve.dnfReason === 'manual' ? 'complete' : 'incomplete', dnfReason: solve.dnfReason === 'manual' ? undefined : 'manual' })}>DNF</button>
        </>}
        <button className="btn btn-outline-danger" disabled={deleting} onClick={removeSolve}>{deleting ? 'Deleting...' : 'Delete'}</button>
      </div>
    </div>
    {deleteError && <p className="alert alert-danger" role="alert">{deleteError}</p>}
    {saveError && <p className="alert alert-danger" role="alert">{saveError}</p>}
    <div className="replay-scramble">
      <p className="scramble mb-0">{movesOf(solve.scramble).join(' ')}</p>
      {hasReplay && (retry
        ? <button className="btn btn-outline-primary" disabled={deleting || retryDisabled} onClick={() => { dismiss(); retry(solve); }}>Retry</button>
        : <a className={`btn btn-outline-primary${deleting ? ' disabled' : ''}`} aria-disabled={deleting || undefined} tabIndex={deleting ? -1 : undefined} href={`/timer/?retry=${encodeURIComponent(solve.id)}`} onClick={event => { if (deleting) event.preventDefault(); else dismiss(); }}>Retry</a>)}
    </div>
    {hasReplay && <><CubeView cube={cube} facelets={facelets} moves={moves} position={position} speed={speed} playback seekVersion={seekVersion} cross={cross} rotation={rotation} />
    <div className="d-flex gap-2 align-items-center flex-wrap">
      <button className="btn btn-primary" disabled={!solve.moves.length} onClick={() => { if (position >= solve.moves.length) seekPosition(0); setPlaying(!playing); }}>{playing ? 'Pause' : 'Play'}</button>
      <button className="btn btn-outline-secondary" disabled={position === 0} onClick={() => seekPosition(position - 1)}>Previous move</button>
      <button className="btn btn-outline-secondary" disabled={position >= solve.moves.length} onClick={() => seekPosition(position + 1)}>Next move</button>
      <select className="form-select replay-speed" aria-label="Replay speed" value={speed} onChange={event => setSpeed(Number(event.target.value))}>
        {[0.25, 0.5, 1, 2, 4].map(value => <option key={value} value={value}>{value}x</option>)}
      </select>
      <span>{position}/{solve.moves.length} moves - {formatTime(cursor, precision)}s</span>
    </div></>}
    <SolveTimeline cube={cube} solve={solve} elapsed={solve.duration} precision={precision} position={position} cursor={cursor} seekMove={hasReplay ? seekPosition : undefined}
      seek={hasReplay && solve.moves.length ? time => seekPosition(time < 0 ? 0 : timestamps.reduce((closest, stamp, i) => Math.abs(stamp - time) <= Math.abs((timestamps[closest - 1] ?? 0) - time) ? i + 1 : closest, 0)) : undefined} />
    <div className="move-timeline" role="group" aria-label="Solution steps">{steps.map((step, index) => <div key={`${index}-${step.name}`} role="group" aria-label={`${step.name} solution`} className="mb-2">
      <div className="d-flex align-items-baseline gap-2">
        <h3 className="replay-step-name">{step.name}</h3>
        {step.case && (step.caseKey
          ? <button className="badge text-bg-secondary border-0" aria-label={`${step.name} case`} onClick={() => { setPlaying(false); setCaseKey(step.caseKey); }}>{step.case}</button>
          : <span className="badge text-bg-secondary" aria-label={`${step.name} case`}>{step.case}</span>)}
        {step.pair && <span role="img" aria-label={`${step.pair.replace('/', ' / ')} pair`} title={step.pair.replace('/', ' / ')}>{pairEmojis(step.pair)}</span>}
      </div>
      {hasReplay && step.name === 'Cross' && rotation && <span className="move" aria-label="Initial rotation">{rotation}</span>}
      {!hasReplay ? <span>{step.importedMoves || 'No moves reported'}</span> : step.groups.length ? step.groups.map(group => {
        const current = position === 0 ? group.start === 0 : group.start < position && position <= group.end;
        return <button key={group.start} className={`move ${group.end <= position ? 'done' : ''} ${current ? 'current' : ''} ${current && position > group.start && position < group.end ? 'partial' : ''}`}
          title={`${formatTime(timestamps[group.end - 1], precision)}s`} aria-current={current ? 'step' : undefined}
          aria-label={`${group.move}, recorded moves ${group.start + 1} to ${group.end}: ${solve.moves.slice(group.start, group.end).map(move => move.move).join(' ')}`}
          onClick={() => seekPosition(group.end)}>{group.move}</button>;
      }) : <span className="small text-secondary">{step.empty}</span>}
    </div>)}</div>
    {solve.status === 'incomplete' && <p className="text-warning mt-2" aria-label="Penalty reason">DNF reason: {getDnfReason(solve)}</p>}
    {!!solve.penalty && <p className="text-warning mt-2" aria-label="Penalty reason">+{solve.penalty / 1000} {solve.penalty === 2000 ? 'reason' : 'reasons'}: {getPenaltyReasons(solve).join(', ')}</p>}
    {solve.reason && solve.reason !== 'Solve aborted by user.' && <p className="text-secondary small mt-2">{solve.reason}</p>}
    <SolveMistakes cube={cube} solve={solve} history={history} />
    {change && <div className="d-flex gap-2 align-items-center flex-wrap mt-3">
      <button className="btn btn-outline-primary" disabled={deleting} onClick={() => reanalyze(solve.crossOverride)}>Re-run analysis</button>
      {hasReplay && <label className="d-flex gap-2 align-items-center">Base cross color
        <select className="form-select w-auto" aria-label="Base cross color" disabled={deleting} value={solve.crossOverride ?? ''}
          onChange={event => reanalyze(event.target.value === '' ? undefined : Number(event.target.value))}>
          <option value="">Automatic</option>
          {['White', 'Red', 'Green', 'Yellow', 'Orange', 'Blue'].map((color, face) => <option key={color} value={face}>{color}</option>)}
        </select>
      </label>}
      <InfoTip>Re-run analysis to refresh step detection and mistakes. Choosing a cross color recalculates the solve using that base face. Time losses are estimates, not additive; overlapping mistakes can describe the same lost time.</InfoTip>
    </div>}
    {analysisError && <p role="alert" className="alert alert-warning">{analysisError}</p>}
    {caseKey && <CaseModal caseKey={caseKey} close={() => setCaseKey('')} />}
    <div className="d-flex align-items-baseline gap-3 flex-wrap small text-secondary text-break mt-3">
      <span aria-label="Solve ID">Solve ID: <span className="font-monospace">{solve.id}</span></span>
      <span aria-label="Solve source">{sourceLabel(solve)}{solve.imported && <InfoTip>{hasReplay ? 'Replay rebuilt from exported moves and timestamps; original device clock data is not available. Imported step analysis is preserved.' : 'Imported step analysis is preserved. This CSV has no valid timed recording to replay.'}</InfoTip>}</span>
    </div>
  </dialog>;
}
