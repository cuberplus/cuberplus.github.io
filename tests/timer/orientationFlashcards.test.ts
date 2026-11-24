/** @jest-environment jsdom */
import { jest } from '@jest/globals';
import { webcrypto } from 'node:crypto';
import { deserialize, serialize } from 'node:v8';
import { createElement } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { PageVisible } from '@cuberplus/navigation';
import type { CubeEvent } from '../../shared/cube/connection';
import { loadCube } from '../../timer/src/Core/puzzle';
import { ORIENTATION_ATTEMPTS, ORIENTATION_SETTINGS, edgeName, type OrientationAttempt } from '../../src/trainer/orientation';
import { locations } from '../../shared/cube/cubeLocations';

let signalReady: (() => void) | undefined, receive: (event: CubeEvent) => void = () => {};
const unsubscribe = jest.fn();
await jest.unstable_mockModule('../../timer/src/Components/CubeView', () => ({ CubeView: ({ ready }: { ready?: () => void }) => { signalReady = ready; return null; } }));
await jest.unstable_mockModule('../../shared/cube/connection', () => ({ cubeConnection: { onEvent: (listener: typeof receive) => { receive = listener; return unsubscribe; } } }));
const { OrientationFlashcards } = await import('../../src/trainer/OrientationFlashcards');
const cube = await loadCube(), facelets = cube.facelets(cube.solved().applyAlg('U'));
const attempts: OrientationAttempt[] = [
  { id: 'a', facelets, edge: 1, position: 8, caseKey: `${facelets}:1`, stage: 'scrambled', date: '2026-11-23T12:00:00Z', oriented: true, answer: true, correct: true, milliseconds: 9000, gray: false },
  { id: 'b', facelets, edge: 2, position: 1, caseKey: `${facelets}:2`, stage: 'cross-solved', date: '2026-11-22T12:00:00Z', oriented: false, answer: true, correct: false, milliseconds: 11000, gray: true },
  { id: 'c', facelets, edge: 3, position: 0, caseKey: `${facelets}:3`, stage: 'f2l-solved', date: '2026-11-21T12:00:00Z', oriented: true, answer: false, correct: false, milliseconds: 2000, gray: true },
];
beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: function(this: HTMLDialogElement) { this.open = false; } });
  Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true });
  Object.defineProperty(globalThis, 'structuredClone', { configurable: true, value: <T>(value: T): T => deserialize(serialize(value)) as T });
  Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: jest.fn() });
  Object.defineProperty(HTMLElement.prototype, 'scrollTo', { configurable: true, value: jest.fn() });
  for (const name of ['IntersectionObserver', 'ResizeObserver']) Object.defineProperty(globalThis, name, {
    configurable: true, value: class { observe() {} disconnect() {} },
  });
  Object.defineProperty(globalThis, 'matchMedia', { configurable: true, value: () => ({ matches: true }) });
  unsubscribe.mockClear(); signalReady = undefined;
  localStorage.clear();
  localStorage.setItem(ORIENTATION_ATTEMPTS, JSON.stringify(attempts));
});
afterEach(() => { cleanup(); jest.useRealTimers(); });
const show = () => render(createElement(OrientationFlashcards, { cube, back: () => {} }));
const cells = (table: HTMLElement, column: number) => Array.from(table.querySelectorAll('tbody tr'), row => row.children[column].textContent);

test('statistics and recent answers are expanded cards with a sortable control for every data column', async () => {
  const view = show();
  for (const name of ['Case statistics', 'Recent answers']) {
    const card = await screen.findByRole('article', { name, exact: true });
    expect(card.classList.contains('card')).toBe(true);
    const table = within(card).getByRole('table', { name, exact: true });
    expect(table.closest('details')).toBeNull();
    expect(within(table).getAllByRole('columnheader')).toHaveLength(6);
    expect(table.querySelectorAll('thead button[type="button"]')).toHaveLength(6);
    expect(table.querySelectorAll('th[aria-sort]')).toHaveLength(1);
    expect(table.parentElement!.tabIndex).toBe(0);
  }
  const table = screen.getByRole('table', { name: 'Recent answers' });
  const rows = Array.from(table.querySelectorAll('tbody tr')), body = table.querySelector('tbody');
  const time = within(table).getByRole('button', { name: 'Time', exact: true });
  time.focus(); fireEvent.click(time);
  expect(cells(table, 5)).toEqual(['2.00s', '9.00s', '11.00s']);
  expect(document.activeElement).toBe(time);
  expect(table.querySelector('tbody')).toBe(body);
  expect(Array.from(table.querySelectorAll('tbody tr'))).toEqual([rows[2], rows[0], rows[1]]);
  expect(within(table.closest('article')!).getByRole('status').textContent).toBe('Sorted by Time, ascending, 3 rows');
  fireEvent.click(time);
  expect(cells(table, 5)).toEqual(['11.00s', '9.00s', '2.00s']);
  fireEvent.click(within(table).getByRole('button', { name: 'When', exact: true }));
  expect(Array.from(table.querySelectorAll('tbody time'), node => node.getAttribute('datetime'))).toEqual(attempts.map(row => row.date).reverse());
  fireEvent.click(within(table).getByRole('button', { name: 'State', exact: true }));
  expect(cells(table, 1)).toEqual(['Cross solved', 'F2L solved', 'Scrambled']);
  fireEvent.click(within(table).getByRole('button', { name: 'Result', exact: true }));
  expect(cells(table, 4)).toEqual(['Correct', 'Incorrect', 'Incorrect']);
  fireEvent.click(within(table).getAllByRole('button', { name: 'Review case', exact: true })[0]);
  expect(screen.getByRole('region', { name: 'Recorded flashcard' }).textContent).toContain(`Recorded case: ${edgeName(attempts[0].position)}`);
  expect(JSON.parse(localStorage.getItem(ORIENTATION_ATTEMPTS)!)).toEqual(attempts);
  view.unmount();
});
test('case statistics sort numeric averages, accuracies and counts independently from recent answers', async () => {
  localStorage.setItem(ORIENTATION_ATTEMPTS, JSON.stringify([...attempts, { ...attempts[0], id: 'a2' }]));
  show();
  const table = await screen.findByRole('table', { name: 'Case statistics' });
  fireEvent.click(within(table).getByRole('button', { name: 'Average', exact: true }));
  expect(cells(table, 5)).toEqual(['2.00s', '9.00s', '11.00s']);
  fireEvent.click(within(table).getByRole('button', { name: 'Accuracy', exact: true }));
  expect(cells(table, 4)).toEqual(['0%', '0%', '100%']);
  fireEvent.click(within(table).getByRole('button', { name: 'Attempts', exact: true }));
  fireEvent.click(within(table).getByRole('button', { name: 'Attempts', exact: true }));
  expect(cells(table, 3)).toEqual(['2', '1', '1']);
  expect(screen.getByRole('table', { name: 'Recent answers' }).querySelector('th[aria-sort]')!.textContent).toBe('When');
});
test('sorting recent answers stays within the latest twenty and retains all saved statistics', async () => {
  const saved = Array.from({ length: 25 }, (_, index) => ({
    ...attempts[0], id: String(index), date: new Date(Date.UTC(2026, 10, index + 1)).toISOString(), milliseconds: (index + 1) * 1000,
  }));
  localStorage.setItem(ORIENTATION_ATTEMPTS, JSON.stringify(saved));
  show();
  const recent = await screen.findByRole('table', { name: 'Recent answers' });
  fireEvent.click(within(recent).getByRole('button', { name: 'Time', exact: true }));
  expect(recent.querySelectorAll('tbody tr')).toHaveLength(20);
  expect(cells(recent, 5)[0]).toBe('6.00s');
  expect(cells(screen.getByRole('table', { name: 'Case statistics' }), 3)).toEqual(['25']);
  expect(JSON.parse(localStorage.getItem(ORIENTATION_ATTEMPTS)!)).toEqual(saved);
});
test('both grids preview exact recorded facelets, target slots and only stage-guaranteed colors', async () => {
  show();
  for (const name of ['Case statistics', 'Recent answers']) {
    const table = await screen.findByRole('table', { name });
    expect(within(table).getAllByRole('img')).toHaveLength(attempts.length);
    for (const attempt of attempts) {
      const image = within(table).getByRole('img', { name: new RegExp(`${edgeName(attempt.position)} case$`) });
      expect(image.getAttribute('data-facelets')).toBe(attempt.facelets);
      expect(image.querySelectorAll('polygon')).toHaveLength(27);
      expect(Array.from(image.querySelectorAll('[data-highlighted]'), sticker => Number(sticker.getAttribute('data-facelet'))).sort((a, b) => a - b))
        .toEqual([...locations.EDGES[attempt.position]].sort((a, b) => a - b));
      const sticker = (index: number) => image.querySelector(`[data-facelet="${index}"]`)!.getAttribute('fill');
      expect(sticker(4)).not.toBe('#697384');
      if (attempt.stage === 'scrambled') expect(sticker(0)).toBe('#697384');
      if (attempt.stage === 'cross-solved') {
        expect(sticker(25)).not.toBe('#697384');
        expect(sticker(23)).toBe('#697384');
        expect(sticker(26)).toBe('#697384');
      }
      if (attempt.stage === 'f2l-solved') {
        expect(sticker(23)).not.toBe('#697384');
        expect(sticker(26)).not.toBe('#697384');
        expect(sticker(1)).toBe('#697384');
      }
    }
  }
});
test('a statistics preview uses the newest saved example even when imported history is out of order', async () => {
  const newest = { ...attempts[0], id: 'newest', date: '2026-11-24T12:00:00Z', facelets: cube.facelets(cube.solved().applyAlg('U2')) };
  localStorage.setItem(ORIENTATION_ATTEMPTS, JSON.stringify([...attempts, newest]));
  show();
  const table = await screen.findByRole('table', { name: 'Case statistics' });
  expect(within(table).getByRole('img', { name: /^Scrambled/ }).getAttribute('data-facelets')).toBe(newest.facelets);
});
test('color options persist independently while recorded previews retain their original frame', async () => {
  localStorage.setItem(ORIENTATION_SETTINGS, JSON.stringify({ stage: 'scrambled', gray: true, topColor: 'Red', frontColor: 'Blue' }));
  localStorage.setItem(ORIENTATION_ATTEMPTS, JSON.stringify([{ ...attempts[0], colorFrame: 'x' }]));
  const view = show(), dialog = view.container.querySelector<HTMLDialogElement>('.orientation-options')!;
  dialog.open = true;
  const top = within(dialog).getByLabelText('Top color'), front = within(dialog).getByLabelText('Front color');
  expect((top as HTMLSelectElement).value).toBe('Red');
  expect((front as HTMLSelectElement).value).toBe('Blue');
  expect(within(front).getByRole('option', { name: 'Orange', exact: true }).hasAttribute('disabled')).toBe(true);
  fireEvent.change(top, { target: { value: 'Random' } });
  expect(JSON.parse(localStorage.getItem(ORIENTATION_SETTINGS)!)).toMatchObject({ topColor: 'Random', frontColor: 'Blue' });
  const table = await screen.findByRole('table', { name: 'Recent answers' }), image = within(table).getByRole('img');
  expect(image.getAttribute('data-color-frame')).toBe('x');
  expect(image.querySelector('[data-facelet="4"]')!.getAttribute('fill')).toBe('#009b48');
  dialog.open = false;
  fireEvent.click(screen.getByRole('button', { name: 'Start flashcards', exact: true }));
  expect(top.matches(':disabled')).toBe(true);
});
const turn = (move: string) => act(() => receive({ type: 'MOVE', move, face: 0, direction: move.endsWith("'") ? -1 : 1, localTimestamp: null, cubeTimestamp: null }));
const saved = () => JSON.parse(localStorage.getItem(ORIENTATION_ATTEMPTS)!) as OrientationAttempt[];
test('U and U-prime answer once through the timed, persisted path, only while a card is ready', () => {
  jest.useFakeTimers();
  const view = show();
  turn('U'); expect(saved()).toHaveLength(3);
  fireEvent.click(screen.getByRole('button', { name: 'Start flashcards', exact: true }));
  const oriented = screen.getByRole('button', { name: 'Oriented (U)', exact: true });
  expect(oriented.hasAttribute('disabled')).toBe(true);
  turn('U'); expect(saved()).toHaveLength(3);
  act(() => signalReady!());
  for (const move of ['R', "D'", 'U2']) turn(move);
  expect(saved()).toHaveLength(3);
  act(() => jest.advanceTimersByTime(250));
  turn('U');
  expect(saved()).toHaveLength(4);
  expect(saved()[0]).toEqual(expect.objectContaining({ answer: true, milliseconds: 250, gray: false }));
  expect(saved()[0].correct).toBe(saved()[0].oriented);
  turn("U'"); fireEvent.click(oriented);
  expect(saved()).toHaveLength(4);
  act(() => jest.advanceTimersByTime(1000));
  turn("U'"); expect(saved()).toHaveLength(4);
  act(() => signalReady!());
  act(() => jest.advanceTimersByTime(300));
  turn("U'");
  expect(saved()).toHaveLength(5);
  expect(saved()[0]).toEqual(expect.objectContaining({ answer: false, milliseconds: 300 }));
  expect(saved()[0].correct).toBe(!saved()[0].oriented);
  fireEvent.click(screen.getByRole('button', { name: 'Stop flashcards', exact: true }));
  turn('U'); expect(saved()).toHaveLength(5);
  view.unmount();
  expect(unsubscribe).toHaveBeenCalledTimes(1);
});
test('cube turns cannot answer flashcards after leaving the trainer or hiding the tab', () => {
  jest.useFakeTimers();
  const tree = (visible: boolean) => createElement(PageVisible.Provider, { value: visible }, createElement(OrientationFlashcards, { cube, back: () => {} }));
  const view = render(tree(true));
  fireEvent.click(screen.getByRole('button', { name: 'Start flashcards', exact: true }));
  act(() => signalReady!());
  Object.defineProperty(document, 'hidden', { value: true, configurable: true });
  turn('U'); expect(saved()).toHaveLength(3);
  Object.defineProperty(document, 'hidden', { value: false, configurable: true });
  view.rerender(tree(false));
  turn("U'"); expect(saved()).toHaveLength(3);
});
