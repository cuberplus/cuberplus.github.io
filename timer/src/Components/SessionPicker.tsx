import { useState } from 'react';

export function SessionPicker({ value, sessions, disabled, change, create }: {
  value: string; sessions: string[]; disabled: boolean; change: (session: string) => void; create: (session: string) => void;
}) {
  const [creating, setCreating] = useState(false), [name, setName] = useState('');
  const options = [...new Set(['Default', ...sessions, value])];
  let createValue = '__create__';
  while (options.includes(createValue)) createValue += '_';
  return <div className="session-picker">
    <label className="d-flex align-items-center gap-2">Session:
      <select className="form-select" aria-label="Session" value={value} disabled={disabled}
        onChange={event => {
          if (event.target.value === createValue) setCreating(true);
          else { setCreating(false); change(event.target.value); }
        }}>
        {options.map(session => <option key={session}>{session}</option>)}
        <option value={createValue}>+ Create Session</option>
      </select>
    </label>
    {creating && <form className="d-flex gap-2 mt-2" onSubmit={event => {
      event.preventDefault();
      if (!name.trim() || disabled) return;
      create(name.trim()); setCreating(false); setName('');
    }}>
      <input className="form-control" aria-label="New session name" autoFocus maxLength={100} required value={name}
        disabled={disabled} onChange={event => setName(event.target.value)} />
      <button className="btn btn-primary" disabled={disabled || !name.trim()}>Create</button>
      <button className="btn btn-outline-secondary" type="button" onClick={() => setCreating(false)}>Cancel</button>
    </form>}
  </div>;
}
