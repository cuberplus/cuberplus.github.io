import { useEffect, useId, useRef, useState } from 'react';
import { usePageDialog } from '@cuberplus/navigation';
import { BREAK_CHANGED, breakRanges, readBreakSettings, writeBreakSettings, type BreakSettings } from '../../timer/src/Core/breakReminder';
import { InfoTip } from './InfoTip';

const fields = [
  ['minutes', 'Break length (minutes)', 0.1],
  ['streakWindow', 'Average window (solves)', 1],
  ['singleMultiplier', 'Single-solve slowdown multiplier', 0.1],
  ['streakCount', 'Consecutive slow solves', 1],
  ['streakPercent', 'Streak slowdown (%)', 1],
] as const;
export function BreakReminderOptions({ disabled = false }: { disabled?: boolean }) {
  const [settings, setSettings] = useState(readBreakSettings);
  const [warning, setWarning] = useState(0), [error, setError] = useState('');
  const dialog = useRef<HTMLDialogElement>(null), id = useId();
  usePageDialog(dialog, false);
  useEffect(() => {
    const refresh = () => setSettings(readBreakSettings());
    window.addEventListener(BREAK_CHANGED, refresh); window.addEventListener('storage', refresh);
    return () => { window.removeEventListener(BREAK_CHANGED, refresh); window.removeEventListener('storage', refresh); };
  }, []);
  function change(next: BreakSettings) {
    try { writeBreakSettings(next); setSettings(next); setError(''); return true; }
    catch { setError('Break reminder settings could not be saved.'); return false; }
  }
  return <section className="settings-section" aria-label="Break reminder settings">
    <h3 className="d-flex align-items-center">Break reminder<InfoTip>Pause the timer after an unusually slow solve or a streak of slower-than-average solves in the same session. Only completed solves count; retries do not. Reminders require a full average window of prior completed solves. Both triggers use that window; streaks compare each solve with its own prior average. Breaks persist when you leave or reload Timer.</InfoTip></h3>
    <label className="form-check"><input className="form-check-input" type="checkbox" checked={settings.enabled} disabled={disabled}
      onChange={event => {
        if (event.target.checked) change({ ...settings, enabled: true });
        else { setWarning(1); dialog.current?.showModal(); }
      }} />Enable break reminders</label>
    <details className="settings-disclosure">
      <summary>Customize break reminders</summary>
      <fieldset disabled={disabled} className="settings-fields mt-3">
        <legend className="visually-hidden">Break thresholds</legend>
        {fields.map(([key, label, step]) => <label key={key} htmlFor={`${id}-${key}`}>{label}<input id={`${id}-${key}`} className="form-control mt-1" type="number" min={breakRanges[key][0]} max={breakRanges[key][1]} step={step} defaultValue={settings[key]} key={`${key}-${settings[key]}`}
          onBlur={event => {
            const value = event.currentTarget.valueAsNumber, [min, max] = breakRanges[key];
            if (!Number.isFinite(value) || value < min || value > max || step === 1 && !Number.isInteger(value)) {
              event.currentTarget.value = String(settings[key]); return;
            }
            change({ ...settings, [key]: value });
          }} /></label>)}
        <label className="form-check"><input className="form-check-input" type="checkbox" checked={settings.drills}
          onChange={event => change({ ...settings, drills: event.target.checked })} />Suggest a targeted drill during breaks</label>
      </fieldset>
    </details>
    <dialog ref={dialog} className="panel options-dialog" aria-labelledby={`${id}-title`} onClose={() => setWarning(0)}>
      <h2 id={`${id}-title`}>{warning === 2 ? 'Disable break reminders?' : 'Keep your break reminders?'}</h2>
      <p>{warning === 2 ? 'Are you sure you want to continue? This disables future reminders and ends any current timer break.' : 'Break reminders help you step away when solves get frustrating. Are you sure you want to continue?'}</p>
      <div className="d-flex justify-content-end gap-2">
        <button className="btn btn-outline-secondary" onClick={() => {
          if (warning === 1) setWarning(2);
          else if (change({ ...settings, enabled: false })) dialog.current?.close();
        }}>{warning === 2 ? 'Disable reminders' : 'Continue to final warning'}</button>
        <button ref={button => { if (button) button.autofocus = true; }} className="btn btn-primary" onClick={() => dialog.current?.close()}>Keep reminders</button>
      </div>
    </dialog>
    {error && <p role="alert" className="text-danger">{error}</p>}
  </section>;
}
