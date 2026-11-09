export const createDataWorker = () => new Worker(new URL('./dataWorker.ts', import.meta.url), { type: 'module' });
