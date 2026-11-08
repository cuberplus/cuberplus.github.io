import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import Database from '../database/Database';
import { loadCube } from '../../timer/src/puzzle';
import { discoverFavorites } from '../../timer/src/favoriteAlgorithms';

jest.mock('../../timer/src/puzzle', () => ({ loadCube: jest.fn().mockResolvedValue({}) }));
jest.mock('../../timer/src/storage', () => ({ readSolves: jest.fn().mockResolvedValue([]) }));
jest.mock('../../timer/src/favoriteAlgorithms', () => ({
  validateUserAlgorithm: (_entry: object, algorithm: string) => {
    if (algorithm === 'bad') throw new Error('This algorithm does not match the selected case.');
    return algorithm;
  },
  discoverFavorites: jest.fn().mockResolvedValue(new Set(["OLL-1:R U R'"])),
  learnAlgorithms: jest.fn().mockResolvedValue(new Set()),
}));
jest.mock('../database/algorithms', () => ({
  algorithms: ['F2L', 'AF2L', 'OLL', 'PLL'].map(category => ({
    category, id: '1', algorithm: "R U R'",
    options: category === 'F2L' || category === 'PLL' ? ["R U R'", "R U2 R'", "R U' R'", "R2 U R2", "F U F'"] : ["R U R'", "R U2 R'"],
  })),
  categories: ['F2L', 'AF2L', 'OLL', 'PLL'],
}));
jest.mock('../database/caseImages.json', () => Object.fromEntries(['F2L', 'AF2L', 'OLL', 'PLL'].map(category => [
  `${category}-1`, { facelets: 'UUUUUUUUURRRRRRRRRFFFFFFFFFDDDDDDDDDLLLLLLLLLBBBBBBBBB', visibleStickers: [] },
])));
const scrollIntoView = jest.fn();
beforeAll(() => Object.defineProperty(HTMLElement.prototype, 'scrollIntoView', { configurable: true, value: scrollIntoView }));
beforeEach(() => {
  localStorage.clear(); history.replaceState(null, '', '/database/'); scrollIntoView.mockClear();
  jest.mocked(loadCube).mockClear();
});
afterEach(cleanup);
test('Un-Favorite All respects cancellation and preserves custom algorithms and Unlearn selections', async () => {
  const custom = { 'F2L-1': ["F R U R' U' F'"] }, unlearn = ["F2L-1:R U2 R'"];
  localStorage.setItem('cuberplus-custom-algorithms', JSON.stringify(custom));
  localStorage.setItem('cuberplus-unlearn-algorithms', JSON.stringify(unlearn));
  localStorage.setItem('cuberplus-database-favorites', JSON.stringify(["F2L-1:R U R'", "PLL-1:R U R'"]));
  const confirm = jest.spyOn(window, 'confirm').mockReturnValueOnce(false).mockReturnValueOnce(true);
  try {
    render(<Database />); await openGroup();
    fireEvent.click(screen.getByRole('button', { name: 'Un-Favorite All' }));
    expect(screen.getByRole('button', { name: 'Unfavorite F2L 1 algorithm 1' })).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Un-Favorite All' }));
    expect(localStorage.getItem('cuberplus-database-favorites')).toBe('[]');
    expect(JSON.parse(localStorage.getItem('cuberplus-custom-algorithms')!)).toEqual(custom);
    expect(JSON.parse(localStorage.getItem('cuberplus-unlearn-algorithms')!)).toEqual(unlearn);
    expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Un-Favorite All' }).disabled).toBe(true);
  } finally { confirm.mockRestore(); }
});
test('an embedded case shows only that case and ignores page hashes without scrolling the parent', async () => {
  history.replaceState(null, '', '/timer/#PLL-1');
  render(<Database caseKey="OLL-1" />);
  await screen.findByRole('img', { name: 'OLL 1 case' });
  expect(document.querySelectorAll('.database-case')).toHaveLength(1);
  expect(document.querySelector('header')).toBeNull();
  expect(screen.queryByRole('button', { name: 'Un-Favorite All' })).toBeNull();
  fireEvent(window, new HashChangeEvent('hashchange'));
  expect(scrollIntoView).not.toHaveBeenCalled();
});
async function openGroup(category = 'F2L') {
  const group = Array.from(document.querySelectorAll('details')).find(group =>
    group.querySelector('summary')!.textContent!.startsWith(category === 'AF2L' ? 'Advanced F2L' : category))!;
  group.open = true; fireEvent(group, new Event('toggle'));
  await screen.findByRole('img', { name: `${category} 1 case` });
  return group;
}

test.each(['F2L', 'AF2L', 'OLL', 'PLL'])('a direct %s link renders and reveals only its group without loading a cube', async category => {
  history.replaceState(null, '', `/database/#${category}-1`);
  render(<Database />);
  const image = await screen.findByRole('img', { name: `${category} 1 case` });
  const target = image.closest('article')!;
  expect(target.closest('details')!.open).toBe(true);
  expect(document.querySelectorAll('details[open]')).toHaveLength(1);
  expect(document.querySelectorAll('.database-case')).toHaveLength(1);
  expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start' });
  expect(target.classList.contains('database-case--linked')).toBe(true);
  expect(loadCube).not.toHaveBeenCalled();
});
test('collapsed groups do not render case rows or run cube algorithms on page load', async () => {
  render(<Database />);
  expect(document.querySelectorAll('details')).toHaveLength(4);
  expect(document.querySelectorAll('.database-case')).toHaveLength(0);
  const group = await openGroup();
  expect(within(group).getByText("R U R'")).toBeDefined();
  expect(within(group).getByText("R U2 R'")).toBeDefined();
  expect(loadCube).not.toHaveBeenCalled();
});
test('hash changes reveal the requested case while unknown fragments do nothing', async () => {
  render(<Database />);
  for (const hash of ['#PLL-1', '#unknown']) {
    history.replaceState(null, '', `/database/${hash}`);
    fireEvent(window, new HashChangeEvent('hashchange'));
  }
  await screen.findByRole('img', { name: 'PLL 1 case' });
  expect(document.getElementById('PLL-1')!.closest('details')!.open).toBe(true);
  expect(scrollIntoView).toHaveBeenCalledTimes(1);
});
test('only the first three curated algorithms appear until that case is expanded', async () => {
  render(<Database />);
  const group = await openGroup();
  expect(Array.from(group.querySelectorAll('.database-algorithm p'), node => node.textContent)).toEqual(["R U R'", "R U2 R'", "R U' R'"]);
  const expand = within(group).getByRole('button', { name: 'Show all F2L 1 algorithms' });
  expect(expand.getAttribute('aria-expanded')).toBe('false');
  fireEvent.click(expand);
  expect(group.querySelectorAll('.database-algorithm')).toHaveLength(5);
  fireEvent.click(within(group).getByRole('button', { name: 'Favorite F2L 1 algorithm 4' }));
  fireEvent.click(within(group).getByRole('button', { name: 'Unlearn F2L 1 algorithm 5' }));
  const other = await openGroup('PLL');
  expect(other.querySelectorAll('.database-algorithm')).toHaveLength(3);
  fireEvent.click(within(group).getByRole('button', { name: 'Show fewer F2L 1 algorithms' }));
  expect(group.querySelectorAll('.database-algorithm')).toHaveLength(3);
  fireEvent.click(within(group).getByRole('button', { name: 'Show all F2L 1 algorithms' }));
  expect(within(group).getByRole('button', { name: 'Unfavorite F2L 1 algorithm 4' }).getAttribute('aria-pressed')).toBe('true');
  expect(within(group).getByRole('button', { name: 'Keep F2L 1 algorithm 5' }).getAttribute('aria-pressed')).toBe('true');
  expect(loadCube).not.toHaveBeenCalled();
});
test('cases with three or fewer algorithms need no expand control', async () => {
  render(<Database />);
  const group = await openGroup('OLL');
  expect(group.querySelectorAll('.database-algorithm')).toHaveLength(2);
  expect(within(group).queryByRole('button', { name: /Show all/ })).toBeNull();
});
test('starred algorithms move first and remain visible when collapsed and after reloading', async () => {
  const view = render(<Database />);
  const group = await openGroup();
  fireEvent.click(within(group).getByRole('button', { name: 'Show all F2L 1 algorithms' }));
  fireEvent.click(within(group).getByRole('button', { name: 'Favorite F2L 1 algorithm 4' }));
  expect(group.querySelector('.database-algorithm p')!.textContent).toBe('R2 U R2');
  fireEvent.click(within(group).getByRole('button', { name: 'Unlearn F2L 1 algorithm 4' }));
  expect(JSON.parse(localStorage.getItem('cuberplus-unlearn-algorithms')!)).toEqual(['F2L-1:R2 U R2']);
  fireEvent.click(within(group).getByRole('button', { name: 'Show fewer F2L 1 algorithms' }));
  expect(group.querySelectorAll('.database-algorithm')).toHaveLength(3);
  expect(group.querySelector('.database-algorithm p')!.textContent).toBe('R2 U R2');
  view.unmount(); render(<Database />);
  const reloaded = await openGroup();
  expect(reloaded.querySelector('.database-algorithm p')!.textContent).toBe('R2 U R2');
  fireEvent.click(within(reloaded).getByRole('button', { name: 'Unfavorite F2L 1 algorithm 4' }));
  expect(Array.from(reloaded.querySelectorAll('.database-algorithm p'), node => node.textContent)).toEqual(["R U R'", "R U2 R'", "R U' R'"]);
});
test('favorites and unlearn flags persist and can be toggled independently', async () => {
  const view = render(<Database />); await openGroup();
  fireEvent.click(screen.getByRole('button', { name: 'Favorite F2L 1 algorithm 1' }));
  fireEvent.click(screen.getByRole('button', { name: 'Favorite F2L 1 algorithm 2' }));
  fireEvent.click(screen.getByRole('button', { name: 'Unlearn F2L 1 algorithm 2' }));
  view.unmount(); render(<Database />); await openGroup();
  expect(screen.getByRole('button', { name: 'Keep F2L 1 algorithm 2' }).getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(screen.getByRole('button', { name: 'Unfavorite F2L 1 algorithm 1' }));
  expect(screen.getByRole('button', { name: 'Unfavorite F2L 1 algorithm 2' }).getAttribute('aria-pressed')).toBe('true');
  expect(JSON.parse(localStorage.getItem('cuberplus-database-favorites')!)).toEqual(["F2L-1:R U2 R'"]);
  fireEvent.click(screen.getByRole('button', { name: 'Keep F2L 1 algorithm 2' }));
  expect(JSON.parse(localStorage.getItem('cuberplus-unlearn-algorithms')!)).toEqual([]);
});
test.each(['invalid JSON', '{}', 'null', '42'])('malformed saved favorites are ignored: %s', async saved => {
  localStorage.setItem('cuberplus-database-favorites', saved); render(<Database />); await openGroup();
  expect(screen.getByRole('button', { name: 'Favorite F2L 1 algorithm 1' })).toBeDefined();
});
test('blocked storage keeps stars usable and explains that they are not saved', async () => {
  const read = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Blocked'); });
  const save = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Blocked'); });
  try {
    render(<Database />); await openGroup();
    fireEvent.click(screen.getByRole('button', { name: 'Favorite F2L 1 algorithm 1' }));
    expect(screen.getByRole('button', { name: 'Unfavorite F2L 1 algorithm 1' }).getAttribute('aria-pressed')).toBe('true');
    expect(screen.getByRole('alert').textContent).toContain('could not be saved');
  } finally { read.mockRestore(); save.mockRestore(); }
});
test('legacy favorites and cross-tab preference updates are retained', async () => {
  localStorage.setItem('cuberplus-database-favorites', JSON.stringify(['F2L-1']));
  render(<Database />); await openGroup();
  expect(screen.getByRole('button', { name: 'Unfavorite F2L 1 algorithm 1' })).toBeDefined();
  localStorage.setItem('cuberplus-database-favorites', JSON.stringify(["F2L-1:R U2 R'"]));
  fireEvent(window, new StorageEvent('storage', { key: 'cuberplus-database-favorites' }));
  expect(screen.getByRole('button', { name: 'Unfavorite F2L 1 algorithm 2' })).toBeDefined();
});
test('manual algorithms are validated on submit, saved, and can be favorited after remount', async () => {
  const view = render(<Database />);
  fireEvent.click(screen.getByRole('button', { name: 'Add your own algorithm' }));
  fireEvent.change(screen.getByLabelText('Algorithm'), { target: { value: 'bad' } });
  fireEvent.click(screen.getByRole('button', { name: 'Add algorithm', exact: true }));
  expect((await screen.findByRole('status')).textContent).toContain('does not match');
  fireEvent.change(screen.getByLabelText('Algorithm'), { target: { value: "F R U R' U' F'" } });
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Add algorithm', exact: true })));
  expect(screen.getByText('Algorithm added.')).toBeDefined();
  fireEvent.click(screen.getByRole('button', { name: 'Favorite F2L 1 algorithm 6' }));
  view.unmount(); render(<Database />); await openGroup();
  fireEvent.click(screen.getByRole('button', { name: 'Show all F2L 1 algorithms' }));
  expect(screen.getByText("F (R U R' U') F'")).toBeDefined();
  expect(screen.getByRole('button', { name: 'Unfavorite F2L 1 algorithm 6' })).toBeDefined();
});
test('the add-algorithm form has an explicit close button that does not save the draft', async () => {
  render(<Database />);
  fireEvent.click(screen.getByRole('button', { name: 'Add your own algorithm' }));
  fireEvent.change(screen.getByLabelText('Algorithm'), { target: { value: "F R U R' U' F'" } });
  fireEvent.click(screen.getByRole('button', { name: 'Close add algorithm' }));
  expect(screen.queryByLabelText('Algorithm')).toBeNull();
  expect(screen.getByRole('button', { name: 'Add your own algorithm' }).getAttribute('aria-expanded')).toBe('false');
  expect(localStorage.getItem('cuberplus-custom-algorithms')).toBeNull();
  expect(loadCube).not.toHaveBeenCalled();
});
test('deleting a custom algorithm persists, cleans up only its preferences and preserves other cases', async () => {
  const algorithm = "F R U R' U' F'", remaining = "B R U R' U' B'";
  localStorage.setItem('cuberplus-custom-algorithms', JSON.stringify({ 'F2L-1': [algorithm, remaining], 'PLL-1': [algorithm] }));
  localStorage.setItem('cuberplus-database-favorites', JSON.stringify([`F2L-1:${algorithm}`, "F2L-1:R U R'", `PLL-1:${algorithm}`]));
  localStorage.setItem('cuberplus-unlearn-algorithms', JSON.stringify([`F2L-1:${algorithm}`, "F2L-1:R U2 R'", `PLL-1:${algorithm}`]));
  const view = render(<Database />);
  const group = await openGroup();
  const remove = within(group).getByRole('button', { name: 'Delete F2L 1 algorithm 6' });
  expect(remove.nextElementSibling!.getAttribute('aria-label')).toBe('Keep F2L 1 algorithm 6');
  fireEvent.click(remove);
  expect(within(group).queryByText("F (R U R' U') F'")).toBeNull();
  expect(JSON.parse(localStorage.getItem('cuberplus-custom-algorithms')!)).toEqual({ 'F2L-1': [remaining], 'PLL-1': [algorithm] });
  expect(JSON.parse(localStorage.getItem('cuberplus-database-favorites')!)).toEqual(["F2L-1:R U R'", `PLL-1:${algorithm}`]);
  expect(JSON.parse(localStorage.getItem('cuberplus-unlearn-algorithms')!)).toEqual(["F2L-1:R U2 R'", `PLL-1:${algorithm}`]);
  view.unmount(); render(<Database />);
  const reloaded = await openGroup();
  fireEvent.click(within(reloaded).getByRole('button', { name: 'Show all F2L 1 algorithms' }));
  expect(reloaded.querySelectorAll('.database-algorithm')).toHaveLength(6);
  expect(within(reloaded).queryByText("F (R U R' U') F'")).toBeNull();
  const other = await openGroup('PLL');
  expect(within(other).getByText("F (R U R' U') F'")).toBeDefined();
  expect(loadCube).not.toHaveBeenCalled();
});
test('built-in algorithms cannot be deleted even if duplicated in custom storage', async () => {
  localStorage.setItem('cuberplus-custom-algorithms', JSON.stringify({ 'F2L-1': ["R U R'"] }));
  render(<Database />);
  const group = await openGroup();
  expect(within(group).queryByRole('button', { name: /^Delete / })).toBeNull();
  expect(within(group).getByText("R U R'")).toBeDefined();
});
test('a failed delete retains the algorithm and preferences and reports the failure', async () => {
  const algorithm = "F R U R' U' F'";
  localStorage.setItem('cuberplus-custom-algorithms', JSON.stringify({ 'F2L-1': [algorithm] }));
  localStorage.setItem('cuberplus-database-favorites', JSON.stringify([`F2L-1:${algorithm}`]));
  localStorage.setItem('cuberplus-unlearn-algorithms', JSON.stringify([`F2L-1:${algorithm}`]));
  render(<Database />); await openGroup();
  const save = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Blocked'); });
  try {
    fireEvent.click(screen.getByRole('button', { name: 'Delete F2L 1 algorithm 6' }));
    expect(screen.getByRole('status').textContent).toBe('Algorithm could not be deleted.');
    expect(screen.getByRole('button', { name: 'Unfavorite F2L 1 algorithm 6' })).toBeDefined();
    expect(screen.getByRole('button', { name: 'Keep F2L 1 algorithm 6' })).toBeDefined();
    expect(JSON.parse(localStorage.getItem('cuberplus-custom-algorithms')!)).toEqual({ 'F2L-1': [algorithm] });
  } finally { save.mockRestore(); }
});
test('deleting the last custom algorithm removes its case entry without changing built-ins', async () => {
  localStorage.setItem('cuberplus-custom-algorithms', JSON.stringify({ 'F2L-1': ["F R U R' U' F'"] }));
  render(<Database />);
  const group = await openGroup();
  fireEvent.click(within(group).getByRole('button', { name: 'Show all F2L 1 algorithms' }));
  fireEvent.click(within(group).getByRole('button', { name: 'Delete F2L 1 algorithm 6' }));
  expect(JSON.parse(localStorage.getItem('cuberplus-custom-algorithms')!)).toEqual({});
  expect(group.querySelectorAll('.database-algorithm')).toHaveLength(5);
  expect(within(group).queryByRole('button', { name: /^Delete / })).toBeNull();
});
test('database exposes the shared favorite discovery and learning actions', async () => {
  jest.spyOn(window, 'confirm').mockReturnValue(true);
  render(<Database />);
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Automatically find favorites' })));
  expect(screen.getByText(/Added 1 favorite/)).toBeDefined();
  expect(screen.getByRole('button', { name: 'Learn algorithms from solves' })).toBeDefined();
  jest.restoreAllMocks();
});
test('discovery and learning share one dismissible notification outside the action toolbar', async () => {
  jest.spyOn(window, 'confirm').mockReturnValue(true);
  render(<Database />);
  const button = screen.getByRole('button', { name: 'Automatically find favorites' });
  const toolbar = button.parentElement!.parentElement!;
  await act(async () => fireEvent.click(button));
  const notice = screen.getByRole('complementary', { name: 'Algorithm notification' });
  expect(toolbar.contains(notice)).toBe(false);
  expect(within(notice).getByRole('status').textContent).toContain('Added 1 favorite');
  expect(within(notice).getByRole('alert').textContent).toContain('Missing favorites');
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Learn algorithms from solves' })));
  expect(screen.getAllByRole('complementary', { name: 'Algorithm notification' })).toHaveLength(1);
  expect(within(notice).getByRole('status').textContent).toContain('Learned 0 algorithms');
  expect(within(notice).queryByRole('alert')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Dismiss algorithm notification' }));
  expect(screen.queryByRole('complementary', { name: 'Algorithm notification' })).toBeNull();
  jest.restoreAllMocks();
});
test('a failed discovery reports an actionable notification without changing favorites', async () => {
  jest.spyOn(window, 'confirm').mockReturnValue(true);
  jest.mocked(discoverFavorites).mockRejectedValueOnce(new Error('Failed to analyze'));
  localStorage.setItem('cuberplus-database-favorites', JSON.stringify(["F2L-1:R U2 R'"]));
  render(<Database />);
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Automatically find favorites' })));
  const notice = screen.getByRole('complementary', { name: 'Algorithm notification' });
  expect(within(notice).getByRole('alert').textContent).toContain('Your existing favorites have not changed');
  expect(JSON.parse(localStorage.getItem('cuberplus-database-favorites')!)).toEqual(["F2L-1:R U2 R'"]);
  jest.restoreAllMocks();
});
