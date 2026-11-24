import { useEffect, useState } from 'react';
import { backupNow, cloudState, configureCloud, connectCloud, disconnectCloud, dismissCloudMessage, initializeCloud, restoreNow, subscribeCloud } from './backup';
import { isConfigured, prepareProvider, providerNames, type Provider } from './providers';
import { InfoTip } from '../../shared/Components/InfoTip';
import { SettingsSection } from '../../shared/Components/SettingsSection';
import { TOOLTIPS } from '../../shared/tooltips';

function useCloud() {
  const [state, setState] = useState(cloudState);
  useEffect(() => subscribeCloud(() => setState(cloudState())), []);
  return state;
}
export function CloudOptions() {
  const state = useCloud();
  useEffect(() => { if (isConfigured(state.provider)) void prepareProvider(state.provider).catch(() => {}); }, [state.provider]);
  return <SettingsSection title="Cloud backup" id="cloud-heading" help={<InfoTip>{TOOLTIPS.cloudOptions.overview}</InfoTip>}>
    <div className="settings-fields mb-3">
    <label className="backup-provider">Backup provider
      <select className="form-select mt-2" value={state.provider} disabled={state.busy}
        onChange={event => configureCloud(event.target.value as Provider, state.every100, state.onPb)}>
        {Object.entries(providerNames).map(([id, name]) => <option key={id} value={id}>{name}</option>)}
      </select>
    </label>
      {state.connected
        ? <button className="btn btn-primary" disabled={state.busy} onClick={() => { void backupNow(); }}>Back up now</button>
        : <button className="btn btn-primary" disabled={state.busy || !state.configured} onClick={() => { void connectCloud(); }}>Connect {providerNames[state.provider]}</button>}
    </div>
    {!state.configured ? <div role="status" className="backup-status mb-3">Provider unavailable<InfoTip>{TOOLTIPS.cloudOptions.unconfigured(providerNames[state.provider])}</InfoTip></div>
      : <p className="backup-status">{state.connected ? `Connected to ${providerNames[state.provider]}` : 'Not connected'}</p>}
    <fieldset className="my-3">
    <legend className="h6">Automatic backups <InfoTip>{TOOLTIPS.cloudOptions.automaticBackups}</InfoTip></legend>
    <label className="d-block mb-2"><input className="form-check-input me-2" type="checkbox" checked={state.every100} disabled={state.busy}
      onChange={event => configureCloud(state.provider, event.target.checked, state.onPb)} />Back up every 100 solves</label>
    <label className="d-block mb-3"><input className="form-check-input me-2" type="checkbox" checked={state.onPb} disabled={state.busy}
      onChange={event => configureCloud(state.provider, state.every100, event.target.checked)} />Back up after a PB</label>
    </fieldset>
    <p className="backup-status mb-1">Last successful backup: {state.lastBackup ? new Date(state.lastBackup).toLocaleString() : 'Never'}<InfoTip>{TOOLTIPS.cloudOptions.restore}</InfoTip></p>
    {state.every100 && <p className="backup-status mb-1">{state.pending} / 100 new solves since the last successful backup</p>}
    <details className="settings-disclosure"><summary>Restore and connection settings</summary>
      <div className="d-flex flex-wrap gap-2">
        <button className="btn btn-outline-secondary" disabled={state.busy || !state.connected} onClick={() => {
          void restoreNow().then(success => { if (success) window.location.reload(); });
        }}>Restore backup</button>
        {state.connected && <button className="btn btn-outline-secondary" disabled={state.busy || !state.configured} onClick={() => { void connectCloud(); }}>Reconnect {providerNames[state.provider]}</button>}
        <button className="btn btn-outline-secondary" disabled={state.busy || !state.connected} onClick={() => { void disconnectCloud(); }}>Disconnect</button>
      </div>
    </details>
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
