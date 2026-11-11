/** @jest-environment jsdom */
import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ImportOptions } from '../../src/Pages/Options/ImportOptions';
import type { DataProgress, DataResult } from '../../shared/workers/dataTasks';

let mockProgress: (progress: DataProgress) => void, mockResolve: (result: DataResult) => void;
const mockCancel = jest.fn();
jest.mock('../../shared/workers/dataClient', () => ({
  dataTask: (_task: object, progress: (value: DataProgress) => void) => {
    mockProgress = progress;
    return { promise: new Promise<DataResult>(resolve => { mockResolve = resolve; }), cancel: mockCancel };
  },
}));
beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function () { this.setAttribute('open', ''); };
  HTMLDialogElement.prototype.close = function () { this.removeAttribute('open'); };
  mockCancel.mockClear();
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
