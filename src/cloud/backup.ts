import type { Solve } from '../../timer/src/Core/engine';
import { connectProvider, disconnectProvider, isConfigured, isConnected, prepareProvider, readRemote, writeRemote, CloudHttpError, providerNames, type Provider } from './providers';

export const settingKeys = [
  'theme', 'timer-time-precision', 'timer-inspection', 'timer-over-turn-penalty',
  'timer-show-every-long-pb', 'timer-hide-distracting-visuals', 'timer-sessions', 'timer-session-scramblers',
  'selected-session', 'timer-all-session-history',
  'timer-non-favorite-mistakes', 'timer-non-favorite-categories',
  'cuberplus-database-favorites', 'cuberplus-unlearn-algorithms', 'cuberplus-custom-algorithms',
  'cuberplus-cloud-auto-100', 'cuberplus-cloud-auto-pb',
] as const;
type Settings = Partial<Record<typeof settingKeys[number], string | null>>;
type Progress = { pending: string[]; pbs: string[]; lastBackup: Partial<Record<Provider, string>> };
type CloudBackup = {
  format: 'cuberplus-cloud-v1'; savedAt: string;
  timer: { format: string; solves: { id: string }[] };
  settings: Settings;
};
const progressKey = 'cuberplus-cloud-progress';
const providerKey = 'cuberplus-cloud-provider';
const changed = 'cuberplus-cloud-changed';
let busy = false, message = '', error = false;
const read = (key: string): string | null => { try { return localStorage.getItem(key); } catch { return null; } };
const selectedProvider = (): Provider => read(providerKey) === 'microsoft' ? 'microsoft' : 'google';
function progress(): Progress {
  try {
    const saved = JSON.parse(read(progressKey) ?? 'null') as Progress | null;
    return {
      pending: [...new Set((Array.isArray(saved?.pending) ? saved.pending : []).filter(id => typeof id === 'string'))],
      pbs: [...new Set((Array.isArray(saved?.pbs) ? saved.pbs : []).filter(id => typeof id === 'string'))],
      lastBackup: saved?.lastBackup && typeof saved.lastBackup === 'object' ? saved.lastBackup : {},
    };
  } catch { return { pending: [], pbs: [], lastBackup: {} }; }
}
const saveProgress = (value: Progress) => localStorage.setItem(progressKey, JSON.stringify(value));
const emit = () => window.dispatchEvent(new Event(changed));
export function cloudState() {
  const provider = selectedProvider(), saved = progress();
  return {
    provider, every100: read('cuberplus-cloud-auto-100') === 'true', onPb: read('cuberplus-cloud-auto-pb') === 'true',
    pending: saved.pending.length, lastBackup: saved.lastBackup[provider] ?? null,
    configured: isConfigured(provider), connected: isConnected(provider), busy, message, error,
  };
}
export function subscribeCloud(listener: () => void): () => void {
  window.addEventListener(changed, listener);
  window.addEventListener('storage', listener);
  return () => { window.removeEventListener(changed, listener); window.removeEventListener('storage', listener); };
}
export function dismissCloudMessage(): void { message = ''; emit(); }
function report(failure: Error): void {
  message = failure.message || 'Cloud backup failed. Your local data is still available.'; error = true; emit();
}
export async function initializeCloud(): Promise<void> {
  try { await prepareProvider(selectedProvider()); emit(); } catch (failure) { report(failure instanceof Error ? failure : new Error('Cloud sign-in could not load.')); }
}
export function configureCloud(provider: Provider, every100: boolean, onPb: boolean): void {
  if (busy) return;
  try {
    const current = cloudState(), saved = progress();
    if (provider !== current.provider || (!current.every100 && every100)) saved.pending = [];
    if (provider !== current.provider || !onPb) saved.pbs = [];
    localStorage.setItem(providerKey, provider);
    localStorage.setItem('cuberplus-cloud-auto-100', String(every100));
    localStorage.setItem('cuberplus-cloud-auto-pb', String(onPb));
    saveProgress(saved);
    message = ''; error = false; emit();
    void initializeCloud();
  } catch { report(new Error('Cloud options could not be saved in this browser.')); }
}
export async function connectCloud(): Promise<void> {
  if (busy) return;
  busy = true; message = 'Connecting...'; error = false; emit();
  try {
    await connectProvider(selectedProvider()); message = `Connected to ${providerNames[selectedProvider()]}.`;
  } catch (failure) { report(failure instanceof Error ? failure : new Error('Cloud sign-in failed.')); }
  finally { busy = false; emit(); }
  if (!error) await automaticBackup();
}
export async function disconnectCloud(): Promise<void> {
  if (busy) return;
  busy = true; emit();
  try { await disconnectProvider(selectedProvider()); message = 'Disconnected. Cloud backups have not been deleted.'; error = false; }
  catch { report(new Error('Could not disconnect. Please try again.')); }
  finally { busy = false; emit(); }
}

export function dedupeById<T extends { id: string }>(...groups: T[][]): T[] {
  const unique = new Map<string, T>();
  for (const group of groups) for (const item of group) {
    if (!item || typeof item.id !== 'string' || !item.id) throw new Error('Invalid solve ID in cloud backup.');
    unique.set(item.id, item);
  }
  return [...unique.values()];
}
function readSettings(): Settings {
  return Object.fromEntries(settingKeys.map(key => [key, localStorage.getItem(key)]));
}
function writeSettings(settings: Settings): void {
  for (const key of settingKeys) {
    const value = settings[key];
    if (value === null) localStorage.removeItem(key);
    else if (value !== undefined) localStorage.setItem(key, value);
  }
}
export async function encodeCloudBackup(backup: CloudBackup): Promise<Blob> {
  const stream = new Blob([JSON.stringify(backup)]).stream().pipeThrough(new CompressionStream('gzip'));
  return new Blob([await new Response(stream).arrayBuffer()], { type: 'application/gzip' });
}
export async function decodeCloudBackup(content: Blob): Promise<{ solves: Solve[]; settings: Settings }> {
  if (!content.size) throw new Error('The cloud backup file is empty. Back up from a device with your solves before restoring. No local data was changed.');
  const text = await new Response(content.stream().pipeThrough(new DecompressionStream('gzip'))).text();
  const backup = JSON.parse(text) as CloudBackup;
  if (!backup || backup.format !== 'cuberplus-cloud-v1' || !Number.isFinite(Date.parse(backup.savedAt)) ||
      !backup.timer || !Array.isArray(backup.timer.solves) || !backup.settings || typeof backup.settings !== 'object' || Array.isArray(backup.settings)) {
    throw new Error('Not a valid CuberPlus cloud backup. No local data was changed.');
  }
  const settings: Settings = {};
  for (const key of settingKeys) {
    const value = backup.settings[key];
    if (value !== undefined) {
      if (value !== null && typeof value !== 'string') throw new Error('Invalid settings in cloud backup. No local data was changed.');
      settings[key] = value;
    }
  }
  const [{ validateBackup }, { loadCube }] = await Promise.all([import('../../timer/src/Data/storage'), import('../../timer/src/Core/puzzle')]);
  // Older or externally edited backups may contain duplicate IDs; validate only the winning records.
  const timer = { ...backup.timer, solves: dedupeById(backup.timer.solves) };
  return { solves: validateBackup(JSON.stringify(timer), await loadCube()), settings };
}
async function backUp(provider: Provider): Promise<void> {
  const { readSolves, backupJSON } = await import('../../timer/src/Data/storage');
  // Retry a conditional-write conflict with a fresh cloud snapshot, never a blind overwrite.
  for (let attempt = 0; attempt < 3; attempt++) {
    const remote = await readRemote(provider);
    // Empty placeholders still retain their ID and revision for the conditional upload.
    const previous = remote && (remote.size !== 0 || remote.content.size !== 0) ? await decodeCloudBackup(remote.content) : { solves: [], settings: {} };
    const observed = progress();
    const local = (await readSolves()).filter(solve => solve.status !== 'active');
    const solves = dedupeById(previous.solves, local), savedAt = new Date().toISOString();
    const content = await encodeCloudBackup({
      format: 'cuberplus-cloud-v1', savedAt,
      timer: JSON.parse(backupJSON(solves)) as CloudBackup['timer'],
      settings: { ...previous.settings, ...readSettings() },
    });
    try { await writeRemote(provider, content, remote); }
    catch (failure) {
      if (failure instanceof CloudHttpError && [409, 412].includes(failure.status) && attempt < 2) continue;
      throw failure;
    }
    const saved = progress(), covered = new Set([...solves.map(solve => solve.id), ...observed.pending, ...observed.pbs]);
    saved.pending = saved.pending.filter(id => !covered.has(id)); saved.pbs = saved.pbs.filter(id => !covered.has(id));
    saved.lastBackup[provider] = savedAt;
    try { saveProgress(saved); }
    catch { throw new Error('Backup uploaded, but this browser could not save the backup date or reset its counter.'); }
    message = `Backed up ${solves.length.toLocaleString()} solves to ${providerNames[provider]}.`; return;
  }
}
async function restore(provider: Provider): Promise<void> {
  const remote = await readRemote(provider);
  if (!remote) throw new Error(`No CuberPlus backup was found in ${providerNames[provider]}.`);
  const incoming = await decodeCloudBackup(remote.content);
  const { readSolves, saveSolves } = await import('../../timer/src/Data/storage');
  const local = await readSolves();
  if (local.some(solve => solve.status === 'active')) throw new Error('Finish or stop your current Timer solve before restoring a backup.');
  const merged = dedupeById(local, incoming.solves), previous = readSettings();
  try {
    writeSettings(incoming.settings);
    await saveSolves(merged);
  } catch (failure) {
    try { writeSettings(previous); }
    catch { throw new Error('Restore failed and some settings could not be recovered. Your original solves have not been removed.'); }
    throw failure;
  }
  message = `Restored ${incoming.solves.length.toLocaleString()} cloud solves; ${merged.length.toLocaleString()} unique solves are saved locally.`;
}
async function operate(action: 'backup' | 'restore'): Promise<boolean> {
  if (busy) return false;
  busy = true; error = false; message = action === 'backup' ? 'Backing up...' : 'Restoring...'; emit();
  let success = false;
  try {
    const provider = selectedProvider(), task = () => action === 'backup' ? backUp(provider) : restore(provider);
    if (navigator.locks) await navigator.locks.request('cuberplus-cloud-backup', task);
    else await task();
    success = true;
  } catch (failure) { report(failure instanceof Error ? failure : new Error('Cloud operation failed. Your local data is still available.')); }
  finally { busy = false; emit(); }
  if (success && action === 'backup' && automaticDue()) queueMicrotask(() => { void automaticBackup(); });
  return success;
}
export const backupNow = (): Promise<boolean> => operate('backup');
export const restoreNow = (): Promise<boolean> => operate('restore');
function automaticDue(): boolean {
  const state = cloudState(), saved = progress();
  return (state.every100 && saved.pending.length >= 100) || (state.onPb && saved.pbs.length > 0);
}
async function automaticBackup(): Promise<void> {
  if (busy || !automaticDue()) return;
  await backupNow();
}
export async function noteCloudSolve(solve: Pick<Solve, 'id' | 'status'>, records: { name: string }[]): Promise<void> {
  const state = cloudState();
  if (solve.status === 'active' || (!state.every100 && !state.onPb)) return;
  try {
    const saved = progress();
    saved.pending = [...new Set([...saved.pending, solve.id])];
    if (state.onPb && records.some(record => ['Single', 'Ao5', 'Ao12'].includes(record.name))) saved.pbs = [...new Set([...saved.pbs, solve.id])];
    saveProgress(saved); emit();
    await automaticBackup();
  } catch { report(new Error('Your solve was saved, but the automatic backup counter could not be saved.')); }
}
