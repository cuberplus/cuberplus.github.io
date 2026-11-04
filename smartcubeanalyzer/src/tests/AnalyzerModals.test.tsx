/** @jest-environment jsdom */
import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { ActiveElement } from 'chart.js';
import { ChartPanel } from '../Components/ChartPanel';
import { AverageModal } from '../Components/AverageModal';
import { ChartPanelProps, CrossColor, MethodName, Solve, StepName } from '../Helpers/Types';
import { Const } from '../Helpers/Constants';
import { splitIntoChunks } from '../Helpers/MathHelpers';
import { computeAllChartData } from '../Workers/chartWorker';
import { makeSolves } from './testUtils';

beforeEach(() => {
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function (this: HTMLDialogElement) { this.open = true; } });
    Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: function (this: HTMLDialogElement) { this.open = false; } });
});
afterEach(() => { cleanup(); jest.restoreAllMocks(); });

function panel(overrides: Partial<ChartPanelProps> = {}) {
    const props: ChartPanelProps = {
        solves: makeSolves(40), windowSize: 5, pointsPerGraph: 3,
        steps: Const.MethodSteps[MethodName.CFOP], methodName: MethodName.CFOP,
        badTime: 30, goodTime: 10, useLogScale: false, use4SegmentTiming: false, ...overrides,
    };
    const instance = new ChartPanel(props);
    instance.state = { chartData: computeAllChartData({ ...props, requestId: 1, isDark: false, chopPercentage: props.chopAverages === false ? 0 : props.chopPercentage ?? 5 }), isComputing: false };
    jest.spyOn(instance, 'setState').mockImplementation(update => {
        if (update && typeof update !== 'function') instance.state = { ...instance.state, ...update };
    });
    return instance;
}

function point(index: number, datasetIndex = 0): ActiveElement {
    return { index, datasetIndex } as ActiveElement;
}

describe('Analyzer inline drill-down', () => {
    test('a local Timer row selects inline replay without opening or encoding a URL', () => {
        const instance = panel();
        const open = jest.spyOn(window, 'open').mockReturnValue(null);
        instance.openSolveSource({ source: 'timer', id: 'local/id?x=1' });
        expect(instance.state.replayId).toBe('local/id?x=1');
        expect(open).not.toHaveBeenCalled();
    });

    test('a sampled average selects the ending solve label, not the sampled array index', () => {
        const instance = panel();
        const data = instance.state.chartData!.runningAverage;
        const index = data.labels!.length - 1;
        const end = Number(data.labels![index]);
        expect(end).toBeGreaterThan(index + instance.props.windowSize);
        instance.openAverage('runningAverage', point(index));
        expect(instance.state.average!.solves).toEqual(instance.props.solves.slice(end - 5, end));
        render(<AverageModal {...instance.state.average!} close={() => undefined} view={() => undefined} />);
        expect(screen.getByRole('heading', { name: `Ao5: ${Number(data.datasets[0].data[index]).toFixed(3)}s` })).not.toBeNull();
    });

    test('running solve-time windows keep DNFs and honor disabled trimming', () => {
        const solves = makeSolves(10);
        solves[7] = { ...solves[7], dnf: true };
        const instance = panel({ solves, chopAverages: false });
        const data = instance.state.chartData!.runningAverage;
        const index = data.labels!.indexOf('10');
        instance.openAverage('runningAverage', point(index));
        // DNF gaps themselves are not clickable.
        expect(instance.state.average).toBeUndefined();
        const trimmed = panel({ solves });
        const trimmedIndex = trimmed.state.chartData!.runningAverage.labels!.indexOf('10');
        trimmed.openAverage('runningAverage', point(trimmedIndex));
        expect(trimmed.state.average!.solves).toEqual(solves.slice(5));
        expect(trimmed.state.average!.solves.some(solve => solve.dnf)).toBe(true);
    });

    test('an average ending at solve 73 displays real solve numbers 69 through 73', () => {
        const instance = panel({ solves: makeSolves(80), pointsPerGraph: 100 });
        const index = instance.state.chartData!.runningAverage.labels!.indexOf('73');
        instance.openAverage('runningAverage', point(index));
        render(<AverageModal {...instance.state.average!} close={() => undefined} view={() => undefined} />);
        expect(within(screen.getByRole('table')).getAllByRole('rowheader').map(cell => cell.textContent)).toEqual(['69', '70', '71', '72', '73']);
    });

    test('rolling metrics resolve original solve numbers after DNF filtering', () => {
        const solves = makeSolves(15).map((solve, i) => ({ ...solve, dnf: i === 9 || i === 12 }));
        const instance = panel({ solves });
        const labels = instance.state.chartData!.runningTps.labels!;
        const index = labels.length - 1, end = Number(labels[index]);
        instance.openAverage('runningTps', point(index));
        expect(instance.state.average!.solves).toEqual(solves.slice(0, end).filter(solve => !solve.dnf).slice(-5));
        expect(instance.state.average!.numbers).toEqual([9, 11, 12, 14, 15]);
    });

    test('inspection averages use only non-DNF solves with recorded inspection', () => {
        const solves = makeSolves(30).map((solve, i) => ({ ...solve, dnf: i === 24, inspectionTime: i % 3 ? i : null }));
        const instance = panel({ solves });
        const labels = instance.state.chartData!.runningInspection!.labels!;
        const index = labels.length - 1, end = Number(labels[index]);
        instance.openAverage('runningInspection', point(index));
        expect(instance.state.average!.solves).toEqual(solves.slice(0, end).filter(solve => !solve.dnf && solve.inspectionTime != null).slice(-5));
        instance.openAverage('inspection', point(1));
        const expected = splitIntoChunks(solves.filter(solve => !solve.dnf && solve.inspectionTime != null).slice(-5).sort((a, b) => a.inspectionTime! - b.inspectionTime!), Const.InspectionGraphChunks)[1];
        expect(instance.state.average!.solves).toEqual(expected);
    });

    test('record averages use exact point metadata despite duplicate dates and always trim 5%', () => {
        const date = new Date('2026-01-01');
        const solves = makeSolves(15).map((solve, i) => ({ ...solve, date, time: 30 - i }));
        const instance = panel({ solves, chopAverages: false });
        const data = instance.state.chartData!.recordHistory.datasets[1].data;
        expect(data.length).toBeGreaterThan(1);
        instance.openAverage('recordHistory', point(data.length - 1, 1));
        expect(instance.state.average!.solves).toEqual(solves.slice(-5));
        expect(instance.state.average!.numbers).toEqual([11, 12, 13, 14, 15]);
        expect(instance.state.average!.percentage).toBe(5);
    });

    test('case averages restrict the recent window to the selected case', () => {
        const solves = makeSolves(40).map((solve, i) => ({ ...solve, steps: solve.steps.map(step => step.name === StepName.OLL ? { ...step, case: i % 2 ? '21' : '22' } : step) }));
        const instance = panel({ solves, steps: [StepName.OLL], windowSize: 30 });
        const data = instance.state.chartData!.caseData!;
        if (!data.labels!.length) throw new Error('Expected OLL cases in fixture');
        instance.openAverage('caseData', point(0));
        expect(instance.state.average!.solves.every(solve => solve.steps.find(step => step.name === StepName.OLL)?.case === data.labels![0])).toBe(true);
    });

    test('empty chart clicks and synthetic reference averages do not open misleading averages', () => {
        const instance = panel();
        instance.openAverage('runningAverage');
        instance.openAverage('typicalCompare', point(0, 1));
        expect(instance.state.average).toBeUndefined();
    });

    test('a histogram bin selects the exact recent valid window and preserves original identities through sorting and View', () => {
        const solves = makeSolves(9).map((solve, i) => ({ ...solve, source: 'timer' as const, time: [12.1, 15, 12, 12.999, 13, 12.5, 11.999, 12.8, 12.3][i], dnf: i === 8 }));
        const instance = panel({ solves, windowSize: 5 });
        const data = instance.state.chartData!.histogram, index = data.labels!.indexOf(12);
        instance.openAverage('histogram', point(index));
        expect(instance.state.average!.numbers).toEqual([4, 6, 8]);
        expect(instance.state.average!.solves).toEqual([solves[3], solves[5], solves[7]]);
        expect(instance.state.average!.percentage).toBe(0);
        expect(instance.state.average!.solves.length).toBe(data.datasets[0].data[index]);
        render(<AverageModal {...instance.state.average!} close={() => undefined} view={solve => instance.openSolveSource(solve)} />);
        expect(screen.getByRole('heading', { name: '12s to <13s (3 solves)' })).not.toBeNull();
        expect(screen.queryAllByTitle(/^Excluded /)).toHaveLength(0);
        fireEvent.click(screen.getByRole('button', { name: 'Time', exact: true }));
        expect(within(screen.getByRole('table')).getAllByRole('rowheader').map(cell => cell.textContent)).toEqual(['6', '8', '4']);
        fireEvent.click(screen.getByRole('button', { name: 'View solve 8' }));
        expect(instance.state.replayId).toBe(solves[7].id);
    });

    test('daily bests and single records replay the exact solve despite tied times, duplicate dates and DNFs', () => {
        const solves = makeSolves(6).map((solve, i) => ({ ...solve, source: 'timer' as const, date: new Date(2026, 0, i < 4 ? 1 : 2, 12), time: [2, 1, 1, 0, 0, 4][i], dnf: i === 3 }));
        const instance = panel({ solves });
        const open = jest.spyOn(window, 'open').mockReturnValue(null);
        instance.openAverage('dailyRecord', point(0));
        expect(instance.state.replayId).toBe(solves[1].id);
        instance.openAverage('dailyRecord', point(1));
        expect(instance.state.replayId).toBe(solves[4].id);
        instance.openAverage('recordHistory', point(1, 0));
        expect(instance.state.replayId).toBe(solves[1].id);
        expect(open).not.toHaveBeenCalled();
        expect(instance.state.average).toBeUndefined();
    });

    test('percentage points list only their contributing category in the sampled window', () => {
        const solves = makeSolves(12).map((solve, i) => ({ ...solve, time: i + 1, crossColor: i % 2 ? CrossColor.White : CrossColor.Blue }));
        const instance = panel({ solves, goodTime: 10, badTime: 11 });
        const data = instance.state.chartData!.runningColorPercentages, index = data.labels!.length - 1;
        instance.openAverage('runningColorPercentages', point(index));
        expect(instance.state.average!.numbers).toEqual([8, 10, 12]);
        instance.openAverage('goodBad', point(index));
        expect(instance.state.average!.numbers).toEqual([8, 9]);
        instance.openAverage('goodBad', point(index, 1));
        expect(instance.state.average!.numbers).toEqual([12]);
    });
});

describe('chopped average modal', () => {
    function show(times: number[], percentage = 5, dnfIndices: number[] = []) {
        const solves = makeSolves(times.length).map((solve, i) => ({ ...solve, time: times[i], dnf: dnfIndices.includes(i) }));
        const close = jest.fn(), view = jest.fn<(solve: Solve) => void>();
        render(<AverageModal solves={solves} numbers={solves.map((_, i) => i + 69)} percentage={percentage} close={close} view={view} />);
        return { solves, close, view };
    }

    test('keeps chronological order and marks exactly the excluded best and worst, including a DNF', () => {
        const { solves, close, view } = show([4, 1, 9, 3, 5], 5, [2]);
        expect(screen.getByRole('heading', { name: 'Ao5: 4.000s' })).not.toBeNull();
        expect(screen.queryByText(/chopped solve-time|sorted by|excludes the|times reflect/i)).toBeNull();
        const table = screen.getByRole('table', { name: 'Average solves' });
        const rows = within(table).getAllByRole('row').slice(1);
        expect(rows.map(row => within(row).getAllByRole('cell')[0].textContent)).toEqual(['4.000s', '(1.000s)', '(DNF)', '3.000s', '5.000s']);
        expect(within(table).getAllByRole('rowheader').map(cell => cell.textContent)).toEqual(['69', '70', '71', '72', '73']);
        expect(within(table).getByTitle('Excluded best').tagName).toBe('SPAN');
        expect(within(table).getByTitle('Excluded best').className).toBe('average-trimmed-best');
        expect(within(table).getByTitle('Excluded worst').className).toBe('average-trimmed-worst');
        expect(within(table).getByTitle('Excluded worst').textContent).toBe('(DNF)');
        fireEvent.click(screen.getByRole('button', { name: 'View average solve 72' }));
        expect(view).toHaveBeenCalledWith(solves[3]);
        fireEvent.click(screen.getByRole('button', { name: 'Close average' }));
        expect(close).toHaveBeenCalledTimes(1);
    });

    test('shared columns sort numerically without renumbering solves, moving trim assignments or changing View targets', () => {
        const solves = makeSolves(5).map((solve, i) => ({
            ...solve, time: [4, 1, 9, 3, 5][i], turns: [2, 11, 30, 5, 1][i], tps: [12, 2, NaN, 5, 10][i],
        }));
        const view = jest.fn<(solve: Solve) => void>(), close = jest.fn();
        render(<AverageModal solves={solves} numbers={[69, 70, 71, 72, 73]} percentage={5} view={view} close={close} />);
        const table = screen.getByRole('table');
        const numbers = () => within(table).getAllByRole('rowheader').map(cell => Number(cell.textContent));
        const sort = (name: string) => fireEvent.click(within(table).getByRole('button', { name, exact: true }));
        sort('Turns');
        expect(numbers()).toEqual([73, 69, 72, 70, 71]);
        expect(within(table).getByRole('columnheader', { name: 'Turns' }).getAttribute('aria-sort')).toBe('ascending');
        sort('Turns');
        expect(numbers()).toEqual([71, 70, 72, 69, 73]);
        sort('TPS');
        expect(numbers()).toEqual([70, 72, 73, 69, 71]);
        sort('TPS');
        expect(numbers()).toEqual([69, 73, 72, 70, 71]);
        sort('Time');
        expect(numbers()).toEqual([70, 72, 69, 73, 71]);
        expect(within(table).getByTitle('Excluded best').textContent).toBe('(1.000s)');
        expect(within(table).getByTitle('Excluded worst').textContent).toBe('(9.000s)');
        sort('Time');
        expect(numbers()).toEqual([71, 73, 69, 72, 70]);
        sort('View');
        expect(numbers()).toEqual([69, 70, 71, 72, 73]);
        sort('View');
        expect(numbers()).toEqual([73, 72, 71, 70, 69]);
        fireEvent.click(within(table).getByRole('button', { name: 'View average solve 70' }));
        expect(view).toHaveBeenCalledWith(solves[1]);
        sort('Solve');
        expect(numbers()).toEqual([69, 70, 71, 72, 73]);
        sort('Solve');
        expect(numbers()).toEqual([73, 72, 71, 70, 69]);
        fireEvent(screen.getByRole('dialog'), new Event('cancel', { bubbles: true, cancelable: true }));
        expect(close).toHaveBeenCalledTimes(1);
    });

    test('untrimmed DNF averages stay DNF and do not strike out rows', () => {
        show([1, 2, 3, 4, 5], 0, [4]);
        expect(screen.getByRole('heading', { name: 'Ao5: DNF' })).not.toBeNull();
        expect(screen.queryAllByTitle(/^Excluded /)).toHaveLength(0);
    });

    test('custom trimming rounds up and caps trimming to retain at least one solve', () => {
        show([5, 5, 5], 49);
        expect(screen.getByRole('heading', { name: 'Ao3: 5.000s' })).not.toBeNull();
        expect(screen.getAllByTitle(/^Excluded /)).toHaveLength(2);
        expect(screen.getByRole('table').textContent).toContain('(5.000s)');
    });

    test('a custom 20% chop rounds up each end', () => {
        show([1, 2, 3, 4, 5, 6], 20);
        expect(screen.getByRole('heading', { name: 'Ao6: 3.500s' })).not.toBeNull();
        expect(screen.getAllByTitle(/^Excluded /)).toHaveLength(4);
    });
});
