/** @jest-environment jsdom */
import { describe, expect, test } from '@jest/globals';
import { FilterPanel } from '../../smartcubeanalyzer/src/Components/FilterPanel';
import { CrossColor, FilterPanelProps, FilterPanelState, Filters, MethodName, Option, StepName } from '../../smartcubeanalyzer/src/Models/Types';

/**
 * Characterization tests for FilterPanel's state handlers. The panel's pure
 * logic is covered elsewhere; these pin the setState behaviour so the handlers
 * can be collapsed into generic helpers without changing what the UI does.
 */

type StateUpdate = Partial<FilterPanelState> | ((prev: FilterPanelState) => Partial<FilterPanelState>);

/** A real panel with React's async setState swapped for a synchronous one, so handlers run without a DOM. */
function newPanel(props: FilterPanelProps = { solves: [] }): FilterPanel {
    const panel = new FilterPanel(props);
    const setState = (update: StateUpdate) => {
        const patch = typeof update === 'function' ? update(panel.state) : update;
        Object.assign(panel, { state: { ...panel.state, ...patch } });
    };
    Object.assign(panel, { setState });
    return panel;
}

const initialFilters = () => newPanel().state.filters;

/** Runs a handler against a fake component and returns the resulting state. */
function runHandler(handler: (panel: FilterPanel) => void, seed: Partial<FilterPanelState> = {}): FilterPanelState {
    const panel = newPanel();
    Object.assign(panel, { state: { ...panel.state, ...seed } });
    handler(panel);
    return panel.state;
}

const opts = <T extends string>(...values: T[]): Option<T>[] => values.map(v => ({ label: v, value: v }));

describe('FilterPanel multi-select handlers', () => {
    test('only an explicit session filter overrides the sitewide scope; reset restores it', () => {
        const panel = newPanel({ solves: [], sessionScope: 'Practice' });
        panel.setMulti('sessions', opts('Other'));
        expect(panel.state.sessionOverride).toBe(true);
        panel.setMulti('sources', opts('timer'));
        expect(panel.state.sessionOverride).toBe(true);
        panel.resetFilters();
        expect(panel.state.sessionOverride).toBe(false);
        expect(panel.state.filters.sessions).toEqual(['Practice']);
    });
    type MultiKey = Parameters<FilterPanel['setMulti']>[0];
    const cases: Array<[string, MultiKey, string[]]> = [
        ['cross colors', 'crossColors', [CrossColor.White, CrossColor.Red]],
        ['sessions', 'sessions', ['morning', 'evening']],
        ['sources', 'sources', ['cubeast']],
        ['PLL cases', 'pllCases', ['Aa', 'Ab']],
        ['OLL cases', 'ollCases', ['OLL 1']],
        ['cleanliness', 'solveCleanliness', ['Clean']],
        ['luckiness', 'solveLuckiness', ['Fullstep']],
    ];

    test.each(cases)('%s writes values once and reconstructs the selected options', (_name, filterKey, values) => {
        const list = opts(...values);
        const panel = newPanel();
        panel.setMulti(filterKey, list);
        expect(panel.state.filters[filterKey]).toEqual(values);
        expect(panel.selectedOptions(filterKey, [...list].reverse())).toEqual(list);
        expect(panel.selectedOptions(filterKey, [])).toEqual(list);
    });

    test.each(cases)('%s leaves the other filters untouched', (_name, filterKey) => {
        const before = initialFilters();
        const state = runHandler(p => p.setMulti(filterKey, opts('x')));
        for (const key of Object.keys(before) as (keyof Filters)[]) {
            if (key !== filterKey) expect(state.filters[key]).toEqual(before[key]);
        }
    });

    test.each(cases)('%s clears the filter when nothing is selected', (_name, filterKey) => {
        const state = runHandler(p => p.setMulti(filterKey, []));
        expect(state.filters[filterKey]).toEqual([]);
    });
});

describe('FilterPanel numeric handlers', () => {
    const evt = (value: string) => ({ target: { value } }) as React.ChangeEvent<HTMLInputElement>;

    test('chopping defaults on at five percent and clamps custom percentages', () => {
        expect(newPanel().state.chopAverages).toBe(true);
        expect(newPanel().state.chopPercentage).toBe(5);
        expect(runHandler(p => p.setNumberField('chopPercentage', evt('10'))).chopPercentage).toBe(10);
        expect(runHandler(p => p.setNumberField('chopPercentage', evt('-1'))).chopPercentage).toBe(0);
        expect(runHandler(p => p.setNumberField('chopPercentage', evt('100'))).chopPercentage).toBe(49);
        expect(runHandler(p => p.setNumberField('chopPercentage', evt(''))).chopPercentage).toBe(0);
    });

    const filterCases: Array<[string, (p: FilterPanel, e: React.ChangeEvent<HTMLInputElement>) => void, keyof Filters]> = [
        ['slowest solve', (p, e) => p.setNumberFilter('slowestTime', e), 'slowestTime'],
        ['fastest solve', (p, e) => p.setNumberFilter('fastestTime', e), 'fastestTime'],
        ['lowest inspection', (p, e) => p.setNumberFilter('lowestInspection', e), 'lowestInspection'],
        ['highest inspection', (p, e) => p.setNumberFilter('highestInspection', e), 'highestInspection'],
    ];

    test.each(filterCases)('%s parses the input into filters', (_n, call, key) => {
        expect(runHandler(p => call(p, evt('42'))).filters[key]).toBe(42);
    });

    test.each(filterCases)('%s parses a partial number the same way parseInt does', (_n, call, key) => {
        expect(runHandler(p => call(p, evt('12abc'))).filters[key]).toBe(12);
        expect(runHandler(p => call(p, evt(''))).filters[key]).toBeNaN();
    });

    const stateCases: Array<[string, (p: FilterPanel, e: React.ChangeEvent<HTMLInputElement>) => void, keyof FilterPanelState]> = [
        ['bad time', (p, e) => p.setNumberField('badTime', e), 'badTime'],
        ['good time', (p, e) => p.setNumberField('goodTime', e), 'goodTime'],
        ['points per graph', (p, e) => p.setNumberField('pointsPerGraph', e), 'pointsPerGraph'],
    ];

    test.each(stateCases)('%s parses the input into top level state', (_n, call, key) => {
        expect(runHandler(p => call(p, evt('7')))[key]).toBe(7);
    });

    test('window size is clamped to a minimum of five', () => {
        expect(runHandler(p => p.setNumberField('windowSize', evt('100'))).windowSize).toBe(100);
        expect(runHandler(p => p.setNumberField('windowSize', evt('1'))).windowSize).toBe(5);
        expect(runHandler(p => p.setNumberField('windowSize', evt(''))).windowSize).toBe(5);
    });
});

describe('FilterPanel date and toggle handlers', () => {
    test('start and end dates write through to filters', () => {
        const start = new Date('2024-02-03T00:00:00Z');
        const end = new Date('2024-05-06T00:00:00Z');
        expect(runHandler(p => p.setFilter('startDate', start)).filters.startDate).toBe(start);
        expect(runHandler(p => p.setFilter('endDate', end)).filters.endDate).toBe(end);
    });

    const toggles: Array<[string, (p: FilterPanel, v: boolean) => void, keyof FilterPanelState]> = [
        ['log scale', (p, v) => p.setField('useLogScale', v), 'useLogScale'],
        ['4 segment timing', (p, v) => p.setField('use4SegmentTiming', v), 'use4SegmentTiming'],
    ];

    test.each(toggles)('%s toggles both ways', (_n, call, key) => {
        expect(runHandler(p => call(p, true))[key]).toBe(true);
        expect(runHandler(p => call(p, false))[key]).toBe(false);
    });

    test('showing and hiding the filter drawer flips one flag', () => {
        expect(runHandler(p => p.showFilters()).showFilters).toBe(true);
        expect(runHandler(p => p.hideFilters(), { showFilters: true }).showFilters).toBe(false);
    });

    test('selecting a tab stores the key', () => {
        expect(runHandler(p => p.tabSelect(3)).tabKey).toBe(3);
    });
});

describe('FilterPanel option builders and step selection', () => {
    test('method options cover every method', () => {
        expect(newPanel().getMethodOptions()).toEqual(Object.values(MethodName).map(m => ({ label: m, value: m })));
    });

    test('step options match the steps of the method', () => {
        const options = FilterPanel.getStepOptionsForMethod(MethodName.CFOP);
        expect(options.length).toBeGreaterThan(0);
        expect(options.every(o => o.label === o.value)).toBe(true);
        expect(options.map(o => o.value)).toContain(StepName.PLL);
    });

    test('chosen steps are re-sorted into method order', () => {
        const scrambled = opts(StepName.PLL, StepName.Cross, StepName.OLL);
        const state = runHandler(p => p.chosenStepsChanged(scrambled));
        expect(state.filters.steps).toEqual([StepName.Cross, StepName.OLL, StepName.PLL]);
        expect(state.chosenSteps).toEqual(scrambled);
    });

    test('a steps preset replaces both the filter and the chosen options', () => {
        const state = runHandler(p => p.applyStepsPreset([StepName.OLL, StepName.PLL]));
        expect(state.filters.steps).toEqual([StepName.OLL, StepName.PLL]);
        expect(state.chosenSteps).toEqual(opts(StepName.OLL, StepName.PLL));
    });

    test('changing method resets steps to that method and notifies the parent', () => {
        let notified: MethodName | undefined;
        const panel = newPanel({ solves: [], onMethodChange: (m: MethodName) => { notified = m; } });
        panel.methodChanged({ label: MethodName.CFOP, value: MethodName.CFOP });
        expect(panel.state.filters.method).toBe(MethodName.CFOP);
        expect(panel.state.filters.steps.length).toBeGreaterThan(0);
        expect(notified).toBe(MethodName.CFOP);
    });
});
