import { useRef, useState } from 'react';
import { usePageDialog } from '@cuberplus/navigation';
import { InfoTip } from '../../../shared/Components/InfoTip';
import { dataTask } from '../../../shared/workers/dataClient';
import type { DataProgress, DataTask } from '../../../shared/workers/dataTasks';
import { SettingsSection } from '../../../shared/Components/SettingsSection';
import { TOOLTIPS } from '../../../shared/tooltips';
import { ActionIcon } from '../../../shared/Components/ActionIcon';

export function ImportOptions() {
  const [operation, setOperation] = useState<'import' | 'reanalyze' | null>(null), [message, setMessage] = useState(''), [error, setError] = useState(false);
  const [progress, setProgress] = useState<DataProgress | null>(null);
  const dialog = useRef<HTMLDialogElement>(null), cancel = useRef<() => void>();
  const busy = operation !== null, importing = operation === 'import';
  usePageDialog(dialog, busy);
  async function run(task: Extract<DataTask, { type: 'import' | 'reanalyze' }>) {
    if (busy || task.type === 'import' && !task.files.length) return;
    setOperation(task.type); setMessage(''); setError(false);
    setProgress({ processed: 0, total: 0, analyzed: 0, skipped: 0, failed: 0, remainingMs: null });
    try {
      const work = dataTask(task, setProgress); cancel.current = work.cancel;
      const result = await work.promise;
      if ('added' in result) setMessage(`Imported ${result.added} solves; skipped ${result.duplicates} duplicates.`);
      else if ('analyzed' in result) setMessage(`Re-analyzed ${result.analyzed} solves; skipped ${result.skipped}; failed ${result.failed}.`);
      else throw new Error('Invalid solve processing result.');
      if (task.type === 'import') window.dispatchEvent(new Event('timer-solves-changed'));
    } catch (failure) { setError(true); setMessage(`${failure instanceof Error ? failure.message : 'Solve processing failed.'}${task.type === 'reanalyze' ? ' Completed batches were retained.' : ''}`); }
    finally {
      cancel.current = undefined; setOperation(null); setProgress(null);
      if (task.type === 'reanalyze') window.dispatchEvent(new CustomEvent('timer-solves-changed', { detail: { reanalyzed: true } }));
    }
  }
  return <SettingsSection title="Import solves" id="import-heading" help={<InfoTip>{TOOLTIPS.importOptions.merge}</InfoTip>}>
    <label className={`btn btn-outline-primary ${busy ? 'disabled' : ''}`}><ActionIcon action="upload" />{importing ? 'Importing...' : 'Import Cubeast / Acubemy CSV'}
      <input className="visually-hidden" aria-label="Import solve CSV files" type="file" accept=".csv,text/csv" multiple disabled={busy}
        onChange={event => { void run({ type: 'import', files: Array.from(event.target.files ?? []) }); event.target.value = ''; }} />
    </label>
    <div className="d-flex align-items-center mt-3">
      <button className="btn btn-outline-primary" disabled={busy} onClick={() => void run({ type: 'reanalyze' })}>Re-analyze all solves</button>
      <InfoTip>{TOOLTIPS.importOptions.reanalyze}</InfoTip>
    </div>
    <dialog ref={dialog} className="panel options-dialog" aria-labelledby="solve-progress-heading" onCancel={event => event.preventDefault()}>
      <h3 id="solve-progress-heading">{importing ? 'Importing solves' : 'Re-analyzing solves'}</h3>
      {progress && <>
        <progress className="w-100" aria-label={importing ? 'Import progress' : 'Reanalysis progress'} max={progress.total || 1} value={progress.total ? progress.processed : undefined} />
        <p role="status">{importing && !progress.total ? 'Reading CSV files...' : importing && progress.processed === progress.total ? 'Saving imported solves...' : <>{progress.processed} / {progress.total} solves. {progress.remainingMs === null ? 'Estimating time remaining...' : `About ${Math.ceil(progress.remainingMs / 1000)} seconds remaining.`}</>}</p>
        <p>{progress.analyzed} {importing ? 'imported' : 'analyzed'}; {progress.skipped} skipped{!importing && `; ${progress.failed} failed`}.</p>
      </>}
      {!importing && <button className="btn btn-outline-secondary" onClick={() => cancel.current?.()}>Cancel</button>}
    </dialog>
    {message && <p role={error ? 'alert' : 'status'} className={error ? 'text-danger' : ''}>{message}</p>}
  </SettingsSection>;
}
