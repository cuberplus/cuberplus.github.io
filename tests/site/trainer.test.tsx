import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import Trainer from '../../src/trainer/Trainer';
import { readBlitzRuns, readBlitzSettings } from '../../src/trainer/blitz';
import { CasePractice } from '../../src/trainer/CasePractice';
import type { BlitzRun } from '../../src/trainer/blitz';
import { PageLocation, PageVisible } from '@cuberplus/navigation';
import { cubeConnection, type CubeEvent } from '../../shared/cube/connection';

jest.mock('../../src/trainer/blitz', () => ({
  readBlitzRuns: jest.fn(),
  readBlitzSettings: () => ({ upcomingCases: true, caseNames: true, hidePLL: false, crossColor: 'Yellow', frontColor: 'Green' }),
  cubeColors: ['Yellow', 'Green'], adjacentColors: () => true,
}));
jest.mock('../../timer/src/Core/puzzle', () => ({ loadCube: async () => null }));
jest.mock('../../timer/src/Analysis/cfop', () => ({}));
jest.mock('../../timer/src/Components/CubeView', () => ({ CubeView: () => null }));
jest.mock('../../src/database/CaseImage', () => ({ __esModule: true, default: () => null }));
jest.mock('../../src/trainer/BlitzCaseImage', () => ({ BlitzCaseImage: () => null }));
jest.mock('../../src/trainer/SolutionProgress', () => ({ SolutionProgress: () => null }));
jest.mock('../../shared/cube/connection', () => ({
  useCubeConnection: () => ({ connection: null, cubes: [], selected: '', battery: null, connecting: false, error: '' }), cubeConnection: { onEvent: jest.fn(() => () => {}) },
}));
const runs: BlitzRun[] = [
  { id: 'pll-best', kind: 'PLL', date: '2026-01-03T12:00:00Z', milliseconds: 8000, splits: [
    { caseId: 'T', milliseconds: 5000, recognitionMilliseconds: 1000, executionMilliseconds: 4000, preAuf: 'U', postAuf: '' },
    { caseId: 'Ja', milliseconds: 3000, recognitionMilliseconds: 500, executionMilliseconds: 2500 },
  ], settings: { upcomingCases: true, caseNames: false, hidePLL: false, crossColor: 'Yellow', frontColor: 'Green' } },
  { id: 'pll-other', kind: 'PLL', date: '2026-01-02T12:00:00Z', milliseconds: 10000, splits: [] },
  { id: 'oll-old', kind: 'OLL', date: '2026-01-01T12:00:00Z', milliseconds: 12000, splits: [{ caseId: '1', milliseconds: 12000 }] },
];
beforeEach(() => {
  localStorage.clear();
  Object.defineProperty(globalThis.crypto, 'randomUUID', { configurable: true, value: () => `training-${Math.random()}` });
  jest.mocked(readBlitzRuns).mockReturnValue(runs);
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: function(this: HTMLDialogElement) { this.open = false; } });
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function(this: HTMLDialogElement) { this.open = true; } });
});
test('custom trainings mix categories, renaming keeps identity, and a new same-name training stays separate', async () => {
  render(<Trainer />);
  fireEvent.click(await screen.findByRole('button', { name: 'Make your own drill' }));
  fireEvent.click(screen.getByRole('button', { name: 'Create training' }));
  fireEvent.change(screen.getByLabelText('Training name'), { target: { value: 'Mixed practice' } });
  for (const category of ['F2L', 'OLL', 'PLL']) {
    fireEvent.click(screen.getByText(`${category} cases (0 selected)`));
    fireEvent.click(screen.getByRole('checkbox', { name: `${category} ${category === 'PLL' ? 'T' : '1'}`, exact: true }));
  }
  fireEvent.click(screen.getByRole('button', { name: 'Save training' }));
  const key = 'cuberplus-trainer-custom-v1', [first] = JSON.parse(localStorage.getItem(key)!);
  expect(first.cases).toEqual(['F2L-1', 'OLL-1', 'PLL-T']);
  fireEvent.click(screen.getByRole('button', { name: 'Edit training' }));
  fireEvent.change(screen.getByLabelText('Training name'), { target: { value: 'Renamed' } });
  fireEvent.click(screen.getByRole('button', { name: 'Save training' }));
  expect(JSON.parse(localStorage.getItem(key)!)).toEqual([{ ...first, name: 'Renamed' }]);
  fireEvent.click(screen.getByRole('button', { name: 'Create training' }));
  fireEvent.change(screen.getByLabelText('Training name'), { target: { value: 'Renamed' } });
  fireEvent.click(screen.getByText('PLL cases (0 selected)'));
  fireEvent.click(screen.getByRole('checkbox', { name: 'PLL T', exact: true }));
  fireEvent.click(screen.getByRole('button', { name: 'Save training' }));
  expect(JSON.parse(localStorage.getItem(key)!)).toHaveLength(2);
});
test('mistake deep links open single-case mode and update an already mounted trainer', async () => {
  const view = render(<PageLocation.Provider value="/trainer/?case=OLL-27"><Trainer /></PageLocation.Provider>);
  expect(await screen.findByRole('heading', { name: /OLL 27 drill/ })).toBeDefined();
  expect(screen.queryByRole('button', { name: 'Practice OLL 27', exact: true })).toBeNull();
  view.rerender(<PageLocation.Provider value="/trainer/?case=PLL-T"><Trainer /></PageLocation.Provider>);
  expect(await screen.findByRole('heading', { name: /PLL T drill/ })).toBeDefined();
  expect(screen.getByRole('option', { name: 'Use my own solution' })).toBeDefined();
});
test('single-case entry has no selection and collapsed groups; choosing a case immediately opens its drill', async () => {
  const view = render(<Trainer />);
  fireEvent.click(await screen.findByRole('button', { name: 'Single-case drill' }));
  expect(view.container.querySelector('.trainer-practice')?.getAttribute('data-case')).toBeNull();
  expect(view.container.querySelectorAll('.trainer-picker details[open]')).toHaveLength(0);
  expect(screen.queryByRole('button', { name: 'Start practice' })).toBeNull();
  fireEvent.click(screen.getByText('PLL cases (0 selected)'));
  const choice = screen.getByRole('button', { name: 'Practice PLL T', exact: true });
  choice.focus();
  expect(screen.queryByRole('heading', { name: /PLL T drill/ })).toBeNull();
  fireEvent.click(choice);
  expect(screen.getByRole('heading', { name: /PLL T drill/ })).toBe(document.activeElement);
  expect(screen.getByRole('button', { name: 'Start practice' }).hasAttribute('disabled')).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: 'Back to cases' }));
  expect(screen.queryByRole('button', { name: 'Start practice' })).toBeNull();
});
test('returning to the same mistake link restores its case after manually selecting another', async () => {
  const trainer = (visible: boolean, address: string) => <PageVisible.Provider value={visible}><PageLocation.Provider value={address}><Trainer /></PageLocation.Provider></PageVisible.Provider>;
  const view = render(trainer(true, '/trainer/?case=OLL-27'));
  await screen.findByRole('heading', { name: /OLL 27 drill/ });
  fireEvent.click(screen.getByRole('button', { name: 'Back to cases' }));
  fireEvent.click(screen.getByText('PLL cases (0 selected)'));
  fireEvent.click(screen.getByRole('button', { name: 'Practice PLL T', exact: true }));
  view.rerender(trainer(false, '/timer/'));
  view.rerender(trainer(true, '/trainer/?case=OLL-27'));
  expect(screen.getByRole('heading', { name: /OLL 27 drill/ })).toBeDefined();
});
afterEach(cleanup);

test('Trainer shows Options only within a drill and keeps it last beside the title', async () => {
  const view = render(<Trainer />);
  await screen.findByRole('button', { name: 'PLL Blitz' });
  const actions = view.container.querySelector('.page-heading > .page-actions')!;
  expect(screen.queryByRole('button', { name: 'Options', exact: true })).toBeNull();
  expect(actions.querySelector('[aria-label="Bluetooth cube setup"]')?.textContent).toContain('Cube');
  const setup = view.container.querySelector<HTMLDialogElement>('#trainer-cube-title')!.closest('dialog')!;
  expect(setup.open).toBe(false);
  fireEvent.click(screen.getByRole('button', { name: 'Bluetooth cube setup' }));
  expect(setup.open).toBe(true);
  expect(within(setup).getByRole('button', { name: 'Connect cube' })).toBeDefined();
  setup.open = false;
  fireEvent.click(screen.getByRole('button', { name: 'PLL Blitz' }));
  expect(actions.lastElementChild?.getAttribute('aria-label')).toBe('Options');
  fireEvent.click(screen.getByRole('button', { name: 'Options', exact: true }));
  expect(view.container.querySelector<HTMLDialogElement>('.trainer-settings')!.open).toBe(true);
});
test('Options are scoped to flashcards, OLL/PLL Blitz and the chosen single case', async () => {
  render(<Trainer />);
  const open = () => fireEvent.click(screen.getByRole('button', { name: 'Options', exact: true }));
  fireEvent.click(await screen.findByRole('button', { name: 'Orientation Flashcards', exact: true }));
  open();
  const flashcards = screen.getByRole('dialog', { name: 'Orientation Flashcards options', exact: true });
  expect(within(flashcards).getByLabelText('Top color')).toBeDefined();
  expect(within(flashcards).queryByRole('checkbox', { name: 'Random pre-AUF' })).toBeNull();
  expect(within(flashcards).queryByLabelText('Cross color')).toBeNull();
  fireEvent.click(within(flashcards).getByRole('button', { name: 'Close options' }));
  fireEvent.click(screen.getByRole('button', { name: 'Back to drills' }));
  for (const kind of ['PLL', 'OLL']) {
    fireEvent.click(screen.getByRole('button', { name: `${kind} Blitz`, exact: true }));
    open();
    const dialog = screen.getByRole('dialog', { name: `${kind} Blitz options`, exact: true });
    expect(!!within(dialog).queryByRole('checkbox', { name: /Hide PLL/ })).toBe(kind === 'OLL');
    expect(within(dialog).queryByLabelText('Cube state')).toBeNull();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Close options' }));
    fireEvent.click(screen.getByRole('button', { name: 'Back to drills' }));
  }
  fireEvent.click(screen.getByRole('button', { name: 'Single-case drill' }));
  fireEvent.click(screen.getByText('PLL cases (0 selected)'));
  fireEvent.click(screen.getByRole('button', { name: 'Practice PLL T', exact: true }));
  open();
  const practice = screen.getByRole('dialog', { name: /options$/, exact: false });
  expect(within(practice).getByRole('checkbox', { name: 'Random pre-AUF' })).toBeDefined();
  expect(within(practice).queryByRole('checkbox', { name: /Hide PLL/ })).toBeNull();
  expect(within(practice).queryByLabelText('Cube state')).toBeNull();
});
test('mistake practice timings sort raw durations and dates, keep DNF last ascending, and preserve rows and focus', async () => {
  const saved = [
    { id: 'a', date: '2026-11-24T12:00:00Z', recognitionMilliseconds: 9000, executionMilliseconds: 10000 },
    { id: 'b', date: '2026-11-22T12:00:00Z', recognitionMilliseconds: 11000, executionMilliseconds: 1000 },
    { id: 'c', date: '2026-11-23T12:00:00Z', recognitionMilliseconds: 2000, executionMilliseconds: 500, dnf: true },
  ].map(row => ({ ...row, caseKey: 'PLL-T', trainingId: 'single:PLL-T', algorithm: null }));
  localStorage.setItem('cuberplus-trainer-practice-v1', JSON.stringify([...saved, { ...saved[0], id: 'unrelated', trainingId: 'single:PLL-Ja' }]));
  render(<CasePractice cube={null} mode="single" initialCase="PLL-T" fixedCase settings={readBlitzSettings()} back={() => {}} />);
  const table = await screen.findByRole('table', { name: 'Completed practice attempts' });
  const body = table.querySelector('tbody'), rows = Array.from(table.querySelectorAll('tbody tr'));
  const values = (column: number) => Array.from(table.querySelectorAll('tbody tr'), row => row.children[column].textContent);
  expect(rows).toHaveLength(3);
  expect(table.querySelectorAll('th button')).toHaveLength(5);
  const recognition = within(table).getByRole('button', { name: 'Recognition', exact: true });
  recognition.focus(); fireEvent.click(recognition);
  expect(values(1)).toEqual(['2.00s', '9.00s', '11.00s']);
  expect(document.activeElement).toBe(recognition);
  expect(table.querySelector('tbody')).toBe(body);
  expect(Array.from(table.querySelectorAll('tbody tr'))).toEqual([rows[1], rows[0], rows[2]]);
  fireEvent.click(recognition);
  expect(values(1)).toEqual(['11.00s', '9.00s', '2.00s']);
  fireEvent.click(within(table).getByRole('button', { name: 'Execution', exact: true }));
  expect(values(2)).toEqual(['0.50s', '1.00s', '10.00s']);
  fireEvent.click(within(table).getByRole('button', { name: 'Result', exact: true }));
  expect(values(3)).toEqual(['12.00s', '19.00s', 'DNF']);
  fireEvent.click(within(table).getByRole('button', { name: 'Date', exact: true }));
  expect(Array.from(table.querySelectorAll('time'), time => time.dateTime)).toEqual([saved[1].date, saved[2].date, saved[0].date]);
  expect(table.querySelectorAll('th[aria-sort]')).toHaveLength(1);
  expect(table.querySelector('th[aria-sort]')?.getAttribute('aria-sort')).toBe('ascending');
});
test('Blitz history distinguishes totals, dates and bests per drill, and filters to the chosen drill', async () => {
  const view = render(<Trainer />);
  await screen.findByRole('button', { name: 'PLL Blitz' });
  expect(screen.queryByRole('heading', { name: 'Blitz history' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'PLL Blitz' }));
  await screen.findByText('2 runs');
  const summaries = Array.from(view.container.querySelectorAll('.trainer-run > summary'));
  expect(summaries.map(summary => summary.querySelector('.trainer-run-time')!.textContent)).toEqual(['8.00sBest', '10.00s']);
  expect(summaries[0].querySelector('time')!.dateTime).toBe(runs[0].date);
  expect(summaries[0].textContent).toContain('2 attempts');
  fireEvent.click(screen.getByRole('button', { name: 'Back to drills' }));
  expect(screen.queryByRole('heading', { name: 'Blitz history' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'OLL Blitz' }));
  expect(await screen.findByText('1 run')).toBeDefined();
  expect(view.container.querySelector('.trainer-run-time')!.textContent).toBe('12.00sBest');
});
test('history bests exclude DNFs, retain ties, and stay drill-specific when filtering', async () => {
  jest.mocked(readBlitzRuns).mockReturnValue([
    { ...runs[0], id: 'pll-dnf', milliseconds: 1000, dnf: true },
    runs[0], { ...runs[0], id: 'pll-tied' }, runs[1],
    { ...runs[2], dnf: true },
  ]);
  const view = render(<Trainer />);
  fireEvent.click(await screen.findByRole('button', { name: 'PLL Blitz' }));
  await screen.findByText('4 runs');
  const times = () => Array.from(view.container.querySelectorAll('.trainer-run-time'), time => time.textContent);
  expect(times()).toEqual(['DNF', '8.00sBest', '8.00sBest', '10.00s']);
  fireEvent.click(screen.getByRole('button', { name: 'Back to drills' }));
  fireEvent.click(screen.getByRole('button', { name: 'OLL Blitz' }));
  await screen.findByText('1 run');
  expect(times()).toEqual(['DNF']);
  fireEvent.click(screen.getByRole('button', { name: 'Back to drills' }));
  fireEvent.click(screen.getByRole('button', { name: 'PLL Blitz' }));
  await screen.findByText('4 runs');
  expect(times()).toEqual(['DNF', '8.00sBest', '8.00sBest', '10.00s']);
});
test('Blitz results retain separate retry rows, elapsed time, and attempt order when sorted', async () => {
  jest.mocked(readBlitzRuns).mockReturnValue([{ ...runs[0], milliseconds: 9000, splits: [
    { caseId: 'T', milliseconds: 1000, dnf: true, retry: true, recognitionMilliseconds: 600, executionMilliseconds: 400 },
    ...runs[0].splits,
  ] }]);
  const view = render(<Trainer />);
  fireEvent.click(await screen.findByRole('button', { name: 'PLL Blitz' }));
  await screen.findByText('1 run');
  const run = view.container.querySelector<HTMLDetailsElement>('.trainer-run')!;
  fireEvent.click(run.querySelector('summary')!);
  const table = within(run).getByRole('table');
  expect(table.querySelectorAll('tbody tr')).toHaveLength(3);
  const retry = within(table).getByText('Retry - DNF (1.00s)').closest('tr')!;
  expect(retry.firstElementChild!.textContent).toBe('1');
  expect(retry.textContent).toContain('PLL T');
  fireEvent.click(within(table).getByRole('button', { name: /^Order/ }));
  expect(table.querySelector('tbody tr')!.textContent).toContain('Retry - DNF (1.00s)');
  expect(run.querySelector('.trainer-run-time')!.textContent).toBe('9.00sBest');
});

test('expanding a run retains sortable splits and keeps setup and settings secondary', async () => {
  const view = render(<Trainer />);
  fireEvent.click(await screen.findByRole('button', { name: 'PLL Blitz' }));
  await screen.findByText('2 runs');
  const run = view.container.querySelector<HTMLDetailsElement>('.trainer-run')!;
  expect(run.open).toBe(false);
  fireEvent.click(run.querySelector('summary')!);
  expect(run.open).toBe(true);
  const table = within(run).getByRole('table');
  expect(table.querySelectorAll('th[scope="col"]')).toHaveLength(5);
  expect(run.querySelector<HTMLDetailsElement>('.trainer-run-options')!.open).toBe(false);
  const setup = run.querySelector<HTMLDetailsElement>('.trainer-case-setup')!;
  expect(setup.open).toBe(false);
  fireEvent.click(setup.querySelector('summary')!);
  expect(setup.textContent).toContain('Pre-AUF: U');
  fireEvent.click(within(table).getByRole('button', { name: /^Split/ }));
  expect(Array.from(table.querySelectorAll('tbody tr'), row => row.firstElementChild!.textContent)).toEqual(['2', '1']);
  fireEvent.click(within(table).getByRole('button', { name: /^Split/ }));
  expect(Array.from(table.querySelectorAll('tbody tr'), row => row.firstElementChild!.textContent)).toEqual(['1', '2']);
  fireEvent.click(screen.getByRole('button', { name: 'Back to drills' }));
  fireEvent.click(screen.getByRole('button', { name: 'OLL Blitz' }));
  const old = view.container.querySelector<HTMLDetailsElement>('.trainer-run')!;
  fireEvent.click(old.querySelector('summary')!);
  expect(within(old).getAllByText('Not recorded')).toHaveLength(4);
});
test('disconnecting does not add a redundant status message below the trainer', async () => {
  let receive: (event: CubeEvent) => void = () => {};
  jest.mocked(cubeConnection.onEvent).mockImplementationOnce(listener => { receive = listener; return () => {}; });
  render(<Trainer />);
  await screen.findByRole('button', { name: 'Orientation Flashcards', exact: true });
  act(() => receive({ type: 'DISCONNECT', timestamp: performance.now() }));
  expect(screen.queryByText('Cube disconnected.', { exact: true })).toBeNull();
});
