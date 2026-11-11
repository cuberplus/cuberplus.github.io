/** @jest-environment jsdom */
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { deserialize, serialize } from 'node:v8';
import { jest } from '@jest/globals';
import { useContext } from 'react';
import { renderHook } from '@testing-library/react';
import { loadCube, type Cube } from '../../timer/src/Core/puzzle';
import { solveTime, type Solve } from '../../timer/src/Core/engine';
import { readLocalAnalysis } from '../../timer/src/Analysis/analyzer-data';
import { solveAnalysis } from '../../timer/src/Analysis/analysis';
import { averageDetails, formatTime, readSolves, saveSolves, sessionStats } from '../../timer/src/Data/storage';
import { FilterPanel } from '../../smartcubeanalyzer/src/Components/FilterPanel';
import { buildRecordHistory, buildRecordRows } from '../../smartcubeanalyzer/src/Workers/chartWorker';
import { buildRunningAverageData } from '../../smartcubeanalyzer/src/Charts/ChartDataBuilders';
import { CalculateAllSessionOptions, CalculateMostUsedMethod } from '../../smartcubeanalyzer/src/Helpers/CubeHelpers';
import { SettingsContext } from '../../shared/navigation/settings';
import type { Solve as AnalyzedSolve } from '../../smartcubeanalyzer/src/Models/Types';

jest.setTimeout(30000);
let cube: Cube;
beforeAll(async () => { cube = await loadCube(); });
beforeEach(() => {
  Object.defineProperty(globalThis, 'indexedDB', { configurable: true, value: new IDBFactory() });
  Object.defineProperty(globalThis, 'structuredClone', { configurable: true, value: <T>(value: T): T => deserialize(serialize(value)) as T });
  localStorage.clear();
});

function solves(count: number, duration: (index: number) => number = index => 11000 + index * 3.17): Solve[] {
  const start = Date.now() - count * 60000, startFacelets = cube.facelets(cube.solved().applyAlg('R'));
  return Array.from({ length: count }, (_, index) => {
    const time = duration(index);
    return {
      version: 1, id: `solve-${String(count - index).padStart(5, '0')}`, createdAt: new Date(start + index * 60000 + 321).toISOString(),
      session: 'Default', device: 'Test cube', scramble: 'R', startFacelets,
      duration: time, status: 'complete', reason: '', timingBasis: 'host',
      moves: [{ move: "R'", elapsed: time, hostTime: time, localTimestamp: null, cubeTimestamp: null }],
    };
  });
}

function defaults(records: AnalyzedSolve[]) {
  const panel = new FilterPanel({ solves: [] });
  return FilterPanel.getDerivedStateFromProps({
    solves: records,
    suggestedMethod: { label: CalculateMostUsedMethod(records), value: CalculateMostUsedMethod(records) },
    suggestedSessions: CalculateAllSessionOptions(records),
  }, panel.state);
}

async function compare(records: Solve[]) {
  // Deliberately write out of chronological order, as IndexedDB reads by ID.
  await saveSolves([...records].reverse());
  const analyzed = await readLocalAnalysis(), state = defaults(analyzed);
  const newestFirst = records.filter(solve => solve.status !== 'active').sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const timer = sessionStats(newestFirst).find(stat => stat.name === 'Ao1000')!;
  const { result, unmount } = renderHook(() => useContext(SettingsContext));
  const analyzer = buildRecordRows(state.compressedSolves, result.current.precision).find(row => row.recordType === 'Ao1000')!;
  unmount();
  expect(state.compressedSolves.map(solve => solve.id)).toEqual([...newestFirst].reverse().map(solve => solve.id));
  expect(analyzer.time).toBe(timer.best === null ? '-' : timer.best === 'DNF' ? 'DNF' : formatTime(timer.best));
  const chart = buildRunningAverageData(state.compressedSolves, 1000, state.pointsPerGraph, state.chopPercentage);
  const last = chart.datasets[0].data.at(-1);
  if (typeof timer.current === 'number') expect(last).toBeCloseTo(timer.current / 1000, 10);
  else expect(last).toBe(timer.current === 'DNF' ? null : undefined);
  return { analyzed, state, timer, analyzer, newestFirst };
}

test.each([12344.51, 12345])('default native Timer and Analyzer Ao1000 retain exact timing at %sms', async duration => {
  const records = solves(1000, () => duration);
  const { analyzed, timer, analyzer } = await compare(records);
  expect(analyzed[0]).toMatchObject({ time: duration / 1000, date: new Date(records[0].createdAt) });
  expect(formatTime(timer.best as number)).toBe((duration / 1000).toFixed(2));
  expect(analyzer.time).toBe((duration / 1000).toFixed(2));
});

test('default native data agrees across every Ao1000 window, penalties, trimmed DNFs and unfinished solves', async () => {
  const records = solves(1080);
  records.forEach((solve, i) => {
    if (i % 23 === 0) Object.assign(solve, { penalty: 4000, penaltyReason: 'manual, inspection' });
    if (i % 31 === 0) Object.assign(solve, { status: 'incomplete', dnfReason: 'manual' });
  });
  records.push({ ...records.at(-1)!, id: 'active', status: 'active' });
  const { state, newestFirst, timer } = await compare(records);
  const details = averageDetails(newestFirst, 1000)!;
  expect(details.solves).toHaveLength(1000);
  expect(details.solves.filter(row => row.trimmed === 'best')).toHaveLength(50);
  expect(details.solves.filter(row => row.trimmed === 'worst')).toHaveLength(50);
  expect(details.solves.filter(row => row.solve.status === 'incomplete').every(row => row.trimmed === 'worst')).toBe(true);
  const chart = buildRunningAverageData(state.compressedSolves, 1000, 10000);
  for (let i = 0; i <= 80; i++) {
    const window = newestFirst.slice(80 - i, 1080 - i);
    const expected = window.map(solve => solve.status === 'complete' ? solveTime(solve) : Infinity).sort((a, b) => a - b).slice(50, 950);
    const mean = expected.reduce((sum, value) => sum + value, 0) / 900;
    expect(chart.datasets[0].data[i]).toBeCloseTo(mean / 1000, 10);
  }
  const record = buildRecordHistory(state.compressedSolves).datasets.find(dataset => dataset.label === 'Record Ao1000')!.data.at(-1)!;
  expect(record.y).toBeCloseTo((timer.best as number) / 1000, 10);
  expect(state.compressedSolves[23].time).toBe((records[23].duration + 4000) / 1000);
});

test.each([[999, 51], [1000, 50], [1000, 51]])('default Ao1000 handles %i solves and %i DNFs at the trimming boundary', async (count, dnfs) => {
  const records = solves(count);
  records.slice(-dnfs).forEach(solve => Object.assign(solve, { status: 'incomplete', dnfReason: 'manual' }));
  const { analyzer } = await compare(records);
  if (count < 1000) expect(analyzer.time).toBe('-');
  else if (dnfs > 50) expect(analyzer.time).toBe('DNF');
  else expect(Number.isFinite(Number(analyzer.time))).toBe(true);
});

test('legacy rounded analysis caches are corrected from authoritative native timing without reanalysis', async () => {
  const [solve] = solves(1, () => 12344.51);
  solveAnalysis(solve, cube);
  solve.analysis!.data.time = 12.345;
  solve.analysis!.data.date = new Date(Math.floor(Date.parse(solve.createdAt) / 1000) * 1000).toISOString();
  await saveSolves([solve]);
  const parse = jest.spyOn(cube, 'parse').mockImplementation(() => { throw new Error('Should reuse analysis cache'); });
  try {
    expect((await readLocalAnalysis())[0]).toMatchObject({ time: 12.34451, date: new Date(solve.createdAt) });
    expect((await readSolves())[0].analysis!.data).toMatchObject({ time: 12.34451, date: solve.createdAt });
  } finally { parse.mockRestore(); }
});
