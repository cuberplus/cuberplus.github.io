import { calculateMovingAverage, calculateMovingPercentage, calculateMovingAverageChopped, makeLabels, reduceDataset } from '../Helpers/MathHelpers';
import { buildRunningAverageData, buildRunningStdDevData, buildRunningTpsData, buildRunningInspectionData, buildRunningTurnsData, buildRunningRecognitionExecution, buildHistogramData, buildGoodBadData, buildRunningColorPercentages, buildFirstPairPercentages, buildStepPercentages, buildOllCategoryChart, buildPllCategoryChart, buildInspectionData, shouldShowInspectionCharts, buildTypicalCompare, fastestByDay, buildMovingLineChart } from '../Helpers/ChartDataBuilders';
import { applyPaletteToChartData, SEGMENT_COLORS } from '../Helpers/ChartColors';
import { analyzeStepMoves, computeCaseFailureStats, computeSolveEfficiency } from '../Helpers/MoveAnalysis';
import { getAufMovesForSolve } from '../Helpers/CsvParser';
import { summarizeMistakes } from '../Helpers/MistakeAnalysis';
import { Const } from '../Helpers/Constants';
import { AlgoPracticeRow, CaseStats, ChartDataBundle, FastestSolve, LabelledChart, getStep, MethodName, RecordRow, Solve, StepName, StreakRow } from '../Helpers/Types';
import { calendarDay, streakWindows } from '../../../shared/streaks';

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
const recordTimes = (solves: Solve[], window: number) => {
    const times = solves.map(s => s.dnf ? Infinity : s.time);
    return window === 1 ? times : calculateMovingAverageChopped(times, window);
};

export function buildRecordRows(solves: Solve[], precision = 3): RecordRow[] {
    return RECORD_WINDOWS.map(window => {
        const times = recordTimes(solves, window);
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

export function buildRecordHistory(solves: Solve[]) {
    const dates = solves.map(x => x.date);
    return {
        datasets: RECORD_WINDOWS.map(window => ({
            label: window === 1 ? 'Record Single' : `Record Ao${window}`,
            data: buildRecordDataset(dates.slice(window - 1), recordTimes(solves, window), window),
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

    const ollMap = needOll
        ? new Map(computeCaseFailureStats(solves, StepName.OLL).map((s: CaseStats) => [s.caseName, s]))
        : undefined;
    const pllMap = needPll
        ? new Map(computeCaseFailureStats(solves, StepName.PLL).map((s: CaseStats) => [s.caseName, s]))
        : undefined;

    const effList = solves.map((solve: Solve) => computeSolveEfficiency(solve, ollMap, pllMap));
    const efficiencies = effList.map(e => e.moveEfficiency * 100);

    let movingAvg = calculateMovingAverage(efficiencies, windowSize);
    const labels = makeLabels(movingAvg.length, pointsPerGraph, windowSize);
    movingAvg = reduceDataset(movingAvg, pointsPerGraph);

    const datasets: { label: string; data: number[] }[] = [
        { label: `Move Efficiency % (avg of ${windowSize})`, data: movingAvg },
    ];

    if (allStepsSelected && (needOll || needPll)) {
        const ollRate = needOll
            ? reduceDataset(calculateMovingPercentage(effList, windowSize, e => e.hadOllFailure), pointsPerGraph)
            : movingAvg.map(() => 0);
        const pllRate = needPll
            ? reduceDataset(calculateMovingPercentage(effList, windowSize, e => e.hadPllFailure), pointsPerGraph)
            : movingAvg.map(() => 0);
        datasets.push({ label: 'Solve efficiency', data: movingAvg.map((eff, i) => eff - ollRate[i] - pllRate[i]) });
        if (needOll) datasets.push({ label: `OLL success % (last ${windowSize})`, data: ollRate.map(r => 100 - r) });
        if (needPll) datasets.push({ label: `PLL success % (last ${windowSize})`, data: pllRate.map(r => 100 - r) });
    }

    return { labels, datasets };
}

// ── Case data (OLL/PLL single-step) ──────────────────────────────────────────

export function buildCaseData(solves: Solve[], steps: StepName[], windowSize: number, use4SegmentTiming: boolean) {
    const colors = SEGMENT_COLORS;
    if (steps.length !== 1 || (steps[0] !== StepName.OLL && steps[0] !== StepName.PLL)) {
        return { labels: [], datasets: [] };
    }
    const recentSolves = solves.slice(-windowSize);
    const failureStatsArr = computeCaseFailureStats(recentSolves, steps[0]);
    const failureMap: { [k: string]: CaseStats } = {};
    failureStatsArr.forEach((cs: CaseStats) => { failureMap[cs.caseName] = cs; });

    type CaseRow = { recognitionTime: number; executionTime: number; preAufTime: number; postAufTime: number; turns: number };
    const caseTimes: { [id: string]: CaseRow[] } = {};
    for (const s of recentSolves) {
        const step = getStep(s, steps[0]);
        if (!step?.case) continue;
        if (!(step.case in caseTimes)) caseTimes[step.case] = [];
        caseTimes[step.case].push({
            recognitionTime: s.recognitionTime,
            executionTime: s.executionTime - s.preAufTime - s.postAufTime,
            preAufTime: s.preAufTime,
            postAufTime: s.postAufTime,
            turns: step.turns,
        });
    }

    type CaseAgg = { label: string; recognitionTime: number; executionTime: number; preAufTime: number; postAufTime: number; avgMoves: number; failureRate: number };
    const cases: CaseAgg[] = [];
    for (const key in caseTimes) {
        const rows = caseTimes[key];
        const fs = failureMap[key];
        cases.push({
            label: key,
            recognitionTime: rows.reduce((a, r) => a + r.recognitionTime, 0) / rows.length,
            executionTime: rows.reduce((a, r) => a + r.executionTime, 0) / rows.length,
            preAufTime: rows.reduce((a, r) => a + r.preAufTime, 0) / rows.length,
            postAufTime: rows.reduce((a, r) => a + r.postAufTime, 0) / rows.length,
            avgMoves: rows.reduce((a, r) => a + r.turns, 0) / rows.length,
            failureRate: fs ? fs.failureRate : 0,
        });
    }
    cases.sort((a, b) =>
        (b.recognitionTime + b.preAufTime + b.executionTime + b.postAufTime) -
        (a.recognitionTime + a.preAufTime + a.executionTime + a.postAufTime)
    );

    const labels = cases.map(x => x.label);
    if (use4SegmentTiming) {
        const hasPreAuf = cases.some(x => x.preAufTime > 0);
        const hasPostAuf = cases.some(x => x.postAufTime > 0);
        const datasets: { label: string; data: number[]; backgroundColor: string }[] = [];
        datasets.push({ label: `Recognition (past ${windowSize})`, data: cases.map(x => x.recognitionTime), backgroundColor: colors.recognition });
        if (hasPreAuf) datasets.push({ label: `Pre-AUF (past ${windowSize})`, data: cases.map(x => x.preAufTime), backgroundColor: colors.preAuf });
        datasets.push({ label: `Execution (past ${windowSize})`, data: cases.map(x => x.executionTime), backgroundColor: colors.execution });
        if (hasPostAuf) datasets.push({ label: `Post-AUF (past ${windowSize})`, data: cases.map(x => x.postAufTime), backgroundColor: colors.postAuf });
        return { labels, datasets };
    }
    return {
        labels,
        datasets: [
            { label: `Average recognition time for each case in past ${windowSize} solves`, data: cases.map(x => x.recognitionTime), backgroundColor: colors.recognition },
            { label: `Average execution time for each case in past ${windowSize} solves`, data: cases.map(x => x.preAufTime + x.executionTime + x.postAufTime), backgroundColor: colors.execution },
        ],
    };
}

export function buildAlgorithmPracticeRows(solves: Solve[], steps: StepName[], windowSize: number, precision = 3): AlgoPracticeRow[] {
    if (steps.length !== 1 || (steps[0] !== StepName.OLL && steps[0] !== StepName.PLL)) {
        return [];
    }
    const recentSolves = solves.slice(-windowSize);
    const caseStats = computeCaseFailureStats(recentSolves, steps[0]);
    return caseStats.map((cs: CaseStats) => {
        const matchingSolves = recentSolves.filter((s: Solve) => getStep(s, steps[0])?.case === cs.caseName);
        const avgTime = matchingSolves.length > 0
            ? matchingSolves.reduce((sum: number, s: Solve) => sum + (getStep(s, steps[0])?.time ?? 0), 0) / matchingSolves.length
            : 0;
        const avgWasted = matchingSolves.length > 0
            ? matchingSolves.reduce((sum: number, s: Solve) => sum + analyzeStepMoves(getStep(s, steps[0])?.moves ?? '', getAufMovesForSolve(s)).wastedMoves, 0) / matchingSolves.length
            : 0;
        return {
            case: cs.caseName,
            total: cs.totalCount,
            failed: cs.failureCount,
            failureRate: cs.failureRate.toFixed(1) + '%',
            avgMoves: cs.avgMoves.toFixed(1),
            expectedMoves: cs.expectedMovesBase,
            avgWasted: avgWasted.toFixed(1),
            avgTime: avgTime.toFixed(precision),
        };
    });
}

// ── Best solves ───────────────────────────────────────────────────────────────

export function computeBestSolvesData(solves: Solve[], precision = 3): FastestSolve[] {
    return solves
        .slice()
        .sort((a, b) => a.time - b.time)
        .slice(0, Const.FastestSolvesCount)
        .map(x => ({
            date: x.date.toDateString(),
            time: x.time.toFixed(precision),
            scramble: x.scramble,
            id: x.id,
            fullstep: x.isFullStep ? 'Yes 🔥' : 'No',
            source: x.source,
            rawSourceId: x.rawSourceId,
        } as FastestSolve));
}

// ── Main computation ──────────────────────────────────────────────────────────

export function computeAllChartData(input: WorkerInput): ChartDataBundle {
    const { windowSize, pointsPerGraph, steps, goodTime, badTime, methodName, use4SegmentTiming, isDark } = input;
    const solves = input.solves.filter(s => !s.dnf);
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
        recordRows: buildRecordRows(input.solves, input.precision),
        goodBad: paintRolling(buildGoodBadData(solves, windowSize, pointsPerGraph, goodTime, badTime)),
        recordHistory: applyPaletteToChartData(buildRecordHistory(input.solves), isDark),
        stepPercentages: paint(buildStepPercentages(solves, steps, windowSize), true),
        typicalCompare: paint(buildTypicalCompare(solves, windowSize)),
        bestSolvesData: computeBestSolvesData(solves, input.precision),
    };

    if (hasOll) cache.ollCategory = paintRolling(buildOllCategoryChart(solves, windowSize, pointsPerGraph));
    if (hasPll) cache.pllCategory = paintRolling(buildPllCategoryChart(solves, windowSize, pointsPerGraph));
    if (steps.length === 1 && (steps[0] === StepName.OLL || steps[0] === StepName.PLL)) {
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
