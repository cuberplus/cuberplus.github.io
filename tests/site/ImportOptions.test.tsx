/** @jest-environment jsdom */
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ImportOptions } from '../../src/Pages/Options/ImportOptions';
import type { DataProgress, DataResult } from '../../shared/workers/dataTasks';

let mockProgress: (progress: DataProgress) => void, mockResolve: (result: DataResult) => void, mockReject: (error: Error) => void;
const mockCancel = jest.fn();
jest.mock('../../shared/workers/dataClient', () => ({
  dataTask: (_task: object, progress: (value: DataProgress) => void) => {
    mockProgress = progress;
    return { promise: new Promise<DataResult>((resolve, reject) => { mockResolve = resolve; mockReject = reject; }), cancel: mockCancel };
  },
}));
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
  mockCancel.mockClear();
});
test('CSV import shows reading, measured progress and saving until the worker has persisted the solves', async () => {
  render(<ImportOptions />);
  const input = screen.getByLabelText('Import solve CSV files');
  fireEvent.change(input, { target: { files: [new File(['csv'], 'solves.csv')] } });
  const dialog = screen.getByRole('dialog', { name: 'Importing solves' });
  expect(dialog.hasAttribute('open')).toBe(true);
  expect(screen.getByLabelText('Import progress').hasAttribute('value')).toBe(false);
  expect(screen.getByRole('status').textContent).toBe('Reading CSV files...');
  expect(screen.queryByText('Cancel')).toBeNull();
  act(() => mockProgress({ processed: 50, total: 100, analyzed: 45, skipped: 5, failed: 0, remainingMs: 2000 }));
  expect(screen.getByLabelText('Import progress').getAttribute('value')).toBe('50');
  expect(screen.getByRole('status').textContent).toContain('50 / 100 solves');
  act(() => mockProgress({ processed: 100, total: 100, analyzed: 95, skipped: 5, failed: 0, remainingMs: 0 }));
  expect(screen.getByRole('status').textContent).toBe('Saving imported solves...');
  expect(dialog.hasAttribute('open')).toBe(true);
  await act(async () => mockResolve({ added: 95, duplicates: 5 }));
  expect(dialog.hasAttribute('open')).toBe(false);
  expect(screen.getByRole('status').textContent).toBe('Imported 95 solves; skipped 5 duplicates.');
});
test('a failed import closes progress and leaves import enabled for retry', async () => {
  render(<ImportOptions />);
  fireEvent.change(screen.getByLabelText('Import solve CSV files'), { target: { files: [new File([], 'invalid.csv')] } });
  await act(async () => mockReject(new Error('Invalid CSV')));
  expect(screen.getByRole('alert').textContent).toBe('Invalid CSV');
  expect(screen.queryByRole('dialog')).toBeNull();
  expect((screen.getByLabelText('Import solve CSV files') as HTMLInputElement).disabled).toBe(false);
});
test('settings displays worker progress and estimated remaining time, then announces updated saved analysis', async () => {
  const changed = jest.fn();
  window.addEventListener('timer-solves-changed', changed);
  const { unmount } = render(<ImportOptions />);
  try {
    fireEvent.click(screen.getByText('Re-analyze all solves'));
    const dialog = screen.getByRole('dialog');
    expect(dialog.hasAttribute('open')).toBe(true);
    const progress = { processed: 50, total: 100, analyzed: 49, skipped: 1, failed: 0, remainingMs: 2000 };
    act(() => mockProgress(progress));
    expect(screen.getByLabelText('Reanalysis progress').getAttribute('value')).toBe('50');
    expect(screen.getByRole('status').textContent).toContain('About 2 seconds remaining');
    expect((screen.getByText('Re-analyze all solves') as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByText('Cancel'));
    expect(mockCancel).toHaveBeenCalledTimes(1);
    await act(async () => mockResolve({ ...progress, processed: 100, analyzed: 99, remainingMs: 0 }));
    await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Re-analyzed 99 solves'));
    expect(dialog.hasAttribute('open')).toBe(false);
    expect(changed.mock.calls[0][0].detail).toEqual({ reanalyzed: true });
  } finally { unmount(); window.removeEventListener('timer-solves-changed', changed); }
});
