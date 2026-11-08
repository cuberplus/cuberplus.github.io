import { useState } from 'react';
import { InfoTip } from '../timer/src/InfoTip';

export function ImportOptions() {
  const [busy, setBusy] = useState(false), [message, setMessage] = useState(''), [error, setError] = useState(false);
  async function importFiles(files: File[]) {
    if (!files.length || busy) return;
    setBusy(true); setMessage(''); setError(false);
    try {
      const { importSolveCSVs } = await import('../timer/src/csvImport');
      const result = await importSolveCSVs(files);
      setMessage(`Imported ${result.added} solves; skipped ${result.duplicates} duplicates.`);
    } catch (failure) { setError(true); setMessage(failure instanceof Error ? failure.message : 'CSV import failed.'); }
    finally { setBusy(false); }
  }
  return <section className="mt-4 border-top pt-4" aria-labelledby="import-heading">
    <h3 id="import-heading" className="d-flex align-items-center">Import solves<InfoTip>Merge Cubeast or Acubemy CSV exports into your local solve database. Existing solves are kept and duplicate source IDs are skipped. Source labels remain available in Timer and Analyzer filters. Step analysis is preserved; CSV imports do not invent a Bluetooth replay.</InfoTip></h3>
    <label className={`btn btn-outline-primary ${busy ? 'disabled' : ''}`}>{busy ? 'Importing...' : 'Import Cubeast / Acubemy CSV'}
      <input className="visually-hidden" aria-label="Import solve CSV files" type="file" accept=".csv,text/csv" multiple disabled={busy}
        onChange={event => { void importFiles(Array.from(event.target.files ?? [])); event.target.value = ''; }} />
    </label>
    {message && <p role={error ? 'alert' : 'status'} className={error ? 'text-danger' : ''}>{message}</p>}
  </section>;
}
