import { lazy, Suspense, useRef } from 'react';
import { usePageDialog } from '@cuberplus/navigation';

const Database = lazy(() => import('./Database'));

export function CaseModal({ caseKey, close }: { caseKey: string; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  usePageDialog(dialog);
  return <dialog ref={dialog} className="panel replay-dialog case-dialog" aria-label={`Algorithm case ${caseKey.replace('-', ' ')}`}
    onCancel={event => { event.preventDefault(); close(); }}>
    <div className="d-flex justify-content-between align-items-center mb-3">
      <h2 className="h5 mb-0">Algorithm case</h2><button autoFocus className="btn-close" aria-label="Close algorithm case" onClick={close} />
    </div>
    <Suspense fallback={<p role="status">Loading case...</p>}><Database caseKey={caseKey} /></Suspense>
  </dialog>;
}
