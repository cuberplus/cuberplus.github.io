import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { CaseModal } from '../../src/database/CaseModal';

jest.mock('../../src/database/Database', () => ({ __esModule: true, default: ({ caseKey }: { caseKey: string }) => <p>{caseKey}</p> }));

beforeAll(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function(this: HTMLDialogElement) { this.open = true; } });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: function(this: HTMLDialogElement) { this.open = false; } });
});
afterEach(cleanup);

test.each([
  ['F2L-1', 'F2L 1 - Oriented Edge'],
  ['F2L-2', 'F2L 2 - Unoriented Edge'],
  ['F2L-13', 'F2L 13 - Unoriented Edge'],
  ['OLL-1', 'OLL 1 - Dot'],
  ['PLL-T', 'PLL T - Adjacent Corners'],
])('the %s modal labels its heading and dialog with the case category', async (caseKey, title) => {
  render(<CaseModal caseKey={caseKey} close={jest.fn()} />);
  await screen.findByText(caseKey);
  expect(screen.getByRole('heading', { name: title })).toBeDefined();
  expect(screen.getByRole('dialog', { name: title })).toBeDefined();
});

test.each(['button', 'Escape'])('%s closes the native dialog before unmounting so it can restore focus', async method => {
  const close = jest.fn(() => expect(dialog.open).toBe(false));
  render(<CaseModal caseKey="PLL-T" close={close} />);
  const dialog = await screen.findByRole<HTMLDialogElement>('dialog');
  expect(dialog.open).toBe(true);
  if (method === 'button') fireEvent.click(screen.getByRole('button', { name: 'Close algorithm case' }));
  else fireEvent(dialog, new Event('cancel', { cancelable: true }));
  expect(close).toHaveBeenCalledTimes(1);
});
