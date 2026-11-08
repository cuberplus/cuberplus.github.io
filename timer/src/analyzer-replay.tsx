import { useContext, useEffect, useRef, useState } from 'react';
import { Replay } from './Replay';
import { readSolves, saveSolves } from './storage';
import { loadCube } from './puzzle';
import type { Cube } from './puzzle';
import type { Solve } from './engine';
import { SettingsContext, usePageDialog } from '@cuberplus/navigation';

export default function AnalyzerReplay({ id, close }: { id: string; close: () => void }) {
  const { precision } = useContext(SettingsContext);
  const dialog = useRef<HTMLDialogElement>(null);
  const [data, setData] = useState<{ solve: Solve; cube: Cube; history: Solve[] } | null>(null);
  const [error, setError] = useState('');
  usePageDialog(dialog);
  useEffect(() => {
    let cancelled = false;
    Promise.all([readSolves(), loadCube()]).then(([solves, cube]) => {
      const solve = solves.find(solve => solve.id === id && solve.status !== 'active');
      if (!solve) throw new Error('This solve is no longer saved in Timer.');
      if (!cancelled) setData({ solve, cube, history: solves });
    }).catch(error => { if (!cancelled) setError(error instanceof Error ? error.message : 'Unable to load this solve.'); });
    return () => { cancelled = true; };
  }, [id]);
  const change = (solve: Solve) => {
    setError('');
    void saveSolves([solve]).then(() => {
      setData(current => current ? { ...current, solve, history: current.history.map(item => item.id === solve.id ? solve : item) } : null);
      window.dispatchEvent(new Event('timer-solves-changed'));
    }).catch(failure => setError(failure instanceof Error ? failure.message : 'Unable to save solve.'));
  };
  return data ? <Replay {...data} close={close} precision={precision} change={change} saveError={error} /> :
    <dialog ref={dialog} className="replay-dialog" aria-label="Solve replay" onCancel={event => { event.preventDefault(); close(); }}>
      <div className="d-flex justify-content-between align-items-center">
        <p role={error ? 'alert' : 'status'}>{error || 'Loading solve replay…'}</p>
        <button autoFocus className="btn-close" aria-label="Close replay" onClick={close} />
      </div>
    </dialog>;
}
