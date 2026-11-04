/**
 * Pure functions that build chart datasets from solves and options.
 * Used by ChartPanel and can be wrapped in useMemo when using function components.
 */
import { Const } from './Constants';
import {
    calculateAverage,
    calculateMovingAverage,
    calculateMovingAverageChopped,
    calculateMovingPercentage,
    calculateMovingStdDev,
    makeLabels,
    reduceDataset,
    splitIntoChunks,
    getTypicalAverages,
} from './MathHelpers';
import { CrossColor, getStep, LabelledChart, Solve, StepName } from './Types';
import { OllEdgeOrientation, PllCornerPermutation } from './Types';
import { SEGMENT_COLORS } from './ChartColors';

type MovingCalcFn = (values: number[], windowSize: number) => number[];

export function fastestByDay(solves: Solve[]): Map<string, Solve> {
    const days = new Map<string, Solve>();
    for (const solve of solves) {
        const day = solve.date.toLocaleDateString('en-CA'), best = days.get(day);
        if (!best || solve.time < best.time) days.set(day, solve);
    }
    return days;
}

export function buildMovingLineChart(
    solves: Solve[],
    windowSize: number,
    pointsPerGraph: number,
    series: Array<{ extract: (s: Solve) => number; calcFn: MovingCalcFn; label: string }>
): LabelledChart<'line'> {
    const allData = series.map(s => s.calcFn(solves.map(s.extract), windowSize));
    const reducedData = allData.map(d => reduceDataset(d, pointsPerGraph));
    const labels = makeLabels(allData[0].length, pointsPerGraph, windowSize);
    return {
        labels,
        datasets: series.map((s, i) => ({ label: s.label, data: reducedData[i] })),
    };
}

export function buildRunningAverageData(solves: Solve[], windowSize: number, pointsPerGraph: number, chopPercentage = 5): LabelledChart<'line'> {
    const values = solves.map(s => s.dnf ? Infinity : s.time);
    const chop = Math.min(Math.floor((windowSize - 1) / 2), Math.ceil(windowSize * chopPercentage / 100));
    const averages = calculateMovingAverageChopped(values, windowSize, chop);
    const indices = new Set(reduceDataset(averages.map((_, i) => i), pointsPerGraph));
    let best = -1, worst = -1;
    for (let i = 0; i < averages.length; i++) {
        if (Number.isFinite(averages[i])) {
            if (best < 0 || averages[i] < averages[best]) best = i;
            if (worst < 0 || averages[i] > averages[worst]) worst = i;
        }
        if (i > 0 && Number.isFinite(averages[i]) !== Number.isFinite(averages[i - 1])) {
            indices.add(i - 1);
            indices.add(i);
        }
    }
    if (best >= 0) { indices.add(best); indices.add(worst); }
    const selected = Array.from(indices).sort((a, b) => a - b);
    return {
        labels: selected.map(i => String(i + windowSize)),
        datasets: [{ label: `Average Time Of ${windowSize}`, data: selected.map(i => Number.isFinite(averages[i]) ? averages[i] : null) }],
    };
}

export function buildRunningStdDevData(solves: Solve[], windowSize: number, pointsPerGraph: number): LabelledChart<'line'> {
    return buildMovingLineChart(solves, windowSize, pointsPerGraph, [
        { extract: x => x.time, calcFn: calculateMovingStdDev, label: `Average StdDev Of ${windowSize}` },
    ]);
}

export function buildRunningTpsData(solves: Solve[], windowSize: number, pointsPerGraph: number): LabelledChart<'line'> {
    return buildMovingLineChart(solves, windowSize, pointsPerGraph, [
        { extract: x => x.tps, calcFn: calculateMovingAverage, label: `Average TPS Of ${windowSize}` },
        { extract: x => x.executionTime > 0 ? x.turns / x.executionTime : 0, calcFn: calculateMovingAverage, label: `Average TPS During Execution Of ${windowSize}` },
    ]);
}

export function buildRunningInspectionData(
    solves: Array<Solve & { inspectionTime: number }>,
    windowSize: number,
    pointsPerGraph: number
): LabelledChart<'line'> {
    return buildMovingLineChart(solves, windowSize, pointsPerGraph, [
        { extract: x => x.inspectionTime!, calcFn: calculateMovingAverage, label: `Average Inspection Of ${windowSize}` },
    ]);
}

export function buildRunningTurnsData(solves: Solve[], windowSize: number, pointsPerGraph: number): LabelledChart<'line'> {
    return buildMovingLineChart(solves, windowSize, pointsPerGraph, [
        { extract: x => x.turns, calcFn: calculateMovingAverage, label: `Average Turns Of ${windowSize}` },
    ]);
}

export function buildRunningRecognitionExecution(
    solves: Solve[],
    windowSize: number,
    pointsPerGraph: number,
    use4SegmentTiming: boolean
): LabelledChart<'line'> {
    const colors = SEGMENT_COLORS;
    const moving = (extract: (s: Solve) => number) => calculateMovingAverage(solves.map(extract), windowSize);

    const recognition = { name: 'Recognition', values: moving((x) => x.recognitionTime), color: colors.recognition };
    const labels = makeLabels(recognition.values.length, pointsPerGraph, windowSize);

    // AUF segments only appear when the data actually contains them.
    const segments = use4SegmentTiming
        ? [
            recognition,
            { name: 'Pre-AUF', values: moving((x) => x.preAufTime), color: colors.preAuf, optional: true },
            { name: 'Execution', values: moving((x) => x.executionTime - x.preAufTime - x.postAufTime), color: colors.execution },
            { name: 'Post-AUF', values: moving((x) => x.postAufTime), color: colors.postAuf, optional: true },
        ]
        : [
            recognition,
            { name: 'Execution', values: moving((x) => x.executionTime), color: colors.execution },
        ];

    return {
        labels,
        datasets: segments
            .map((s) => ({ ...s, data: reduceDataset(s.values, pointsPerGraph) }))
            .filter((s) => !('optional' in s && s.optional) || s.data.some((v) => v > 0))
            .map((s) => ({
                label: `Average ${s.name} Of ${windowSize}`,
                data: s.data,
                borderColor: s.color,
                backgroundColor: s.color,
            })),
    } as LabelledChart<'line'>;
}

export function buildHistogramData(solves: Solve[], windowSize: number): LabelledChart<'bar', number> {
    const recentSolves = solves.map((x) => x.time).slice(-windowSize);
    const histogram = new Map<number, number>();
    for (const val of recentSolves) {
        const key = Math.trunc(val);
        histogram.set(key, (histogram.get(key) ?? 0) + 1);
    }
    const arr = Array.from(histogram).sort((a, b) => a[0] - b[0]);
    return {
        labels: arr.map((a) => a[0]),
        datasets: [
            {
                label: `Number of solves by time (of recent ${windowSize})`,
                data: arr.map((a) => a[1]),
            },
        ],
    };
}

export function buildGoodBadData(
    solves: Solve[],
    windowSize: number,
    pointsPerGraph: number,
    goodTime: number,
    badTime: number
): LabelledChart<'line'> {
    return buildMovingLineChart(solves, windowSize, pointsPerGraph, [
        { extract: x => x.time, calcFn: (times, window) => calculateMovingPercentage(times, window, time => time < goodTime), label: `Percentage of good solves over last ${windowSize}` },
        { extract: x => x.time, calcFn: (times, window) => calculateMovingPercentage(times, window, time => time > badTime), label: `Percentage of bad solves over last ${windowSize}` },
    ]);
}

export function buildRunningColorPercentages(
    solves: Solve[],
    windowSize: number,
    pointsPerGraph: number,
    isDark?: boolean
): LabelledChart<'line'> {
    type ColorDef = { color: CrossColor; label: string; borderColor: string; backgroundColor: string };
    const whiteLineColor = isDark ? 'White' : 'Black';
    const colorDefs: ColorDef[] = [
        { color: CrossColor.White, label: 'White', borderColor: whiteLineColor, backgroundColor: whiteLineColor },
        { color: CrossColor.Yellow, label: 'Yellow', borderColor: 'Yellow', backgroundColor: 'Yellow' },
        { color: CrossColor.Red, label: 'Red', borderColor: 'Red', backgroundColor: 'Red' },
        { color: CrossColor.Orange, label: 'Orange', borderColor: 'Orange', backgroundColor: 'Orange' },
        { color: CrossColor.Blue, label: 'Blue', borderColor: 'Blue', backgroundColor: 'Blue' },
        { color: CrossColor.Green, label: 'Green', borderColor: 'Green', backgroundColor: 'Green' },
    ];
    const hasUnknown = solves.some((s) => s.crossColor === CrossColor.Unknown);
    const colors: ColorDef[] = hasUnknown
        ? [...colorDefs, { color: CrossColor.Unknown, label: 'Unknown', borderColor: 'Purple', backgroundColor: 'Purple' }]
        : colorDefs;

    const datasets = colors.map(c => ({
        label: `Percentage of solves with ${c.label} cross over last ${windowSize}`,
        data: reduceDataset(calculateMovingPercentage(solves, windowSize, solve => solve.crossColor === c.color), pointsPerGraph),
        borderColor: c.borderColor, backgroundColor: c.backgroundColor,
    }));
    const labels = makeLabels(Math.max(0, solves.length - windowSize + 1), pointsPerGraph, windowSize);
    return { labels, datasets };
}

export function buildStepPercentages(
    solves: Solve[],
    steps: StepName[],
    windowSize: number
): LabelledChart<'doughnut'> {
    const labels = [...new Set(steps)], recent = solves.slice(-windowSize);
    const values = labels.map(step => recent.reduce((sum, solve) => sum + (getStep(solve, step)?.time ?? 0), 0) / (recent.length || 1));
    return {
        labels,
        datasets: [
            {
                label: `Seconds each step takes (of recent ${windowSize})`,
                data: values,
            },
        ],
    };
}

function buildCategoryPercentageChart(
    solves: Solve[],
    windowSize: number,
    pointsPerGraph: number,
    stepName: StepName,
    categories: Array<{ predicate: (c: string) => boolean; label: string }>
): LabelledChart<'line'> {
    const cases = solves.map((x) => getStep(x, stepName)?.case ?? '');
    const datasets = categories.map(({ predicate, label }) => ({
        label,
        data: reduceDataset(calculateMovingPercentage(cases, windowSize, predicate), pointsPerGraph),
    }));
    const labels = makeLabels(Math.max(0, solves.length - windowSize + 1), pointsPerGraph, windowSize);
    return { labels, datasets };
}

export function buildOllCategoryChart(solves: Solve[], windowSize: number, pointsPerGraph: number): LabelledChart<'line'> {
    return buildCategoryPercentageChart(solves, windowSize, pointsPerGraph, StepName.OLL, [
        { predicate: c => Const.OllEdgeOrientationMapping.get(c) === OllEdgeOrientation.Dot,   label: `Percentage of OLL Dot Cases over last ${windowSize}` },
        { predicate: c => Const.OllEdgeOrientationMapping.get(c) === OllEdgeOrientation.Line,  label: `Percentage of OLL Line Cases over last ${windowSize}` },
        { predicate: c => Const.OllEdgeOrientationMapping.get(c) === OllEdgeOrientation.Angle, label: `Percentage of OLL Angle Cases over last ${windowSize}` },
        { predicate: c => Const.OllEdgeOrientationMapping.get(c) === OllEdgeOrientation.Cross, label: `Percentage of OLL Cross Cases over last ${windowSize}` },
    ]);
}

export function buildPllCategoryChart(solves: Solve[], windowSize: number, pointsPerGraph: number): LabelledChart<'line'> {
    return buildCategoryPercentageChart(solves, windowSize, pointsPerGraph, StepName.PLL, [
        { predicate: c => Const.PllCornerPermutationMapping.get(c) === PllCornerPermutation.Solved,   label: `Percentage of PLL Solved Corner Cases over last ${windowSize}` },
        { predicate: c => Const.PllCornerPermutationMapping.get(c) === PllCornerPermutation.Adjacent, label: `Percentage of PLL Adjacent Corner Cases over last ${windowSize}` },
        { predicate: c => Const.PllCornerPermutationMapping.get(c) === PllCornerPermutation.Diagonal, label: `Percentage of PLL Diagonal Corner Cases over last ${windowSize}` },
    ]);
}

export function buildInspectionData(
    solves: Array<Solve & { inspectionTime: number }>,
    windowSize: number
): LabelledChart<'bar'> {
    const chunks = splitIntoChunks(solves.slice(-windowSize).sort((a, b) => a.inspectionTime - b.inspectionTime), Const.InspectionGraphChunks);
    return {
        labels: chunks.map(chunk => '~' + calculateAverage(chunk.map(solve => solve.inspectionTime)).toFixed(2)),
        datasets: [
            {
                label: `Solve time by inspection time (of recent ${windowSize})`,
                data: chunks.map(chunk => calculateAverage(chunk.map(solve => solve.time))),
            },
        ],
    };
}

export function shouldShowInspectionCharts(solves: Solve[]): boolean {
    if (solves.length === 0) return false;
    if (solves.every((s) => s.source === 'acubemy')) return false;
    return solves.some((s) => s.inspectionTime != null);
}

export function buildTypicalCompare(solves: Solve[], windowSize: number): LabelledChart<'bar'> {
    const labels = ['Cross', 'F2L', 'OLL', 'PLL'];
    const recent = solves.slice(-windowSize), average = calculateAverage(recent.map(solve => solve.time));
    const usable = Number.isFinite(average) && (solves[0]?.steps?.length ?? 0) >= 7;
    const groups = [[StepName.Cross], [StepName.F2L_1, StepName.F2L_2, StepName.F2L_3, StepName.F2L_4], [StepName.OLL], [StepName.PLL]];
    const yourAverages = groups.map(group => usable ? group.reduce((sum, step) => sum + calculateAverage(recent.map(solve => getStep(solve, step)?.time ?? 0)), 0) : 0);
    return {
        labels,
        datasets: [
            { label: `Your average by step over last ${windowSize}`, data: yourAverages },
            { label: `Typical cuber's average by step, using your average time`, data: usable ? getTypicalAverages(average) : [0, 0, 0, 0] },
        ],
    };
}
