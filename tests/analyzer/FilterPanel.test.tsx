import { describe, expect, test } from '@jest/globals';
import { FilterPanel } from '../../smartcubeanalyzer/src/Components/FilterPanel';
import { CrossColor, MethodName, Solve, StepName } from '../../smartcubeanalyzer/src/Models/Types';

function makeStep(name: StepName, time: number) {
    return { name, time, executionTime: time * 0.7, recognitionTime: time * 0.3, preAufTime: 0, postAufTime: 0, turns: 5, tps: 5 / time, moves: '', case: '' };
}

function makeSolve(stepTimes: number[]): Solve {
    const steps = [
        makeStep(StepName.Cross, stepTimes[0]),
        makeStep(StepName.F2L_1, stepTimes[1]),
        makeStep(StepName.F2L_2, stepTimes[2]),
        makeStep(StepName.F2L_3, stepTimes[3]),
        makeStep(StepName.F2L_4, stepTimes[4]),
        makeStep(StepName.OLL, stepTimes[5]),
        makeStep(StepName.PLL, stepTimes[6]),
    ];
    const totalTime = stepTimes.reduce((a, b) => a + b, 0);
    return {
        id: 'test-id',
        source: 'cubeast',
        time: totalTime,
        date: new Date(),
        crossColor: CrossColor.White,
        scramble: '',
        tps: 5,
        inspectionTime: 0,
        recognitionTime: 0,
        executionTime: totalTime,
        preAufTime: 0,
        postAufTime: 0,
        turns: 35,
        steps,
        isCorrupt: false,
        method: MethodName.CFOP,
        session: '',
        isMistake: false,
        isFullStep: true,
    };
}

describe('FilterPanel.markAllLuckiness', () => {
    const stepTimes = [2, 3, 4, 3, 4, 2, 3];

    test('marks fullstep when every method step has execution time greater than zero', () => {
        const solves = [makeSolve(stepTimes)];
        const marked = FilterPanel.markAllLuckiness(solves);
        expect(marked[0].isFullStep).toBe(true);
    });

    test('marks not fullstep when a step has zero execution but positive total time', () => {
        const solves = [makeSolve(stepTimes)];
        const oll = solves[0].steps[5];
        oll.executionTime = 0;
        oll.recognitionTime = stepTimes[5];
        oll.time = stepTimes[5];

        const marked = FilterPanel.markAllLuckiness(solves);
        expect(marked[0].isFullStep).toBe(false);
    });
});

describe('FilterPanel.compressSolves', () => {
    const stepTimes = [2, 3, 4, 3, 4, 2, 3]; // cross, f2l1-4, oll, pll
    const fullTime = stepTimes.reduce((a, b) => a + b, 0); // 21

    test('with all steps selected, time equals the full solve time', () => {
        const solves = [makeSolve(stepTimes)];
        const allSteps = [StepName.Cross, StepName.F2L_1, StepName.F2L_2, StepName.F2L_3, StepName.F2L_4, StepName.OLL, StepName.PLL];
        const compressed = FilterPanel.compressSolves(solves, allSteps);
        expect(compressed[0].time).toBeCloseTo(fullTime);
    });

    test('recent scope bounds analysis before filters without discarding all-time record data', () => {
        const solves = Array.from({ length: 10005 }, (_, i) => ({
            ...makeSolve([2, 3, 4, 3, 4, 2, 3]), id: String(i),
            date: new Date(Date.UTC(2026, 0, 1, 0, 0, i)), session: i < 5 ? 'Older' : 'Recent',
        })).reverse();
        const panel = new FilterPanel({ solves });
        const state = FilterPanel.getDerivedStateFromProps({ solves }, panel.state);
        expect(state.allSolves).toBe(solves);
        expect(state.filteredSolves).toHaveLength(10000);
        expect(state.filteredSolves[0].id).toBe('5');
        expect(state.filteredSolves.at(-1)!.id).toBe('10004');
        const all = FilterPanel.getDerivedStateFromProps({ solves, solveLimit: 0 }, state);
        expect(all.filteredSolves).toHaveLength(10005);
        expect(all.filteredSolves[0].id).toBe('0');
        const older = FilterPanel.getDerivedStateFromProps({ solves }, {
            ...state, filters: { ...state.filters, sessions: ['Older'] },
        });
        expect(older.filteredSolves).toEqual([]);
        const expanded = FilterPanel.getDerivedStateFromProps({ solves, solveLimit: 0 }, older);
        expect(expanded.filteredSolves.map(solve => solve.id)).toEqual(['0', '1', '2', '3', '4']);
    });

    test('with a single step selected, time equals only that step time', () => {
        const solves = [makeSolve(stepTimes)];
        const compressed = FilterPanel.compressSolves(solves, [StepName.OLL]);
        expect(compressed[0].time).toBeCloseTo(stepTimes[5]); // OLL = 2s, not full 21s
    });

    test('with a subset of steps selected, time equals sum of those step times', () => {
        const solves = [makeSolve(stepTimes)];
        const compressed = FilterPanel.compressSolves(solves, [StepName.OLL, StepName.PLL]);
        const expected = stepTimes[5] + stepTimes[6]; // 2 + 3 = 5
        expect(compressed[0].time).toBeCloseTo(expected);
        expect(compressed[0].time).not.toBeCloseTo(fullTime);
    });

    test('compressed solve has only the selected steps', () => {
        const solves = [makeSolve(stepTimes)];
        const compressed = FilterPanel.compressSolves(solves, [StepName.OLL, StepName.PLL]);
        expect(compressed[0].steps).toHaveLength(2);
        expect(compressed[0].steps[0].name).toBe(StepName.OLL);
        expect(compressed[0].steps[1].name).toBe(StepName.PLL);
    });
});
