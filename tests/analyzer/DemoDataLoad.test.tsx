/**
 * @jest-environment jsdom
 */
/**
 * End-to-end regression test for loading the bundled dev stats through the UI.
 *
 * Guards the two symptoms of a broken CSV parse, which unit tests on individual
 * helpers do not catch: the app reporting only a handful of solves, and every
 * chart rendering flat zeroes.
 */
import { afterEach, beforeAll, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';
import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { FileInput } from '../../smartcubeanalyzer/src/Components/FileInput';
import { GetDemoData } from '../../smartcubeanalyzer/src/Data/SampleData';
import { parseCsv } from '../../smartcubeanalyzer/src/Data/CsvParser';
import type { ChartDataBundle } from '../../smartcubeanalyzer/src/Models/Types';
import type { WorkerInput } from '../../smartcubeanalyzer/src/Workers/chartWorker';

/** The only parts of a Chart.js dataset this test inspects. */
type MockPoint = number | null | { x: number | Date; y: number };
interface MockChartData { labels?: (string | number)[]; datasets?: { label?: string; data?: MockPoint[] }[] }
interface ChartMockProps { data?: MockChartData }

const mockChartProps: ChartMockProps[] = [];
const mockWorkerResults: { input: WorkerInput; chartData: ChartDataBundle }[] = [];
jest.mock('../../timer/src/Analysis/analyzer-data', () => ({ readLocalAnalysis: jest.fn(async () => []) }));

jest.mock('react-chartjs-2', () => ({
    Line: (props: ChartMockProps) => { mockChartProps.push(props); return React.createElement('div', { 'data-chart': 'line' }); },
    Bar: (props: ChartMockProps) => { mockChartProps.push(props); return React.createElement('div', { 'data-chart': 'bar' }); },
    Doughnut: (props: ChartMockProps) => { mockChartProps.push(props); return React.createElement('div', { 'data-chart': 'doughnut' }); },
}));

// Run the worker body synchronously so the charts have data once React settles.
jest.mock('../../smartcubeanalyzer/src/Workers/createChartWorker', () => ({
    createChartWorker: () => {
        const { computeAllChartData: compute } = require('../../smartcubeanalyzer/src/Workers/chartWorker') as typeof import('../../smartcubeanalyzer/src/Workers/chartWorker');
        const worker: { onmessage: ((e: MessageEvent) => void) | null; postMessage(input: WorkerInput): void; terminate(): void } = {
            onmessage: null,
            postMessage(input: WorkerInput) {
                const chartData = compute(input);
                mockWorkerResults.push({ input, chartData });
                worker.onmessage?.(new MessageEvent('message', { data: { requestId: input.requestId, chartData } }));
            },
            terminate() { },
        };
        return worker;
    },
}));

const DEMO_CSV = join(process.cwd(), "smartcubeanalyzer", "public", "demo", "demo-solves.csv");
const EXPECTED_SOLVES = 21793;
const EXPECTED_SHOWN = 10000;

let rawCsv: string;

beforeAll(() => {
    rawCsv = readFileSync(DEMO_CSV, 'utf8');
    if (!('ResizeObserver' in globalThis)) {
        Object.assign(globalThis, { ResizeObserver: class { observe() { } unobserve() { } disconnect() { } } });
    }
    if (!('CSS' in globalThis)) Object.assign(globalThis, { CSS: { supports: () => false, escape: (value: string) => value } });
    if (!('matchMedia' in globalThis)) {
        Object.assign(globalThis, {
            matchMedia: () => ({ matches: false, addListener() { }, removeListener() { }, addEventListener() { }, removeEventListener() { } }),
        });
    }
    globalThis.fetch = () => Promise.resolve({ ok: true, text: () => Promise.resolve(rawCsv) } as Response);
});

function numbersIn(data?: MockChartData): number[] {
    const datasets = data?.datasets ?? [];
    return datasets.flatMap(set => (set?.data ?? []).filter((v): v is number => typeof v === 'number'));
}

describe('fetching the demo CSV', () => {
    let originalFetch: typeof globalThis.fetch;

    beforeEach(() => { originalFetch = globalThis.fetch; });
    afterEach(() => { globalThis.fetch = originalFetch; });

    test('asks for CSV so a base-path redirect resolves instead of the SPA fallback', async () => {
        let seenInit: RequestInit | undefined;
        globalThis.fetch = (_url, init) => {
            seenInit = init;
            return Promise.resolve({ ok: true, text: () => Promise.resolve('id,date\n1,2024-01-01') } as Response);
        };
        await GetDemoData();
        expect((seenInit?.headers as Record<string, string>)?.Accept).toBe('text/csv');
    });

    test('fails loudly when the server answers with a web page', async () => {
        // A dev server or host that cannot find the CSV serves index.html. Parsing
        // that as a CSV used to yield ~49 junk solves and charts of flat zeroes.
        globalThis.fetch = () => Promise.resolve({
            ok: true,
            text: () => Promise.resolve('<!DOCTYPE html>\n<html lang="en">\n<head></head>\n<body></body>\n</html>'),
        } as Response);
        await expect(GetDemoData()).rejects.toThrow(/web page/);
    });
});

describe('loading the bundled dev stats through the UI', () => {
    test('every row of the demo CSV becomes a solve', () => {
        // The parser must not silently drop rows, e.g. by mis-splitting columns
        // that contain commas inside brackets.
        const rows = rawCsv.trim().split('\n').length - 1;
        const solves = parseCsv(rawCsv, ',');
        expect(solves.length).toBe(rows);
        expect(solves.length).toBe(EXPECTED_SOLVES);
        expect(solves.filter(s => s.time > 0).length).toBeGreaterThan(solves.length - 5);
        expect(solves.filter(s => s.turns > 0).length).toBeGreaterThan(solves.length * 0.9);
        expect(solves.filter(s => !Number.isNaN(s.date.getTime())).length).toBe(solves.length);
    });

    test(
        'the app retains all solves for records, scopes detailed charts, and restores identical data after filter changes',
        async () => {
            mockChartProps.length = 0;
            mockWorkerResults.length = 0;
            render(React.createElement(FileInput));

            await waitFor(() => expect(mockChartProps.length).toBeGreaterThan(0), { timeout: 240_000 });
            fireEvent.click(screen.getByRole('button', { name: 'All charts', exact: true }));

            fireEvent.click(screen.getByLabelText('Open filters'));
            const label = await screen.findByText(`Showing ${EXPECTED_SHOWN} / ${EXPECTED_SOLVES} solves`);
            const [shown, total] = (label.textContent?.match(/\d+/g) ?? []).map(Number);
            expect(total).toBe(EXPECTED_SOLVES);
            expect(shown).toBe(EXPECTED_SHOWN);
            expect(mockWorkerResults.at(-1)!.input.recordSolves).toHaveLength(EXPECTED_SOLVES);

            // The reported failure rendered every chart as a flat line of zeroes,
            // so require each chart to plot real values, not just the set overall.
            expect(mockChartProps.length).toBeGreaterThan(10);
            const flatCharts = mockChartProps
                .map(p => numbersIn(p.data))
                .filter(values => values.length > 0 && values.every(v => v === 0));
            expect(flatCharts).toEqual([]);

            const plotted = mockChartProps.flatMap(p => numbersIn(p.data));
            expect(plotted.length).toBeGreaterThan(0);
            expect(plotted.filter(v => v !== 0).length).toBeGreaterThan(plotted.length * 0.5);

            const snapshot = () => {
                const { input, chartData } = mockWorkerResults[mockWorkerResults.length - 1];
                return {
                    solves: JSON.stringify(input.solves),
                    charts: JSON.stringify(chartData),
                    settings: JSON.stringify({ ...input, solves: [], requestId: 0 }),
                };
            };
            // Capture values, not references: mistake classification mutates source solves.
            const baseline = snapshot();
            const baselineRecords = mockWorkerResults.at(-1)!.chartData.recordRows;
            const changeAndRestore = async (change: () => void | Promise<void>, restore: () => void) => {
                let requests = mockWorkerResults.length;
                await change();
                await waitFor(() => expect(mockWorkerResults.length).toBeGreaterThan(requests));
                expect(snapshot().charts === baseline.charts).toBe(false);
                expect(mockWorkerResults.at(-1)!.chartData.recordRows).toEqual(baselineRecords);
                requests = mockWorkerResults.length;
                restore();
                await waitFor(() => expect(mockWorkerResults.length).toBeGreaterThan(requests));
                const restored = snapshot();
                expect({
                    solves: restored.solves === baseline.solves,
                    charts: restored.charts === baseline.charts,
                    settings: restored.settings === baseline.settings,
                }).toEqual({ solves: true, charts: true, settings: true });
                expect(mockWorkerResults[mockWorkerResults.length - 1].input.solves).toHaveLength(EXPECTED_SHOWN);
            };

            fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Close', exact: true }));
            for (const preset of ['PLL', 'F2L', 'OLL', 'Cross+1']) {
                await changeAndRestore(
                    () => fireEvent.click(screen.getByRole('button', { name: preset, exact: true })),
                    () => fireEvent.click(screen.getByRole('button', { name: 'Full', exact: true }))
                );
            }
            fireEvent.click(screen.getByLabelText('Open filters'));
            (screen.getByText('Cases and solve quality').closest('details') as HTMLDetailsElement).open = true;
            (screen.getByText('Chart settings').closest('details') as HTMLDetailsElement).open = true;
            const cleanliness = within(document.getElementById('filter-SolveCleanliness')!.closest('fieldset')!);
            for (const excluded of ['Mistake', 'Clean']) {
                fireEvent.click(cleanliness.getByText('All items are selected.'));
                await changeAndRestore(
                    () => fireEvent.click(screen.getByRole('option', { name: excluded, exact: true })),
                    () => fireEvent.click(screen.getByRole('option', { name: excluded, exact: true }))
                );
                fireEvent.click(cleanliness.getByText('All items are selected.'));
            }
            const input = (id: string) => screen.getAllByRole('spinbutton').find(field => field.getAttribute('id') === id)!;
            const toggle = (id: string) => screen.getAllByRole('switch').find(field => field.getAttribute('id') === id)!;
            expect((toggle('chopAverages') as HTMLInputElement).checked).toBe(true);
            expect((input('chopPercentage') as HTMLInputElement).value).toBe('5');
            await changeAndRestore(
                () => {
                    fireEvent.click(toggle('chopAverages'));
                    expect((input('chopPercentage') as HTMLInputElement).disabled).toBe(true);
                    expect(mockWorkerResults[mockWorkerResults.length - 1].input.chopPercentage).toBe(0);
                },
                () => fireEvent.click(toggle('chopAverages'))
            );
            await changeAndRestore(
                () => fireEvent.change(input('chopPercentage'), { target: { value: '10' } }),
                () => fireEvent.change(input('chopPercentage'), { target: { value: '5' } })
            );
            await changeAndRestore(
                () => fireEvent.change(input('slowestSolve'), { target: { value: '15' } }),
                () => fireEvent.change(input('slowestSolve'), { target: { value: '300' } })
            );
            await changeAndRestore(
                async () => {
                    fireEvent.change(input('fastestSolve'), { target: { value: '300' } });
                    await waitFor(() => expect(screen.getAllByText(/Showing .* solves/).some(label => label.textContent?.includes('Showing 0 /'))).toBe(true));
                },
                () => fireEvent.change(input('fastestSolve'), { target: { value: '0' } })
            );
            await changeAndRestore(
                () => {
                    fireEvent.click(toggle('autoWindowSize'));
                    fireEvent.change(input('windowSize'), { target: { value: '100' } });
                },
                () => fireEvent.click(toggle('autoWindowSize'))
            );
            await changeAndRestore(
                () => fireEvent.change(input('pointsPerGraph'), { target: { value: '25' } }),
                () => fireEvent.change(input('pointsPerGraph'), { target: { value: '100' } })
            );
            await changeAndRestore(
                () => fireEvent.click(toggle('use4SegmentTiming')),
                () => fireEvent.click(toggle('use4SegmentTiming'))
            );
        },
        300_000
    );
});
