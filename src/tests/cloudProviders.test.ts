/** @jest-environment node */
import type { RemoteFile } from '../cloud/providers';

const mockPopup = jest.fn(), mockSilent = jest.fn(), mockClear = jest.fn();
let mockAccount: { homeAccountId: string } | null = null;
jest.mock('@azure/msal-browser', () => ({
  PublicClientApplication: jest.fn().mockImplementation(() => ({
    initialize: async () => {},
    acquireTokenPopup: mockPopup, acquireTokenSilent: mockSilent, clearCache: mockClear,
    setActiveAccount: (account: typeof mockAccount) => { mockAccount = account; },
    getActiveAccount: () => mockAccount,
  })),
}));
const scope = 'https://www.googleapis.com/auth/drive.appdata';
type TokenOptions = { callback: (response: { access_token?: string; scope?: string; expires_in?: number }) => void; error_callback: () => void };
const mockInit = jest.fn((options: TokenOptions) => ({ requestAccessToken: () => options.callback({ access_token: 'google-test-token', scope, expires_in: 3600 }) }));
let api: typeof import('../cloud/providers');
let request: jest.Mock<Promise<Response>, [string, RequestInit?]>;
const json = (value: Record<string, object | string | number | null> | { files: { id: string }[] }, status = 200) =>
  new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });
beforeEach(() => {
  jest.resetModules(); jest.clearAllMocks(); mockAccount = null;
  Object.assign(globalThis, { __GOOGLE_CLIENT_ID__: 'google-public-id', __MICROSOFT_CLIENT_ID__: 'microsoft-public-id' });
  Object.defineProperty(globalThis, 'window', { configurable: true, value: { google: { accounts: { oauth2: { initTokenClient: mockInit } } } } });
  Object.defineProperty(globalThis, 'location', { configurable: true, value: { origin: 'https://cuberplus.com' } });
  request = jest.fn<Promise<Response>, [string, RequestInit?]>();
  globalThis.fetch = request;
  mockInit.mockImplementation(options => ({ requestAccessToken: () => options.callback({ access_token: 'google-test-token', scope, expires_in: 3600 }) }));
  mockPopup.mockResolvedValue({ account: { homeAccountId: 'account' }, accessToken: 'microsoft-test-token' });
  mockSilent.mockResolvedValue({ accessToken: 'microsoft-test-token' });
  api = require('../cloud/providers') as typeof api;
});
test('Google uses app-data-only consent, keeps its token out of storage, and disconnects locally', async () => {
  await api.connectProvider('google');
  expect(mockInit).toHaveBeenCalledWith(expect.objectContaining({ client_id: 'google-public-id', scope }));
  expect(api.isConnected('google')).toBe(true);
  await api.disconnectProvider('google');
  expect(api.isConnected('google')).toBe(false);
  await expect(api.readRemote('google')).rejects.toThrow('Reconnect');
  expect(request).not.toHaveBeenCalled();
});
test('declined Google permissions and popup cancellation are visible errors', async () => {
  mockInit.mockImplementationOnce(options => ({ requestAccessToken: () => options.callback({ access_token: 'token', scope: 'different-scope', expires_in: 3600 }) }));
  await expect(api.connectProvider('google')).rejects.toThrow('permission was not granted');
  mockInit.mockImplementationOnce(options => ({ requestAccessToken: () => options.error_callback() }));
  await expect(api.connectProvider('google')).rejects.toThrow('cancelled');
  expect(api.isConnected('google')).toBe(false);
});
test('Google lists the app folder and returns content with its conditional-write revision', async () => {
  await api.connectProvider('google');
  request.mockResolvedValueOnce(json({ files: [{ id: 'backup-id' }] }))
    .mockResolvedValueOnce(new Response('gzip-bytes', { headers: { ETag: '"revision"' } }));
  const file = await api.readRemote('google');
  expect(file?.id).toBe('backup-id');
  expect(file?.revision).toBe('"revision"');
  expect(await file?.content.text()).toBe('gzip-bytes');
  expect(request.mock.calls[0][0]).toContain('spaces=appDataFolder');
  expect(request.mock.calls[1][1]?.headers).toEqual({ Authorization: 'Bearer google-test-token' });
  expect(request.mock.calls[1][1]?.cache).toBe('no-store');
});
test('new Google backups use resumable upload and appDataFolder metadata', async () => {
  await api.connectProvider('google');
  request.mockResolvedValueOnce(new Response(null, { headers: { Location: 'https://www.googleapis.com/upload/session' } })).mockResolvedValueOnce(json({ id: 'new-file' }));
  const content = new Blob(['gzip']);
  await api.writeRemote('google', content, null);
  expect(request.mock.calls[0][1]?.method).toBe('POST');
  expect(JSON.parse(request.mock.calls[0][1]?.body as string)).toMatchObject({ parents: ['appDataFolder'], name: 'cuberplus-backup.json.gz' });
  expect(request.mock.calls[1][1]?.body).toBe(content);
  expect(request.mock.calls[1][1]?.method).toBe('PUT');
});
test('Google updates attach If-Match, and authorization failures discard the expired token', async () => {
  await api.connectProvider('google');
  request.mockResolvedValueOnce(new Response(null, { status: 412 }));
  await expect(api.writeRemote('google', new Blob(['gzip']), { id: 'existing', revision: 'etag', content: new Blob() })).rejects.toMatchObject({ status: 412 });
  expect(request.mock.calls[0][1]?.headers).toMatchObject({ 'If-Match': 'etag' });
  expect(request.mock.calls[0][1]?.method).toBe('PATCH');
  request.mockResolvedValueOnce(new Response(null, { status: 401 }));
  await expect(api.readRemote('google')).rejects.toThrow('expired');
  expect(api.isConnected('google')).toBe(false);
});
test('Microsoft sign-in uses MSAL with app-folder scope and the dedicated callback', async () => {
  await api.connectProvider('microsoft');
  const { PublicClientApplication } = jest.requireMock('@azure/msal-browser') as { PublicClientApplication: jest.Mock };
  expect(PublicClientApplication).toHaveBeenCalledWith(expect.objectContaining({
    auth: { clientId: 'microsoft-public-id', authority: 'https://login.microsoftonline.com/common', redirectUri: 'https://cuberplus.com/auth-callback.html' },
    cache: { cacheLocation: 'sessionStorage' },
  }));
  expect(mockPopup).toHaveBeenCalledWith({ scopes: ['Files.ReadWrite.AppFolder'], prompt: 'select_account' });
  expect(api.isConnected('microsoft')).toBe(true);
  await api.disconnectProvider('microsoft');
  expect(mockClear).toHaveBeenCalledWith({ account: { homeAccountId: 'account' } });
  expect(api.isConnected('microsoft')).toBe(false);
});
test('OneDrive downloads preauthenticated content without leaking the Graph token', async () => {
  await api.connectProvider('microsoft');
  request.mockResolvedValueOnce(json({ id: 'folder' }))
    .mockResolvedValueOnce(json({ id: 'file', eTag: 'etag', '@microsoft.graph.downloadUrl': 'https://download.files.1drv.com/backup' }))
    .mockResolvedValueOnce(new Response('gzip-data'));
  const file = await api.readRemote('microsoft');
  expect(file?.revision).toBe('etag');
  expect(request.mock.calls[0][0]).toContain('/special/approot');
  expect(request.mock.calls[0][1]?.headers).toEqual({ Authorization: 'Bearer microsoft-test-token' });
  expect(request.mock.calls[2][1]?.headers).toBeUndefined();
  expect(mockPopup).toHaveBeenCalledTimes(1);
});
test('OneDrive retries full item metadata when the selected path response omits the download URL', async () => {
  await api.connectProvider('microsoft');
  request.mockResolvedValueOnce(json({ id: 'folder' }))
    .mockResolvedValueOnce(json({ id: 'file', eTag: 'old-revision' }))
    .mockResolvedValueOnce(json({ id: 'file', eTag: 'current-revision', '@microsoft.graph.downloadUrl': 'https://download.files.1drv.com/backup' }))
    .mockResolvedValueOnce(new Response('existing-backup'));
  const file = await api.readRemote('microsoft');
  expect(file?.id).toBe('file');
  expect(file?.revision).toBe('current-revision');
  expect(await file?.content.text()).toBe('existing-backup');
  expect(request.mock.calls[2][0]).toBe('https://graph.microsoft.com/v1.0/me/drive/items/file');
  expect(request.mock.calls[2][1]?.headers).toEqual(request.mock.calls[1][1]?.headers);
  expect(request.mock.calls[3][1]?.headers).toBeUndefined();
  expect(mockPopup).toHaveBeenCalledTimes(1);
});
test('OneDrive does not treat an existing backup with no download URL as an empty cloud', async () => {
  await api.connectProvider('microsoft');
  request.mockResolvedValueOnce(json({ id: 'folder' }))
    .mockResolvedValueOnce(json({ id: 'file', eTag: 'etag' }))
    .mockResolvedValueOnce(json({ id: 'file', eTag: 'etag' }));
  await expect(api.readRemote('microsoft')).rejects.toThrow('did not return a backup download address');
  expect(request).toHaveBeenCalledTimes(3);
  expect(request.mock.calls.every(([, options]) => !options?.method)).toBe(true);
});
test.each([403, 404])('OneDrive metadata retry preserves HTTP %s errors instead of allowing an overwrite', async status => {
  await api.connectProvider('microsoft');
  request.mockResolvedValueOnce(json({ id: 'folder' }))
    .mockResolvedValueOnce(json({ id: 'file', eTag: 'etag' }))
    .mockResolvedValueOnce(new Response(null, { status }));
  await expect(api.readRemote('microsoft')).rejects.toMatchObject({ status });
  expect(request).toHaveBeenCalledTimes(3);
});
test('OneDrive creates a conflict-protected upload session and sends ordered chunks without Graph credentials', async () => {
  await api.connectProvider('microsoft');
  request.mockResolvedValueOnce(json({ uploadUrl: 'https://upload.up.1drv.com/session' }))
    .mockResolvedValueOnce(json({ nextExpectedRanges: ['10485760-'] }, 202))
    .mockResolvedValueOnce(json({ id: 'file' }, 201));
  const content = new Blob([new Uint8Array(10 * 1024 * 1024 + 17)]);
  await api.writeRemote('microsoft', content, { id: 'existing', revision: 'etag', content } as RemoteFile);
  expect(request.mock.calls[0][1]?.headers).toMatchObject({ 'If-Match': 'etag' });
  expect(request.mock.calls[1][1]?.headers).toEqual({ 'Content-Range': 'bytes 0-10485759/10485777' });
  expect(request.mock.calls[2][1]?.headers).toEqual({ 'Content-Range': 'bytes 10485760-10485776/10485777' });
});
test('missing backups return null, while permission and quota errors never look like an empty cloud', async () => {
  await api.connectProvider('microsoft');
  request.mockResolvedValueOnce(json({ id: 'folder' })).mockResolvedValueOnce(new Response(null, { status: 404 }));
  expect(await api.readRemote('microsoft')).toBeNull();
  request.mockResolvedValueOnce(new Response(null, { status: 403 }));
  await expect(api.readRemote('microsoft')).rejects.toThrow('denied');
});
test('automatic Microsoft token renewal never opens an interactive popup', async () => {
  await api.connectProvider('microsoft');
  mockSilent.mockRejectedValueOnce(new Error('interaction_required'));
  await expect(api.readRemote('microsoft')).rejects.toThrow('Reconnect');
  expect(mockPopup).toHaveBeenCalledTimes(1);
  expect(request).not.toHaveBeenCalled();
});
test('unexpected transfer origins are rejected rather than sent tokens or backup data', async () => {
  await api.connectProvider('google');
  request.mockResolvedValueOnce(new Response(null, { headers: { Location: 'https://example.com/upload' } }));
  await expect(api.writeRemote('google', new Blob(['private-data']), null)).rejects.toThrow('valid upload address');
  expect(request).toHaveBeenCalledTimes(1);
  await api.connectProvider('microsoft');
  request.mockResolvedValueOnce(json({ uploadUrl: 'https://example.com/upload' }));
  await expect(api.writeRemote('microsoft', new Blob(['private-data']), { id: 'file', revision: 'etag', content: new Blob() })).rejects.toThrow('unexpected transfer');
  expect(request).toHaveBeenCalledTimes(2);
});
