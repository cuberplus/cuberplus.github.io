import { generateScramble, sameAxis } from './puzzle';
import type { GenerationEvent } from '../../../scrambler/src/cube/generation';

export const scramblers = {
  default: 'Random state (default)',
  'easy-cross': 'Easy Cross (3 moves, White)',
  'easy-xcross': 'Easy X-Cross (3 moves, White)',
  '2-gen': '2-gen (R, U)',
  '3-gen': '3-gen (R, U, F)',
  doubles: 'Double moves only',
} as const;
export type Scrambler = keyof typeof scramblers;
export const SESSION_SCRAMBLERS = 'timer-session-scramblers';
export function readSessionScramblers(): Record<string, Scrambler> {
  try {
    const saved = JSON.parse(localStorage.getItem(SESSION_SCRAMBLERS) ?? '{}') as Record<string, Scrambler>;
    return Object.fromEntries(Object.entries(saved).filter(([name, value]) => name !== 'Default' && Object.hasOwn(scramblers, value)));
  } catch { return {}; }
}
export async function sessionScramble(kind: Scrambler = 'default', random = Math.random, signal?: AbortSignal): Promise<string> {
  if (kind === 'default') return generateScramble();
  if (kind === 'easy-cross' || kind === 'easy-xcross') {
    const { createSolverWorker } = await import('../../../scrambler/src/cube/workerClient');
    return new Promise((resolve, reject) => {
      const worker = createSolverWorker();
      const finish = (scramble?: string, error = 'Easy scramble generation failed.') => {
        clearTimeout(timeout); signal?.removeEventListener('abort', abort); worker.terminate();
        if (scramble) resolve(scramble); else reject(new Error(error));
      };
      const abort = () => finish(undefined, 'Scramble generation cancelled.');
      const timeout = setTimeout(() => finish(undefined, 'Easy scramble generation timed out. Try again.'), 185000);
      if (signal?.aborted) { abort(); return; }
      signal?.addEventListener('abort', abort, { once: true });
      worker.onerror = () => finish();
      worker.onmessage = ({ data }: MessageEvent<GenerationEvent>) => {
        if (data.type === 'row') finish(data.row.scramble);
        else if (data.type === 'error') finish(undefined, data.message);
        else if (data.type === 'done') finish();
      };
      worker.postMessage({ mode: kind === 'easy-cross' ? 'cross' : 'xcross', metric: 'HTM', cross: 'White',
        pair: 'any', secondPair: 'any', relation: 'any', minimum: 3, maximum: 3, count: 1 });
    });
  }
  const faces = kind === '2-gen' ? 'RU' : kind === '3-gen' ? 'RUF' : 'URFDLB', moves: string[] = [];
  while (moves.length < 25) {
    const last = moves.at(-1), before = moves.at(-2);
    const allowed = [...faces].filter(face => last?.[0] !== face && !(before?.[0] === face && sameAxis(last!, face)));
    const face = allowed[Math.floor(random() * allowed.length)];
    moves.push(face + (kind === 'doubles' ? '2' : ['', '2', "'"][Math.floor(random() * 3)]));
  }
  return moves.join(' ');
}
