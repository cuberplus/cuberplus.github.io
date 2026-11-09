import { runDataTask, type DataTask } from './dataTasks';

self.onmessage = async (event: MessageEvent<DataTask>) => {
  try { self.postMessage({ result: await runDataTask(event.data) }); }
  catch (error) { self.postMessage({ error: error instanceof Error ? error.message : 'Unable to load solves.' }); }
};
