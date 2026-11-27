import { useEffect, useState } from 'react';
import { backupNow, cloudState, configureCloud, connectCloud, disconnectCloud, dismissCloudMessage, initializeCloud, restoreNow, subscribeCloud } from './backup';
import { isConfigured, prepareProvider, providerNames } from './providers';
import { GoogleLogo } from '../../shared/Components/GoogleLogo';
import { InfoTip } from '../../shared/Components/InfoTip';
import { SettingsSection } from '../../shared/Components/SettingsSection';
import { TOOLTIPS } from '../../shared/tooltips';
import { SharedOptions } from '../sharing/SharedOptions';

function useCloud() {
  const [state, setState] = useState(cloudState);
  useEffect(() => subscribeCloud(() => setState(cloudState())), []);
  return state;
}
export function CloudOptions() {
  const state = useCloud();
  useEffect(() => { if (isConfigured(state.provider)) void prepareProvider(state.provider).catch(() => {}); }, [state.provider]);
  return <SettingsSection title="Cloud backup" id="cloud-heading" help={<InfoTip>{TOOLTIPS.cloudOptions.overview}</InfoTip>}>
    <div className="cloud-backup-layout">
    <section className="cloud-backup-panel" aria-label="Backup and connection">
    {!state.configured ? <div role="status" className="backup-status mb-3">Provider unavailable<InfoTip>{TOOLTIPS.cloudOptions.unconfigured(providerNames[state.provider])}</InfoTip></div>
      : <p className="backup-status mb-3">{state.connected ? `Connected to ${providerNames[state.provider]}` : 'Not connected'}</p>}
    <div className="d-flex flex-wrap gap-2 mb-3">
      {state.connected
        ? <button className="btn btn-primary" disabled={state.busy} onClick={() => { void backupNow(); }}><GoogleLogo />Back up now</button>
        : <button className="btn btn-primary" disabled={state.busy || !state.configured} onClick={() => { void connectCloud(); }}><GoogleLogo />Connect Google Drive</button>}
      <button className="btn btn-outline-secondary" disabled={state.busy || !state.connected} onClick={() => {
        void restoreNow().then(success => { if (success) window.location.reload(); });
      }}><GoogleLogo />Restore backup</button>
      {state.connected && <button className="btn btn-outline-secondary" disabled={state.busy || !state.configured} onClick={() => { void connectCloud(); }}><GoogleLogo />Reconnect Google Drive</button>}
      <button className="btn btn-outline-secondary" disabled={state.busy || !state.connected} onClick={() => { void disconnectCloud(); }}><GoogleLogo />Disconnect</button>
    </div>
    <p className="backup-status mb-1">Last successful backup: {state.lastBackup ? new Date(state.lastBackup).toLocaleString() : 'Never'}<InfoTip>{TOOLTIPS.cloudOptions.restore}</InfoTip></p>
    {state.every100 && <p className="backup-status mb-0">{state.pending} / 100 new solves since the last successful backup</p>}
    </section>
    <fieldset className="cloud-backup-panel">
    <legend className="h6">Automatic backups <InfoTip>{TOOLTIPS.cloudOptions.automaticBackups}</InfoTip></legend>
    <label className="d-flex align-items-center gap-2 py-2"><input className="form-check-input m-0 flex-shrink-0" type="checkbox" checked={state.every100} disabled={state.busy}
      onChange={event => configureCloud(state.provider, event.target.checked, state.onPb)} />Back up every 100 solves</label>
    <label className="d-flex align-items-center gap-2 py-2"><input className="form-check-input m-0 flex-shrink-0" type="checkbox" checked={state.onPb} disabled={state.busy}
      onChange={event => configureCloud(state.provider, state.every100, event.target.checked)} />Back up after a PB</label>
    </fieldset>
    <SharedOptions disabled={state.busy} />
    </div>
  </SettingsSection>;
}
export function CloudNotice() {
  const state = useCloud();
  useEffect(() => {
    const resume = () => { if (!document.hidden) void initializeCloud(); };
    resume();
    window.addEventListener('online', resume);
    document.addEventListener('visibilitychange', resume);
    return () => { window.removeEventListener('online', resume); document.removeEventListener('visibilitychange', resume); };
  }, []);
  if (!state.message) return null;
  return <aside className="position-fixed top-0 end-0 m-3 p-3 border rounded bg-body shadow" style={{ zIndex: 1100, maxWidth: 'min(26rem, calc(100vw - 2rem))' }}
    role={state.error ? 'alert' : 'status'} aria-live={state.error ? 'assertive' : 'polite'}>
    <button className="btn-close float-end ms-3" aria-label="Dismiss cloud backup notification" onClick={dismissCloudMessage} />
    <strong>Cloud backup</strong><p className="mb-0 mt-1">{state.message}</p>
    {state.error && <a href="/options/">Open backup options</a>}
  </aside>;
}
