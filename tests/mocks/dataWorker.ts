import { runDataTask, type DataTask } from '../../shared/workers/dataTasks';
import { deserialize, serialize } from 'node:v8';
export function createDataWorker() {
  const worker = {
    onmessage: null as ((event: MessageEvent) => void) | null,
    postMessage(task: DataTask) {
      setTimeout(() => {
        void runDataTask(deserialize(serialize(task)) as DataTask, progress => worker.onmessage?.(new MessageEvent('message', { data: { progress } }))).then(result => worker.onmessage?.(new MessageEvent('message', { data: { result } })))
          .catch((error: Error) => worker.onmessage?.(new MessageEvent('message', { data: { error: error.message } })));
      }, 0);
    },
    terminate() {},
  };
  return worker;
}
