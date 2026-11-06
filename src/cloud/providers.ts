import type { PublicClientApplication } from '@azure/msal-browser';

declare const __GOOGLE_CLIENT_ID__: string;
declare const __MICROSOFT_CLIENT_ID__: string;
export type Provider = 'google' | 'microsoft';
export const providerNames = { google: 'Google Drive', microsoft: 'Microsoft OneDrive' };
const clientIds = {
  google: typeof __GOOGLE_CLIENT_ID__ === 'string' ? __GOOGLE_CLIENT_ID__ : '',
  microsoft: typeof __MICROSOFT_CLIENT_ID__ === 'string' ? __MICROSOFT_CLIENT_ID__ : '',
};
const fileName = 'cuberplus-backup.json.gz';
const googleScope = 'https://www.googleapis.com/auth/drive.appdata';
const microsoftScopes = ['Files.ReadWrite.AppFolder'];
const graph = 'https://graph.microsoft.com/v1.0/me/drive';
type GoogleResponse = { access_token?: string; expires_in?: number; scope?: string; error?: string };
type GoogleOAuth = {
  initTokenClient: (options: {
    client_id: string; scope: string; callback: (response: GoogleResponse) => void;
    error_callback: () => void;
  }) => { requestAccessToken: (options: { prompt: string }) => void };
};
type DriveItem = { id: string; eTag?: string; size?: number; '@microsoft.graph.downloadUrl'?: string };
export type RemoteFile = { id: string; revision: string | null; size?: number; content: Blob };
export class CloudHttpError extends Error {
  constructor(public status: number) {
    super(status === 401 ? 'Cloud sign-in expired. Reconnect in Options; your backup is still pending.' :
      status === 409 || status === 412 ? 'The cloud backup changed on another device. Please try again.' :
      status === 403 ? 'Cloud access was denied. Check app permissions and available storage, then reconnect.' :
      status === 429 ? 'Cloud requests are temporarily limited. Your backup is still pending; try again later.' :
      `Cloud request failed (${status}). Your local data has not been removed.`);
  }
}
let googleToken: { value: string; expires: number } | null = null;
let googleScript: Promise<GoogleOAuth> | null = null;
let msal: Promise<PublicClientApplication> | null = null;
let microsoftReady: PublicClientApplication | null = null;

export const isConfigured = (provider: Provider): boolean => !!clientIds[provider];
export const isConnected = (provider: Provider): boolean => provider === 'google'
  ? !!googleToken && googleToken.expires > Date.now()
  : !!microsoftReady?.getActiveAccount();

function googleOAuth(): Promise<GoogleOAuth> {
  const oauth = () => (window as Window & { google?: { accounts?: { oauth2?: GoogleOAuth } } }).google?.accounts?.oauth2;
  const loaded = oauth();
  if (loaded) return Promise.resolve(loaded);
  if (!googleScript) {
    googleScript = new Promise<GoogleOAuth>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client'; script.async = true;
      const timeout = setTimeout(() => { script.remove(); reject(new Error('Google sign-in did not load. Check your connection and try again.')); }, 20000);
      script.onload = () => { clearTimeout(timeout); const api = oauth(); if (api) resolve(api); else reject(new Error('Google sign-in is unavailable.')); };
      script.onerror = () => { clearTimeout(timeout); script.remove(); reject(new Error('Google sign-in could not load. Check your connection and try again.')); };
      document.head.appendChild(script);
    }).catch((failure: Error) => { googleScript = null; throw failure; });
  }
  return googleScript;
}
async function microsoft(): Promise<PublicClientApplication> {
  if (!msal) msal = import('@azure/msal-browser').then(async ({ PublicClientApplication }) => {
    const app = new PublicClientApplication({
      auth: { clientId: clientIds.microsoft, authority: 'https://login.microsoftonline.com/common', redirectUri: `${location.origin}/auth-callback.html` },
      cache: { cacheLocation: 'sessionStorage' },
    });
    await app.initialize();
    microsoftReady = app;
    return app;
  }).catch((failure: Error) => { msal = null; throw failure; });
  return msal;
}
export async function prepareProvider(provider: Provider): Promise<void> {
  if (!isConfigured(provider)) return;
  if (provider === 'google') await googleOAuth();
  else await microsoft();
}
export async function connectProvider(provider: Provider): Promise<void> {
  if (!isConfigured(provider)) throw new Error(`${providerNames[provider]} is not configured by this site's owner yet.`);
  if (provider === 'google') {
    const api = await googleOAuth();
    await new Promise<void>((resolve, reject) => {
      api.initTokenClient({
        client_id: clientIds.google, scope: googleScope,
        callback: response => {
          if (!response.access_token || !response.scope?.split(' ').includes(googleScope)) {
            reject(new Error('Google Drive permission was not granted. Please reconnect and allow app-data access.')); return;
          }
          googleToken = { value: response.access_token, expires: Date.now() + Math.max(0, (Number(response.expires_in) || 0) - 60) * 1000 };
          resolve();
        },
        error_callback: () => reject(new Error('Sign-in was cancelled or the popup was blocked. Please try again.')),
      }).requestAccessToken({ prompt: 'select_account' });
    });
  } else {
    const app = await microsoft();
    const response = await app.acquireTokenPopup({ scopes: microsoftScopes, prompt: 'select_account' });
    app.setActiveAccount(response.account);
  }
}
export async function disconnectProvider(provider: Provider): Promise<void> {
  if (provider === 'google') googleToken = null;
  else if (msal) {
    const app = await msal;
    const account = app.getActiveAccount();
    if (account) await app.clearCache({ account });
    app.setActiveAccount(null);
  }
}
async function accessToken(provider: Provider): Promise<string> {
  if (!isConfigured(provider)) throw new Error(`${providerNames[provider]} is not configured by this site's owner yet.`);
  if (provider === 'google') {
    if (isConnected('google')) return googleToken!.value;
  } else {
    const app = await microsoft(), account = app.getActiveAccount();
    if (account) {
      try { return (await app.acquireTokenSilent({ scopes: microsoftScopes, account })).accessToken; }
      catch { /* Automatic backups must never open a sign-in popup. */ }
    }
  }
  throw new Error('Cloud sign-in expired or disconnected. Reconnect in Options; your backup is still pending.');
}
async function authorized(provider: Provider, url: string, init: RequestInit = {}): Promise<Response> {
  const response = await fetch(url, { ...init, cache: 'no-store', headers: { ...init.headers, Authorization: `Bearer ${await accessToken(provider)}` } });
  if (response.status === 401 && provider === 'google') googleToken = null;
  return response;
}
const checked = (response: Response): Response => { if (!response.ok) throw new CloudHttpError(response.status); return response; };
function microsoftTransferUrl(value: string): string {
  const url = new URL(value);
  if (url.protocol !== 'https:' || !['.1drv.com', '.sharepoint.com', '.storage.live.com', '.onedrive.com', '.microsoftpersonalcontent.com'].some(domain => url.hostname.endsWith(domain))) {
    throw new Error(`OneDrive returned an unexpected transfer address (${url.hostname}).`);
  }
  return url.href;
}
async function appFolder(): Promise<DriveItem> {
  return await checked(await authorized('microsoft', `${graph}/special/approot`)).json() as DriveItem;
}
export async function readRemote(provider: Provider): Promise<RemoteFile | null> {
  if (provider === 'google') {
    const query = new URLSearchParams({ spaces: 'appDataFolder', q: `name = '${fileName}' and trashed = false`, fields: 'files(id)', orderBy: 'modifiedTime desc', pageSize: '1' });
    const result = await checked(await authorized(provider, `https://www.googleapis.com/drive/v3/files?${query}`)).json() as { files: { id: string }[] };
    if (!result.files.length) return null;
    const id = result.files[0].id;
    const response = checked(await authorized(provider, `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?alt=media`));
    return { id, revision: response.headers.get('ETag'), content: await response.blob() };
  }
  const folder = await appFolder();
  const response = await authorized(provider, `${graph}/items/${encodeURIComponent(folder.id)}:/${fileName}?$select=id,eTag,@microsoft.graph.downloadUrl`);
  if (response.status === 404) return null;
  let item = await checked(response).json() as DriveItem;
  // Retry by ID without $select when the path response omits the download annotation.
  if (!item['@microsoft.graph.downloadUrl']) {
    item = await checked(await authorized(provider, `${graph}/items/${encodeURIComponent(item.id)}`)).json() as DriveItem;
  }
  if (!item['@microsoft.graph.downloadUrl']) throw new Error('OneDrive did not return a backup download address.');
  // Preauthenticated transfer URLs must never receive our Graph access token.
  const content = await checked(await fetch(microsoftTransferUrl(item['@microsoft.graph.downloadUrl']), { cache: 'no-store' })).blob();
  return { id: item.id, revision: item.eTag ?? null, size: item.size, content };
}
export async function writeRemote(provider: Provider, content: Blob, previous: RemoteFile | null): Promise<void> {
  const conditional: Record<string, string> = previous?.revision ? { 'If-Match': previous.revision } : {};
  if (provider === 'google') {
    const url = `https://www.googleapis.com/upload/drive/v3/files${previous ? `/${encodeURIComponent(previous.id)}` : ''}?uploadType=resumable`;
    const session = checked(await authorized(provider, url, {
      method: previous ? 'PATCH' : 'POST',
      headers: { ...conditional, 'Content-Type': 'application/json', 'X-Upload-Content-Type': 'application/gzip' },
      body: JSON.stringify(previous ? {} : { name: fileName, parents: ['appDataFolder'], mimeType: 'application/gzip' }),
    }));
    const location = session.headers.get('Location');
    if (!location || new URL(location).origin !== 'https://www.googleapis.com') throw new Error('Google Drive did not return a valid upload address.');
    checked(await authorized(provider, location, { method: 'PUT', headers: { ...conditional, 'Content-Type': 'application/gzip' }, body: content }));
  } else {
    const target = previous ? `${graph}/items/${encodeURIComponent(previous.id)}` : `${graph}/items/${encodeURIComponent((await appFolder()).id)}:/${fileName}:`;
    const session = await checked(await authorized(provider, `${target}/createUploadSession`, {
      method: 'POST', headers: { ...conditional, 'Content-Type': 'application/json' },
      body: JSON.stringify({ item: { '@microsoft.graph.conflictBehavior': previous ? 'replace' : 'fail', name: fileName } }),
    })).json() as { uploadUrl: string };
    const uploadUrl = microsoftTransferUrl(session.uploadUrl), chunkSize = 10 * 1024 * 1024;
    for (let offset = 0; offset < content.size; offset += chunkSize) {
      const end = Math.min(offset + chunkSize, content.size);
      checked(await fetch(uploadUrl, {
        method: 'PUT', headers: { 'Content-Range': `bytes ${offset}-${end - 1}/${content.size}` },
        body: content.slice(offset, end), cache: 'no-store',
      }));
    }
  }
}
