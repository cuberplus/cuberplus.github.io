import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import ShareDialog from '../../src/sharing/ShareDialog';
import SharedPage from '../../src/sharing/SharedPage';
import { PageLocation } from '@cuberplus/navigation';
import { connectSharing, publishShare, readShare, deleteShare } from '../../src/sharing/drive';
import type { Snapshot } from '../../src/sharing/snapshot';

jest.mock('../../src/cloud/providers', () => ({ prepareProvider: async () => {} }));
jest.mock('../../src/sharing/drive', () => ({
  sharingConfigured: () => true, connectSharing: jest.fn(), publishShare: jest.fn(), deleteShare: jest.fn(), readShare: jest.fn(),
  shareUrl: () => 'https://cuberplus.com/share/?id=public-file',
}));
jest.mock('../../timer/src/Core/puzzle', () => ({ loadCube: async () => ({}) }));
jest.mock('../../timer/src/Components/Replay', () => ({
  Replay: ({ readOnly, canShare = true, close }: { readOnly: boolean; canShare?: boolean; close: () => void }) =>
    <div role="dialog" aria-label="Mock replay"><span>{readOnly ? 'Read only' : 'Editable'}</span>{canShare && <button>Share</button>}<button onClick={close}>Close replay</button></div>,
}));
const snapshot = {
  format: 'cuberplus-share-v1', kind: 'average', time: 12,
  rows: [{ number: 1, time: 12, turns: 40, tps: 3, trimmed: null, solve: { id: 'shared-1', scramble: 'R' } }],
} as Snapshot;
beforeEach(() => {
  jest.clearAllMocks(); localStorage.clear();
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function(this: HTMLDialogElement) { this.open = true; } });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: function(this: HTMLDialogElement) { this.open = false; this.dispatchEvent(new Event('close')); } });
  jest.mocked(connectSharing).mockResolvedValue(undefined);
  jest.mocked(publishShare).mockResolvedValue({ id: 'public-file', name: 'Snapshot' });
  jest.mocked(deleteShare).mockResolvedValue(undefined);
  jest.mocked(readShare).mockResolvedValue(snapshot);
});
afterEach(cleanup);
test('opening sharing prepares a snapshot but requires explicit publishing, exposes copy fallback and revocation', async () => {
  const close = jest.fn();
  render(<ShareDialog load={async () => snapshot} close={close} />);
  await screen.findByText('1 solve selected');
  expect(connectSharing).not.toHaveBeenCalled(); expect(publishShare).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Publish to my Google Drive' }));
  const link = await screen.findByLabelText('Public snapshot link') as HTMLInputElement;
  expect(link.value).toBe('https://cuberplus.com/share/?id=public-file');
  expect(publishShare).toHaveBeenCalledWith(snapshot);
  fireEvent.click(screen.getByRole('button', { name: 'Copy link' }));
  expect(screen.getByRole('status').textContent).toBe('Select and copy the link above.');
  fireEvent.click(screen.getByRole('button', { name: 'Revoke link' }));
  await screen.findByText('Link revoked. Catalog solves remain public for reuse. Downloaded copies cannot be recalled.');
  expect(deleteShare).toHaveBeenCalledWith('public-file');
  fireEvent.click(screen.getByRole('button', { name: 'Close sharing' }));
  expect(close).toHaveBeenCalledTimes(1);
});
test('publishing failures show an actionable error and permit retry without returning a link', async () => {
  jest.mocked(publishShare).mockRejectedValueOnce(new Error('Drive sharing denied.'));
  render(<ShareDialog load={async () => snapshot} close={() => {}} />);
  await screen.findByText('1 solve selected');
  fireEvent.click(screen.getByRole('button', { name: 'Publish to my Google Drive' }));
  expect((await screen.findByRole('alert')).textContent).toBe('Drive sharing denied.');
  expect(screen.queryByLabelText('Public snapshot link')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Publish to my Google Drive' }));
  await screen.findByLabelText('Public snapshot link');
});
test('recipients view averages and read-only replays without connecting, publishing or changing local preferences', async () => {
  localStorage.setItem('selected-session', 'Private session');
  const view = render(<PageLocation.Provider value="/share/?id=public-file"><SharedPage /></PageLocation.Provider>);
  await screen.findByRole('heading', { name: 'Shared average' });
  expect(readShare).toHaveBeenCalledWith({ id: 'public-file', resourceKey: undefined }, expect.any(AbortSignal));
  expect(await screen.findByRole('heading', { name: /^Ao1:/ })).toBeDefined();
  expect(screen.queryByRole('button', { name: /^Ao1:/ })).toBeNull();
  expect(screen.getByRole('dialog', { name: /^Ao1:/ })).toBeDefined();
  expect(screen.getByRole('table', { name: 'Average solves' })).toBeDefined();
  expect(screen.queryByRole('button', { name: /share average/i })).toBeNull();
  fireEvent.click(within(screen.getByRole('table', { name: 'Average solves' })).getAllByRole('button')[4]);
  expect(screen.getByText('Read only')).toBeDefined();
  expect(screen.queryByRole('button', { name: 'Share', exact: true })).toBeNull();
  expect(localStorage.getItem('selected-session')).toBe('Private session');
  expect(connectSharing).not.toHaveBeenCalled(); expect(publishShare).not.toHaveBeenCalled();
  view.rerender(<PageLocation.Provider value="/share/?id=gone"><SharedPage /></PageLocation.Provider>);
  await act(async () => {});
  expect(screen.queryByText('Read only')).toBeNull();
});
test('shared averages reuse sortable modal columns, trimming and penalties inline', async () => {
  jest.mocked(readShare).mockResolvedValueOnce({ ...snapshot, time: 'DNF', rows: [
    { ...snapshot.rows[0], number: 1, time: 12, trimmed: 'best', penalty: 2 },
    { ...snapshot.rows[0], number: 2, time: 'DNF', turns: 0, tps: null, trimmed: 'worst' },
  ] });
  render(<PageLocation.Provider value="/share/?id=public-file"><SharedPage /></PageLocation.Provider>);
  const table = await screen.findByRole('table', { name: 'Average solves' });
  const panel = table.closest('dialog')!;
  expect(within(panel).getByRole('heading', { name: 'Ao2: DNF' })).toBeDefined();
  expect(within(table).getAllByRole('columnheader').map(cell => cell.textContent)).toEqual(['Solve', 'Time', 'Turns', 'TPS']);
  expect(table.querySelector('.average-trimmed-best')?.textContent).toBe('(12.00s)');
  expect(table.querySelector('.average-trimmed-worst')?.textContent).toBe('(DNF)');
  expect(within(table).getByText('+2')).toBeDefined();
  expect(within(table).getByText('--')).toBeDefined();
  const rows = table.querySelectorAll('tbody tr');
  fireEvent.click(within(table).getByRole('button', { name: 'Time', exact: true }));
  fireEvent.click(within(table).getByRole('button', { name: 'Time', exact: true }));
  expect(table.querySelector('tbody tr')).toBe(rows[1]);
  expect(table.querySelector('th[aria-sort="descending"]')?.textContent).toBe('Time');
  expect(panel.querySelectorAll('th[aria-sort]')).toHaveLength(1);
  fireEvent.click(within(table).getByRole('button', { name: 'Solve 2: 0 turns, open replay' }));
  expect(screen.getByText('Read only')).toBeDefined();
  expect(connectSharing).not.toHaveBeenCalled();
});
test('shared singles open directly in the normal read-only replay; closing returns to the timer', async () => {
  jest.mocked(readShare).mockResolvedValueOnce({ ...snapshot, kind: 'solve' });
  const push = jest.spyOn(history, 'pushState'), navigation = jest.fn();
  window.addEventListener('popstate', navigation);
  render(<PageLocation.Provider value="/share/?id=public-file"><SharedPage /></PageLocation.Provider>);
  expect(await screen.findByText('Read only')).toBeDefined();
  expect(screen.queryByRole('button', { name: 'Share', exact: true })).toBeNull();
  expect(screen.queryByRole('table')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Close replay' }));
  expect(push).toHaveBeenLastCalledWith(null, '', '/timer/');
  expect(navigation).toHaveBeenCalledTimes(1);
  window.removeEventListener('popstate', navigation); push.mockRestore();
});
test('closing a shared average, including native dismissal, returns to the timer', async () => {
  const push = jest.spyOn(history, 'pushState');
  render(<PageLocation.Provider value="/share/?id=public-file"><SharedPage /></PageLocation.Provider>);
  const table = await screen.findByRole('table', { name: 'Average solves' });
  fireEvent(table.closest('dialog')!, new Event('close'));
  expect(push).toHaveBeenLastCalledWith(null, '', '/timer/');
  push.mockRestore();
});
test('revoked or malformed links show an error instead of prompting sign-in', async () => {
  jest.mocked(readShare).mockRejectedValueOnce(new Error('Snapshot revoked.'));
  render(<PageLocation.Provider value="/share/?id=gone"><SharedPage /></PageLocation.Provider>);
  expect((await screen.findByRole('alert')).textContent).toBe('Snapshot revoked.');
  expect(connectSharing).not.toHaveBeenCalled();
});
