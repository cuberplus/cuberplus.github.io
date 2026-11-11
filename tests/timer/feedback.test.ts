/** @jest-environment jsdom */
import { IDBFactory } from 'fake-indexeddb';
import { deserialize, serialize } from 'node:v8';
import { solveFeedback } from '../../shared/workers/dataClient';
import { importedAnalysis } from '../../timer/src/Data/csvImport';
import { saveSolves, readSolves } from '../../timer/src/Data/storage';
import { SOLVED } from '../../timer/src/Core/puzzle';
import type { Solve } from '../../timer/src/Core/engine';
import { GetEmptySolve, GetEmptyStep } from '../../smartcubeanalyzer/src/Helpers/CubeHelpers';
import { StepName } from '../../smartcubeanalyzer/src/Models/Types';
import { markMistakes } from '../../smartcubeanalyzer/src/Analysis/MistakeAnalysis';

beforeEach(() => {
  Object.defineProperty(globalThis, 'indexedDB', { configurable: true, value: new IDBFactory() });
  Object.defineProperty(globalThis, 'structuredClone', { configurable: true, value: <T>(value: T): T => deserialize(serialize(value)) as T });
});
function fixture(index: number, turns = 8): Solve {
  const date = new Date(Date.UTC(2026, 0, 1, 0, 0, index)).toISOString(), id = `feedback-${index}`;
  const step = { ...GetEmptyStep(), name: StepName.PLL, case: index < 5 || index === 105 ? 'T' : 'Jb',
    moves: Array.from({ length: turns }, (_, i) => i % 2 ? 'F' : 'R').join(' '), turns, time: 10, executionTime: 10 };
  return { version: 1, id, createdAt: date, session: 'Practice - Cubeast', device: 'Cubeast', scramble: 'R', startFacelets: SOLVED,
    duration: 10000, status: 'complete', timingBasis: 'host', reason: '', moves: [],
    imported: { ...GetEmptySolve(), id, source: 'cubeast', rawSource: 'cubeast', rawSourceId: id, date,
      session: 'Practice', time: 10, executionTime: 10, turns, steps: [step] } };
}
test('worker feedback preserves full-session case learning, unsaved edits, membership and deletion', async () => {
  const history = Array.from({ length: 106 }, (_, i) => fixture(i, i === 105 ? 14 : 8)), target = history[105];
  await saveSolves(history);
  const result = await solveFeedback(target, history);
  expect(result).toHaveProperty('analysis');
  if (!('analysis' in result)) throw new Error('Missing feedback');
  const expected = markMistakes(history.map(importedAnalysis), 100).find(solve => solve.id === target.id)!;
  expect(result.analysis).toEqual(expected);
  expect(result.analysis!.mistakes!.some(mistake => mistake.kind === 'pllMoves')).toBe(true);
  expect((await readSolves()).find(solve => solve.id === target.id)!.analysis!.data.mistakes).toEqual(expected.mistakes);
  const edited = { ...target, penalty: 2000 };
  const update = await solveFeedback(edited, history);
  expect(update).toHaveProperty('analysis.time', 12);
  expect((await readSolves()).find(solve => solve.id === target.id)!.penalty).toBeUndefined();
  const removedExamples = history.slice(5);
  const filtered = await solveFeedback(target, removedExamples);
  expect('analysis' in filtered && filtered.analysis!.mistakes!.some(mistake => mistake.kind === 'pllMoves')).toBe(false);
  const separate = history.map(solve => solve === target ? solve : { ...solve, session: 'Other' });
  const isolated = await solveFeedback(target, separate);
  expect('analysis' in isolated && isolated.analysis!.mistakes!.some(mistake => mistake.kind === 'pllMoves')).toBe(false);
});
test('cancelled feedback does not start a batch or overwrite saved data', async () => {
  const target = fixture(500);
  await saveSolves([target]);
  expect(await solveFeedback(target, [target], () => false)).toEqual({});
  expect(await readSolves()).toEqual([target]);
});
test('opening another replay keeps one deterministic baseline for equal solve timestamps', async () => {
  const history = [fixture(600), fixture(601), fixture(602)].map(solve => ({
    ...solve, createdAt: '2026-01-01T00:00:00.000Z',
    imported: { ...solve.imported!, date: '2026-01-01T00:00:00.000Z' },
  }));
  const first = await solveFeedback(history[0], history), last = await solveFeedback(history[2], history);
  expect('analysis' in first && first.analysis!.mistakeContext).toBe('analysis' in last && last.analysis!.mistakeContext);
});
