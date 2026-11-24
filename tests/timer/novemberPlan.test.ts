import { compareDurationText, formatMilliseconds, formatSeconds, setTimeDisplay } from '../../shared/display';
import { dailyStreakNotification, dailyStreakSolves } from '../../timer/src/Data/storage';
import { inverse, loadCube, type Cube } from '../../timer/src/Core/puzzle';
import type { Solve } from '../../timer/src/Core/engine';
import { comparePairs, solvePairChoices, stepPieces, suggestedPairs } from '../../timer/src/Analysis/f2lSuggestions';
import { cfopFrame } from '../../timer/src/Analysis/cfop';
import { makeSolve, makeStep } from '../analyzer/testUtils';
import { StepName } from '../../smartcubeanalyzer/src/Models/Types';
import { smartDrillCases } from '../../src/trainer/smartDrill';
import { markMistakes, summarizeMistakes } from '../../smartcubeanalyzer/src/Analysis/MistakeAnalysis';
import { solveAnalysis } from '../../timer/src/Analysis/analysis';

let cube: Cube;
beforeAll(async () => { cube = await loadCube(); });
afterEach(() => setTimeDisplay(true));
test.each([2, 3])('minute formatting rounds safely at precision %i without changing numeric data', precision => {
  expect(formatMilliseconds(62345, precision)).toBe(precision === 2 ? '1:02.34' : '1:02.345');
  expect(formatSeconds(59.9999, precision)).toBe(precision === 2 ? '1:00.00' : '1:00.000');
  expect(formatSeconds(3600.125, precision)).toBe(precision === 2 ? '60:00.13' : '60:00.125');
  expect(formatSeconds(-65, precision)).toBe(precision === 2 ? '-1:05.00' : '-1:05.000');
  setTimeDisplay(false);
  expect(formatMilliseconds(62345, precision)).toBe((62.345).toFixed(precision));
  expect(formatSeconds(Infinity)).toBe('DNF');
});
test('formatted minute values still compare numerically with seconds and multi-minute values', () => {
  expect(compareDurationText('1:02.30', '59.99')).toBeGreaterThan(0);
  expect(compareDurationText('2:01.00', '10:00.00')).toBeLessThan(0);
  expect(compareDurationText('1:00.00', '60.00')).toBe(0);
  expect(compareDurationText('-1:02.30', '-59.99')).toBeLessThan(0);
  expect(compareDurationText('Sub-7', 'Sub-10')).toBeUndefined();
  expect(compareDurationText('12.10', '13.10')).toBeUndefined();
});
const recording = (day: number, duration: number, status: Solve['status'] = 'complete'): Solve => ({
  version: 1, id: crypto.randomUUID(), session: 'Default', device: 'Test', createdAt: new Date(2026, 10, day, 12).toISOString(),
  scramble: '', startFacelets: '', moves: [], duration, status, reason: '', timingBasis: 'host',
});
test('only the toughest newly reached daily streak notifies, including later improvements and Sub-7', () => {
  const yesterday = recording(22, 6500), first = recording(23, 9500), seven = recording(23, 6999), five = recording(23, 4999);
  expect(dailyStreakNotification([yesterday], first)).toEqual({ current: 2, label: 'Sub-10' });
  expect(dailyStreakNotification([yesterday, first], recording(23, 9999))).toBeNull();
  expect(dailyStreakNotification([yesterday, first], seven)).toEqual({ current: 2, label: 'Sub-7' });
  expect(dailyStreakNotification([yesterday, first, seven], five)).toEqual({ current: 1, label: 'Sub-5' });
  expect(dailyStreakNotification([five], { ...five, session: 'Retries' })).toBeNull();
  expect(dailyStreakNotification([], recording(23, 1000, 'active'))).toBeNull();
  expect(dailyStreakNotification([], recording(23, 1000, 'incomplete'))).toEqual({ current: 1, label: 'Overall' });
  expect(dailyStreakNotification([recording(23, 1, 'incomplete')], first)?.label).toBe('Sub-10');
  expect(dailyStreakNotification([], recording(23, 7000))?.label).toBe('Sub-10');
});
test('smart drill limits each selected stage, combines rankings, and ignores corrupt, skipped and retry cases', () => {
  const solves = Array.from({ length: 8 }, (_, i) => makeSolve({ id: String(i), steps: [
    makeStep(StepName.F2L_1, 3 + i, { case: '1', moves: i === 7 ? "R U R' U R U R' U R U R'" : "R U R'" }),
    makeStep(StepName.F2L_2, 1, { case: '2', moves: "F R' F' R" }),
    makeStep(StepName.OLL, 2, { case: '27', moves: "R U R' U R U2 R'" }),
    makeStep(StepName.PLL, 2, { case: 'T', moves: "R U R'" }),
    makeStep(StepName.PLL, 100, { case: 'Solved' }),
  ] }));
  expect(smartDrillCases(solves, ['F2L', 'OLL', 'PLL'], 1, 'slowest')).toEqual(['F2L-1', 'OLL-27', 'PLL-T']);
  expect(smartDrillCases(solves, ['F2L'], 1, 'failed')).toEqual(['F2L-1']);
  expect(smartDrillCases(solves, ['F2L'], 1, 'both')).toEqual(['F2L-1']);
  expect(smartDrillCases(solves, [], 5, 'both')).toEqual([]);
  expect(smartDrillCases(solves.map(solve => ({ ...solve, isCorrupt: true })), ['F2L'], 5, 'both')).toEqual([]);
  expect(smartDrillCases(solves.map(solve => ({ ...solve, session: 'Retries' })), ['F2L'], 5, 'both')).toEqual([]);
  expect(() => smartDrillCases(solves, ['F2L'], 1.5, 'both')).toThrow('positive whole');
});
test('smart drills fill configured counts even when only two cases have failures', () => {
  const solves = Array.from({ length: 10 }, (_, caseIndex) => Array.from({ length: 6 }, (_, instance) => makeSolve({
    id: `${caseIndex}:${instance}`, steps: [
      makeStep(StepName.OLL, caseIndex < 2 && instance === 5 ? 10 : 2, { case: String(caseIndex + 1), moves: caseIndex < 2 && instance === 5 ? "R U R' U R U R' U R U R'" : "R U R'" }),
      makeStep(StepName.PLL, caseIndex < 2 && instance === 5 ? 10 : 2, { case: ['T', 'Y', 'Aa', 'Ab', 'E', 'F', 'Ga', 'Gb', 'Gc', 'Gd'][caseIndex],
        moves: caseIndex < 2 && instance === 5 ? "R U R' U R U R' U R U R'" : "R U R'" }),
    ],
  }))).flat();
  for (const criterion of ['failed', 'slowest', 'both'] as const) for (const count of [1, 3, 5, 8, 15]) {
    const selected = smartDrillCases(solves, ['OLL', 'PLL'], count, criterion);
    expect(selected.filter(key => key.startsWith('OLL-'))).toHaveLength(Math.min(10, count));
    expect(selected.filter(key => key.startsWith('PLL-'))).toHaveLength(Math.min(10, count));
  }
  expect(smartDrillCases(solves, ['OLL'], 2, 'failed')).toEqual(['OLL-1', 'OLL-2']);
});
test('streak drilldowns include every qualifying solve, but not gaps, slower solves, future days or retries', () => {
  const previous = [recording(19, 6000), recording(21, 6900), recording(22, 6999), recording(22, 5000),
    recording(22, 7000), recording(22, 1000, 'incomplete'), recording(23, 6500), recording(24, 6000),
    { ...recording(22, 1000), session: 'Retries' }, recording(22, 1000, 'active')];
  const current = recording(23, 6800);
  expect(dailyStreakSolves(previous, current, 'Sub-7').map(solve => solve.id))
    .toEqual([previous[1], previous[2], previous[3], previous[6], current].map(solve => solve.id));
  expect(dailyStreakSolves(previous, current, 'Overall')).toContain(previous[5]);
  expect(dailyStreakSolves(previous, current, 'Overall')).not.toContain(previous[0]);
});
test('suggestions preserve solved pairs, track physical identities across crosses, and accept ties', () => {
  const scramble = "R U R' F' U2 F";
  for (const tilt of ['', 'x', 'x2', "x'", 'z', "z'"]) {
    const remap = cfopFrame(cube, tilt), alg = scramble.split(' ').map(remap).join(' ');
    const cross = 'URFDLB'.indexOf(remap('D'));
    const ranked = suggestedPairs(cube, cube.solved().applyAlg(alg), cross);
    expect(ranked.length).toBeGreaterThan(0);
    expect(ranked.every(pair => pair.moves > 0)).toBe(true);
    expect(comparePairs(ranked[0], ranked[0])).toBe(0);
    expect(stepPieces(cross, 1, ranked[0].corner)).toEqual({ CORNERS: [ranked[0].corner], EDGES: [ranked[0].edge] });
  }
  expect(suggestedPairs(cube, cube.solved(), 3)).toEqual([]);
  expect(stepPieces(null, 0)).toEqual({});
  expect(stepPieces(3, 0).EDGES).toHaveLength(4);
  expect(stepPieces(3, 5).CORNERS).toHaveLength(4);
  expect(stepPieces(3, 5).EDGES).toHaveLength(4);
});
test('pair-choice mistakes survive analysis and disappear from disabled-category summaries', () => {
  const solve = makeSolve({ pairChoices: [{ step: StepName.F2L_1, wastedMoves: 2 }] });
  markMistakes([solve], 100);
  expect(solve.mistakes?.some(mistake => mistake.kind === 'f2lChoice')).toBe(true);
  expect(summarizeMistakes([solve], 100, ['f2lChoice']).counts.some(mistake => mistake.kind === 'f2lChoice')).toBe(false);
  const noPairs = recording(23, 1000); noPairs.startFacelets = cube.facelets(cube.solved());
  expect(solvePairChoices(noPairs, cube).every(choice => !choice.ranked.length)).toBe(true);
});
test('recorded non-suggested pair choices become actual solve feedback while equal-ranked choices are accepted', () => {
  const examples = ["R U2 R' F U' F'", "F U2 F' R U' R'", "L U2 L' B U' B'", "R U R' F U2 F'",
    "R U' R' U R U' R' F U F'", "R U2 R' U' R U R' L' U L", "R U' R' U R U' R' L' U L", "F U R U' R' F' R U' R' L' U L"];
  const analyses = examples.map(solution => {
    const scramble = solution.split(' ').reverse().map(inverse).join(' ');
    const solve = recording(23, solution.split(' ').length * 200);
    solve.scramble = scramble; solve.startFacelets = cube.facelets(cube.solved().applyAlg(scramble));
    solve.moves = solution.split(' ').map((move, index) => ({ move, elapsed: (index + 1) * 200, hostTime: (index + 1) * 200, localTimestamp: (index + 1) * 200, cubeTimestamp: null }));
    return { solve, analysis: solveAnalysis(solve, cube) };
  });
  expect(analyses.some(({ analysis }) => analysis.pairChoices!.length > 0)).toBe(true);
  for (const { solve, analysis } of analyses) {
    const choices = solvePairChoices(solve, cube);
    const expected = choices.filter(choice => {
      const actual = choice.ranked.find(pair => pair.corner === choice.actual);
      return actual && comparePairs(actual, choice.ranked[0]) > 0;
    });
    expect(analysis.pairChoices).toHaveLength(expected.length);
    markMistakes([analysis], 100);
    expect(analysis.mistakes!.filter(mistake => mistake.kind === 'f2lChoice')).toHaveLength(expected.length);
  }
});
