import { calculateMovingAverage, calculateMovingPercentage, calculateMovingAverageChopped, makeLabels, reduceDataset } from '../Helpers/MathHelpers';
import { buildRunningAverageData, buildRunningStdDevData, buildRunningTpsData, buildRunningInspectionData, buildRunningTurnsData, buildRunningRecognitionExecution, buildHistogramData, buildGoodBadData, buildRunningColorPercentages, buildFirstPairPercentages, buildStepPercentages, buildOllCategoryChart, buildPllCategoryChart, buildInspectionData, shouldShowInspectionCharts, buildTypicalCompare, fastestByDay, buildMovingLineChart } from '../Charts/ChartDataBuilders';
import { applyPaletteToChartData, SEGMENT_COLORS } from '../Charts/ChartColors';
import { analyzeStepMoves, computeCaseFailureStats, computeSolveEfficiency } from '../Analysis/MoveAnalysis';
import { getAufMovesForSolve } from '../Data/CsvParser';
import { summarizeMistakes } from '../Analysis/MistakeAnalysis';
import { Const } from '../Models/Constants';
import { AlgoPracticeRow, CaseStats, ChartDataBundle, FastestSolve, LabelledChart, caseCategory, caseSteps, getStep, MethodName, RecordRow, Solve, StepName, StreakRow } from '../Models/Types';
import { calendarDay, streakWindows } from '../../../shared/statistics/streaks';

export interface WorkerInput {
    requestId: number;
    solves: Solve[];
    windowSize: number;
    pointsPerGraph: number;
    steps: StepName[];
    goodTime: number;
    badTime: number;
    methodName: MethodName;
    use4SegmentTiming: boolean;
    isDark: boolean;
    precision?: 2 | 3;
    chopPercentage?: number;
}

// ── Streak helpers ───────────────────────────────────────────────────────────

export function buildAllStreakRows(solves: Solve[], today = new Date()): StreakRow[] {
    const daily = [...fastestByDay(solves).values()];
    const targets = [5, 10, 15, 20, 30, 10000] as const;
    const labels: { [k: number]: string } = { 5: 'Sub-5', 10: 'Sub-10', 15: 'Sub-15', 20: 'Sub-20', 30: 'Sub-30', 10000: 'Overall' };
    return targets.map(t => {
        const windows = streakWindows(daily.filter(solve => t === 10000 || !solve.dnf && solve.time < t)
            .map(solve => calendarDay(solve.endDate ?? solve.date)), calendarDay(today));
        const longest = String(windows.best.length), current = String(windows.current.length);
        return {
            time: labels[t],
            longeststreak: longest,
            currentstreak: longest === current && current !== '0' ? `${current} 🔥` : current,
            currentDays: windows.current, bestDays: windows.best,
        };
    });
}

// ── Records ──────────────────────────────────────────────────────────────────

const RECORD_WINDOWS = [1, 5, 12, 100, 1000];
const recordTimes = (solves: Solve[]) => {
    const times = solves.map(s => s.dnf ? Infinity : s.time);
    return RECORD_WINDOWS.map(window => window === 1 ? times : calculateMovingAverageChopped(times, window));
};

export function buildRecordRows(solves: Solve[], precision = 3, records = recordTimes(solves)): RecordRow[] {
    return RECORD_WINDOWS.map((window, i) => {
        const times = records[i];
        const best = times.reduce((a, b) => Math.min(a, b), Infinity);
        return { recordType: window === 1 ? 'Single' : `Ao${window}`, time: !times.length ? '-' : best === Infinity ? 'DNF' : best.toFixed(precision) };
    });
}

function buildRecordDataset(dates: Date[], times: number[], window: number) {
    const records: { x: Date; y: number; endIndex: number }[] = [];
    for (let i = 0; i < times.length; i++) {
        if (Number.isFinite(times[i]) && (!records.length || times[i] < records[records.length - 1].y)) {
            records.push({ x: dates[i], y: times[i], endIndex: i + window });
        }
    }
    return records;
}

export function buildRecordHistory(solves: Solve[], records = recordTimes(solves)) {
    const dates = solves.map(x => x.date);
    return {
        datasets: RECORD_WINDOWS.map((window, i) => ({
            label: window === 1 ? 'Record Single' : `Record Ao${window}`,
            data: buildRecordDataset(dates.slice(window - 1), records[i], window),
        })),
    };
}

// ── Per-step charts ──────────────────────────────────────────────────────────

export function buildStepAverages(solves: Solve[], steps: StepName[], windowSize: number, pointsPerGraph: number) {
    if (solves.length === 0 || steps.length === 0) {
        return { labels: [], datasets: [] };
    }
    return buildMovingLineChart(solves, windowSize, pointsPerGraph, steps.map(step => ({
        extract: solve => getStep(solve, step)?.time ?? 0, calcFn: calculateMovingAverage, label: `${step} Average of ${windowSize}`,
    })));
}

export function buildDailyRecordData(solves: Solve[]) {
    const days = fastestByDay(solves), labels = [...days.keys()].sort();
    return {
        labels,
        datasets: [{ label: 'Fastest Solve Each Day', data: labels.map(day => days.get(day)!.time) }],
    };
}

// ── Efficiency ───────────────────────────────────────────────────────────────

export function buildRunningEfficiencyData(
    solves: Solve[],
    steps: StepName[],
    methodName: MethodName,
    windowSize: number,
    pointsPerGraph: number
) {
    if (solves.length === 0) return { labels: [], datasets: [] };

    const needOll = methodName === MethodName.CFOP;
    const needPll = methodName === MethodName.CFOP || methodName === MethodName.CFOP_2OLL;
    const allStepsSelected = steps.length === Const.MethodSteps[methodName].length;

    const caseMap = (needed: boolean, step: StepName) => needed
        ? new Map(computeCaseFailureStats(solves, step).map(stats => [stats.caseName, stats])) : undefined;

    const ollMap = caseMap(needOll, StepName.OLL), pllMap = caseMap(needPll, StepName.PLL);
    const effList = solves.map(solve => computeSolveEfficiency(solve, ollMap, pllMap));
    const recorded = (solve: Solve) => solve.steps.some(step => !!step.moves);
    const efficiencies = effList.map((e, i) => recorded(solves[i]) ? e.moveEfficiency * 100 : 0);

    const coverage = reduceDataset(calculateMovingPercentage(solves, windowSize, recorded), pointsPerGraph);
    const averages = calculateMovingAverage(efficiencies, windowSize);
    const labels = makeLabels(averages.length, pointsPerGraph, windowSize);
    const movingAvg = reduceDataset(averages, pointsPerGraph).map((value, i) => coverage[i] ? value * 100 / coverage[i] : null);

    const datasets: { label: string; data: (number | null)[] }[] = [
        { label: `Move Efficiency % (avg of ${windowSize})`, data: movingAvg },
    ];

    if (allStepsSelected && (needOll || needPll)) {
        const failures = [
            { name: 'OLL', needed: needOll, failed: (e: typeof effList[number]) => e.hadOllFailure },
            { name: 'PLL', needed: needPll, failed: (e: typeof effList[number]) => e.hadPllFailure },
        ].filter(stage => stage.needed).map(stage => ({
            ...stage, rates: reduceDataset(calculateMovingPercentage(effList, windowSize, stage.failed), pointsPerGraph),
            coverage: reduceDataset(calculateMovingPercentage(solves, windowSize, solve =>
                (stage.name === 'OLL' ? Const.OllEdgeOrientationMapping : Const.PllCornerPermutationMapping).has(getStep(solve, stage.name === 'OLL' ? StepName.OLL : StepName.PLL)?.case ?? '')), pointsPerGraph),
        }));
        const rate = (stage: typeof failures[number], i: number) => stage.rates[i] * 100 / stage.coverage[i];
        datasets.push({ label: 'Solve efficiency', data: movingAvg.map((eff, i) =>
            eff === null || failures.some(stage => !stage.coverage[i]) ? null : eff - failures.reduce((sum, stage) => sum + rate(stage, i), 0)) });
        datasets.push(...failures.map(stage => ({ label: `${stage.name} success % (last ${windowSize})`,
            data: stage.rates.map((_, i) => stage.coverage[i] ? 100 - rate(stage, i) : null) })));
    }

    return { labels, datasets };
}

// ── Case data (OLL/PLL single-step) ──────────────────────────────────────────

export function buildCaseData(solves: Solve[], steps: StepName[], windowSize: number, use4SegmentTiming: boolean) {
    const category = caseCategory(steps);
    if (!category) return { labels: [], datasets: [] };
    type Totals = { label: string; count: number; recognition: number; execution: number; preAuf: number; postAuf: number };
    const totals = new Map<string, Totals>();
    for (const solve of solves.slice(-windowSize)) for (const step of caseSteps(solve, category)) {
        if (!step.case || step.case === 'Solved') continue;
        const row = totals.get(step.case) ?? { label: step.case, count: 0, recognition: 0, execution: 0, preAuf: 0, postAuf: 0 };
        row.count++; row.recognition += step.recognitionTime;
        row.execution += Math.max(0, step.executionTime - step.preAufTime - step.postAufTime);
        row.preAuf += step.preAufTime; row.postAuf += step.postAufTime;
        totals.set(step.case, row);
    }
    const cases = [...totals.values()].map(row => ({ ...row, recognition: row.recognition / row.count, execution: row.execution / row.count, preAuf: row.preAuf / row.count, postAuf: row.postAuf / row.count }));
    cases.sort((a, b) => b.recognition + b.execution + b.preAuf + b.postAuf - a.recognition - a.execution - a.preAuf - a.postAuf);
    if (category === StepName.F2L) cases.splice(20);
    const labels = cases.map(x => x.label);
    const dataset = (label: string, key: 'recognition' | 'execution' | 'preAuf' | 'postAuf', combined = false) => ({
        label, data: cases.map(row => row[key] + (combined ? row.preAuf + row.postAuf : 0)), backgroundColor: SEGMENT_COLORS[key],
    });
    const datasets = use4SegmentTiming ? [
        dataset(`Recognition (past ${windowSize})`, 'recognition'),
        ...(cases.some(row => row.preAuf > 0) ? [dataset(`Pre-AUF (past ${windowSize})`, 'preAuf')] : []),
        dataset(`Execution (past ${windowSize})`, 'execution'),
        ...(cases.some(row => row.postAuf > 0) ? [dataset(`Post-AUF (past ${windowSize})`, 'postAuf')] : []),
    ] : [
        dataset(`Average recognition time for each case in past ${windowSize} solves`, 'recognition'),
        dataset(`Average execution time for each case in past ${windowSize} solves`, 'execution', true),
    ];
    return { labels, datasets };
}

export function buildAlgorithmPracticeRows(solves: Solve[], steps: StepName[], windowSize: number, precision = 3): AlgoPracticeRow[] {
    const category = caseCategory(steps);
    if (!category) return [];
    const recentSolves = solves.slice(-windowSize), grouped = new Map<string, { time: number; wasted: number; count: number }>();
    for (const solve of recentSolves) for (const step of caseSteps(solve, category)) {
        const row = grouped.get(step.case) ?? { time: 0, wasted: 0, count: 0 };
        row.time += step.time; row.wasted += analyzeStepMoves(step.moves, getAufMovesForSolve(solve)).wastedMoves; row.count++;
        grouped.set(step.case, row);
    }
    const caseStats = computeCaseFailureStats(recentSolves, category);
    if (category === StepName.F2L) caseStats.splice(20);
    return caseStats.map((cs: CaseStats) => {
        const { time, wasted, count } = grouped.get(cs.caseName)!;
        return {
            case: cs.caseName,
            total: cs.totalCount,
            failed: cs.failureCount,
            failureRate: cs.failureRate.toFixed(1) + '%',
            avgMoves: cs.avgMoves.toFixed(1),
            expectedMoves: cs.expectedMovesBase,
            avgWasted: (wasted / count).toFixed(1),
            avgTime: (time / count).toFixed(precision),
        };
    });
}

// ── Best solves ───────────────────────────────────────────────────────────────

export function computeBestSolvesData(solves: Solve[], precision = 3): FastestSolve[] {
    return solves.slice().sort((a, b) => a.time - b.time).slice(0, Const.FastestSolvesCount).map(solve => ({
        date: solve.date.toDateString(), time: solve.time.toFixed(precision),
        scramble: solve.scramble, id: solve.id, fullstep: solve.isFullStep ? 'Yes 🔥' : 'No',
        source: solve.source, rawSourceId: solve.rawSourceId,
    }));
}

// ── Main computation ──────────────────────────────────────────────────────────

export function computeAllChartData(input: WorkerInput): ChartDataBundle {
    const { windowSize, pointsPerGraph, steps, goodTime, badTime, methodName, use4SegmentTiming, isDark } = input;
    const solves = input.solves.filter(s => !s.dnf);
    const records = recordTimes(input.solves);
    const solveNumbers = input.solves.flatMap((solve, i) => solve.dnf ? [] : [i + 1]);
    const hasOll = steps.includes(StepName.OLL);
    const hasPll = steps.includes(StepName.PLL);

    // Acubemy exports don't include inspection time. When sources are combined, only Cubeast solves
    // should contribute to inspection charts; when the dataset is Acubemy-only, hide both charts.
    const inspectionSolves = solves.filter((s): s is Solve & { inspectionTime: number } => s.inspectionTime != null);
    const showInspectionCharts = shouldShowInspectionCharts(solves) && inspectionSolves.length > 0;

    // Charts that carry their own semantic colours are left alone by the palette.
    const paint = <T extends 'line' | 'bar' | 'doughnut', TLabel>(data: LabelledChart<T, TLabel>, perPointColors?: boolean): LabelledChart<T, TLabel> =>
        applyPaletteToChartData(data, isDark, perPointColors);
    const paintRolling = (data: LabelledChart<'line'>, numbers = solveNumbers): LabelledChart<'line'> =>
        paint({ ...data, labels: data.labels?.map(label => String(numbers[Number(label) - 1])) });

    const cache: ChartDataBundle = {
        mistakes: summarizeMistakes(solves, windowSize),
        runningAverage: paint(buildRunningAverageData(input.solves, windowSize, pointsPerGraph, input.chopPercentage)),
        runningStdDev: paintRolling(buildRunningStdDevData(solves, windowSize, pointsPerGraph)),
        runningTps: paintRolling(buildRunningTpsData(solves, windowSize, pointsPerGraph)),
        runningInspection: showInspectionCharts
            ? paintRolling(buildRunningInspectionData(inspectionSolves, windowSize, pointsPerGraph), solveNumbers.filter((_, i) => solves[i].inspectionTime != null))
            : null,
        runningTurns: paintRolling(buildRunningTurnsData(solves, windowSize, pointsPerGraph)),
        runningRecognitionExecution: paintRolling(buildRunningRecognitionExecution(solves, windowSize, pointsPerGraph, use4SegmentTiming)),
        runningEfficiency: paintRolling(buildRunningEfficiencyData(solves, steps, methodName, windowSize, pointsPerGraph)),
        histogram: paint(buildHistogramData(solves, windowSize)),
        stepAverages: paintRolling(buildStepAverages(solves, steps, windowSize, pointsPerGraph)),
        runningColorPercentages: paintRolling(buildRunningColorPercentages(solves, windowSize, pointsPerGraph, isDark)),
        runningFirstPairPercentages: methodName.startsWith('CFOP') ? paintRolling(buildFirstPairPercentages(solves, windowSize, pointsPerGraph)) : undefined,
        inspection: showInspectionCharts
            ? paint(buildInspectionData(inspectionSolves, windowSize, input.precision))
            : null,
        dailyRecord: paint(buildDailyRecordData(solves)),
        streakRows: buildAllStreakRows(input.solves),
        recordRows: buildRecordRows(input.solves, input.precision, records),
        goodBad: paintRolling(buildGoodBadData(solves, windowSize, pointsPerGraph, goodTime, badTime)),
        recordHistory: applyPaletteToChartData(buildRecordHistory(input.solves, records), isDark),
        stepPercentages: paint(buildStepPercentages(solves, steps, windowSize), true),
        typicalCompare: paint(buildTypicalCompare(solves, windowSize)),
        bestSolvesData: computeBestSolvesData(solves, input.precision),
    };

    if (hasOll) cache.ollCategory = paintRolling(buildOllCategoryChart(solves, windowSize, pointsPerGraph));
    if (hasPll) cache.pllCategory = paintRolling(buildPllCategoryChart(solves, windowSize, pointsPerGraph));
    if (caseCategory(steps)) {
        cache.caseData = paint(buildCaseData(solves, steps, windowSize, use4SegmentTiming));
        cache.algoPracticeRows = buildAlgorithmPracticeRows(solves, steps, windowSize, input.precision);
    }

    return cache;
}

// ── Worker message handler ────────────────────────────────────────────────────

export interface WorkerOutput {
    requestId: number;
    chartData: ChartDataBundle;
}

/**
 * Inside a worker the global is a DedicatedWorkerGlobalScope, but this project compiles
 * with the DOM lib, where `globalThis` is typed as a Window. Only the two members the
 * worker actually uses are declared.
 */
export interface ChartWorkerScope {
    onmessage: ((e: MessageEvent<WorkerInput>) => void) | null;
    postMessage(message: WorkerOutput): void;
}

const workerGlobal = globalThis as ChartWorkerScope;
workerGlobal.onmessage = function (e: MessageEvent<WorkerInput>) {
    workerGlobal.postMessage({
        requestId: e.data.requestId,
        chartData: computeAllChartData(e.data),
    });
};
