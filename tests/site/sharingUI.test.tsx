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
  Replay: ({ readOnly, close }: { readOnly: boolean; close: () => void }) =>
    <div role="dialog" aria-label="Mock replay"><span>{readOnly ? 'Read only' : 'Editable'}</span><button onClick={close}>Close replay</button></div>,
}));
const snapshot = {
  format: 'cuberplus-share-v1', kind: 'average', time: 12,
  rows: [{ number: 1, time: 12, turns: 40, tps: 3, trimmed: null, solve: { id: 'shared-1', scramble: 'R' } }],
} as Snapshot;
beforeEach(() => {
  jest.clearAllMocks(); localStorage.clear();
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function(this: HTMLDialogElement) { this.open = true; } });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: function(this: HTMLDialogElement) { this.open = false; } });
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
  fireEvent.click(screen.getByRole('button', { name: /^Ao1:/ }));
  expect(screen.getByRole('table', { name: 'Average solves' })).toBeDefined();
  fireEvent.click(within(screen.getByRole('table', { name: 'Average solves' })).getAllByRole('button')[4]);
  expect(screen.getByText('Read only')).toBeDefined();
  expect(localStorage.getItem('selected-session')).toBe('Private session');
  expect(connectSharing).not.toHaveBeenCalled(); expect(publishShare).not.toHaveBeenCalled();
  view.rerender(<PageLocation.Provider value="/share/?id=gone"><SharedPage /></PageLocation.Provider>);
  await act(async () => {});
  expect(screen.queryByText('Read only')).toBeNull();
});
test('revoked or malformed links show an error instead of prompting sign-in', async () => {
  jest.mocked(readShare).mockRejectedValueOnce(new Error('Snapshot revoked.'));
  render(<PageLocation.Provider value="/share/?id=gone"><SharedPage /></PageLocation.Provider>);
  expect((await screen.findByRole('alert')).textContent).toBe('Snapshot revoked.');
  expect(connectSharing).not.toHaveBeenCalled();
});
