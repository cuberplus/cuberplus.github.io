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
