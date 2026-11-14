/** @jest-environment jsdom */
import { jest } from '@jest/globals';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { webcrypto } from 'node:crypto';
import { deserialize, serialize } from 'node:v8';
import { IDBFactory } from 'fake-indexeddb';
import type { SmartCubeEvent } from 'smartcube-web-bluetooth';
import { getPenaltyReasons, setPenalty, type Solve } from '../../timer/src/Core/engine';
import { averageDetails, cubeastCSV, dailyStreak, newPersonalBests, numberedSolves, personalBestNotifications, sessionStats, solveEndDate } from '../../timer/src/Data/storage';
import { loadCube, SOLVED, Cube, inverse, isMove, movesOf, locations, sameAxis, simplifyMoves, crossRotation } from '../../timer/src/Core/puzzle';
import { PageLocation, SettingsProvider } from '@cuberplus/navigation';
import { relativeTime } from '../../timer/src/Data/relativeTime';

const cube = await loadCube();
const generate = jest.fn<() => Promise<string>>();
const calibrate = jest.fn<() => Promise<void>>();
const save = jest.fn<(solves: Solve[], derivedOnly?: boolean | 'reanalysis') => Promise<void>>().mockResolvedValue();
const read = jest.fn<() => Promise<Solve[]>>().mockImplementation(async () => recovered);
const statistics = jest.fn(sessionStats), streakStatistics = jest.fn(dailyStreak), backup = jest.fn<(solves: Solve[]) => string>().mockReturnValue('');
const parseBackup = jest.fn<() => { solves: Solve[]; settings: Record<string, string | null> }>();
const countTurns = jest.fn((solve: Solve) => solve.moves.length);
const erase = jest.fn<(id: string) => Promise<void>>().mockImplementation(async id => {
  recovered = recovered.filter(solve => solve.id !== id);
  window.dispatchEvent(new CustomEvent('timer-solve-deleted', { detail: id }));
});
const changeSession = jest.fn<(ids: string[], name: string | null) => Promise<void>>();
async function persistSession(ids: string[], name: string | null): Promise<void> {
  const selected = new Set(ids);
  recovered = name === null ? recovered.filter(solve => !selected.has(solve.id))
    : recovered.map(solve => selected.has(solve.id) ? { ...solve, session: name } : solve);
  if (name === null) window.dispatchEvent(new CustomEvent('timer-solve-deleted', { detail: ids }));
}
let recovered: Solve[] = [];
let emit: (event: SmartCubeEvent) => void;
let physicalFacelets = SOLVED, physicalSerial: number | undefined;
await jest.unstable_mockModule('../../timer/src/Core/puzzle', () => ({ Cube, SOLVED, inverse, isMove, movesOf, locations, sameAxis, simplifyMoves, crossRotation, loadCube: async () => cube, generateScramble: generate }));
await jest.unstable_mockModule('../../timer/src/Bluetooth/bluetooth', () => ({ BluetoothCube: class {
  connection: { deviceName: string } | null = null;
  async connect(_mac: string, events: typeof emit, ready: (device: { deviceName: string }) => void) {
    emit = events;
    physicalFacelets = SOLVED; physicalSerial = undefined;
    this.connection = { deviceName: 'Test cube' };
    ready(this.connection);
    emit({ type: 'FACELETS', timestamp: 0, facelets: SOLVED });
  }
  async disconnect() { this.connection = null; }
  async refresh() { emit({ type: 'FACELETS', timestamp: 0, facelets: physicalFacelets, serial: physicalSerial }); }
  calibrate = calibrate;
} }));
await jest.unstable_mockModule('../../timer/src/Data/storage', () => ({
  saveSolves: save, deleteSolve: erase, updateSession: changeSession, readSolves: read, recoverLocalSolves: async () => recovered,
  cubeastCSV, averageDetails, dailyStreak: streakStatistics, newPersonalBests, numberedSolves, personalBestNotifications, sessionStats: statistics, solveEndDate, turns: countTurns,
  formatTime: (ms: number, precision: 2 | 3 = 2) => (ms / 1000).toFixed(precision),
}));
await jest.unstable_mockModule('../../src/cloud/userBackup', () => ({
  userBackupJSON: backup, validateUserBackup: parseBackup,
}));
await jest.unstable_mockModule('../../timer/src/Components/CubeView', () => ({
  CubeView: ({ facelets }: { facelets: string }) => createElement('div', { role: 'img', 'aria-label': 'Live 3x3 cube state', 'data-facelets': facelets }),
}));
await jest.unstable_mockModule('../../timer/src/Components/Replay', () => ({
  Replay: ({ solve, close, change, remove, retry, retryDisabled }: { solve: Solve; close: () => void; change?: (solve: Solve) => void; remove?: (solve: Solve) => Promise<void>; retry?: (solve: Solve) => void; retryDisabled?: boolean }) => createElement('div', { 'aria-label': 'Solve replay', 'data-solve-id': solve.id, 'data-session': solve.session },
    remove && createElement('button', { onClick: () => void remove(solve) }, 'Delete'),
    createElement('button', { onClick: close }, 'Close'),
    retry && createElement('button', { onClick: () => retry(solve), disabled: retryDisabled }, 'Retry'),
    change && createElement('button', { onClick: () => change(setPenalty({ ...solve }, 'manual', !getPenaltyReasons(solve).includes('manual'))) }, 'Toggle manual +2'),
    change && createElement('button', { onClick: () => change({ ...solve, status: solve.dnfReason === 'manual' ? 'complete' : 'incomplete', dnfReason: solve.dnfReason === 'manual' ? undefined : 'manual' }) }, 'Toggle manual DNF')),
}));
const { default: App } = await import('../../timer/src/App');
const { default: Options } = await import('../../src/Pages/Options/Options');
const { cubeConnection } = await import('../../shared/cube/connection');
const app = (options = false) => createElement(SettingsProvider, null, createElement(App), options && createElement(Options));
async function openSiteOptions() { await act(async () => root.render(app(true))); }

let root: Root, container: HTMLDivElement, resolveNext: (scramble: string) => void, rejectNext: (error: Error) => void;
beforeEach(async () => {
  Object.defineProperty(globalThis, 'indexedDB', { configurable: true, value: new IDBFactory() });
  recovered = [];
  physicalFacelets = SOLVED; physicalSerial = undefined;
  localStorage.removeItem('timer-time-precision');
  localStorage.removeItem('timer-over-turn-penalty');
  localStorage.removeItem('timer-inspection');
  localStorage.removeItem('timer-pb-daily-records');
  localStorage.removeItem('timer-show-every-long-pb');
  localStorage.removeItem('timer-hide-distracting-visuals');
  localStorage.removeItem('timer-non-favorite-mistakes');
  localStorage.removeItem('timer-non-favorite-categories');
  localStorage.removeItem('cuberplus-database-favorites');
  localStorage.removeItem('cuberplus-unlearn-algorithms');
  localStorage.removeItem('timer-sessions');
  localStorage.removeItem('timer-session-scramblers');
  localStorage.removeItem('timer-all-session-history');
  localStorage.removeItem('selected-session');
  localStorage.removeItem('recent-solve-limit');
  ['cuberplus-cloud-auto-100', 'cuberplus-cloud-auto-pb', 'cuberplus-cloud-progress', 'cuberplus-cloud-provider'].forEach(key => localStorage.removeItem(key));
  Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { configurable: true, value: true });
  Object.defineProperty(globalThis, 'structuredClone', { configurable: true, value: <T>(value: T): T => deserialize(serialize(value)) as T });
  Object.defineProperty(crypto, 'randomUUID', { configurable: true, value: () => webcrypto.randomUUID() });
  Object.defineProperty(window, 'isSecureContext', { configurable: true, value: true });
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: jest.fn(() => ({ matches: false })) });
  Object.defineProperty(navigator, 'bluetooth', { configurable: true, value: {} });
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function (this: HTMLDialogElement) { this.open = true; } });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: function (this: HTMLDialogElement) { this.open = false; } });
  jest.spyOn(console, 'info').mockImplementation(() => {});
  jest.spyOn(performance, 'now').mockReturnValue(0);
  jest.spyOn(cube, 'solution').mockImplementation(async facelets => {
    const alg = ['R', "R U'", 'R U2'].find(alg => cube.facelets(cube.solved().applyAlg(alg)) === facelets);
    if (!alg) throw new Error('Unexpected cube state in test recovery.');
    return movesOf(alg).reverse().map(inverse);
  });
  save.mockReset().mockResolvedValue(); statistics.mockClear(); streakStatistics.mockClear(); backup.mockClear(); erase.mockClear(); generate.mockReset(); calibrate.mockReset().mockResolvedValue();
  parseBackup.mockReset().mockImplementation(() => ({ solves: recovered, settings: {} }));
  changeSession.mockReset().mockImplementation(persistSession);
  read.mockClear();
  countTurns.mockClear();
  generate.mockResolvedValueOnce('R U2').mockImplementationOnce(() => new Promise<string>((resolve, reject) => { resolveNext = resolve; rejectNext = reject; })).mockResolvedValue('B R2');
  container = document.createElement('div'); document.body.appendChild(container);
  root = createRoot(container);
  await act(async () => { root.render(app()); });
});
afterEach(async () => { await act(async () => root.unmount()); await cubeConnection.disconnect(); container.remove(); jest.useRealTimers(); jest.restoreAllMocks(); });

async function click(name: string) {
  const button = Array.from(container.querySelectorAll('button')).find(element => element.textContent === name || element.getAttribute('aria-label') === name);
  expect(button).toBeDefined(); expect(button!.disabled).toBe(false);
  await act(async () => button!.click());
}
async function openHistorySolve() {
  const button = container.querySelector<HTMLButtonElement>('[aria-label="Solve history"] tbody button')!;
  expect(button).not.toBeNull();
  await act(async () => button.click());
}
async function enableExtraTurnPenalty() {
  await click('Options');
  await act(async () => container.querySelector<HTMLInputElement>('input[aria-describedby="over-turn-penalty-help"]')!.click());
  await click('Close options');
}
function move(notation: string, hostTime: number, serial?: number) {
  jest.mocked(performance.now).mockReturnValue(hostTime);
  physicalFacelets = cube.facelets(cube.parse(physicalFacelets).applyMove(notation)); physicalSerial = serial;
  emit({ type: 'MOVE', timestamp: hostTime, move: notation, face: 0, direction: 0, localTimestamp: hostTime, cubeTimestamp: null, serial });
}
async function finishFirst() {
  await click('Connect cube');
  await act(async () => { move('R', 100); move('U2', 200); move('U2', 300); move("R'", 900); });
  expect(container.querySelector('[aria-label="Solve time"]')?.textContent).toBe('0.60');
  expect(generate).toHaveBeenCalledTimes(2);
  expect(container.querySelector('.trail-duration[data-step="6"][data-status="done"]')).not.toBeNull();
}
test('calibration waits for hardware reset and scramble preparation without reacting to reset snapshots', async () => {
  await click('Connect cube');
  let reset!: () => void;
  calibrate.mockImplementation(() => new Promise(resolve => { reset = resolve; }));
  await click('Cube is physically solved - calibrate');
  const button = () => Array.from(container.querySelectorAll('button')).find(element => element.textContent === 'Cube is physically solved - calibrate')!;
  expect(button().disabled).toBe(true);
  await act(async () => emit({ type: 'FACELETS', timestamp: 0, facelets: SOLVED }));
  expect(generate).toHaveBeenCalledTimes(1);
  await act(async () => reset());
  expect(generate).toHaveBeenCalledTimes(2);
  expect(button().disabled).toBe(true);
  await act(async () => resolveNext('F L2'));
  expect(button().disabled).toBe(false);
});
test('failed calibration shows the hardware error without preparing a new scramble', async () => {
  await click('Connect cube');
  calibrate.mockRejectedValue(new Error('Cube reset failed'));
  await click('Cube is physically solved - calibrate');
  expect(container.textContent).toContain('Cube reset failed');
  expect(generate).toHaveBeenCalledTimes(1);
});
test('disconnecting during calibration prevents a late reset from starting another scramble', async () => {
  await click('Connect cube');
  let reset!: () => void;
  calibrate.mockImplementation(() => new Promise(resolve => { reset = resolve; }));
  await click('Cube is physically solved - calibrate');
  await click('Disconnect');
  await act(async () => reset());
  expect(generate).toHaveBeenCalledTimes(1);
});

test('automatic cloud counting waits for finished local saves and ignores later edits of the same solve', async () => {
  jest.useFakeTimers({ doNotFake: ['performance'] });
  localStorage.setItem('cuberplus-cloud-auto-100', 'true');
  await finishFirst();
  expect(localStorage.getItem('cuberplus-cloud-progress')).toBeNull();
  await act(async () => { jest.advanceTimersByTime(501); });
  const saved = JSON.parse(localStorage.getItem('cuberplus-cloud-progress')!) as { pending: string[] };
  expect(saved.pending).toHaveLength(1);
  expect(save.mock.calls.at(-1)![0][0].status).toBe('complete');
  await openHistorySolve();
  await click('Toggle manual +2');
  await act(async () => { jest.advanceTimersByTime(1000); });
  expect(JSON.parse(localStorage.getItem('cuberplus-cloud-progress')!)).toEqual(saved);
});
test('failed local saves do not count toward automatic cloud backups', async () => {
  jest.useFakeTimers({ doNotFake: ['performance'] });
  localStorage.setItem('cuberplus-cloud-auto-100', 'true');
  save.mockRejectedValue(new Error('Local save failed'));
  await finishFirst();
  await act(async () => { jest.advanceTimersByTime(501); });
  expect(localStorage.getItem('cuberplus-cloud-progress')).toBeNull();
});

test('shows only the worst mistake after finishing and clears it during the next solve', async () => {
  await click('Connect cube');
  await act(async () => { move('R', 100); move('U2', 200); move('U', 300); move("U'", 500); move('U2', 700); move("R'", 900); });
  const feedback = container.querySelector('[aria-label="Solve mistakes"]')!;
  await act(async () => { await new Promise(resolve => setTimeout(resolve, 20)); });
  expect(feedback.textContent).toContain('Worst mistake:');
  expect(feedback.textContent).not.toContain('Potential time gain:');
  expect(feedback.textContent).toMatch(/~\d+\.\d{2}s/);
  expect(feedback.querySelector('ul')).toBeNull();
  await act(async () => resolveNext('F L2'));
  await act(async () => { move('F', 1600); move('L2', 1800); move('L2', 2000); });
  expect(container.querySelector('[aria-label="Solve mistakes"]')).toBeNull();
});
test('the first solve advances to a usable next scramble without extra turns or waiting for feedback', async () => {
  jest.useFakeTimers({ doNotFake: ['performance'] });
  await finishFirst();
  expect(container.querySelector('[aria-label="Solve mistakes"]')!.textContent).toContain('Analyzing solve mistakes');
  await act(async () => resolveNext('F L2'));
  expect(container.querySelector('[aria-label="Original scramble"]')!.textContent).toBe('FL2');
  expect(container.querySelector<HTMLButtonElement>('[aria-label="New scramble"]')!.disabled).toBe(false);
  expect(container.querySelector('[aria-label="Solve time"]')!.textContent).toBe('0.60');
});

async function showHistory(solves: Solve[]) {
  await act(async () => root.unmount());
  await cubeConnection.disconnect();
  recovered = solves;
  root = createRoot(container);
  await act(async () => root.render(app()));
}
function historySolve(number: number, duration: number, count: number, session = 'Default', status: Solve['status'] = 'complete'): Solve {
  return {
    version: 1, id: String(number), session, createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, number)).toISOString(),
    device: 'Test cube', scramble: 'R', startFacelets: SOLVED, duration, status, reason: '', timingBasis: 'host',
    moves: Array.from({ length: count }, () => ({ move: 'R', hostTime: 0, elapsed: 0, localTimestamp: null, cubeTimestamp: null })),
  };
}
function historyNumbers() {
  return Array.from(container.querySelectorAll('[aria-label="Solve history"] tbody tr')).map(row => Number(row.firstElementChild!.textContent));
}
test('session history is always visible with no collapse control', async () => {
  await showHistory([historySolve(1, 2000, 10)]);
  const history = container.querySelector('#timer-history')!;
  expect(history.tagName).toBe('SECTION');
  expect(history.querySelector('summary')).toBeNull();
  expect(history.querySelector('h2')!.textContent).toBe('Session history');
  expect(history.querySelector('[aria-label="Solve history"]')).not.toBeNull();
  expect(history.textContent).not.toContain('Full solve history');
});
test('every history field opens its own solve after sorting, with Date but no Session or View column', async () => {
  await showHistory([historySolve(1, 2000, 10), historySolve(2, 1000, 20, 'Practice')]);
  await openSiteOptions();
  const all = container.querySelector<HTMLInputElement>('#all-sessions')!;
  await act(async () => all.click());
  await click('Time');
  const rows = container.querySelectorAll('[aria-label="Solve history"] tbody tr');
  expect(rows).toHaveLength(2);
  expect(container.querySelector('[aria-label="Solve history"] thead')!.textContent).not.toContain('View');
  expect(Array.from(container.querySelectorAll('[aria-label="Solve history"] th'), header => header.textContent)).toEqual(['Solve', 'Time', 'Turns', 'TPS', 'Date']);
  expect(rows[0].querySelectorAll('td button')).toHaveLength(5);
  for (const [index, row] of Array.from(rows).entries()) {
    for (const button of row.querySelectorAll<HTMLButtonElement>('td button')) {
      expect(button.className).toContain('history-cell');
      await act(async () => button.click());
      expect(container.querySelector('[aria-label="Solve replay"]')!.getAttribute('data-solve-id')).toBe(index === 0 ? '2' : '1');
      await click('Close');
    }
  }
  localStorage.removeItem('timer-all-session-history');
});
test.each([
  [0, 'now'], [59, 'now'], [60, '1 minute ago'], [300, '5 minutes ago'],
  [3600, '1 hour ago'], [86400, '1 day ago'], [14 * 86400, '2 weeks ago'],
  [150 * 86400, '5 months ago'], [8 * 365 * 86400, '8 years ago'],
])('history dates format %s seconds ago as %s', (seconds, expected) => {
  const now = Date.parse('2026-11-12T12:00:00Z');
  expect(relativeTime(new Date(now - seconds * 1000).toISOString(), now)).toBe(expected);
});
test('history dates tolerate future timestamps and missing dates', () => {
  expect(relativeTime('invalid', Date.now())).toBe('--');
  expect(relativeTime(new Date(Date.now() + 3600000).toISOString())).toBe('now');
});
test('both history filters keep exact timestamps and refresh dates without recalculating records', async () => {
  jest.useFakeTimers({ doNotFake: ['performance'] });
  jest.setSystemTime(new Date('2026-11-12T12:00:00Z'));
  const createdAt = new Date(Date.now() - 30000).toISOString();
  await showHistory([{ ...historySolve(1, 2000, 10), createdAt }]);
  expect(container.querySelector('.history-table time')!.textContent).toBe('now');
  await openSiteOptions();
  const all = container.querySelector<HTMLInputElement>('#all-sessions')!;
  await act(async () => all.click());
  const date = () => container.querySelector('time')!;
  expect(date().dateTime).toBe(createdAt);
  expect(date().title).toBe(new Date(createdAt).toLocaleString());
  expect(date().textContent).toBe('now');
  statistics.mockClear();
  await act(async () => jest.advanceTimersByTime(60000));
  expect(date().textContent).toBe('1 minute ago');
  expect(statistics).not.toHaveBeenCalled();
  await act(async () => all.click());
  expect(container.querySelector('.history-table time')!.textContent).toBe('1 minute ago');
  localStorage.removeItem('timer-all-session-history');
});
test('active turns persist fresh snapshots and export the live attempt without recalculating history statistics', async () => {
  await showHistory([historySolve(1, 2000, 10)]);
  await click('Connect cube');
  await act(async () => { move('R', 100); move('U2', 200); });
  statistics.mockClear();
  const storedSettings = jest.spyOn(Storage.prototype, 'getItem');
  await act(async () => move('U', 300));
  const first = save.mock.calls.at(-1)![0][0];
  for (const time of [400, 500, 600]) await act(async () => move('U', time));
  expect(statistics).not.toHaveBeenCalled();
  expect(storedSettings.mock.calls.filter(([key]) => key === 'timer-session-scramblers')).toHaveLength(0);
  expect(historyNumbers()).toEqual([1]);
  expect(first).toMatchObject({ status: 'active', moves: [expect.objectContaining({ move: 'U' })] });
  expect(save.mock.calls.at(-1)![0][0].moves).toHaveLength(4);
  expect(container.querySelector('[aria-label="Live 3x3 cube state"]')?.getAttribute('data-facelets')).toBe(physicalFacelets);
  Object.defineProperties(URL, {
    createObjectURL: { configurable: true, value: jest.fn(() => 'blob:backup') },
    revokeObjectURL: { configurable: true, value: jest.fn() },
  });
  jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  await click('Export JSON');
  expect(backup.mock.calls.at(-1)![0]).toHaveLength(2);
  expect(backup.mock.calls.at(-1)![0].find(solve => solve.status === 'active')?.moves).toHaveLength(4);
  await act(async () => { move('U2', 700); move("R'", 900); });
  expect(statistics).toHaveBeenCalledTimes(2);
  expect(historyNumbers()).toEqual([2, 1]);
  expect(save.mock.calls.at(-1)![0][0]).toMatchObject({ status: 'complete', duration: 600 });
  expect(save.mock.calls.at(-1)![0][0].moves).toHaveLength(6);
});
test('a blocked save coalesces queued turns without losing completion or the over-turn penalty', async () => {
  await enableExtraTurnPenalty();
  let finishSave!: () => void;
  save.mockImplementationOnce(() => new Promise(resolve => { finishSave = resolve; }));
  await click('Connect cube');
  await act(async () => { move('R', 100); move('U2', 200); move('U', 300); });
  expect(save).toHaveBeenCalledTimes(1);
  await act(async () => { move('U', 400); move('U', 500); move('U', 600); move('U2', 700); move("R'", 900); move('R', 1000); });
  expect(save).toHaveBeenCalledTimes(1);
  await act(async () => finishSave());
  expect(save).toHaveBeenCalledTimes(2);
  expect(save.mock.calls.at(-1)![0][0]).toMatchObject({ status: 'complete', duration: 600, penalty: 2000, penaltyReason: 'over-turn' });
  expect(save.mock.calls.at(-1)![0][0].moves).toHaveLength(6);
});
async function chooseSession(value: string, scrambler = 'default') {
  const select = container.querySelector<HTMLSelectElement>('select[aria-label="Session"]')!;
  const existing = Array.from(select.options).some(option => option.value === value);
  await act(async () => {
    select.value = existing ? value : select.options[select.options.length - 1].value;
    select.dispatchEvent(new Event('change', { bubbles: true }));
  });
  if (!existing) {
    const picker = select.closest('.session-picker')!, input = picker.querySelector('input')!;
    await act(async () => {
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, value);
      input.dispatchEvent(new Event('input', { bubbles: true }));
      const generator = picker.querySelector<HTMLSelectElement>('label.w-100 select')!;
      generator.value = scrambler; generator.dispatchEvent(new Event('change', { bubbles: true }));
    });
    await act(async () => picker.querySelector('button')!.click());
  }
}
  test.each(['RU practice', '__proto__'])('session scramblers persist through rename to %s, drive generation, and are removed on deletion', async name => {
    await chooseSession('Practice', '2-gen');
    expect(JSON.parse(localStorage.getItem('timer-session-scramblers')!)).toEqual({ Practice: '2-gen' });
    await click('Options');
    await renameSession(name);
    expect(JSON.parse(localStorage.getItem('timer-session-scramblers')!)).toEqual({ [name]: '2-gen' });
    await click('Close options');
    await click('Connect cube');
    expect(generate).not.toHaveBeenCalled();
    const scramble = Array.from(container.querySelectorAll('.scramble-content .move'), node => node.textContent!);
    expect(scramble).toHaveLength(25);
    expect(scramble.every(move => /^[RU](2|')?$/.test(move))).toBe(true);
    await click('Options');
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    await click('Delete session');
    expect(JSON.parse(localStorage.getItem('timer-session-scramblers')!)).toEqual({});
    expect(generate).toHaveBeenCalledTimes(1);
  });
  test('history session dropdown switches sessions and does not reserve a valid session name', async () => {
    await showHistory([historySolve(1, 2000, 10, '__all__'), historySolve(2, 1000, 10, 'Other')]);
    const select = container.querySelector<HTMLSelectElement>('#history-session')!;
    await act(async () => { select.value = '__all__'; select.dispatchEvent(new Event('change', { bubbles: true })); });
    expect(container.querySelector<HTMLSelectElement>('select[aria-label="Session"]')!.value).toBe('__all__');
    expect(historyNumbers()).toEqual([1]);
    expect(Array.from(select.options).some(option => option.value === '')).toBe(false);
    await openSiteOptions();
    await act(async () => container.querySelector<HTMLInputElement>('#all-sessions')!.click());
    expect(historyNumbers()).toEqual([2, 1]);
    expect(localStorage.getItem('selected-session')).toBe('__all__');
    await showHistory([historySolve(1, 2000, 10, '__all__'), historySolve(2, 1000, 10, 'Other')]);
    expect(container.querySelector<HTMLSelectElement>('#history-session')!.value).toBe('__all__');
    expect(historyNumbers()).toEqual([2, 1]);
  });
  test.each([5, 12])('the first calculated average after %i solves reserves a gray trend slot', async count => {
    await showHistory(Array.from({ length: count }, (_, i) => historySolve(i, 1000 + i * 10, 10)));
    const label = count === 5 ? 'Ao5' : 'Ao12';
    const row = Array.from(container.querySelectorAll('.timer-records tr')).find(row => row.textContent?.includes(label))!;
    expect(row.querySelector('[aria-label="No previous average"]')?.classList.contains('metric-trend--equal')).toBe(true);
  });
test.each(['constructor', '__proto__'])('legacy session %s uses the default generator', async name => {
  await showHistory([historySolve(1, 2000, 10, name)]);
  await chooseSession(name);
  await click('Connect cube');
  expect(generate).toHaveBeenCalledTimes(1);
  expect(Array.from(container.querySelectorAll('.scramble-content .move'), node => node.textContent)).toEqual(['R', 'U2']);
});
test('the session dropdown stays in Options and empty created sessions survive remounting', async () => {
  await chooseSession('Practice');
  const selects = () => Array.from(container.querySelectorAll<HTMLSelectElement>('select[aria-label="Session"]'));
  expect(selects().map(select => select.value)).toEqual(['Practice']);
  expect(selects()[0].closest('dialog')?.getAttribute('aria-labelledby')).toBe('options-title');
  expect(selects().every(select => select.options[0].value === 'Default')).toBe(true);
  expect(JSON.parse(localStorage.getItem('timer-sessions')!)).toEqual(['Practice']);
  await showHistory([]);
  expect(selects().every(select => Array.from(select.options).some(option => option.value === 'Practice'))).toBe(true);
  await chooseSession('__create__');
  await chooseSession('Another');
  expect(selects().map(select => select.value)).toEqual(['Another']);
  expect(container.querySelector('[aria-label="New session name"]')).toBeNull();
});
test('creating a session can be cancelled and whitespace names cannot be submitted', async () => {
  const select = container.querySelector<HTMLSelectElement>('select[aria-label="Session"]')!;
  await act(async () => { select.value = select.options[select.options.length - 1].value; select.dispatchEvent(new Event('change', { bubbles: true })); });
  const picker = select.closest('.session-picker')!;
  expect(picker.querySelector('button')!.disabled).toBe(true);
  await click('Cancel');
  expect(picker.querySelector('input')).toBeNull();
  expect(select.value).toBe('Default');
});
test('creating a session cannot reserve the retry-only session name', async () => {
  await chooseSession('Retries', '2-gen');
  expect(container.querySelector('.session-picker [role="alert"]')!.textContent).toBe('Retries is reserved for retry attempts.');
  expect(container.querySelector<HTMLSelectElement>('select[aria-label="Session"]')!.value).toBe('Default');
  expect(localStorage.getItem('timer-sessions')).toBeNull();
  expect(localStorage.getItem('timer-session-scramblers')).toBeNull();
});
test('in-place practice suspends timer turns and resynchronizes the shared cube after closing', async () => {
  await click('Connect cube');
  Object.assign(cubeConnection.getSnapshot().connection!, { capabilities: { facelets: true } });
  await act(async () => cubeConnection.setPracticing(true));
  await act(async () => {
    move('R', 100); move('U2', 200);
  });
  expect(save).not.toHaveBeenCalled();
  expect(generate).toHaveBeenCalledTimes(1);
  await act(async () => cubeConnection.setPracticing(false));
  expect(generate).toHaveBeenCalledTimes(2);
  await act(async () => resolveNext('F L2'));
  await act(async () => { move('U2', 300); move("R'", 400); });
  expect(Array.from(container.querySelectorAll('.scramble-content .move'), node => node.textContent)).toEqual(['F', 'L2']);
  expect(save).not.toHaveBeenCalled();
});

async function renameSession(name: string) {
  await click('Rename session');
  const input = container.querySelector<HTMLInputElement>('[aria-label="Rename session to"]')!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(input, name);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await click('Save session name');
}
test('session management is only offered in Timer options and renames all solves without merging sessions', async () => {
  const solves = [historySolve(1, 2000, 10, 'Practice'), historySolve(2, 1000, 10, 'Practice'), historySolve(3, 500, 10, 'Other')];
  await showHistory(solves);
  await chooseSession('Practice');
  await click('Options');
  const dialog = container.querySelector('dialog[aria-labelledby="options-title"]')!;
  expect(Array.from(container.querySelectorAll('button')).filter(button => button.textContent === 'Rename session')).toHaveLength(1);
  expect(Array.from(container.querySelectorAll('button')).find(button => button.textContent === 'Rename session')!.closest('dialog')).toBe(dialog);
  await renameSession(' Evening ');
  expect(changeSession).toHaveBeenCalledWith(['2', '1'], 'Evening');
  expect(Array.from(container.querySelectorAll<HTMLSelectElement>('select[aria-label="Session"]')).map(select => select.value)).toEqual(['Evening']);
  expect(historyNumbers()).toEqual([2, 1]);
  expect(container.querySelector('[aria-label="View best Single"]')!.textContent).toBe('1.00');
  expect(recovered).toEqual(solves.map(solve => solve.session === 'Practice' ? { ...solve, session: 'Evening' } : solve));
  expect(JSON.parse(localStorage.getItem('timer-sessions')!)).toEqual(['Other', 'Evening']);
  await showHistory(recovered);
  await chooseSession('Evening');
  expect(historyNumbers()).toEqual([2, 1]);
  await openSiteOptions();
  const siteOptions = container.querySelectorAll(':scope > .cuberplus-page')[1];
  expect(siteOptions).toBeDefined();
  expect(Array.from(siteOptions.querySelectorAll('button')).some(button => ['Rename session', 'Delete session'].includes(button.textContent!))).toBe(false);
});
test('rename rejects existing and reserved names, and preserves empty renamed sessions after remounting', async () => {
  await chooseSession('Practice');
  await click('Options');
  await renameSession('Default');
  expect(changeSession).not.toHaveBeenCalled();
  expect(container.querySelector('.session-picker [role="alert"]')!.textContent).toContain('unique session name');
  await click('Cancel');
  await renameSession('Retries');
  expect(changeSession).not.toHaveBeenCalled();
  await click('Cancel');
  await renameSession('Evening');
  expect(JSON.parse(localStorage.getItem('timer-sessions')!)).toEqual(['Evening']);
  await showHistory([]);
  const select = container.querySelector<HTMLSelectElement>('select[aria-label="Session"]')!;
  expect(Array.from(select.options).some(option => option.value === 'Evening')).toBe(true);
  expect(Array.from(select.options).some(option => option.value === 'Practice')).toBe(false);
});
test('session deletion confirms the full solve count and cancellation leaves names and solves untouched', async () => {
  const solves = Array.from({ length: 125 }, (_, i) => historySolve(i, 1000, 10, 'Practice'));
  await showHistory(solves);
  await chooseSession('Practice');
  await click('Options');
  const confirm = jest.spyOn(window, 'confirm').mockReturnValue(false);
  read.mockClear();
  await click('Delete session');
  expect(confirm).toHaveBeenCalledWith('Are you sure you want to delete session "Practice" and its 125 solves? This cannot be undone.');
  expect(changeSession).not.toHaveBeenCalled();
  expect(recovered).toEqual(solves);
  expect(container.querySelector<HTMLSelectElement>('select[aria-label="Session"]')!.value).toBe('Practice');
  confirm.mockReturnValue(true);
  await click('Delete session');
  expect(changeSession).toHaveBeenCalledWith(solves.map(solve => solve.id).reverse(), null);
  expect(recovered).toEqual([]);
  expect(historyNumbers()).toEqual([]);
  expect(container.querySelector<HTMLSelectElement>('select[aria-label="Session"]')!.value).toBe('Default');
  expect(JSON.parse(localStorage.getItem('timer-sessions')!)).toEqual([]);
  expect(read).not.toHaveBeenCalled();
});
test('deleting a session clears its replay, retains records from other sessions, and removes empty names', async () => {
  await showHistory([historySolve(1, 2000, 10, 'Practice'), historySolve(2, 1000, 10, 'Other')]);
  await chooseSession('Practice');
  await openHistorySolve();
  await click('Options');
  const confirm = jest.spyOn(window, 'confirm').mockReturnValue(true);
  await click('Delete session');
  expect(confirm.mock.calls[0][0]).toContain('1 solve?');
  expect(container.querySelector('[aria-label="Solve replay"]')).toBeNull();
  expect(container.querySelector('[aria-label="View best Single"]')).toBeNull();
  expect(recovered.map(solve => solve.id)).toEqual(['2']);
  await chooseSession('Other');
  expect(container.querySelector('[aria-label="View best Single"]')?.textContent).toBe('1.00');
  await chooseSession('Empty');
  await click('Delete session');
  expect(confirm.mock.calls.at(-1)![0]).toContain('0 solves?');
  await showHistory(recovered);
  expect(Array.from(container.querySelector<HTMLSelectElement>('select[aria-label="Session"]')!.options).map(option => option.value)).not.toContain('Empty');
  await chooseSession('Other');
  expect(historyNumbers()).toEqual([1]);
});
test.each(['rename', 'delete'])('failed session %s rolls back saved names and keeps the selected session and history', async action => {
  await showHistory([historySolve(1, 2000, 10, 'Practice')]);
  await chooseSession('Empty');
  await chooseSession('Practice');
  await click('Options');
  jest.spyOn(window, 'confirm').mockReturnValue(true);
  changeSession.mockRejectedValueOnce(new Error('Local database failed'));
  const names = localStorage.getItem('timer-sessions');
  if (action === 'rename') await renameSession('Evening');
  else await click('Delete session');
  expect(container.querySelector('.session-picker [role="alert"]')!.textContent).toBe('Local database failed');
  expect(localStorage.getItem('timer-sessions')).toBe(names);
  expect(container.querySelector<HTMLSelectElement>('select[aria-label="Session"]')!.value).toBe('Practice');
  expect(historyNumbers()).toEqual([1]);
});
test('session management is disabled during solves and retries', async () => {
  await click('Options');
  await click('Connect cube');
  await act(async () => { move('R', 100); move('U2', 200); move('U', 300); });
  const actions = () => Array.from(container.querySelectorAll<HTMLButtonElement>('.options-dialog button')).filter(button => ['Rename session', 'Delete session'].includes(button.textContent!));
  expect(actions().map(button => button.disabled)).toEqual([true, true]);
  await click('Abort solve');
  await openHistorySolve();
  await click('Retry');
  expect(actions().map(button => button.disabled)).toEqual([true, true]);
});
test.each(['rename', 'delete'])('session %s waits for queued saves and prevents late result updates from restoring the old session', async action => {
  jest.useFakeTimers({ doNotFake: ['performance'] });
  await enableExtraTurnPenalty();
  await chooseSession('Practice');
  let finishSave!: () => void;
  save.mockImplementationOnce(() => new Promise(resolve => { finishSave = resolve; }));
  await finishFirst();
  await click('Options');
  jest.spyOn(window, 'confirm').mockReturnValue(true);
  if (action === 'rename') await renameSession('Evening');
  else await click('Delete session');
  expect(changeSession).not.toHaveBeenCalled();
  expect(Array.from(container.querySelectorAll<HTMLSelectElement>('select[aria-label="Session"]')).every(select => select.disabled)).toBe(true);
  await act(async () => finishSave());
  expect(changeSession).toHaveBeenCalledWith([save.mock.calls.at(-1)![0][0].id], action === 'rename' ? 'Evening' : null);
  const saves = save.mock.calls.length;
  await act(async () => { move('R', 1000); jest.advanceTimersByTime(600); });
  if (action === 'rename') {
    expect(save.mock.calls.filter(([, derivedOnly]) => !derivedOnly).at(-1)![0][0]).toMatchObject({ session: 'Evening', penalty: 2000 });
    expect(historyNumbers()).toHaveLength(1);
  } else {
    expect(save).toHaveBeenCalledTimes(saves);
    expect(historyNumbers()).toEqual([]);
    expect(container.querySelector('[aria-label="Dismiss personal best"]')).toBeNull();
  }
  expect(Array.from(container.querySelectorAll<HTMLSelectElement>('select[aria-label="Session"]')).every(select => !Array.from(select.options).some(option => option.value === 'Practice'))).toBe(true);
});

test('deleting from replay refreshes history, Current and Best statistics without changing other solves', async () => {
  await showHistory([historySolve(1, 2000, 10), historySolve(2, 1000, 10)]);
  await openHistorySolve();
  await click('Delete');
  expect(erase).toHaveBeenCalledWith('2');
  expect(container.querySelector('[aria-label="Solve replay"]')).toBeNull();
  expect(historyNumbers()).toEqual([1]);
  expect(container.querySelector('[aria-label="View current Single"]')!.textContent).toBe('2.00');
  expect(container.querySelector('[aria-label="View best Single"]')!.textContent).toBe('2.00');
  expect(recovered.map(solve => solve.id)).toEqual(['1']);
});

test('deletion waits for queued saves and prevents late over-turn updates or celebrations resurrecting the solve', async () => {
  jest.useFakeTimers({ doNotFake: ['performance'] });
  let finishSave!: () => void;
  save.mockImplementationOnce(() => new Promise(resolve => { finishSave = resolve; }));
  await finishFirst();
  await openHistorySolve();
  await click('Delete');
  expect(erase).not.toHaveBeenCalled();
  expect(historyNumbers()).toHaveLength(1);
  await act(async () => finishSave());
  expect(erase).toHaveBeenCalledTimes(1);
  expect(historyNumbers()).toHaveLength(0);
  const saves = save.mock.calls.length;
  await act(async () => { move('R', 1000); jest.advanceTimersByTime(600); });
  expect(save).toHaveBeenCalledTimes(saves);
  expect(historyNumbers()).toHaveLength(0);
  expect(container.querySelector('[aria-label="Dismiss personal best"]')).toBeNull();
  expect(container.querySelector('[aria-label="Dismiss daily streak"]')).toBeNull();
});

test('deleting through Analyzer updates the mounted Timer and clears its open replay', async () => {
  await showHistory([historySolve(1, 2000, 10)]);
  await click('View current Single');
  await act(async () => window.dispatchEvent(new CustomEvent('timer-solve-deleted', { detail: '1' })));
  expect(historyNumbers()).toHaveLength(0);
  expect(container.querySelector('[aria-label="Solve replay"]')).toBeNull();
});

test('retry replaces a pending random scramble, saves a separate attempt in retries, and restores the previous session for the next solve', async () => {
  await chooseSession('Practice');
  await finishFirst();
  const original = structuredClone(save.mock.calls.at(-1)![0][0]);
  await openHistorySolve();
  await click('Retry');
  expect(container.querySelector('[aria-label="Solve replay"]')).toBeNull();
  const session = container.querySelector<HTMLSelectElement>('select[aria-label="Session"]')!;
  expect(session.value).toBe('Retries');
  expect(session.disabled).toBe(true);
  await act(async () => resolveNext('F L2'));
  expect(Array.from(container.querySelectorAll('.scramble .move'), element => element.textContent)).toEqual(['R', 'U2']);
  await act(async () => { move('R', 2000); move('U2', 2100); move('U2', 2200); move("R'", 2800); });
  const attempt = save.mock.calls.at(-1)![0][0];
  expect(attempt).toMatchObject({ session: 'Retries', scramble: original.scramble, status: 'complete' });
  expect(attempt.id).not.toBe(original.id);
  expect(save.mock.calls.flatMap(([solves]) => solves).filter(solve => solve.id === original.id).at(-1)).toEqual(original);
  expect(session.value).toBe('Practice');
  expect(session.disabled).toBe(false);
  expect(generate).toHaveBeenCalledTimes(3);
  await act(async () => { move('B', 4000); move('R2', 4100); move('R2', 4200); move("B'", 4800); });
  expect(save.mock.calls.at(-1)![0][0]).toMatchObject({ session: 'Practice', status: 'complete', scramble: 'B R2' });
});

test.each([['R', 'R', "R'"], ['R R', 'R2', 'R2']])('a disconnected retry reuses %s without generating a random scramble and restores its session after a one-turn solve', async (scramble, setup, solution) => {
  const original = { ...historySolve(1, 1000, 4, 'Practice'), scramble };
  await showHistory([original]);
  await chooseSession('Practice');
  await openHistorySolve();
  await click('Retry');
  expect(container.textContent).toContain('Connect your cube to retry this scramble.');
  await click('Connect cube');
  expect(generate).not.toHaveBeenCalled();
  await act(async () => move(setup, 100));
  await act(async () => move(solution, 900));
  expect(save.mock.calls.at(-1)![0][0]).toMatchObject({ session: 'Retries', status: 'complete', scramble: setup });
  expect(container.querySelector<HTMLSelectElement>('select[aria-label="Session"]')!.value).toBe('Practice');
  expect(original.session).toBe('Practice');
});

test.each(['Cancel retry', 'New scramble', 'Disconnect'])('%s cancels a prepared retry and restores the previous session without moving the original', async action => {
  await showHistory([historySolve(1, 1000, 4, 'Practice')]);
  await chooseSession('Practice');
  await openHistorySolve();
  await click('Retry');
  await click('Connect cube');
  await click(action);
  expect(container.querySelector<HTMLSelectElement>('select[aria-label="Session"]')!.value).toBe('Practice');
  expect(container.textContent).not.toContain('Retry will be saved');
  expect(save).not.toHaveBeenCalled();
});

test.each(['Abort solve', 'Disconnect', 'snapshot mismatch'])('%s saves an interrupted retry as DNF in retries and restores the previous session', async action => {
  await showHistory([{ ...historySolve(1, 1000, 4, 'Practice'), scramble: 'R U2' }]);
  await chooseSession('Practice');
  await openHistorySolve();
  await click('Retry');
  await click('Connect cube');
  await act(async () => { move('R', 100); move('U2', 200); move('U2', 300); });
  if (action === 'snapshot mismatch') await act(async () => emit({ type: 'FACELETS', timestamp: 400, facelets: SOLVED }));
  else await click(action);
  expect(save.mock.calls.at(-1)![0][0]).toMatchObject({ session: 'Retries', status: 'incomplete', scramble: 'R U2' });
  expect(container.querySelector<HTMLSelectElement>('select[aria-label="Session"]')!.value).toBe('Practice');
  expect(container.textContent).not.toContain('Retry will be saved');
});

test('failed retry setup restores the previous session and leaves the original unchanged', async () => {
  await showHistory([historySolve(1, 1000, 4, 'Practice')]);
  await chooseSession('Practice');
  await click('Connect cube');
  await act(async () => move('R', 100));
  jest.mocked(cube.solution).mockRejectedValueOnce(new Error('Cannot prepare this cube'));
  await openHistorySolve();
  await click('Retry');
  expect(container.textContent).toContain('Cannot prepare this cube');
  expect(container.querySelector<HTMLSelectElement>('select[aria-label="Session"]')!.value).toBe('Practice');
  expect(save).not.toHaveBeenCalled();
});

test('a late over-turn update to an older retries solve does not complete the new retry', async () => {
  await enableExtraTurnPenalty();
  await chooseSession('Retries');
  await finishFirst();
  const original = save.mock.calls.at(-1)![0][0];
  await openHistorySolve();
  await click('Retry');
  await act(async () => move('R', 1000));
  expect(save.mock.calls.at(-1)![0][0]).toMatchObject({ id: original.id, penaltyReason: 'over-turn' });
  expect(container.querySelector<HTMLSelectElement>('select[aria-label="Session"]')!.disabled).toBe(true);
  expect(container.textContent).toContain('Retry will be saved');
  await act(async () => resolveNext('F L2'));
  await act(async () => { move('U2', 2000); move('U2', 2100); move("R'", 2800); });
  expect(save.mock.calls.at(-1)![0][0].id).not.toBe(original.id);
  expect(container.querySelector<HTMLSelectElement>('select[aria-label="Session"]')!.disabled).toBe(false);
  expect(container.textContent).not.toContain('Retry will be saved');
});

test('Analyzer retry navigation preserves the mounted Timer session and handles each address only once', async () => {
  await act(async () => root.unmount());
  recovered = [historySolve(1, 1000, 4)];
  root = createRoot(container);
  const show = async (address: string) => act(async () => root.render(createElement(SettingsProvider, null, createElement(PageLocation.Provider, { value: address }, createElement(App)))));
  await show('/analyzer/');
  await chooseSession('Practice');
  await show('/timer/?retry=1');
  expect(container.querySelector<HTMLSelectElement>('select[aria-label="Session"]')!.value).toBe('Retries');
  await click('Connect cube');
  await act(async () => { move('R', 100); move("R'", 900); });
  expect(save.mock.calls.at(-1)![0][0]).toMatchObject({ session: 'Retries', status: 'complete', scramble: 'R' });
  expect(container.querySelector<HTMLSelectElement>('select[aria-label="Session"]')!.value).toBe('Practice');
  await show('/timer/?retry=1');
  expect(container.querySelector<HTMLSelectElement>('select[aria-label="Session"]')!.value).toBe('Practice');
});

test('Connect cube places a decorative Bluetooth icon before its unchanged label', async () => {
  const button = Array.from(container.querySelectorAll('button')).find(button => button.textContent === 'Connect cube')!;
  const icon = button.firstElementChild!;
  expect(icon.tagName.toLowerCase()).toBe('svg');
  expect(icon.getAttribute('aria-hidden')).toBe('true');
  expect(icon.getAttribute('focusable')).toBe('false');
  expect(icon.nextSibling!.textContent).toBe('Connect cube');
  await click('Connect cube');
  expect(Array.from(container.querySelectorAll('button')).some(button => button.textContent === 'Disconnect')).toBe(true);
});

test('new Timer replay links work on an already mounted connected Timer without reopening a dismissed replay on background renders', async () => {
  const solves = [historySolve(1, 1000, 4), historySolve(2, 2000, 4)];
  await act(async () => root.unmount());
  recovered = solves;
  root = createRoot(container);
  const show = async (address: string) => act(async () => root.render(createElement(SettingsProvider, null, createElement(PageLocation.Provider, { value: address }, createElement(App)))));
  await show('/timer/?solve=1');
  expect(container.querySelector('[aria-label="Solve replay"]')?.getAttribute('data-solve-id')).toBe('1');
  await click('Close');
  await show('/timer/?solve=1');
  expect(container.querySelector('[aria-label="Solve replay"]')).toBeNull();
  await click('Connect cube');
  await show('/analyzer/');
  await show('/timer/?solve=2');
  expect(container.querySelector('[aria-label="Solve replay"]')?.getAttribute('data-solve-id')).toBe('2');
  expect(Array.from(container.querySelectorAll('button')).some(button => button.textContent === 'Disconnect')).toBe(true);
  expect(generate).toHaveBeenCalledTimes(1);
});

test('reads backup files larger than 10 MB instead of rejecting them before import', async () => {
  const text = jest.fn<() => Promise<string>>().mockResolvedValue('backup contents');
  const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
  Object.defineProperty(input, 'files', { value: [{ size: 10_000_001, text }] });
  await act(async () => input.dispatchEvent(new Event('change', { bubbles: true })));
  expect(text).toHaveBeenCalledTimes(1);
  expect(save).toHaveBeenCalledWith([]);
  expect(container.textContent).not.toContain('import limit');
});

test('restoring settings cannot interrupt an active solve', async () => {
  await click('Connect cube');
  await act(async () => { move('R', 100); move('U2', 200); move('U', 300); });
  save.mockClear();
  parseBackup.mockReturnValueOnce({ solves: [], settings: { theme: 'dark' } });
  const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
  Object.defineProperty(input, 'files', { value: [{ text: async () => 'backup contents' }] });
  await act(async () => input.dispatchEvent(new Event('change', { bubbles: true })));
  expect(container.textContent).toContain('Finish or stop your current Timer solve before restoring settings.');
  expect(save).not.toHaveBeenCalled();
  expect(Array.from(container.querySelectorAll('button')).some(button => button.textContent === 'Abort solve')).toBe(true);
});

async function timedApp(solves: Solve[] = []) {
  await act(async () => root.unmount());
  recovered = solves;
  jest.useFakeTimers({ doNotFake: ['performance'] });
  root = createRoot(container);
  await act(async () => root.render(app()));
}

test('the first daily attempt shows an independently dismissible fire with current and best streaks, only once per day', async () => {
  const previous = Array.from({ length: 7 }, (_, i) => ({
    ...historySolve(i, 1000, 2, i % 2 ? 'Other' : 'Default'),
    createdAt: new Date(2026, 9, 1 + i, 12).toISOString(),
  }));
  await timedApp(previous);
  jest.setSystemTime(new Date(2026, 10, 2, 12));
  await finishFirst();
  await act(async () => jest.advanceTimersByTime(500));
  expect(container.querySelector('[aria-label="Daily streak"]')).toBeNull();
  await act(async () => jest.advanceTimersByTime(1));
  const notice = container.querySelector('[aria-label="Daily streak"]')!;
  expect(streakStatistics).toHaveBeenCalledTimes(1);
  expect(notice.textContent).toContain('Congratulations!');
  expect(notice.textContent).toContain('Daily Streak: 1');
  expect(notice.textContent).toContain('Best Streak: 7');
  expect(notice.querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  expect(notice.querySelector('.streak-flame')).not.toBeNull();
  expect(notice.closest('.timer-panel')).toBeNull();
  expect(container.querySelector('[aria-label="Personal best"]')).not.toBeNull();
  await click('Dismiss daily streak');
  expect(container.querySelector('[aria-label="Daily streak"]')).toBeNull();
  expect(container.querySelector('[aria-label="Personal best"]')).not.toBeNull();

  await act(async () => resolveNext('F L2'));
  await act(async () => { move('F', 2000); move('L2', 2100); move('L2', 2200); move("F'", 2400); });
  await act(async () => jest.advanceTimersByTime(501));
  expect(streakStatistics).toHaveBeenCalledTimes(1);
  expect(container.querySelector('[aria-label="Daily streak"]')).toBeNull();
  jest.setSystemTime(new Date(2026, 10, 3, 12));
  await act(async () => { move('B', 3000); move('R2', 3100); move('R2', 3200); move("B'", 3400); });
  await act(async () => jest.advanceTimersByTime(501));
  expect(container.querySelector('[aria-label="Daily streak"]')?.textContent).toContain('Daily Streak: 2');
  expect(container.querySelector('[aria-label="Daily streak"]')?.textContent).toContain('Best Streak: 7');
  await click('Dismiss daily streak');
  jest.setSystemTime(new Date(2026, 10, 5, 12));
  await act(async () => { move('B', 4000); move('R2', 4100); move('R2', 4200); move("B'", 4400); });
  await act(async () => jest.advanceTimersByTime(501));
  expect(container.querySelector('[aria-label="Daily streak"]')?.textContent).toContain('Daily Streak: 1');
  expect(container.querySelector('[aria-label="Daily streak"]')?.textContent).toContain('Best Streak: 7');
});

test('active attempts do not notify, but the first DNF does count toward the daily streak', async () => {
  await timedApp();
  await click('Connect cube');
  await act(async () => { move('R', 100); move('U2', 200); move('U', 300); });
  await act(async () => jest.advanceTimersByTime(501));
  expect(container.querySelector('[aria-label="Daily streak"]')).toBeNull();
  await click('Abort solve');
  await act(async () => jest.advanceTimersByTime(501));
  expect(save.mock.calls.at(-1)![0][0].status).toBe('incomplete');
  expect(container.querySelector('[aria-label="Daily streak"]')?.textContent).toContain('Daily Streak: 1');
  expect(container.querySelector('[aria-label="Personal best"]')).toBeNull();
});

test.each(['reload', 'import'])('an existing DNF today in another session suppresses streak notifications after %s', async source => {
  await timedApp();
  jest.setSystemTime(new Date(2026, 10, 2, 12));
  const solve = { ...historySolve(1, 1000, 2, 'Other', 'incomplete'), createdAt: new Date(2026, 10, 2, 8).toISOString() };
  if (source === 'reload') await showHistory([solve]);
  else {
    recovered = [solve];
    const input = container.querySelector<HTMLInputElement>('input[type="file"]')!;
    Object.defineProperty(input, 'files', { value: [{ text: async () => 'backup' }] });
    await act(async () => input.dispatchEvent(new Event('change', { bubbles: true })));
  }
  await act(async () => jest.advanceTimersByTime(501));
  expect(container.querySelector('[aria-label="Daily streak"]')).toBeNull();
  await finishFirst();
  await act(async () => jest.advanceTimersByTime(501));
  expect(container.querySelector('[aria-label="Daily streak"]')).toBeNull();
});

test('the penalty-window delay across midnight does not move the first attempt into the next day', async () => {
  await timedApp();
  jest.setSystemTime(new Date(2026, 10, 1, 23, 59, 58));
  await finishFirst();
  jest.setSystemTime(new Date(2026, 10, 2, 0, 0, 1));
  await act(async () => jest.advanceTimersByTime(501));
  expect(container.querySelector('[aria-label="Daily streak"]')?.textContent).toContain('Daily Streak: 1');
  await act(async () => resolveNext('F L2'));
  await act(async () => { move('F', 2000); move('L2', 2100); move('L2', 2200); move("F'", 2400); });
  await act(async () => jest.advanceTimersByTime(501));
  const notices = container.querySelectorAll('[aria-label="Daily streak"]');
  expect(notices).toHaveLength(2);
  expect(notices[1].textContent).toContain('Daily Streak: 2');
  expect(notices[1].textContent).toContain('Best Streak: 2');
});

test('new PB celebrations wait for the penalty window and stay until dismissed without shifting the timer', async () => {
  await timedApp();
  await finishFirst();
  await act(async () => jest.advanceTimersByTime(500));
  expect(container.querySelector('[aria-label="Personal best"]')).toBeNull();
  await act(async () => jest.advanceTimersByTime(1));
  const celebration = container.querySelector('[aria-label="Personal best"]')!;
  expect(celebration.textContent).toContain('New personal best!');
  expect(celebration.textContent).toContain('Single: 0.60s');
  expect(celebration.querySelector('.pb-disco-ball')).not.toBeNull();
  expect(celebration.closest('.timer-panel')).toBeNull();
  expect(container.querySelector('[aria-label="Solve time"]')?.textContent).toBe('0.60');
  await act(async () => jest.advanceTimersByTime(60000));
  expect(container.querySelector('[aria-label="Personal best"]')).not.toBeNull();
  await click('Dismiss personal best');
  expect(container.querySelector('[aria-label="Personal best"]')).toBeNull();
});

test.each(['rename', 'delete'])('session %s during the penalty window keeps PB notifications consistent with the saved session', async action => {
  await timedApp([10000, 12000, 14000, 16000].map((duration, i) => historySolve(4 - i, duration, 2, 'Practice')));
  await chooseSession('Practice');
  await finishFirst();
  await click('Options');
  jest.spyOn(window, 'confirm').mockReturnValue(true);
  if (action === 'rename') await renameSession('Evening');
  else await click('Delete session');
  await click('Close options');
  await act(async () => jest.advanceTimersByTime(501));
  if (action === 'rename') {
    expect(container.querySelector('[aria-label="View PB Single"]')?.textContent).toContain('Single: 0.60s');
    await click('View PB Single');
    expect(container.querySelector('[aria-label="Solve replay"]')?.getAttribute('data-solve-id')).toBe(save.mock.calls[0][0][0].id);
    expect(container.querySelector('[aria-label="Solve replay"]')?.getAttribute('data-session')).toBe('Evening');
    expect(container.querySelectorAll<HTMLSelectElement>('select[aria-label="Session"]')[0].value).toBe('Evening');
    await click('Close');
    await click('View PB Ao5');
    expect(container.querySelector('.average-dialog h2')?.textContent).toBe('Ao5: 12.00s');
    expect(Array.from(container.querySelectorAll('[aria-label="Average solves"] tbody tr'), row => row.children[0].textContent)).toEqual(['1', '2', '3', '4', '5']);
  } else {
    expect(container.querySelector('[aria-label="Personal best"]')).toBeNull();
    expect(container.querySelector('[aria-label="Daily streak"]')).toBeNull();
  }
});

test('an existing Retries session keeps results and history but does not enter all-time statistics or PB celebrations', async () => {
  localStorage.setItem('timer-sessions', JSON.stringify(['Retries']));
  await timedApp();
  await chooseSession('Retries');
  await finishFirst();
  await act(async () => jest.advanceTimersByTime(501));
  expect(container.querySelector('[aria-label="Personal best"]')).toBeNull();
  expect(container.querySelector('[aria-label="Solve time"]')?.textContent).toBe('0.60');
  expect(container.querySelector('[aria-label="View current Single"]')).toBeNull();
  expect(container.querySelector('[aria-label="View best Single"]')).toBeNull();
  expect(container.querySelectorAll('[aria-label="Solve history"] tbody tr')).toHaveLength(1);
  await act(async () => resolveNext('F L2'));
  await chooseSession('Practice');
  await act(async () => { move('F', 2000); move('L2', 2100); move('L2', 2200); move("F'", 2800); });
  await act(async () => jest.advanceTimersByTime(501));
  expect(container.querySelector('[aria-label="Personal best"]')?.textContent).toContain('New personal best!');
  expect(container.querySelector('[aria-label="View best Single"]')?.textContent).toBe('0.60');
});

test('simultaneous PBs have separate clickable notifications and dismissal does not open details', async () => {
  const previous = [12000, 14000, 16000, 18000, 20000].map((duration, i) => historySolve(5 - i, duration, 2));
  await timedApp(previous);
  await finishFirst();
  await act(async () => jest.advanceTimersByTime(501));
  const celebrations = container.querySelectorAll('[aria-label="Personal best"]');
  expect(celebrations).toHaveLength(2);
  expect(celebrations[0].textContent).toContain('Single: 0.60s');
  expect(celebrations[1].textContent).toContain('Ao5: 14.00s');
  await click('View PB Single');
  expect(container.querySelector('[aria-label="Solve replay"]')?.getAttribute('data-solve-id')).toBe(save.mock.calls.at(-1)![0][0].id);
  await click('Close');
  await click('Dismiss personal best');
  expect(container.querySelector('[aria-label="Solve replay"]')).toBeNull();
  expect(container.querySelector('[aria-label="Personal best"]')?.textContent).toContain('Ao5:');
  await click('View PB Ao5');
  expect(container.querySelector<HTMLDialogElement>('.average-dialog')?.open).toBe(true);
  const rows = container.querySelectorAll('[aria-label="Average solves"] tbody tr');
  expect(Array.from(container.querySelectorAll('[aria-label="Average solves"] thead th'), cell => cell.textContent)).toEqual(['Solve', 'Time', 'Turns', 'TPS']);
  expect(Array.from(rows, row => row.children[0].textContent)).toEqual(['2', '3', '4', '5', '6']);
  expect(Array.from(rows, row => row.children[1].textContent)).toEqual(['(18.00s)', '16.00s', '14.00s', '12.00s', '(0.60s)']);
  expect(rows[0].querySelector('span')?.className).toBe('average-trimmed-worst');
  expect(rows[4].querySelector('span')?.className).toBe('average-trimmed-best');
  expect(container.querySelector('.average-dialog s')).toBeNull();
  expect(container.querySelector('.average-dialog')?.textContent).not.toMatch(/sorted by|excludes the/i);
  for (const cell of rows[4].children) {
    await act(async () => cell.querySelector<HTMLButtonElement>('button')!.click());
    expect(container.querySelector('[aria-label="Solve replay"]')?.getAttribute('data-solve-id')).toBe(save.mock.calls.at(-1)![0][0].id);
    await click('Close');
  }
  await act(async () => rows[4].dispatchEvent(new MouseEvent('click', { bubbles: true })));
  expect(container.querySelector('[aria-label="Solve replay"]')?.getAttribute('data-solve-id')).toBe(save.mock.calls.at(-1)![0][0].id);
  await click('Close');
  expect(container.querySelector<HTMLDialogElement>('.average-dialog')?.open).toBe(true);
  await act(async () => container.querySelector('.average-dialog')!.dispatchEvent(new Event('cancel', { bubbles: true, cancelable: true })));
  expect(container.querySelector('.average-dialog')).toBeNull();
  await click('Dismiss personal best');
  expect(container.querySelector('[aria-label="Personal best"]')).toBeNull();
  expect(container.querySelector('.average-dialog')).toBeNull();
});

test('successive PBs stay separately visible, while long-average notices reset at local midnight', async () => {
  const previous = Array.from({ length: 999 }, (_, i) => historySolve(999 - i, 10000 + i * 1000, 2));
  await timedApp(previous);
  jest.setSystemTime(new Date(2026, 10, 1, 23, 59, 30));
  await finishFirst();
  await act(async () => jest.advanceTimersByTime(501));
  expect(container.querySelector('[aria-label="Personal best"]')?.textContent).toContain('Single: 0.60s');
  for (const name of ['Ao5', 'Ao12', 'Ao100', 'Ao1000']) {
    expect(container.querySelector('[aria-label="Solve notifications"]')?.textContent).toContain(`${name}:`);
  }
  expect(container.querySelectorAll('[aria-label="Personal best"]')).toHaveLength(5);
  await act(async () => resolveNext('F L2'));
  await act(async () => { move('F', 2000); move('L2', 2100); move('L2', 2200); move("F'", 2400); });
  await act(async () => jest.advanceTimersByTime(501));
  expect(container.querySelector('[aria-label="Personal best"]')?.textContent).toContain('Single: 0.60s');
  await act(async () => jest.advanceTimersByTime(60000));
  expect(container.querySelector('[aria-label="Personal best"]')?.textContent).toContain('Single: 0.60s');
  const notices = container.querySelectorAll('[aria-label="Personal best"]');
  expect(notices).toHaveLength(8);
  const second = notices[5];
  expect(second.textContent).toContain('Single: 0.20s');
  expect(notices[6].textContent).toContain('Ao5:');
  expect(notices[7].textContent).toContain('Ao12:');
  expect(JSON.parse(localStorage.getItem('timer-pb-daily-records')!)).toEqual({ date: '2026-11-01', records: ['Ao100', 'Ao1000'] });

  jest.setSystemTime(new Date(2026, 10, 2, 0, 0, 1));
  await act(async () => { move('B', 3000); move('R2', 3100); move('R2', 3200); move("B'", 3300); });
  await act(async () => jest.advanceTimersByTime(501));
  const allNotices = container.querySelectorAll('[aria-label="Personal best"]');
  expect(allNotices).toHaveLength(13);
  expect(allNotices[5]).toBe(second);
  const third = allNotices[8];
  expect(third.textContent).toContain('Single: 0.10s');
  expect(allNotices[11].textContent).toContain('Ao100:');
  expect(allNotices[12].textContent).toContain('Ao1000:');
  expect(JSON.parse(localStorage.getItem('timer-pb-daily-records')!)).toEqual({ date: '2026-11-02', records: ['Ao100', 'Ao1000'] });
  while (container.querySelector('[aria-label="Personal best"]')) await click('Dismiss personal best');
  expect(container.querySelector('[aria-label="Personal best"]')).toBeNull();
});

test.each([
  ['{"date":"2026-11-01","records":["Ao100"]}', false, true],
  ['{"date":"2026-11-01","records":["Ao100","Ao1000"]}', false, false],
  ['{"date":"2026-10-31","records":["Ao100","Ao1000"]}', true, true],
  ['invalid JSON', true, true],
])('daily PB limits restore safely from %s', async (saved, ao100, ao1000) => {
  await timedApp(Array.from({ length: 999 }, (_, i) => historySolve(999 - i, 10000 + i * 1000, 2)));
  jest.setSystemTime(new Date(2026, 10, 1, 12));
  localStorage.setItem('timer-pb-daily-records', saved);
  await finishFirst();
  await act(async () => jest.advanceTimersByTime(501));
  const text = container.querySelector('[aria-label="Solve notifications"]')!.textContent!;
  expect(text).toContain('Single: 0.60s');
  expect(text).toContain('Ao5:');
  expect(text).toContain('Ao12:');
  expect(text.includes('Ao100:')).toBe(ao100);
  expect(text.includes('Ao1000:')).toBe(ao1000);
});

test('every-long-average PB option defaults off, applies immediately and retains daily limits when disabled', async () => {
  await timedApp(Array.from({ length: 999 }, (_, i) => historySolve(999 - i, 10000 + i * 1000, 2)));
  jest.setSystemTime(new Date(2026, 10, 1, 12));
  await click('Options');
  const setting = container.querySelector<HTMLInputElement>('input[aria-describedby="long-pb-notifications-help"]')!;
  expect(setting.checked).toBe(false);
  await act(async () => setting.click());
  expect(localStorage.getItem('timer-show-every-long-pb')).toBe('true');
  await finishFirst();
  await act(async () => jest.advanceTimersByTime(501));
  await act(async () => resolveNext('F L2'));
  await act(async () => { move('F', 2000); move('L2', 2100); move('L2', 2200); move("F'", 2400); });
  await act(async () => jest.advanceTimersByTime(501));
  for (const name of ['Ao100', 'Ao1000']) expect(container.querySelectorAll(`[aria-label="View PB ${name}"]`)).toHaveLength(2);
  await act(async () => setting.click());
  expect(localStorage.getItem('timer-show-every-long-pb')).toBe('false');
  await act(async () => { move('B', 3000); move('R2', 3100); move('R2', 3200); move("B'", 3300); });
  await act(async () => jest.advanceTimersByTime(501));
  for (const name of ['Ao100', 'Ao1000']) expect(container.querySelectorAll(`[aria-label="View PB ${name}"]`)).toHaveLength(2);
  expect(container.querySelectorAll('[aria-label="View PB Single"]')).toHaveLength(3);
});

test('saved every-long-average PB preference restores and overrides an already-used daily ledger', async () => {
  localStorage.setItem('timer-show-every-long-pb', 'true');
  await timedApp(Array.from({ length: 999 }, (_, i) => historySolve(999 - i, 10000 + i * 1000, 2)));
  jest.setSystemTime(new Date(2026, 10, 1, 12));
  localStorage.setItem('timer-pb-daily-records', '{"date":"2026-11-01","records":["Ao100","Ao1000"]}');
  await click('Options');
  expect(container.querySelector<HTMLInputElement>('input[aria-describedby="long-pb-notifications-help"]')!.checked).toBe(true);
  await finishFirst();
  await act(async () => jest.advanceTimersByTime(501));
  for (const name of ['Ao100', 'Ao1000']) expect(container.querySelector(`[aria-label="View PB ${name}"]`)).not.toBeNull();
});

test('blocked storage keeps long-average PBs daily by default but still allows showing every PB', async () => {
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Blocked'); });
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Blocked'); });
  await timedApp(Array.from({ length: 999 }, (_, i) => historySolve(999 - i, 10000 + i * 1000, 2)));
  await click('Options');
  const setting = container.querySelector<HTMLInputElement>('input[aria-describedby="long-pb-notifications-help"]')!;
  expect(setting.checked).toBe(false);
  await finishFirst();
  await act(async () => jest.advanceTimersByTime(501));
  await act(async () => setting.click());
  expect(setting.checked).toBe(true);
  expect(container.querySelector('.options-dialog')?.textContent).toContain('PB notification preference changed');
  await act(async () => resolveNext('F L2'));
  await act(async () => { move('F', 2000); move('L2', 2100); move('L2', 2200); move("F'", 2400); });
  await act(async () => jest.advanceTimersByTime(501));
  for (const name of ['Ao100', 'Ao1000']) expect(container.querySelectorAll(`[aria-label="View PB ${name}"]`)).toHaveLength(2);
});

test.each([1000, 3000])('penalty updates are included before comparing a solve against a %s ms PB', async previous => {
  await timedApp([historySolve(1, previous, 2)]);
  await enableExtraTurnPenalty();
  await finishFirst();
  await act(async () => move('F', 1000));
  await act(async () => jest.advanceTimersByTime(501));
  const celebration = container.querySelector('[aria-label="Personal best"]');
  if (previous === 1000) expect(celebration).toBeNull();
  else expect(celebration?.textContent).toContain('Single: 2.60s');
  expect(container.querySelectorAll('[aria-label="Daily streak"]')).toHaveLength(1);
});

test('a premature completion invalidated within the penalty window counts as a daily attempt but not a PB', async () => {
  await timedApp();
  await click('Connect cube');
  await act(async () => { move('R', 100, 1); move('U2', 200, 2); move('U2', 300, 3); move("R'", 900, 4); });
  jest.mocked(cube.solution).mockResolvedValueOnce(["F'"]);
  await act(async () => move('F', 1000, 6));
  await act(async () => resolveNext('F L2'));
  await act(async () => jest.advanceTimersByTime(501));
  expect(container.querySelector('[aria-label="Personal best"]')).toBeNull();
  expect(save.mock.calls.at(-1)![0][0].status).toBe('incomplete');
  expect(container.querySelector('[aria-label="Daily streak"]')?.textContent).toContain('Daily Streak: 1');
});

test('loading existing records does not replay PB celebrations', async () => {
  await timedApp([historySolve(1, 1000, 2)]);
  await act(async () => jest.advanceTimersByTime(5000));
  expect(container.querySelector('[aria-label="Personal best"]')).toBeNull();
});

test('a DNF completing the first valid average notifies only for the average and includes the DNF in its details', async () => {
  await timedApp([10000, 12000, 14000, 16000].map((duration, i) => historySolve(4 - i, duration, 2)));
  await click('Connect cube');
  await act(async () => { move('R', 100); move('U2', 200); move('U', 300); });
  await click('Abort solve');
  await act(async () => jest.advanceTimersByTime(501));
  expect(container.querySelector('[aria-label="View PB Single"]')).toBeNull();
  expect(container.querySelector('[aria-label="View PB Ao5"]')?.textContent).toContain('Ao5: 14.00s');
  await click('View PB Ao5');
  expect(container.querySelectorAll('[aria-label="Average solves"] tbody tr')).toHaveLength(5);
  expect(container.querySelector('.average-trimmed-worst')?.textContent).toBe('(DNF)');
});

test('a slower newest Ao12 does not notify for a historical floating-point PB', async () => {
  const durations = [11061.2, 11049.64, 12629.46, 12904.71, 13730.08, 11337.38, 12487.66, 12645.04, 12788.3, 13350.35, 11119.56, 11000];
  await timedApp(durations.map((duration, i) => historySolve(12 - i, duration, 2)));
  await click('Connect cube');
  await act(async () => { move('R', 100); move('U2', 200); move('U2', 300); move("R'", 15300); });
  await act(async () => jest.advanceTimersByTime(501));
  expect(container.querySelector('[aria-label="Personal best"]')).toBeNull();
  expect(container.querySelector('[aria-label="View current Ao12"]')?.textContent).toBe('12.41');
  expect(container.querySelector('[aria-label="View best Ao12"]')?.textContent).toBe('12.14');
});

test('average PB notifications retain their original window after later solves and session changes', async () => {
  await timedApp([12000, 14000, 16000, 18000, 20000].map((duration, i) => historySolve(5 - i, duration, 2)));
  await finishFirst();
  await act(async () => jest.advanceTimersByTime(501));
  await act(async () => resolveNext('F L2'));
  await act(async () => { move('F', 2000); move('L2', 2100); move('L2', 2200); move("F'", 2400); });
  await act(async () => jest.advanceTimersByTime(501));
  await click('Options');
  await chooseSession('Other');
  await act(async () => container.querySelector<HTMLDialogElement>('.options-dialog')!.close());
  expect(container.querySelector('[aria-label="View current Ao5"]')).toBeNull();
  await click('View PB Ao5');
  expect(container.querySelector('.average-dialog h2')?.textContent).toBe('Ao5: 14.00s');
  const rows = container.querySelectorAll('[aria-label="Average solves"] tbody tr');
  expect(Array.from(rows, row => row.children[0].textContent)).toEqual(['2', '3', '4', '5', '6']);
  expect(Array.from(rows, row => row.children[1].textContent)).toEqual(['(18.00s)', '16.00s', '14.00s', '12.00s', '(0.60s)']);
});

test('current and best singles open their exact replays across retries, penalties, rounding and history limits', async () => {
  const best = historySolve(1, 8000.001, 2), current = historySolve(103, 12000, 2);
  await showHistory([
    best, ...Array.from({ length: 100 }, (_, i) => historySolve(i + 2, 10000, 2)),
    { ...historySolve(102, 6000.002, 2), penalty: 2000 }, current,
    historySolve(104, 1, 2, 'Retries'), historySolve(105, 1, 2, 'Default', 'active'),
  ]);
  expect(historyNumbers()).not.toContain(1);
  await click('Time');
  for (const [kind, solve] of [['current', current], ['best', best]] as const) {
    await click(`View ${kind} Single`);
    expect(container.querySelector('[aria-label="Solve replay"]')?.getAttribute('data-solve-id')).toBe(solve.id);
    expect(container.querySelector('.average-dialog')).toBeNull();
    await click('Close');
    expect(container.querySelector('[aria-label="Solve replay"]')).toBeNull();
  }
});

test.each([false, true])('single replay links include a current DNF when all attempts are DNFs: %s', async allDnf => {
  const previous = historySolve(1, 10000, 2, 'Default', allDnf ? 'incomplete' : 'complete');
  const current = historySolve(2, 1, 2, 'Default', 'incomplete');
  await showHistory([previous, current]);
  expect(container.querySelector('[aria-label="View current Single"]')?.textContent).toBe('DNF');
  for (const [kind, solve] of [['current', current], ['best', allDnf ? current : previous]] as const) {
    await click(`View ${kind} Single`);
    expect(container.querySelector('[aria-label="Solve replay"]')?.getAttribute('data-solve-id')).toBe(solve.id);
    await click('Close');
  }
});

test.each([5, 12, 100, 1000])('current and best Ao%s open their exact windows with the correct number of exclusions', async count => {
  const solves = Array.from({ length: count + 2 }, (_, i) => historySolve(i + 1, 10000 + i * 100, 2));
  await showHistory([...solves, historySolve(count + 3, 1, 2, 'Retries'), historySolve(count + 4, 1, 2, 'Default', 'active')]);
  for (const kind of ['current', 'best']) {
    await click(`View ${kind} Ao${count}`);
    const rows = container.querySelectorAll('[aria-label="Average solves"] tbody tr');
    expect(rows).toHaveLength(count);
    expect(Array.from(container.querySelectorAll('[aria-label="Average solves"] thead th'), cell => cell.textContent)).toEqual(['Solve', 'Time', 'Turns', 'TPS']);
    const trim = Math.ceil(count / 20);
    expect(container.querySelectorAll('.average-trimmed-best')).toHaveLength(trim);
    expect(container.querySelectorAll('.average-trimmed-worst')).toHaveLength(trim);
    const start = kind === 'current' ? 2 : 0;
    expect(Array.from(rows, row => row.children[0].textContent)).toEqual(solves.slice(start, start + count).map(solve => solve.id));
    expect(Array.from(rows, row => row.children[1].textContent)).toEqual(solves.slice(start, start + count).map((solve, index) => {
      const time = `${(solve.duration / 1000).toFixed(2)}s`;
      return index < trim || index >= count - trim ? `(${time})` : time;
    }));
    await click(`Solve ${start + 1}, open replay`);
    expect(container.querySelector('[aria-label="Solve replay"]')?.getAttribute('data-solve-id')).toBe(solves[start].id);
    await click('Close');
    await click('Close average');
    expect(container.querySelector('.average-dialog')).toBeNull();
  }
}, 15000);

test('average solve numbers match full history across DNFs, active solves and display sorting', async () => {
  const solves = [
    historySolve(1, 2000, 2, 'Default', 'incomplete'), historySolve(2, 20000, 2),
    historySolve(3, 3000, 2, 'Default', 'incomplete'),
    ...Array.from({ length: 5 }, (_, i) => historySolve(i + 4, 10000 + i * 1000, 2)),
    { ...historySolve(9, 4000, 2, 'Default', 'incomplete'), createdAt: new Date(Date.UTC(2026, 0, 1, 0, 0, 6, 500)).toISOString() },
    historySolve(10, 1, 2, 'Default', 'active'), historySolve(11, 1, 2, 'Retries'),
  ];
  await showHistory(solves);
  await click('Time');
  const history = container.querySelectorAll('[aria-label="Solve history"] tbody tr');
  const expected = ['5', '6', '7', '8', '9'];
  expect(expected.every(number => Array.from(history).some(row => row.children[0].textContent === number))).toBe(true);
  await click('View current Ao5');
  const rows = container.querySelectorAll('[aria-label="Average solves"] tbody tr');
  expect(Array.from(rows, row => row.children[0].textContent)).toEqual(expected);
  expect(rows[2].querySelector('.average-trimmed-worst')?.textContent).toBe('(DNF)');
  expect(container.querySelector('.average-dialog h2')?.textContent).toBe('Ao5: 13.00s');
  await click('Solve 8, open replay');
  expect(container.querySelector('[aria-label="Solve replay"]')?.getAttribute('data-solve-id')).toBe('7');
});

test('DNF current and best averages open details showing untrimmed DNFs without numbering gaps', async () => {
  await showHistory(Array.from({ length: 5 }, (_, i) => historySolve(i + 1, 10000, 2, 'Default', i < 2 ? 'incomplete' : 'complete')));
  for (const kind of ['current', 'best']) {
    expect(container.querySelector(`[aria-label="View ${kind} Ao5"]`)?.textContent).toBe('DNF');
    await click(`View ${kind} Ao5`);
    expect(container.querySelector('.average-dialog h2')?.textContent).toBe('Ao5: DNF');
    const rows = container.querySelectorAll('[aria-label="Average solves"] tbody tr');
    expect(Array.from(rows, row => row.children[0].textContent)).toEqual(['1', '2', '3', '4', '5']);
    expect(container.querySelector('.average-trimmed-worst')?.textContent).toBe('(DNF)');
    expect(Array.from(rows, row => row.children[1].textContent)).toContain('DNF');
    await click('Close average');
  }
});

test('average columns sort numeric metrics and preserve real numbers, penalties, chopped rows and replay targets', async () => {
  await showHistory([
    historySolve(1, 10000, 3), { ...historySolve(2, 2000, 11), penalty: 2000 },
    historySolve(3, 0, 9), historySolve(4, 3000, 2, 'Default', 'incomplete'), historySolve(5, 4000, 5),
  ]);
  await click('View current Ao5');
  const table = container.querySelector('[aria-label="Average solves"]')!;
  const numbers = () => Array.from(table.querySelectorAll('tbody th'), cell => Number(cell.textContent));
  const sort = async (label: string) => {
    const button = Array.from(table.querySelectorAll('thead button')).find(button => button.textContent === label)!;
    await act(async () => (button as HTMLButtonElement).click());
  };
  expect(numbers()).toEqual([1, 2, 3, 4, 5]);
  const penaltyRow = table.querySelectorAll('tbody tr')[1];
  expect(penaltyRow.children[1].textContent).toBe('4.00s+2');
  expect(penaltyRow.children[2].textContent).toBe('11');
  expect(penaltyRow.children[3].textContent).toBe('5.50');
  await sort('Time');
  expect(numbers()).toEqual([3, 2, 5, 1, 4]);
  expect(table.querySelector('[aria-sort="ascending"]')?.textContent).toBe('Time');
  await sort('Time');
  expect(numbers()).toEqual([4, 1, 2, 5, 3]);
  await sort('Turns');
  expect(numbers()).toEqual([4, 1, 5, 3, 2]);
  await sort('Turns');
  expect(numbers()).toEqual([2, 3, 5, 1, 4]);
  await sort('TPS');
  expect(numbers()).toEqual([1, 4, 5, 2, 3]);
  await sort('TPS');
  expect(numbers()).toEqual([2, 5, 4, 1, 3]);
  expect(table.querySelector('.average-trimmed-best')?.textContent).toBe('(0.00s)');
  expect(table.querySelector('.average-trimmed-worst')?.textContent).toBe('(DNF)');
  expect(table.querySelector('s')).toBeNull();
  await click('Solve 2, open replay');
  expect(container.querySelector('[aria-label="Solve replay"]')?.getAttribute('data-solve-id')).toBe('2');
  await click('Close');
  await sort('Solve');
  expect(numbers()).toEqual([1, 2, 3, 4, 5]);
  await sort('Solve');
  expect(numbers()).toEqual([5, 4, 3, 2, 1]);
});

test.each(['accepted', 'dismissed'] as const)('Options prompts installation once when Chrome offers it (%s)', async outcome => {
  await openSiteOptions();
  const button = container.querySelector<HTMLButtonElement>('button[aria-describedby="install-help"]')!;
  expect(button.closest('dialog')).toBeNull();
  expect(button.disabled).toBe(true);
  const prompt = jest.fn<InstallOffer['prompt']>().mockResolvedValue({ outcome });
  const offer = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), { prompt });
  await act(async () => window.dispatchEvent(offer));
  expect(offer.defaultPrevented).toBe(true);
  expect(button.disabled).toBe(false);
  expect(prompt).not.toHaveBeenCalled();
  await click('Install app');
  expect(prompt).toHaveBeenCalledTimes(1);
  expect(button.disabled).toBe(true);
  await act(async () => button.click());
  expect(prompt).toHaveBeenCalledTimes(1);
  if (outcome === 'accepted') {
    await act(async () => window.dispatchEvent(new Event('appinstalled')));
    expect(container.querySelector('button[aria-describedby="install-help"]')).toBeNull();
  } else {
    await act(async () => window.dispatchEvent(Object.assign(new Event('beforeinstallprompt', { cancelable: true }), { prompt })));
    expect(button.disabled).toBe(false);
  }
});

type InstallOffer = { prompt(): Promise<{ outcome: 'accepted' | 'dismissed' }> };

test('an installation failure stays inside Options and a fresh offer permits retry', async () => {
  await openSiteOptions();
  const prompt = jest.fn<InstallOffer['prompt']>().mockRejectedValue(new Error('Prompt unavailable'));
  await act(async () => window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), { prompt })));
  await click('Install app');
  expect(container.querySelector('[role="alert"]')?.textContent).toContain('Installation could not start');
  expect(container.querySelector<HTMLButtonElement>('button[aria-describedby="install-help"]')!.disabled).toBe(true);
  prompt.mockResolvedValue({ outcome: 'dismissed' });
  await act(async () => window.dispatchEvent(Object.assign(new Event('beforeinstallprompt'), { prompt })));
  expect(container.querySelector('[role="alert"]')).toBeNull();
  await click('Install app');
  expect(prompt).toHaveBeenCalledTimes(2);
});

test('standalone launches omit installation controls', async () => {
  const removeListener = jest.spyOn(window, 'removeEventListener');
  jest.mocked(window.matchMedia).mockReturnValue({ matches: true } as MediaQueryList);
  await showHistory([]);
  await openSiteOptions();
  const prompt = jest.fn<InstallOffer['prompt']>().mockResolvedValue({ outcome: 'accepted' });
  const offer = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), { prompt });
  await act(async () => window.dispatchEvent(offer));
  expect(offer.defaultPrevented).toBe(false);
  expect(container.querySelector('button[aria-describedby="install-help"]')).toBeNull();
  expect(removeListener).not.toHaveBeenCalledWith('beforeinstallprompt', expect.any(Function));
});

test('history numbers every non-active attempt chronologically within its session', async () => {
  await showHistory([
    historySolve(3, 3000, 3), historySolve(1, 1000, 1), historySolve(4, 4000, 4, 'Other'),
    historySolve(2, 2000, 2, 'Default', 'incomplete'), historySolve(5, 0, 0, 'Default', 'active'),
  ]);
  expect(historyNumbers()).toEqual([3, 2, 1]);
  expect(container.querySelector('th[aria-sort="descending"]')?.textContent).toBe('Solve');
  await click('Solve');
  expect(historyNumbers()).toEqual([1, 2, 3]);
  await click('Solve');
  expect(historyNumbers()).toEqual([3, 2, 1]);
});

test('history headers sort numeric values in both directions without renumbering solves', async () => {
  await showHistory([
    historySolve(1, 10000, 30), historySolve(2, 2000, 10), historySolve(3, 4000, 4), historySolve(4, 0, 0, 'Default', 'incomplete'),
  ]);
  for (const [column, ascending, descending] of [
    ['Time', [4, 2, 3, 1], [1, 3, 2, 4]],
    ['Turns', [4, 3, 2, 1], [1, 2, 3, 4]],
    ['TPS', [3, 1, 2, 4], [2, 1, 3, 4]],
  ] as const) {
    await click(column);
    expect(historyNumbers()).toEqual(ascending);
    expect(container.querySelector('th[aria-sort="ascending"]')?.textContent).toBe(column);
    await click(column);
    expect(historyNumbers()).toEqual(descending);
    expect(container.querySelector('th[aria-sort="descending"]')?.textContent).toBe(column);
  }
  const rows = container.querySelectorAll('[aria-label="Solve history"] tbody tr');
  expect(Array.from(rows).map(row => row.children[1].textContent?.trim())).toEqual(['2.00s', '10.00s', '4.00s', '0.00s DNF']);
  expect(rows[3].children[3].textContent).toBe('--');
});

test('history sorts the full session before applying the display limit', async () => {
  await showHistory(Array.from({ length: 105 }, (_, index) => historySolve(index + 1, (index + 1) * 1000, 1)));
  expect(historyNumbers()).toEqual(Array.from({ length: 100 }, (_, index) => 105 - index));
  await click('Time');
  expect(historyNumbers()).toEqual(Array.from({ length: 100 }, (_, index) => index + 1));
});

test('cube card omits redundant instructions while preserving highlighting and correction messages', async () => {
  expect(container.querySelector('h1')?.textContent).toBe('Timer');
  expect(container.querySelector('nav[aria-label="CuberPlus"] a[aria-current="page"]')?.getAttribute('href')).toBe('/timer/');
  expect(container.textContent).not.toContain('Smart cube timing.');
  await click('Connect cube');
  const panel = container.querySelector('.timer-panel')!;
  const checkText = () => {
    expect(panel.textContent).not.toMatch(/Follow the highlighted|Wrong turn\.|Turn .+ once more|Scramble complete\.|Next:|Last solve|Use the cube's calibrated face/);
    expect(panel.querySelector('.next-move')).toBeNull();
    expect(panel.querySelector('.badge')).toBeNull();
  };
  checkText();
  expect(container.querySelector('.scramble .current')?.textContent).toBe('R');
  await act(async () => move('F', 100));
  checkText();
  expect(container.querySelector('[aria-label="Correction moves"]')?.textContent).toBe("F'");
  await act(async () => move("F'", 200));
  checkText();
  await act(async () => { move('R', 300); move('U2', 400); move('U2', 500); move("R'", 1100); });
  checkText();
  expect(panel.querySelector('[aria-label="Solve time"]')?.textContent).toBe('0.60');
  await act(async () => resolveNext('F L2'));
  checkText();
  expect(container.querySelector('.scramble .current')?.textContent).toBe('F');
});

test('scramble leads the timer card while cube-state controls stay in Bluetooth setup', async () => {
  const panel = container.querySelector('.timer-panel')!;
  expect(container.querySelector('main > section')).toBe(panel);
  expect(panel.firstElementChild).toBe(container.querySelector('[aria-label="Scramble"]'));
  await finishFirst();
  expect(panel.querySelector('[aria-label="View most recent solve"]')).not.toBeNull();
  await click('Bluetooth cube setup');
  const setup = container.querySelector<HTMLDialogElement>('dialog[aria-labelledby="cube-setup-title"]')!;
  expect(setup.open).toBe(true);
  for (const label of ['Read cube state', 'Cube is physically solved - calibrate']) {
    const button = Array.from(setup.querySelectorAll('button')).find(button => button.textContent === label)!;
    expect(button).toBeDefined();
    expect(panel.contains(button)).toBe(false);
  }
});

test('double-turn and ready instructions stay hidden without changing first-turn timing', async () => {
  generate.mockReset().mockResolvedValue('R2');
  await click('Connect cube');
  const panel = container.querySelector('.timer-panel')!;
  await act(async () => move('R', 100));
  expect(panel.textContent).not.toContain('Turn R once more to complete R2');
  expect(container.querySelector('.scramble .current')?.textContent).toBe('R2');
  await act(async () => move('R', 200));
  expect(panel.textContent).not.toContain('Scramble complete.');
  expect(panel.classList.contains('ready')).toBe(true);
  expect(panel.querySelector('[aria-label="Solve time"]')?.textContent).toBe('0.00');
  await act(async () => { move('R', 300); move('R', 500); });
  expect(panel.querySelector('[aria-label="Solve time"]')?.textContent).toBe('0.20');
  expect(save.mock.calls.flatMap(([solves]) => solves).at(-1)?.status).toBe('complete');
});

test('scramble keeps completed green moves, replaces pending moves with red corrections, and restores them after undo', async () => {
  await click('Connect cube');
  const scramble = container.querySelector('[aria-label="Scramble"]')!;
  expect(scramble.closest('section')!.querySelector('h2')).toBeNull();
  await act(async () => move('R', 100));
  expect(scramble.querySelector('.done')?.textContent).toBe('R');
  await act(async () => { move('F', 200); move('L', 300); });
  expect(Array.from(scramble.querySelectorAll('.move:not(.correction)'), element => element.textContent)).toEqual(['R']);
  expect(scramble.querySelector('.move:not(.done):not(.correction)')).toBeNull();
  expect(Array.from(scramble.querySelectorAll('.correction')).map(move => move.textContent)).toEqual(["L'", "F'"]);
  expect(scramble.querySelector('.current')?.classList.contains('correction')).toBe(true);
  expect(scramble.querySelector('.move:not(.correction)')!.compareDocumentPosition(scramble.querySelector('[aria-label="Correction moves"]')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  await act(async () => move("L'", 400));
  expect(scramble.querySelector('[aria-label="Correction moves"]')?.textContent).toBe("F'");
  await act(async () => move("F'", 500));
  expect(scramble.querySelector('.correction')).toBeNull();
  expect(scramble.querySelector('.done')?.textContent).toBe('R');
  expect(scramble.querySelector('.current')?.textContent).toBe('U2');
  await act(async () => move('U', 600));
  expect(scramble.querySelector('.current.partial')?.textContent).toBe('U2');
  await act(async () => move("U'", 650));
  expect(scramble.querySelector('.partial')).toBeNull();
  await act(async () => move("U'", 700));
  expect(scramble.querySelector('.current.partial')?.textContent).toBe('U2');
  await act(async () => move("U'", 800));
  expect(scramble.querySelector('.current')).toBeNull();
  expect(container.querySelector('[aria-label="Solve time"]')?.textContent).toBe('0.00');
});

test('scramble highlights the first pending move while a commuting later move turns green', async () => {
  generate.mockReset().mockResolvedValue('R L U');
  await click('Connect cube');
  const scramble = container.querySelector('[aria-label="Scramble"]')!;
  await act(async () => move('L', 100));
  expect(scramble.querySelector('.current')!.textContent).toBe('R');
  expect(Array.from(scramble.querySelectorAll('.done')).map(move => move.textContent)).toEqual(['L']);
  expect(scramble.querySelector('.correction')).toBeNull();
  await act(async () => move('F', 200));
  expect(Array.from(scramble.querySelectorAll('.move:not(.correction)'), element => element.textContent)).toEqual(['L']);
  expect(scramble.querySelector('.move:not(.done):not(.correction)')).toBeNull();
  expect(scramble.querySelector('.correction')!.textContent).toBe("F'");
  await act(async () => move("F'", 300));
  expect(scramble.querySelector('.current')!.textContent).toBe('R');
  expect(Array.from(scramble.querySelectorAll('.done')).map(move => move.textContent)).toEqual(['L']);
  await act(async () => move('R', 400));
  expect(scramble.querySelector('.current')!.textContent).toBe('U');
  expect(Array.from(scramble.querySelectorAll('.done')).map(move => move.textContent)).toEqual(['R', 'L']);
  await act(async () => move('U', 500));
  expect(scramble.querySelector('.current')).toBeNull();
  expect(Array.from(scramble.querySelectorAll('.done'), element => element.textContent)).toEqual(['R', 'L', 'U']);
  expect(container.querySelector('.timer-panel')!.classList.contains('ready')).toBe(true);
  expect(save).not.toHaveBeenCalled();
});

test('displayed scrambles combine repeated faces across commuting moves', async () => {
  generate.mockReset().mockResolvedValue('R L R U U2');
  await click('Connect cube');
  const scramble = container.querySelector('[aria-label="Scramble"]')!;
  expect(Array.from(scramble.querySelectorAll('.move')).map(move => move.textContent)).toEqual(['R2', 'L', "U'"]);
  await act(async () => { move('L', 100); move('R', 200); });
  expect(scramble.querySelector('.current.partial')!.textContent).toBe('R2');
  expect(scramble.querySelector('.done')!.textContent).toBe('L');
  await act(async () => { move('R', 300); move("U'", 400); });
  expect(container.querySelector('.timer-panel')!.classList.contains('ready')).toBe(true);
});

test('the scramble refresh icon replaces a partially applied scramble with valid setup and does not interrupt a solve', async () => {
  const button = container.querySelector<HTMLButtonElement>('[aria-label="New scramble"]')!;
  expect(button.closest('[aria-label="Scramble"]')).not.toBeNull();
  expect(button.querySelector('svg')).not.toBeNull();
  expect(button.disabled).toBe(true);
  await click('Connect cube');
  expect(button.disabled).toBe(false);
  await act(async () => move('R', 100));
  const initial = cube.facelets(cube.solved().applyMove('R'));
  const solution = jest.spyOn(cube, 'solution').mockResolvedValueOnce(["R'"]);
  await click('New scramble');
  expect(button.disabled).toBe(true);
  expect(generate).toHaveBeenCalledTimes(2);
  await act(async () => button.click());
  expect(generate).toHaveBeenCalledTimes(2);
  await act(async () => resolveNext('F L2'));
  expect(solution).toHaveBeenCalledWith(initial);
  expect(button.disabled).toBe(false);
  expect(container.querySelector('[aria-label="Live 3x3 cube state"]')!.getAttribute('data-facelets')).toBe(initial);
  expect(Array.from(container.querySelectorAll('.scramble .move'), element => element.textContent)).toEqual(["R'"]);
  expect(container.querySelector('.scramble .done')).toBeNull();
  expect(container.querySelector('[aria-label="Path to solved"] .current')!.textContent).toBe("R'");
  expect(save).not.toHaveBeenCalled();
  await act(async () => { move("R'", 200); move('F', 300); move('L2', 400); });
  expect(button.disabled).toBe(false);
  await act(async () => move('L2', 500));
  expect(button.disabled).toBe(true);
  expect(button.getAttribute('aria-hidden')).toBe('true');
  await act(async () => button.click());
  expect(generate).toHaveBeenCalledTimes(2);
  await act(async () => move("F'", 900));
  const solve = save.mock.calls.flatMap(([solves]) => solves).at(-1)!;
  expect(solve.status).toBe('complete');
  expect(solve.scramble).toBe('F L2');
  expect(solve.inspection).toBe(100);
  expect(solve.duration).toBe(400);
});

test('refreshing a ready scramble resets inspection until the new scramble is complete', async () => {
  await click('Connect cube');
  await act(async () => { move('R', 100); move('U2', 200); });
  jest.spyOn(cube, 'solution').mockResolvedValueOnce(['U2', "R'"]);
  await click('New scramble');
  await act(async () => resolveNext('F L2'));
  await act(async () => { move('U2', 300); move("R'", 400); move('F', 500); move('L2', 600); move('L2', 1000); move("F'", 1200); });
  const solve = save.mock.calls.flatMap(([solves]) => solves).at(-1)!;
  expect(solve.scramble).toBe('F L2');
  expect(solve.inspection).toBe(400);
  expect(solve.duration).toBe(200);
});

test('a failed manual scramble refresh shows the error and disables refresh until resynchronization', async () => {
  await click('Connect cube');
  generate.mockReset().mockRejectedValueOnce(new Error('Scramble generation failed'));
  await click('New scramble');
  expect(container.querySelector('[role="alert"]')!.textContent).toContain('Scramble generation failed');
  expect(container.querySelector<HTMLButtonElement>('[aria-label="New scramble"]')!.disabled).toBe(true);
  expect(save).not.toHaveBeenCalled();
});

test.each(['D', "D'"])('a single %s partially highlights D2 in U2 D2 without moving the U2 box', async quarter => {
  generate.mockReset().mockResolvedValue('U2 D2');
  await click('Connect cube');
  const scramble = container.querySelector('[aria-label="Scramble"]')!;
  await act(async () => move(quarter, 100));
  expect(scramble.querySelector('.current')!.textContent).toBe('U2');
  expect(scramble.querySelector('.current.partial')).toBeNull();
  const second = scramble.querySelector('.partial')!;
  expect(second.textContent).toBe('D2');
  expect(second.classList.contains('current')).toBe(false);
  expect(second.getAttribute('title')).toBe('Partially complete');
  expect(scramble.querySelector('.done')).toBeNull();
  expect(scramble.querySelector('.correction')).toBeNull();
  await act(async () => move('U', 200));
  expect(Array.from(scramble.querySelectorAll('.partial')).map(move => move.textContent)).toEqual(['U2', 'D2']);
  expect(scramble.querySelector('.current.partial')!.textContent).toBe('U2');
  await act(async () => move("U'", 250));
  expect(scramble.querySelector('.current.partial')).toBeNull();
  expect(scramble.querySelector('.partial')!.textContent).toBe('D2');
  await act(async () => move(inverse(quarter), 300));
  expect(scramble.querySelector('.partial')).toBeNull();
  expect(scramble.querySelector('.done')).toBeNull();
  expect(scramble.querySelector('.current')!.textContent).toBe('U2');
  await act(async () => { move(quarter, 350); move(quarter, 450); });
  expect(scramble.querySelector('.partial')).toBeNull();
  expect(scramble.querySelector('.done')!.textContent).toBe('D2');
  expect(scramble.querySelector('.done')!.getAttribute('title')).toBeNull();
  expect(scramble.querySelector('.current')!.textContent).toBe('U2');
  await act(async () => move('U2', 500));
  expect(scramble.querySelector('.current')).toBeNull();
  expect(scramble.querySelector('.partial')).toBeNull();
  expect(Array.from(scramble.querySelectorAll('.done'), element => element.textContent)).toEqual(['U2', 'D2']);
  expect(container.querySelector('.timer-panel')!.classList.contains('ready')).toBe(true);
  expect(save).not.toHaveBeenCalled();
});

test('partial highlights apply only to the current commuting block and recover after a wrong turn', async () => {
  generate.mockReset().mockResolvedValue('U2 D2 F D2');
  await click('Connect cube');
  const scramble = container.querySelector('[aria-label="Scramble"]')!;
  await act(async () => move('D', 100));
  const moves = scramble.querySelectorAll('.move');
  expect(moves[1].classList.contains('partial')).toBe(true);
  expect(moves[3].classList.contains('partial')).toBe(false);
  expect(moves[3].getAttribute('title')).toBeNull();
  await act(async () => move('R', 200));
  expect(scramble.querySelector('.partial')).toBeNull();
  expect(scramble.querySelector('.current.correction')!.textContent).toBe("R'");
  await act(async () => move("R'", 300));
  expect(scramble.querySelector('.current')!.textContent).toBe('U2');
  expect(scramble.querySelectorAll('.partial')).toHaveLength(1);
  expect(scramble.querySelector('.partial')!.textContent).toBe('D2');
  expect(scramble.querySelector('.correction')).toBeNull();
});

test('ten remaining corrections replace a partial scramble with fresh solver guidance, repeatedly preserving the original scramble', async () => {
  await click('Connect cube');
  const stray = movesOf("F U F' U' F U F' U' F U"), original = ['R', ...stray];
  const firstSetup = simplifyMoves([...original].reverse().map(inverse));
  const secondStray = Array.from({ length: 5 }, () => ['R', 'B']).flat();
  const secondState = [...original, ...firstSetup.slice(0, 2), ...secondStray];
  const secondSetup = simplifyMoves([...secondState].reverse().map(inverse));
  let resolveSetup: (moves: string[]) => void = () => {};
  const solution = jest.mocked(cube.solution).mockResolvedValueOnce(firstSetup).mockImplementationOnce(() => new Promise(resolve => { resolveSetup = resolve; }));
  const shownPath = () => Array.from(container.querySelectorAll('[aria-label="Path to solved"] .move'), element => element.textContent);
  let host = 100;
  const feed = (moves: string[]) => moves.forEach(notation => move(notation, host += 100));
  await act(async () => feed(['R', ...stray.slice(0, 9)]));
  expect(solution).not.toHaveBeenCalled();
  expect(container.querySelectorAll('.scramble .correction')).toHaveLength(9);
  expect(Array.from(container.querySelectorAll('.scramble .move:not(.correction)'), element => element.textContent)).toEqual(['R']);
  expect(container.querySelector('.scramble .move:not(.done):not(.correction)')).toBeNull();
  await act(async () => feed(stray.slice(9)));
  expect(solution).toHaveBeenCalledTimes(1);
  expect(solution).toHaveBeenLastCalledWith(cube.facelets(cube.solved().applyAlg(original.join(' '))));
  expect(shownPath()).toEqual(firstSetup);
  expect(container.querySelector('[aria-label="Original scramble"]')).toBeNull();
  expect(container.querySelector('.scramble .correction')).toBeNull();
  expect(generate).toHaveBeenCalledTimes(1);
  expect(save).not.toHaveBeenCalled();

  await act(async () => feed(firstSetup.slice(0, 2)));
  const remaining = firstSetup.slice(2);
  const completed = firstSetup.slice(0, 2);
  expect(shownPath()).toEqual(firstSetup);
  expect(Array.from(container.querySelectorAll('[aria-label="Path to solved"] .done'), element => element.textContent)).toEqual(completed);
  await act(async () => feed(['R']));
  expect(shownPath()).toEqual(completed);
  expect(container.querySelector('[aria-label="Path to solved"] .move:not(.done)')).toBeNull();
  expect(container.querySelector('[aria-label="Path to solved"] .current')).toBeNull();
  expect(container.querySelector('.scramble .current.correction')).not.toBeNull();
  expect(container.querySelector('[aria-label="Path to solved"]')!.compareDocumentPosition(container.querySelector('[aria-label="Correction moves"]')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  await act(async () => feed(["R'"]));
  expect(container.querySelector('.scramble .correction')).toBeNull();
  expect(shownPath()).toEqual(firstSetup);
  expect(container.querySelector('[aria-label="Path to solved"] .current')?.textContent).toBe(remaining[0]);
  for (let i = 0; i < 9; i++) {
    await act(async () => feed([secondStray[i]]));
    expect(solution).toHaveBeenCalledTimes(1);
    expect(shownPath()).toEqual(completed);
    expect(container.querySelector('[aria-label="Path to solved"] .move:not(.done)')).toBeNull();
    expect(container.querySelectorAll('.scramble .correction')).toHaveLength(i + 1);
    expect(container.querySelector('[aria-label="Original scramble"]')).toBeNull();
  }
  await act(async () => feed(secondStray.slice(9)));
  expect(solution).toHaveBeenCalledTimes(2);
  expect(solution).toHaveBeenLastCalledWith(cube.facelets(cube.solved().applyAlg(secondState.join(' '))));
  expect(shownPath()).toEqual(completed);
  expect(container.querySelector('.scramble .correction')).toBeNull();
  expect(container.textContent).toContain('Finding moves to return the cube to solved...');
  await act(async () => resolveSetup(secondSetup));
  expect(shownPath()).toEqual(secondSetup);
  expect(container.querySelector('[aria-label="Path to solved"] .done')).toBeNull();
  expect(container.querySelector('.scramble .correction')).toBeNull();
  await act(async () => feed(secondSetup));
  expect(container.querySelector('[aria-label="Live 3x3 cube state"]')?.getAttribute('data-facelets')).toBe(SOLVED);
  expect(container.querySelector('[aria-label="Path to solved"]')).toBeNull();
  expect(container.querySelector('.scramble .current')?.textContent).toBe('R');
  expect(generate).toHaveBeenCalledTimes(1);
  expect(save).not.toHaveBeenCalled();
  await act(async () => feed(['R', 'U2']));
  expect(container.querySelector('.timer-panel')?.classList.contains('ready')).toBe(true);
  expect(Array.from(container.querySelectorAll('[aria-label="Original scramble"] .done'), element => element.textContent)).toEqual(['R', 'U2']);
  expect(save).not.toHaveBeenCalled();
  await act(async () => feed(['U2', "R'"]));
  expect(save.mock.calls.at(-1)![0][0]).toMatchObject({ status: 'complete', scramble: 'R U2' });
});

test('moves buffered during rerouting can trigger another fresh solution without losing turns or counters', async () => {
  await click('Connect cube');
  const stray = movesOf("F U F' U' F U F' U' F U"), firstState = ['R', ...stray];
  const queuedStray = Array.from({ length: 5 }, () => ['R', 'B']).flat(), finalState = [...firstState, ...queuedStray];
  const firstSetup = simplifyMoves([...firstState].reverse().map(inverse)), finalSetup = simplifyMoves([...finalState].reverse().map(inverse));
  let resolveSetup: (moves: string[]) => void = () => {};
  const solution = jest.mocked(cube.solution).mockImplementationOnce(() => new Promise(resolve => { resolveSetup = resolve; })).mockResolvedValueOnce(finalSetup);
  let serial = 0;
  const feed = (moves: string[]) => moves.forEach(notation => { serial++; move(notation, serial * 100, serial); });
  await act(async () => feed(firstState));
  expect(solution).toHaveBeenCalledTimes(1);
  expect(container.textContent).toContain('Finding moves to return the cube to solved...');
  expect(container.querySelector('.timer-panel .move')).toBeNull();
  await act(async () => feed(queuedStray));
  expect(solution).toHaveBeenCalledTimes(1);
  await act(async () => resolveSetup(firstSetup));
  expect(solution).toHaveBeenCalledTimes(2);
  const facelets = cube.facelets(cube.solved().applyAlg(finalState.join(' ')));
  expect(solution).toHaveBeenLastCalledWith(facelets);
  expect(container.querySelector('[aria-label="Live 3x3 cube state"]')?.getAttribute('data-facelets')).toBe(facelets);
  await act(async () => emit({ type: 'FACELETS', timestamp: serial * 100, facelets, serial }));
  expect(container.querySelector('[role="alert"]')).toBeNull();
  expect(Array.from(container.querySelectorAll('[aria-label="Path to solved"] .move'), element => element.textContent)).toEqual(finalSetup);
  await act(async () => feed(finalSetup));
  expect(physicalFacelets).toBe(SOLVED);
  expect(container.querySelector('.scramble .current')?.textContent).toBe('R');
  expect(generate).toHaveBeenCalledTimes(1);
  expect(save).not.toHaveBeenCalled();
});

test('disconnecting discards a pending automatic recovery instead of installing stale guidance', async () => {
  await click('Connect cube');
  const state = movesOf("R F U F' U' F U F' U' F U");
  let resolveSetup: (moves: string[]) => void = () => {};
  jest.mocked(cube.solution).mockImplementationOnce(() => new Promise(resolve => { resolveSetup = resolve; }));
  await act(async () => state.forEach((notation, i) => move(notation, (i + 1) * 100)));
  await click('Disconnect');
  await act(async () => resolveSetup([...state].reverse().map(inverse)));
  expect(container.querySelector('[aria-label="Path to solved"]')).toBeNull();
  expect(container.textContent).toContain('Cube disconnected.');
  expect(save).not.toHaveBeenCalled();
});

test('an automatic recovery solver failure shows the error without arming or recording a solve', async () => {
  await click('Connect cube');
  const state = movesOf("R F U F' U' F U F' U' F U");
  const solution = jest.mocked(cube.solution).mockRejectedValueOnce(new Error('Local solver failed'));
  await act(async () => state.forEach((notation, i) => move(notation, (i + 1) * 100)));
  expect(solution).toHaveBeenCalledTimes(1);
  expect(container.querySelector('[role="alert"]')?.textContent).toContain('Local solver failed');
  expect(container.querySelector('.timer-panel')?.classList.contains('ready')).toBe(false);
  expect(container.querySelector<HTMLButtonElement>('[aria-label="New scramble"]')?.disabled).toBe(true);
  expect(save).not.toHaveBeenCalled();
});

test('ten corrections during DNF recovery also replan without changing the recorded attempt', async () => {
  await click('Connect cube');
  await act(async () => { move('R', 100); move('U2', 200); move('U', 300); });
  await click('Abort solve');
  const recorded = save.mock.calls.at(-1)![0][0], writes = save.mock.calls.length;
  await act(async () => move('U', 350));
  expect(container.querySelector('[aria-label="Path to solved"] .done')?.textContent).toBe('U');
  const stray = Array.from({ length: 5 }, () => ['F', 'R']).flat(), state = ['R', ...stray];
  const setup = simplifyMoves([...state].reverse().map(inverse));
  const solution = jest.mocked(cube.solution).mockResolvedValueOnce(setup);
  for (let i = 0; i < 9; i++) {
    await act(async () => move(stray[i], 400 + i * 100));
    expect(solution).toHaveBeenCalledTimes(1);
    expect(Array.from(container.querySelectorAll('.scramble .move:not(.correction)'), element => element.textContent)).toEqual(['U']);
    expect(container.querySelector('[aria-label="Path to solved"] .move:not(.done)')).toBeNull();
    expect(container.querySelector('.scramble .current:not(.correction)')).toBeNull();
  }
  await act(async () => move(stray[9], 1300));
  expect(solution).toHaveBeenLastCalledWith(cube.facelets(cube.solved().applyAlg(state.join(' '))));
  expect(container.querySelector('.timer-panel')?.textContent).toContain('Return the cube to solved');
  expect(container.querySelector('.scramble .correction')).toBeNull();
  expect(save.mock.calls).toHaveLength(writes);
  expect(save.mock.calls.at(-1)![0][0]).toEqual(recorded);
  expect(generate).toHaveBeenCalledTimes(1);
  await act(async () => setup.forEach((notation, i) => move(notation, 1500 + i * 100)));
  expect(physicalFacelets).toBe(SOLVED);
  expect(generate).toHaveBeenCalledTimes(2);
  expect(save.mock.calls).toHaveLength(writes);
});

test('red corrections use shortened undo moves and disappear once the mistake is corrected', async () => {
  await click('Connect cube');
  await act(async () => {
    move('F', 100);
    for (let i = 0; i < 10; i++) move('U', 200 + i * 100);
  });
  const scramble = container.querySelector('[aria-label="Scramble"]')!;
  expect(Array.from(scramble.querySelectorAll('.correction')).map(move => move.textContent)).toEqual(['U2', "F'"]);
  await act(async () => move('U2', 1500));
  expect(scramble.querySelector('.correction')?.textContent).toBe("F'");
  await act(async () => move("F'", 1600));
  expect(scramble.querySelector('.correction')).toBeNull();
  expect(scramble.querySelector('.current')?.textContent).toBe('R');
});

test('returning to solved removes corrections and displays the full original scramble again', async () => {
  await click('Connect cube');
  const scramble = container.querySelector('[aria-label="Scramble"]')!;
  await act(async () => { move('R', 100); move('F', 200); });
  expect(scramble.querySelector('.correction')).not.toBeNull();
  await act(async () => { move("F'", 300); move("R'", 400); });
  expect(scramble.querySelector('.correction')).toBeNull();
  expect(scramble.querySelector('.done')).toBeNull();
  expect(Array.from(scramble.querySelectorAll('.move')).map(move => move.textContent)).toEqual(['R', 'U2']);
  expect(scramble.querySelector('.current')?.textContent).toBe('R');
  expect(generate).toHaveBeenCalledTimes(1);
  expect(container.querySelector('[aria-label="Solve time"]')?.textContent).toBe('0.00');
});

test('Bluetooth setup owns MAC help, accepts keyboard submission, and closes after connecting', async () => {
  const dialog = container.querySelector<HTMLDialogElement>('dialog[aria-labelledby="cube-setup-title"]')!;
  const mac = container.querySelector('input[placeholder="AA:BB:CC:DD:EE:FF"]')!;
  expect(mac.closest('dialog')).toBe(dialog);
  const help = Array.from(dialog.querySelectorAll('button')).find(button => button.textContent === "Find my cube's MAC address");
  expect(help).toBeDefined();
  await act(async () => help!.click());
  expect(container.querySelector<HTMLDialogElement>('.mac-help-dialog')!.open).toBe(true);
  await click('Bluetooth cube setup');
  expect(dialog.open).toBe(true);
  await act(async () => mac.closest('form')!.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })));
  expect(dialog.open).toBe(false);
  expect(container.querySelector('input[placeholder="AA:BB:CC:DD:EE:FF"]')).toBeNull();
});

test('normal saving and saved messages remain hidden during a pending write and after completion', async () => {
  let finishSave: () => void;
  save.mockImplementationOnce(() => new Promise<void>(resolve => { finishSave = resolve; }));
  await finishFirst();
  expect(container.textContent).not.toMatch(/Saving locally|Saved locally/);
  await act(async () => finishSave());
  expect(container.textContent).not.toMatch(/Saving locally|Saved locally/);
});

test('simulation remains hidden and connection details live in cube setup, not the global header', async () => {
  const simulator = Array.from(container.querySelectorAll('button')).find(button => button.textContent === 'Try simulated cube')!;
  expect(simulator.hidden).toBe(true);
  await click('Try simulated cube');
  expect(container.querySelector('.demo')).not.toBeNull();
  await click('Disconnect');
  await click('Connect cube');
  await act(async () => emit({ type: 'BATTERY', timestamp: 0, batteryLevel: 88 }));
  await click('Bluetooth cube setup');
  const battery = container.querySelector('dialog[aria-labelledby="cube-setup-title"] .badge')!;
  expect(battery.textContent).toBe('88% battery');
  expect(battery.parentElement!.lastElementChild).toBe(battery);
  expect(container.querySelector('header .badge')).toBeNull();
});

test('shows CFOP milestones during an active solve without exporting', async () => {
  const pll = "R U R' U' R' F R2 U' R' U' R U R' F'", oll = "R U R' U R U2 R'";
  const scramble = `${pll} ${oll} R U R' F U F' L U L' B U B' D`;
  generate.mockReset().mockResolvedValueOnce(scramble).mockResolvedValue('B R2');
  await click('Connect cube');
  await act(async () => scramble.split(' ').forEach((turn, i) => move(turn, i * 100)));
  expect(container.querySelector('[aria-label="CFOP steps"]')).toBeNull();
  await act(async () => move("D'", 4000));
  expect(container.textContent).not.toContain('reported moves recorded');
  expect(container.querySelector('.trail-duration[data-step="0"][data-status="done"]')).not.toBeNull();
  expect(container.querySelector('.trail-duration[data-step="1"][data-status="pending"]')).not.toBeNull();
  await act(async () => { move('B', 4100); move("U'", 4200); move("B'", 4300); });
  expect(container.querySelector('.trail-duration[data-step="1"][data-status="done"]')).not.toBeNull();
  expect(container.querySelector('.trail-duration[data-step="2"][data-status="pending"]')).not.toBeNull();
  expect(container.querySelector('.trail-duration[data-step="6"][data-status="unreached"]')).not.toBeNull();
  expect(save.mock.calls.flatMap(([solves]) => solves).every(solve => solve.status === 'active')).toBe(true);
});

test('keeps inspection recorded but hidden from the main timer', async () => {
  await click('Connect cube');
  await act(async () => { move('R', 100); move('U2', 200); });
  expect(container.querySelector('[aria-label="Inspection time"]')).toBeNull();
  await act(async () => {
    jest.mocked(performance.now).mockReturnValue(1250);
    emit({ type: 'BATTERY', timestamp: 1250, batteryLevel: 80 });
  });
  expect(container.querySelector('[aria-label="Inspection time"]')).toBeNull();
  await act(async () => { move('U2', 1500); move("R'", 1900); });
  expect(container.querySelector('[aria-label="Inspection time"]')).toBeNull();
  expect(container.querySelector('[aria-label="Solve time"]')?.textContent).toBe('0.40');
  expect(save.mock.calls.flatMap(([solves]) => solves).at(-1)?.inspection).toBe(1300);
});

test('inspection preference persists and counts up from scramble completion before applying +2', async () => {
  await click('Options');
  const option = () => container.querySelector<HTMLInputElement>('[aria-describedby="inspection-help"]')!;
  expect(option().checked).toBe(false);
  await act(async () => option().click());
  expect(localStorage.getItem('timer-inspection')).toBe('true');
  await showHistory([]);
  expect(option().checked).toBe(true);
  await click('Connect cube');
  await act(async () => { move('R', 100); move('U2', 200); });
  expect(container.querySelector('[aria-label="Inspection time"]')?.textContent).toBe('0.00');
  await act(async () => {
    jest.mocked(performance.now).mockReturnValue(15200);
    emit({ type: 'BATTERY', timestamp: 15200, batteryLevel: 80 });
  });
  expect(container.querySelector('[aria-label="Inspection time"]')?.textContent).toBe('15.00');
  expect(container.querySelector('[aria-label="Inspection status"]')?.textContent).toBe('Inspection: +2');
  await act(async () => move('U2', 16200));
  expect(option().disabled).toBe(true);
  expect(container.querySelector('[aria-label="Inspection time"]')).toBeNull();
  await act(async () => move("R'", 16800));
  expect(container.querySelector('[aria-label="Solve time"]')?.textContent).toBe('2.60');
  expect(container.querySelector('.timer-display .solve-penalty')?.textContent).toBe('+2');
  expect(save.mock.calls.flatMap(([solves]) => solves).at(-1)).toMatchObject({ duration: 600, inspection: 16000, penalty: 2000, penaltyReason: 'inspection' });
});

test('inspection shows DNF at 17 seconds and persists an inspection DNF after physical completion', async () => {
  await act(async () => container.querySelector<HTMLInputElement>('[aria-describedby="inspection-help"]')!.click());
  await click('Connect cube');
  await act(async () => { move('R', 100); move('U2', 200); });
  await act(async () => {
    jest.mocked(performance.now).mockReturnValue(17200);
    emit({ type: 'BATTERY', timestamp: 17200, batteryLevel: 80 });
  });
  expect(container.querySelector('[aria-label="Inspection status"]')?.textContent).toBe('Inspection: DNF');
  await act(async () => { move('U2', 17200); move("R'", 17800); });
  expect(container.querySelector('.timer-display .solve-penalty')?.textContent).toBe('DNF');
  expect(container.querySelector('[aria-label="View current Single"]')?.textContent).toBe('DNF');
  expect(save.mock.calls.flatMap(([solves]) => solves).at(-1)).toMatchObject({ status: 'incomplete', dnfReason: 'inspection', inspection: 17000, duration: 600 });
  expect(generate).toHaveBeenCalledTimes(2);
});

test('manual edits persist, update the displayed result and statistics, and do not create PB notifications', async () => {
  jest.useFakeTimers({ doNotFake: ['performance'] });
  await finishFirst();
  await openHistorySolve();
  await click('Toggle manual +2');
  expect(container.querySelector('[aria-label="Solve time"]')?.textContent).toBe('2.60');
  expect(container.querySelector('[aria-label="View current Single"]')?.textContent).toBe('2.60');
  expect(container.querySelector('[aria-label="Solve history"] tbody tr')?.textContent).toContain('+2');
  await click('Toggle manual DNF');
  expect(container.querySelector('.timer-display .solve-penalty')?.textContent).toBe('DNF');
  const saved = save.mock.calls.flatMap(([solves]) => solves).at(-1)!;
  expect(saved).toMatchObject({ status: 'incomplete', dnfReason: 'manual', penalty: 2000, penaltyReason: 'manual' });
  await showHistory([saved]);
  expect(container.querySelector('[aria-label="View current Single"]')?.textContent).toBe('DNF');
  await openHistorySolve();
  await click('Toggle manual DNF');
  expect(container.querySelector('[aria-label="View current Single"]')?.textContent).toBe('2.60');
  await click('Toggle manual +2');
  expect(container.querySelector('[aria-label="View current Single"]')?.textContent).toBe('0.60');
  const restored = save.mock.calls.flatMap(([solves]) => solves).at(-1)!;
  expect(restored).toMatchObject({ status: 'complete', duration: 600 });
  expect(restored.penalty).toBeUndefined();
  expect(restored.dnfReason).toBeUndefined();
  await act(async () => jest.advanceTimersByTime(1000));
  expect(container.querySelector('[aria-label="Personal best"]')).toBeNull();
});

test('hides scramble moves only during solving, without removing their layout container', async () => {
  await click('Connect cube');
  await act(async () => { move('R', 100); move('U2', 200); });
  const scramble = container.querySelector('.timer-panel > .scramble')!;
  const content = scramble.querySelector('.scramble-content')!;
  expect(content.getAttribute('aria-hidden')).toBe('false');
  await act(async () => move('U', 300));
  expect(scramble.classList.contains('scramble-solving')).toBe(true);
  expect(scramble.querySelector('.scramble-content')).toBe(content);
  expect(content.getAttribute('aria-hidden')).toBe('true');
  expect(content.querySelectorAll('.move')).toHaveLength(2);
  expect(scramble.querySelector('[role="status"]')!.textContent).toBe('Scrambles hidden while solving');
  expect(scramble.querySelector('button')!.textContent).toBe('Abort solve');
  expect(container.querySelector('.timer-details button')).toBeNull();
  await act(async () => { move('U', 400); move("R'", 500); });
  expect(content.getAttribute('aria-hidden')).toBe('false');
  expect(scramble.classList.contains('scramble-solving')).toBe(false);
  expect(scramble.querySelector('.scramble-placeholder')).toBeNull();
});

test('the abort button beside the hidden-scramble message still saves an incomplete attempt', async () => {
  await click('Connect cube');
  await act(async () => { move('R', 100); move('U2', 200); move('U', 300); });
  expect(container.querySelector('.scramble-placeholder button')).not.toBeNull();
  await click('Abort solve');
  expect(container.querySelector('.scramble-placeholder')).toBeNull();
  const solve = save.mock.calls.flatMap(([solves]) => solves).at(-1)!;
  expect(solve.status).toBe('incomplete');
  expect(solve.reason).toBe('Solve aborted by user.');
  expect(solve.moves).toHaveLength(1);
});

test('hiding distracting visuals defaults off, persists, and does not change solve timing or recording', async () => {
  await click('Options');
  const setting = container.querySelector<HTMLInputElement>('input[type="checkbox"][aria-describedby="hide-visuals-help"]')!;
  expect(setting.checked).toBe(false);
  await act(async () => setting.click());
  expect(JSON.parse(localStorage.getItem('timer-hide-distracting-visuals')!)).toEqual({ timer: true, cube: true, progressBar: true });
  await click('Close options');
  await click('Connect cube');
  await act(async () => { move('R', 100); move('U2', 200); });
  expect(container.querySelector('[aria-label="Solve time"]')).not.toBeNull();
  expect(container.querySelector('.timer-panel [role="img"]')).not.toBeNull();
  expect(container.querySelector('[role="status"][aria-label="Solving"]')).toBeNull();
  await act(async () => move('U2', 300));
  const indicator = container.querySelector('[role="status"][aria-label="Solving"]')!;
  expect(indicator.firstElementChild!.textContent).toBe('Solving');
  expect(indicator.querySelector('.solving-dots')!.getAttribute('aria-hidden')).toBe('true');
  expect(container.querySelector('[aria-label="Solve time"]')).toBeNull();
  expect(container.querySelector('.timer-panel [role="img"]')).toBeNull();
  expect(container.querySelector('[aria-label="Solve timeline"]')).toBeNull();
  expect(container.querySelector('.scramble-placeholder button')).not.toBeNull();
  await act(async () => move("R'", 900));
  expect(container.querySelector('[aria-label="Solving"]')).toBeNull();
  expect(container.querySelector('[aria-label="Solve time"]')!.textContent).toBe('0.60');
  expect(container.querySelector('.timer-panel [role="img"]')!.getAttribute('data-facelets')).toBe(SOLVED);
  expect(container.querySelector('[aria-label="View most recent solve"]')).not.toBeNull();
  const solve = save.mock.calls.flatMap(([solves]) => solves).at(-1)!;
  expect(solve.status).toBe('complete');
  expect(solve.duration).toBe(600);
  expect(solve.inspection).toBe(100);
  expect(solve.moves.map(move => move.move)).toEqual(['U2', "R'"]);
  await showHistory([]);
  const restored = container.querySelector<HTMLInputElement>('input[type="checkbox"][aria-describedby="hide-visuals-help"]')!;
  expect(restored.checked).toBe(true);
  await act(async () => restored.click());
  expect(JSON.parse(localStorage.getItem('timer-hide-distracting-visuals')!)).toEqual({ timer: false, cube: false, progressBar: false });
  await showHistory([]);
  expect(container.querySelector<HTMLInputElement>('input[type="checkbox"][aria-describedby="hide-visuals-help"]')!.checked).toBe(false);
});

test.each(['Timer', 'Cube', 'Progress bar'])('the %s submenu toggle hides only that component and remembers a mixed selection', async name => {
  await click('Options');
  const submenu = container.querySelector('#hide-visuals-title')!.closest('details')!;
  expect(submenu.querySelector('#hide-visuals-title')!.textContent).toBe('Hide distracting visuals');
  expect(submenu.querySelector('summary button')).not.toBeNull();
  const setting = Array.from(submenu.querySelectorAll('label')).find(label => label.textContent === name)!.querySelector<HTMLInputElement>('input')!;
  const all = submenu.querySelector<HTMLInputElement>('input[aria-describedby="hide-visuals-help"]')!;
  await act(async () => setting.click());
  expect(all.checked).toBe(false);
  expect(all.indeterminate).toBe(true);
  await showHistory([]);
  const restored = Array.from(container.querySelectorAll('details label')).find(label => label.textContent === name)!.querySelector<HTMLInputElement>('input')!;
  expect(restored.checked).toBe(true);
  await click('Connect cube');
  await act(async () => { move('R', 100); move('U2', 200); });
  expect(container.querySelector('[aria-label="Solve time"]')).not.toBeNull();
  expect(container.querySelector('[aria-label="Live 3x3 cube state"]')).not.toBeNull();
  await act(async () => move('U', 300));
  expect(!!container.querySelector('[aria-label="Solve time"]')).toBe(name !== 'Timer');
  expect(!!container.querySelector('[aria-label="Solving"]')).toBe(name === 'Timer');
  expect(!!container.querySelector('[aria-label="Live 3x3 cube state"]')).toBe(name !== 'Cube');
  expect(!!container.querySelector('[aria-label="Solve timeline"]')).toBe(name !== 'Progress bar');
  await act(async () => restored.click());
  expect(container.querySelector('[aria-label="Solve time"]')).not.toBeNull();
  expect(container.querySelector('[aria-label="Live 3x3 cube state"]')).not.toBeNull();
  expect(container.querySelector('[aria-label="Solve timeline"]')).not.toBeNull();
  const master = container.querySelector<HTMLInputElement>('input[aria-describedby="hide-visuals-help"]')!;
  expect(master.checked).toBe(false);
  expect(master.indeterminate).toBe(false);
});

test.each(['true', 'false', '{"timer":true,"cube":"true","progressBar":false}', '{'])('loads legacy or partial visual preferences safely: %s', async stored => {
  localStorage.setItem('timer-hide-distracting-visuals', stored);
  await showHistory([]);
  const fields = Array.from(container.querySelector('#hide-visuals-title')!.closest('details')!.querySelectorAll<HTMLInputElement>('input'));
  expect(fields.map(field => field.checked)).toEqual(stored === 'true' ? [true, true, true, true] : stored.startsWith('{"') ? [false, true, false, false] : [false, false, false, false]);
  expect(fields[0].indeterminate).toBe(stored.startsWith('{"'));
});

test('hide all can be toggled during a solve, including a mixed selection, and abort restores the visuals', async () => {
  await click('Connect cube');
  await act(async () => { move('R', 100); move('U2', 200); move('U', 300); });
  expect(container.querySelector('[aria-label="Solve time"]')).not.toBeNull();
  expect(container.querySelector('.timer-panel [role="img"]')).not.toBeNull();
  expect(container.querySelector('[aria-label="Solve timeline"]')).not.toBeNull();
  await click('Options');
  const setting = container.querySelector<HTMLInputElement>('input[type="checkbox"][aria-describedby="hide-visuals-help"]')!;
  await act(async () => setting.click());
  expect(container.querySelector('[aria-label="Solving"]')).not.toBeNull();
  const cubeSetting = Array.from(container.querySelectorAll('details label')).find(label => label.textContent === 'Cube')!.querySelector<HTMLInputElement>('input')!;
  await act(async () => cubeSetting.click());
  expect(setting.indeterminate).toBe(true);
  expect(container.querySelector('[aria-label="Solve time"]')).toBeNull();
  expect(container.querySelector('.timer-panel [role="img"]')).not.toBeNull();
  expect(container.querySelector('[aria-label="Solve timeline"]')).toBeNull();
  await act(async () => setting.click());
  expect(setting.checked).toBe(true);
  expect(setting.indeterminate).toBe(false);
  expect(container.querySelector('.timer-panel [role="img"]')).toBeNull();
  await act(async () => setting.click());
  expect(container.querySelector('[aria-label="Solving"]')).toBeNull();
  expect(container.querySelector('[aria-label="Solve time"]')).not.toBeNull();
  expect(container.querySelector('.timer-panel [role="img"]')).not.toBeNull();
  expect(container.querySelector('[aria-label="Solve timeline"]')).not.toBeNull();
  await act(async () => setting.click());
  await click('Close options');
  await click('Abort solve');
  expect(container.querySelector('[aria-label="Solving"]')).toBeNull();
  expect(container.querySelector('[aria-label="Solve time"]')).not.toBeNull();
  expect(container.querySelector('.timer-panel [role="img"]')).not.toBeNull();
  expect(container.querySelector('[aria-label="View most recent solve"]')).not.toBeNull();
  expect(save.mock.calls.flatMap(([solves]) => solves).at(-1)?.status).toBe('incomplete');
});

test('blocked preference storage defaults visual hiding off but still permits changing it', async () => {
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Storage blocked'); });
  await showHistory([]);
  await click('Options');
  const setting = container.querySelector<HTMLInputElement>('input[type="checkbox"][aria-describedby="hide-visuals-help"]')!;
  expect(setting.checked).toBe(false);
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage blocked'); });
  await act(async () => setting.click());
  expect(setting.checked).toBe(true);
  expect(container.querySelector('dialog [role="alert"]')!.textContent).toContain('could not save the preference');
  await click('Close options');
  await click('Connect cube');
  await act(async () => { move('R', 100); move('U2', 200); move('U', 300); });
  expect(container.querySelector('[aria-label="Solving"]')).not.toBeNull();
  expect(container.querySelector('[aria-label="Solve time"]')).toBeNull();
});

test('options change timer and CFOP precision immediately and remember the preference', async () => {
  await finishFirst();
  const dialog = container.querySelector<HTMLDialogElement>('dialog[aria-labelledby="options-title"]')!;
  expect(dialog.open).toBe(false);
  expect(container.querySelector('header select[aria-label="My cube"]')).toBeNull();
  expect(container.querySelector('dialog[aria-labelledby="cube-setup-title"] select[aria-label="My cube"]')).not.toBeNull();
  expect(container.querySelector('header select[aria-label="Session"]')).toBeNull();
  expect(container.textContent).not.toContain('Saved locally');
  expect(container.querySelectorAll('select[aria-label="Session"]')).toHaveLength(1);
  expect(dialog.querySelector<HTMLSelectElement>('select[aria-label="Session"]')?.value).toBe('Default');
  await openSiteOptions();
  expect(dialog.querySelectorAll('select')).toHaveLength(1);
  const precision = container.querySelector<HTMLSelectElement>('select[aria-label="Time precision"]')!;
  expect(precision.value).toBe('2');
  await act(async () => { precision.value = '3'; precision.dispatchEvent(new Event('change', { bubbles: true })); });
  expect(container.querySelector('[aria-label="Solve time"]')?.textContent).toBe('0.600');
  expect(container.querySelector('.trail-duration[data-step="6"]')?.textContent).toBe('PLL 0.600s');
  expect(container.querySelector('[aria-label="Inspection time"]')).toBeNull();
  expect(localStorage.getItem('timer-time-precision')).toBe('3');
  await openSiteOptions();
  expect(precision.value).toBe('3');
  await act(async () => { precision.value = '2'; precision.dispatchEvent(new Event('change', { bubbles: true })); });
  expect(container.querySelector('[aria-label="Solve time"]')?.textContent).toBe('0.60');
  expect(localStorage.getItem('timer-time-precision')).toBe('2');
  expect(save.mock.calls.flatMap(([solves]) => solves).at(-1)?.duration).toBe(600);
});

test('all-time summary shows current and best singles plus all four average sizes', async () => {
  await finishFirst();
  const records = container.querySelector('[aria-label="All-time statistics"]')!.closest('section')!;
  const history = container.querySelector('[aria-label="Solve history"]')!.closest('section')!;
  expect(records).not.toBe(history);
  expect(records.querySelector('h2')).toBeNull();
  expect(container.querySelector('.timer-toolbar .session-picker')).toBeNull();
  expect(Array.from(history.querySelectorAll('thead th')).map(cell => cell.textContent)).toEqual(['Solve', 'Time', 'Turns', 'TPS', 'Date']);
  expect(history.querySelectorAll('tbody tr:first-child td')).toHaveLength(5);
  expect(history.querySelector('tbody button')?.getAttribute('aria-label')).toMatch(/^Solve \d+: open replay$/);
  expect(history.querySelector('input[type="file"]')).not.toBeNull();
  expect(history.querySelector('input[type="file"]')!.closest('label')!.hidden).toBe(true);
  expect(Array.from(history.querySelectorAll('button')).find(button => button.textContent === 'Export JSON')!.hidden).toBe(true);
  expect(records.querySelector('input[type="file"]')).toBeNull();
  const rows = Array.from(container.querySelectorAll('[aria-label="All-time statistics"] tbody tr'));
  expect(rows.map(row => row.querySelector('th')!.textContent)).toEqual(['Single', 'Ao5', 'Ao12', 'Ao100', 'Ao1000']);
  expect(Array.from(rows[0].querySelectorAll('td')).map(cell => cell.textContent)).toEqual(['0.60', '0.60']);
  expect(rows.slice(1).every(row => Array.from(row.querySelectorAll('td')).every(cell => cell.textContent === '--'))).toBe(true);
});
test('current Single and rolling averages compare with the preceding solve and do not mark best values', async () => {
  await showHistory([1000, 2000, 3000, 4000, 5000, 1000].map((time, index) => historySolve(index + 1, time, 0)).reverse());
  const records = container.querySelector('[aria-label="All-time statistics"]')!;
  expect(records.querySelector('tbody tr:first-child td:first-of-type .metric-trend')!.getAttribute('aria-label')).toBe('Faster than previous');
  expect(records.querySelector('tbody tr:nth-child(2) td:first-of-type .metric-trend')!.getAttribute('aria-label')).toBe('Equal to previous');
  expect(records.querySelector('tbody tr:nth-child(3) .metric-trend')).toBeNull();
  expect(records.querySelector('td:last-child .metric-trend')).toBeNull();
  for (const indicator of records.querySelectorAll('.metric-trend')) {
    expect(indicator.tagName).toBe('svg');
    expect(indicator.getAttribute('role')).toBe('img');
    expect(indicator.querySelector('path')).not.toBeNull();
  }
  await showHistory([historySolve(2, 2000, 0), historySolve(1, 1000, 0)]);
  expect(container.querySelector('.metric-trend--slower')!.getAttribute('aria-label')).toBe('Slower than previous');
  await showHistory([historySolve(2, 1000, 0, 'Default', 'incomplete'), historySolve(1, 1000, 0)]);
  expect(container.querySelector('.metric-trend--slower')).not.toBeNull();
});

test('recent solves share the summary row, show the latest five session solves newest first, and open replay', async () => {
  const solves = Array.from({ length: 6 }, (_, index) => historySolve(index + 1, (index + 1) * 1000, 0));
  solves[4].penalty = 2000;
  solves[5].status = 'incomplete';
  await showHistory([historySolve(8, 8000, 0, 'Other'), ...solves, historySolve(9, 9000, 0, 'Default', 'active')]);
  const recent = container.querySelector('.timer-recent')!;
  expect(recent.parentElement).toBe(container.querySelector('.timer-records')!.parentElement);
  expect(recent.parentElement!.classList.contains('timer-summary')).toBe(true);
  const buttons = Array.from(recent.querySelectorAll('button'));
  expect(buttons.map(button => button.textContent)).toEqual(['DNF', '7.00', '4.00', '3.00', '2.00']);
  await act(async () => buttons[0].click());
  expect(container.querySelector('[aria-label="Solve replay"]')!.getAttribute('data-solve-id')).toBe('6');
  await click('Close');
  await act(async () => buttons[4].click());
  expect(container.querySelector('[aria-label="Solve replay"]')!.getAttribute('data-solve-id')).toBe('2');
});

test('Timer limits to the latest 10,000 session solves without losing numbering, saved data, or larger scopes', async () => {
  await showHistory(Array.from({ length: 10005 }, (_, i) => historySolve(i + 1, 12000 + i, 0)).reverse());
  expect(statistics.mock.calls.at(-1)![0]).toHaveLength(10005);
  expect(historyNumbers().slice(0, 2)).toEqual([10005, 10004]);
  expect(container.querySelector('.solve-limit')).toBeNull();
  await openSiteOptions();
  const limit = container.querySelector<HTMLSelectElement>('.solve-limit select')!;
  expect(limit.value).toBe('10000');
  expect(recovered).toHaveLength(10005);
  expect(container.querySelectorAll('.recent-times button')).toHaveLength(5);
  await act(async () => { limit.value = '25000'; limit.dispatchEvent(new Event('change', { bubbles: true })); });
  expect(statistics.mock.calls.at(-1)![0]).toHaveLength(10005);
  expect(localStorage.getItem('recent-solve-limit')).toBe('25000');
  await click('Solve');
  expect(historyNumbers().slice(0, 2)).toEqual([1, 2]);
  const recent = container.querySelector<HTMLButtonElement>('.recent-times button')!;
  await act(async () => recent.click());
  expect(container.querySelector('[aria-label="Solve replay"]')!.getAttribute('data-solve-id')).toBe('10005');
});

test('records follow the shared session, ignore the recent limit, and show all sessions only from site Options', async () => {
  localStorage.setItem('recent-solve-limit', '1000');
  const old = Array.from({ length: 1000 }, (_, i) => historySolve(i + 1, 1000, 4, 'Earlier'));
  const recent = Array.from({ length: 1000 }, (_, i) => historySolve(i + 1001, 20000, 4));
  countTurns.mockClear();
  await showHistory([...old, ...recent].reverse());
  expect(countTurns.mock.calls.length).toBeLessThan(500);
  expect(historyNumbers().slice(0, 2)).toEqual([1000, 999]);
  expect(statistics.mock.calls.at(-1)![0]).toHaveLength(1000);
  expect(container.querySelector('[aria-label="View best Single"]')?.textContent).toBe('20.00');
  await chooseSession('Earlier');
  expect(container.querySelector('[aria-label="View best Single"]')?.textContent).toBe('1.00');
  expect(container.querySelector('[aria-label="View current Single"]')?.textContent).toBe('1.00');
  await openSiteOptions();
  expect(container.querySelector('#options-title')!.closest('dialog')!.textContent).not.toContain('Show all sessions');
  await act(async () => container.querySelector<HTMLInputElement>('#all-sessions')!.click());
  expect(statistics.mock.calls.at(-1)![0]).toHaveLength(2000);
  for (const name of ['Single', 'Ao5', 'Ao12', 'Ao100', 'Ao1000']) {
    expect(container.querySelector(`[aria-label="View best ${name}"]`)?.textContent).toBe('1.00');
    expect(container.querySelector(`[aria-label="View current ${name}"]`)?.textContent).toBe('20.00');
  }
  await click('View best Single');
  expect(container.querySelector('[aria-label="Solve replay"]')!.getAttribute('data-session')).toBe('Earlier');
  await click('Close');
  await click('View best Ao1000');
  expect(container.querySelector('.average-dialog h2')?.textContent).toBe('Ao1000: 1.00s');
  expect(container.querySelectorAll('[aria-label="Average solves"] tbody tr')).toHaveLength(1000);
  await click('Close average');
  const calls = statistics.mock.calls.length;
  await openSiteOptions();
  const limit = container.querySelector<HTMLSelectElement>('.solve-limit select')!;
  await act(async () => { limit.value = '0'; limit.dispatchEvent(new Event('change', { bubbles: true })); });
  expect(statistics.mock.calls).toHaveLength(calls);
  expect(container.querySelector('[aria-label="View best Ao1000"]')?.textContent).toBe('1.00');
});

test('a blocked preference save does not prevent switching display precision', async () => {
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Storage blocked'); });
  await openSiteOptions();
  const precision = container.querySelector<HTMLSelectElement>('select[aria-label="Time precision"]')!;
  await act(async () => { precision.value = '3'; precision.dispatchEvent(new Event('change', { bubbles: true })); });
  expect(container.querySelector('[aria-label="Solve time"]')?.textContent).toBe('0.000');
  expect(container.querySelector('[role="alert"]')?.textContent).toContain('could not save');
});

test('automatically advances, preserves the last time, and replays buffered moves with their original host timing', async () => {
  await enableExtraTurnPenalty();
  await finishFirst();
  expect(container.querySelector('.timer-panel [role="img"]')).not.toBeNull();
  expect(container.textContent).not.toContain('Next scramble');
  await act(async () => {
    emit({ type: 'FACELETS', timestamp: 1000, facelets: SOLVED });
    move('F', 1100); move('L2', 1200); move('L', 1300); move('L', 1400); move("F'", 1500);
  });
  expect(container.querySelector('[aria-label="Solve time"]')?.textContent).toBe('2.60');
  await act(async () => resolveNext('F L2'));
  const completed = save.mock.calls.flatMap(([solves]) => solves).filter(solve => solve.status === 'complete');
  expect(completed).toHaveLength(3);
  expect(completed[1]).toMatchObject({ duration: 600, penalty: 2000, scramble: 'R U2' });
  expect(completed[2]).toMatchObject({ duration: 200, scramble: 'F L2', status: 'complete' });
  expect(completed[2].moves.map(turn => [turn.move, turn.hostTime, turn.elapsed])).toEqual([
    ['L', 1300, 0], ['L', 1400, 100], ["F'", 1500, 200],
  ]);
  expect(container.querySelector('[aria-label="Solve time"]')?.textContent).toBe('0.20');
  expect(generate).toHaveBeenCalledTimes(3);
});

test('disconnect cancels pending advancement and discards buffered events', async () => {
  await enableExtraTurnPenalty();
  await finishFirst();
  await act(async () => move('F', 1000));
  await click('Disconnect');
  await act(async () => resolveNext('F L2'));
  expect(container.querySelector('[role="status"]')?.textContent).toContain('Cube disconnected');
  expect(container.querySelector('[aria-label="Scramble"]')?.textContent).toContain('R');
  expect(container.querySelector('[role="img"]')?.getAttribute('data-facelets')).toBe(SOLVED);
  expect(save.mock.calls.flatMap(([solves]) => solves).filter(solve => solve.status === 'complete')).toHaveLength(2);
});

test.each([100, 500, 501])('an extra turn after %s ms updates the timer and history immediately, even during preparation', async delay => {
  await enableExtraTurnPenalty();
  await finishFirst();
  await act(async () => move('F', 900 + delay));
  const penalty = delay <= 500;
  expect(container.querySelector('[aria-label="Solve time"]')?.textContent).toBe(penalty ? '2.60' : '0.60');
  const badge = container.querySelector('.timer-display .solve-penalty');
  expect(badge?.textContent ?? null).toBe(penalty ? '+2' : null);
  if (penalty) expect(badge?.classList.contains('text-bg-warning')).toBe(true);
  const row = container.querySelector('[aria-label="Solve history"] tbody tr')!;
  expect(row.children[1].textContent?.trim()).toBe(penalty ? '2.60s +2' : '0.60s');
  const saved = save.mock.calls.at(-1)![0][0];
  expect(saved.duration).toBe(600);
  expect(saved.moves.map(turn => turn.move)).toEqual(['U2', "R'"]);
  expect(saved.penalty).toBe(penalty ? 2000 : undefined);
  expect(saved.penaltyReason).toBe(penalty ? 'over-turn' : undefined);
  expect(container.querySelector('.timer-panel')?.textContent).not.toContain('over-turn');
  await act(async () => resolveNext('F L2'));
  expect(container.querySelector('[aria-label="Solve time"]')?.textContent).toBe(penalty ? '2.60' : '0.60');
});

test.each(['Abort solve', 'Disconnect', 'snapshot mismatch'])('%s displays red DNF badges beside the timer and history time', async action => {
  await click('Connect cube');
  await act(async () => { move('R', 100); move('U2', 200); move('U', 300); });
  if (action === 'snapshot mismatch') await act(async () => emit({ type: 'FACELETS', timestamp: 400, facelets: SOLVED }));
  else await click(action);
  const badges = container.querySelectorAll('.solve-penalty');
  expect(badges).toHaveLength(2);
  badges.forEach(badge => {
    expect(badge.textContent).toBe('DNF');
    expect(badge.classList.contains('text-bg-danger')).toBe(true);
  });
  expect(container.querySelector('.timer-value + .solve-penalty')).not.toBeNull();
  expect(save.mock.calls.at(-1)![0][0].status).toBe('incomplete');
  expect(save.mock.calls.at(-1)![0][0].dnfReason).toBe(action === 'Abort solve' ? 'solve aborted' : 'solve interrupted');
  expect(container.querySelector('.timer-panel')?.textContent).not.toContain('Solve aborted by user.');
  expect(container.querySelector('[aria-label="Solve history"]')?.textContent).not.toMatch(/solve aborted|solve interrupted/);
});

test('extra-turn penalties default disabled, apply no penalty, and remember a disabled preference', async () => {
  await finishFirst();
  await click('Options');
  const setting = container.querySelector<HTMLInputElement>('input[aria-describedby="over-turn-penalty-help"]')!;
  expect(setting.checked).toBe(false);
  await act(async () => move('F', 1000));
  expect(save.mock.calls.at(-1)![0][0].penalty).toBeUndefined();
  await act(async () => setting.click());
  await act(async () => setting.click());
  expect(localStorage.getItem('timer-over-turn-penalty')).toBe('false');
  expect(container.querySelector('.timer-display .solve-penalty')).toBeNull();
  expect(save.mock.calls.at(-1)![0][0].penalty).toBeUndefined();
  await act(async () => resolveNext('F L2'));
  await showHistory([]);
  expect(container.querySelector<HTMLInputElement>('input[aria-describedby="over-turn-penalty-help"]')!.checked).toBe(false);
  await click('Connect cube');
  await act(async () => { move('B', 2000); move('R2', 2100); move('R2', 2200); move("B'", 2300); });
  await act(async () => move('F', 2400));
  expect(save.mock.calls.at(-1)![0][0].penalty).toBeUndefined();
});

test('a stored disabled penalty preference can be enabled again without changing older solves', async () => {
  localStorage.setItem('timer-over-turn-penalty', 'false');
  await showHistory([]);
  await click('Options');
  const setting = container.querySelector<HTMLInputElement>('input[aria-describedby="over-turn-penalty-help"]')!;
  expect(setting.checked).toBe(false);
  await act(async () => setting.click());
  expect(localStorage.getItem('timer-over-turn-penalty')).toBe('true');
  await finishFirst();
  await act(async () => move('F', 1000));
  expect(save.mock.calls.at(-1)![0][0]).toMatchObject({ penalty: 2000, penaltyReason: 'over-turn' });
});

test('a stored enabled penalty preference is preserved despite the disabled default', async () => {
  localStorage.setItem('timer-over-turn-penalty', 'true');
  await showHistory([]);
  await click('Options');
  expect(container.querySelector<HTMLInputElement>('input[aria-describedby="over-turn-penalty-help"]')!.checked).toBe(true);
  await finishFirst();
  await act(async () => move('F', 1000));
  expect(save.mock.calls.at(-1)![0][0]).toMatchObject({ penalty: 2000, penaltyReason: 'over-turn' });
});

test('blocked preference storage defaults penalties off and still permits enabling them', async () => {
  jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Blocked'); });
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Blocked'); });
  await showHistory([]);
  await finishFirst();
  await click('Options');
  const setting = container.querySelector<HTMLInputElement>('input[aria-describedby="over-turn-penalty-help"]')!;
  expect(setting.checked).toBe(false);
  await act(async () => setting.click());
  expect(container.querySelector('.options-dialog')?.textContent).toContain('Penalty preference changed');
  await act(async () => move('F', 1000));
  expect(save.mock.calls.at(-1)![0][0]).toMatchObject({ penalty: 2000, penaltyReason: 'over-turn' });
});

test('restored history sorts by penalized totals and displays DNF instead of +2 for invalid attempts', async () => {
  await showHistory([
    { ...historySolve(1, 3000, 3), penalty: 2000 },
    historySolve(2, 4000, 4),
    { ...historySolve(3, 6000, 3, 'Default', 'incomplete'), penalty: 2000 },
  ]);
  await click('Time');
  expect(historyNumbers()).toEqual([2, 1, 3]);
  const cells = Array.from(container.querySelectorAll('[aria-label="Solve history"] tbody tr')).map(row => row.children[1].textContent?.trim());
  expect(cells).toEqual(['4.00s', '5.00s +2', '6.00s DNF']);
});

test.each([
  ['guided', ['U', "R'"]],
  ['alternative', ['U2', "U'", "R'"]],
] as const)('an aborted solve shows recovery guidance and generates a scramble after %s recovery', async (_name, recovery) => {
  await click('Connect cube');
  await act(async () => { move('R', 100); move('U2', 200); move('U', 300); });
  await click('Abort solve');
  expect(generate).toHaveBeenCalledTimes(1);
  expect(container.querySelector('.timer-panel')?.textContent).toContain('Return the cube to solved');
  expect(Array.from(container.querySelectorAll('.scramble-content .move')).map(move => move.textContent)).toEqual(['U', "R'"]);
  expect(container.querySelector<HTMLButtonElement>('[aria-label="New scramble"]')?.disabled).toBe(true);
  const dnf = structuredClone(save.mock.calls.at(-1)![0][0]);
  const writes = save.mock.calls.length;
  for (let i = 0; i < recovery.length; i++) await act(async () => move(recovery[i], 400 + i * 100));
  expect(generate).toHaveBeenCalledTimes(2);
  expect(save.mock.calls).toHaveLength(writes);
  expect(save.mock.calls.at(-1)![0][0]).toEqual(dnf);
  await act(async () => resolveNext('F L2'));
  expect(container.querySelector('.timer-panel')?.textContent).not.toContain('Return the cube to solved');
  expect(Array.from(container.querySelectorAll('.scramble-content .move')).map(move => move.textContent)).toEqual(['F', 'L2']);
  expect(container.querySelector('.timer-display .solve-penalty')?.textContent).toBe('DNF');
  await act(async () => { move('F', 1000); move('L2', 1100); move('L2', 1200); move("F'", 1400); });
  expect(save.mock.calls.at(-1)![0][0]).toMatchObject({ status: 'complete', duration: 200, inspection: 100 });
  expect(save.mock.calls.at(-1)![0][0].id).not.toBe(dnf.id);
});

test('a solved authoritative snapshot during recovery starts a new scramble without modifying the DNF', async () => {
  await click('Connect cube');
  await act(async () => { move('R', 100); move('U2', 200); move('U', 300); });
  await click('Abort solve');
  const writes = save.mock.calls.length;
  physicalFacelets = SOLVED;
  await act(async () => emit({ type: 'FACELETS', timestamp: 500, facelets: SOLVED }));
  expect(generate).toHaveBeenCalledTimes(2);
  expect(save.mock.calls).toHaveLength(writes);
  await act(async () => resolveNext('F L2'));
  expect(container.querySelector('.scramble-content')?.textContent).toBe('FL2');
});

test('a move gap reads the actual cube state before offering DNF recovery', async () => {
  await click('Connect cube');
  await act(async () => { move('R', 100, 1); move('U2', 200, 2); move('U', 300, 3); });
  jest.mocked(cube.solution).mockResolvedValueOnce(["F'", 'U', "R'"]);
  await act(async () => move('F', 400, 5));
  expect(cube.solution).toHaveBeenLastCalledWith(physicalFacelets);
  expect(Array.from(container.querySelectorAll('.scramble-content .move')).map(move => move.textContent)).toEqual(["F'", 'U', "R'"]);
  const dnf = save.mock.calls.at(-1)![0][0];
  expect(dnf).toMatchObject({ status: 'incomplete', dnfReason: 'solve interrupted' });
  expect(dnf.moves.map(turn => turn.move)).toEqual(['U']);
  await act(async () => { move("F'", 500, 6); move('U', 600, 7); move("R'", 700, 8); });
  expect(generate).toHaveBeenCalledTimes(2);
  await act(async () => resolveNext('F L2'));
  expect(container.querySelector('.scramble-content')?.textContent).toBe('FL2');
});

test('scramble generation failure is recoverable and does not turn the previous solve into a DNF', async () => {
  await finishFirst();
  await act(async () => rejectNext(new Error('Worker failed.')));
  expect(container.querySelector('[role="alert"]')?.textContent).toContain('Worker failed.');
  expect(container.querySelector('[role="status"]')?.textContent).toContain('Read the cube state to retry');
  expect(container.querySelector('[aria-label="Solve time"]')?.textContent).toBe('0.60');
  expect(save.mock.calls.flatMap(([solves]) => solves).filter(solve => solve.status === 'incomplete')).toHaveLength(0);
  const retry = Array.from(container.querySelectorAll('button')).find(button => button.textContent === 'Read cube state');
  expect(retry?.disabled).toBe(false);
});
