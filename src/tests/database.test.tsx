import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import Database from '../database/Database';

jest.mock('../../timer/src/puzzle', () => ({ loadCube: jest.fn().mockResolvedValue({}) }));
jest.mock('../database/algorithms', () => {
  const algorithms = ['F2L', 'AF2L', 'OLL', 'PLL'].map(category => ({
    category, id: '1', algorithm: "R U R'", options: ["R U R'", "R U2 R'"],
  }));
  return { algorithms, categories: ['F2L', 'AF2L', 'OLL', 'PLL'],
    illustrateCases: () => algorithms.map(entry => ({ ...entry, facelets: 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB', visibleStickers: [] })) };
});

const scrollIntoView = jest.fn();
const originalScroll = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollIntoView');
beforeAll(() => Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: scrollIntoView }));
afterAll(() => {
  if (originalScroll) Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', originalScroll);
  else Reflect.deleteProperty(HTMLElement.prototype, 'scrollIntoView');
});
beforeEach(() => {
  localStorage.clear();
  history.replaceState(null, '', '/database/');
  scrollIntoView.mockClear();
});
afterEach(cleanup);

test.each(['F2L', 'AF2L', 'OLL', 'PLL'])('a direct %s case link expands only its group and scrolls to the case', async category => {
  history.replaceState(null, '', `/database/#${category}-1`);
  await act(async () => { render(<Database />); });
  await screen.findByRole('img', { name: `${category} 1 case`, hidden: true });
  const target = document.getElementById(`${category}-1`)!;
  expect(target.closest('details')!.open).toBe(true);
  expect(document.querySelectorAll('details[open]')).toHaveLength(1);
  expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start' });
  expect(scrollIntoView.mock.contexts).toEqual([target]);
  expect(target.classList.contains('database-case--linked')).toBe(true);
  expect(document.querySelectorAll('.database-case--linked')).toHaveLength(1);
});

test('changing the fragment reveals the requested case while unknown fragments do nothing', async () => {
  await act(async () => { render(<Database />); });
  await screen.findByRole('img', { name: 'F2L 1 case', hidden: true });
  for (const hash of ['#PLL-1', '#unknown']) {
    history.replaceState(null, '', `/database/${hash}`);
    fireEvent(window, new HashChangeEvent('hashchange'));
  }
  expect(document.getElementById('PLL-1')!.closest('details')!.open).toBe(true);
  expect(scrollIntoView).toHaveBeenCalledTimes(1);
});

test('shows collapsible groups with case diagrams and multiple algorithms per case', async () => {
  render(<Database />);
  await screen.findByRole('img', { name: 'F2L 1 case', hidden: true });
  const groups = document.querySelectorAll('details');
  expect(groups).toHaveLength(4);
  expect(screen.getByText('Advanced F2L')).toBeDefined();
  for (const [i, category] of ['F2L', 'AF2L', 'OLL', 'PLL'].entries()) {
    const group = groups[i];
    expect(group.open).toBe(false);
    expect(group.querySelector('summary .database-category-image svg')).not.toBeNull();
    fireEvent.click(group.querySelector('summary')!);
    // jsdom does not implement native details toggling.
    group.open = true;
    expect(within(group).getByRole('img', { name: `${category} 1 case` })).toBeDefined();
    expect(within(group).getByText("R U R'")).toBeDefined();
    expect(within(group).getByText("R U2 R'")).toBeDefined();
    expect(within(group).getByRole('button', { name: `Favorite ${category} 1 algorithm 1` }).getAttribute('aria-pressed')).toBe('false');
  }
});

test('favorites persist across remounts and can be removed independently', async () => {
  const view = render(<Database />);
  await screen.findByRole('img', { name: 'F2L 1 case', hidden: true });
  document.querySelectorAll('details').forEach(group => { group.open = true; });
  fireEvent.click(screen.getByRole('button', { name: 'Favorite F2L 1 algorithm 1' }));
  fireEvent.click(screen.getByRole('button', { name: 'Favorite F2L 1 algorithm 2' }));
  fireEvent.click(screen.getByRole('button', { name: 'Favorite PLL 1 algorithm 1' }));
  view.unmount();
  render(<Database />);
  await screen.findByRole('img', { name: 'F2L 1 case', hidden: true });
  document.querySelectorAll('details').forEach(group => { group.open = true; });
  expect(screen.getByRole('button', { name: 'Unfavorite F2L 1 algorithm 1' }).getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(screen.getByRole('button', { name: 'Unfavorite F2L 1 algorithm 1' }));
  expect(screen.getByRole('button', { name: 'Favorite F2L 1 algorithm 1' }).getAttribute('aria-pressed')).toBe('false');
  expect(screen.getByRole('button', { name: 'Unfavorite F2L 1 algorithm 2' }).getAttribute('aria-pressed')).toBe('true');
  expect(screen.getByRole('button', { name: 'Unfavorite PLL 1 algorithm 1' }).getAttribute('aria-pressed')).toBe('true');
  expect(JSON.parse(localStorage.getItem('cuberplus-database-favorites')!)).toEqual(["F2L-1:R U2 R'", "PLL-1:R U R'"]);
});

test.each(['invalid JSON', '{}', 'null', '42'])('malformed saved favorites do not break the page: %s', async saved => {
  localStorage.setItem('cuberplus-database-favorites', saved);
  render(<Database />);
  await screen.findByRole('img', { name: 'F2L 1 case', hidden: true });
  document.querySelector('details')!.open = true;
  expect(screen.getByRole('button', { name: 'Favorite F2L 1 algorithm 1' })).toBeDefined();
});

test('blocked storage keeps stars usable and explains that they are not saved', async () => {
  const read = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Blocked'); });
  const save = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Blocked'); });
  try {
    render(<Database />);
    await screen.findByRole('img', { name: 'F2L 1 case', hidden: true });
    document.querySelector('details')!.open = true;
    fireEvent.click(screen.getByRole('button', { name: 'Favorite F2L 1 algorithm 1' }));
    expect(screen.getByRole('button', { name: 'Unfavorite F2L 1 algorithm 1' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('alert').textContent).toContain('could not be saved');
  } finally { read.mockRestore(); save.mockRestore(); }
});

test('legacy case favorites select only the original algorithm', async () => {
  localStorage.setItem('cuberplus-database-favorites', JSON.stringify(['F2L-1']));
  await act(async () => { render(<Database />); });
  document.querySelector('details')!.open = true;
  expect(screen.getByRole('button', { name: 'Unfavorite F2L 1 algorithm 1' }).getAttribute('aria-pressed')).toBe('true');
  expect(screen.getByRole('button', { name: 'Favorite F2L 1 algorithm 2' }).getAttribute('aria-pressed')).toBe('false');
});

test('another tab can update individual favorites without reloading', async () => {
  await act(async () => { render(<Database />); });
  document.querySelector('details')!.open = true;
  localStorage.setItem('cuberplus-database-favorites', JSON.stringify(["F2L-1:R U2 R'"]));
  fireEvent(window, new StorageEvent('storage', { key: 'cuberplus-database-favorites' }));
  expect(screen.getByRole('button', { name: 'Unfavorite F2L 1 algorithm 2' }).getAttribute('aria-pressed')).toBe('true');
});
