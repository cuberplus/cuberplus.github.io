import { dataTask } from '../../shared/workers/dataClient';

const mockWorker = {
  onmessage: null as ((event: MessageEvent) => void) | null,
  onerror: null as ((event: ErrorEvent) => void) | null,
  postMessage: jest.fn(),
  terminate: jest.fn(),
};
jest.mock('../../shared/workers/createDataWorker', () => ({ createDataWorker: () => mockWorker }));
beforeEach(() => jest.clearAllMocks());

test('returns worker results and terminates the completed worker', async () => {
  const task = dataTask({ type: 'local' });
  mockWorker.onmessage!(new MessageEvent('message', { data: { result: { solves: [] } } }));
  await expect(task.promise).resolves.toEqual({ solves: [] });
  expect(mockWorker.terminate).toHaveBeenCalledTimes(1);
});
test.each(['task', 'worker'])('reports %s failures and terminates the worker', async failure => {
  const task = dataTask({ type: 'local' });
  const result = expect(task.promise).rejects.toThrow('Failed');
  if (failure === 'task') mockWorker.onmessage!(new MessageEvent('message', { data: { error: 'Failed' } }));
  else mockWorker.onerror!(new ErrorEvent('error', { message: 'Failed' }));
  await result;
  expect(mockWorker.terminate).toHaveBeenCalledTimes(1);
});
test('cancelling terminates pending work and rejects the request', async () => {
  const task = dataTask({ type: 'local' });
  const result = expect(task.promise).rejects.toThrow('cancelled');
  task.cancel();
  await result;
  expect(mockWorker.terminate).toHaveBeenCalledTimes(1);
});
test('progress leaves the worker alive until the final result', async () => {
  const progress = jest.fn(), task = dataTask({ type: 'reanalyze' }, progress);
  const value = { processed: 50, total: 100, analyzed: 49, skipped: 1, failed: 0, remainingMs: 2000 };
  mockWorker.onmessage!(new MessageEvent('message', { data: { progress: value } }));
  expect(progress).toHaveBeenCalledWith(value);
  expect(mockWorker.terminate).not.toHaveBeenCalled();
  mockWorker.onmessage!(new MessageEvent('message', { data: { result: { ...value, processed: 100, remainingMs: 0 } } }));
  expect((await task.promise)).toMatchObject({ processed: 100, remainingMs: 0 });
  expect(mockWorker.terminate).toHaveBeenCalledTimes(1);
});
