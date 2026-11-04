import { useSyncExternalStore } from 'react';

type InstallOffer = Event & { prompt(): Promise<{ outcome: 'accepted' | 'dismissed' } | void> };
type InstallState = { installPrompt: InstallOffer | null; installed: boolean; installError: string; waiting: ServiceWorker | null };
let state: InstallState = { installPrompt: null, installed: false, installError: '', waiting: null };
const listeners = new Set<() => void>();
function update(change: Partial<InstallState>) { state = { ...state, ...change }; listeners.forEach(listener => listener()); }
const offerInstall = (event: Event) => {
  if (state.installed || !('prompt' in event) || typeof event.prompt !== 'function') return;
  event.preventDefault();
  update({ installPrompt: event as InstallOffer, installError: '' });
};
const didInstall = () => update({ installPrompt: null, installed: true });
function subscribe(listener: () => void) {
  listeners.add(listener);
  if (listeners.size === 1) {
    update({ installed: window.matchMedia?.('(display-mode: standalone)').matches ?? false });
    window.addEventListener('beforeinstallprompt', offerInstall);
    window.addEventListener('appinstalled', didInstall);
  }
  return () => {
    listeners.delete(listener);
    if (!listeners.size) {
      window.removeEventListener('beforeinstallprompt', offerInstall);
      window.removeEventListener('appinstalled', didInstall);
      state = { ...state, installPrompt: null, installError: '' };
    }
  };
}
async function installApp() {
  const offer = state.installPrompt;
  if (!offer) return;
  update({ installPrompt: null, installError: '' });
  try { await offer.prompt(); }
  catch { update({ installError: 'Installation could not start. Try the Install app option in your browser menu.' }); }
}
export function useInstall() {
  return { ...useSyncExternalStore(subscribe, () => state), installApp };
}
export function InstallControl() {
  const { installPrompt, installed, installError, waiting } = useInstall();
  return <>
    {!installed && installPrompt && <button className="cuberplus-install" onClick={() => void installApp()}>Install</button>}
    {waiting && <button className="cuberplus-install" title="Reload CuberPlus to update. This disconnects any connected cube." onClick={() => {
      navigator.serviceWorker.addEventListener('controllerchange', () => location.reload(), { once: true });
      waiting.postMessage('SKIP_WAITING');
    }}>Update (reload)</button>}
    {installError && <span role="alert">{installError}</span>}
  </>;
}
export async function registerWorker(production: boolean) {
  if (!production || !('serviceWorker' in navigator)) return;
  try {
    const old = await navigator.serviceWorker.getRegistrations();
    await Promise.all(old.filter(worker => worker.scope === new URL('/timer/', location.origin).href).map(worker => worker.unregister()));
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/', updateViaCache: 'none' });
    const check = () => { if (registration.waiting && navigator.serviceWorker.controller) update({ waiting: registration.waiting }); };
    check();
    registration.addEventListener('updatefound', () => registration.installing?.addEventListener('statechange', check));
  } catch {
    // Installation is optional; a blocked worker must not prevent online use.
  }
}
