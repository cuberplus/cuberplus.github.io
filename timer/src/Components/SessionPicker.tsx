import { useId, useMemo, useState } from 'react';
import { scramblers, type Scrambler } from '../Core/scramblers';

export function SessionPicker({ value, sessions, disabled, change, create, manage }: {
  value: string; sessions: string[]; disabled: boolean; change: (session: string) => void; create: (session: string, scrambler: Scrambler) => void;
  manage?: (name: string | null) => Promise<boolean>;
}) {
  const [editing, setEditing] = useState<'create' | 'rename' | null>(null), [name, setName] = useState('');
  const [error, setError] = useState('');
  const scramblerId = useId();
  const [scrambler, setScrambler] = useState<Scrambler>('default');
  const options = useMemo(() => [...new Set(['Default', ...sessions, value])], [sessions, value]);
  let createValue = '__create__';
  while (options.includes(createValue)) createValue += '_';
  async function submitChange(name: string | null) {
    if (disabled || !manage) return;
    setError('');
    try { if (await manage(name)) { setEditing(null); setName(''); } }
    catch (failure) { setError(failure instanceof Error ? failure.message : 'Session changes could not be saved.'); }
  }
  return <div className="session-picker">
    <label className="d-flex align-items-center gap-2"><span className="session-picker-label">Session:</span>
      <select className="form-select" aria-label="Session" value={value} disabled={disabled}
        onChange={event => {
          setError(''); setName('');
          if (event.target.value === createValue) { setScrambler('default'); setEditing('create'); }
          else { setEditing(null); change(event.target.value); }
        }}>
        {options.map(session => <option key={session}>{session}</option>)}
        <option value={createValue}>+ Create Session</option>
      </select>
    </label>
    {manage && !editing && <div className="d-flex gap-2 mt-2">
      <button type="button" className="btn btn-outline-secondary" disabled={disabled || value === 'Retries'}
        title={value === 'Retries' ? 'Retries is reserved for retry attempts.' : undefined}
        onClick={() => { setError(''); setName(value); setEditing('rename'); }}>Rename session</button>
      <button type="button" className="btn btn-outline-danger" disabled={disabled} onClick={() => void submitChange(null)}>Delete session</button>
    </div>}
    {editing && <form className="d-flex flex-wrap gap-2 mt-2" onSubmit={event => {
      event.preventDefault();
      if (!name.trim() || disabled) return;
      if (editing === 'rename') { void submitChange(name.trim()); return; }
      if (options.includes(name.trim())) { setError('Choose a unique session name.'); return; }
      create(name.trim(), scrambler); setEditing(null); setName('');
    }}>
      <input className="form-control" aria-label={editing === 'rename' ? 'Rename session to' : 'New session name'} autoFocus maxLength={100} required value={name}
        disabled={disabled} onChange={event => setName(event.target.value)} />
      {editing === 'create' && <label htmlFor={scramblerId} className="w-100">Scrambler
        <select id={scramblerId} className="form-select" value={scrambler} disabled={disabled} onChange={event => setScrambler(event.target.value as Scrambler)}>
          {Object.entries(scramblers).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
        </select>
      </label>}
      <button className="btn btn-primary" disabled={disabled || !name.trim()}>{editing === 'rename' ? 'Save session name' : 'Create'}</button>
      <button className="btn btn-outline-secondary" type="button" disabled={disabled} onClick={() => { setEditing(null); setError(''); }}>Cancel</button>
    </form>}
    {error && <p role="alert" className="text-danger mt-2 mb-0">{error}</p>}
  </div>;
}
