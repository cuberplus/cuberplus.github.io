import { fireEvent, render, screen, cleanup } from '@testing-library/react';
import { CloudNotice, CloudOptions } from '../cloud/CloudOptions';
import { backupNow, cloudState, configureCloud, connectCloud, disconnectCloud, dismissCloudMessage, restoreNow } from '../cloud/backup';

jest.mock('../cloud/backup', () => ({
  cloudState: jest.fn(), subscribeCloud: () => () => {},
  configureCloud: jest.fn(), connectCloud: jest.fn(), disconnectCloud: jest.fn(),
  backupNow: jest.fn(), restoreNow: jest.fn(async () => false),
  dismissCloudMessage: jest.fn(), initializeCloud: jest.fn(async () => {}),
}));
const initial = {
  provider: 'google' as const, every100: false, onPb: false, pending: 0, lastBackup: null,
  configured: true, connected: true, busy: false, message: '', error: false,
};
beforeEach(() => { jest.clearAllMocks(); jest.mocked(cloudState).mockReturnValue(initial); });
afterEach(cleanup);
test('cloud options expose both providers, manual actions and independent automatic triggers', () => {
  render(<CloudOptions />);
  expect(screen.getAllByRole('option').map(option => option.textContent)).toEqual(['Google Drive', 'Microsoft OneDrive']);
  fireEvent.change(screen.getByRole('combobox', { name: 'Backup provider' }), { target: { value: 'microsoft' } });
  expect(configureCloud).toHaveBeenLastCalledWith('microsoft', false, false);
  fireEvent.click(screen.getByRole('checkbox', { name: /every 100 solves/ }));
  expect(configureCloud).toHaveBeenLastCalledWith('google', true, false);
  fireEvent.click(screen.getByRole('checkbox', { name: /Back up after a PB/ }));
  expect(configureCloud).toHaveBeenLastCalledWith('google', false, true);
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
  expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Connect Google Drive' }).disabled).toBe(true);
  expect(screen.getByRole<HTMLButtonElement>('button', { name: 'Back up now' }).disabled).toBe(true);
  expect(screen.getByRole('status').textContent).toContain('Provider unavailable');
  fireEvent.focus(screen.getByRole('status').querySelector('button')!);
  expect((await screen.findByRole('tooltip')).textContent).toContain('not configured');
});
test('in-flight operations disable controls and pending counts are visible', () => {
  jest.mocked(cloudState).mockReturnValue({ ...initial, every100: true, busy: true, pending: 87 });
  render(<CloudOptions />);
  for (const control of screen.getAllByRole<HTMLButtonElement>('button').filter(button => !button.classList.contains('btn-link'))) expect(control.disabled).toBe(true);
  expect(screen.getByRole<HTMLSelectElement>('combobox').disabled).toBe(true);
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
test('backup semantics tooltip follows the last successful backup, not Disconnect', () => {
  render(<CloudOptions />);
  const label = screen.getByText(/Last successful backup: Never/);
  const tooltip = label.querySelector('button')!;
  expect(tooltip).not.toBeNull();
  fireEvent.focus(tooltip);
  expect(screen.getByRole('tooltip').textContent).toContain('local data wins on backup');
  expect(screen.getByRole('button', { name: 'Disconnect' }).parentElement!.contains(tooltip)).toBe(false);
});
