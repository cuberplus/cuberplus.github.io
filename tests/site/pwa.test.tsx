import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { InstallControl, registerWorker } from '../../src/pwa/pwa';

beforeEach(() => {
  Object.defineProperty(window, 'matchMedia', { configurable: true, value: () => ({ matches: false }) });
});
afterEach(() => { cleanup(); jest.restoreAllMocks(); });

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
  const worker = { controller: {}, getRegistrations: jest.fn().mockResolvedValue([legacy, other]), register: jest.fn().mockResolvedValue(registration), addEventListener: jest.fn() };
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
