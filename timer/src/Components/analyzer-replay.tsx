import { useContext, useEffect, useRef, useState } from 'react';
import { Replay } from './Replay';
import { readSolve, readSolves, saveSolves } from '../Data/storage';
import { loadCube } from '../Core/puzzle';
import type { Cube } from '../Core/puzzle';
import type { Solve } from '../Core/engine';
import { SettingsContext, usePageDialog } from '@cuberplus/navigation';
import type { Solve as AnalyzedSolve } from '../../../smartcubeanalyzer/src/Models/Types';
import { previewSolve } from '../Data/csvImport';

export default function AnalyzerReplay({ id, preview, close }: { id: string; preview?: AnalyzedSolve; close: () => void }) {
  const { precision } = useContext(SettingsContext);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef(document.activeElement);
  const [data, setData] = useState<{ solve: Solve; cube: Cube; readOnly: boolean } | null>(null);
  const [error, setError] = useState('');
  useEffect(() => () => {
    const element = opener.current;
    // Let the nested replay dialog close before restoring its opener.
    if (element instanceof HTMLElement) queueMicrotask(() => { if (element.isConnected) element.focus(); });
  }, []);
  usePageDialog(dialog, !data);
  useEffect(() => {
    let cancelled = false;
    Promise.all([readSolve(id), loadCube()]).then(([saved, cube]) => {
      const solve = saved?.status === 'active' ? undefined : saved;
      if (!solve && !preview) throw new Error('This solve is no longer saved in Timer.');
      if (!cancelled) setData({ solve: solve ?? previewSolve(preview!, cube), cube, readOnly: !solve });
    }).catch(error => { if (!cancelled) setError(error instanceof Error ? error.message : 'Unable to load this solve.'); });
    return () => { cancelled = true; };
  }, [id, preview]);
  const change = (solve: Solve) => {
    setError('');
    if (data?.readOnly) { setData({ ...data, solve }); return; }
    void saveSolves([solve]).then(() => {
      setData(current => current ? { ...current, solve } : null);
      window.dispatchEvent(new Event('timer-solves-changed'));
    }).catch(failure => setError(failure instanceof Error ? failure.message : 'Unable to save solve.'));
  };
  return data ? <Replay {...data} history={readSolves} close={close} precision={precision} change={change} saveError={error} /> :
    <dialog ref={dialog} className="replay-dialog" aria-label="Solve replay" onCancel={event => { event.preventDefault(); close(); }}>
      <div className="d-flex justify-content-between align-items-center">
        <p role={error ? 'alert' : 'status'}>{error || 'Loading solve replay…'}</p>
        <button autoFocus className="btn-close" aria-label="Close replay" onClick={close} />
      </div>
    </dialog>;
}
