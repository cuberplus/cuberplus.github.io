import { Const } from "../Models/Constants";
export { movingAverages as calculateMovingAverageChopped } from '../../../shared/statistics/averages';

export function sumArray(data: number[]): number {
    return data.reduce((acc, curr) => acc + curr, 0);
}

export function calculateAverage(data: number[]): number {
    return sumArray(data) / data.length;
}

export function calculateStandardDeviation(data: number[]): number {
    const samples = data.slice(-Const.StdDevWindow);
    const mean = calculateAverage(samples);
    return Math.sqrt(samples.reduce((variance, sample) => variance + (sample - mean) ** 2, 0) / samples.length);
}

export function calculate90thPercentile(data: number[], window: number): number {
    const recentSolves = data.length > window ? data.slice(-window) : data;
    const sortedSolves = recentSolves.sort((a, b) => a - b);
    return Math.ceil(sortedSolves[Math.max(0, Math.floor(.9 * sortedSolves.length) - 1)]);
}

export function calculateMovingAverage(data: number[], window: number): number[] {
    const result: number[] = [];
    if (data.length < window) {
        return result;
    }
    let sum = 0;
    for (let i = 0; i < window; ++i) {
        sum += data[i];
    }
    result.push(sum / window);
    for (let i = window; i < data.length; ++i) {
        sum -= data[i - window];
        sum += data[i];
        result.push(sum / window);
    }
    return result;
};

export function calculateMovingPercentage<T>(data: T[], window: number, criteria: (item: T) => boolean): number[] {
    return data.length < window ? [] : calculateMovingAverage(data.map(item => Number(criteria(item))), window).map(value => value * 100);
}

export function calculateMovingStdDev(data: number[], window: number) {
    const result: number[] = [];
    if (Number.isNaN(window) || data.length < window) {
        return result;
    }

    // The window lookback is just data[i - window], padded with zeroes for the first window.
    let mean = 0;
    let variance = 0;

    for (let i = 0; i < data.length; i++) {
        const oldMean = mean;
        const goingAway = i < window ? 0 : data[i - window];
        mean = oldMean + (data[i] - goingAway) / window;
        variance += (data[i] - goingAway) * ((data[i] - mean) + (goingAway - oldMean)) / (window - 1)
        if (i >= (window - 1)) {
            // Floating point accumulation can push variance marginally below zero
            // (e.g. a run of identical solve times), which would yield NaN.
            result.push(Math.sqrt(Math.max(0, variance)))
        }
    }

    return result;
}

export function reduceDataset<T>(values: T[], pointsPerGraph: number): T[] {
    if (values.length <= pointsPerGraph) return values;
    const delta = Math.max(1, Math.floor(values.length / pointsPerGraph));
    const reducedValues: T[] = [];
    for (let i = 0; i < values.length; i += delta) reducedValues.push(values[i]);
    if ((values.length - 1) % delta !== 0) reducedValues.push(values[values.length - 1]);
    return reducedValues;
}

/** Samples sequential labels, starting at the first window's ending solve. */
export function makeLabels(length: number, pointsPerGraph: number, start = 1): string[] {
    return reduceDataset(
        Array.from({ length }, (_, i) => (i + start).toString()),
        pointsPerGraph
    );
}

export function splitIntoChunks<T>(values: T[], chunks: number): T[][] {
    const size: number = Math.ceil(values.length / chunks);
    return Array.from({ length: chunks }, (_, i) =>
        values.slice(i * size, i * size + size)
    );
}

export function getTypicalAverages(userAverage: number) {
    if (!Number.isFinite(userAverage)) return [0, 0, 0, 0];
    const typicalData: [number, number[]][] = [
        [8, [.95, 4.05, 1.3, 1.7]],
        [10, [1.2, 5, 1.65, 2.15]],
        [12, [1.5, 6, 1.9, 2.6]],
        [15, [2, 7.5, 2.3, 3.2]],
        [20, [2.8, 10.2, 3, 4]],
        [25, [3.5, 12.7, 3.8, 5]],
        [30, [4, 15.5, 4.5, 6]],
        [40, [5, 21, 6, 8]],
        [50, [6, 28, 7, 9]],
        [60, [7, 35, 8, 10]],
    ];
    const [expected, splits] = typicalData.find(([max]) => userAverage <= max) ?? typicalData.at(-1)!;
    return splits.map(split => split * userAverage / expected);
}