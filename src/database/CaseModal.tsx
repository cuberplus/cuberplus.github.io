import { lazy, Suspense, useId, useRef } from 'react';
import { usePageDialog } from '@cuberplus/navigation';
import { algorithms } from './algorithms';
import { caseGroup } from './caseGroups';

const Database = lazy(() => import('./Database'));

export function CaseModal({ caseKey, close }: { caseKey: string; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const entry = algorithms.find(entry => `${entry.category}-${entry.id}` === caseKey), group = entry ? caseGroup(entry) : '';
  const title = `${caseKey.replace('-', ' ')}${group ? ` - ${group.replace(/\b[a-z]/g, letter => letter.toUpperCase())}` : ''}`;
  usePageDialog(dialog);
  const dismiss = () => { dialog.current?.close(); close(); };
  return <dialog ref={dialog} className="panel replay-dialog case-dialog" aria-labelledby={titleId}
    onCancel={event => { event.preventDefault(); dismiss(); }}>
    <div className="d-flex justify-content-between align-items-center mb-3">
      <h2 id={titleId} className="h5 mb-0">{title}</h2><button autoFocus className="btn-close" aria-label="Close algorithm case" onClick={dismiss} />
    </div>
    <Suspense fallback={<p role="status">Loading case...</p>}><Database caseKey={caseKey} /></Suspense>
  </dialog>;
}
