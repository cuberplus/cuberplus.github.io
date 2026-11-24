import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { PageLocation, PageVisible } from '@cuberplus/navigation';
import { MacAddressHelp } from '../../shared/Components/MacAddressHelp';

beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function(this: HTMLDialogElement) { this.open = true; } });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: function(this: HTMLDialogElement) { this.open = false; } });
});
afterEach(() => { cleanup(); jest.restoreAllMocks(); jest.useRealTimers(); });
test('MAC help uses a named native modal, closes visibly, and closes when its retained page is hidden', () => {
  const view = render(<PageVisible.Provider value={true}><MacAddressHelp /></PageVisible.Provider>);
  expect(screen.queryByRole('dialog')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: "Find my cube's MAC address" }));
  const dialog = screen.getByRole('dialog', { name: /Find your cube's Bluetooth MAC address/ });
  expect(dialog.tagName).toBe('DIALOG');
  fireEvent.click(screen.getByRole('button', { name: 'Close MAC address help' }));
  expect(screen.queryByRole('dialog')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: "Find my cube's MAC address" }));
  view.rerender(<PageVisible.Provider value={false}><MacAddressHelp /></PageVisible.Provider>);
  expect(dialog.hasAttribute('open')).toBe(false);
});
test('legacy help addresses open the themed modal from Options', () => {
  render(<PageLocation.Provider value="/options/?help=mac-address"><MacAddressHelp openFromAddress /></PageLocation.Provider>);
  expect(screen.getByRole('dialog').textContent).toContain('Windows: Edge or Chrome');
});
test.each(['Edge', 'Chrome'] as const)('copies the %s internal address and clears its confirmation', async browser => {
  jest.useFakeTimers();
  const writeText = jest.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  render(<MacAddressHelp />);
  fireEvent.click(screen.getByRole('button', { name: "Find my cube's MAC address" }));
  const button = screen.getByRole('button', { name: `Copy ${browser} address` });
  await act(async () => fireEvent.click(button));
  expect(writeText).toHaveBeenCalledTimes(1);
  expect(writeText).toHaveBeenCalledWith(`${browser.toLowerCase()}://bluetooth-internals/#devices`);
  expect(screen.getByText(`${browser} address copied.`).getAttribute('role')).toBe('status');
  expect(button.hasAttribute('disabled')).toBe(false);
  act(() => jest.advanceTimersByTime(3000));
  expect(screen.queryByText(`${browser} address copied.`)).toBeNull();
});
test('reports denied clipboard access and lets the user retry', async () => {
  const writeText = jest.fn().mockRejectedValueOnce(new Error('Denied')).mockResolvedValueOnce(undefined);
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  render(<MacAddressHelp />);
  fireEvent.click(screen.getByRole('button', { name: "Find my cube's MAC address" }));
  const button = screen.getByRole('button', { name: 'Copy Edge address' });
  await act(async () => fireEvent.click(button));
  expect(screen.getByText(/Could not copy/).getAttribute('role')).toBe('status');
  await act(async () => fireEvent.click(button));
  expect(screen.getByText('Edge address copied.')).not.toBeNull();
});
test('native copy commands do not also run the fallback click handler', async () => {
  const writeText = jest.fn().mockResolvedValue(undefined);
  Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
  Object.defineProperty(window, 'CommandEvent', { configurable: true, value: Event });
  try {
    render(<MacAddressHelp />);
    fireEvent.click(screen.getByRole('button', { name: "Find my cube's MAC address" }));
    const button = screen.getByRole('button', { name: 'Copy Chrome address' });
    await act(async () => fireEvent.click(button));
    expect(writeText).not.toHaveBeenCalled();
    const event = new Event('command');
    Object.defineProperty(event, 'command', { value: '--copy' });
    await act(async () => document.getElementById(button.getAttribute('commandfor')!)!.dispatchEvent(event));
    expect(writeText).toHaveBeenCalledTimes(1);
    expect(writeText).toHaveBeenCalledWith('chrome://bluetooth-internals/#devices');
  } finally { delete (window as Window & { CommandEvent?: typeof Event }).CommandEvent; }
});
