import { useRef, useState } from 'react';
import { usePageDialog } from '@cuberplus/navigation';
import { InfoTip } from '../../../shared/Components/InfoTip';
import { dataTask } from '../../../shared/workers/dataClient';
import type { DataProgress } from '../../../shared/workers/dataTasks';

export function ImportOptions() {
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [error, setError] = useState(false);
  const [progress, setProgress] = useState<DataProgress | null>(null);
  const dialog = useRef<HTMLDialogElement>(null), cancel = useRef<() => void>();
  usePageDialog(dialog, busy && progress !== null);
  async function reanalyze() {
    if (busy) return;
    setBusy(true); setMessage(''); setError(false);
    setProgress({ processed: 0, total: 0, analyzed: 0, skipped: 0, failed: 0, remainingMs: null });
    try {
      const task = dataTask({ type: 'reanalyze' }, setProgress); cancel.current = task.cancel;
      const result = await task.promise;
      if (!('analyzed' in result)) throw new Error('Invalid reanalysis result.');
      setMessage(`Re-analyzed ${result.analyzed} solves; skipped ${result.skipped}; failed ${result.failed}.`);
    } catch (failure) { setError(true); setMessage(`${failure instanceof Error ? failure.message : 'Reanalysis failed.'} Completed batches were retained.`); }
    finally {
      cancel.current = undefined; setBusy(false); setProgress(null);
      window.dispatchEvent(new CustomEvent('timer-solves-changed', { detail: { reanalyzed: true } }));
    }
  }
  async function importFiles(files: File[]) {
    if (!files.length || busy) return;
    setBusy(true); setMessage(''); setError(false);
    try {
      const result = await dataTask({ type: 'import', files }).promise;
      if (!('added' in result)) throw new Error('Invalid import result.');
      window.dispatchEvent(new Event('timer-solves-changed'));
      setMessage(`Imported ${result.added} solves; skipped ${result.duplicates} duplicates.`);
    } catch (failure) { setError(true); setMessage(failure instanceof Error ? failure.message : 'CSV import failed.'); }
    finally { setBusy(false); }
  }
  return <section className="settings-section" aria-labelledby="import-heading">
    <h3 id="import-heading" className="d-flex align-items-center">Import solves<InfoTip>Merge Cubeast or Acubemy CSV exports into your local solve database. Existing solves and source labels are kept; duplicate source IDs are skipped. Valid original move recordings are retained for replay and reanalysis.</InfoTip></h3>
    <label className={`btn btn-outline-primary ${busy ? 'disabled' : ''}`}>{busy ? 'Importing...' : 'Import Cubeast / Acubemy CSV'}
      <input className="visually-hidden" aria-label="Import solve CSV files" type="file" accept=".csv,text/csv" multiple disabled={busy}
        onChange={event => { void importFiles(Array.from(event.target.files ?? [])); event.target.value = ''; }} />
    </label>
    <div className="d-flex align-items-center mt-3">
      <button className="btn btn-outline-primary" disabled={busy} onClick={() => void reanalyze()}>Re-analyze all solves</button>
      <InfoTip>Rebuild CFOP steps, case labels, cross color and first pair from saved move recordings without changing original times, sessions or moves. Solves without recordings and non-CFOP imports are skipped. Missing inspection time cannot be recovered. Completed batches are kept if cancelled.</InfoTip>
    </div>
    <dialog ref={dialog} className="panel options-dialog" aria-labelledby="reanalysis-heading" onCancel={event => event.preventDefault()}>
      <h3 id="reanalysis-heading">Re-analyzing solves</h3>
      {progress && <>
        <progress className="w-100" aria-label="Reanalysis progress" max={progress.total || 1} value={progress.total ? progress.processed : undefined} />
        <p role="status">{progress.processed} / {progress.total} solves. {progress.remainingMs === null ? 'Estimating time remaining...' : `About ${Math.ceil(progress.remainingMs / 1000)} seconds remaining.`}</p>
        <p>{progress.analyzed} analyzed; {progress.skipped} skipped; {progress.failed} failed.</p>
      </>}
      <button className="btn btn-outline-secondary" onClick={() => cancel.current?.()}>Cancel</button>
    </dialog>
    {message && <p role={error ? 'alert' : 'status'} className={error ? 'text-danger' : ''}>{message}</p>}
  </section>;
}
