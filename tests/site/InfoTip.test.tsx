import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PageVisible } from '@cuberplus/navigation';
import { InfoTip } from '../../shared/Components/InfoTip';

afterEach(cleanup);

test('tooltips leave the inline layout, use fixed positioning, and dismiss on Escape', async () => {
  render(<label>Field<InfoTip>Explanation</InfoTip></label>);
  fireEvent.mouseEnter(screen.getByRole('button', { name: 'Explanation' }));
  const tip = await screen.findByRole('tooltip');
  expect(tip.parentElement).toBe(document.body);
  await waitFor(() => expect(tip.style.position).toBe('fixed'));
  fireEvent.keyDown(document, { key: 'Escape' });
  await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull());
});

test('native-dialog tooltips stay in the top layer and do not close their dialog on Escape', async () => {
  render(<dialog open><InfoTip>Dialog explanation</InfoTip></dialog>);
  fireEvent.focus(screen.getByRole('button', { name: 'Dialog explanation' }));
  const tip = await screen.findByRole('tooltip'), dialog = screen.getByRole('dialog');
  expect(tip.parentElement).toBe(dialog);
  const escape = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
  fireEvent(document, escape);
  expect(escape.defaultPrevented).toBe(true);
  expect(dialog.hasAttribute('open')).toBe(true);
  await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull());
});

test('retained hidden pages cannot leave a tooltip visible in the document body', async () => {
  const view = render(<PageVisible.Provider value={true}><InfoTip>Retained explanation</InfoTip></PageVisible.Provider>);
  fireEvent.focus(screen.getByRole('button'));
  await screen.findByRole('tooltip');
  view.rerender(<PageVisible.Provider value={false}><InfoTip>Retained explanation</InfoTip></PageVisible.Provider>);
  await waitFor(() => expect(screen.queryByRole('tooltip')).toBeNull());
  view.rerender(<PageVisible.Provider value={true}><InfoTip>Retained explanation</InfoTip></PageVisible.Provider>);
  expect(screen.queryByRole('tooltip')).toBeNull();
});
