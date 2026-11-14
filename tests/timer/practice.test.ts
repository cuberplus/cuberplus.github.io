/** @jest-environment jsdom */
import { beforeAll, beforeEach, expect, test } from '@jest/globals';
import { webcrypto } from 'node:crypto';
import { algorithms, categories } from '../../src/database/algorithms';
import { Practice, PRACTICE_STORAGE, TRAININGS_STORAGE, readAttempts, readTrainings, saveAttempt, type PracticeAttempt } from '../../src/trainer/practice';
import { caseKey, trainingLink } from '../../src/trainer/cases';
import { defaultBlitzSettings } from '../../src/trainer/blitz';
import { algorithmMatcher } from '../../timer/src/Analysis/algorithmMatching';
import { loadCube, type Cube } from '../../timer/src/Core/puzzle';

let cube: Cube;
beforeAll(async () => { cube = await loadCube(); Object.defineProperty(globalThis, 'crypto', { value: webcrypto }); });
beforeEach(() => localStorage.clear());
test('retry resets the same virtual case and saves the failed attempt; skip advances without physical resets', () => {
  const cases = ['OLL-27', 'PLL-T'].map(key => algorithms.find(entry => caseKey(entry) === key)!);
  let draw = 0;
  const practice = new Practice(cube, cases, 'custom', defaultBlitzSettings, 0, () => draw++ % 2 ? .8 : .3);
  expect(practice.retry(100)).toBeNull();
  practice.tick(3000);
  const entry = practice.queue[0], next = practice.queue[1], initial = cube.facelets(practice.pattern);
  const solution = practice.solution, frame = practice.colorFrame;
  practice.move('R', 3400);
  const retry = practice.retry(4000)!;
  expect(retry).toMatchObject({ caseKey: caseKey(entry), dnf: true, recognitionMilliseconds: 400, executionMilliseconds: 600 });
  expect(practice.queue[0]).toBe(entry);
  expect(cube.facelets(practice.pattern)).toBe(initial);
  expect(practice.solution).toBe(solution);
  expect(practice.colorFrame).toBe(frame);
  expect(practice.moves).toEqual([]);
  expect(practice.firstMoveAt).toBeNull();
  const skipped = practice.skip(4700)!;
  expect(skipped).toMatchObject({ caseKey: caseKey(entry), dnf: true, recognitionMilliseconds: 700, executionMilliseconds: 0 });
  expect(practice.queue[0]).toBe(next);
  expect(practice.queue).toHaveLength(4);
  saveAttempt(retry); saveAttempt(skipped);
  expect(readAttempts()).toEqual([skipped, retry]);
  expect(complete(practice, practice.solution, 4700)?.dnf).toBeUndefined();
});
function complete(practice: Practice, algorithm: string, start = practice.splitAt): PracticeAttempt | null {
  let now = start, attempt: PracticeAttempt | null = null;
  for (const move of algorithmMatcher(cube).outerMoves(algorithm).moves) {
    attempt = practice.move(move, now += 100);
    if (attempt) break;
  }
  return attempt;
}
test.each(categories)('%s canonical cases can repeat continuously without a physical reset', category => {
  for (const entry of algorithms.filter(entry => entry.category === category)) {
    const practice = new Practice(cube, [entry], 'single', defaultBlitzSettings, 0, () => .37);
    expect(practice.move('R', 100)).toBeNull();
    practice.tick(2999); expect(practice.phase).toBe('countdown');
    practice.tick(3000);
    for (let i = 0; i < 2; i++) {
      const attempt = complete(practice, practice.solution);
      expect({ key: caseKey(entry), attempt }).toEqual({ key: caseKey(entry), attempt: expect.objectContaining({
        caseKey: caseKey(entry), recognitionMilliseconds: 100, executionMilliseconds: expect.any(Number),
      }) });
      expect(practice.queue).toHaveLength(4);
      expect(practice.moves).toEqual([]);
      expect(practice.firstMoveAt).toBeNull();
    }
  }
});
test('a mixed custom training samples only selected cases and records recognition and execution separately', () => {
  const cases = ['F2L-1', 'OLL-27', 'PLL-T'].map(key => algorithms.find(entry => caseKey(entry) === key)!);
  let random = 0;
  const practice = new Practice(cube, cases, 'mixed', defaultBlitzSettings, 0, () => [0, .5, .9][random++ % 3]);
  expect(new Set(practice.queue.map(entry => entry.category))).toEqual(new Set(['F2L', 'OLL', 'PLL']));
  practice.tick(3000);
  for (let i = 0; i < 6; i++) {
    const entry = practice.queue[0], startedAt = practice.splitAt;
    expect(practice.move('x', startedAt + 5)).toBeNull();
    const attempt = complete(practice, practice.solution, startedAt + 600)!;
    expect(attempt).toMatchObject({ trainingId: 'mixed', caseKey: caseKey(entry), recognitionMilliseconds: 700 });
    expect(attempt.executionMilliseconds).toBeGreaterThanOrEqual(0);
    expect(practice.splitAt - startedAt).toBe(attempt.recognitionMilliseconds + attempt.executionMilliseconds);
    saveAttempt(attempt);
  }
  expect(readAttempts()).toHaveLength(6);
  const last = readAttempts()[0];
  saveAttempt(last); expect(readAttempts()).toHaveLength(6);
  practice.phase = 'cancelled'; expect(practice.move('R', 10000)).toBeNull();
});
test.each(categories)('%s pre/post AUFs can be enabled independently without breaking completion', category => {
  const entry = algorithms.find(item => item.category === category)!;
  for (const randomPreAuf of [false, true]) for (const randomPostAuf of [false, true]) {
    const practice = new Practice(cube, [entry], 'single', { ...defaultBlitzSettings, randomPreAuf, randomPostAuf }, 0, () => .3);
    practice.tick(3000);
    expect(practice.preAuf).toBe(randomPreAuf ? 'U' : '');
    expect(practice.postAuf).toBe(randomPostAuf ? 'U' : '');
    expect(complete(practice, practice.solution)).not.toBeNull();
  }
});
test.each(categories)('%s completes with every pre/post AUF combination', category => {
  const entry = algorithms.find(item => item.category === category)!;
  for (const pre of [0, .3, .6, .9]) for (const post of [0, .3, .6, .9]) {
    let draw = 0;
    const practice = new Practice(cube, [entry], 'single', defaultBlitzSettings, 0, () => {
      const index = draw++;
      return index === 1 ? pre : index === 2 ? post : .3;
    });
    practice.tick(3000);
    expect(practice.preAuf).toBe(['', 'U', 'U2', "U'"][Math.floor(pre * 4)]);
    expect(practice.postAuf).toBe(['', 'U', 'U2', "U'"][Math.floor(post * 4)]);
    expect(complete(practice, practice.solution)).not.toBeNull();
  }
});
test('all three upcoming cases retain their sampled setup, solution and color frame through retry and advancement', () => {
  let seed = 193;
  const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  const practice = new Practice(cube, algorithms, 'mixed', { ...defaultBlitzSettings, crossColor: 'Random', frontColor: 'Random' }, 0, random);
  practice.tick(3000);
  const upcoming = practice.queue.slice(1);
  for (const entry of upcoming) {
    practice.move('R', practice.splitAt + 100);
    practice.retry(practice.splitAt + 200);
    expect(practice.queue).toContain(entry);
    practice.skip(practice.splitAt + 300);
    expect(practice.queue[0]).toBe(entry);
    expect(practice.initialPattern).toBe(entry.pattern);
    expect(practice.pattern).toBe(entry.pattern);
    expect(practice).toMatchObject({ preAuf: entry.preAuf, postAuf: entry.postAuf, colorFrame: entry.colorFrame, solution: entry.solution });
  }
  expect(complete(practice, practice.solution)).not.toBeNull();
});
test('a chosen alternative sets up that solution and an F2L finish must restore previously solved pairs and the cross', () => {
  const entry = algorithms.find(entry => caseKey(entry) === 'F2L-1')!, algorithm = entry.options[1];
  const practice = new Practice(cube, [entry], 'single', defaultBlitzSettings, 0, () => .3, algorithm);
  practice.tick(3000);
  expect(complete(practice, practice.solution)).toMatchObject({ algorithm });
  practice.pattern = cube.solved().applyMove("D'");
  expect(practice.move('U', 4000)).toBeNull();
  practice.pattern = cube.solved().applyAlg("L U L'");
  expect(practice.move('U', 4100)).toBeNull();
});
test('saved trainings have no count limit, malformed data is rejected, and invalid orientations fail before countdown', () => {
  const trainings = Array.from({ length: 250 }, (_, i) => ({ id: `${i}`, name: `Training ${i}`, cases: ['OLL-27', 'PLL-T'] }));
  localStorage.setItem(TRAININGS_STORAGE, JSON.stringify(trainings));
  expect(readTrainings()).toEqual(trainings);
  localStorage.setItem(TRAININGS_STORAGE, '[{"id":"bad","name":"Bad","cases":[]}]');
  expect(() => readTrainings()).toThrow();
  localStorage.setItem(PRACTICE_STORAGE, '{}');
  expect(() => readAttempts()).toThrow();
  expect(localStorage.getItem(PRACTICE_STORAGE)).toBe('{}');
  expect(() => new Practice(cube, [], 'empty', defaultBlitzSettings, 0)).toThrow('at least one');
  expect(() => new Practice(cube, [algorithms[0]], 'bad', { ...defaultBlitzSettings, frontColor: 'Yellow' }, 0)).toThrow('adjacent');
  expect(trainingLink('PLL-T')).toBe('/trainer/?case=PLL-T');
});
