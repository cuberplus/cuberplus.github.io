/** @jest-environment node */
import type { Solve } from '../../timer/src/engine';
import { backupNow, cloudState, configureCloud, connectCloud, decodeCloudBackup, dedupeById, encodeCloudBackup, noteCloudSolve, restoreNow } from '../cloud/backup';
import { CloudHttpError, readRemote, writeRemote } from '../cloud/providers';

jest.mock('../cloud/providers', () => ({
  ...jest.requireActual('../cloud/providers'),
  connectProvider: jest.fn(async () => {}),
  disconnectProvider: jest.fn(async () => {}),
  prepareProvider: jest.fn(async () => {}),
  isConfigured: () => true,
  isConnected: () => true,
  readRemote: jest.fn(async () => null),
  writeRemote: jest.fn(async () => {}),
}));
const mockRead = jest.fn<Promise<Solve[]>, []>();
const mockSave = jest.fn<Promise<void>, [Solve[]]>();
const mockValidate = jest.fn((json: string) => {
  const data = JSON.parse(json) as { format: string; solves: Solve[] };
  if (data.format !== 'timer-v2' || data.solves.some(solve => !solve.id || solve.duration < 0)) throw new Error('Invalid timer backup');
  return data.solves;
});
jest.mock('../../timer/src/storage', () => ({
  readSolves: () => mockRead(), saveSolves: (solves: Solve[]) => mockSave(solves),
  backupJSON: (solves: Solve[]) => JSON.stringify({ format: 'timer-v2', solves }),
  validateBackup: (json: string) => mockValidate(json),
}));
jest.mock('../../timer/src/puzzle', () => ({ loadCube: async () => ({}) }));
const values = new Map<string, string>();
const local = { id: 'local', status: 'complete', duration: 10000 } as Solve;
const cloud = { id: 'cloud', status: 'complete', duration: 12000 } as Solve;
const same = { id: 'shared', status: 'complete', duration: 8000 } as Solve;
const remote = async (solves: Solve[], settings = {}) => ({
  id: 'file', revision: 'etag', content: await encodeCloudBackup({
    format: 'cuberplus-cloud-v1', savedAt: '2026-11-05T00:00:00.000Z',
    timer: { format: 'timer-v2', solves }, settings,
  }),
});
beforeAll(() => {
  Object.defineProperty(globalThis, 'window', { configurable: true, value: new EventTarget() });
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  } });
  if (!globalThis.navigator) Object.defineProperty(globalThis, 'navigator', { configurable: true, value: {} });
});
beforeEach(() => {
  values.clear(); jest.clearAllMocks();
  mockRead.mockResolvedValue([local, same]); mockSave.mockResolvedValue();
  jest.mocked(readRemote).mockResolvedValue(null);
  jest.mocked(writeRemote).mockResolvedValue();
});
test('backup merges cloud-only solves, dedupes both inputs and lets local matching IDs win', async () => {
  jest.mocked(readRemote).mockResolvedValue(await remote([cloud, { ...same, duration: 15000 }, cloud]));
  mockRead.mockResolvedValue([local, same, local, { id: 'active', status: 'active' } as Solve]);
  localStorage.setItem('theme', 'dark');
  localStorage.setItem('cuberplus-database-favorites', '["PLL-T:R U R\'"]');
  localStorage.setItem('unrelated-secret', 'do-not-upload');
  expect(await backupNow()).toBe(true);
  const [provider, content] = jest.mocked(writeRemote).mock.calls[0];
  const decoded = await decodeCloudBackup(content);
  expect(provider).toBe('google');
  expect(decoded.solves).toEqual([cloud, same, local]);
  expect(decoded.settings.theme).toBe('dark');
  expect(decoded.settings['cuberplus-database-favorites']).toContain('PLL-T');
  expect(decoded.settings).not.toHaveProperty('unrelated-secret');
  expect(cloudState().lastBackup).not.toBeNull();
});
test('restore dedupes by ID, preserves local-only solves, and uses cloud edits and settings', async () => {
  jest.mocked(readRemote).mockResolvedValue(await remote([cloud, { ...same, duration: 6000 }, cloud], {
    theme: 'light', 'timer-sessions': '["Practice"]', 'cuberplus-custom-algorithms': '{"PLL-T":["R U R\'"]}',
    'cuberplus-database-favorites': '["PLL-T:R U R\'"]', 'timer-inspection': null,
  }));
  localStorage.setItem('theme', 'dark'); localStorage.setItem('timer-inspection', 'true');
  expect(await restoreNow()).toBe(true);
  expect(mockSave).toHaveBeenLastCalledWith([local, { ...same, duration: 6000 }, cloud]);
  expect(localStorage.getItem('theme')).toBe('light');
  expect(localStorage.getItem('timer-inspection')).toBeNull();
  expect(localStorage.getItem('cuberplus-custom-algorithms')).toContain('PLL-T');
  expect(jest.mocked(writeRemote)).not.toHaveBeenCalled();
});
test('malformed backups do not write solves or settings on restore or overwrite cloud on backup', async () => {
  const bad = await remote([{ ...cloud, duration: -1 }]);
  jest.mocked(readRemote).mockResolvedValue(bad);
  localStorage.setItem('theme', 'dark');
  expect(await restoreNow()).toBe(false);
  expect(localStorage.getItem('theme')).toBe('dark');
  expect(mockSave).not.toHaveBeenCalled();
  expect(await backupNow()).toBe(false);
  expect(writeRemote).not.toHaveBeenCalled();
});
test('a confirmed empty OneDrive file can be backed up using its existing ID and revision', async () => {
  configureCloud('microsoft', false, false);
  const empty = { id: 'empty-file', revision: 'empty-revision', size: 0, content: new Blob() };
  jest.mocked(readRemote).mockResolvedValue(empty);
  localStorage.setItem('theme', 'dark');
  expect(await backupNow()).toBe(true);
  const [provider, content, previous] = jest.mocked(writeRemote).mock.calls[0];
  expect(provider).toBe('microsoft');
  expect(previous).toBe(empty);
  expect(await decodeCloudBackup(content)).toMatchObject({ solves: [local, same], settings: { theme: 'dark' } });
  expect(mockSave).not.toHaveBeenCalled();
});
test('an empty placeholder changed by another device is reread and merged on conflict', async () => {
  configureCloud('microsoft', false, false);
  jest.mocked(readRemote).mockResolvedValueOnce({ id: 'file', revision: 'empty-revision', size: 0, content: new Blob() })
    .mockResolvedValueOnce(await remote([cloud, { ...same, duration: 15000 }]));
  jest.mocked(writeRemote).mockRejectedValueOnce(new CloudHttpError(412));
  expect(await backupNow()).toBe(true);
  expect(readRemote).toHaveBeenCalledTimes(2);
  const [, content, previous] = jest.mocked(writeRemote).mock.calls[1];
  expect(previous?.revision).toBe('etag');
  expect((await decodeCloudBackup(content)).solves).toEqual([cloud, same, local]);
});
test('an unexpectedly empty download of a nonempty file is never overwritten', async () => {
  configureCloud('microsoft', false, false);
  jest.mocked(readRemote).mockResolvedValue({ id: 'file', revision: 'etag', size: 100, content: new Blob() });
  expect(await backupNow()).toBe(false);
  expect(writeRemote).not.toHaveBeenCalled();
});
test('restoring an empty cloud file reports the problem without modifying local data', async () => {
  jest.mocked(readRemote).mockResolvedValue({ id: 'file', revision: 'etag', size: 0, content: new Blob() });
  localStorage.setItem('theme', 'dark');
  expect(await restoreNow()).toBe(false);
  expect(cloudState().message).toContain('empty');
  expect(localStorage.getItem('theme')).toBe('dark');
  expect(mockSave).not.toHaveBeenCalled();
  expect(writeRemote).not.toHaveBeenCalled();
});
test('failed local solve writes roll back restored settings', async () => {
  jest.mocked(readRemote).mockResolvedValue(await remote([cloud], { theme: 'light' }));
  localStorage.setItem('theme', 'dark');
  mockSave.mockRejectedValueOnce(new Error('IDB unavailable'));
  expect(await restoreNow()).toBe(false);
  expect(localStorage.getItem('theme')).toBe('dark');
  expect(cloudState().error).toBe(true);
});
test('restoring while a Timer attempt is active preserves all local data', async () => {
  jest.mocked(readRemote).mockResolvedValue(await remote([cloud], { theme: 'light' }));
  mockRead.mockResolvedValue([{ ...local, status: 'active' }]);
  expect(await restoreNow()).toBe(false);
  expect(mockSave).not.toHaveBeenCalled();
  expect(localStorage.getItem('theme')).toBeNull();
});
test('every 100 solves counts unique finished IDs, skips active solves, and resets only after success', async () => {
  configureCloud('google', true, false);
  await noteCloudSolve({ id: 'active', status: 'active' }, []);
  for (let i = 0; i < 99; i++) await noteCloudSolve({ id: String(i), status: i % 2 ? 'incomplete' : 'complete' }, []);
  await noteCloudSolve({ id: '98', status: 'complete' }, []);
  expect(writeRemote).not.toHaveBeenCalled();
  expect(cloudState().pending).toBe(99);
  mockRead.mockResolvedValue(Array.from({ length: 100 }, (_, i) => ({ ...local, id: String(i) })));
  await noteCloudSolve({ id: '99', status: 'complete' }, []);
  expect(writeRemote).toHaveBeenCalledTimes(1);
  expect(cloudState().pending).toBe(0);
});
test.each(['Single', 'Ao5', 'Ao12'])('%s triggers a PB backup independently of the 100-solve option', async name => {
  configureCloud('google', false, true);
  await noteCloudSolve(local, [{ name }]);
  expect(writeRemote).toHaveBeenCalledTimes(1);
  expect(cloudState().pending).toBe(0);
});
test('Ao100/Ao1000 do not trigger PB backups, and disabled options do not count or upload', async () => {
  await noteCloudSolve(local, [{ name: 'Single' }]);
  expect(cloudState().pending).toBe(0);
  configureCloud('google', false, true);
  await noteCloudSolve(local, [{ name: 'Ao100' }, { name: 'Ao1000' }]);
  expect(writeRemote).not.toHaveBeenCalled();
});
test('failed automatic backups preserve pending work and retry it after reconnecting', async () => {
  configureCloud('google', false, true);
  jest.mocked(writeRemote).mockRejectedValueOnce(new Error('Expired authorization'));
  await noteCloudSolve(local, [{ name: 'Ao5' }]);
  expect(cloudState().pending).toBe(1);
  expect(cloudState().error).toBe(true);
  expect(cloudState().lastBackup).toBeNull();
  await connectCloud();
  expect(writeRemote).toHaveBeenCalledTimes(2);
  expect(cloudState().pending).toBe(0);
  expect(cloudState().error).toBe(false);
});
test('a concurrent cloud edit is reread and merged rather than blindly overwritten', async () => {
  jest.mocked(readRemote).mockResolvedValueOnce(await remote([cloud])).mockResolvedValueOnce(await remote([cloud, { ...cloud, id: 'other-device' }]));
  jest.mocked(writeRemote).mockRejectedValueOnce(new CloudHttpError(412));
  expect(await backupNow()).toBe(true);
  const decoded = await decodeCloudBackup(jest.mocked(writeRemote).mock.calls[1][1]);
  expect(decoded.solves.map(solve => solve.id)).toEqual(['cloud', 'other-device', 'local', 'shared']);
});
test('solves completed while an upload is in flight remain pending if absent from its snapshot', async () => {
  configureCloud('google', true, false);
  let release!: () => void;
  jest.mocked(writeRemote).mockImplementationOnce(() => new Promise(resolve => { release = () => resolve(); }));
  const uploading = backupNow();
  while (!release) await new Promise(resolve => setTimeout(resolve, 0));
  await noteCloudSolve({ id: 'finished-later', status: 'complete' }, []);
  release(); await uploading;
  expect(cloudState().pending).toBe(1);
});
test('repeated restore operations remain idempotent and preserve unique IDs', async () => {
  jest.mocked(readRemote).mockResolvedValue(await remote([cloud, cloud]));
  expect(await restoreNow()).toBe(true);
  mockRead.mockResolvedValue(mockSave.mock.calls[0][0]);
  expect(await restoreNow()).toBe(true);
  expect(mockSave.mock.calls[1][0].map(solve => solve.id)).toEqual(['local', 'shared', 'cloud']);
  expect(() => dedupeById([{ id: '' }])).toThrow('Invalid solve ID');
});
