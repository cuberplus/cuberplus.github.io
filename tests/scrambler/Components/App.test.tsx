import React from 'react';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import App from '../../../scrambler/src/Components/App';
import { GenerationEvent } from '../../../scrambler/src/cube/generation';
import { createSolverWorker } from '../../../scrambler/src/cube/workerClient';

jest.mock('../../../scrambler/src/cube/workerClient', () => ({ createSolverWorker: jest.fn() }));
const factory = jest.mocked(createSolverWorker);
let postMessage: jest.Mock, terminate: jest.Mock;
let onmessage: ((event: MessageEvent<GenerationEvent>) => void) | null;
let onerror: ((event: ErrorEvent) => void) | null;

beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function(this: HTMLDialogElement) { this.open = true; } });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: function(this: HTMLDialogElement) { this.open = false; } });
  postMessage = jest.fn(); terminate = jest.fn(); onmessage = null; onerror = null;
  factory.mockImplementation(() => ({
    postMessage, terminate,
    onmessageerror: null,
    addEventListener: jest.fn(), removeEventListener: jest.fn(), dispatchEvent: jest.fn(),
    get onmessage() { return onmessage; },
    set onmessage(value) { onmessage = value; },
    get onerror() { return onerror; },
    set onerror(value) { onerror = value; },
  }));
});

function worksheetButton() {
  if (!document.querySelector<HTMLDialogElement>('.settings-panel')!.open) fireEvent.click(screen.getByRole('button', { name: 'Options', exact: true }));
  return screen.getByRole('button', { name: /Generate worksheet/ });
}
function emit(data: GenerationEvent) {
  act(() => { onmessage?.({ data } as MessageEvent<GenerationEvent>); });
}
function addRows(attempts = 2, elapsedMs = 30) {
  for (const [id, count] of [[1, 7], [2, 3]]) {
    emit({ type: 'row', row: {
      id, scramble: 'R U F2', moves: Array(count).fill(0), algorithm: Array(count).fill('U').join(' '),
      cross: 'White', pairs: ['Blue / Red'], nodes: 50, elapsedMs: 2,
    } });
  }
  emit({ type: 'done', attempts, elapsedMs });
}

test('branding is CuberPlus with shared navigation and without a cube logo', () => {
  const { container } = render(<App />);
  const brand = screen.getByRole('link', { name: 'CuberPlus home' });
  expect(brand).toHaveAttribute('href', '/');
  expect(screen.getByRole('link', { name: 'Scrambler' })).toHaveAttribute('aria-current', 'page');
  expect(brand.querySelector('svg')).toBeNull();
  expect(container.querySelector('.empty-cube')).toBeNull();
});

test('the workspace starts below the header without a promotional intro', () => {
  render(<App />);
  expect(screen.getByRole('main').firstElementChild).toHaveTextContent('Scrambler');
  expect(screen.getByRole('main').querySelector('.workspace')).toBeInTheDocument();
  expect(screen.queryByText(/a better start to every solve/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/nothing sent to a server/i)).not.toBeInTheDocument();
  expect(screen.queryByText(/from the first edge/i)).not.toBeInTheDocument();
  expect(screen.getByText('Set your challenge')).toBeInTheDocument();
});

test('challenge controls open from the far-right page Options and close after generating', () => {
  const { container } = render(<App />);
  const dialog = container.querySelector<HTMLDialogElement>('.settings-panel')!;
  expect(dialog.open).toBe(false);
  expect(container.querySelector('.page-heading > .page-actions')!.lastElementChild).toHaveAttribute('aria-label', 'Options');
  addRows();
  fireEvent.click(screen.getByRole('button', { name: 'Options', exact: true }));
  expect(dialog.open).toBe(true);
  fireEvent.change(screen.getByLabelText('Number of scrambles'), { target: { value: '5' } });
  fireEvent.click(worksheetButton());
  expect(postMessage).toHaveBeenLastCalledWith(expect.objectContaining({ count: 5 }));
  expect(dialog.open).toBe(false);
  expect(screen.getByRole('button', { name: 'Stop generation' })).toBeEnabled();
});

test('initial generation requests 20 optimal X-Cross scrambles in a worker and keeps controls responsive', () => {
  render(<App />);
  expect(postMessage).toHaveBeenCalledWith(expect.objectContaining({
    mode: 'xcross', count: 20, minimum: 4, maximum: 8, metric: 'QTM',
  }));
  expect(screen.getByLabelText('Minimum turns')).toHaveValue(4);
  expect(worksheetButton()).toBeDisabled();
  expect(screen.getByText('Columns')).toBeEnabled();
  expect(screen.getByRole('progressbar')).toHaveAttribute('max', '20');
});

test('worksheet counts, tested scrambles and calculation time share one summary without extra copy', () => {
  const { container } = render(<App />);
  emit({ type: 'progress', attempts: 21, accepted: 0, elapsedMs: 1200 });
  const summary = container.querySelector<HTMLElement>('.row-summary')!;
  expect(summary).toHaveTextContent('21 scrambles tested');
  expect(within(summary).getByText('1.2s')).toBeInTheDocument();
  addRows(23, 3200);
  expect(summary).toHaveTextContent('02 / 20 scrambles');
  expect(within(summary).getByText('23 scrambles tested')).toBeInTheDocument();
  expect(within(summary).getByText('3.2s')).toHaveClass('elapsed');
  expect(screen.getAllByText('23 scrambles tested')).toHaveLength(1);
  expect(container.querySelector('.generation-status, .solver-note, .sheet-footer')).toBeNull();
  for (const copy of [/A full cross/i, /Aim for an even mix/i, /Optimal, not approximate/i, /Progress one turn/i, /Worksheet ready/i, /100% on your device/i]) {
    expect(screen.queryByText(copy)).not.toBeInTheDocument();
  }
});

test('rows are sorted by HTM, diagrams are inline SVGs, and column subsets and blank custom columns work', () => {
  render(<App />);
  addRows();
  let rows = screen.getAllByRole('row').slice(1);
  expect(within(rows[0]).getByText('3')).toBeInTheDocument();
  expect(within(rows[1]).getByText('7')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /# Turns Required/ }));
  expect(within(screen.getAllByRole('row')[1]).getByText('7')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /# Turns Required/ }));
  expect(within(screen.getByRole('table')).getAllByRole('img', { name: /Scrambled cube/ })).toHaveLength(2);
  fireEvent.click(screen.getByRole('checkbox', { name: 'Solution Algorithm' }));
  expect(screen.queryByRole('columnheader', { name: 'Solution Algorithm' })).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Add a blank column'), { target: { value: 'My first pair' } });
  fireEvent.click(screen.getByRole('button', { name: 'Add custom column' }));
  expect(screen.getByRole('columnheader', { name: 'My first pair' })).toBeInTheDocument();
  rows = screen.getAllByRole('row').slice(1);
  rows.forEach(row => expect(row.lastElementChild).toBeEmptyDOMElement());
  fireEvent.click(screen.getByRole('button', { name: 'Remove My first pair column' }));
  expect(screen.queryByRole('columnheader', { name: 'My first pair' })).not.toBeInTheDocument();
});

test('QTM is sent to the solver and used for worksheet counts and sorting without relabeling the previous batch', () => {
  const { container } = render(<App />);
  addRows();
  const metric = screen.getByLabelText('Move metric');
  fireEvent.change(metric, { target: { value: 'HTM' } });
  fireEvent.click(worksheetButton());
  addRows();
  expect(metric).toHaveValue('HTM');
  fireEvent.change(metric, { target: { value: 'QTM' } });
  expect(screen.queryByText(/A half turn counts as two moves/)).not.toBeInTheDocument();
  const range = screen.getByLabelText('Minimum turns').closest('.range-inputs')!;
  expect(range).toContainElement(metric);
  expect(screen.getByLabelText('Maximum turns').compareDocumentPosition(metric) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  expect(container.querySelector('.turn-count small')).toHaveTextContent('HTM');
  fireEvent.click(worksheetButton());
  expect(postMessage).toHaveBeenLastCalledWith(expect.objectContaining({ metric: 'QTM' }));
  for (const [id, moves, algorithm] of [[1, [1, 4], 'U2 R2'], [2, [0, 3, 6], 'U R F']] as const) {
    emit({ type: 'row', row: { id, scramble: 'R U F2', moves: [...moves], algorithm, cross: 'White', pairs: [], nodes: 1, elapsedMs: 1 } });
  }
  emit({ type: 'done', attempts: 2, elapsedMs: 30 });
  const rows = screen.getAllByRole('row').slice(1);
  expect(rows[0].querySelector('.turn-count')).toHaveTextContent('3QTM');
  expect(rows[1].querySelector('.turn-count')).toHaveTextContent('4QTM');
  expect(container.querySelector('.worksheet-heading')).toHaveTextContent('4–8 QTM');
  fireEvent.change(metric, { target: { value: 'HTM' } });
  expect(rows[1].querySelector('.turn-count')).toHaveTextContent('4QTM');
});

test('XX-Cross options, fixed colors/pairs, turn bounds, printing, and cancellation are wired', () => {
  const print = jest.spyOn(window, 'print').mockImplementation(() => {});
  render(<App />);
  fireEvent.click(screen.getByRole('button', { name: 'Stop generation' }));
  expect(terminate).toHaveBeenCalled();
  fireEvent.change(screen.getByLabelText('Solve target'), { target: { value: 'xxcross' } });
  fireEvent.change(screen.getByLabelText('Cross / base color'), { target: { value: 'White' } });
  fireEvent.change(screen.getByLabelText('Required F2L pair'), { target: { value: '11' } });
  fireEvent.change(screen.getByLabelText('Pair relationship'), { target: { value: 'diagonal' } });
  fireEvent.change(screen.getByLabelText('Minimum turns'), { target: { value: '4' } });
  fireEvent.change(screen.getByLabelText('Maximum turns'), { target: { value: '10' } });
  fireEvent.click(worksheetButton());
  expect(postMessage).toHaveBeenLastCalledWith(expect.objectContaining({
    mode: 'xxcross', cross: 'White', pair: '11', relation: 'diagonal', minimum: 4, maximum: 10,
  }));
  addRows();
  fireEvent.click(screen.getByRole('button', { name: /Print sheet/ }));
  expect(print).toHaveBeenCalledTimes(1);
  print.mockRestore();
});

test('print density follows the selected columns without changing the screen worksheet', () => {
  render(<App />);
  addRows();
  const table = screen.getByRole('table');
  expect(table.querySelector('.print-column-label')).toHaveTextContent('# Turns Required');
  expect(table.querySelector('.print-column-label')).toHaveAttribute('aria-hidden', 'true');
  expect(table.style.getPropertyValue('--print-columns')).toBe('6');
  for (const name of ['My solution', 'My time']) {
    fireEvent.change(screen.getByLabelText('Add a blank column'), { target: { value: name } });
    fireEvent.click(screen.getByRole('button', { name: 'Add custom column' }));
  }
  expect(table.style.getPropertyValue('--print-columns')).toBe('8');
  fireEvent.click(screen.getByRole('checkbox', { name: 'Scramble Visualization' }));
  expect(table.style.getPropertyValue('--print-columns')).toBe('7');
  fireEvent.click(screen.getByRole('button', { name: 'Remove My time column' }));
  expect(table.style.getPropertyValue('--print-columns')).toBe('6');
  expect(screen.getAllByRole('row')).toHaveLength(3);
  expect(screen.getByRole('columnheader', { name: 'My solution' })).toBeInTheDocument();
});

test('invalid constraints and solver errors are visible, and a stopped worksheet retains finished rows', () => {
  render(<App />);
  emit({ type: 'row', row: { id: 1, scramble: 'R', moves: [2], algorithm: "R'", cross: 'White', pairs: ['Blue / Red'], nodes: 1, elapsedMs: 1 } });
  fireEvent.click(screen.getByRole('button', { name: 'Stop generation' }));
  expect(within(screen.getByRole('table')).getByRole('img', { name: 'Scrambled cube: R' })).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText('Solve target'), { target: { value: 'xxcross' } });
  fireEvent.change(screen.getByLabelText('Cross / base color'), { target: { value: 'White' } });
  fireEvent.change(screen.getByLabelText('Required F2L pair'), { target: { value: '11' } });
  fireEvent.change(screen.getByLabelText('Second required pair'), { target: { value: '11' } });
  fireEvent.click(worksheetButton());
  expect(screen.getByRole('alert')).toHaveTextContent('different');
  emit({ type: 'error', message: 'Exact search time limit' });
  expect(screen.getByRole('alert')).toHaveTextContent('Exact search time limit');
});

test('unmounting terminates the worker, and worker loading failures are explicit', () => {
  const { unmount } = render(<App />);
  act(() => { onerror?.({ message: 'Load failed' } as ErrorEvent); });
  expect(screen.getByRole('alert')).toHaveTextContent('Load failed');
  expect(terminate).toHaveBeenCalled();
  unmount();
});

test.each([
  ['White', ['Green / Red', 'Green / Orange', 'Blue / Orange', 'Blue / Red']],
  ['Yellow', ['Green / Red', 'Green / Orange', 'Blue / Orange', 'Blue / Red']],
  ['Red', ['White / Green', 'White / Blue', 'Yellow / Green', 'Yellow / Blue']],
  ['Orange', ['White / Green', 'White / Blue', 'Yellow / Green', 'Yellow / Blue']],
  ['Green', ['White / Red', 'White / Orange', 'Yellow / Red', 'Yellow / Orange']],
  ['Blue', ['White / Red', 'White / Orange', 'Yellow / Red', 'Yellow / Orange']],
])('%s base offers exactly its four valid pairs in every pair-solving mode', (color, expected) => {
  render(<App />);
  addRows();
  fireEvent.click(screen.getByRole('button', { name: 'Options', exact: true }));
  fireEvent.change(screen.getByLabelText('Cross / base color'), { target: { value: color } });
  for (const mode of ['xcross', 'block', 'xxcross']) {
    fireEvent.change(screen.getByLabelText('Solve target'), { target: { value: mode } });
    const selectors = [screen.getByLabelText('Required F2L pair')];
    if (mode === 'xxcross') selectors.push(screen.getByLabelText('Second required pair'));
    for (const selector of selectors) {
      const options = within(selector).getAllByRole('option');
      expect(options).toHaveLength(5);
      expect(options.slice(1).map(option => option.textContent)).toEqual(expected);
    }
  }
  fireEvent.change(screen.getByLabelText('Cross / base color'), { target: { value: 'any' } });
  for (const label of ['Required F2L pair', 'Second required pair']) {
    expect(within(screen.getByLabelText(label)).getAllByRole('option')).toHaveLength(13);
  }
});

test('changing the base preserves valid selected pairs and resets invalid selections to any', () => {
  render(<App />);
  addRows();
  fireEvent.change(screen.getByLabelText('Solve target'), { target: { value: 'xxcross' } });
  const cross = screen.getByLabelText('Cross / base color');
  const first = screen.getByLabelText('Required F2L pair');
  const second = screen.getByLabelText('Second required pair');
  fireEvent.change(first, { target: { value: '8' } });
  fireEvent.change(second, { target: { value: '10' } });
  for (const color of ['White', 'Yellow', 'any']) {
    fireEvent.change(cross, { target: { value: color } });
    expect(first).toHaveValue('8');
    expect(second).toHaveValue('10');
  }
  fireEvent.change(first, { target: { value: '0' } });
  fireEvent.change(cross, { target: { value: 'White' } });
  expect(first).toHaveValue('any');
  expect(second).toHaveValue('10');
  fireEvent.change(cross, { target: { value: 'Red' } });
  expect(first).toHaveValue('any');
  expect(second).toHaveValue('any');
  fireEvent.click(worksheetButton());
  expect(postMessage).toHaveBeenLastCalledWith(expect.objectContaining({
    cross: 'Red', pair: 'any', secondPair: 'any',
  }));
  expect(screen.queryByRole('alert')).not.toBeInTheDocument();
});
