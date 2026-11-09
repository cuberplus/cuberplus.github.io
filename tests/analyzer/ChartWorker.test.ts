import { beforeEach, describe, expect, test } from '@jest/globals';
import { Const } from '../../smartcubeanalyzer/src/Models/Constants';
import { ChartDataBundle, CrossColor, MethodName, Solve, StepName } from '../../smartcubeanalyzer/src/Models/Types';
import { makeCfopSteps, makeDailySolves, makeSolve, makeSolves, makeStep } from './testUtils';

// The worker registers its handler on the global scope at import time. This side-effect import must
// stay separate: the type-only import below is erased at compile time and would not run the module.
import '../../smartcubeanalyzer/src/Workers/chartWorker';
import type { ChartWorkerScope, WorkerInput, WorkerOutput } from '../../smartcubeanalyzer/src/Workers/chartWorker';
import { buildAllStreakRows } from '../../smartcubeanalyzer/src/Workers/chartWorker';
import { streakSolves } from '../../smartcubeanalyzer/src/Charts/ChartDataBuilders';
import { calendarDay } from '../../shared/statistics/streaks';

const workerGlobal = globalThis as ChartWorkerScope;

type WorkerRequest = WorkerInput;

const ALL_CFOP_STEPS = Const.MethodSteps[MethodName.CFOP];

function run(overrides: Partial<WorkerRequest> = {}): WorkerOutput {
    const posted: WorkerOutput[] = [];
    workerGlobal.postMessage = (msg: WorkerOutput) => posted.push(msg);
    const request: WorkerRequest = {
        requestId: 1,
        solves: makeSolves(20),
        windowSize: 5,
        pointsPerGraph: 500,
        steps: ALL_CFOP_STEPS,
        goodTime: 15,
        badTime: 25,
        methodName: MethodName.CFOP,
        use4SegmentTiming: false,
        isDark: false,
        ...overrides,
    };
    workerGlobal.onmessage!({ data: request } as MessageEvent<WorkerInput>);
    expect(posted).toHaveLength(1);
    return posted[0];
}

describe('chartWorker message handling', () => {
    beforeEach(() => {
        expect(typeof workerGlobal.onmessage).toBe('function');
    });

    test('echoes the requestId so stale responses can be discarded', () => {
        expect(run({ requestId: 42 }).requestId).toBe(42);
    });
    test.each([2, 3] as const)('formats time tables to %s places without rounding chart data', precision => {
        const solves = makeSolves(20).map(solve => ({ ...solve, time: 12.345 }));
        const { chartData } = run({ solves, precision });
        expect(chartData.recordRows[0].time).toBe((12.345).toFixed(precision));
        expect(chartData.bestSolvesData[0].time).toBe((12.345).toFixed(precision));
        expect(chartData.runningAverage.datasets[0].data[0]).toBeCloseTo(12.345);
    });

    test('returns every chart the panel renders', () => {
        const { chartData } = run();
        const expectedKeys = [
            'runningAverage', 'runningStdDev', 'runningTps', 'runningTurns',
            'runningRecognitionExecution', 'runningEfficiency', 'histogram', 'stepAverages',
            'runningColorPercentages', 'runningFirstPairPercentages', 'dailyRecord', 'streakRows', 'recordRows', 'goodBad',
            'recordHistory', 'stepPercentages', 'typicalCompare', 'bestSolvesData',
        ];
        expectedKeys.forEach(key => expect(chartData).toHaveProperty(key));
    });

    test('record tables and history both refresh after an in-place solve correction', () => {
        const solves = makeSolves(5).map(solve => ({ ...solve, time: 12 }));
        const before = run({ solves }).chartData;
        solves[4].time = 9;
        const after = run({ solves }).chartData;
        expect(before.recordRows[0].time).toBe('12.000');
        expect(after.recordRows[0].time).toBe('9.000');
        expect(after.recordHistory.datasets[0].data.at(-1)).toMatchObject({ y: 9, endIndex: 5 });
        solves[4].dnf = true;
        const corrected = run({ solves }).chartData;
        expect(corrected.recordRows[0].time).toBe('12.000');
        expect(corrected.recordHistory.datasets[0].data.at(-1)).toMatchObject({ y: 12 });
    });

    test('first-pair percentages respect DNFs, original solve numbers, method and palette', () => {
        const solves = ['Red/Green', 'Orange/Blue', 'Orange/Blue', 'Red/Green'].map((firstF2LPair, index) => makeSolve({ firstF2LPair, dnf: index === 1 }));
        const { chartData } = run({ solves, windowSize: 2 });
        const chart = chartData.runningFirstPairPercentages!;
        expect(chart.labels).toEqual(['3', '4']);
        expect(chart.datasets.find(dataset => dataset.label === 'Red / Green')!.data).toEqual([50, 50]);
        expect(chart.datasets[0].borderColor).toMatch(/^rgb\(/);
        expect(run({ solves, windowSize: 2, methodName: MethodName.Roux }).chartData.runningFirstPairPercentages).toBeUndefined();
    });

    test('handles an empty solve list without throwing', () => {
        const { chartData } = run({ solves: [] });
        expect(chartData.runningAverage.datasets[0].data).toHaveLength(0);
        expect(chartData.stepAverages.datasets).toHaveLength(0);
        expect(chartData.bestSolvesData).toHaveLength(0);
    });

    test('applies the color palette to chart datasets', () => {
        const { chartData } = run();
        expect(chartData.runningAverage.datasets[0].borderColor).toMatch(/^rgb\(/);
    });

    test('gives each doughnut slice of stepPercentages its own color', () => {
        const { chartData } = run();
        expect(Array.isArray(chartData.stepPercentages.datasets[0].backgroundColor)).toBe(true);
    });

    test('uses different palettes for light and dark mode', () => {
        const light = run({ isDark: false }).chartData.runningAverage.datasets[0].borderColor;
        const dark = run({ isDark: true }).chartData.runningAverage.datasets[0].borderColor;
        expect(dark).not.toBe(light);
    });
});

describe('chartWorker OLL/PLL category charts', () => {
    test('includes the OLL category chart only when OLL is a selected step', () => {
        expect(run({ steps: ALL_CFOP_STEPS }).chartData.ollCategory).toBeDefined();
        expect(run({ steps: [StepName.Cross] }).chartData.ollCategory).toBeUndefined();
    });

    describe('rolling chart solve numbers', () => {
        const charts = (data: ChartDataBundle) => [
            data.runningStdDev, data.runningTps, data.runningTurns, data.runningRecognitionExecution,
            data.runningEfficiency, data.stepAverages, data.runningColorPercentages, data.goodBad,
            ...(data.runningInspection ? [data.runningInspection] : []),
            ...(data.ollCategory ? [data.ollCategory] : []),
            ...(data.pllCategory ? [data.pllCategory] : []),
        ];

        test('all sampled rolling charts label 400 solves from window end 100 through solve 400', () => {
            const { chartData } = run({ solves: makeSolves(400), windowSize: 100, pointsPerGraph: 100 });
            for (const chart of [chartData.runningAverage, ...charts(chartData)]) {
                expect(chart.labels![0]).toBe('100');
                expect(chart.labels!.at(-1)).toBe('400');
                expect(chart.labels).toEqual(chartData.runningAverage.labels);
                chart.datasets.forEach(dataset => expect(dataset.data).toHaveLength(chart.labels!.length));
            }
        });

        test.each([1, 2])('DNFs stay excluded while a window of %i retains original solve numbers', windowSize => {
            const solves = [10, 1000, 1000, 1000, 1000, 5].map((time, i) =>
                makeSolve({ time, dnf: i > 0 && i < 5, turns: i === 0 ? 10 : 20, inspectionTime: time }));
            const before = JSON.stringify(solves);
            const { chartData } = run({ solves, windowSize });
            for (const chart of charts(chartData)) {
                expect(chart.labels).toEqual(windowSize === 1 ? ['1', '6'] : ['6']);
            }
            expect(chartData.runningTurns.datasets[0].data).toEqual(windowSize === 1 ? [10, 20] : [15]);
            expect(chartData.runningInspection!.datasets[0].data).toEqual(windowSize === 1 ? [10, 5] : [7.5]);
            expect(JSON.stringify(solves)).toBe(before);
        });

        test('sampled labels stay paired with their actual DNF-free windows', () => {
            const solves = makeSolves(400).map((solve, i) => ({ ...solve, turns: i + 1, dnf: i % 7 === 2 }));
            const eligible = solves.map((solve, i) => ({ solve, number: i + 1 })).filter(entry => !entry.solve.dnf);
            const windowSize = 10;
            const { chartData } = run({ solves, windowSize, pointsPerGraph: 7 });
            for (const chart of charts(chartData)) {
                expect(chart.labels).toEqual(chartData.runningTurns.labels);
                expect(chart.labels![0]).toBe(String(eligible[windowSize - 1].number));
                expect(chart.labels!.at(-1)).toBe('400');
                chart.datasets.forEach(dataset => expect(dataset.data).toHaveLength(chart.labels!.length));
            }
            chartData.runningTurns.labels!.forEach((label, i) => {
                const end = eligible.findIndex(entry => entry.number === Number(label));
                const window = eligible.slice(end - windowSize + 1, end + 1);
                expect(window).toHaveLength(windowSize);
                expect(chartData.runningTurns.datasets[0].data[i]).toBeCloseTo(window.reduce((sum, entry) => sum + entry.solve.turns, 0) / windowSize);
            });
        });

        test.each([1, 2])('inspection retains original numbers after both DNF and missing-data exclusions (window %i)', windowSize => {
            const solves = makeSolves(6).map((solve, i) => ({
                ...solve, dnf: i === 1, inspectionTime: i === 0 ? 10 : i === 5 ? 5 : null,
            }));
            const { chartData } = run({ solves, windowSize });
            expect(chartData.runningInspection!.labels).toEqual(windowSize === 1 ? ['1', '6'] : ['6']);
            expect(chartData.runningInspection!.datasets[0].data).toEqual(windowSize === 1 ? [10, 5] : [7.5]);
            expect(chartData.runningTurns.labels).toEqual(windowSize === 1 ? ['1', '3', '4', '5', '6'] : ['3', '4', '5', '6']);
        });

        test('filtered rolling charts are empty when fewer successful solves than the window remain', () => {
            const solves = makeSolves(6).map((solve, i) => ({ ...solve, dnf: i !== 0 }));
            for (const chart of charts(run({ solves, windowSize: 2 }).chartData)) {
                expect(chart.labels).toEqual([]);
                chart.datasets.forEach(dataset => expect(dataset.data).toEqual([]));
            }
        });
    });

    test('includes the PLL category chart only when PLL is a selected step', () => {
        expect(run({ steps: ALL_CFOP_STEPS }).chartData.pllCategory).toBeDefined();
        expect(run({ steps: [StepName.Cross] }).chartData.pllCategory).toBeUndefined();
    });

    test('omits case data unless a single last-layer step is selected', () => {
        const { chartData } = run({ steps: ALL_CFOP_STEPS });
        expect(chartData.caseData).toBeUndefined();
        expect(chartData.algoPracticeRows!).toBeUndefined();
    });
});

describe('chartWorker case data', () => {
    function ollSolves(): Solve[] {
        return [
            makeSolve({
                id: 'a', recognitionTime: 1, executionTime: 2,
                steps: [makeStep(StepName.OLL, 3, { case: 'Sune', moves: "R U R' U R U2 R'", turns: 7, recognitionTime: 1, executionTime: 2 })],
            }),
            makeSolve({
                id: 'b', recognitionTime: 3, executionTime: 4,
                steps: [makeStep(StepName.OLL, 7, { case: 'Anti Sune', moves: "R U2 R' U' R U' R'", turns: 7, recognitionTime: 3, executionTime: 4 })],
            }),
        ];
    }

    test('builds one label per case, slowest case first', () => {
        const { chartData } = run({ solves: ollSolves(), steps: [StepName.OLL], windowSize: 2 });
        expect(chartData.caseData!.labels).toEqual(['Anti Sune', 'Sune']);
    });

    test('splits recognition and execution into separate datasets', () => {
        const { chartData } = run({ solves: ollSolves(), steps: [StepName.OLL], windowSize: 2 });
        expect(chartData.caseData!.datasets).toHaveLength(2);
        expect(chartData.caseData!.datasets[0].data[0]).toBeCloseTo(3);
    });

    test('keeps semantic segment colors instead of the generic palette', () => {
        const { chartData } = run({ solves: ollSolves(), steps: [StepName.OLL], windowSize: 2 });
        expect(chartData.caseData!.datasets[0].backgroundColor).toBe('rgb(54, 162, 235)');
    });

    test('splits out pre-AUF and post-AUF when 4-segment timing is on', () => {
        const solves = [
            makeSolve({
                id: 'a', preAufTime: 0.4, postAufTime: 0.3, executionTime: 3,
                steps: [makeStep(StepName.PLL, 3, { case: 'T', moves: "U R U R' U'", turns: 5, preAufTime: 0.4, postAufTime: 0.3, executionTime: 3 })],
            }),
        ];
        const { chartData } = run({ solves, steps: [StepName.PLL], windowSize: 5, use4SegmentTiming: true });
        const labels = chartData.caseData!.datasets.map((d) => d.label);
        expect(labels.some((l) => l!.startsWith('Pre-AUF'))).toBe(true);
        expect(labels.some((l) => l!.startsWith('Post-AUF'))).toBe(true);
    });

    test('hides AUF datasets when no solve spent time on AUF', () => {
        const { chartData } = run({ solves: ollSolves(), steps: [StepName.OLL], windowSize: 2, use4SegmentTiming: true });
        const labels = chartData.caseData!.datasets.map((d) => d.label);
        expect(labels.some((l) => l!.startsWith('Pre-AUF'))).toBe(false);
        expect(labels.some((l) => l!.startsWith('Post-AUF'))).toBe(false);
    });

    test('ignores solves whose selected step has no case', () => {
        const solves = [...ollSolves(), makeSolve({ id: 'c', steps: [makeStep(StepName.OLL, 2)] })];
        const { chartData } = run({ solves, steps: [StepName.OLL], windowSize: 5 });
        expect(chartData.caseData!.labels).toHaveLength(2);
    });

    test('builds an algorithm practice row per non-solved case', () => {
        const { chartData } = run({ solves: ollSolves(), steps: [StepName.OLL], windowSize: 2 });
        expect(chartData.algoPracticeRows!).toHaveLength(2);
        const row = chartData.algoPracticeRows!.find((r) => r.case === 'Sune')!;
        expect(row.total).toBe(1);
        expect(row.failureRate).toMatch(/%$/);
        expect(row.avgTime).toBe('3.000');
    });
    test('F2L aggregates every matching pair and shows the twenty slowest cases', () => {
        const solves = Array.from({ length: 25 }, (_, i) => makeSolve({ steps: [
            makeStep(StepName.F2L_1, i + 1, { case: String(i + 1), recognitionTime: i, executionTime: 1 }),
            makeStep(StepName.F2L_2, i + 1, { case: String(i + 1), recognitionTime: i, executionTime: 1 }),
        ] }));
        const { chartData } = run({ solves, steps: [StepName.F2L_1, StepName.F2L_2], windowSize: 100 });
        expect(chartData.caseData!.labels).toEqual(Array.from({ length: 20 }, (_, i) => String(25 - i)));
        expect(chartData.algoPracticeRows).toHaveLength(20);
        expect(chartData.algoPracticeRows![0].total).toBe(2);
    });
    test('F2L practice prioritizes failure rate instead of slowest case', () => {
        const solves = Array.from({ length: 25 }, (_, i) => [
            makeSolve({ id: `base-${i}`, steps: [makeStep(StepName.F2L_1, 1, { case: String(i + 1), moves: "R U R'" })] }),
            makeSolve({ id: `extra-${i}`, steps: [makeStep(StepName.F2L_4, i === 24 ? 10 : 1, {
                case: String(i + 1), moves: i === 24 ? "R U R' F U F' R U R'" : "R U R'",
            })] }),
        ]).flat();
        const { chartData } = run({ solves, steps: [StepName.F2L_1, StepName.F2L_4], windowSize: 100 });
        expect(chartData.algoPracticeRows![0]).toMatchObject({ case: '25', total: 2, failed: 1, failureRate: '50.0%' });
        expect(chartData.algoPracticeRows).toHaveLength(20);
    });
});

describe('chartWorker streaks', () => {
    test('counts a streak of consecutive days under the target', () => {
        const solves = makeDailySolves(5, [8]);
        const { chartData } = run({ solves });
        const subTen = chartData.streakRows.find((r) => r.time === 'Sub-10')!;
        expect(subTen.longeststreak).toBe('5');
    });

    test('marks the current streak with a flame when it is also the longest', () => {
        const solves = makeDailySolves(5, [8]);
        const subTen = buildAllStreakRows(solves, solves.at(-1)!.date).find(r => r.time === 'Sub-10')!;
        expect(subTen.currentstreak).toBe('5 🔥');
    });

    test('breaks the streak on a day slower than the target', () => {
        const solves = makeDailySolves(5, [8, 8, 30, 8, 8]);
        const subTen = buildAllStreakRows(solves, solves.at(-1)!.date).find(r => r.time === 'Sub-10')!;
        expect(subTen.longeststreak).toBe('2');
        expect(subTen.currentstreak).toBe('2 🔥');
    });

    test('breaks the streak when a day is skipped entirely', () => {
        const solves = makeDailySolves(3, [8]);
        const gap = makeSolve({ id: 'gap', date: new Date('2024-02-01T12:00:00Z'), time: 8 });
        const subTen = buildAllStreakRows([...solves, gap], gap.date).find(r => r.time === 'Sub-10')!;
        expect(subTen.longeststreak).toBe('3');
        expect(subTen.currentstreak).toBe('1');
    });

    test('reports no streak when every day is above the target', () => {
        const solves = makeDailySolves(4, [40]);
        const { chartData } = run({ solves });
        const subTen = chartData.streakRows.find((r) => r.time === 'Sub-10')!;
        expect(subTen.longeststreak).toBe('0');
        expect(subTen.currentstreak).toBe('0');
    });

    test('always reports the six streak targets', () => {
        const { chartData } = run();
        expect(chartData.streakRows.map((r) => r.time))
            .toEqual(['Sub-5', 'Sub-10', 'Sub-15', 'Sub-20', 'Sub-30', 'Overall']);
    });

    test('keeps only the fastest solve of each day', () => {
        const day = new Date('2024-03-01T12:00:00Z');
        const solves = [
            makeSolve({ id: 'slow', date: day, time: 30 }),
            makeSolve({ id: 'fast', date: day, time: 9 }),
        ];
        const { chartData } = run({ solves });
        const subTen = chartData.streakRows.find((r) => r.time === 'Sub-10')!;
        expect(subTen.longeststreak).toBe('1');
    });
    test('current streak expires after a missed day, but includes yesterday until today ends', () => {
        const solves = [1, 2, 3].map(day => makeSolve({ date: new Date(2026, 10, day, 12), time: 8 }));
        const yesterday = buildAllStreakRows(solves, new Date(2026, 10, 4, 23)).find(row => row.time === 'Overall')!;
        expect(yesterday.currentDays).toHaveLength(3);
        const expired = buildAllStreakRows(solves, new Date(2026, 10, 5)).find(row => row.time === 'Overall')!;
        expect(expired.currentstreak).toBe('0');
        expect(expired.bestDays).toHaveLength(3);
    });
    test('overall streak includes DNF-only days and daily best prefers a successful solve', () => {
        const solves = [
            makeSolve({ id: 'one', date: new Date(2026, 10, 1, 12), time: 8 }),
            makeSolve({ id: 'dnf', date: new Date(2026, 10, 2, 12), time: 0, dnf: true }),
            makeSolve({ id: 'three-dnf', date: new Date(2026, 10, 3, 10), time: 0, dnf: true }),
            makeSolve({ id: 'three-best', date: new Date(2026, 10, 3, 12), time: 9 }),
        ];
        const rows = buildAllStreakRows(solves, new Date(2026, 10, 3, 23));
        const overall = rows.find(row => row.time === 'Overall')!;
        expect(overall.currentstreak).toBe('3 🔥');
        expect(rows.find(row => row.time === 'Sub-10')!.longeststreak).toBe('1');
        expect(streakSolves(solves, overall.currentDays).map(solve => solve.id)).toEqual(['one', 'dnf', 'three-best']);
    });
    test('current and best drilldowns use only daily bests inside the selected window', () => {
        const solves = [1, 2, 3, 5, 6].flatMap(day => [
            makeSolve({ id: `slow-${day}`, date: new Date(2026, 10, day, 10), time: 9 }),
            makeSolve({ id: `best-${day}`, date: new Date(2026, 10, day, 12), time: 8 }),
        ]);
        const row = buildAllStreakRows(solves, new Date(2026, 10, 6, 23)).find(row => row.time === 'Sub-10')!;
        expect(streakSolves(solves, row.currentDays).map(solve => solve.id)).toEqual(['best-5', 'best-6']);
        expect(streakSolves(solves, row.bestDays).map(solve => solve.id)).toEqual(['best-1', 'best-2', 'best-3']);
    });
    test('local finish dates and daylight-saving transitions count calendar days, not 24-hour durations', () => {
        const solves = [6, 7, 8, 9].map(day => makeSolve({ date: new Date(2026, 2, day, 12), time: 8 }));
        solves[0] = { ...solves[0], date: new Date(2026, 2, 5, 23, 59), endDate: new Date(2026, 2, 6, 0, 1) };
        const row = buildAllStreakRows(solves, new Date(2026, 2, 9, 23)).find(row => row.time === 'Overall')!;
        expect(row.currentDays).toEqual([6, 7, 8, 9].map(day => calendarDay(new Date(2026, 2, day))));
    });
});

describe('chartWorker records', () => {
    test('custom chart chopping does not change standard record averages', () => {
        const solves = [1, 2, 3, 4, 5, 6, 7, 8, 90, 100].map(time => makeSolve({ time }));
        const untrimmed = run({ solves, windowSize: 10, chopPercentage: 0 }).chartData;
        const trimmed = run({ solves, windowSize: 10, chopPercentage: 20 }).chartData;
        expect(untrimmed.runningAverage.datasets[0].data).toEqual([22.6]);
        expect(trimmed.runningAverage.datasets[0].data).toEqual([5.5]);
        expect(untrimmed.recordRows).toEqual(trimmed.recordRows);
        expect(untrimmed.recordHistory).toEqual(trimmed.recordHistory);
    });

    test('trims Ao5, counts DNFs, and excludes them from fastest-single lists', () => {
        const solves = [10, 11, 12, 13, 100].map(time => makeSolve({ time }));
        expect(run({ solves }).chartData.recordRows.find(r => r.recordType === 'Ao5')!.time).toBe('12.000');
        solves[4] = makeSolve({ time: 0, dnf: true });
        const oneDnf = run({ solves }).chartData;
        expect(oneDnf.recordRows.find(r => r.recordType === 'Ao5')!.time).toBe('12.000');
        expect(oneDnf.bestSolvesData).toHaveLength(4);
        solves[3] = makeSolve({ time: 0, dnf: true });
        const twoDnfs = run({ solves }).chartData;
        expect(twoDnfs.recordRows.find(r => r.recordType === 'Ao5')!.time).toBe('DNF');
        expect(twoDnfs.recordHistory.datasets.find(d => d.label === 'Record Ao5')!.data).toEqual([]);
        const recovered = run({ solves: [...solves, ...makeSolves(5, { time: 10 })] }).chartData;
        expect(recovered.recordRows.find(r => r.recordType === 'Ao5')!.time).toBe('10.000');
    });

    test('reports the fastest single', () => {
        const solves = makeDailySolves(10, [20, 19, 11, 25, 30, 18, 17, 16, 15, 14]);
        const { chartData } = run({ solves });
        const single = chartData.recordRows.find((r) => r.recordType === 'Single')!;
        expect(single.time).toBe('11.000');
    });

    test('reports a dash for averages that need more solves than exist', () => {
        const { chartData } = run({ solves: makeSolves(3) });
        const ao12 = chartData.recordRows.find((r) => r.recordType === 'Ao12')!;
        expect(ao12.time).toBe('-');
    });

    test('record history only moves downward', () => {
        const solves = makeDailySolves(6, [20, 25, 15, 30, 10, 12]);
        const { chartData } = run({ solves });
        const singles = chartData.recordHistory.datasets.find((d) => d.label === 'Record Single')!;
        const ys = singles.data.map((p) => p.y);
        expect(ys).toEqual([20, 15, 10]);
    });

    test('record history exposes a dataset per record type', () => {
        const { chartData } = run();
        expect(chartData.recordHistory.datasets.map((d) => d.label))
            .toEqual(['Record Single', 'Record Ao5', 'Record Ao12', 'Record Ao100', 'Record Ao1000']);
    });

    test('lists the fastest solves, capped and sorted ascending', () => {
        const solves = makeDailySolves(Const.FastestSolvesCount + 10, [30, 20, 10]);
        const { chartData } = run({ solves });
        expect(chartData.bestSolvesData).toHaveLength(Const.FastestSolvesCount);
        expect(Number(chartData.bestSolvesData[0].time))
            .toBeLessThanOrEqual(Number(chartData.bestSolvesData[1].time));
    });

    test('flags full-step solves in the fastest solves table', () => {
        const solves = [makeSolve({ isFullStep: true }), makeSolve({ id: 'b', isFullStep: false })];
        const { chartData } = run({ solves });
        const flags = chartData.bestSolvesData.map((s) => s.fullstep);
        expect(flags).toContain('Yes 🔥');
        expect(flags).toContain('No');
    });
});

describe('chartWorker daily records', () => {
    test('produces one sorted label per day', () => {
        const solves = makeDailySolves(3, [20, 15, 25]);
        const { chartData } = run({ solves });
        expect(chartData.dailyRecord.labels).toHaveLength(3);
        expect([...chartData.dailyRecord.labels!].sort()).toEqual(chartData.dailyRecord.labels);
    });

    test('plots the fastest time of each day', () => {
        const day = new Date('2024-04-01T12:00:00Z');
        const solves = [
            makeSolve({ id: 'a', date: day, time: 22 }),
            makeSolve({ id: 'b', date: day, time: 13 }),
        ];
        const { chartData } = run({ solves });
        expect(chartData.dailyRecord.datasets[0].data).toEqual([13]);
    });
});

describe('chartWorker step averages', () => {
    test('creates one dataset per selected step', () => {
        const { chartData } = run({ steps: ALL_CFOP_STEPS });
        expect(chartData.stepAverages.datasets).toHaveLength(ALL_CFOP_STEPS.length);
    });

    test('labels each dataset with the step name and window size', () => {
        const { chartData } = run({ steps: [StepName.OLL], windowSize: 5 });
        expect(chartData.stepAverages.datasets[0].label).toBe('OLL Average of 5');
    });

    test('returns empty data when no steps are selected', () => {
        const { chartData } = run({ steps: [] });
        expect(chartData.stepAverages.datasets).toHaveLength(0);
        expect(chartData.stepAverages.labels).toHaveLength(0);
    });

    test('labels line up with the data points', () => {
        const { chartData } = run({ steps: [StepName.Cross], windowSize: 5 });
        expect(chartData.stepAverages.labels).toHaveLength(chartData.stepAverages.datasets[0].data.length);
    });
});

describe('chartWorker efficiency', () => {
    const efficientSolve = () =>
        makeSolve({ steps: makeCfopSteps().map(s => ({ ...s, moves: "R U R' F" })) });
    const wastefulSolve = () =>
        makeSolve({ id: 'w', steps: makeCfopSteps().map(s => ({ ...s, moves: "R R' U F" })) });

    test('returns empty data for no solves', () => {
        const { chartData } = run({ solves: [] });
        expect(chartData.runningEfficiency.datasets).toHaveLength(0);
    });

    test('reports 100% efficiency when no moves are cancellable', () => {
        const solves = Array.from({ length: 6 }, efficientSolve);
        const { chartData } = run({ solves, windowSize: 5 });
        expect(chartData.runningEfficiency.datasets[0].data[0]).toBeCloseTo(100);
    });

    test('drops below 100% when moves cancel out', () => {
        const solves = Array.from({ length: 6 }, wastefulSolve);
        const { chartData } = run({ solves, windowSize: 5 });
        expect(chartData.runningEfficiency.datasets[0].data[0]).toBeLessThan(100);
    });

    test('adds OLL and PLL success datasets when all CFOP steps are selected', () => {
        const solves = Array.from({ length: 6 }, efficientSolve);
        const { chartData } = run({ solves, windowSize: 5, steps: ALL_CFOP_STEPS });
        const labels = chartData.runningEfficiency.datasets.map((d) => d.label);
        expect(labels.some((l) => l!.startsWith('OLL success'))).toBe(true);
        expect(labels.some((l) => l!.startsWith('PLL success'))).toBe(true);
    });

    test('omits success datasets when only a subset of steps is selected', () => {
        const solves = Array.from({ length: 6 }, efficientSolve);
        const { chartData } = run({ solves, windowSize: 5, steps: [StepName.OLL] });
        expect(chartData.runningEfficiency.datasets).toHaveLength(1);
    });

    test('omits the OLL dataset for methods without a single-look OLL step', () => {
        const solves = Array.from({ length: 6 }, efficientSolve);
        const { chartData } = run({
            solves,
            windowSize: 5,
            methodName: MethodName.CFOP_2OLL,
            steps: Const.MethodSteps[MethodName.CFOP_2OLL],
        });
        const labels = chartData.runningEfficiency.datasets.map((d) => d.label);
        expect(labels.some((l) => l!.startsWith('OLL success'))).toBe(false);
        expect(labels.some((l) => l!.startsWith('PLL success'))).toBe(true);
    });

    test('omits both success datasets for methods with neither OLL nor PLL', () => {
        const solves = Array.from({ length: 6 }, efficientSolve);
        const { chartData } = run({
            solves,
            windowSize: 5,
            methodName: MethodName.Roux,
            steps: Const.MethodSteps[MethodName.Roux],
        });
        expect(chartData.runningEfficiency.datasets).toHaveLength(1);
    });
});

describe('chartWorker inspection charts', () => {
    test('builds inspection charts when Cubeast solves report inspection time', () => {
        const { chartData } = run({ solves: makeSolves(10, { inspectionTime: 9 }) });
        expect(chartData.inspection).not.toBeNull();
        expect(chartData.runningInspection).not.toBeNull();
    });

    test('suppresses inspection charts for Acubemy-only data', () => {
        const { chartData } = run({ solves: makeSolves(10, { source: 'acubemy', inspectionTime: null }) });
        expect(chartData.inspection).toBeNull();
        expect(chartData.runningInspection).toBeNull();
    });

    test('suppresses inspection charts when no solve reports inspection time', () => {
        const { chartData } = run({ solves: makeSolves(10, { inspectionTime: null }) });
        expect(chartData.inspection).toBeNull();
        expect(chartData.runningInspection).toBeNull();
    });

    test('only Cubeast solves contribute when sources are mixed', () => {
        const solves = [
            ...makeSolves(5, { inspectionTime: 5 }),
            ...makeSolves(5, { source: 'acubemy', inspectionTime: null }),
        ];
        const { chartData } = run({ solves, windowSize: 5 });
        expect(chartData.runningInspection!.datasets[0].data).toHaveLength(1);
    });
});

describe('chartWorker cross color chart', () => {
    test('adds an Unknown series only when some cross color is unknown', () => {
        const known = run({ solves: makeSolves(10) }).chartData.runningColorPercentages;
        const unknown = run({ solves: makeSolves(10, { crossColor: CrossColor.Unknown }) })
            .chartData.runningColorPercentages;
        expect(known.datasets).toHaveLength(6);
        expect(unknown.datasets).toHaveLength(7);
    });
});
