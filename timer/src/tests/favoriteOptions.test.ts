/** @jest-environment jsdom */
import { jest } from '@jest/globals';
import { act, createElement } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { FavoriteOptions } from '../FavoriteOptions';
import { algorithms, casePattern } from '../../../src/database/algorithms';
import { favoriteId, FAVORITES_KEY, CATEGORIES_KEY, MISTAKES_KEY } from '../../../src/database/favorites';
import { loadCube } from '../puzzle';
import { algorithmMatcher } from '../algorithmMatching';
import type { Solve } from '../engine';
import { deserialize, serialize } from 'node:v8';
import { waitFor } from '@testing-library/react';

const cube = await loadCube(), matcher = algorithmMatcher(cube);
let root: Root, container: HTMLDivElement;
beforeEach(() => {
  localStorage.clear();
  jest.spyOn(window, 'confirm').mockReturnValue(true);
  Object.defineProperty(globalThis, 'IS_REACT_ACT_ENVIRONMENT', { configurable: true, value: true });
  Object.defineProperty(globalThis, 'structuredClone', { configurable: true, value: <T>(value: T): T => deserialize(serialize(value)) as T });
  container = document.createElement('div'); document.body.appendChild(container); root = createRoot(container);
});
afterEach(async () => { await act(async () => root.unmount()); container.remove(); jest.restoreAllMocks(); });
const controls = () => Array.from(container.querySelectorAll<HTMLInputElement>('input'));
const discoverButton = () => Array.from(container.querySelectorAll('button')).find(button => button.textContent === 'Automatically find favorites')!;
const render = (history: Solve[] = []) => act(async () => root.render(createElement(FavoriteOptions, { cube, history })));

test('three independent sub-options default on and retain choices across main toggles and remounts', async () => {
  await render();
  expect(controls()).toHaveLength(4);
  expect(controls().map(input => input.checked)).toEqual([false, true, true, true]);
  expect(container.querySelector('fieldset')!.disabled).toBe(true);
  await act(async () => controls()[0].click());
  expect(container.querySelector('fieldset')!.disabled).toBe(false);
  await act(async () => controls()[1].click());
  await act(async () => controls()[2].click());
  expect(JSON.parse(localStorage.getItem(CATEGORIES_KEY)!)).toEqual({ F2L: false, OLL: false, PLL: true });
  await act(async () => controls()[0].click());
  expect(controls().map(input => input.checked)).toEqual([false, false, false, true]);
  await act(async () => controls()[0].click());
  expect(localStorage.getItem(MISTAKES_KEY)).toBe('true');
  await act(async () => root.unmount());
  root = createRoot(container); await render();
  expect(controls().map(input => input.checked)).toEqual([true, false, false, true]);
  expect(container.textContent).toContain('F2L (including Advanced F2L)');
});
test('Automatically find favorites adds recorded matches and preserves existing favorites', async () => {
  const entry = algorithms.find(entry => entry.category === 'PLL' && entry.id === 'T')!;
  const existing = algorithms.find(entry => entry.category === 'F2L')!;
  localStorage.setItem(FAVORITES_KEY, JSON.stringify([favoriteId(existing, existing.algorithm)]));
  const moves = matcher.outerMoves(entry.options[1]).moves.map((move, i) => ({
    move, elapsed: i * 100, hostTime: i * 100, localTimestamp: i * 100, cubeTimestamp: null,
  }));
  const solve: Solve = {
    version: 1, id: 'existing-solve', session: 'Default', createdAt: '2026-11-05T00:00:00Z', device: 'Test',
    scramble: '', startFacelets: cube.facelets(casePattern(cube, entry.options[1])), duration: 2000,
    status: 'complete', reason: '', timingBasis: 'host', moves,
  };
  await render([solve]);
  const button = discoverButton();
  expect(button.textContent).toBe('Automatically find favorites');
  await act(async () => button.click());
  await waitFor(() => expect(container.querySelector('[role="status"]')?.textContent).toContain('Added 1 favorite'));
  const favorites = JSON.parse(localStorage.getItem(FAVORITES_KEY)!) as string[];
  expect(favorites).toContain(favoriteId(entry, entry.options[1]));
  expect(favorites).toContain(favoriteId(existing, existing.algorithm));
  expect(container.querySelector('[role="status"]')!.textContent).toBe('Added 1 favorite from your most recent 1 completed solve.');
  expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('Are you sure'));
  expect(container.querySelector('[role="alert"]')!.textContent).toContain('Missing favorites for 57 OLL cases and 20 PLL cases.');
  expect(container.querySelector('[role="alert"]')!.textContent).toContain("Those cases won't be tracked as mistakes.");
  expect(button.disabled).toBe(false);
});
test('cancelling automatic discovery leaves favorites unchanged', async () => {
  jest.mocked(window.confirm).mockReturnValue(false);
  localStorage.setItem(FAVORITES_KEY, '[]');
  await render();
  await act(async () => discoverButton().click());
  expect(localStorage.getItem(FAVORITES_KEY)).toBe('[]');
  expect(container.querySelector('[role="status"]')).toBeNull();
  expect(container.querySelector('[role="alert"]')).toBeNull();
  expect(discoverButton().disabled).toBe(false);
});
test('complete OLL and PLL favorites do not produce a missing-favorites warning', async () => {
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(algorithms.filter(entry => entry.category === 'OLL' || entry.category === 'PLL')
    .map(entry => favoriteId(entry, entry.algorithm))));
  await render();
  await act(async () => discoverButton().click());
  await waitFor(() => expect(container.querySelector('[role="status"]')?.textContent).toContain('Added 0 favorites'));
  expect(container.querySelector('[role="alert"]')).toBeNull();
});
test('blocked storage keeps settings usable for this visit', async () => {
  jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Blocked'); });
  await render();
  await act(async () => controls()[0].click());
  expect(controls()[0].checked).toBe(true);
  expect(container.querySelector('[role="alert"]')!.textContent).toContain('could not be saved');
});
test('category checkboxes occupy separate lines and discovery follows all checkboxes', async () => {
  await render();
  const fieldset = container.querySelector('fieldset')!;
  expect(fieldset.classList.contains('flex-column')).toBe(true);
  expect(controls().every(control => !!(control.compareDocumentPosition(discoverButton()) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
  expect(container.querySelectorAll('p.text-secondary')).toHaveLength(0);
});
