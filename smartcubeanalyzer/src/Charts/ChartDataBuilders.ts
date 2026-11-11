/**
 * Pure functions that build chart datasets from solves and options.
 * Used by ChartPanel and can be wrapped in useMemo when using function components.
 */
import { Const } from '../Models/Constants';
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
} from '../Helpers/MathHelpers';
import { CrossColor, getStep, LabelledChart, Solve, StepName } from '../Models/Types';
import { OllEdgeOrientation, PllCornerPermutation } from '../Models/Types';
import { SEGMENT_COLORS } from './ChartColors';
import { pairColors } from '../../../shared/cube/f2l';
import { COLORS, EDGES } from '../../../scrambler/src/cube/cube';
import { calendarDay } from '../../../shared/statistics/streaks';

type MovingCalcFn = (values: number[], windowSize: number) => number[];

export function fastestByDay(solves: Solve[]): Map<string, Solve> {
    const days = new Map<string, Solve>();
    for (const solve of solves) {
        const day = new Date(calendarDay(solve.endDate ?? solve.date) * 86400000).toISOString().slice(0, 10), best = days.get(day);
        if (!best || best.dnf && !solve.dnf || !!best.dnf === !!solve.dnf && solve.time < best.time) days.set(day, solve);
    }
    return days;
}
export const streakSolves = (solves: Solve[], days: number[]): Solve[] =>
    [...fastestByDay(solves).values()].filter(solve => days.includes(calendarDay(solve.endDate ?? solve.date)))
        .sort((a, b) => a.date.getTime() - b.date.getTime());

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
    const moving = (extract: (s: Solve) => number) => calculateMovingAverage(solves.map(extract), windowSize);
    const segments: { name: string; key: keyof typeof SEGMENT_COLORS; extract: (s: Solve) => number; optional?: boolean }[] = [
        { name: 'Recognition', key: 'recognition', extract: x => x.recognitionTime },
        ...(use4SegmentTiming ? [{ name: 'Pre-AUF', key: 'preAuf' as const, extract: (x: Solve) => x.preAufTime, optional: true }] : []),
        { name: 'Execution', key: 'execution', extract: x => x.executionTime - (use4SegmentTiming ? x.preAufTime + x.postAufTime : 0) },
        ...(use4SegmentTiming ? [{ name: 'Post-AUF', key: 'postAuf' as const, extract: (x: Solve) => x.postAufTime, optional: true }] : []),
    ];
    return {
        labels: makeLabels(Math.max(0, solves.length - windowSize + 1), pointsPerGraph, windowSize),
        datasets: segments
            .map(segment => ({ ...segment, data: reduceDataset(moving(segment.extract), pointsPerGraph) }))
            .filter(segment => !segment.optional || segment.data.some(value => value > 0))
            .map(segment => ({
                label: `Average ${segment.name} Of ${windowSize}`, data: segment.data,
                borderColor: SEGMENT_COLORS[segment.key], backgroundColor: SEGMENT_COLORS[segment.key],
            })),
    };
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
    const colors = Object.values(CrossColor).filter(color => color !== CrossColor.Unknown || solves.some(solve => solve.crossColor === color));
    const datasets = colors.map(color => ({
        label: `Percentage of solves with ${color} cross over last ${windowSize}`,
        data: reduceDataset(calculateMovingPercentage(solves, windowSize, solve => solve.crossColor === color), pointsPerGraph),
        borderColor: color === CrossColor.White && !isDark ? 'Black' : color === CrossColor.Unknown ? 'Purple' : color,
        backgroundColor: color === CrossColor.White && !isDark ? 'Black' : color === CrossColor.Unknown ? 'Purple' : color,
    }));
    const labels = makeLabels(Math.max(0, solves.length - windowSize + 1), pointsPerGraph, windowSize);
    return { labels, datasets };
}

export function buildFirstPairPercentages(solves: Solve[], windowSize: number, pointsPerGraph: number): LabelledChart<'line'> {
    const counts = [0, 0, 0];
    solves.forEach(solve => { const face = COLORS.indexOf(solve.crossColor as typeof COLORS[number]); if (face >= 0) counts[face % 3]++; });
    const cross = counts.indexOf(Math.max(...counts));
    const pairs = counts[cross] ? EDGES.filter(edge => edge.every(face => face % 3 !== cross)).map(edge => pairColors(edge)) : [];
    const values = solves.map(solve => COLORS.indexOf(solve.crossColor as typeof COLORS[number]) % 3 === cross ? solve.firstF2LPair : undefined);
    const data = pairs.map(pair => reduceDataset(calculateMovingPercentage(values, windowSize, value => value === pair), pointsPerGraph));
    const totals = data[0]?.map((_, i) => data.reduce((sum, series) => sum + series[i], 0)) ?? [];
    return { labels: makeLabels(Math.max(0, solves.length - windowSize + 1), pointsPerGraph, windowSize), datasets: pairs.map((pair, index) => ({
        label: pair.replace('/', ' / '),
        data: data[index].map((value, i) => totals[i] ? value * 100 / totals[i] : null),
    })) };
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
    const coverage = reduceDataset(calculateMovingPercentage(cases, windowSize, value => categories.some(category => category.predicate(value))), pointsPerGraph);
    const datasets = categories.map(({ predicate, label }) => ({
        label,
        data: reduceDataset(calculateMovingPercentage(cases, windowSize, predicate), pointsPerGraph)
            .map((value, i) => coverage[i] ? value * 100 / coverage[i] : null),
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
    windowSize: number, precision = 2
): LabelledChart<'bar'> {
    const chunks = splitIntoChunks(solves.slice(-windowSize).sort((a, b) => a.inspectionTime - b.inspectionTime), Const.InspectionGraphChunks);
    return {
        labels: chunks.map(chunk => '~' + calculateAverage(chunk.map(solve => solve.inspectionTime)).toFixed(precision)),
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
