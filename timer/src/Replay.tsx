import { useEffect, useMemo, useRef, useState } from 'react';
import { getDnfReason, getPenaltyReasons, setPenalty, solveTime, type Solve } from './engine';
import { Cube, movesOf } from './puzzle';
import { CubeView } from './CubeView';
import { deleteSolve, formatTime, turns } from './storage';
import { analyzeCFOP, cfopFrame, cfopRotation, CFOP_STEPS, f2lPair } from './cfop';
import { pairEmojis } from '../../shared/f2l';
import { usePageDialog } from '@cuberplus/navigation';
import { SolveMistakes } from './SolveMistakes';
import './Replay.css';

export function Replay({ cube, solve, history, close, change, remove, retry, retryDisabled = false, precision = 2 }: { cube: Cube; solve: Solve; history?: Solve[]; close: () => void; change?: (solve: Solve) => void; remove?: (solve: Solve) => Promise<void>; retry?: (solve: Solve) => void; retryDisabled?: boolean; precision?: 2 | 3 }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [position, setPosition] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const moves = useMemo(() => solve.moves.map(turn => turn.move), [solve]);
  const { cross, ends, cases, pairs } = useMemo(() => analyzeCFOP(solve, cube), [solve, cube]);
  const rotation = useMemo(() => cfopRotation(cube, cross, pairs[0]), [cube, cross, pairs]);
  const visible = usePageDialog(dialog);
  const dismiss = () => { dialog.current?.close(); close(); };
  async function removeSolve() {
    if (!window.confirm('Are you sure you want to delete this solve? This cannot be undone.')) return;
    setDeleting(true); setDeleteError('');
    try { await (remove ? remove(solve) : deleteSolve(solve.id)); dismiss(); }
    catch (error) { setDeleteError(error instanceof Error ? error.message : 'Unable to delete solve.'); setDeleting(false); }
  }
  const steps = useMemo(() => {
    const frame = cfopFrame(cube, rotation);
    return CFOP_STEPS.map((name, step) => {
      const start = step ? ends[step - 1] ?? solve.moves.length : 0;
      const end = step === 6 ? solve.moves.length : ends[step] ?? solve.moves.length;
      const groups: { notation: string; start: number; end: number; amount: number }[] = [];
      for (let i = start; i < end; i++) {
        const notation = frame(solve.moves[i].move), amount = notation.includes('2') ? 2 : notation.endsWith("'") ? -1 : 1;
        const previous = groups.at(-1);
        if (previous?.notation === notation) { previous.end = i + 1; previous.amount += amount; }
        else groups.push({ notation, start: i, end: i + 1, amount });
      }
      const caseName = cases[step], caseSet = step === 6 ? 'PLL' : step === 5 ? 'OLL' : 'F2L';
      return {
        name: name.replace('Slot', 'Pair'),
        pair: step > 0 && step < 5 ? f2lPair(pairs[step - 1], cross) : '',
        case: !cases[step] ? '' : cases[step] === 'Solved' ? 'Solved' : step === 6 ? `${cases[step]} perm` : `${step === 5 ? 'OLL' : 'F2L'} ${cases[step]}`,
        caseUrl: caseName && caseName !== 'Solved' && step > 0
          ? `/database/#${caseSet}-${encodeURIComponent(caseName)}` : '',
        empty: step > ends.length ? 'Not reached' : ends[step] === undefined ? 'No moves recorded' : 'Skipped',
        groups: groups.map(group => ({ ...group, move: group.notation[0] + ['4', '', '2', "'"][(group.amount % 4 + 4) % 4] })),
      };
    });
  }, [ends, cases, solve, cube, rotation, pairs, cross]);
  useEffect(() => {
    if (!visible || !playing || position >= solve.moves.length) { setPlaying(false); return; }
    const before = position ? solve.moves[position - 1].elapsed : 0, delay = Math.max(20, (solve.moves[position].elapsed - before) / speed);
    const timeout = setTimeout(() => setPosition(p => p + 1), delay);
    return () => clearTimeout(timeout);
  }, [playing, position, speed, solve, visible]);
  const alg = solve.moves.slice(0, position).map(move => move.move).join(' '), facelets = cube.facelets(cube.parse(solve.startFacelets).applyAlg(alg));
  return <dialog ref={dialog} className="panel replay-dialog" aria-label="Solve replay" onCancel={event => { event.preventDefault(); if (!deleting) dismiss(); }}>
    <div className="replay-header">
      <div className="replay-summary">
        <strong className="replay-time" aria-label="Solve time">{formatTime(solveTime(solve), precision)}s</strong>
        <span className="d-inline-flex align-items-baseline gap-3 flex-wrap">
          <span>{turns(solve)} turns</span>
          <span className="small text-secondary" aria-label="Inspection time">Inspection: {solve.inspection === undefined ? 'Not recorded' : `${formatTime(solve.inspection, precision)}s`}</span>
        </span>
      </div>
      <div className="d-flex gap-2">
        <button className="btn btn-outline-danger" disabled={deleting} onClick={removeSolve}>{deleting ? 'Deleting...' : 'Delete'}</button>
        {retry
          ? <button className="btn btn-outline-primary" disabled={deleting || retryDisabled} onClick={() => { dismiss(); retry(solve); }}>Retry</button>
          : <a className={`btn btn-outline-primary${deleting ? ' disabled' : ''}`} aria-disabled={deleting || undefined} tabIndex={deleting ? -1 : undefined} href={`/timer/?retry=${encodeURIComponent(solve.id)}`} onClick={event => { if (deleting) event.preventDefault(); else dismiss(); }}>Retry</a>}
        <button autoFocus className="btn btn-outline-secondary" disabled={deleting} onClick={dismiss}>Close</button>
      </div>
    </div>
    {deleteError && <p className="alert alert-danger" role="alert">{deleteError}</p>}
    <p className="scramble">{movesOf(solve.scramble).join(' ')}</p>
    <CubeView cube={cube} facelets={facelets} moves={moves} position={position} speed={speed} cross={cross} rotation={rotation} />
    <div className="d-flex gap-2 align-items-center flex-wrap">
      <button className="btn btn-primary" disabled={!solve.moves.length} onClick={() => { if (position >= solve.moves.length) setPosition(0); setPlaying(!playing); }}>{playing ? 'Pause' : 'Play'}</button>
      <button className="btn btn-outline-secondary" disabled={position === 0} onClick={() => { setPlaying(false); setPosition(p => p - 1); }}>Previous move</button>
      <button className="btn btn-outline-secondary" disabled={position >= solve.moves.length} onClick={() => { setPlaying(false); setPosition(p => p + 1); }}>Next move</button>
      <select className="form-select replay-speed" aria-label="Replay speed" value={speed} onChange={event => setSpeed(Number(event.target.value))}>
        {[0.25, 0.5, 1, 2, 4].map(value => <option key={value} value={value}>{value}x</option>)}
      </select>
      <span>{position}/{solve.moves.length} moves - {formatTime(position ? solve.moves[position - 1].elapsed : 0, precision)}s</span>
    </div>
    <input className="form-range mt-3" type="range" min={0} max={solve.moves.length} value={position} aria-label="Replay move" onChange={event => { setPlaying(false); setPosition(Number(event.target.value)); }} />
    <div className="move-timeline" role="group" aria-label="Solution steps">{steps.map(step => <div key={step.name} role="group" aria-label={`${step.name} solution`} className="mb-2">
      <div className="d-flex align-items-baseline gap-2">
        <h3 className="replay-step-name">{step.name}</h3>
        {step.case && (step.caseUrl
          ? <a className="badge text-bg-secondary" aria-label={`${step.name} case`} href={step.caseUrl} target="_blank" rel="noopener noreferrer">{step.case}</a>
          : <span className="badge text-bg-secondary" aria-label={`${step.name} case`}>{step.case}</span>)}
        {step.pair && <span role="img" aria-label={`${step.pair.replace('/', ' / ')} pair`} title={step.pair.replace('/', ' / ')}>{pairEmojis(step.pair)}</span>}
      </div>
      {step.name === 'Cross' && rotation && <span className="move" aria-label="Initial rotation">{rotation}</span>}
      {step.groups.length ? step.groups.map(group => {
        const current = position === 0 ? group.start === 0 : group.start < position && position <= group.end;
        return <button key={group.start} className={`move ${group.end <= position ? 'done' : ''} ${current ? 'current' : ''} ${current && position > group.start && position < group.end ? 'partial' : ''}`}
          title={`${formatTime(solve.moves[group.end - 1].elapsed, precision)}s`} aria-current={current ? 'step' : undefined}
          aria-label={`${group.move}, recorded moves ${group.start + 1} to ${group.end}: ${solve.moves.slice(group.start, group.end).map(move => move.move).join(' ')}`}
          onClick={() => { setPlaying(false); setPosition(group.end); }}>{group.move}</button>;
      }) : <span className="small text-secondary">{step.empty}</span>}
    </div>)}</div>
    {change && <fieldset className="mt-3" disabled={deleting || (solve.status !== 'complete' && solve.dnfReason !== 'manual')}>
      <legend className="h6">Manual penalties</legend>
      <label className="form-check"><input className="form-check-input" type="checkbox" checked={getPenaltyReasons(solve).includes('manual')} onChange={event => change(setPenalty({ ...solve }, 'manual', event.target.checked))} /><span className="form-check-label">Manual +2</span></label>
      <label className="form-check"><input className="form-check-input" type="checkbox" checked={solve.dnfReason === 'manual'} onChange={event => change({ ...solve, status: event.target.checked ? 'incomplete' : 'complete', dnfReason: event.target.checked ? 'manual' : undefined })} /><span className="form-check-label">Manual DNF</span></label>
    </fieldset>}
    {solve.status === 'incomplete' && <p className="text-warning mt-2" aria-label="Penalty reason">DNF reason: {getDnfReason(solve)}</p>}
    {!!solve.penalty && <p className="text-warning mt-2" aria-label="Penalty reason">+{solve.penalty / 1000} {solve.penalty === 2000 ? 'reason' : 'reasons'}: {getPenaltyReasons(solve).join(', ')}</p>}
    {solve.reason && solve.reason !== 'Solve aborted by user.' && <p className="text-secondary small mt-2">{solve.reason}</p>}
    <p className="small text-secondary text-break mt-3 mb-0" aria-label="Solve ID">Solve ID: <span className="font-monospace">{solve.id}</span></p>
    <SolveMistakes cube={cube} solve={solve} history={history} />
  </dialog>;
}
