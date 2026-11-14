/** @jest-environment jsdom */
import { beforeAll, beforeEach, expect, jest, test } from '@jest/globals';
import { webcrypto } from 'node:crypto';
import { Blitz, blitzOrientations, blitzPattern, BLITZ_SETTINGS_STORAGE, BLITZ_STORAGE, defaultBlitzSettings, readBlitzRuns, readBlitzSettings, saveBlitzRun } from '../../src/trainer/blitz';
import { algorithms, casePattern } from '../../src/database/algorithms';
import { loadCube, movesOf, type Cube } from '../../timer/src/Core/puzzle';

let cube: Cube;
beforeAll(async () => { cube = await loadCube(); Object.defineProperty(globalThis, 'crypto', { value: webcrypto }); });
beforeEach(() => localStorage.clear());
test('retry preserves the exact case, records a DNF split, and includes every attempt in a valid total', () => {
  const blitz = new Blitz(cube, 'PLL', () => .37);
  blitz.queue.splice(1);
  blitz.start(0); blitz.tick(3000);
  const entry = blitz.queue[0], initial = cube.facelets(blitz.pattern);
  blitz.move('R', 3400); blitz.retry(4000);
  expect(blitz.splits[0]).toMatchObject({ dnf: true, retry: true });
  expect(blitz.queue[0]).toBe(entry);
  expect(blitz.index).toBe(0);
  expect(cube.facelets(blitz.pattern)).toBe(initial);
  expect(blitz.moves).toEqual([]);
  expect(blitz.firstMoveAt).toBeNull();
  expect(blitz.splits[0]).toMatchObject({ dnf: true, milliseconds: 1000, recognitionMilliseconds: 400, executionMilliseconds: 600 });
  blitz.pattern = cube.solved().applyMove("R'");
  blitz.move('R', 4700);
  const run = blitz.result();
  expect(run.dnf).toBeUndefined();
  expect(run.milliseconds).toBe(1700);
  expect(run.splits[1]).toMatchObject({ caseId: entry.id, milliseconds: 700 });
  saveBlitzRun(run);
  expect(readBlitzRuns()).toEqual([run]);
});
test('skip advances without turns and marks both the case and finished Blitz DNF', () => {
  const blitz = new Blitz(cube, 'PLL', () => .37);
  blitz.queue.splice(2);
  blitz.skip(100);
  expect(blitz.splits).toEqual([]);
  blitz.start(0); blitz.tick(3000);
  blitz.skip(3800);
  expect(blitz.index).toBe(1);
  expect(blitz.moves).toEqual([]);
  expect(cube.facelets(blitz.pattern)).toBe(cube.facelets(blitzPattern(cube, blitz.queue[1])));
  blitz.skip(4500);
  expect(blitz.phase).toBe('complete');
  const run = blitz.result();
  expect(run).toMatchObject({ dnf: true, milliseconds: 1500 });
  expect(run.splits.every(split => split.dnf)).toBe(true);
  saveBlitzRun(run);
  expect(readBlitzRuns()).toEqual([run]);
});
test.each(['OLL', 'PLL'] as const)('%s Blitz solves every distinct case once without physical resets and saves exact splits', async kind => {
  const blitz = new Blitz(cube, kind, () => .37);
  expect(blitz.queue).toHaveLength(kind === 'OLL' ? 57 : 21);
  expect(new Set(blitz.queue.map(entry => entry.id)).size).toBe(blitz.queue.length);
  expect(blitz.queue.some(entry => entry.id === 'Solved')).toBe(false);
  blitz.start(100);
  expect(blitz.move('R', 200)).toBe(false);
  blitz.tick(3099); expect(blitz.phase).toBe('countdown');
  blitz.tick(3100); expect(blitz.phase).toBe('running');
  let now = 3100;
  while (blitz.phase === 'running') {
    const index = blitz.index;
    const moves = await cube.solution(cube.facelets(blitz.pattern));
    expect(moves.length).toBeGreaterThan(0);
    for (const move of moves) {
      now += 100;
      if (blitz.move(move, now)) break;
    }
    expect(blitz.index).toBe(index + 1);
    if (blitz.phase === 'running') expect(blitz.moves).toEqual([]);
  }
  const result = blitz.result();
  expect(result.splits).toHaveLength(blitz.queue.length);
  expect(result.splits.map(split => split.caseId)).toEqual(blitz.queue.map(entry => entry.id));
  expect(result.splits.map(split => split.permutation)).toEqual(blitz.queue.map(entry => entry.permutation));
  expect(result.splits.map(({ preAuf, postAuf }) => ({ preAuf, postAuf }))).toEqual(blitz.queue.map(({ preAuf, postAuf }) => ({ preAuf, postAuf })));
  expect(result.splits.every(split => split.recognitionMilliseconds === 100 &&
    split.executionMilliseconds === split.milliseconds - 100)).toBe(true);
  expect(result.milliseconds).toBe(now - 3100);
  expect(result.splits.reduce((sum, split) => sum + split.milliseconds, 0)).toBe(result.milliseconds);
  saveBlitzRun(result); saveBlitzRun(result);
  expect(readBlitzRuns()).toEqual([result]);
  expect(blitz.move('U', now + 100)).toBe(false);
}, 120000);
test('incomplete and disconnected drills cannot produce results and malformed storage is not overwritten', () => {
  const blitz = new Blitz(cube, 'PLL');
  expect(() => blitz.result()).toThrow('Finish every case');
  blitz.start(0); blitz.tick(3000); blitz.phase = 'cancelled';
  const before = cube.facelets(blitz.pattern);
  expect(blitz.move('R', 3500)).toBe(false);
  expect(cube.facelets(blitz.pattern)).toBe(before);
  expect(() => blitz.result()).toThrow();
  localStorage.setItem(BLITZ_STORAGE, '{}');
  expect(() => readBlitzRuns()).toThrow();
  expect(localStorage.getItem(BLITZ_STORAGE)).toBe('{}');
});
test.each(['OLL', 'PLL'] as const)('%s times recognition until the first turn and execution through completion, resetting for each case', async kind => {
  const blitz = new Blitz(cube, kind, () => .37);
  blitz.start(100);
  expect(blitz.move('R', 1000)).toBe(false);
  blitz.tick(3100);
  let now = 3100;
  for (const recognition of [700, 900]) {
    const openedAt = now, index = blitz.index;
    expect(blitz.move('x', now + 50)).toBe(false);
    expect(blitz.move('not a move', now + 100)).toBe(false);
    const moves = await cube.solution(cube.facelets(blitz.pattern));
    let turns = 0;
    for (const move of moves) {
      now += turns++ === 0 ? recognition : turns === 2 ? 600 : 100;
      if (blitz.move(move, now)) break;
    }
    expect(blitz.index).toBe(index + 1);
    expect(blitz.splits[index]).toMatchObject({
      milliseconds: now - openedAt, recognitionMilliseconds: recognition, executionMilliseconds: now - openedAt - recognition,
    });
  }
});
test('a first turn at timestamp zero and a one-turn finish have zero recognition and execution', () => {
  const blitz = new Blitz(cube, 'PLL');
  blitz.start(-3000); blitz.tick(0);
  blitz.pattern = cube.solved().applyMove("R'");
  expect(blitz.move('R', 0)).toBe(true);
  expect(blitz.splits[0]).toMatchObject({ milliseconds: 0, recognitionMilliseconds: 0, executionMilliseconds: 0 });
});
test.each([
  { recognitionMilliseconds: 200 },
  { executionMilliseconds: 800 },
  { recognitionMilliseconds: -200, executionMilliseconds: 1200 },
  { recognitionMilliseconds: 200, executionMilliseconds: -800 },
  { recognitionMilliseconds: 200, executionMilliseconds: 700 },
  { recognitionMilliseconds: null, executionMilliseconds: 1000 },
  { recognitionMilliseconds: '200', executionMilliseconds: 800 },
])('rejects invalid saved recognition/execution timing: %j', timing => {
  localStorage.setItem(BLITZ_STORAGE, JSON.stringify([{ id: 'invalid-timing', kind: 'PLL', date: new Date().toISOString(), milliseconds: 1000,
    splits: [{ caseId: 'T', milliseconds: 1000, ...timing }] }]));
  expect(() => readBlitzRuns()).toThrow('Saved Blitz');
});
test('AUFs are sampled once for every queued case and match the actual starting state', () => {
  let sample = 0;
  const blitz = new Blitz(cube, 'PLL', () => [0, .26, .51, .76][Math.floor(sample++ / 2) % 4]);
  expect(new Set(blitz.queue.map(entry => entry.auf))).toEqual(new Set(['', 'U', 'U2', "U'"]));
  blitz.start(0); blitz.tick(3000);
  const first = blitz.queue[0];
  expect(cube.facelets(blitz.pattern)).toBe(cube.facelets(casePattern(cube, `${first.preAuf} ${first.algorithm} ${first.postAuf}`)));
  const moves = blitz.moves;
  blitz.move('R', 3100);
  expect(blitz.moves).toBe(moves);
  expect(moves).toEqual(['R']);
});
test('PLL samples all sixteen independent pre/post AUF pairs once per queued case', () => {
  let sample = 0;
  const blitz = new Blitz(cube, 'PLL', () => {
    const pair = Math.floor(sample / 3) % 16, role = sample++ % 3;
    return role === 0 ? Math.floor(pair / 4) / 4 : role === 2 ? pair % 4 / 4 : 0;
  });
  expect(new Set(blitz.queue.map(entry => `${entry.preAuf}:${entry.postAuf}`)).size).toBe(16);
  const before = blitz.queue.map(({ preAuf, postAuf }) => ({ preAuf, postAuf }));
  blitz.start(0); blitz.tick(3000); blitz.move('R', 3200);
  expect(blitz.queue.map(({ preAuf, postAuf }) => ({ preAuf, postAuf }))).toEqual(before);
});
test('every PLL and AUF combination is legal and solves with pre-AUF, algorithm, then post-AUF', () => {
  const aufs = ['', 'U', 'U2', "U'"], tStates = new Set<string>();
  for (const entry of algorithms.filter(entry => entry.category === 'PLL' && entry.id !== 'Solved')) {
    for (const preAuf of aufs) for (const postAuf of aufs) {
      const pattern = blitzPattern(cube, { ...entry, preAuf, postAuf });
      expect(() => cube.parse(cube.facelets(pattern))).not.toThrow();
      expect(cube.facelets(pattern).slice(0, 9)).toBe('UUUUUUUUU');
      const beforePost = pattern.applyAlg(`${preAuf} ${entry.algorithm}`);
      expect(cube.isSolved(beforePost)).toBe(postAuf === '');
      expect(cube.isSolved(beforePost.applyAlg(postAuf))).toBe(true);
      if (entry.id === 'T') tStates.add(cube.facelets(pattern));
    }
  }
  expect(tStates.size).toBe(16);
});
test('PLL does not complete or stop execution timing until the final AUF', () => {
  const blitz = new Blitz(cube, 'PLL', () => .51);
  blitz.index = blitz.queue.findIndex(entry => entry.id === 'T');
  const index = blitz.index, entry = blitz.queue[index];
  blitz.start(0); blitz.tick(3000);
  let now = 3000;
  for (const move of movesOf(`${entry.preAuf} ${entry.algorithm}`)) expect(blitz.move(move, now += 100)).toBe(false);
  expect(blitz.index).toBe(index);
  expect(blitz.move(entry.postAuf!, now += 500)).toBe(true);
  expect(blitz.index).toBe(index + 1);
  expect(blitz.splits[0]).toMatchObject({ preAuf: 'U2', postAuf: 'U2', milliseconds: now - 3000,
    recognitionMilliseconds: 100, executionMilliseconds: now - 3100 });
});
test.each([
  { preAuf: 'R', postAuf: 'U' }, { preAuf: 'U', postAuf: 'D' }, { preAuf: 'U' }, { postAuf: '' },
])('rejects invalid saved PLL AUFs: %j', auf => {
  localStorage.setItem(BLITZ_STORAGE, JSON.stringify([{ id: 'invalid-auf', kind: 'PLL', date: new Date().toISOString(), milliseconds: 1000,
    splits: [{ caseId: 'T', milliseconds: 1000, ...auf }] }]));
  expect(() => readBlitzRuns()).toThrow('Saved Blitz');
});
test('every OLL keeps its orientation and F2L but no longer forces the canonical PLL result', () => {
  let seed = 193;
  const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  const blitz = new Blitz(cube, 'OLL', random);
  let unsolvedPLL = 0;
  for (const entry of blitz.queue) {
    const canonical = casePattern(cube, entry.algorithm).applyAlg(entry.auf), randomized = blitzPattern(cube, entry);
    expect(() => cube.parse(cube.facelets(randomized))).not.toThrow();
    for (const orbit of ['EDGES', 'CORNERS'] as const) {
      expect(randomized.patternData[orbit].orientation).toEqual(canonical.patternData[orbit].orientation);
      expect(randomized.patternData[orbit].pieces.slice(4)).toEqual(cube.solved().patternData[orbit].pieces.slice(4));
    }
    const oriented = randomized.applyTransformation(canonical.experimentalToTransformation()!.invert());
    expect(cube.facelets(oriented).slice(0, 9)).toBe('UUUUUUUUU');
    for (const orbit of ['EDGES', 'CORNERS'] as const) {
      expect(oriented.patternData[orbit].pieces.slice(4)).toEqual(cube.solved().patternData[orbit].pieces.slice(4));
      expect(oriented.patternData[orbit].orientation.every(value => value === 0)).toBe(true);
    }
    if (!cube.isSolved(oriented)) unsolvedPLL++;
  }
  expect(unsolvedPLL).toBeGreaterThan(50);
  expect(new Set(blitz.queue.map(entry => JSON.stringify(entry.permutation))).size).toBeGreaterThan(40);
  blitz.start(0); blitz.tick(3000);
  expect(cube.facelets(blitz.pattern)).toBe(cube.facelets(blitzPattern(cube, blitz.queue[0])));
});
test('OLL sampling covers all 288 legal permutations evenly without changing orientation', () => {
  const samples: number[][] = [];
  for (let a = 0; a < 4; a++) for (let b = 0; b < 3; b++) for (let c = 0; c < 2; c++) samples.push([a / 4, b / 3, c / 2]);
  const counts = new Map<string, number>();
  for (const edges of samples) for (const corners of samples) {
    const sequence = [0, 0, 0, ...edges, ...corners];
    let index = 0;
    const entry = new Blitz(cube, 'OLL', () => sequence[index++ % sequence.length]).queue.find(entry => entry.id === '27')!;
    const pattern = blitzPattern(cube, entry);
    expect(() => cube.parse(cube.facelets(pattern))).not.toThrow();
    const key = JSON.stringify(entry.permutation);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  expect(counts.size).toBe(288);
  expect(new Set(counts.values())).toEqual(new Set([2]));
});
test.each(['OLL', 'PLL'] as const)('%s pre/post AUF options operate independently', kind => {
  for (const randomPreAuf of [false, true]) for (const randomPostAuf of [false, true]) {
    const blitz = new Blitz(cube, kind, () => .3, { ...defaultBlitzSettings, randomPreAuf, randomPostAuf });
    for (const entry of blitz.queue) {
      expect(entry.preAuf).toBe(randomPreAuf ? 'U' : '');
      expect(entry.postAuf).toBe(randomPostAuf ? 'U' : '');
    }
  }
});
test('gray-sticker preference defaults off, persists, and accepts older settings', () => {
  expect(readBlitzSettings().hidePLL).toBe(false);
  localStorage.setItem(BLITZ_SETTINGS_STORAGE, JSON.stringify({ ...defaultBlitzSettings, hidePLL: true }));
  expect(readBlitzSettings().hidePLL).toBe(true);
  localStorage.setItem(BLITZ_SETTINGS_STORAGE, JSON.stringify({ hidePLL: 'yes', caseNames: false }));
  expect(readBlitzSettings()).toEqual({ ...defaultBlitzSettings, caseNames: false });
  const run = { id: 'legacy', kind: 'OLL', date: new Date().toISOString(), milliseconds: 1000, splits: [{ caseId: '27', milliseconds: 1000 }],
    settings: { upcomingCases: true, caseNames: true, crossColor: 'Yellow', frontColor: 'Green' } };
  localStorage.setItem(BLITZ_STORAGE, JSON.stringify([run]));
  expect(readBlitzRuns()).toEqual([run]);
  localStorage.setItem(BLITZ_STORAGE, JSON.stringify([{ ...run, settings: { ...run.settings, hidePLL: 'yes' } }]));
  expect(() => readBlitzRuns()).toThrow('Saved Blitz');
});
test('settings retain explicit boolean choices and default invalid fields independently', () => {
  const choices = { upcomingCases: false, caseNames: false, solutionAlgorithms: false, randomPreAuf: false, randomPostAuf: false, hidePLL: true };
  localStorage.setItem(BLITZ_SETTINGS_STORAGE, JSON.stringify({ ...choices, crossColor: 'Random', frontColor: 'Red' }));
  expect(readBlitzSettings()).toEqual({ ...choices, crossColor: 'Random', frontColor: 'Red' });
  localStorage.setItem(BLITZ_SETTINGS_STORAGE, JSON.stringify({ ...choices, upcomingCases: 0, solutionAlgorithms: null, randomPostAuf: 'false',
    hidePLL: 1, crossColor: 'invalid', frontColor: 'Blue' }));
  expect(readBlitzSettings()).toEqual({ ...defaultBlitzSettings, caseNames: false, randomPreAuf: false, frontColor: 'Blue' });
  localStorage.setItem(BLITZ_SETTINGS_STORAGE, JSON.stringify({ ...choices, crossColor: 'White', frontColor: 'Yellow' }));
  expect(readBlitzSettings()).toEqual({ ...choices, crossColor: 'Yellow', frontColor: 'Green' });
});
test.each(['null', '[]', 'false', '42', '"not settings"', '{'])('unusable settings %s fall back without overwriting storage', saved => {
  localStorage.setItem(BLITZ_SETTINGS_STORAGE, saved);
  expect(readBlitzSettings()).toEqual(defaultBlitzSettings);
  expect(localStorage.getItem(BLITZ_SETTINGS_STORAGE)).toBe(saved);
});
test.each([
  { edges: [1, 0, 2, 3], corners: [0, 1, 2, 3] },
  { edges: [0, 0, 2, 3], corners: [0, 1, 2, 3] },
  { edges: [0, 1, 2, 4], corners: [0, 1, 2, 3] },
  { edges: [0, 1, 2], corners: [0, 1, 2, 3] },
  { corners: [0, 1, 2, 3] },
])('rejects invalid saved PLL permutations: %j', permutation => {
  localStorage.setItem(BLITZ_STORAGE, JSON.stringify([{ id: 'invalid', kind: 'OLL', date: new Date().toISOString(), milliseconds: 1000,
    splits: [{ caseId: '27', milliseconds: 1000, permutation }] }]));
  expect(() => readBlitzRuns()).toThrow('Saved Blitz');
});
test('all orientations use adjacent cross/front colors and fixed or random choices are respected', () => {
  const orientations = blitzOrientations(cube);
  expect(orientations).toHaveLength(24);
  expect(new Set(orientations.map(frame => `${frame.crossColor}:${frame.frontColor}`)).size).toBe(24);
  const defaults = new Blitz(cube, 'PLL');
  expect(defaults.queue.every(entry => entry.crossColor === 'Yellow' && entry.frontColor === 'Green' && entry.colorFrame === '')).toBe(true);
  for (const { crossColor, frontColor } of orientations) {
    const fixed = new Blitz(cube, 'PLL', Math.random, { ...defaultBlitzSettings, crossColor, frontColor });
    expect(fixed.queue.every(entry => entry.crossColor === crossColor && entry.frontColor === frontColor)).toBe(true);
  }
  const randomCross = new Blitz(cube, 'PLL', Math.random, { ...defaultBlitzSettings, crossColor: 'Random', frontColor: 'Red' });
  expect(randomCross.queue.every(entry => entry.frontColor === 'Red' && !['Red', 'Orange'].includes(entry.crossColor))).toBe(true);
  expect(() => new Blitz(cube, 'PLL', Math.random, { ...defaultBlitzSettings, crossColor: 'White', frontColor: 'Yellow' })).toThrow('adjacent');
});
test('settings are copied into a run, survive storage, and old results remain readable', async () => {
  const settings = { ...defaultBlitzSettings, upcomingCases: false, caseNames: false };
  const blitz = new Blitz(cube, 'PLL', () => .37, settings);
  settings.caseNames = true;
  blitz.start(0); blitz.tick(3000);
  let now = 3000;
  while (blitz.phase === 'running') {
    for (const move of await cube.solution(cube.facelets(blitz.pattern))) if (blitz.move(move, now += 100)) break;
  }
  const run = blitz.result();
  expect(run.settings).toEqual({ ...defaultBlitzSettings, upcomingCases: false, caseNames: false });
  expect(run.splits[0]).toMatchObject({ auf: blitz.queue[0].auf, colorFrame: '', crossColor: 'Yellow', frontColor: 'Green' });
  saveBlitzRun(run);
  expect(readBlitzRuns()).toEqual([run]);
  localStorage.setItem(BLITZ_STORAGE, JSON.stringify([{ ...run, settings: undefined, splits: run.splits.map(({ caseId, milliseconds }) => ({ caseId, milliseconds })) }]));
  expect(readBlitzRuns()[0].settings).toBeUndefined();
  localStorage.setItem(BLITZ_SETTINGS_STORAGE, JSON.stringify({ ...defaultBlitzSettings, caseNames: false }));
  expect(readBlitzSettings().caseNames).toBe(false);
}, 120000);
