/** @jest-environment jsdom */
import { createRef } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { FilterPanel } from '../../smartcubeanalyzer/src/Components/FilterPanel';
import { makeSolves } from './testUtils';

jest.mock('../../smartcubeanalyzer/src/Components/ChartPanel', () => ({ ChartPanel: () => null }));
beforeAll(() => Object.defineProperty(window, 'matchMedia', { configurable: true, value: () => ({
    matches: false, addListener: jest.fn(), removeListener: jest.fn(), addEventListener: jest.fn(), removeEventListener: jest.fn(),
}) }));
afterEach(cleanup);

test('demo status stays compact and visible even after an old warning was dismissed', async () => {
    localStorage.setItem('testAlertDismissed', '1.1.14');
    const solves = makeSolves(12);
    const view = render(<FilterPanel solves={solves} source="Demo: Dev Solves" />);
    expect(screen.getByText('Demo', { exact: true }).className).toBe('analysis-demo');
    expect(screen.queryByRole('alert')).toBeNull();
    fireEvent.focus(screen.getByRole('button', { name: /^Demo: Dev Solves\./ }));
    expect((await screen.findByRole('tooltip')).textContent).toContain('Your saved solves are unchanged.');
    view.rerender(<FilterPanel solves={solves} source="Temporary CSV preview" />);
    expect(screen.queryByText('Demo', { exact: true })).toBeNull();
    expect(screen.getByText('Temporary CSV preview', { exact: true })).not.toBeNull();
    localStorage.removeItem('testAlertDismissed');
});

test('method and rolling-window settings remain in Filters but not in the page summary', () => {
    const ref = createRef<FilterPanel>();
    render(<FilterPanel ref={ref} solves={makeSolves(12)} />);
    const summary = document.querySelector('.analysis-summary')!;
    expect(summary.textContent).toContain('12 / 12 solves');
    expect(summary.textContent).not.toContain('CFOP');
    expect(summary.textContent).not.toContain('Window');
    fireEvent.click(screen.getByRole('button', { name: 'Open filters' }));
    expect(within(screen.getByRole('dialog')).getByText('Which Method?')).not.toBeNull();
    expect(within(screen.getByRole('dialog')).getByText('Sliding Window Size')).not.toBeNull();
});

test('active filters are counted and can be reset inside the filter panel', () => {
    const ref = createRef<FilterPanel>();
    render(<FilterPanel ref={ref} solves={makeSolves(12)} />);
    expect(screen.getByRole('button', { name: 'Open filters' }).textContent).toBe('Edit filters');
    act(() => ref.current!.setFilter('fastestTime', 10));
    const edit = screen.getByRole('button', { name: 'Open filters, 1 active' });
    expect(edit.textContent).toBe('Edit filters (1)');
    fireEvent.click(edit);
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Reset filters' }));
    act(() => ref.current!.hideFilters());
    expect(document.querySelector('.analysis-summary > button')!.textContent).toBe('Edit filters');
    expect(ref.current!.state.filters.fastestTime).toBe(0);
});
