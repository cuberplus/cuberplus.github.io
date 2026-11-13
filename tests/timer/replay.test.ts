/** @jest-environment jsdom */
import { jest } from '@jest/globals';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { deserialize, serialize } from 'node:v8';
import { IDBFactory } from 'fake-indexeddb';
import { readSolves, saveSolves } from '../../timer/src/Data/storage';
import type { Solve } from '../../timer/src/Core/engine';
import { inverse, loadCube } from '../../timer/src/Core/puzzle';
import { analyzeCFOP, cfopFrame, CFOP_STEPS } from '../../timer/src/Analysis/cfop';
import { algorithms } from '../../src/database/algorithms';
import { favoriteId, FAVORITES_KEY, MISTAKES_KEY, CATEGORIES_KEY, UNLEARN_KEY } from '../../src/database/favorites';
import { waitFor } from '@testing-library/react';
await jest.unstable_mockModule('../../timer/src/Bluetooth/bluetooth', () => ({ BluetoothCube: class {} }));
const { cubeConnection } = await import('../../shared/cube/connection');
await jest.unstable_mockModule('../../timer/src/Components/CubeView', () => ({
  CubeView: ({ facelets, cross, rotation, seekVersion, playback }: { facelets: string; cross: number | null; rotation: string; seekVersion: number; playback: boolean }) => createElement('div', { 'data-facelets': facelets, 'data-cross': cross, 'data-rotation': rotation, 'data-seek-version': seekVersion, 'data-playback': playback, 'aria-label': 'Replay cube' }),
}));
const { Replay } = await import('../../timer/src/Components/Replay');
const { SolveMistakes } = await import('../../timer/src/Components/SolveMistakes');
const { importSolveCSVs } = await import('../../timer/src/Data/csvImport');
const cube = await loadCube();
const pll = "R U R' U' R' F R2 U' R' U' R U R' F'", oll = "R U R' U R U2 R'";
const scramble = `${pll} ${oll} R U R' F U F' L U L' B U B' D`;
let root: Root, container: HTMLDivElement;
const close = jest.fn();
beforeEach(() => {
  localStorage.clear();
  jest.spyOn(window, 'confirm').mockReturnValue(true);
  Object.defineProperty(globalThis, 'indexedDB', { configurable: true, value: new IDBFactory() });
  Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { configurable: true, value: true });
  Object.defineProperty(globalThis, 'structuredClone', { configurable: true, value: <T>(value: T): T => deserialize(serialize(value)) as T });
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function (this: HTMLDialogElement) { this.open = true; } });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: function (this: HTMLDialogElement) { this.open = false; } });
  close.mockClear();
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
});

test('non-favorite feedback contributes to total time gain and reacts to favorites and group settings', async () => {
  const entry = algorithms.find(entry => entry.category === 'PLL' && entry.id === 'T')!;
  const solution = `U U' ${entry.options[1]}`;
  const solve = recording(solution.split(' ').reverse().map(inverse).join(' '), solution);
  const favorite = favoriteId(entry, entry.algorithm);
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([favorite]));
  await draw(solve);
  const feedback = () => container.querySelector('[aria-label="Solve mistakes"]')!;
  expect(feedback().textContent).not.toContain('Non-favorite algorithm');
  async function preference(key: string, value: string) {
    localStorage.setItem(key, value);
    await act(async () => window.dispatchEvent(new StorageEvent('storage', { key })));
    await feedbackReady();
  }
  await preference(MISTAKES_KEY, 'true');
  expect(feedback().querySelector('p')!.textContent).toContain('Potential time gain:');
  expect(feedback().querySelector('p')!.textContent).not.toContain('Non-favorite algorithm');
  expect(feedback().querySelector('li')!.textContent).toContain('Non-favorite algorithm');
  expect(feedback().textContent).toContain('Single-move undo');
  await preference(CATEGORIES_KEY, JSON.stringify({ F2L: true, OLL: true, PLL: false }));
  expect(feedback().textContent).not.toContain('Non-favorite algorithm');
  await preference(CATEGORIES_KEY, JSON.stringify({ F2L: true, OLL: true, PLL: true }));
  expect(feedback().textContent).toContain('Non-favorite algorithm');
  await preference(FAVORITES_KEY, JSON.stringify([favorite, favoriteId(entry, entry.options[1])]));
  expect(feedback().textContent).not.toContain('Non-favorite algorithm');
  expect(feedback().textContent).toContain('Single-move undo');
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); jest.useRealTimers(); jest.restoreAllMocks(); });
test('unlearned algorithm feedback appears with non-favorite tracking turned off', async () => {
  const entry = algorithms.find(entry => entry.category === 'PLL' && entry.id === 'T')!;
  localStorage.setItem(UNLEARN_KEY, JSON.stringify([favoriteId(entry, entry.algorithm)]));
  const solution = entry.algorithm, solve = recording(solution.split(' ').reverse().map(inverse).join(' '), solution);
  await draw(solve);
  expect(container.querySelector('[aria-label="Solve mistakes"] p')!.textContent).toContain('Potential time gain:');
  expect(container.querySelector('[aria-label="Solve mistakes"] li')!.textContent).toContain('PLL: Unlearn algorithm (PLL T)');
  localStorage.setItem(UNLEARN_KEY, '[]');
  await act(async () => window.dispatchEvent(new StorageEvent('storage', { key: UNLEARN_KEY })));
  await feedbackReady();
  expect(container.querySelector('[aria-label="Solve mistakes"]')!.textContent).not.toContain('Unlearn algorithm');
});
test('a mistake opens an in-place case practice dialog and releases timer ownership on close', async () => {
  const entry = algorithms.find(entry => entry.category === 'PLL' && entry.id === 'T')!;
  localStorage.setItem(UNLEARN_KEY, JSON.stringify([favoriteId(entry, entry.algorithm)]));
  await draw(recording(entry.algorithm.split(' ').reverse().map(inverse).join(' '), entry.algorithm));
  const address = location.href;
  const button = Array.from(container.querySelectorAll<HTMLButtonElement>('[aria-label="Solve mistakes"] button')).find(button => button.textContent?.includes('Unlearn algorithm'))!;
  await act(async () => button.click());
  const dialog = container.querySelector<HTMLDialogElement>('.mistake-practice-dialog')!;
  expect(dialog.open).toBe(true);
  expect(dialog.querySelector('.trainer-practice')!.getAttribute('data-case')).toBe('PLL-T');
  expect(dialog.textContent).toContain('PLL T drill');
  expect(dialog.querySelector('fieldset')!.hidden).toBe(true);
  expect(dialog.querySelector('[aria-label="Back to cases"]')).toBeNull();
  expect(location.href).toBe(address);
  expect(cubeConnection.getSnapshot().practicing).toBe(true);
  await act(async () => dialog.dispatchEvent(new Event('close')));
  expect(container.querySelector('.mistake-practice-dialog')).toBeNull();
  expect(cubeConnection.getSnapshot().practicing).toBe(false);
});
test('feedback yields before analysis and handles invalid recordings without an unhandled rejection', async () => {
  jest.useFakeTimers();
  const solve = { ...recording('R', "R'"), startFacelets: 'invalid' };
  await act(async () => root.render(createElement(SolveMistakes, { cube, solve })));
  expect(container.textContent).toContain('Analyzing solve mistakes');
  await act(async () => jest.advanceTimersByTimeAsync(1));
  expect(container.textContent).toContain('Solve mistakes could not be assessed.');
});

function recording(scramble: string, solution: string, status: Solve['status'] = 'complete'): Solve {
  const moves = solution.split(/\s+/).filter(Boolean).map((move, index) => ({
    move, elapsed: index * 100, hostTime: index * 100, localTimestamp: index * 100, cubeTimestamp: null,
  }));
  return {
    version: 1, id: 'replay-fixture', session: 'Test', createdAt: new Date().toISOString(), device: 'Test',
    scramble, startFacelets: cube.facelets(cube.solved().applyAlg(scramble)), duration: moves.at(-1)?.elapsed ?? 0,
    status, reason: '', timingBasis: 'host', moves,
  };
}
async function draw(solve: Solve, change?: (solve: Solve) => void) {
  await act(async () => root.render(createElement(Replay, { cube, solve, close, change, precision: 3 })));
  await feedbackReady();
}
async function feedbackReady() {
  await waitFor(() => expect(container.querySelector('[aria-label="Solve mistakes"]')?.textContent).not.toContain('Analyzing solve mistakes'));
}
async function click(text: string) {
  const button = Array.from(container.querySelectorAll('button')).find(button => button.textContent === text || button.getAttribute('aria-label') === (text === 'Close' ? 'Close replay' : text))!;
  expect(button.disabled).toBe(false);
  await act(async () => button.click());
}
const groups = () => Array.from(container.querySelectorAll('[aria-label="Solution steps"] > [role="group"]'));
const position = () => container.querySelector('[aria-label="Replay move"]')!.getAttribute('aria-valuenow');
const facelets = () => container.querySelector('[aria-label="Replay cube"]')!.getAttribute('data-facelets');

test('manual penalties are reversible, preserve automatic reasons, and do not change the raw timeline', async () => {
  let solve: Solve = { ...recording('R U', "U' R'"), penalty: 4000, penaltyReason: 'inspection, over-turn' };
  const original = structuredClone(solve);
  const change = (updated: Solve) => { solve = updated; };
  await draw(solve, change);
  const manual = () => container.querySelectorAll<HTMLButtonElement>('[aria-label="Solve penalties and deletion"] button[aria-pressed]');
  expect(manual()[0].getAttribute('aria-pressed')).toBe('false');
  await act(async () => manual()[0].click());
  expect(solve).toMatchObject({ penalty: 6000, penaltyReason: 'inspection, over-turn, manual' });
  await draw(solve, change);
  expect(manual()[0].getAttribute('aria-pressed')).toBe('true');
  expect(container.querySelector('[aria-label="Penalty reason"]')?.textContent).toBe('+6 reasons: inspection, over-turn, manual');
  await act(async () => manual()[1].click());
  expect(solve).toMatchObject({ status: 'incomplete', dnfReason: 'manual' });
  await draw(solve, change);
  expect(container.querySelector('[aria-label="Penalty reason"]')?.textContent).toBe('DNF reason: manual');
  expect(container.querySelector('[aria-label="PLL solution"]')?.textContent).not.toContain('Not reached');
  await act(async () => manual()[1].click());
  await draw(solve, change);
  await act(async () => manual()[0].click());
  expect(solve).toMatchObject(original);
  expect(solve.dnfReason).toBeUndefined();
  const modal = container.querySelector('dialog')!, mistakes = modal.querySelector('[aria-label="Solve mistakes"]')!;
  const rerun = Array.from(modal.querySelectorAll('button')).find(button => button.textContent === 'Re-run analysis')!;
  expect(mistakes.compareDocumentPosition(rerun) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(modal.lastElementChild!.querySelector('[aria-label="Solve ID"]')).not.toBeNull();
});

test.each(['inspection', 'solve interrupted', 'solve aborted'] as const)('manual controls cannot erase an automatic %s DNF', async dnfReason => {
  const change = jest.fn<(solve: Solve) => void>();
  await draw({ ...recording('R U', "U'", 'incomplete'), dnfReason }, change);
  expect(Array.from(container.querySelectorAll<HTMLButtonElement>('[aria-label="Solve penalties and deletion"] button[aria-pressed]')).every(button => button.disabled)).toBe(true);
  expect(change).not.toHaveBeenCalled();
});

test('Analyzer read-only replay has no manual edit controls', async () => {
  await draw(recording('R', "R'"));
  expect(container.querySelector('[aria-pressed]')).toBeNull();
  expect(container.querySelector<HTMLAnchorElement>('a')!.getAttribute('href')).toBe('/timer/?retry=replay-fixture');
});

test('retry closes replay and passes the original solve without modifying its recording', async () => {
  const solve = recording('R U', "U' R'");
  const original = structuredClone(solve), retry = jest.fn<(solve: Solve) => void>();
  await act(async () => root.render(createElement(Replay, { cube, solve, close, retry, retryDisabled: true })));
  const button = Array.from(container.querySelectorAll('button')).find(button => button.textContent === 'Retry')!;
  expect(button.disabled).toBe(true);
  await act(async () => button.click());
  expect(retry).not.toHaveBeenCalled();
  await act(async () => root.render(createElement(Replay, { cube, solve, close, retry })));
  await click('Retry');
  expect(retry).toHaveBeenCalledWith(solve);
  expect(close).toHaveBeenCalledTimes(1);
  expect(container.querySelector('dialog')!.open).toBe(false);
  expect({ ...solve, analysis: undefined, cfop: undefined }).toEqual(original);
});

test('opens replay as a modal and closes with its button or Escape', async () => {
  await draw(recording('R', "R'"));
  const dialog = container.querySelector('dialog')!;
  expect(dialog.open).toBe(true);
  expect(dialog.getAttribute('aria-label')).toBe('Solve replay');
  await click('Close');
  expect(dialog.open).toBe(false);
  expect(close).toHaveBeenCalledTimes(1);
  dialog.showModal();
  await act(async () => dialog.dispatchEvent(new Event('cancel', { cancelable: true })));
  expect(dialog.open).toBe(false);
  expect(close).toHaveBeenCalledTimes(2);
});

test('replay prioritizes time and playback while keeping solution, analysis and recording details available on demand', async () => {
  await draw({ ...recording('R U2', "U2 R'"), inspection: 2345 });
  const header = container.querySelector('.replay-header')!;
  expect(header.querySelector('[aria-label="Solve time"]')!.textContent).toBe('0.100s');
  expect(header.querySelector('[aria-label="Inspection time"]')).toBeNull();
  const inspection = container.querySelector('[aria-label="Inspection time"]')!;
  expect(inspection.closest('details')!.open).toBe(false);
  expect(inspection.textContent).toBe('Inspection: 2.345s');
  expect(header.querySelector('[aria-label="Close replay"]')).not.toBeNull();
  expect(header.querySelector('a')).toBeNull();
  expect(container.querySelector('.replay-scramble a')!.textContent).toBe('Retry');
  expect(header.querySelector('[aria-label="Solve date"]')).not.toBeNull();
  expect(Array.from(container.querySelectorAll('[aria-label="Solve penalties and deletion"] button'), element => element.textContent)).toEqual(['Delete']);
  expect(header.querySelector('h2')!.textContent).toBe('Solve replay');
  expect(header.textContent).not.toMatch(/complete|host timing|quarter turns/i);
  const solution = container.querySelector('[aria-label="Solution steps"]')!.closest('details')!;
  expect(solution.open).toBe(false);
  await act(async () => solution.querySelector('summary')!.click());
  expect(solution.open).toBe(true);
  await click('Next move');
  expect(position()).toBe('1');
  await draw({ ...recording('R', "R'") }, jest.fn());
  expect(container.querySelector('[aria-label="Base cross color"]')!.closest('details')!.open).toBe(false);
  expect(container.querySelector('[aria-label="Solve penalties and deletion"]')!.closest('details')).toBeNull();
});

test('Delete removes only the selected saved solve, notifies mounted pages, and closes read-only replay', async () => {
  const solve = recording('R', "R'"), other = { ...solve, id: 'keep-this-solve' };
  await saveSolves([solve, other]);
  const dispatch = jest.spyOn(window, 'dispatchEvent');
  try {
    await draw(solve);
    await click('Delete');
    expect(await readSolves()).toEqual([other]);
    expect(dispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'timer-solve-deleted', detail: solve.id }));
    expect(container.querySelector('dialog')!.open).toBe(false);
    expect(close).toHaveBeenCalledTimes(1);
  } finally { dispatch.mockRestore(); }
});

test('canceling the deletion confirmation preserves the solve and keeps replay open', async () => {
  const solve = recording('R', "R'");
  await saveSolves([solve]);
  jest.mocked(window.confirm).mockReturnValue(false);
  await draw(solve);
  await click('Delete');
  expect(window.confirm).toHaveBeenCalledWith('Are you sure you want to delete this solve? This cannot be undone.');
  expect((await readSolves()).map(saved => ({ ...saved, analysis: undefined, cfop: undefined })))
    .toEqual([{ ...solve, analysis: undefined, cfop: undefined }]);
  expect(container.querySelector('dialog')!.open).toBe(true);
  expect(container.querySelector('[role="alert"]')).toBeNull();
  expect(close).not.toHaveBeenCalled();
});

test.each([true, false])('Delete waits for storage and disables conflicting actions with Timer retry=%s', async timerRetry => {
  const solve = recording('R', "R'");
  let finish!: () => void;
  const remove = jest.fn<(solve: Solve) => Promise<void>>(() => new Promise(resolve => { finish = resolve; }));
  const retry = jest.fn<(solve: Solve) => void>();
  await act(async () => root.render(createElement(Replay, { cube, solve, close, remove, retry: timerRetry ? retry : undefined, change: jest.fn() })));
  await click('Delete');
  expect(remove).toHaveBeenCalledWith(solve);
  expect(remove).toHaveBeenCalledTimes(1);
  expect(container.querySelector('dialog')!.open).toBe(true);
  expect(Array.from(container.querySelectorAll<HTMLButtonElement>('[aria-label="Solve penalties and deletion"] button')).every(button => button.disabled)).toBe(true);
  for (const label of ['Deleting...', ...(timerRetry ? ['Retry'] : []), 'Close']) {
    expect(Array.from(container.querySelectorAll('button')).find(button => button.textContent === label || (label === 'Close' && button.getAttribute('aria-label') === 'Close replay'))!.disabled).toBe(true);
  }
  if (!timerRetry) {
    const link = container.querySelector('a')!;
    expect(link.getAttribute('aria-disabled')).toBe('true');
    expect(link.tabIndex).toBe(-1);
    await act(async () => expect(link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }))).toBe(false));
  }
  await act(async () => container.querySelector('dialog')!.dispatchEvent(new Event('cancel', { cancelable: true })));
  expect(close).not.toHaveBeenCalled();
  await act(async () => finish());
  expect(container.querySelector('dialog')!.open).toBe(false);
  expect(close).toHaveBeenCalledTimes(1);
});

test('failed deletion keeps replay open with an error and allows retrying', async () => {
  const solve = recording('R', "R'");
  await saveSolves([solve]);
  const open = jest.spyOn(indexedDB, 'open').mockImplementation(() => { throw new Error('Storage blocked'); });
  try {
    await draw(solve);
    await click('Delete');
    expect(container.querySelector('[role="alert"]')!.textContent).toBe('Storage blocked');
    expect(container.querySelector('dialog')!.open).toBe(true);
    expect(close).not.toHaveBeenCalled();
  } finally { open.mockRestore(); }
  expect((await readSolves()).map(saved => ({ ...saved, analysis: undefined, cfop: undefined })))
    .toEqual([{ ...solve, analysis: undefined, cfop: undefined }]);
  await click('Delete');
  expect(await readSolves()).toEqual([]);
  expect(close).toHaveBeenCalledTimes(1);
});

test('replay lists real undo mistakes without flagging sensor-split double turns or changing the recording', async () => {
  const solve = recording('R2', "U U' R' R'");
  const original = structuredClone(solve);
  await draw(solve);
  const feedback = container.querySelector('[aria-label="Solve mistakes"]')!;
  expect(container.querySelector('dialog')!.lastElementChild!.querySelector('[aria-label="Solve ID"]')).not.toBeNull();
  expect(feedback.textContent).toContain('Potential time gain:');
  expect(feedback.textContent).not.toContain('Biggest mistake:');
  expect(feedback.textContent).toContain('Single-move undo');
  expect(feedback.textContent).not.toContain('Redundant same-face turns');
  expect(feedback.textContent).not.toContain('Ranked by estimated impact');
  expect(feedback.querySelectorAll('li')).toHaveLength(1);
  const explanation = "A move immediately cancelled by its inverse (R R') in the named step or AUF.";
  expect(feedback.textContent).not.toContain(explanation);
  const info = feedback.querySelector<HTMLButtonElement>('li .info-tip')!;
  expect(info.getAttribute('aria-label')).toBe(explanation);
  expect(info.textContent).toBe('\u24d8');
  await act(async () => info.focus());
  const tooltip = container.querySelector('[role="tooltip"]')!;
  expect(tooltip.textContent).toBe(explanation);
  expect(tooltip.closest('dialog')).toBe(container.querySelector('dialog'));
  await act(async () => info.blur());
  await click('Next move');
  expect(position()).toBe('1');
  expect({ ...solve, analysis: undefined, cfop: undefined }).toEqual(original);
  await draw(recording('R2', "R' R'"));
  expect(container.querySelector('[aria-label="Solve mistakes"]')!.textContent).toBe('No clear mistakes detected.');
  await draw(recording('R2', "R'", 'incomplete'));
  expect(container.querySelector('[aria-label="Solve mistakes"]')!.textContent).toContain('could not be fully assessed');
});

test('time gain totals every listed mistake rather than repeating the biggest one', async () => {
  const moves = scramble.split(' ').reverse().map(inverse);
  moves.splice(1, 0, 'U', "U'");
  moves.splice(moves.length - 5, 0, 'U', "U'");
  await draw(recording(scramble, moves.join(' ')));
  const feedback = container.querySelector('[aria-label="Solve mistakes"]')!;
  const costs = [...feedback.querySelectorAll('li')].map(item =>
    Number(item.textContent!.match(/~([\d.]+)s estimated loss/)![1]));
  expect(costs.filter(cost => cost > 0).length).toBeGreaterThan(1);
  const total = Number(feedback.querySelector('p')!.textContent!.match(/Potential time gain: ~([\d.]+)s/)![1]);
  expect(total).toBeCloseTo(costs.reduce((sum, cost) => sum + cost, 0), 1);
  expect(total).toBeGreaterThan(Math.max(...costs));
  expect(feedback.querySelector('p')!.textContent).not.toContain('mistake:');
});

test('shows the original solve GUID on the final line and distinguishes recorded from missing inspection', async () => {
  const solve = { ...recording('R', "R'"), id: 'd01e4c06-25db-4f27-b14c-ceacff0b5176', inspection: 2345 };
  await draw(solve);
  const dialog = container.querySelector('dialog')!;
  const id = container.querySelector('[aria-label="Solve ID"]')!;
  expect(dialog.lastElementChild!.contains(id)).toBe(true);
  expect(id.textContent).toBe(`Solve ID: ${solve.id}`);
  expect(id.nextElementSibling!.getAttribute('aria-label')).toBe('Solve source');
  expect(id.nextElementSibling!.textContent).toBe('CuberPlus');
  expect(container.querySelector('[aria-label="Inspection time"]')!.textContent).toBe('Inspection: 2.345s');
  await draw(recording('R', "R'"));
  expect(container.querySelector('[aria-label="Inspection time"]')!.textContent).toBe('Inspection: Not recorded');
});

test('playhead advances continuously between moves, pauses, and resumes at the selected speed', async () => {
  const solve = recording('R U', "U' R'");
  solve.moves[1].elapsed = solve.moves[1].hostTime = 1000;
  solve.duration = 1000;
  await draw(solve);
  jest.useFakeTimers();
  const cursor = () => parseFloat((container.querySelector('.solve-trail .trail-tip') as HTMLElement).style.left);
  expect(container.querySelector('[aria-label="Replay cube"]')!.getAttribute('data-playback')).toBe('true');
  await click('Play');
  await act(async () => jest.advanceTimersByTimeAsync(160));
  expect(position()).toBe('1');
  expect(cursor()).toBeCloseTo(16);
  await act(async () => jest.advanceTimersByTimeAsync(160));
  expect(position()).toBe('1');
  expect(cursor()).toBeCloseTo(32);
  await click('Pause');
  await act(async () => jest.advanceTimersByTimeAsync(160));
  expect(cursor()).toBeCloseTo(32);
  const speed = container.querySelector<HTMLSelectElement>('[aria-label="Replay speed"]')!;
  await act(async () => { speed.value = '2'; speed.dispatchEvent(new Event('change', { bubbles: true })); });
  await click('Play');
  await act(async () => jest.advanceTimersByTimeAsync(160));
  expect(cursor()).toBeCloseTo(64);
  await act(async () => jest.advanceTimersByTimeAsync(192));
  expect(cursor()).toBe(100);
  expect(position()).toBe('2');
  expect(container.querySelector('.btn-primary')!.textContent).toBe('Play');
});

test.each([
  ['Cubeast (imported)', 'id,date,dnf,time,solving_method\nsource,2026-01-01 00:00:00 UTC,false,1000,CFOP'],
  ['Acubemy (imported)', 'solve_id,date,total_time,analysis_type\nsource,2026-01-01T00:00:00Z,1000,CFOP'],
])('replay identifies %s beside the final solve ID', async (label, csv) => {
  await importSolveCSVs([Object.assign(new File([csv], 'source.csv'), { text: async () => csv })]);
  await draw((await readSolves())[0]);
  const source = container.querySelector('[aria-label="Solve source"]')!;
  expect(source.previousElementSibling!.getAttribute('aria-label')).toBe('Solve ID');
  expect(source.firstChild!.textContent).toBe(label);
  const recording = source.closest('.replay-recording')!;
  expect(recording.querySelector('button')!.closest('details')).toBeNull();
});

test('keyboard seeking distinguishes turns sharing a timestamp and background visibility pauses playback', async () => {
  const solve = recording('R2', "R' R'");
  solve.moves[1].elapsed = 0;
  solve.duration = 1000;
  await draw(solve);
  const slider = container.querySelector('[aria-label="Replay move"]')!;
  await act(async () => slider.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })));
  expect(position()).toBe('1');
  await act(async () => slider.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true })));
  expect(position()).toBe('2');
  await act(async () => slider.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true })));
  expect(position()).toBe('0');
  await click('Play');
  jest.spyOn(document, 'hidden', 'get').mockReturnValue(true);
  await act(async () => document.dispatchEvent(new Event('visibilitychange')));
  expect(container.querySelector('.btn-primary')!.textContent).toBe('Play');
});

test('device-fit playback uses calibrated timing and reaches the final cube state at the solve duration', async () => {
  const solve = recording('R U F', "F' U' R'");
  solve.duration = 1000;
  solve.timingBasis = 'device-fit';
  solve.moves.forEach((move, index) => {
    move.elapsed = move.hostTime = move.localTimestamp = index * 600;
    move.cubeTimestamp = 1000 + index * 100;
  });
  await draw(solve);
  await click('Next move');
  await click('Next move');
  expect((container.querySelector('.solve-trail .trail-tip') as HTMLElement).style.left).toBe('50%');
  await click('Previous move');
  jest.useFakeTimers();
  await click('Play');
  await act(async () => jest.advanceTimersByTimeAsync(1008));
  expect(position()).toBe('3');
  expect(facelets()).toBe(cube.facelets(cube.solved()));
  expect((container.querySelector('.solve-trail .trail-tip') as HTMLElement).style.left).toBe('100%');
});

test('feedback recalculates cached timing when the engine adds a penalty to the same solve object', async () => {
  const solve = { ...recording('R', "R'"), duration: 1000, createdAt: new Date(101000).toISOString() };
  const history = Array.from({ length: 100 }, (_, i) => ({
    ...solve, id: `baseline-${i}`, createdAt: new Date(i * 1000).toISOString(),
  }));
  const renderFeedback = async () => {
    await act(async () => root.render(createElement(SolveMistakes, { cube, solve, history })));
    await feedbackReady();
  };
  await renderFeedback();
  expect(container.textContent).toContain('No clear mistakes detected.');
  solve.penalty = 2000;
  await renderFeedback();
  expect(container.textContent).toContain('Unusually slow solve');
  delete solve.penalty;
  await renderFeedback();
  expect(container.textContent).toContain('No clear mistakes detected.');
  solve.status = 'incomplete';
  await renderFeedback();
  expect(container.textContent).toContain('could not be fully assessed');
});

test.each([
  { status: 'complete' as const, penalty: 2000 as const, penaltyReason: 'over-turn' as const, expected: '+2 reason: over-turn' },
  { status: 'incomplete' as const, dnfReason: 'solve aborted' as const, expected: 'DNF reason: solve aborted' },
  { status: 'incomplete' as const, dnfReason: 'solve interrupted' as const, expected: 'DNF reason: solve interrupted' },
])('shows $expected only inside the solve view without changing replay timing', async ({ expected, ...fields }) => {
  const solve = { ...recording('R U', "U' R'"), ...fields };
  const original = structuredClone(solve);
  await draw(solve);
  const reason = container.querySelector('[aria-label="Penalty reason"]')!;
  expect(reason.textContent).toBe(expected);
  expect(reason.closest('dialog')?.open).toBe(true);
  await click('Next move');
  expect(position()).toBe('1');
  expect({ ...solve, analysis: undefined, cfop: undefined }).toEqual(original);
});

test('legacy reasons are displayed and DNF takes precedence over an earlier +2', async () => {
  await draw({ ...recording('R', "R'"), penalty: 2000 });
  expect(container.querySelector('[aria-label="Penalty reason"]')?.textContent).toBe('+2 reason: over-turn');
  await draw({ ...recording('R', "R'", 'incomplete'), penalty: 2000, reason: 'Solve aborted by user.' });
  expect(container.querySelector('[aria-label="Penalty reason"]')?.textContent).toBe('DNF reason: solve aborted');
  await draw(recording('R', "R'"));
  expect(container.querySelector('[aria-label="Penalty reason"]')).toBeNull();
});

test('solution is partitioned into the same seven CFOP milestones as the timeline', async () => {
  const solve = recording(scramble, scramble.split(' ').reverse().map(inverse).join(' '));
  const original = structuredClone(solve), { ends } = analyzeCFOP(solve, cube);
  await draw(solve);
  expect(groups().map(group => group.querySelector('h3')!.textContent)).toEqual(['Cross', 'F2L Pair 1', 'F2L Pair 2', 'F2L Pair 3', 'F2L Pair 4', 'OLL', 'PLL']);
  for (let step = 0; step < CFOP_STEPS.length; step++) {
    const recorded = solve.moves.slice(ends[step - 1] ?? 0, ends[step]).map(move => move.move).join(' ');
    const displayed = Array.from(groups()[step].querySelectorAll('button.move')).map(button => button.textContent).join(' ');
    expect(cube.equals(cube.solved().applyAlg(recorded), cube.solved().applyAlg(displayed))).toBe(true);
  }
  await act(async () => (Array.from(groups()[6].querySelectorAll<HTMLButtonElement>('button.move')).at(-1)!).click());
  expect(position()).toBe(String(solve.moves.length));
  expect(facelets()).toBe(cube.facelets(cube.solved()));
  expect({ ...solve, analysis: undefined, cfop: undefined }).toEqual(original);
});

test.each(['', 'x2', 'z', "z'", 'x', "x'"])('replays restored solves with their detected cross underneath in frame "%s"', async rotation => {
  const centers = cube.solved().applyAlg(rotation).patternData.CENTERS.pieces;
  const remap = (alg: string) => alg.split(' ').map(move => 'ULFRBD'[centers.indexOf('ULFRBD'.indexOf(move[0]))] + move.slice(1)).join(' ');
  const solve = recording(remap(scramble), remap(scramble.split(' ').reverse().map(inverse).join(' ')));
  const before = structuredClone(solve), expected = 'URFDLB'.indexOf(remap('D'));
  await draw(solve);
  expect(container.querySelector('[aria-label="Replay cube"]')!.getAttribute('data-cross')).toBe(String(expected));
  await click('Next move');
  expect(container.querySelector('[aria-label="Replay cube"]')!.getAttribute('data-cross')).toBe(String(expected));
  expect({ ...solve, analysis: undefined, cfop: undefined }).toEqual(before);
  await click('Previous move');
  await draw(recording(remap(scramble), '', 'incomplete'));
  expect(container.querySelector('[aria-label="Replay cube"]')!.hasAttribute('data-cross')).toBe(false);
});

test('pair emoji labels and initial rotations agree with the normalized solution without adding replay moves', async () => {
  const remap = cfopFrame(cube, 'z y'), raw = scramble.split(' ').reverse().map(inverse);
  const solve = recording(scramble.split(' ').map(remap).join(' '), raw.map(remap).join(' '));
  const before = structuredClone(solve);
  await draw(solve);
  const rotation = container.querySelector('[aria-label="Replay cube"]')!.getAttribute('data-rotation')!;
  expect(rotation).toMatch(/^[xyz][2']?(?: [xyz][2']?)?$/);
  expect(container.querySelector('[aria-label="Solution orientation"]')).toBeNull();
  expect(container.textContent).not.toMatch(/cross down|first pair back-right/);
  const initial = groups()[0].querySelector('[aria-label="Initial rotation"]')!;
  expect(initial.textContent).toBe(rotation);
  expect(groups()[0].querySelector('.move')).toBe(initial);
  expect(container.querySelectorAll('[aria-label="Initial rotation"]')).toHaveLength(1);
  const oriented = cube.solved().applyAlg(rotation), { cross, pairs: order } = analyzeCFOP(solve, cube);
  expect(oriented.patternData.CENTERS.pieces[5]).toBe('ULFRBD'.indexOf('URFDLB'[cross!]));
  expect(oriented.patternData.CORNERS.pieces[7]).toBe(order[0]);
  const icons = Array.from(container.querySelectorAll('.move-timeline [role="img"]'));
  expect(icons).toHaveLength(4);
  expect(new Set(icons.map(icon => icon.getAttribute('aria-label'))).size).toBe(4);
  expect(icons.every(icon => Array.from(icon.textContent!).length === 2)).toBe(true);
  expect(groups()[1].querySelector('[role="img"]')).not.toBeNull();
  const displayed = Array.from(container.querySelectorAll('.move-timeline .move')).map(move => move.textContent).join(' ');
  expect(cube.parse(solve.startFacelets).applyAlg(displayed).patternData)
    .toEqual(cube.solved().applyAlg(rotation).patternData);
  expect(container.querySelector('[aria-label="Replay move"]')!.getAttribute('aria-valuemax')).toBe(String(solve.moves.length));
  await click('Next move');
  expect(position()).toBe('1');
  expect(facelets()).toBe(cube.facelets(cube.parse(solve.startFacelets).applyMove(solve.moves[0].move)));
  expect({ ...solve, analysis: undefined, cfop: undefined }).toEqual(before);
});

test('already oriented solves start Cross with the recorded move and no rotation placeholder', async () => {
  await draw(recording(scramble, scramble.split(' ').reverse().map(inverse).join(' ')));
  expect(container.querySelector('[aria-label="Replay cube"]')!.getAttribute('data-rotation')).toBe('');
  expect(container.querySelector('[aria-label="Initial rotation"]')).toBeNull();
  expect(container.textContent).not.toContain('Already oriented');
  expect(groups()[0].querySelector('.move')!.textContent).toBe("D'");
});

test('repeated turns compact within a step without combining across a milestone', async () => {
  const rest = scramble.split(' ').slice(0, -1).reverse().map(inverse).join(' ');
  const solve = recording(scramble.slice(0, -1) + 'D2', `D D D D D D ${rest}`);
  await draw(solve);
  expect(groups()[0].querySelector('button')!.textContent).toBe('D2');
  const firstPair = groups()[1].querySelector<HTMLButtonElement>('button.move')!;
  expect(firstPair.textContent).toBe('D4');
  expect(firstPair.getAttribute('aria-label')).toContain('D D D D');
  await act(async () => firstPair.click());
  expect(position()).toBe('6');
  expect(facelets()).toBe(cube.facelets(cube.parse(solve.startFacelets).applyAlg('D2')));
});

test('replay shows recognized F2L, OLL and PLL labels beside the step headings, but no invalidated PLL case', async () => {
  const solution = `R' F R F' R U R2 U' R' F R U R U' F' ${pll}`;
  const solve = recording(solution.split(' ').reverse().map(inverse).join(' '), solution);
  const before = structuredClone(solve);
  await draw(solve);
  expect(container.querySelector('[aria-label="F2L Pair 4 case"]')!.textContent).toBe('F2L 1');
  expect(container.querySelector('[aria-label="OLL case"]')!.textContent).toBe('OLL 34');
  expect(container.querySelector('[aria-label="PLL case"]')!.textContent).toBe('T perm');
  for (const [label, caseId] of [['F2L Pair 4', 'F2L-1'], ['OLL', 'OLL-34'], ['PLL', 'PLL-T']]) {
    const button = container.querySelector<HTMLButtonElement>(`button[aria-label="${label} case"]`)!;
    expect(button.hasAttribute('href')).toBe(false);
    await act(async () => button.click());
    await waitFor(() => expect(container.querySelector('dialog.case-dialog .database-case')?.id).toBe(caseId));
    expect(container.querySelectorAll('dialog.case-dialog .database-case')).toHaveLength(1);
    await click('Close algorithm case');
    expect(container.querySelector('dialog[aria-label="Solve replay"]')!.hasAttribute('open')).toBe(true);
    const heading = container.querySelector<HTMLButtonElement>(`[aria-label="${label} solution"] h3 button`)!;
    expect(heading.textContent).toBe(label);
    expect(heading.getAttribute('aria-label')).toContain('open');
    await act(async () => heading.click());
    await waitFor(() => expect(container.querySelector('dialog.case-dialog .database-case')?.id).toBe(caseId));
    await click('Close algorithm case');
  }
  expect(container.querySelector('[aria-label="Cross solution"] h3 button')).toBeNull();
  expect({ ...solve, analysis: undefined, cfop: undefined }).toEqual(before);
  await draw({ ...solve, status: 'incomplete' });
  expect(container.querySelector('[aria-label="OLL case"]')!.textContent).toBe('OLL 34');
  expect(container.querySelector('[aria-label="PLL case"]')).toBeNull();
  await draw(recording(oll.split(' ').reverse().map(inverse).join(' '), oll));
  const solved = container.querySelector('[aria-label="PLL case"]')!;
  expect(solved.textContent).toBe('Solved');
  expect(solved.tagName).toBe('SPAN');
  expect(solved.hasAttribute('href')).toBe(false);
  expect(container.querySelector('[aria-label="PLL solution"] h3 button')).toBeNull();
});

test('combined turns seek to the last raw move while next, previous and playback preserve intermediate states', async () => {
  const solve = recording('U2', "D D U' U'", 'incomplete');
  await draw(solve);
  const buttons = groups()[6].querySelectorAll('button');
  expect(Array.from(buttons).map(button => button.textContent)).toEqual(['D2', 'U2']);
  expect(groups().slice(0, 6).every(group => group.textContent!.includes('Skipped'))).toBe(true);
  expect(buttons[0].title).toBe('0.100s');
  await click('Next move');
  expect(position()).toBe('1');
  expect(facelets()).toBe(cube.facelets(cube.parse(solve.startFacelets).applyMove('D')));
  expect(buttons[0].classList.contains('partial')).toBe(true);
  await act(async () => buttons[0].click());
  expect(position()).toBe('2');
  expect(facelets()).toBe(cube.facelets(cube.parse(solve.startFacelets).applyAlg('D2')));
  expect(buttons[0].classList.contains('done')).toBe(true);
  expect(buttons[0].classList.contains('current')).toBe(true);
  expect(buttons[0].classList.contains('partial')).toBe(false);
  await click('Previous move');
  expect(position()).toBe('1');
  jest.useFakeTimers();
  await click('Play');
  await act(async () => jest.advanceTimersByTime(112));
  expect(position()).toBe('2');
  await act(async () => jest.advanceTimersByTime(96));
  expect(position()).toBe('3');
  expect(facelets()).toBe(cube.facelets(cube.parse(solve.startFacelets).applyAlg("D D U'")));
  expect(buttons[1].classList.contains('partial')).toBe(true);
  await act(async () => buttons[1].click());
  expect(position()).toBe('4');
  expect(buttons[1].classList.contains('done')).toBe(true);
  expect(buttons[1].classList.contains('current')).toBe(true);
  expect(buttons[0].classList.contains('current')).toBe(false);
});

test('single moves stay highlighted when stepping, seeking and playing across solve steps', async () => {
  await draw(recording(scramble, "D' B U'", 'incomplete'));
  const buttons = container.querySelectorAll<HTMLButtonElement>('.move-timeline button');
  const current = () => Array.from(container.querySelectorAll('.move-timeline .current')).map(button => button.textContent);
  expect(current()).toEqual(["D'"]);
  await click('Next move');
  expect(current()).toEqual(["D'"]);
  expect(buttons[0].getAttribute('aria-current')).toBe('step');
  await click('Next move');
  expect(current()).toEqual(['B']);
  expect(buttons[0].hasAttribute('aria-current')).toBe(false);
  await click('Previous move');
  expect(current()).toEqual(["D'"]);
  await act(async () => buttons[2].click());
  expect(current()).toEqual(["U'"]);
  const slider = container.querySelector('[aria-label="Replay move"]')!;
  await act(async () => {
    slider.dispatchEvent(new KeyboardEvent('keydown', { key: 'Home', bubbles: true }));
  });
  expect(position()).toBe('0');
  expect(current()).toEqual(["D'"]);
  jest.useFakeTimers();
  await click('Play');
  await act(async () => jest.advanceTimersByTime(20));
  expect(current()).toEqual(["D'"]);
  await act(async () => jest.advanceTimersByTime(100));
  expect(current()).toEqual(['B']);
  await act(async () => jest.advanceTimersByTime(100));
  expect(current()).toEqual(["U'"]);
  expect(container.querySelector('.move-timeline .partial')).toBeNull();
});

test('unfinished solutions retain their moves and mark unreached steps instead of dropping the attempt', async () => {
  await draw(recording(scramble, "D' B U'", 'incomplete'));
  expect(groups()[0].querySelector('button')!.textContent).toBe("D'");
  expect(Array.from(groups()[1].querySelectorAll('button')).map(button => button.textContent)).toEqual(['B', "U'"]);
  expect(groups().slice(2).every(group => group.textContent!.includes('Not reached'))).toBe(true);
});
