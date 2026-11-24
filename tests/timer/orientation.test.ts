/** @jest-environment jsdom */
import { webcrypto } from 'node:crypto';
import { deserialize, serialize } from 'node:v8';
import { loadCube, type Cube } from '../../timer/src/Core/puzzle';
import { orientationCard, orientationStats, ORIENTATION_ATTEMPTS, ORIENTATION_SETTINGS, readOrientationAttempts, saveOrientationAttempt, type OrientationAttempt, type OrientationStage } from '../../src/trainer/orientation';
import { adjacentColors, cubeColors } from '../../src/trainer/blitz';
import { readSettings, validateSettings } from '../../src/cloud/backupSettings';

let cube: Cube, seed = 937;
const random = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296);
beforeAll(async () => { Object.defineProperty(globalThis, 'crypto', { value: webcrypto, configurable: true }); cube = await loadCube(); });
beforeEach(() => {
  localStorage.clear();
  Object.defineProperty(globalThis, 'structuredClone', { configurable: true, value: <T>(value: T): T => deserialize(serialize(value)) as T });
});
test.each(['scrambled', 'cross-solved', 'f2l-solved'] as OrientationStage[])('%s cards preserve stage, legality, edge identity and orientation', stage => {
  const orientations = new Set<boolean>(), positions = new Set<number>();
  for (let i = 0; i < 80; i++) {
    const card = orientationCard(cube, stage, random), pattern = cube.parse(card.facelets), edges = pattern.patternData['EDGES'];
    expect(edges.pieces[card.position]).toBe(card.edge);
    expect(card.oriented).toBe(edges.orientation[card.position] === 0);
    expect(card.edge !== card.position || !card.oriented).toBe(true);
    expect(card.caseKey).toBe(`${card.facelets}:${card.edge}`);
    orientations.add(card.oriented); positions.add(card.position);
    if (stage !== 'scrambled') for (const index of [4, 5, 6, 7]) {
      expect(edges.pieces[index]).toBe(index); expect(edges.orientation[index]).toBe(0);
    }
    if (stage === 'f2l-solved') for (const orbit of ['EDGES', 'CORNERS']) {
      const data = pattern.patternData[orbit];
      for (let index = 4; index < data.pieces.length; index++) { expect(data.pieces[index]).toBe(index); expect(data.orientation[index]).toBe(0); }
    }
    expect([0, 1, 8]).toContain(card.position);
  }
  expect(orientations.size).toBe(2);
  expect(positions.size).toBe(stage === 'f2l-solved' ? 2 : 3);
});
test('a state whose visible edges are solved still yields a visible unsolved target', () => {
  let calls = 0;
  const card = orientationCard(cube, 'f2l-solved', () => calls++ < 3 ? .999 : 0);
  const edges = cube.parse(card.facelets).patternData['EDGES'];
  expect([0, 1, 8]).toContain(card.position);
  expect(edges.pieces[card.position]).not.toBe(card.position);
});
test('attempts retain exact cases, response times and answers, with idempotent saving and backup restoration', () => {
  const card = orientationCard(cube, 'cross-solved', random);
  const attempt: OrientationAttempt = { ...card, date: '2026-11-23T12:00:00Z', answer: card.oriented, correct: true, milliseconds: 432.1, gray: true };
  saveOrientationAttempt(attempt); saveOrientationAttempt(attempt);
  expect(readOrientationAttempts()).toEqual([attempt]);
  const second = { ...attempt, id: crypto.randomUUID(), answer: !card.oriented, correct: false, milliseconds: 1000 };
  saveOrientationAttempt(second);
  expect(orientationStats(readOrientationAttempts())).toEqual([expect.objectContaining({ count: 2, accuracy: .5, average: 716.05 })]);
  const backup = readSettings();
  localStorage.clear();
  const restored = validateSettings(backup);
  localStorage.setItem(ORIENTATION_ATTEMPTS, restored[ORIENTATION_ATTEMPTS]!);
  expect(readOrientationAttempts()).toEqual([second, attempt]);
});
test('malformed saved results are never overwritten', () => {
  const broken = JSON.stringify([{ date: 'invalid' }]);
  localStorage.setItem(ORIENTATION_ATTEMPTS, broken);
  const card = orientationCard(cube, 'scrambled', random);
  expect(() => saveOrientationAttempt({ ...card, date: new Date().toISOString(), answer: true, correct: card.oriented, milliseconds: 100, gray: false })).toThrow('not been overwritten');
  expect(localStorage.getItem(ORIENTATION_ATTEMPTS)).toBe(broken);
});
test('all twenty-four color frames preserve center-relative answers and mapped target identities', () => {
  const frames = new Set<string>();
  const names = { U: 'White', R: 'Red', F: 'Green', D: 'Yellow', L: 'Orange', B: 'Blue' };
  for (const topColor of cubeColors) for (const frontColor of cubeColors) {
    if (!adjacentColors(topColor, frontColor)) continue;
    const card = orientationCard(cube, 'f2l-solved', random, { topColor, frontColor });
    const frame = cube.solved().applyAlg(card.colorFrame!), centers = frame.patternData['CENTERS'].pieces.map(piece => 'ULFRBD'[piece]);
    frames.add(card.colorFrame!);
    expect(names[centers[0] as keyof typeof names]).toBe(topColor);
    expect(names[centers[2] as keyof typeof names]).toBe(frontColor);
    const canonical = cube.parse(card.facelets);
    const rendered = frame.applyTransformation(canonical.experimentalToTransformation());
    expect(card.oriented).toBe(canonical.patternData['EDGES'].orientation[card.position] === 0);
    expect(rendered.patternData['EDGES'].pieces[card.position]).toBe(frame.patternData['EDGES'].pieces[card.edge]);
    for (const orbit of ['EDGES', 'CORNERS']) for (let slot = 4; slot < rendered.patternData[orbit].pieces.length; slot++)
      expect(rendered.patternData[orbit].pieces[slot]).toBe(frame.patternData[orbit].pieces[slot]);
  }
  expect(frames.size).toBe(24);
  expect(() => orientationCard(cube, 'scrambled', random, { topColor: 'White', frontColor: 'Yellow' })).toThrow('adjacent');
});
test.each([
  ['Red', 'Random', 4], ['Random', 'Green', 4], ['Random', 'Random', 24],
] as const)('random colors respect fixed top %s/front %s and vary valid frames', (topColor, frontColor, expected) => {
  const frames = new Set<string>();
  for (let i = 0; i < 300; i++) {
    const card = orientationCard(cube, 'cross-solved', random, { topColor, frontColor });
    frames.add(card.colorFrame!);
    const centers = cube.solved().applyAlg(card.colorFrame!).patternData['CENTERS'].pieces;
    if (topColor === 'Red') expect(centers[0]).toBe(3);
    if (frontColor === 'Green') expect(centers[2]).toBe(2);
  }
  expect(frames.size).toBe(expected);
});
test('backup round trips retain color preferences and exact recorded frames, accepting legacy settings', () => {
  const settings = { stage: 'cross-solved', gray: true, topColor: 'Random', frontColor: 'Blue' };
  localStorage.setItem(ORIENTATION_SETTINGS, JSON.stringify(settings));
  const card = orientationCard(cube, 'cross-solved', random, { topColor: 'Red', frontColor: 'Blue' });
  const attempt = { ...card, date: '2026-11-24T12:00:00Z', answer: card.oriented, correct: true, milliseconds: 300, gray: true };
  saveOrientationAttempt(attempt);
  const restored = validateSettings(readSettings());
  expect(JSON.parse(restored[ORIENTATION_SETTINGS]!)).toEqual(settings);
  localStorage.clear();
  localStorage.setItem(ORIENTATION_ATTEMPTS, restored[ORIENTATION_ATTEMPTS]!);
  expect(readOrientationAttempts()).toEqual([attempt]);
  expect(validateSettings({ [ORIENTATION_SETTINGS]: JSON.stringify({ stage: 'scrambled', gray: false }) })[ORIENTATION_SETTINGS]).toBeDefined();
  localStorage.setItem(ORIENTATION_ATTEMPTS, JSON.stringify([{ ...attempt, colorFrame: 'R' }]));
  expect(() => readOrientationAttempts()).toThrow('not been overwritten');
  expect(() => validateSettings({ [ORIENTATION_ATTEMPTS]: localStorage.getItem(ORIENTATION_ATTEMPTS) })).toThrow();
});
