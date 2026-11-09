import { runDataTask, type DataTask } from '../../shared/workers/dataTasks';
export function createDataWorker() {
  const worker = {
    onmessage: null as ((event: MessageEvent) => void) | null,
    postMessage(task: DataTask) {
      void runDataTask(task).then(result => worker.onmessage?.(new MessageEvent('message', { data: { result } })))
        .catch((error: Error) => worker.onmessage?.(new MessageEvent('message', { data: { error: error.message } })));
    },
    terminate() {},
  };
  return worker;
}
