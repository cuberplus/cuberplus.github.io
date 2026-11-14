import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { TimerEngine, type Solve } from '../../timer/src/Core/engine';
import { loadCube, SOLVED, type Cube } from '../../timer/src/Core/puzzle';
import { backupJSON, readSolves, saveSolves, validateBackup, validateBackupData } from '../../timer/src/Data/storage';
import { readSettings, restoreSettings, type Settings } from '../../src/cloud/backupSettings';
import { userBackupJSON, validateUserBackup } from '../../src/cloud/userBackup';
import { excludedSettings, userSettings } from '../fixtures/userSettings';
import { persistReplayAnalysis, solveAnalysis } from '../../timer/src/Analysis/analysis';
import { readLocalAnalysis } from '../../timer/src/Analysis/analyzer-data';

const values = new Map<string, string>();
let cube: Cube;
beforeAll(async () => {
  cube = await loadCube();
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    removeItem: (key: string) => { values.delete(key); },
  } });
});
beforeEach(() => { values.clear(); globalThis.indexedDB = new IDBFactory(); });
function sample(): Solve {
  const timer = new TimerEngine(cube, () => {}, () => {});
  timer.connect('Test cube'); timer.synchronize(SOLVED); timer.prepare('R U2');
  ['R', 'U2', 'U2', "R'"].forEach((move, i) => timer.turn({ move, hostTime: i * 100, localTimestamp: i * 100, cubeTimestamp: null }));
  return { ...timer.result!, session: 'Practice', crossOverride: 2 };
}
test('manual JSON round-trips real indexed recordings and every durable user category, including empty sessions', async () => {
  Object.entries({ ...userSettings, ...excludedSettings }).forEach(([key, value]) => localStorage.setItem(key, value!));
  const solve = sample();
  await saveSolves([solve]);
  const json = userBackupJSON(await readSolves());
  expect(validateBackup(json, cube)).toEqual([solve]); // Remains readable as a legacy Timer envelope.
  values.clear(); globalThis.indexedDB = new IDBFactory();
  const incoming = validateUserBackup(json, cube);
  await restoreSettings(incoming.settings, () => saveSolves(incoming.solves));
  expect(await readSolves()).toEqual([solve]);
  expect(readSettings()).toMatchObject(userSettings);
  expect(localStorage.getItem('timer-sessions')).toContain('Empty session');
  expect(localStorage.getItem('timer-session-scramblers')).toBe(userSettings['timer-session-scramblers']);
  Object.values(excludedSettings).forEach(secret => expect(json).not.toContain(secret));
  const exported = JSON.parse(json) as { settings: Settings };
  Object.keys(excludedSettings).forEach(key => expect(Object.hasOwn(exported.settings, key)).toBe(false));
});
test.each(['timer-v1', 'timer-v2'])('legacy %s imports leave current settings and unrelated recordings untouched', async format => {
  const solve = sample(), local = { ...solve, id: 'local-only' };
  await saveSolves([local]); localStorage.setItem('theme', 'dark');
  const json = format === 'timer-v1' ? JSON.stringify({ format, solves: [solve] }) : backupJSON([solve]);
  const incoming = validateUserBackup(json, cube);
  expect(incoming.settings).toEqual({});
  await restoreSettings(incoming.settings, () => saveSolves(incoming.solves));
  expect(await readSolves()).toEqual(expect.arrayContaining([solve, local]));
  expect(localStorage.getItem('theme')).toBe('dark');
});
test('manual import validates settings and solves before any mutation, and recovers interrupted recordings', () => {
  const active = { ...sample(), status: 'active' as const };
  const restored = validateUserBackup(userBackupJSON([active]), cube);
  expect(restored.solves[0].status).toBe('incomplete');
  expect(restored.solves[0].moves).toEqual(active.moves);
  const json = JSON.parse(userBackupJSON([sample()])) as { solves: Solve[]; settings: Settings };
  json.settings['timer-session-scramblers'] = '{"Empty session":"not-a-generator"}';
  expect(() => validateUserBackup(JSON.stringify(json), cube)).toThrow('timer-session-scramblers');
  json.settings = {};
  json.solves[0].duration = -1;
  expect(() => validateUserBackup(JSON.stringify(json), cube)).toThrow();
  expect(values.size).toBe(0);
});
test('a failed settings write restores every original value and never saves solves', async () => {
  values.set('theme', 'dark'); values.set('timer-session-scramblers', 'pre-existing malformed value');
  const original = localStorage.setItem;
  let saved = false;
  localStorage.setItem = (key, value) => {
    if (key === 'cuberplus-trainer-custom-v1' && value === userSettings[key]) throw new Error('Quota exceeded');
    original(key, value);
  };
  try {
    await expect(restoreSettings(userSettings, async () => { saved = true; })).rejects.toThrow('Quota exceeded');
    expect(saved).toBe(false);
    expect([...values]).toEqual([['theme', 'dark'], ['timer-session-scramblers', 'pre-existing malformed value']]);
  } finally { localStorage.setItem = original; }
});
test('restored recordings lazily rebuild analysis and CFOP while imported source-only data remains exact', async () => {
  const native = sample();
  solveAnalysis(native, cube);
  const source = { ...native.analysis!.data, source: 'cubeast' as const, rawSource: 'external-cubeast', rawSourceId: 'original-17',
    endDate: '2026-11-13T23:59:59Z', inspectionTime: null, steps: native.analysis!.data.steps.filter(step => step.name) };
  const recorded: Solve = { ...native, id: 'cubeast:recorded', imported: { ...source }, analysis: undefined, cfop: undefined };
  const sourceOnly: Solve = { ...native, id: 'cubeast:source-only', moves: [], startFacelets: SOLVED, imported: { ...source }, analysis: undefined, cfop: undefined };
  await saveSolves([native, recorded, sourceOnly]);
  const expected = await readLocalAnalysis();
  const stored = await readSolves();
  expect(stored.every(solve => !!solve.analysis)).toBe(true);
  const json = userBackupJSON(stored), incoming = validateUserBackup(json, cube);
  const snapshot = JSON.parse(json) as { solves: Solve[] };
  expect(snapshot.solves.every(solve => !Object.hasOwn(solve, 'analysis') && !Object.hasOwn(solve, 'cfop'))).toBe(true);
  for (const restored of incoming.solves) {
    expect(restored.analysis).toBeUndefined();
    expect(restored.cfop).toBeUndefined();
    const original = stored.find(solve => solve.id === restored.id)!;
    expect(restored.moves).toEqual(original.moves);
    expect(restored.imported).toEqual(original.imported);
    expect(restored.crossOverride).toBe(original.crossOverride);
    expect(restored.duration).toBe(original.duration);
  }
  globalThis.indexedDB = new IDBFactory();
  await restoreSettings(incoming.settings, () => saveSolves(incoming.solves));
  expect((await readSolves()).every(solve => !solve.analysis && !solve.cfop)).toBe(true);
  expect(await readLocalAnalysis()).toEqual(expected);
  const regenerated = await readSolves();
  expect(regenerated.every(solve => !!solve.analysis)).toBe(true);
  expect(regenerated.find(solve => solve.id === native.id)!.cfop).toEqual(native.cfop);
  const replay = regenerated.find(solve => solve.id === recorded.id)!;
  await persistReplayAnalysis(replay, cube);
  expect((await readSolves()).find(solve => solve.id === recorded.id)!.cfop).toBeDefined();
  expect((await readSolves()).find(solve => solve.id === sourceOnly.id)!.imported).toEqual(sourceOnly.imported);
});
test.each(['timer-v1', 'timer-v2'])('legacy %s caches are discarded on restore without touching source records', format => {
  const solve = sample();
  solveAnalysis(solve, cube);
  const imported = { ...solve.analysis!.data, source: 'cubeast' as const, steps: solve.analysis!.data.steps.filter(step => step.name) };
  const sourceOnly = { ...solve, id: 'legacy:source-only', imported, moves: [], startFacelets: SOLVED };
  const envelope = format === 'timer-v1' ? { format, solves: [solve, sourceOnly] }
    : JSON.parse(backupJSON([solve, sourceOnly])) as { format: string; solves: Solve[] };
  envelope.solves = envelope.solves.map(record => ({ ...record, analysis: solve.analysis, cfop: solve.cfop }));
  const parsed = validateBackupData(envelope, cube);
  expect(envelope.solves[0]).toHaveProperty('analysis', solve.analysis);
  expect(envelope.solves[0]).toHaveProperty('cfop', solve.cfop);
  const [restored, restoredSource] = validateUserBackup(JSON.stringify(envelope), cube).solves;
  expect(parsed).toEqual([restored, restoredSource]);
  expect(restored.analysis).toBeUndefined();
  expect(restored.cfop).toBeUndefined();
  expect(restored.moves).toEqual(solve.moves);
  expect(solveAnalysis(restored, cube)).toEqual(solveAnalysis(solve, cube));
  expect(restoredSource.analysis).toBeUndefined();
  expect(restoredSource.cfop).toBeUndefined();
  expect(restoredSource.imported).toEqual(imported);
});
test('legacy settings cannot restore notification suppression, provider choice, or sync progress', async () => {
  const localOnly = { ...excludedSettings, 'timer-pb-daily-records': 'local notification state', 'cuberplus-cloud-provider': 'google',
    'cuberplus-cloud-progress': 'local progress' };
  Object.entries(localOnly).forEach(([key, value]) => localStorage.setItem(key, value));
  const json = JSON.parse(backupJSON([sample()])) as { settings: Settings };
  json.settings = { ...userSettings, ...excludedSettings };
  const incoming = validateUserBackup(JSON.stringify(json), cube);
  await restoreSettings(incoming.settings, () => saveSolves(incoming.solves));
  expect(localStorage.getItem('timer-last-cube-mac')).toBe(userSettings['timer-last-cube-mac']);
  Object.entries(localOnly).forEach(([key, value]) => expect(localStorage.getItem(key)).toBe(value));
});
