import { act, fireEvent, render, screen, cleanup, within } from '@testing-library/react';
import { CloudNotice, CloudOptions } from '../../src/cloud/CloudOptions';
import { backupNow, cloudState, configureCloud, connectCloud, disconnectCloud, dismissCloudMessage, restoreNow } from '../../src/cloud/backup';

let mockCloudChanged: () => void;
jest.mock('../../src/cloud/backup', () => ({
  cloudState: jest.fn(), subscribeCloud: (listener: () => void) => { mockCloudChanged = listener; return () => {}; },
  configureCloud: jest.fn(), connectCloud: jest.fn(), disconnectCloud: jest.fn(),
  backupNow: jest.fn(), restoreNow: jest.fn(async () => false),
  dismissCloudMessage: jest.fn(), initializeCloud: jest.fn(async () => {}),
}));
const initial = {
  provider: 'google' as const, every100: false, onPb: false, pending: 0, lastBackup: null,
  configured: true, connected: true, busy: false, message: '', error: false, backupProgress: null,
};
beforeEach(() => { jest.clearAllMocks(); jest.mocked(cloudState).mockReturnValue(initial); });
afterEach(cleanup);
test('cloud options provide Google actions without a provider picker and keep automatic triggers independent', () => {
  render(<CloudOptions />);
  fireEvent.click(screen.getByRole('button', { name: 'Cloud backup', exact: true }));
  expect(screen.queryByRole('combobox')).toBeNull();
  expect(screen.queryByText(/Microsoft|OneDrive/)).toBeNull();
  fireEvent.click(screen.getByRole('checkbox', { name: /every 100 solves/ }));
  expect(configureCloud).toHaveBeenLastCalledWith('google', true, false);
  fireEvent.click(screen.getByRole('checkbox', { name: /Back up after a PB/ }));
  expect(configureCloud).toHaveBeenLastCalledWith('google', false, true);
  expect(screen.queryByText('Restore and connection settings')).toBeNull();
  const cloud = screen.getByRole('region', { name: /^Cloud backup/ });
  expect(within(cloud).getByRole('button', { name: 'Manage Google Drive shared solves' })).toBeDefined();
  expect(screen.queryByRole('button', { name: 'Shared solves', exact: true })).toBeNull();
  for (const name of ['Back up now', 'Restore backup', 'Reconnect Google Drive', 'Disconnect']) {
    expect(screen.getByRole('button', { name }).querySelector('svg')?.getAttribute('aria-hidden')).toBe('true');
  }
  fireEvent.click(screen.getByRole('button', { name: 'Reconnect Google Drive' }));
  fireEvent.click(screen.getByRole('button', { name: 'Back up now' }));
  fireEvent.click(screen.getByRole('button', { name: 'Restore backup' }));
  fireEvent.click(screen.getByRole('button', { name: 'Disconnect' }));
  expect(connectCloud).toHaveBeenCalledTimes(1);
  expect(backupNow).toHaveBeenCalledTimes(1);
  expect(restoreNow).toHaveBeenCalledTimes(1);
  expect(disconnectCloud).toHaveBeenCalledTimes(1);
});
test('missing deployment IDs disable cloud sign-in instead of presenting a broken OAuth flow', async () => {
  jest.mocked(cloudState).mockReturnValue({ ...initial, configured: false, connected: false });
  render(<CloudOptions />);
  fireEvent.click(screen.getByRole('button', { name: 'Cloud backup', exact: true }));
  expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Connect Google Drive' }).disabled).toBe(true);
  expect(screen.queryByRole('button', { name: 'Back up now' })).toBeNull();
  const status = within(screen.getByRole('region', { name: 'Backup and connection' })).getByRole('status');
  expect(status.textContent).toContain('Provider unavailable');
  fireEvent.focus(status.querySelector('button')!);
  expect((await screen.findByRole('tooltip')).textContent).toContain('not configured');
});
test('in-flight operations disable controls and pending counts are visible', () => {
  jest.mocked(cloudState).mockReturnValue({ ...initial, every100: true, busy: true, pending: 87 });
  render(<CloudOptions />);
  fireEvent.click(screen.getByRole('button', { name: 'Cloud backup', exact: true }));
  for (const control of screen.getAllByRole<HTMLButtonElement>('button').filter(button => !button.classList.contains('btn-link'))) expect(control.disabled).toBe(true);
  expect(screen.queryByRole('combobox')).toBeNull();
  expect(screen.getByText('87 / 100 new solves since the last successful backup')).toBeDefined();
});
test('automatic backup failures are dismissible and link to reconnection options', () => {
  jest.mocked(cloudState).mockReturnValue({ ...initial, error: true, message: 'Reconnect to send pending backups.' });
  render(<CloudNotice />);
  expect(screen.getByRole('alert').textContent).toContain('Reconnect');
  expect(screen.getByRole('link', { name: 'Open backup options' }).getAttribute('href')).toBe('/options/');
  fireEvent.click(screen.getByRole('button', { name: 'Dismiss cloud backup notification' }));
  expect(dismissCloudMessage).toHaveBeenCalledTimes(1);
});
test('notification advances by elapsed time, never moves backwards on re-estimation, and only completes after success', () => {
  jest.useFakeTimers();
  try {
    const progress = { startedAt: performance.now(), estimatedMs: 10000, solveCount: 12345, complete: false };
    jest.mocked(cloudState).mockReturnValue({
      ...initial, busy: true, message: 'Checking existing cloud backup...', backupProgress: progress,
    });
    render(<CloudNotice />);
    const bar = screen.getByRole('progressbar', { name: 'Cloud backup progress' });
    expect(bar.tagName).toBe('PROGRESS');
    expect(bar.getAttribute('max')).toBe('100');
    act(() => jest.advanceTimersByTime(2000));
    expect(Number(bar.getAttribute('value'))).toBe(20);
    expect(screen.getByText('Estimated 20% - 12,345 solves')).toBeDefined();
    expect(bar.parentElement?.getAttribute('aria-live')).toBe('off');
    jest.mocked(cloudState).mockReturnValue({
      ...initial, busy: true, message: 'Uploading 12,345 solves to Google Drive...', backupProgress: { ...progress, estimatedMs: 20000 },
    });
    act(() => mockCloudChanged());
    expect(Number(bar.getAttribute('value'))).toBe(20);
    act(() => jest.advanceTimersByTime(60000));
    expect(Number(bar.getAttribute('value'))).toBe(99);
    jest.mocked(cloudState).mockReturnValue({
      ...initial, message: 'Backed up 12,345 solves to Google Drive.', backupProgress: { ...progress, complete: true },
    });
    act(() => mockCloudChanged());
    expect(bar.getAttribute('value')).toBe('100');
    expect(screen.getByText('100% complete - 12,345 solves')).toBeDefined();
    expect(jest.getTimerCount()).toBe(0);
  } finally { jest.useRealTimers(); }
});
test('dismissing an active notification stops its progress clock', () => {
  jest.useFakeTimers();
  try {
    jest.mocked(cloudState).mockReturnValue({
      ...initial, busy: true, message: 'Checking existing cloud backup...',
      backupProgress: { startedAt: performance.now(), estimatedMs: 10000, solveCount: 10, complete: false },
    });
    render(<CloudNotice />);
    expect(jest.getTimerCount()).toBe(1);
    jest.mocked(cloudState).mockReturnValue({ ...initial, busy: true });
    act(() => mockCloudChanged());
    expect(screen.queryByRole('progressbar')).toBeNull();
    expect(jest.getTimerCount()).toBe(0);
  } finally { jest.useRealTimers(); }
});
test('backup semantics tooltip follows the last successful backup, not Disconnect', () => {
  render(<CloudOptions />);
  fireEvent.click(screen.getByRole('button', { name: 'Cloud backup', exact: true }));
  const label = screen.getByText(/Last successful backup: Never/);
  const tooltip = label.querySelector('button')!;
  expect(tooltip).not.toBeNull();
  fireEvent.focus(tooltip);
  expect(screen.getByRole('tooltip').textContent).toContain('local data wins on backup');
  expect(screen.getByRole('button', { name: 'Disconnect' }).parentElement!.contains(tooltip)).toBe(false);
});
