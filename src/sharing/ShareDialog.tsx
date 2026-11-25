import { useEffect, useId, useRef, useState } from 'react';
import { usePageDialog } from '@cuberplus/navigation';
import { InfoTip } from '../../shared/Components/InfoTip';
import { prepareProvider } from '../cloud/providers';
import { connectSharing, deleteShare, publishShare, shareUrl, sharingConfigured, type PublishedShare } from './drive';
import type { Snapshot } from './snapshot';

export default function ShareDialog({ load, close }: { load: () => Promise<Snapshot>; close: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null), id = useId();
  const [source] = useState(() => load);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null), [published, setPublished] = useState<PublishedShare | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState(''), [status, setStatus] = useState('');
  usePageDialog(dialog);
  useEffect(() => {
    let active = true;
    void source().then(value => { if (active) setSnapshot(value); }).catch(failure => { if (active) setError(failure instanceof Error ? failure.message : 'Unable to prepare snapshot.'); });
    if (sharingConfigured()) void prepareProvider('google').catch(() => {});
    return () => { active = false; };
  }, [source]);
  const dismiss = () => { if (!busy) { dialog.current?.close(); close(); } };
  const url = published ? shareUrl(published) : '';
  return <dialog ref={dialog} className="panel options-dialog" aria-labelledby={`${id}-title`} onCancel={event => { event.preventDefault(); dismiss(); }}>
    <div className="d-flex justify-content-between align-items-center gap-3 mb-3">
      <h2 id={`${id}-title`}>Share {snapshot?.kind === 'solve' ? 'solve' : 'solves'} <InfoTip>Stores each distinct solve once in a public catalog in your own Google Drive. Links show the selected solves, but anyone with a link can also download the catalog's other published solves, including data retained after revoking links. Later edits create a new version without changing old shares. Names, device details, session names and notes are excluded. Your private backup stays private. Google Drive may identify the file owner in its own UI.</InfoTip></h2>
      <button autoFocus className="btn-close" aria-label="Close sharing" disabled={busy} onClick={dismiss} />
    </div>
    {snapshot && <p>{snapshot.rows.length} {snapshot.rows.length === 1 ? 'solve' : 'solves'} selected</p>}
    {!sharingConfigured() && <p role="status">Google Drive sharing is not configured on this site yet.</p>}
    {!published ? <button className="btn btn-primary" disabled={busy || !snapshot || !sharingConfigured()} onClick={() => {
      setBusy(true); setError(''); setStatus('Publishing...');
      void connectSharing().then(() => publishShare(snapshot!)).then(file => { setPublished(file); setStatus('Snapshot published.'); })
        .catch(failure => { setError(failure instanceof Error ? failure.message : 'Publishing failed.'); setStatus(''); }).finally(() => setBusy(false));
    }}>{busy ? 'Publishing...' : 'Publish to my Google Drive'}</button> : <>
      <label className="d-block" htmlFor={`${id}-link`}>Public snapshot link</label>
      <input id={`${id}-link`} className="form-control mb-3" readOnly value={url} onFocus={event => event.currentTarget.select()} />
      <div className="d-flex flex-wrap gap-2">
        <button className="btn btn-primary" disabled={busy} onClick={() => {
          setError('');
          if (!navigator.clipboard) { setStatus('Select and copy the link above.'); return; }
          void navigator.clipboard.writeText(url).then(() => setStatus('Link copied.')).catch(() => setStatus('Select and copy the link above.'));
        }}>Copy link</button>
        <a className="btn btn-outline-primary" href={url} target="_blank" rel="noopener noreferrer">Open shared snapshot</a>
        <button className="btn btn-outline-danger" disabled={busy} onClick={() => {
          setBusy(true); setError('');
          void connectSharing().then(() => deleteShare(published.id)).then(() => { setPublished(null); setStatus('Link revoked. Catalog solves remain public for reuse. Downloaded copies cannot be recalled.'); })
            .catch(failure => setError(failure instanceof Error ? failure.message : 'Unable to revoke sharing.')).finally(() => setBusy(false));
        }}>Revoke link</button>
      </div>
    </>}
    {status && <p role="status" className="mt-3 mb-0">{status}</p>}
    {error && <p role="alert" className="mt-3 mb-0">{error}</p>}
  </dialog>;
}
