import { lazy, Suspense, useState } from 'react';
import type { Snapshot } from './snapshot';
import { ActionIcon } from '../../shared/Components/ActionIcon';

const ShareDialog = lazy(() => import('./ShareDialog'));
export function ShareButton({ load, label = 'Share solve', disabled = false }: { load: () => Promise<Snapshot>; label?: string; disabled?: boolean }) {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" className="btn btn-outline-primary" disabled={disabled} onClick={() => setOpen(true)}><ActionIcon action="share" />{label}</button>
    {open && <Suspense fallback={<span role="status">Loading sharing...</span>}><ShareDialog load={load} close={() => setOpen(false)} /></Suspense>}
  </>;
}
