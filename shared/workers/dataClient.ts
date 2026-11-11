import { createDataWorker } from './createDataWorker';
import type { DataProgress, DataResult, DataTask } from './dataTasks';
import type { Solve } from '../../timer/src/Core/engine';

export function dataTask(task: DataTask, progress?: (value: DataProgress) => void, shared?: Worker): { promise: Promise<DataResult>; cancel: () => void } {
  const worker = shared ?? createDataWorker();
  let rejectTask: (error: Error) => void;
  const promise = new Promise<DataResult>((resolve, reject) => {
    rejectTask = reject;
    worker.onmessage = (event: MessageEvent<{ result: DataResult; error?: string; progress?: DataProgress }>) => {
      if (event.data.progress) { progress?.(event.data.progress); return; }
      if (!shared) worker.terminate();
      if (event.data.error) reject(new Error(event.data.error)); else resolve(event.data.result);
    };
    worker.onerror = event => { worker.terminate(); reject(new Error(event.message || 'Unable to load solves.')); };
    worker.postMessage(task);
  });
  return { promise, cancel: () => { worker.terminate(); rejectTask(new Error('Data loading cancelled.')); } };
}

let feedbackWorker: Worker | undefined, queue = Promise.resolve();
const known = new Map<string, Solve>();
const keys = new Map<string, string>();
export function solveFeedback(solve: Solve, history: Solve[], active = () => true): Promise<DataResult> {
  const pending = queue.then(async () => {
    if (!active()) return {};
    const worker = feedbackWorker ??= createDataWorker();
    const { analysisKey } = await import('../../timer/src/Analysis/analysis'), key = analysisKey(solve);
    const session = history.filter(item => item.id !== solve.id && item.session === solve.session && item.status !== 'active');
    session.push(solve);
    const changed = session.filter(item => known.get(item.id) !== item || item === solve && keys.get(item.id) !== key);
    try {
      for (let i = 0; i < changed.length; i += 100) {
        if (!active()) return {};
        const batch = changed.slice(i, i + 100);
        await dataTask({ type: 'feedback', solves: batch.map(item => item.imported ? { ...item, moves: [], analysis: undefined, cfop: undefined } : item) }, undefined, worker).promise;
        batch.forEach(item => { known.set(item.id, item); keys.set(item.id, analysisKey(item)); });
      }
      keys.set(solve.id, key);
      const present = new Set(history.map(item => item.id)); present.add(solve.id);
      for (const id of known.keys()) if (!present.has(id)) { known.delete(id); keys.delete(id); }
      return await dataTask({ type: 'mistakes', ids: session.map(item => item.id), present: [...known.keys()], solve }, undefined, worker).promise;
    } catch (error) {
      worker.terminate(); feedbackWorker = undefined; known.clear(); keys.clear(); throw error;
    }
  });
  queue = pending.then(() => {}, () => {});
  return pending;
}
