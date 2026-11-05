/** @jest-environment jsdom */
import { jest } from '@jest/globals';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { deserialize, serialize } from 'node:v8';
import { IDBFactory } from 'fake-indexeddb';
import { readSolves, saveSolves } from '../storage';
import type { Solve } from '../engine';
import { inverse, loadCube } from '../puzzle';
import { analyzeCFOP, cfopFrame, CFOP_STEPS } from '../cfop';
import { algorithms } from '../../../src/database/algorithms';
import { favoriteId, FAVORITES_KEY, MISTAKES_KEY, CATEGORIES_KEY } from '../../../src/database/favorites';

await jest.unstable_mockModule('../CubeView', () => ({
  CubeView: ({ facelets, cross, rotation }: { facelets: string; cross: number | null; rotation: string }) => createElement('div', { 'data-facelets': facelets, 'data-cross': cross, 'data-rotation': rotation, 'aria-label': 'Replay cube' }),
}));
const { Replay } = await import('../Replay');
const { SolveMistakes } = await import('../SolveMistakes');
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

test('non-favorite feedback outranks other mistakes and reacts to favorites and group settings', async () => {
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
  }
  await preference(MISTAKES_KEY, 'true');
  expect(feedback().querySelector('p')!.textContent).toContain('Biggest mistake: PLL: Non-favorite algorithm (PLL T)');
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
}
async function click(text: string) {
  const button = Array.from(container.querySelectorAll('button')).find(button => button.textContent === text)!;
  expect(button.disabled).toBe(false);
  await act(async () => button.click());
}
const groups = () => Array.from(container.querySelectorAll('[aria-label="Solution steps"] > [role="group"]'));
const position = () => container.querySelector<HTMLInputElement>('[aria-label="Replay move"]')!.value;
const facelets = () => container.querySelector('[aria-label="Replay cube"]')!.getAttribute('data-facelets');

test('manual penalties are reversible, preserve automatic reasons, and do not change the raw timeline', async () => {
  let solve: Solve = { ...recording('R U', "U' R'"), penalty: 4000, penaltyReason: 'inspection, over-turn' };
  const original = structuredClone(solve);
  const change = (updated: Solve) => { solve = updated; };
  await draw(solve, change);
  const manual = () => container.querySelectorAll<HTMLInputElement>('fieldset input');
  await act(async () => manual()[0].click());
  expect(solve).toMatchObject({ penalty: 6000, penaltyReason: 'inspection, over-turn, manual' });
  await draw(solve, change);
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
  expect(container.querySelector('dialog')!.lastElementChild!.getAttribute('aria-label')).toBe('Solve mistakes');
});

test.each(['inspection', 'solve interrupted', 'solve aborted'] as const)('manual controls cannot erase an automatic %s DNF', async dnfReason => {
  const change = jest.fn<(solve: Solve) => void>();
  await draw({ ...recording('R U', "U'", 'incomplete'), dnfReason }, change);
  expect(container.querySelector('fieldset')!.disabled).toBe(true);
  expect(change).not.toHaveBeenCalled();
});

test('Analyzer read-only replay has no manual edit controls', async () => {
  await draw(recording('R', "R'"));
  expect(container.querySelector('fieldset')).toBeNull();
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
  expect(solve).toEqual(original);
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

test('the compact header emphasizes time, keeps inspection beside turns, and orders Delete, Retry, Close', async () => {
  await draw({ ...recording('R U2', "U2 R'"), inspection: 2345 });
  const header = container.querySelector('.replay-header')!;
  expect(header.querySelector('[aria-label="Solve time"]')!.textContent).toBe('0.100s');
  const inspection = header.querySelector('[aria-label="Inspection time"]')!;
  expect(inspection.previousElementSibling!.textContent).toBe('3 turns');
  expect(inspection.textContent).toBe('Inspection: 2.345s');
  expect(Array.from(header.querySelectorAll('a, button'), element => element.textContent)).toEqual(['Delete', 'Retry', 'Close']);
  expect(header.querySelector('h2')).toBeNull();
  expect(header.textContent).not.toMatch(/Solve replay|complete|host timing|quarter turns/i);
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
  expect(await readSolves()).toEqual([solve]);
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
  expect(container.querySelector('fieldset')!.disabled).toBe(true);
  for (const label of ['Deleting...', ...(timerRetry ? ['Retry'] : []), 'Close']) {
    expect(Array.from(container.querySelectorAll('button')).find(button => button.textContent === label)!.disabled).toBe(true);
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
  expect(await readSolves()).toEqual([solve]);
  await click('Delete');
  expect(await readSolves()).toEqual([]);
  expect(close).toHaveBeenCalledTimes(1);
});

test('replay lists real undo mistakes without flagging sensor-split double turns or changing the recording', async () => {
  const solve = recording('R2', "U U' R' R'");
  const original = structuredClone(solve);
  await draw(solve);
  const feedback = container.querySelector('[aria-label="Solve mistakes"]')!;
  expect(container.querySelector('dialog')!.lastElementChild).toBe(feedback);
  expect(feedback.textContent).toContain('Biggest mistake:');
  expect(feedback.textContent).toContain('Single-move undo');
  expect(feedback.textContent).not.toContain('Redundant same-face turns');
  expect(feedback.textContent).not.toContain('Ranked by estimated impact');
  expect(feedback.querySelectorAll('li')).toHaveLength(1);
  const explanation = "A move immediately cancelled by its inverse (R R') in the named step or AUF.";
  expect(feedback.textContent).not.toContain(explanation);
  const info = feedback.querySelector<HTMLButtonElement>('button[aria-label^="About "]')!;
  expect(info.textContent).toBe('\u24d8');
  await act(async () => info.focus());
  const tooltip = feedback.querySelector('[role="tooltip"]')!;
  expect(tooltip.textContent).toBe(explanation);
  expect(tooltip.closest('dialog')).toBe(container.querySelector('dialog'));
  await act(async () => info.blur());
  await click('Next move');
  expect(position()).toBe('1');
  expect(solve).toEqual(original);
  await draw(recording('R2', "R' R'"));
  expect(container.querySelector('[aria-label="Solve mistakes"]')!.textContent).toBe('No clear mistakes detected.');
  await draw(recording('R2', "R'", 'incomplete'));
  expect(container.querySelector('[aria-label="Solve mistakes"]')!.textContent).toContain('could not be fully assessed');
});

test('shows the original solve GUID before the final mistake feedback and distinguishes recorded from missing inspection', async () => {
  const solve = { ...recording('R', "R'"), id: 'd01e4c06-25db-4f27-b14c-ceacff0b5176', inspection: 2345 };
  await draw(solve);
  const dialog = container.querySelector('dialog')!;
  expect(dialog.lastElementChild!.getAttribute('aria-label')).toBe('Solve mistakes');
  expect(dialog.lastElementChild!.previousElementSibling!.getAttribute('aria-label')).toBe('Solve ID');
  expect(dialog.lastElementChild!.previousElementSibling!.textContent).toBe(`Solve ID: ${solve.id}`);
  expect(container.querySelector('[aria-label="Inspection time"]')!.textContent).toBe('Inspection: 2.345s');
  await draw(recording('R', "R'"));
  expect(container.querySelector('[aria-label="Inspection time"]')!.textContent).toBe('Inspection: Not recorded');
});

test('feedback recalculates cached timing when the engine adds a penalty to the same solve object', async () => {
  const solve = { ...recording('R', "R'"), duration: 1000, createdAt: new Date(101000).toISOString() };
  const history = Array.from({ length: 100 }, (_, i) => ({
    ...solve, id: `baseline-${i}`, createdAt: new Date(i * 1000).toISOString(),
  }));
  const renderFeedback = () => act(async () => root.render(createElement(SolveMistakes, { cube, solve, history })));
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
  expect(solve).toEqual(original);
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
    const displayed = Array.from(groups()[step].querySelectorAll('button')).map(button => button.textContent).join(' ');
    expect(cube.equals(cube.solved().applyAlg(recorded), cube.solved().applyAlg(displayed))).toBe(true);
  }
  await act(async () => (groups()[6].querySelector('button:last-child') as HTMLButtonElement).click());
  expect(position()).toBe(String(solve.moves.length));
  expect(facelets()).toBe(cube.facelets(cube.solved()));
  expect(solve).toEqual(original);
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
  expect(solve).toEqual(before);
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
  expect(container.querySelector<HTMLInputElement>('[aria-label="Replay move"]')!.max).toBe(String(solve.moves.length));
  await click('Next move');
  expect(position()).toBe('1');
  expect(facelets()).toBe(cube.facelets(cube.parse(solve.startFacelets).applyMove(solve.moves[0].move)));
  expect(solve).toEqual(before);
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
  const firstPair = groups()[1].querySelector('button')!;
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
    const link = container.querySelector<HTMLAnchorElement>(`a[aria-label="${label} case"]`)!;
    expect(link.getAttribute('href')).toBe(`/database/#${caseId}`);
    expect(link.target).toBe('_blank');
    expect(link.rel).toBe('noopener noreferrer');
  }
  expect(solve).toEqual(before);
  await draw({ ...solve, status: 'incomplete' });
  expect(container.querySelector('[aria-label="OLL case"]')!.textContent).toBe('OLL 34');
  expect(container.querySelector('[aria-label="PLL case"]')).toBeNull();
  await draw(recording(oll.split(' ').reverse().map(inverse).join(' '), oll));
  const solved = container.querySelector('[aria-label="PLL case"]')!;
  expect(solved.textContent).toBe('Solved');
  expect(solved.tagName).toBe('SPAN');
  expect(solved.hasAttribute('href')).toBe(false);
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
  await act(async () => jest.advanceTimersByTime(100));
  expect(position()).toBe('2');
  await act(async () => jest.advanceTimersByTime(100));
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
  const slider = container.querySelector<HTMLInputElement>('[aria-label="Replay move"]')!;
  await act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!.call(slider, '0');
    slider.dispatchEvent(new Event('input', { bubbles: true }));
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
