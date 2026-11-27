/** @jest-environment node */
import { webcrypto } from 'node:crypto';
import type { Snapshot } from '../../src/sharing/snapshot';
const mockOAuth = jest.fn(), mockValidate = jest.fn(async (value: Snapshot) => {
  if (new Set(value.rows.map(row => row.solve.id)).size !== value.rows.length) throw new Error('Duplicate solve IDs in backup.');
  return value;
});
jest.mock('../../src/cloud/providers', () => ({ googleOAuth: async () => ({ initTokenClient: mockOAuth }) }));
jest.mock('../../src/sharing/snapshot', () => ({
  ...jest.requireActual('../../src/sharing/snapshot'), MAX_SHARE_BYTES: 1024 * 1024,
  validateSnapshot: (value: Snapshot) => mockValidate(value),
}));
type Catalog = { format: 'cuberplus-catalog-v1'; solves: Record<string, Snapshot['rows'][number]['solve']> };
type Manifest = {
  format: 'cuberplus-share-v2'; catalogs: { id: string; resourceKey?: string }[];
  rows: { solve: string; catalog: number; trimmed: string | null }[];
};
type Stored = { id: string; name: string; resourceKey: string; appProperties: Record<string, string>; public: boolean; data: Catalog | Manifest | Snapshot };
let drive: typeof import('../../src/sharing/drive'), request: jest.Mock<Promise<Response>, [string, RequestInit?]>;
let files: Map<string, Stored>, sequence: number;
const json = (value: object, status = 200) => new Response(JSON.stringify(value), { status });
const selection = (first: number, count: number): Snapshot => ({
  format: 'cuberplus-share-v1', kind: count === 1 ? 'solve' : 'average', time: 12,
  rows: Array.from({ length: count }, (_, index) => ({
    number: first + index, time: 12, turns: 1, tps: 1, trimmed: null,
    solve: {
      version: 1, id: `shared-${index + 1}`, session: 'Shared', device: '', reason: '', timingBasis: 'host',
      createdAt: new Date(1700000000000 + (first + index) * 1000).toISOString(),
      scramble: 'R', startFacelets: 'fixture', duration: 12000, status: 'complete',
      moves: [{ move: "R'", elapsed: 0, hostTime: 0, localTimestamp: null, cubeTimestamp: null }],
    },
  })),
});
const catalogs = () => [...files.values()].filter(file => file.appProperties['cuberplusCatalog']);
beforeEach(() => {
  jest.resetModules(); jest.clearAllMocks(); files = new Map(); sequence = 0;
  Object.assign(globalThis, { __GOOGLE_CLIENT_ID__: 'public-client', __GOOGLE_DRIVE_API_KEY__: 'public-api-key' });
  Object.defineProperty(globalThis, 'crypto', { configurable: true, value: webcrypto });
  Object.defineProperty(globalThis, 'location', { configurable: true, value: { origin: 'https://cuberplus.com' } });
  mockOAuth.mockImplementation((options: { callback: (response: object) => void }) => ({
    requestAccessToken: () => options.callback({ access_token: 'publisher-token', scope: 'https://www.googleapis.com/auth/drive.file', expires_in: 3600 }),
  }));
  request = jest.fn(async (address, init = {}) => {
    const url = new URL(address), method = init.method ?? 'GET', id = url.pathname.match(/\/files\/([^/]+)/)?.[1];
    if (method === 'POST' && url.pathname.endsWith('/files')) {
      const file: Stored = { id: `file-${++sequence}`, resourceKey: 'resource-key', public: false, ...JSON.parse(init.body as string) };
      files.set(file.id, file); return json(file);
    }
    if (method === 'GET' && url.pathname.endsWith('/files')) {
      const query = url.searchParams.get('q')!;
      return json({ files: [...files.values()].filter(file => Object.keys(file.appProperties).some(key => query.includes(key))).map(({ id, name, resourceKey }) => ({ id, name, resourceKey })) });
    }
    const file = files.get(id!);
    if (!file) return json({}, 404);
    if (method === 'PATCH') { file.data = JSON.parse(init.body as string); return json({ id }); }
    if (method === 'POST' && url.pathname.endsWith('/permissions')) { file.public = true; return json({ id: 'public-permission' }); }
    if (method === 'DELETE') { files.delete(id!); return new Response(null, { status: 204 }); }
    if (url.searchParams.get('alt') === 'media') {
      return json(file.data, (init.headers as Record<string, string>)?.['Authorization'] || file.public ? 200 : 403);
    }
    return json({ id, name: file.name, resourceKey: file.resourceKey });
  });
  globalThis.fetch = request;
  drive = require('../../src/sharing/drive') as typeof drive;
});
test('overlapping ao1000 shares store 1001 solves, not 2000, and both resolve their original rows', async () => {
  await drive.connectSharing();
  const first = await drive.publishShare(selection(1, 1000));
  const secondSelection = selection(2, 1000); secondSelection.rows[0].trimmed = 'best';
  const second = await drive.publishShare(secondSelection);
  expect(catalogs().map(file => Object.keys((file.data as Catalog).solves).length)).toEqual([1000, 1]);
  const manifests = [...files.values()].filter(file => file.appProperties['cuberplusShare']);
  expect(manifests).toHaveLength(2);
  expect((manifests[0].data as Manifest).rows.every(row => typeof row.solve === 'string')).toBe(true);
  expect(await drive.readShare(first)).toMatchObject({ rows: selection(1, 1000).rows.map(({ number, time, solve }) => ({ number, time, solve: { createdAt: solve.createdAt } })) });
  const read = await drive.readShare(second);
  expect(read.rows).toHaveLength(1000);
  expect(read.rows[0]).toMatchObject({ number: 2, trimmed: 'best', solve: { createdAt: secondSelection.rows[0].solve.createdAt } });
  await drive.deleteShare(first.id);
  expect(catalogs()).toHaveLength(2);
  expect((await drive.readShare(second)).rows).toHaveLength(1000);
});
test('repeated and concurrent publications reuse catalog data; edited versions preserve older results', async () => {
  await drive.connectSharing();
  const source = selection(1, 1);
  const [first] = await Promise.all([drive.publishShare(source), drive.publishShare(source)]);
  expect(catalogs()).toHaveLength(1);
  const edited = structuredClone(source); edited.rows[0].solve.penalty = 2000; edited.rows[0].time = 14;
  const second = await drive.publishShare(edited);
  expect(catalogs()).toHaveLength(2);
  expect((await drive.readShare(first)).rows[0].time).toBe(12);
  expect((await drive.readShare(second)).rows[0]).toMatchObject({ time: 14, solve: { penalty: 2000 } });
});
test('publishing uses separate file permission and verifies manifests and catalogs anonymously without credentials', async () => {
  await drive.connectSharing();
  const file = await drive.publishShare(selection(1, 1));
  expect(mockOAuth.mock.calls[0][0].scope).toBe('https://www.googleapis.com/auth/drive.file');
  const creates = request.mock.calls.filter(([url, init]) => url.endsWith('/files') && init?.method === 'POST');
  expect(creates.map(([, init]) => JSON.parse(init!.body as string).appProperties)).toEqual([{ cuberplusCatalog: 'v1' }, { cuberplusShare: 'v2' }]);
  expect(creates.every(([, init]) => !JSON.parse(init!.body as string).parents)).toBe(true);
  const anonymous = request.mock.calls.filter(([url]) => url.includes('key=public-api-key'));
  expect(anonymous).toHaveLength(2);
  expect(anonymous.every(([, init]) => init?.credentials === 'omit' && !(init.headers as Record<string, string>)['Authorization'])).toBe(true);
  expect(anonymous[0][1]?.headers).toEqual({ 'X-Goog-Drive-Resource-Keys': `${file.id}/resource-key` });
  expect(drive.shareUrl(file)).toBe(`https://cuberplus.com/share/?id=${file.id}&resourceKey=resource-key`);
  expect(request.mock.calls.map(([url]) => url).join(' ')).not.toContain('appDataFolder');
});
test('failed anonymous verification deletes the new link, retains reusable catalog data, and permits retry', async () => {
  await drive.connectSharing();
  const normal = request.getMockImplementation()!;
  request.mockImplementation((url, init) => url.includes('key=') ? Promise.resolve(json({}, 403)) : normal(url, init));
  await expect(drive.publishShare(selection(1, 1))).rejects.toThrow('unavailable');
  expect(files.size).toBe(1); expect(catalogs()).toHaveLength(1);
  request.mockImplementation(normal);
  await drive.publishShare(selection(1, 1));
  expect(catalogs()).toHaveLength(1);
});
test('cleanup failures identify the option that also removes orphan catalog files', async () => {
  await drive.connectSharing();
  const normal = request.getMockImplementation()!;
  request.mockImplementation((url, init) => init?.method === 'PATCH' || init?.method === 'DELETE' ? Promise.resolve(json({}, 403)) : normal(url, init));
  await expect(drive.publishShare(selection(1, 1))).rejects.toThrow('Options > Cloud backup > Shared solves > Delete all shared data');
});
test('signed-out reading preserves legacy links and rejects oversized, revoked, missing or changed data', async () => {
  request.mockResolvedValueOnce(json(selection(1, 1)));
  expect(await drive.readShare({ id: 'legacy-file' })).toEqual(selection(1, 1));
  expect(mockOAuth).not.toHaveBeenCalled();
  expect(request.mock.calls[0][1]).toMatchObject({ credentials: 'omit' });
  expect(request.mock.calls[0][1]?.headers).toBeUndefined();
  request.mockResolvedValueOnce(new Response('x'.repeat(1024 * 1024 + 1)));
  await expect(drive.readShare({ id: 'public-file' })).rejects.toThrow('too large');
  await expect(drive.readShare({ id: 'gone' })).rejects.toThrow('revoked');
  await expect(drive.readShare({ id: '../private' })).rejects.toThrow('Invalid');
  await drive.connectSharing();
  const file = await drive.publishShare(selection(1, 1));
  const catalog = catalogs()[0].data as Catalog;
  Object.values(catalog.solves)[0].duration = 99999;
  await expect(drive.readShare(file)).rejects.toThrow('changed');
});
test('management lists links, not catalogs, supports pagination, and explicitly deletes all public data', async () => {
  await drive.connectSharing();
  await drive.publishShare(selection(1, 1));
  const shares = await drive.listShares();
  expect(shares).toHaveLength(1); expect(shares[0].name).not.toContain('catalog');
  request.mockResolvedValueOnce(json({ files: [shares[0]], nextPageToken: 'next' })).mockResolvedValueOnce(json({ files: [] }));
  expect(await drive.listShares()).toEqual(shares);
  expect(request.mock.calls.at(-1)![0]).toContain('pageToken=next');
  await drive.deleteSharedData();
  expect(files.size).toBe(0);
  drive.disconnectSharing();
  await expect(drive.deleteShare('one')).rejects.toThrow('expired');
});
