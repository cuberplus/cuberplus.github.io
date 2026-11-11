import { runDataTask, type DataTask } from '../../shared/workers/dataTasks';
export function createDataWorker() {
  const worker = {
    onmessage: null as ((event: MessageEvent) => void) | null,
    postMessage(task: DataTask) {
      setTimeout(() => {
        void runDataTask(structuredClone(task), progress => worker.onmessage?.(new MessageEvent('message', { data: { progress } }))).then(result => worker.onmessage?.(new MessageEvent('message', { data: { result } })))
          .catch((error: Error) => worker.onmessage?.(new MessageEvent('message', { data: { error: error.message } })));
      }, 0);
    },
    terminate() {},
  };
  return worker;
}
