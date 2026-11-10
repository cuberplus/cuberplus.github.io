/** @jest-environment jsdom */
import { createRef } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { FilterPanel } from '../../smartcubeanalyzer/src/Components/FilterPanel';
import { makeSolves } from './testUtils';

jest.mock('../../smartcubeanalyzer/src/Components/ChartPanel', () => ({ ChartPanel: () => null }));
beforeAll(() => Object.defineProperty(window, 'matchMedia', { configurable: true, value: () => ({
  matches: false, addListener: jest.fn(), removeListener: jest.fn(), addEventListener: jest.fn(), removeEventListener: jest.fn(),
}) }));
afterEach(() => { cleanup(); jest.useRealTimers(); });
test('analyzer keeps its applied filters and chart data while a numeric filter is being retyped', () => {
  jest.useFakeTimers();
  const ref = createRef<FilterPanel>();
  const view = render(<FilterPanel ref={ref} solves={makeSolves(12)} />);
  act(() => ref.current!.showFilters());
  const input = document.getElementById('slowestSolve') as HTMLInputElement;
  const filtered = ref.current!.state.compressedSolves;
  fireEvent.change(input, { target: { value: '1' } });
  fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }));
  act(() => jest.advanceTimersByTime(500));
  expect(ref.current!.state.filters.slowestTime).toBe(300);
  const activeInput = document.getElementById('slowestSolve') as HTMLInputElement;
  fireEvent.change(activeInput, { target: { value: '' } });
  fireEvent.change(activeInput, { target: { value: '2' } });
  act(() => jest.advanceTimersByTime(200));
  fireEvent.change(activeInput, { target: { value: '25' } });
  act(() => jest.advanceTimersByTime(200));
  expect(ref.current!.state.filters.slowestTime).toBe(300);
  expect(ref.current!.state.compressedSolves).toEqual(filtered);
  expect(activeInput.value).toBe('25');
  act(() => jest.advanceTimersByTime(250));
  expect(ref.current!.state.filters.slowestTime).toBe(25);
  expect(ref.current!.state.compressedSolves).not.toBe(filtered);
  fireEvent.change(activeInput, { target: { value: '1' } });
  fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }));
  act(() => jest.advanceTimersByTime(500));
  expect(ref.current!.state.filters.slowestTime).toBe(300);
  view.unmount();
});

test.each(['startDate', 'endDate'] as const)('analyzer waits for a valid, settled %s without applying cleared or incomplete edits', field => {
  jest.useFakeTimers();
  const ref = createRef<FilterPanel>();
  render(<FilterPanel ref={ref} solves={makeSolves(12)} />);
  act(() => ref.current!.showFilters());
  const input = document.getElementById(field) as HTMLInputElement;
  const original = ref.current!.state.filters[field];
  const filtered = ref.current!.state.compressedSolves;
  fireEvent.change(input, { target: { value: '' } });
  act(() => jest.advanceTimersByTime(500));
  expect(ref.current!.state.filters[field]).toBe(original);
  fireEvent.change(input, { target: { value: '01/02/2024' } });
  act(() => jest.advanceTimersByTime(200));
  fireEvent.change(input, { target: { value: 'not a date' } });
  act(() => jest.advanceTimersByTime(500));
  expect(ref.current!.state.filters[field]).toBe(original);
  expect(input.value).toBe('not a date');
  fireEvent.change(input, { target: { value: '01/02/2024' } });
  act(() => jest.advanceTimersByTime(200));
  fireEvent.change(input, { target: { value: '01/03/2024' } });
  act(() => jest.advanceTimersByTime(449));
  expect(input.value).toBe('01/03/2024');
  expect(ref.current!.state.filters[field]).toBe(original);
  expect(ref.current!.state.compressedSolves).toBe(filtered);
  act(() => jest.advanceTimersByTime(1));
  expect(ref.current!.state.filters[field].toDateString()).toBe(new Date(2024, 0, 3).toDateString());
  expect(ref.current!.state.compressedSolves).not.toBe(filtered);
});

test('date filters debounce independently and discard pending edits on reset or unmount', () => {
  jest.useFakeTimers();
  const ref = createRef<FilterPanel>();
  const view = render(<FilterPanel ref={ref} solves={makeSolves(12)} />);
  act(() => ref.current!.showFilters());
  for (const field of ['startDate', 'endDate']) {
    fireEvent.change(document.getElementById(field)!, { target: { value: '01/02/2024' } });
  }
  act(() => jest.advanceTimersByTime(450));
  expect(ref.current!.state.filters.startDate.toDateString()).toBe(new Date(2024, 0, 2).toDateString());
  expect(ref.current!.state.filters.endDate.toDateString()).toBe(new Date(2024, 0, 2).toDateString());
  fireEvent.change(document.getElementById('startDate')!, { target: { value: '01/03/2024' } });
  fireEvent.change(document.getElementById('endDate')!, { target: { value: '01/04/2024' } });
  fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }));
  const reset = ref.current!.state.filters;
  act(() => jest.advanceTimersByTime(500));
  expect(ref.current!.state.filters).toBe(reset);
  fireEvent.change(document.getElementById('startDate')!, { target: { value: '01/03/2024' } });
  const update = jest.spyOn(ref.current!, 'setFilter');
  view.unmount();
  act(() => jest.advanceTimersByTime(500));
  expect(update).not.toHaveBeenCalled();
});

test('calendar selection closes normally and applies after the debounce delay', () => {
  jest.useFakeTimers();
  const ref = createRef<FilterPanel>();
  render(<FilterPanel ref={ref} solves={makeSolves(12)} />);
  act(() => ref.current!.showFilters());
  const original = ref.current!.state.filters.startDate;
  fireEvent.click(document.getElementById('startDate')!);
  const day = document.querySelector('.react-datepicker__day:not(.react-datepicker__day--outside-month):not(.react-datepicker__day--selected)')!;
  const selected = new Date(original.getFullYear(), original.getMonth(), Number(day.textContent));
  fireEvent.click(day);
  expect(document.querySelector('.react-datepicker')).toBeNull();
  expect(ref.current!.state.filters.startDate).toBe(original);
  act(() => jest.advanceTimersByTime(450));
  expect(ref.current!.state.filters.startDate.toDateString()).toBe(selected.toDateString());
});
