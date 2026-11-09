/** @jest-environment jsdom */
import { deserialize, serialize } from 'node:v8';
import { algorithms, casePattern } from '../../src/database/algorithms';
import { getAlgorithms, readCustomAlgorithms } from '../../src/database/customAlgorithms';
import { favoriteId } from '../../src/database/favorites';
import { algorithmMatcher } from '../../timer/src/Analysis/algorithmMatching';
import { comfortableAlgorithm, learnAlgorithms, unlearnAlgorithms, usedAlgorithms, validateUserAlgorithm } from '../../timer/src/Analysis/favoriteAlgorithms';
import { loadCube } from '../../timer/src/Core/puzzle';
import type { Solve } from '../../timer/src/Core/engine';

const cube = await loadCube(), matcher = algorithmMatcher(cube);
const entry = algorithms.find(entry => entry.category === 'PLL' && entry.id === 'T')!;
const novel = `(R U R' U')6 ${entry.algorithm}`;
function recording(id: string, algorithm = novel): Solve {
  const moves = matcher.outerMoves(algorithm).moves.map((move, index) => ({
    move, elapsed: index * 100, hostTime: index * 100, localTimestamp: index * 100, cubeTimestamp: null,
  }));
  return {
    version: 1, id, session: 'Default', createdAt: '2026-11-05T00:00:00Z', device: 'Test',
    scramble: '', startFacelets: cube.facelets(casePattern(cube, algorithm)), duration: moves.length * 100,
    status: 'complete', reason: '', timingBasis: 'host', moves,
  };
}
beforeEach(() => {
  localStorage.clear(); getAlgorithms();
  Object.defineProperty(globalThis, 'structuredClone', { configurable: true, value: <T>(value: T): T => deserialize(serialize(value)) as T });
});
test('learning requires five distinct complete solves and persists a novel PLL algorithm as a favorite', async () => {
  const solves = Array.from({ length: 5 }, (_, i) => recording(String(i)));
  expect(usedAlgorithms(solves[0], cube).find(use => use.caseKey === 'PLL-T')!.matches).toEqual([]);
  expect(await learnAlgorithms(solves.slice(0, 4), cube)).toEqual(new Set());
  expect(await learnAlgorithms([...solves.slice(0, 4), solves[0]], cube)).toEqual(new Set());
  expect(await learnAlgorithms([...solves.slice(0, 4), { ...solves[4], status: 'incomplete' }], cube)).toEqual(new Set());
  const found = await learnAlgorithms(solves, cube), [algorithm] = readCustomAlgorithms()['PLL-T'];
  expect(found).toEqual(new Set([favoriteId(entry, algorithm)]));
  expect(getAlgorithms().find(candidate => candidate.category === 'PLL' && candidate.id === 'T')!.options).toContain(algorithm);
  expect(validateUserAlgorithm(entry, algorithm, cube)).toBe(algorithm);
  expect(usedAlgorithms(solves[0], cube).find(use => use.caseKey === 'PLL-T')!.matches).toContain(favoriteId(entry, algorithm));
  expect(await learnAlgorithms(solves, cube)).toEqual(new Set());
});
test('known alternatives are never re-added and other categories are not learned', async () => {
  const f2l = algorithms.find(entry => entry.category === 'F2L')!;
  const solves = Array.from({ length: 5 }, (_, i) => [
    recording(`known-${i}`, entry.options[1]),
    recording(`f2l-${i}`, `(R U R' U')6 ${f2l.algorithm}`),
  ]).flat();
  expect(await learnAlgorithms(solves, cube)).toEqual(new Set());
  expect(readCustomAlgorithms()).toEqual({});
});
test('new OLL algorithms are also learned after five solves', async () => {
  const oll = algorithms.find(entry => entry.category === 'OLL' && entry.id === '27')!;
  const solves = Array.from({ length: 5 }, (_, i) => recording(`oll-${i}`, `(R U R' U')6 ${oll.algorithm}`));
  const found = await learnAlgorithms(solves, cube), [algorithm] = readCustomAlgorithms()['OLL-27'];
  expect(found).toEqual(new Set([favoriteId(oll, algorithm)]));
  expect(validateUserAlgorithm(oll, algorithm, cube)).toBe(algorithm);
});
test('unlearn detects equivalent AUF/yaw usages independently of favorite-mistake switches', () => {
  const solve = recording('unlearn', `y U2 ${entry.algorithm} U'`);
  expect(unlearnAlgorithms(solve, cube, new Set([favoriteId(entry, entry.algorithm)]))).toHaveLength(1);
  const other = algorithms.find(candidate => candidate.category === 'PLL' && candidate.id === 'Y')!;
  expect(unlearnAlgorithms(solve, cube, new Set([favoriteId(other, other.algorithm)]))).toEqual([]);
});
test('comfortable orientation keeps cross down and minimizes D/L/B turns across yaw choices', () => {
  const algorithm = comfortableAlgorithm("L U L' U' L' B L2 U' L' U' L U L' B'", cube);
  expect(algorithm.split(' ').every(move => 'URF'.includes(move[0]))).toBe(true);
  expect(matcher.signature(algorithm)).toBe(matcher.signature(entry.algorithm));
});
