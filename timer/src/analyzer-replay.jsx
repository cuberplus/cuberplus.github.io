import { useEffect, useRef, useState } from 'react';
import { Replay } from './Replay';
import { readSolves } from './storage';
import { loadCube } from './puzzle';
import './analyzer-replay.css';

export default function AnalyzerReplay({ id, close }) {
  const dialog = useRef(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  useEffect(() => {
    let cancelled = false;
    dialog.current?.showModal();
    Promise.all([readSolves(), loadCube()]).then(([solves, cube]) => {
      const solve = solves.find(solve => solve.id === id && solve.status !== 'active');
      if (!solve) throw new Error('This solve is no longer saved in Timer.');
      if (!cancelled) setData({ solve, cube });
    }).catch(error => { if (!cancelled) setError(error instanceof Error ? error.message : 'Unable to load this solve.'); });
    return () => { cancelled = true; };
  }, [id]);
  return data ? <Replay {...data} close={close} precision={3} /> :
    <dialog ref={dialog} className="replay-dialog" aria-label="Solve replay" onCancel={event => { event.preventDefault(); close(); }}>
      <p role={error ? 'alert' : 'status'}>{error || 'Loading solve replay…'}</p>
      <button autoFocus className="btn btn-outline-secondary" onClick={close}>Close replay</button>
    </dialog>;
}
