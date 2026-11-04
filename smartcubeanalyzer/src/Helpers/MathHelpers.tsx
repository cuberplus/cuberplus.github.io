import { Const } from "./Constants";
export { movingAverages as calculateMovingAverageChopped } from '../../../shared/averages';

export function sumArray(data: number[]): number {
    return data.reduce((acc, curr) => acc + curr, 0);
}

export function calculateAverage(data: number[]): number {
    return sumArray(data) / data.length;
}

export function calculateStandardDeviation(data: number[]): number {
    const samples = data.slice(-Const.StdDevWindow);
    const mean = calculateAverage(samples)

    let variance = 0;
    for (let i = 0; i < samples.length; i++) {
        variance += Math.pow(samples[i] - mean, 2);
    }
    variance /= samples.length;

    return Math.sqrt(variance)
}

export function calculate90thPercentile(data: number[], window: number): number {
    let recentSolves = data;
    if (data.length > window) {
        recentSolves = data.slice(-window);
    }

    const sortedSolves = recentSolves.sort((a, b) => {
        return a - b;
    })

    let idx = Math.floor(.9 * sortedSolves.length); // Find 90th percentile of the window (1-indexed)
    idx = Math.max(0, idx - 1); // 0-indexed

    return Math.ceil(sortedSolves[idx]);
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
        const newMean = mean;
        variance += (data[i] - goingAway) * ((data[i] - newMean) + (goingAway - oldMean)) / (window - 1)
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
    return Array.from({ length: chunks }, (v, i) =>
        values.slice(i * size, i * size + size)
    );
}

// Given the user's average time, calculate what the expected splits should be
export function getTypicalAverages(userAverage: number) {
    if (!Number.isFinite(userAverage)) {
        const zeroes = [0, 0, 0, 0];
        return zeroes;
    }
    const typicalData = [
        { maxAverage: 8, splits: [.95, 4.05, 1.3, 1.7], expected: 8 },
        { maxAverage: 10, splits: [1.2, 5, 1.65, 2.15], expected: 10 },
        { maxAverage: 12, splits: [1.5, 6, 1.9, 2.6], expected: 12 },
        { maxAverage: 15, splits: [2, 7.5, 2.3, 3.2], expected: 15 },
        { maxAverage: 20, splits: [2.8, 10.2, 3, 4], expected: 20 },
        { maxAverage: 25, splits: [3.5, 12.7, 3.8, 5], expected: 25 },
        { maxAverage: 30, splits: [4, 15.5, 4.5, 6], expected: 30 },
        { maxAverage: 40, splits: [5, 21, 6, 8], expected: 40 },
        { maxAverage: 50, splits: [6, 28, 7, 9], expected: 50 },
        { maxAverage: Infinity, splits: [7, 35, 8, 10], expected: 60 }
    ];

    const { splits, expected } = typicalData.find(data => userAverage <= data.maxAverage)!;

    if (splits.reduce((a, b) => a + b, 0) !== expected) {
        console.log("There is an error with the expected splits. Please verify");
    }

    const scalar = userAverage / expected;
    return splits.map(split => split * scalar);
}