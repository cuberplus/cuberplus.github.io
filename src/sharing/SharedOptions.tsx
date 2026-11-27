import { useId, useState } from 'react';
import { InfoTip } from '../../shared/Components/InfoTip';
import { ActionIcon } from '../../shared/Components/ActionIcon';
import { GoogleLogo } from '../../shared/Components/GoogleLogo';
import { connectSharing, deleteShare, deleteSharedData, disconnectSharing, listShares, shareUrl, sharingConfigured, type PublishedShare } from './drive';

export function SharedOptions({ disabled = false }: { disabled?: boolean } = {}) {
  const [files, setFiles] = useState<PublishedShare[] | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState('');
  const id = useId(), blocked = disabled || busy;
  return <section className="cloud-backup-panel" aria-labelledby={`${id}-sharing`}>
    <h3 id={`${id}-sharing`} className="h6 d-flex align-items-center">Shared solves <InfoTip>A public catalog in your Google Drive stores each distinct published solve once. Average links contain references, not duplicate recordings. Anyone with a link can download other catalog solves. Revoking a link keeps its solves public for reuse; Delete all shared data removes the catalog and every link. Downloaded copies cannot be recalled. Private backups are separate and unchanged. Connect the Google account used to publish.</InfoTip></h3>
    {!sharingConfigured() && <p role="status">Google Drive sharing is not configured on this site yet.</p>}
    <div className="d-flex flex-wrap gap-2 mb-3">
      <button className="btn btn-outline-primary" disabled={blocked || !sharingConfigured()} onClick={() => {
        setBusy(true); setError('');
        void connectSharing().then(listShares).then(setFiles).catch(failure => setError(failure instanceof Error ? failure.message : 'Unable to load shared files.')).finally(() => setBusy(false));
      }}><GoogleLogo />{busy ? 'Loading...' : 'Manage Google Drive shared solves'}</button>
      {files && <button className="btn btn-outline-secondary" disabled={blocked} onClick={() => { disconnectSharing(); setFiles(null); setError(''); }}><GoogleLogo />Disconnect sharing</button>}
      {files && <button className="btn btn-outline-danger" disabled={blocked} onClick={() => {
        if (!window.confirm('Delete every CuberPlus share link and all public catalog solves in this Google Drive account? Private backups will not be changed.')) return;
        setBusy(true); setError('');
        void deleteSharedData().then(() => setFiles([])).catch(failure => setError(failure instanceof Error ? failure.message : 'Unable to delete shared data.')).finally(() => setBusy(false));
      }}><GoogleLogo /><ActionIcon action="delete" />Delete all shared data</button>}
    </div>
    {files?.length === 0 && <p role="status">No published snapshots in this account.</p>}
    {files?.map(file => <div key={file.id} className="d-flex align-items-center flex-wrap gap-2 mb-3">
      <a className="text-break" href={shareUrl(file)} target="_blank" rel="noopener noreferrer">{file.name}</a>
      <button className="btn btn-outline-danger" disabled={blocked} aria-label={`Revoke ${file.name}`} onClick={() => {
        setBusy(true); setError('');
        void deleteShare(file.id).then(() => setFiles(items => items?.filter(item => item.id !== file.id) ?? null))
          .catch(failure => setError(failure instanceof Error ? failure.message : 'Unable to delete shared snapshot.')).finally(() => setBusy(false));
      }}><GoogleLogo /><ActionIcon action="delete" />Revoke link</button>
    </div>)}
    {error && <p role="alert">{error}</p>}
  </section>;
}
