/** @jest-environment jsdom */
import { beforeEach, expect, jest, test } from '@jest/globals';
import type { GenerationEvent } from '../../scrambler/src/cube/generation';

const generate = jest.fn<() => Promise<string>>().mockResolvedValue('R U2');
const terminate = jest.fn(), postMessage = jest.fn();
const worker = { onmessage: null as ((event: { data: GenerationEvent }) => void) | null, onerror: null as (() => void) | null, terminate, postMessage };
await jest.unstable_mockModule('../../timer/src/Core/puzzle', () => ({
  generateScramble: generate, sameAxis: (a: string, b: string) => ['UD', 'RL', 'FB'].some(axis => axis.includes(a[0]) && axis.includes(b[0])),
}));
await jest.unstable_mockModule('../../scrambler/src/cube/workerClient', () => ({ createSolverWorker: () => worker }));
const { sessionScramble, readSessionScramblers, SESSION_SCRAMBLERS } = await import('../../timer/src/Core/scramblers');
beforeEach(() => { localStorage.clear(); jest.clearAllMocks(); });
test('default uses the existing random-state generator and invalid saved choices are ignored', async () => {
  expect(await sessionScramble()).toBe('R U2');
  expect(generate).toHaveBeenCalledTimes(1);
  localStorage.setItem(SESSION_SCRAMBLERS, JSON.stringify({ Default: 'doubles', Practice: '2-gen', Bad: 'missing' }));
  expect(readSessionScramblers()).toEqual({ Practice: '2-gen' });
  localStorage.setItem(SESSION_SCRAMBLERS, 'null');
  expect(readSessionScramblers()).toEqual({});
});
test.each(['2-gen', '3-gen', 'doubles'] as const)('%s restricts faces/suffixes and cannot loop with a constant random source', async kind => {
  for (const random of [() => 0, () => .999, Math.random]) {
    const moves = (await sessionScramble(kind, random)).split(' ');
    expect(moves).toHaveLength(25);
    for (const [i, move] of moves.entries()) {
      expect(move).toMatch(kind === '2-gen' ? /^[RU](2|')?$/ : kind === '3-gen' ? /^[RUF](2|')?$/ : /^[URFDLB]2$/);
      if (i) expect(move[0]).not.toBe(moves[i - 1][0]);
      if (i > 1 && move[0] === moves[i - 2][0]) {
        expect(['UD', 'RL', 'FB'].some(axis => axis.includes(move[0]) && axis.includes(moves[i - 1][0]))).toBe(false);
      }
    }
  }
});
test.each(['easy-cross', 'easy-xcross'] as const)('%s reuses exact-search generation and terminates its worker', async kind => {
  const pending = sessionScramble(kind);
  await new Promise(resolve => setTimeout(resolve, 0));
  expect(postMessage).toHaveBeenCalledWith(expect.objectContaining({ mode: kind === 'easy-cross' ? 'cross' : 'xcross', minimum: 3, maximum: 3, count: 1 }));
  worker.onmessage!({ data: { type: 'row', row: { scramble: 'F2 R U' } } as GenerationEvent });
  expect(await pending).toBe('F2 R U');
  expect(terminate).toHaveBeenCalledTimes(1);
});
test('cancelled easy generation rejects and releases its worker', async () => {
  const controller = new AbortController(), pending = sessionScramble('easy-cross', Math.random, controller.signal);
  const rejected = expect(pending).rejects.toThrow('cancelled');
  await new Promise(resolve => setTimeout(resolve, 0));
  controller.abort();
  await rejected;
  expect(terminate).toHaveBeenCalledTimes(1);
});
