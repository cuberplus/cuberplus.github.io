import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { InstallControl, registerWorker } from '../../src/pwa/pwa';
import { configureStreakReminders, StreakReminderOptions } from '../../src/pwa/StreakReminderOptions';

beforeEach(() => {
  localStorage.clear();
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: () => ({ matches: false }) });
});
afterEach(() => { cleanup(); jest.restoreAllMocks(); });

test.each([true, false])('install instructions are available through a separate keyboard-accessible tooltip (installable: %s)', async installable => {
  const prompt = jest.fn().mockResolvedValue({ outcome: 'dismissed' });
  render(<InstallControl />);
  if (installable) act(() => window.dispatchEvent(Object.assign(new Event('beforeinstallprompt', { cancelable: true }), { prompt })));
  const text = installable ? 'Add CuberPlus to your home screen or apps.' : 'Use your browser menu to Install app, or Share > Add to Home Screen on iPhone/iPad.';
  expect(screen.queryByText(text)).toBeNull();
  const help = screen.getByRole('button', { name: text, exact: true });
  fireEvent.focus(help);
  expect((await screen.findByRole('tooltip')).textContent).toBe(text);
  expect(prompt).not.toHaveBeenCalled();
  fireEvent.keyDown(document, { key: 'Escape' });
  await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull());
});

test('install subscribers share one offer and one pair of browser listeners', async () => {
  const add = jest.spyOn(window, 'addEventListener'), remove = jest.spyOn(window, 'removeEventListener');
  const first = render(<InstallControl />), second = render(<InstallControl />);
  const prompt = jest.fn().mockResolvedValue({ outcome: 'dismissed' });
  act(() => window.dispatchEvent(Object.assign(new Event('beforeinstallprompt', { cancelable: true }), { prompt })));
  expect(screen.getAllByRole('button', { name: 'Install app', exact: true }).every(button => !(button as HTMLButtonElement).disabled)).toBe(true);
  expect(add.mock.calls.filter(([name]) => name === 'beforeinstallprompt')).toHaveLength(1);
  await act(async () => fireEvent.click(screen.getAllByRole('button', { name: 'Install app', exact: true })[0]));
  expect(prompt).toHaveBeenCalledTimes(1);
  expect(screen.getAllByRole('button', { name: 'Install app', exact: true }).every(button => (button as HTMLButtonElement).disabled)).toBe(true);
  first.unmount();
  expect(remove.mock.calls.filter(([name]) => name === 'beforeinstallprompt')).toHaveLength(0);
  second.unmount();
  expect(remove.mock.calls.filter(([name]) => name === 'beforeinstallprompt')).toHaveLength(1);
});
test('a failed install remains usable and a fresh offer can retry', async () => {
  render(<InstallControl />);
  act(() => window.dispatchEvent(Object.assign(new Event('beforeinstallprompt', { cancelable: true }), { prompt: jest.fn().mockRejectedValue(new Error('Denied')) })));
  await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Install app', exact: true })));
  expect(screen.getByRole('alert').textContent).toMatch(/browser menu/);
  act(() => window.dispatchEvent(Object.assign(new Event('beforeinstallprompt', { cancelable: true }), { prompt: jest.fn().mockResolvedValue(undefined) })));
  expect(screen.queryByRole('alert')).toBeNull();
  act(() => window.dispatchEvent(new Event('appinstalled')));
  expect(screen.queryByRole('button', { name: 'Install app', exact: true })).toBeNull();
});
test('a waiting update never reloads automatically, and only the obsolete Timer registration is retired', async () => {
  const legacy = { scope: new URL('/timer/', location.origin).href, unregister: jest.fn().mockResolvedValue(true) };
  const other = { scope: new URL('/other/', location.origin).href, unregister: jest.fn() };
  const waiting = { postMessage: jest.fn() }, registration = { waiting, addEventListener: jest.fn() };
  const worker = { ready: new Promise(() => {}), controller: {}, getRegistrations: jest.fn().mockResolvedValue([legacy, other]), register: jest.fn().mockResolvedValue(registration), addEventListener: jest.fn() };
  Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: worker });
  render(<InstallControl />);
  await act(async () => registerWorker(false));
  expect(worker.register).not.toHaveBeenCalled();
  await act(async () => registerWorker(true));
  expect(worker.register).toHaveBeenCalledWith('/sw.js', { scope: '/', updateViaCache: 'none' });
  expect(legacy.unregister).toHaveBeenCalledTimes(1);
  expect(other.unregister).not.toHaveBeenCalled();
  expect(waiting.postMessage).not.toHaveBeenCalled();
  expect(worker.addEventListener).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Update (reload)' }));
  expect(waiting.postMessage).toHaveBeenCalledWith('SKIP_WAITING');
  expect(worker.addEventListener).toHaveBeenCalledWith('controllerchange', expect.any(Function), { once: true });
});
function reminderEnvironment(permission: NotificationPermission = 'default', supported = true) {
  const requestPermission = jest.fn().mockImplementation(async () => { Object.assign(Notification, { permission: 'granted' }); return 'granted'; });
  const put = jest.fn().mockResolvedValue(undefined);
  const sync = { register: jest.fn().mockResolvedValue(undefined), unregister: jest.fn().mockResolvedValue(undefined), getTags: jest.fn().mockResolvedValue(['streak-reminder']) };
  const registration = (supported ? { periodicSync: sync } : {}) as ServiceWorkerRegistration;
  Object.defineProperty(globalThis, 'caches', { configurable: true, value: { open: jest.fn().mockResolvedValue({ put }) } });
  Object.defineProperty(globalThis, 'Response', { configurable: true, value: class { constructor(public body: string) {} } });
  Object.defineProperty(window, 'Notification', { configurable: true, value: { permission, requestPermission } });
  Object.defineProperty(navigator, 'serviceWorker', { configurable: true, value: { getRegistration: jest.fn().mockResolvedValue(registration) } });
  Object.defineProperty(navigator, 'permissions', { configurable: true, value: { query: jest.fn().mockResolvedValue({ state: 'granted' }) } });
  return { requestPermission, put, sync, registration };
}
test('background reminders default off and request permission immediately when the checkbox is enabled', async () => {
  const { requestPermission, put, sync } = reminderEnvironment();
  render(<StreakReminderOptions />);
  await act(async () => {});
  expect((screen.getByRole('checkbox', { name: 'Daily streak reminders' }) as HTMLInputElement).checked).toBe(false);
  expect(screen.queryByRole('button', { name: 'Enable background notifications' })).toBeNull();
  expect(requestPermission).not.toHaveBeenCalled(); expect(sync.register).not.toHaveBeenCalled();
  await act(async () => {
    fireEvent.click(screen.getByRole('checkbox', { name: 'Daily streak reminders' }));
    expect(requestPermission).toHaveBeenCalledTimes(1);
  });
  expect(sync.register).toHaveBeenCalledWith('streak-reminder', { minInterval: 3600000 });
  expect(screen.getByRole('status').textContent).toContain('Background reminders enabled');
  await act(async () => fireEvent.click(screen.getByRole('checkbox', { name: 'Daily streak reminders' })));
  expect(localStorage.getItem('streak-reminders')).toBe('false');
  expect(sync.unregister).toHaveBeenCalledWith('streak-reminder');
  expect(put).toHaveBeenLastCalledWith('/streak-reminders/enabled', expect.objectContaining({ body: 'false' }));
});
test('installing and using the app never automatically requests notification permission', async () => {
  const { requestPermission, sync } = reminderEnvironment();
  render(<StreakReminderOptions />);
  await act(async () => {
    window.dispatchEvent(new Event('appinstalled'));
    fireEvent.click(document.body);
  });
  expect(requestPermission).not.toHaveBeenCalled();
  expect(sync.register).not.toHaveBeenCalled();
});
test('saved opt-in resumes background checks without requesting permission on load', async () => {
  const { requestPermission, sync } = reminderEnvironment('granted');
  localStorage.setItem('streak-reminders', 'true');
  render(<StreakReminderOptions />);
  await act(async () => {});
  expect(sync.register).toHaveBeenCalled();
  expect(requestPermission).not.toHaveBeenCalled();
});
test('disabling reminders while permission is pending prevents background registration', async () => {
  const { requestPermission, sync } = reminderEnvironment();
  let grant!: (permission: NotificationPermission) => void;
  requestPermission.mockImplementation(() => new Promise(resolve => { grant = resolve; }));
  render(<StreakReminderOptions />);
  await act(async () => {});
  await act(async () => fireEvent.click(screen.getByRole('checkbox', { name: 'Daily streak reminders' })));
  await act(async () => fireEvent.click(screen.getByRole('checkbox', { name: 'Daily streak reminders' })));
  await act(async () => { Object.assign(Notification, { permission: 'granted' }); grant('granted'); });
  expect(sync.register).not.toHaveBeenCalled();
});
test.each(['denied', 'unsupported'])('enabling reminders respects %s notification support', async mode => {
  const { requestPermission, sync } = reminderEnvironment(mode === 'denied' ? 'denied' : 'default', mode !== 'unsupported');
  render(<StreakReminderOptions />);
  await act(async () => {});
  await act(async () => fireEvent.click(screen.getByRole('checkbox', { name: 'Daily streak reminders' })));
  expect(requestPermission).not.toHaveBeenCalled();
  expect(sync.register).not.toHaveBeenCalled();
});
test('unsupported background sync has no foreground notification fallback', async () => {
  reminderEnvironment();
  const registration = {} as ServiceWorkerRegistration;
  expect(await configureStreakReminders(registration)).toBe(false);
});
