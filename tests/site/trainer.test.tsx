import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import Trainer from '../../src/trainer/Trainer';
import { readBlitzRuns } from '../../src/trainer/blitz';
import type { BlitzRun } from '../../src/trainer/blitz';

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
jest.mock('../../shared/cube/connection', () => ({
  useCubeConnection: () => ({ connection: null, cubes: [], selected: '', battery: null, connecting: false, error: '' }), cubeConnection: { onEvent: () => () => {} },
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
  jest.mocked(readBlitzRuns).mockReturnValue(runs);
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: () => {} });
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function(this: HTMLDialogElement) { this.open = true; } });
});
afterEach(cleanup);

test('Trainer keeps Cube setup and Options beside its title with Options last', async () => {
  const view = render(<Trainer />);
  await screen.findByText('3 runs');
  const actions = view.container.querySelector('.page-heading > .page-actions')!;
  expect(actions.lastElementChild?.getAttribute('aria-label')).toBe('Options');
  expect(actions.querySelector('[aria-label="Bluetooth cube setup"]')?.textContent).toContain('Cube');
  const setup = view.container.querySelector<HTMLDialogElement>('#trainer-cube-title')!.closest('dialog')!;
  expect(setup.open).toBe(false);
  fireEvent.click(screen.getByRole('button', { name: 'Bluetooth cube setup' }));
  expect(setup.open).toBe(true);
  expect(within(setup).getByRole('button', { name: 'Connect cube' })).toBeDefined();
  setup.open = false;
  fireEvent.click(screen.getByRole('button', { name: 'Options', exact: true }));
  expect(view.container.querySelector<HTMLDialogElement>('.trainer-settings')!.open).toBe(true);
});
test('Blitz history distinguishes totals, dates and bests per drill, and filters to the chosen drill', async () => {
  const view = render(<Trainer />);
  await screen.findByText('3 runs');
  const summaries = Array.from(view.container.querySelectorAll('.trainer-run > summary'));
  expect(summaries.map(summary => summary.querySelector('.trainer-run-time')!.textContent)).toEqual(['8.00sBest', '10.00s', '12.00sBest']);
  expect(summaries[0].querySelector('time')!.dateTime).toBe(runs[0].date);
  expect(summaries[0].textContent).toContain('2 cases');
  fireEvent.click(screen.getByRole('button', { name: 'PLL Blitz' }));
  expect(await screen.findByText('2 runs')).toBeDefined();
  expect(view.container.querySelectorAll('.trainer-run')).toHaveLength(2);
});

test('expanding a run retains sortable splits and keeps setup and settings secondary', async () => {
  const view = render(<Trainer />);
  await screen.findByText('3 runs');
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
  const old = view.container.querySelectorAll<HTMLDetailsElement>('.trainer-run')[2];
  fireEvent.click(old.querySelector('summary')!);
  expect(within(old).getAllByText('Not recorded')).toHaveLength(4);
});
