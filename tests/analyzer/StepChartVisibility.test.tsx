/**
 * @jest-environment jsdom
 *
 * Charts built from per-step timings are hidden when the data has none.
 *
 * Acubemy records Roux and ZZ solves as a single block: the step names exist but
 * every timing is zero. Rendering the step charts anyway produced a wall of flat
 * zeroes, which reads as a broken site rather than as missing data.
 */
import { beforeAll, describe, expect, jest, test } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';
import React from 'react';

interface ChartMockProps { children?: React.ReactNode }

jest.mock('react-chartjs-2', () => ({
    Line: () => React.createElement('div', { 'data-chart': 'line' }),
    Bar: () => React.createElement('div', { 'data-chart': 'bar' }),
    Doughnut: () => React.createElement('div', { 'data-chart': 'doughnut' }),
}));

jest.mock('../../smartcubeanalyzer/src/Workers/createChartWorker', () => ({
    createChartWorker: () => {
        const { computeAllChartData: compute } = require('../../smartcubeanalyzer/src/Workers/chartWorker') as typeof import('../../smartcubeanalyzer/src/Workers/chartWorker');
        const worker: { onmessage: ((e: MessageEvent) => void) | null; postMessage(input: WorkerInput): void; terminate(): void } = {
            onmessage: null,
            postMessage(input: WorkerInput) {
                const chartData = compute(input);
                worker.onmessage?.(new MessageEvent('message', { data: { requestId: input.requestId, chartData } }));
            },
            terminate() { },
        };
        return worker;
    },
}));

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ChartPanel } from '../../smartcubeanalyzer/src/Components/ChartPanel';
import { FilterPanel } from '../../smartcubeanalyzer/src/Components/FilterPanel';
import { parseCsv } from '../../smartcubeanalyzer/src/Data/CsvParser';
import { Const } from '../../smartcubeanalyzer/src/Models/Constants';
import {
    CrossColor,
    Filters,
    MethodName,
    Solve,
    SolveCleanliness,
    SolveLuckiness,
    StepName,
} from '../../smartcubeanalyzer/src/Models/Types';
import type { WorkerInput } from '../../smartcubeanalyzer/src/Workers/chartWorker';
import { makeSolve, makeStep } from './testUtils';

/** Charts that are built purely from per-step timings. */
const STEP_TIMING_CHARTS = [
    'Average Recognition and Execution',
    'Average Time by Step',
    'Percentage of the Solve Each Step Took',
    'Time Per Step, Compared to Typical Solver',
];

/** A representative chart that needs nothing but the solve total. */
const ALWAYS_PRESENT = 'Average Time';

/** Chart titles render with a trailing tooltip marker. */
function chartTitle(title: string): string {
    return title;
}

function filtersFor(method: MethodName): Filters {
    return {
        sources: ['cubeast', 'acubemy'],
        startDate: new Date('2000-01-01'),
        endDate: new Date('2100-01-01'),
        fastestTime: 0,
        slowestTime: 300,
        crossColors: [
            CrossColor.White, CrossColor.Yellow, CrossColor.Blue,
            CrossColor.Green, CrossColor.Orange, CrossColor.Red, CrossColor.Unknown,
        ],
        pllCases: Const.PllCases.map(x => x.value),
        ollCases: Const.OllCases.map(x => x.value),
        steps: Const.MethodSteps[method],
        solveCleanliness: [SolveCleanliness.Clean, SolveCleanliness.Mistake],
        solveLuckiness: [SolveLuckiness.FullStep, SolveLuckiness.Skip],
        method,
        sessions: [],
        lowestInspection: 0,
        highestInspection: 300,
    };
}

function prepare(file: string, method: MethodName): Solve[] {
    const raw = readFileSync(join(process.cwd(), "smartcubeanalyzer", "public", "demo", file), 'utf8');
    const filters = filtersFor(method);
    const kept = FilterPanel.applyFiltersToSolves(parseCsv(raw, ','), filters, 1_000);
    return FilterPanel.compressSolves(kept, filters.steps);
}

async function renderCharts(solves: Solve[], method: MethodName) {
    render(React.createElement(ChartPanel, {
        solves,
        windowSize: 1_000,
        pointsPerGraph: 100,
        steps: Const.MethodSteps[method],
        goodTime: 15,
        badTime: 20,
        methodName: method,
        useLogScale: false,
        use4SegmentTiming: true,
    } as React.ComponentProps<typeof ChartPanel>));
    await waitFor(() => expect(screen.queryByText(chartTitle(ALWAYS_PRESENT))).not.toBeNull(), { timeout: 60_000 });
    fireEvent.click(screen.getByRole('button', { name: 'All', exact: true }));
}

beforeAll(() => {
    Element.prototype.scrollIntoView ??= () => undefined;
    if (!('ResizeObserver' in globalThis)) {
        Object.assign(globalThis, { ResizeObserver: class { observe() { } unobserve() { } disconnect() { } } });
    }
    if (!('CSS' in globalThis)) Object.assign(globalThis, { CSS: { supports: () => false, escape: (value: string) => value } });
    if (!('matchMedia' in globalThis)) {
        Object.assign(globalThis, {
            matchMedia: () => ({ matches: false, addListener() { }, removeListener() { }, addEventListener() { }, removeEventListener() { } }),
        });
    }
});

describe('an Acubemy export viewed as Roux, which has no step timings', () => {
    let solves: Solve[];

    beforeAll(() => { solves = prepare('acubemy.csv', MethodName.Roux); });

    test('the data really does lack step timings but still has solve totals', () => {
        expect(solves.length).toBeGreaterThan(0);
        expect(solves.some(s => s.steps.some(step => step.time > 0))).toBe(false);
        expect(solves.every(s => s.time > 0)).toBe(true);
    });

    test('every step-timing chart is hidden', async () => {
        await renderCharts(solves, MethodName.Roux);
        for (const title of STEP_TIMING_CHARTS) {
            expect(screen.queryByText(chartTitle(title))).toBeNull();
        }
    }, 120_000);

    test('charts that only need the solve total are still shown', async () => {
        await renderCharts(solves, MethodName.Roux);
        for (const title of ['Average Time', 'Average Turns Per Second', 'Current Records']) {
            expect(screen.queryByText(chartTitle(title))).not.toBeNull();
        }
    }, 120_000);
});

describe('a Cubeast export that does have step timings', () => {
    test.each([StepName.F2L_1, StepName.OLL, StepName.PLL])('%s practice Failed selects only classified failures, Total selects every matching solve', async step => {
        const caseName = step === StepName.PLL ? 'T' : '1';
        const instance = (id: string, time: number, moves: string) => makeSolve({ id, steps: [makeStep(step, time, { case: caseName, moves })] });
        const simple = "R U R'", complex = "R U R' F U F' R U R'";
        const matches = [
            instance('normal-a', 1, simple), instance('normal-b', 1, simple),
            instance('slow-but-few-moves', 5, simple), instance('extra-moves-but-fast', 0.5, complex),
            instance('failed', 10, complex),
        ];
        if (step === StepName.F2L_1) matches[4].steps.push(
            makeStep(StepName.F2L_2, 1, { case: caseName, moves: simple }),
            makeStep(StepName.F2L_3, 10, { case: caseName, moves: complex }));
        const solves = [instance('outside-window', 100, complex), ...matches, { ...instance('dnf', 100, complex), dnf: true }];
        const select = jest.spyOn(ChartPanel.prototype, 'selectSolves').mockImplementation(() => {});
        const bounds = jest.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
            return { x: 0, y: 0, top: 0, left: 0, right: 1200, bottom: 600, width: this.getAttribute('role') === 'grid' ? 1200 : 100, height: 600, toJSON: () => ({}) };
        });
        try {
            render(<ChartPanel solves={solves} steps={step === StepName.F2L_1 ? [StepName.F2L_1, StepName.F2L_2, StepName.F2L_3] : [step]}
                methodName={MethodName.CFOP} windowSize={5} pointsPerGraph={20} goodTime={15} badTime={20} useLogScale={false} use4SegmentTiming />);
            await screen.findByText('Average Time');
            fireEvent.click(screen.getByRole('button', { name: 'Cases', exact: true }));
            const practice = screen.getByRole('region', { name: 'Algorithm Practice', exact: true });
            const row = within(practice).getAllByRole('row')[1];
            const cells = within(row).getAllByRole('gridcell');
            expect(cells[3].textContent).toBe(step === StepName.F2L_1 ? '2' : '1');
            fireEvent.click(cells[3]);
            expect(select.mock.calls.at(-1)![0].map(solve => solve.id)).toEqual(['failed']);
            expect(select.mock.calls.at(-1)![2]).toContain('Failed');
            fireEvent.click(cells[4]);
            expect(select.mock.calls.at(-1)![0].map(solve => solve.id)).toEqual(matches.map(solve => solve.id));
            expect(select.mock.calls.at(-1)![2]).not.toContain('Failed');
            fireEvent.click(cells[1]);
            expect(select.mock.calls.at(-1)![0]).toEqual(matches);
        } finally { select.mockRestore(); bounds.mockRestore(); }
    });
    let solves: Solve[];

    beforeAll(() => { solves = prepare('cfop-small.csv', MethodName.CFOP); });

    test('the data has step timings', () => {
        expect(solves.some(s => s.steps.some(step => step.time > 0))).toBe(true);
    });

    test('selected views persist through chart updates and reset only when their step requirements no longer apply', async () => {
        const solves = prepare('cfop-small.csv', MethodName.CFOP).slice(-12);
        const props = { solves, steps: [StepName.OLL], methodName: MethodName.CFOP,
            windowSize: 100, pointsPerGraph: 20, goodTime: 15, badTime: 20, useLogScale: false, use4SegmentTiming: true };
        const view = render(<ChartPanel {...props} />);
        await screen.findByText('Average Time');
        const cases = screen.getByRole('button', { name: 'Cases', exact: true });
        fireEvent.click(cases);
        expect(screen.getByRole('button', { name: 'Cases', exact: true }).getAttribute('aria-pressed')).toBe('true');
        expect(cases.className).toContain('btn-primary');
        view.rerender(<ChartPanel {...props} solves={[...solves]} windowSize={120} />);
        expect(cases.getAttribute('aria-pressed')).toBe('true');
        view.rerender(<ChartPanel {...props} steps={Const.MethodSteps[MethodName.CFOP]} />);
        expect(screen.getByRole('button', { name: 'Overview', exact: true }).getAttribute('aria-pressed')).toBe('true');
        expect(screen.getByRole('button', { name: 'Cases', exact: true }).getAttribute('aria-pressed')).toBe('false');
        fireEvent.click(screen.getByRole('button', { name: 'Progress', exact: true }));
        view.rerender(<ChartPanel {...props} steps={Const.MethodSteps[MethodName.CFOP]} useLogScale />);
        expect(screen.getByRole('button', { name: 'Progress', exact: true }).getAttribute('aria-pressed')).toBe('true');
    });

    test('the step charts are still shown', async () => {
        // The guard must only fire for data that genuinely has nothing to plot.
        await renderCharts(solves, MethodName.CFOP);
        for (const title of STEP_TIMING_CHARTS) {
            expect(screen.queryByText(chartTitle(title))).not.toBeNull();
        }
    }, 120_000);
});
