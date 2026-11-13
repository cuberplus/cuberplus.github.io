import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { PageLocation, PageVisible } from '@cuberplus/navigation';
import { MacAddressHelp } from '../../shared/Components/MacAddressHelp';

beforeEach(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function(this: HTMLDialogElement) { this.open = true; } });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: function(this: HTMLDialogElement) { this.open = false; } });
});
afterEach(cleanup);
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
