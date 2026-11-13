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
      return index === 4 ? pre : index === 5 ? post : .3;
    });
    practice.tick(3000);
    expect(complete(practice, practice.solution)).not.toBeNull();
  }
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
