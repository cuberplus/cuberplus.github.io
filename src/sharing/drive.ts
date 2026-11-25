import { googleOAuth } from '../cloud/providers';
import { MAX_SHARE_BYTES, publicSolve, validateSnapshot, type Snapshot } from './snapshot';

declare const __GOOGLE_CLIENT_ID__: string;
declare const __GOOGLE_DRIVE_API_KEY__: string;
const clientId = typeof __GOOGLE_CLIENT_ID__ === 'string' ? __GOOGLE_CLIENT_ID__ : '';
const apiKey = typeof __GOOGLE_DRIVE_API_KEY__ === 'string' ? __GOOGLE_DRIVE_API_KEY__ : '';
const scope = 'https://www.googleapis.com/auth/drive.file', api = 'https://www.googleapis.com/drive/v3/files';
let token: { value: string; expires: number } | null = null;
let publishing = Promise.resolve();
export const sharingConfigured = () => !!clientId && !!apiKey;
export type PublishedShare = { id: string; name: string; resourceKey?: string };
type FileRef = Pick<PublishedShare, 'id' | 'resourceKey'>;
type SharedSolve = Snapshot['rows'][number]['solve'];
type Catalog = { format: 'cuberplus-catalog-v1'; solves: Record<string, SharedSolve> };
type Manifest = {
  format: 'cuberplus-share-v2'; kind: Snapshot['kind']; time: Snapshot['time']; catalogs: FileRef[];
  rows: (Omit<Snapshot['rows'][number], 'solve'> & { solve: string; catalog: number })[];
};
export const shareUrl = ({ id, resourceKey }: PublishedShare) =>
  `${location.origin}/share/?${new URLSearchParams({ id, ...(resourceKey ? { resourceKey } : {}) })}`;
export async function connectSharing(): Promise<void> {
  if (!sharingConfigured()) throw new Error('Google Drive sharing is not configured. The site owner must set VITE_GOOGLE_CLIENT_ID and VITE_GOOGLE_DRIVE_API_KEY.');
  if (token && token.expires > Date.now()) return;
  const oauth = await googleOAuth();
  await new Promise<void>((resolve, reject) => oauth.initTokenClient({
    client_id: clientId, scope,
    callback: result => {
      if (!result.access_token || !result.scope?.split(' ').includes(scope)) {
        reject(new Error('Drive file permission was not granted. Your private backup is unchanged.')); return;
      }
      token = { value: result.access_token, expires: Date.now() + Math.max(0, (result.expires_in ?? 0) - 60) * 1000 }; resolve();
    },
    error_callback: () => reject(new Error('Google sign-in was cancelled or blocked. Please try again.')),
  }).requestAccessToken({ prompt: 'select_account' }));
}
async function authorized(url: string, init: RequestInit = {}): Promise<Response> {
  if (!token || token.expires <= Date.now()) throw new Error('Sharing sign-in expired. Connect Google Drive again.');
  const response = await fetch(url, { ...init, credentials: 'omit', cache: 'no-store',
    headers: { ...init.headers, Authorization: `Bearer ${token.value}` } });
  if (response.status === 401) token = null;
  if (!response.ok) throw new Error(`Google Drive sharing failed (${response.status}). Check your connection, file permissions, and storage.`);
  return response;
}
export function disconnectSharing(): void { token = null; }
async function listFiles(property: 'cuberplusShare' | 'cuberplusCatalog'): Promise<PublishedShare[]> {
  const files: PublishedShare[] = [];
  let pageToken = '';
  do {
    const filter = `appProperties has { key='${property}' and value='v1' }`;
    const query = new URLSearchParams({ q: `trashed = false and (${filter}${property === 'cuberplusShare' ? " or appProperties has { key='cuberplusShare' and value='v2' }" : ''})`,
      fields: 'files(id,name,resourceKey),nextPageToken', pageSize: '100', orderBy: 'createdTime', ...(pageToken ? { pageToken } : {}) });
    const page = await (await authorized(`${api}?${query}`)).json() as { files: PublishedShare[]; nextPageToken?: string };
    files.push(...page.files); pageToken = page.nextPageToken ?? '';
  } while (pageToken);
  return files;
}
export const listShares = (): Promise<PublishedShare[]> => listFiles('cuberplusShare');
export async function deleteShare(id: string): Promise<void> {
  await authorized(`${api}/${encodeURIComponent(id)}`, { method: 'DELETE' });
}
export async function deleteSharedData(): Promise<void> {
  for (const file of [...await listShares(), ...await listFiles('cuberplusCatalog')]) await deleteShare(file.id);
}
async function readPublic<T>(file: FileRef, signal?: AbortSignal, budget?: { remaining: number }): Promise<T> {
  if (!apiKey) throw new Error('Shared viewing is not configured on this site.');
  if (!/^[\w-]{1,200}$/.test(file.id) || file.resourceKey && !/^[\w-]{1,200}$/.test(file.resourceKey)) throw new Error('Invalid shared link.');
  const query = new URLSearchParams({ alt: 'media', key: apiKey });
  const response = await fetch(`${api}/${encodeURIComponent(file.id)}?${query}`, {
    credentials: 'omit', cache: 'no-store', signal,
    ...(file.resourceKey ? { headers: { 'X-Goog-Drive-Resource-Keys': `${file.id}/${file.resourceKey}` } } : {}),
  });
  if (!response.ok) throw new Error(response.status === 403 || response.status === 404
    ? 'This shared snapshot is unavailable or has been revoked.' : `Unable to load shared snapshot (${response.status}).`);
  return readJson<T>(response, budget);
}
async function readJson<T>(response: Response, budget = { remaining: MAX_SHARE_BYTES }): Promise<T> {
  const reader = response.body?.getReader();
  if (!reader) throw new Error('The shared snapshot could not be read.');
  const chunks: Uint8Array<ArrayBuffer>[] = [];
  let size = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      budget.remaining -= value.byteLength;
      if (size > MAX_SHARE_BYTES || budget.remaining < 0) throw new Error('The shared snapshot is too large.');
      chunks.push(new Uint8Array(value));
    }
  } finally { await reader.cancel(); reader.releaseLock(); }
  return JSON.parse(await new Blob(chunks).text()) as T;
}
function catalogSolves(value: Catalog): Catalog['solves'] {
  if (!value || value.format !== 'cuberplus-catalog-v1' || !value.solves || typeof value.solves !== 'object' ||
      Array.isArray(value.solves) || Object.keys(value.solves).length > 10000 ||
      Object.entries(value.solves).some(([key, solve]) => !/^[a-f0-9]{64}$/.test(key) || !solve || typeof solve !== 'object')) {
    throw new Error('Invalid shared solve catalog.');
  }
  return value.solves;
}
async function solveKey(solve: SharedSolve): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(publicSolve(solve, 0))));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}
export async function readShare(file: FileRef, signal?: AbortSignal): Promise<Snapshot> {
  const budget = { remaining: MAX_SHARE_BYTES };
  const value = await readPublic<Snapshot | Manifest>(file, signal, budget);
  if (value?.format === 'cuberplus-share-v1') return validateSnapshot(value);
  if (!value || value.format !== 'cuberplus-share-v2' || !Array.isArray(value.catalogs) || value.catalogs.length > 10000 ||
      !Array.isArray(value.rows) || !value.rows.length || value.rows.length > 10000 ||
      value.rows.some(row => !row || !/^[a-f0-9]{64}$/.test(row.solve) ||
        !Number.isSafeInteger(row.catalog) || row.catalog < 0 || !value.catalogs[row.catalog])) throw new Error('Invalid shared solve references.');
  const catalogs = new Map<number, Catalog['solves']>();
  for (const index of new Set(value.rows.map(row => row.catalog))) {
    catalogs.set(index, catalogSolves(await readPublic<Catalog>(value.catalogs[index], signal, budget)));
  }
  const rows = await Promise.all(value.rows.map(async ({ solve: key, catalog, ...row }, index) => {
    const solve = catalogs.get(catalog)?.[key];
    if (!solve || await solveKey(solve) !== key) throw new Error('A shared solve is missing or has changed.');
    return { ...row, solve: publicSolve(solve, index) };
  }));
  return validateSnapshot({ format: 'cuberplus-share-v1', kind: value.kind, time: value.time, rows });
}
async function createPublicFile(value: Catalog | Manifest, name: string): Promise<PublishedShare> {
  const data = JSON.stringify(value);
  if (new Blob([data]).size > MAX_SHARE_BYTES) throw new Error('This selection is too large to share. Select fewer solves.');
  const file = await (await authorized(api, { method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, mimeType: 'application/json', appProperties:
      value.format === 'cuberplus-catalog-v1' ? { cuberplusCatalog: 'v1' } : { cuberplusShare: 'v2' } }),
  })).json() as PublishedShare;
  try {
    await authorized(`https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(file.id)}?uploadType=media`,
      { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: data });
    await authorized(`${api}/${encodeURIComponent(file.id)}/permissions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'anyone', role: 'reader', allowFileDiscovery: false }),
    });
    return await (await authorized(`${api}/${encodeURIComponent(file.id)}?fields=id,name,resourceKey`)).json() as PublishedShare;
  } catch (failure) {
    try { await deleteShare(file.id); }
    catch { throw new Error('Publishing failed and cleanup could not finish. Open Options > Shared solves > Delete all shared data. Your private backup is unchanged.'); }
    throw failure;
  }
}
async function publish(snapshot: Snapshot): Promise<PublishedShare> {
  snapshot = await validateSnapshot(snapshot);
  if (new Blob([JSON.stringify(snapshot)]).size > MAX_SHARE_BYTES) throw new Error('This selection is too large to share. Select fewer solves.');
  const files = await listFiles('cuberplusCatalog'), known = new Map<string, number>();
  const catalogs: FileRef[] = files.map(({ id, resourceKey }) => ({ id, ...(resourceKey ? { resourceKey } : {}) }));
  for (const [index, file] of files.entries()) {
    const data = await readJson<Catalog>(await authorized(`${api}/${encodeURIComponent(file.id)}?alt=media`));
    for (const key of Object.keys(catalogSolves(data))) if (!known.has(key)) known.set(key, index);
  }
  const additions: Catalog = { format: 'cuberplus-catalog-v1', solves: {} };
  const keys = await Promise.all(snapshot.rows.map(row => solveKey(row.solve)));
  const rows = snapshot.rows.map(({ solve, ...row }, index) => {
    const key = keys[index];
    if (!known.has(key)) { additions.solves[key] = publicSolve(solve, 0); known.set(key, files.length); }
    return { ...row, solve: key, catalog: known.get(key)! };
  });
  // Immutable batches avoid duplicating recordings in Drive's retained file revisions.
  if (Object.keys(additions.solves).length) {
    const { id, resourceKey } = await createPublicFile(additions, `CuberPlus public solve catalog ${new Date().toISOString()}.json`);
    catalogs.push({ id, ...(resourceKey ? { resourceKey } : {}) });
  }
  if (catalogs.length > 10000) throw new Error('The public catalog has too many batches. Delete all shared data in Options to start a new catalog.');
  const manifest: Manifest = { format: 'cuberplus-share-v2', kind: snapshot.kind, time: snapshot.time, catalogs, rows };
  const file = await createPublicFile(manifest, `CuberPlus ${snapshot.kind} ${new Date().toISOString()}.json`);
  try {
    // Verify the exact recipient path, including catalog access, without a publisher token.
    await readShare(file);
    return file;
  } catch (failure) {
    try { await deleteShare(file.id); }
    catch { throw new Error('Publishing failed and cleanup could not finish. Open Options > Shared solves > Delete all shared data.'); }
    throw failure;
  }
}
export function publishShare(snapshot: Snapshot): Promise<PublishedShare> {
  const run = async (): Promise<PublishedShare> => typeof navigator !== 'undefined' && navigator.locks
    ? navigator.locks.request('cuberplus-drive-sharing', () => publish(snapshot)) : publish(snapshot);
  const result = publishing.then(run);
  publishing = result.then(() => {}, () => {});
  return result;
}
