import { createDataWorker } from './createDataWorker';
import type { DataResult, DataTask } from './dataTasks';

export function dataTask(task: DataTask): { promise: Promise<DataResult>; cancel: () => void } {
  const worker = createDataWorker();
  let rejectTask: (error: Error) => void;
  const promise = new Promise<DataResult>((resolve, reject) => {
    rejectTask = reject;
    worker.onmessage = (event: MessageEvent<{ result: DataResult; error?: string }>) => {
      worker.terminate();
      if (event.data.error) reject(new Error(event.data.error)); else resolve(event.data.result);
    };
    worker.onerror = event => { worker.terminate(); reject(new Error(event.message || 'Unable to load solves.')); };
    worker.postMessage(task);
  });
  return { promise, cancel: () => { worker.terminate(); rejectTask(new Error('Data loading cancelled.')); } };
}
