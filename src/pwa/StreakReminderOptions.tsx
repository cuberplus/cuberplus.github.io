import { useEffect, useRef, useState } from 'react';
import { InfoTip } from '../../shared/Components/InfoTip';
import { readOption } from '../../shared/display';

type PeriodicRegistration = ServiceWorkerRegistration & {
  periodicSync: { register(tag: string, options: { minInterval: number }): Promise<void>; unregister(tag: string): Promise<void>; getTags(): Promise<string[]> };
};
const tag = 'streak-reminder';
let permissionRequest: Promise<NotificationPermission> | undefined;
export async function configureStreakReminders(registration: ServiceWorkerRegistration, request = false): Promise<boolean> {
  if (request && readOption('streak-reminders') === 'true' && 'periodicSync' in registration &&
      'Notification' in window && Notification.permission === 'default') {
    await (permissionRequest ??= Notification.requestPermission().finally(() => { permissionRequest = undefined; }));
  }
  const enabled = readOption('streak-reminders') === 'true';
  await (await caches.open('cuberplus-preferences')).put('/streak-reminders/enabled', new Response(String(enabled)));
  if (!('periodicSync' in registration)) return false;
  const sync = (registration as PeriodicRegistration).periodicSync;
  if (!enabled || !('Notification' in window) || Notification.permission !== 'granted') { await sync.unregister(tag); return false; }
  const permission = await navigator.permissions.query({ name: 'periodic-background-sync' as PermissionName });
  if (permission.state !== 'granted') return false;
  await sync.register(tag, { minInterval: 60 * 60 * 1000 });
  return (await sync.getTags()).includes(tag);
}
export function StreakReminderOptions() {
  const registrationRef = useRef<ServiceWorkerRegistration>();
  const [enabled, setEnabled] = useState(() => readOption('streak-reminders') === 'true');
  const [status, setStatus] = useState('Install and open CuberPlus as an app in a browser supporting periodic background sync to enable notifications.');
  async function configure(request = false) {
    try {
      const registration = registrationRef.current ?? (request ? undefined : await navigator.serviceWorker?.getRegistration('/'));
      registrationRef.current = registration;
      const active = registration && await configureStreakReminders(registration, request);
      setStatus(active ? 'Background reminders enabled. Delivery timing is chosen by your browser.' : 'Install and use the app in a supported browser to allow notifications. If permission was blocked, change it in your browser settings.');
    } catch { setStatus('Background reminders could not be enabled in this browser.'); }
  }
  useEffect(() => {
    void configure();
    void navigator.serviceWorker?.ready?.then(registration => { registrationRef.current = registration; void configure(); }).catch(() => {});
  }, []);
  return <div>
    <div className="d-flex align-items-center gap-2"><label className="form-check mb-0" htmlFor="streak-reminders"><input id="streak-reminders" type="checkbox" className="form-check-input" checked={enabled} onChange={event => {
      const value = event.target.checked;
      try { localStorage.setItem('streak-reminders', String(value)); setEnabled(value); void configure(value); }
      catch { setStatus('This browser could not save the reminder preference.'); }
    }} />Daily streak reminders</label><InfoTip>Off by default. Enable this option to allow notification permission; disable it to stop reminders. At most once per local day, if you have not done a solve and a sub-time streak is at risk. Supported installed PWAs can check after the app closes, without a server. We check from 6 PM onward, but the browser controls when or whether background checks run; delivery is not guaranteed. Safari and Firefox do not support periodic background sync.</InfoTip></div>
    {enabled && <p className="small mt-2 mb-0" role="status">{status}</p>}
  </div>;
}
