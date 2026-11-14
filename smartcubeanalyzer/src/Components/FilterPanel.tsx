import React from "react";
import { createPortal } from "react-dom";
import moment from "moment";
import DatePicker from "react-datepicker";
import Select from "react-select";
import { MultiSelect } from "react-multi-select-component";
import { CrossColor, FilterPanelProps, FilterPanelState, Filters, getStep, KeysOfType, MethodName, Option, OptionGroup, Solve, SolveCleanliness, SolveLuckiness, Step, StepName } from "../Models/Types";
import { ChartPanel } from "./ChartPanel";
import { GroupedMultiSelect } from "./GroupedMultiSelect";
import { getMistakeMap, markMistakes } from "../Analysis/MistakeAnalysis";
import { DebouncedNumber } from '../../../shared/Components/DebouncedNumber';
import { FormControl, Row, Offcanvas, Col, Button, Container, Spinner } from 'react-bootstrap';
import { InfoTip } from '../../../shared/Components/InfoTip';
import { Const } from "../Models/Constants";
import { CalculateAllSessionOptions, CalculateBenchmarkTimes, CalculateWindowSize, sumStepTotals } from "../Helpers/CubeHelpers";
import ReactSwitch from "react-switch";
import { PageVisible } from '@cuberplus/navigation';
import { DEFAULT_SOLVE_LIMIT, latestSolves } from '../../../shared/Components/SolveLimit';

/** react-bootstrap's FormControl accepts input, select and textarea events, so borrow its own handler type. */
type FormControlChangeHandler = NonNullable<React.ComponentProps<typeof FormControl>['onChange']>;
type MultiFilterKey = KeysOfType<Filters, string[]>;

function defaultDateRange(): Pick<Filters, 'startDate' | 'endDate'> {
    return {
        startDate: moment().subtract(5, 'years').startOf('day').toDate(),
        endDate: moment().endOf('day').toDate(),
    };
}

function datePickerFormat(): string {
    return typeof navigator !== 'undefined' && /^en-US$/i.test(navigator.language ?? '') ? 'MM/dd/yyyy' : 'dd/MM/yyyy';
}

function DebouncedDate({ value, onChange, id, container }: { value: Date; onChange: (date: Date) => void; id: string; container: HTMLElement }) {
    const pending = React.useRef<ReturnType<typeof setTimeout>>();
    React.useEffect(() => {
        clearTimeout(pending.current);
        return () => clearTimeout(pending.current);
    }, [value]);
    return <DatePicker id={id} ariaLabelledBy={`filter-${id}`} selected={value} dateFormat={datePickerFormat()}
        onChangeRaw={() => clearTimeout(pending.current)}
        onChange={date => {
            clearTimeout(pending.current);
            if (date) pending.current = setTimeout(() => onChange(date), 450);
        }}
        popperContainer={({ children }) => createPortal(children, container)}
        popperProps={{ strategy: "fixed" }} />;
}

const COLOR_OPTIONS: Option<CrossColor>[] =
    [CrossColor.White, CrossColor.Yellow, CrossColor.Red, CrossColor.Orange, CrossColor.Blue, CrossColor.Green, CrossColor.Unknown]
        .map(x => ({ label: x, value: x }));

const SOURCE_OPTIONS: Option<Solve['source']>[] = [{ label: 'CuberPlus', value: 'timer' }, { label: 'Cubeast', value: 'cubeast' }, { label: 'Acubemy', value: 'acubemy' }];
const filterId = (title: string) => `filter-${title.replace(/\W/g, '')}`;

/** Everything the filter UI starts from, shared by the initial state and the Reset button. */
function defaultSelections(method: MethodName, sessions: Option[], bench: { goodTime: number, badTime: number }) {
    return {
        filters: {
            sources: SOURCE_OPTIONS.map(x => x.value),
            ...defaultDateRange(),
            fastestTime: 0,
            slowestTime: 300,
            crossColors: COLOR_OPTIONS.map(x => x.value),
            pllCases: Const.PllCases.map(x => x.value),
            ollCases: Const.OllCases.map(x => x.value),
            steps: Const.MethodSteps[method],
            solveCleanliness: Const.solveCleanliness.map(x => x.value),
            solveLuckiness: Const.solveLuckiness.map(x => x.value),
            method,
            sessions: sessions.map(x => x.value),
            lowestInspection: 0,
            highestInspection: 300,
        },
        chosenSteps: FilterPanel.getStepOptionsForMethod(method),
        autoWindowSize: true,
        autoBenchmarks: true,
        ...bench,
        useLogScale: false,
        use4SegmentTiming: false,
        chopAverages: true,
        chopPercentage: 5,
    };
}

export class FilterPanel extends React.Component<FilterPanelProps, FilterPanelState> {
    static contextType = PageVisible;
    filterRevision = 0;
    state: FilterPanelState = {
        allSolves: [], recordSolves: [],
        filteredSolves: [],
        compressedSolves: [],
        lastAppliedSolves: [],
        lastAppliedFilters: null,
        lastAppliedWindowSize: Const.DefaultWindowSize,
        lastAppliedSolveLimit: DEFAULT_SOLVE_LIMIT,
        ...defaultSelections(MethodName.CFOP, [], { goodTime: 15, badTime: 20 }),
        tabKey: 1,
        windowSize: Const.DefaultWindowSize,
        pointsPerGraph: 100,
        showFilters: false,
        method: { label: MethodName.CFOP, value: MethodName.CFOP },
    }

    static passesFilters(solve: Solve, filters: Filters) {
        return !this.filterExclusion(solve, filters);
    }
    static filterExclusion(solve: Solve, filters: Filters): string {
        if (solve.isCorrupt) return 'Invalid source data';
        if (solve.method != filters.method) return 'Solving method';
        if (filters.sources.indexOf(solve.source) < 0) return 'Source';
        if (filters.crossColors.indexOf(solve.crossColor) < 0) return 'Cross color';
        if (solve.date < filters.startDate || solve.date > filters.endDate) return 'Date range';
        if (!solve.dnf && (solve.time < filters.fastestTime || solve.time > filters.slowestTime)) return 'Solve time';
        // Acubemy exports may not report inspection time. Those solves should not be excluded by inspection filters.
        if (solve.inspectionTime != null && (solve.inspectionTime < filters.lowestInspection || solve.inspectionTime > filters.highestInspection)) return 'Inspection time';
        if (filters.sessions.length > 0 && !filters.sessions.includes(solve.session || 'Default')) return 'Session';

        // Only filter by case when the export reported one. Free-tier exports leave
        // step_N_case blank, and filtering on "" would reject the whole export.
        const pllStep = getStep(solve, StepName.PLL);
        if (solve.method == MethodName.CFOP && pllStep?.case && filters.pllCases.indexOf(pllStep.case) < 0) return 'PLL case';
        const ollStep = getStep(solve, StepName.OLL);
        if (solve.method == MethodName.CFOP && ollStep?.case && filters.ollCases.indexOf(ollStep.case) < 0) return 'OLL case';

        // Detailed mistake reasons drive the same clean/mistake filter.
        if (filters.solveCleanliness.indexOf(solve.isMistake ? SolveCleanliness.Mistake : SolveCleanliness.Clean) < 0) return 'Solve cleanliness';
        if (filters.solveLuckiness.indexOf(solve.isFullStep ? SolveLuckiness.FullStep : SolveLuckiness.Skip) < 0) return 'Solve luckiness';

        return '';
    }
    static exclusionSummary(solves: Solve[], filters: Filters, limit = 0, sessionFirst = false): string {
        const counts = new Map<string, number>();
        if (sessionFirst && filters.sessions.length) { const total = solves.length; solves = solves.filter(solve => filters.sessions.includes(solve.session || 'Default')); if (solves.length < total) counts.set('Session', total - solves.length); }
        if (limit > 0 && solves.length > limit) counts.set('Outside recent window', solves.length - limit);
        for (const solve of latestSolves(solves, limit, solve => solve.date.getTime())) {
            const reason = this.filterExclusion(solve, filters);
            if (reason) counts.set(reason, (counts.get(reason) ?? 0) + 1);
        }
        return counts.size ? [...counts].map(([reason, count]) => `${reason}: ${count}`).join('; ') + '. Each excluded solve is counted once.' : 'All loaded solves match the current filters.';
    }

    static getMistakeMap = getMistakeMap;

    static markAllLuckiness(allSolves: Solve[]): Solve[] {
        for (const solve of allSolves) {
            const numSteps = Const.MethodSteps[solve.method]?.length ?? 0;
            // A skipped step takes no time to execute. Only ever clears the flag,
            // so a solve already known not to be full step stays that way.
            if (solve.steps.some((step, i) => i < numSteps && step.executionTime === 0)) {
                solve.isFullStep = false;
            }
        }

        return allSolves;
    }

    static applyFiltersToSolves(allSolves: Solve[], filters: Filters, windowSize: number, prepared = false): Solve[] {
        const marked = this.markAllLuckiness(markMistakes(allSolves, windowSize, prepared));
        return marked.filter(x => this.passesFilters(x, filters));
    }

    static compressSolves(solves: Solve[], steps: StepName[]): Solve[] {
        return solves.map((solve) => {
            const newSteps: Step[] = solve.steps.filter((x) => steps.find((y) => y === x.name));

            const totals = sumStepTotals(newSteps), { time: stepTime, turns: stepTurns } = totals;
            const turns = stepTurns > 0 ? stepTurns : solve.turns;
            // Full solves retain source timing and penalties; subsets use step timing.
            const hasStepTimings = solve.steps.some(step => step.time > 0);
            const fullSolve = Const.MethodSteps[solve.method].every(step => steps.includes(step));
            const time = fullSolve || !hasStepTimings ? solve.time : stepTime;
            const tps = stepTime > 0 && turns > 0 ? turns / stepTime : solve.tps;

            // Every other field is carried over untouched.
            return {
                ...solve,
                ...totals,
                time,
                tps,
                turns,
                steps: newSteps,
            };
        });
    }

    static getDerivedStateFromProps(nextProps: FilterPanelProps, prevState: FilterPanelState) {
        const solveLimit = nextProps.solveLimit ?? DEFAULT_SOLVE_LIMIT;
        const scopeChanged = nextProps.sessionScope !== prevState.lastAppliedSession;
        const inputsUnchanged =
            nextProps.solves === prevState.lastAppliedSolves &&
            prevState.filters === prevState.lastAppliedFilters &&
            prevState.windowSize === prevState.lastAppliedWindowSize && solveLimit === prevState.lastAppliedSolveLimit && !scopeChanged;

        // Everything carries over; only the incoming solves and whatever depends
        // on them is recomputed below.
        const newState: FilterPanelState = { ...prevState, allSolves: nextProps.solves };
        if (inputsUnchanged) return newState;
        if (scopeChanged) newState.sessionOverride = false;

        const solvesChanged = nextProps.solves !== prevState.lastAppliedSolves;
        if (solvesChanged) {
            if (nextProps.suggestedMethod !== undefined) {
                const method = nextProps.suggestedMethod.value;
                newState.method = nextProps.suggestedMethod;
                newState.filters = { ...newState.filters, method, steps: Const.MethodSteps[method] };
                newState.chosenSteps = FilterPanel.getStepOptionsForMethod(method);
            }
            if (nextProps.suggestedSessions !== undefined && nextProps.sessionScope === undefined) {
                newState.filters = { ...newState.filters, sessions: nextProps.suggestedSessions.map(x => x.value) };
            }
            if (nextProps.suggestedWindowSize !== undefined) {
                newState.windowSize = nextProps.suggestedWindowSize;
            }
        }
        if (nextProps.sessionScope !== undefined && !newState.sessionOverride && (solvesChanged || scopeChanged)) {
            const sessions = nextProps.sessionScope ? [nextProps.sessionScope] : CalculateAllSessionOptions(nextProps.solves).map(option => option.value);
            newState.filters = { ...newState.filters, sessions };
        }
        newState.recordSolves = nextProps.solves.filter(solve => !newState.filters.sessions.length || newState.filters.sessions.includes(solve.session || 'Default'));
        const recent = latestSolves(nextProps.sessionScope === undefined ? nextProps.solves : newState.recordSolves, solveLimit, solve => solve.date.getTime());
        if (newState.autoWindowSize) {
            const firstPass = newState.filters.solveCleanliness.length === Const.solveCleanliness.length
                ? FilterPanel.markAllLuckiness(recent).filter(solve => FilterPanel.passesFilters(solve, newState.filters))
                : FilterPanel.applyFiltersToSolves(recent, newState.filters, newState.windowSize);
            newState.windowSize = CalculateWindowSize(Math.min(firstPass.length, solveLimit || Infinity));
        } else if (!Number.isFinite(newState.windowSize) || newState.windowSize < 5) {
            newState.windowSize = 5;
        }
        newState.filteredSolves = FilterPanel.applyFiltersToSolves(recent, newState.filters, newState.windowSize, solvesChanged && nextProps.preparedSolves === nextProps.solves);
        if (newState.autoBenchmarks) {
            const bench = CalculateBenchmarkTimes(newState.filteredSolves);
            newState.goodTime = bench.goodTime;
            newState.badTime = bench.badTime;
        }
        newState.compressedSolves = FilterPanel.compressSolves(newState.filteredSolves, newState.filters.steps);
        newState.lastAppliedSolves = nextProps.solves;
        newState.lastAppliedFilters = newState.filters;
        newState.lastAppliedWindowSize = newState.windowSize;
        newState.lastAppliedSolveLimit = solveLimit;
        newState.lastAppliedSession = nextProps.sessionScope;
        return newState;
    }
    componentDidMount() { this.props.onStepsChange?.(this.state.filters.steps); this.props.onSessionsChange?.(this.state.filters.sessions); }
    componentDidUpdate(_props: FilterPanelProps, previous: FilterPanelState) {
        if (previous.filters.steps !== this.state.filters.steps) this.props.onStepsChange?.(this.state.filters.steps);
        if (previous.filters.sessions !== this.state.filters.sessions) this.props.onSessionsChange?.(this.state.filters.sessions);
    }

    /** Filters own the selection; labels come from the available options, in selection order. */
    selectedOptions(filterKey: MultiFilterKey, options: Option[]): Option[] {
        return this.state.filters[filterKey].map(value => options.find(option => option.value === value) ?? { label: value, value });
    }

    setMulti(filterKey: MultiFilterKey, selectedList: Option[]) {
        this.setState(prev => ({ ...prev, filters: { ...prev.filters, [filterKey]: selectedList.map(x => x.value) }, sessionOverride: filterKey === 'sessions' || prev.sessionOverride }));
    }

    setFilter<K extends keyof Filters>(filterKey: K, value: Filters[K]) {
        this.setState(prev => ({ ...prev, filters: { ...prev.filters, [filterKey]: value }, sessionOverride: filterKey === 'sessions' || prev.sessionOverride }));
    }

    setNumberFilter(filterKey: KeysOfType<Filters, number>, event: Parameters<FormControlChangeHandler>[0]) {
        this.setFilter(filterKey, parseInt(event.target.value));
    }

    setField<K extends keyof FilterPanelState>(stateKey: K, value: FilterPanelState[K]) {
        this.setState(prev => ({ ...prev, [stateKey]: value }));
    }

    setNumberField(stateKey: KeysOfType<FilterPanelState, number>, event: Parameters<FormControlChangeHandler>[0]) {
        const raw = event.target.value;
        this.setField(stateKey, stateKey === 'chopPercentage' ? Math.max(0, Math.min(49, Number(raw) || 0))
            : stateKey === 'windowSize' ? Math.max(5, Number(raw) || 5) : parseInt(raw));
    }

    windowSizeChanged(newWindowSize: number) {
        this.setState({ windowSize: newWindowSize });
    }

    chosenStepsChanged(selectedList: Option<StepName>[]) {
        const selectedSteps: StepName[] = selectedList.map(x => x.value);
        const allSteps = Const.MethodSteps[this.state.filters.method];

        // Sort the steps to match the order in the method
        const sortOrder = Object.fromEntries(allSteps.map((k, i) => [k, i + 1]));
        selectedSteps.sort((a, b) =>
            (sortOrder[a] || Number.MAX_VALUE) - (sortOrder[b] || Number.MAX_VALUE)
        );

        this.setState({
            filters: { ...this.state.filters, steps: selectedSteps },
            chosenSteps: selectedList
        })
    }

    static toOptions<T extends string>(values: readonly T[]): Option<T>[] {
        return values.map(x => ({ label: x, value: x }));
    }

    static getStepOptionsForMethod(method: MethodName) { return FilterPanel.toOptions(Const.MethodSteps[method]); }
    getMethodOptions(): Option<MethodName>[] { return FilterPanel.toOptions(Object.values(MethodName)); }

    getSessionOptions() { return CalculateAllSessionOptions(this.props.solves); }

    methodChanged(newValue: Option<MethodName> | null) {
        if (!newValue) return;
        const newMethod = newValue.value;
        this.setState({
            method: newValue,
            filters: { ...this.state.filters, method: newMethod, steps: Const.MethodSteps[newMethod] },
            chosenSteps: FilterPanel.getStepOptionsForMethod(newMethod)
        });
        this.props.onMethodChange?.(newMethod);
    }

    applyStepsPreset(steps: StepName[]) { this.chosenStepsChanged(FilterPanel.toOptions(steps)); }

    setAutoWindowSize(checked: boolean) {
        this.setState(previous => ({ autoWindowSize: checked, windowSize: checked ? CalculateWindowSize(previous.filteredSolves.length) : previous.windowSize }));
    }

    setAutoBenchmarks(checked: boolean) {
        const baseSolves = this.state.filteredSolves.length > 0 ? this.state.filteredSolves : this.state.allSolves;
        this.setState(previous => ({ autoBenchmarks: checked, ...(checked ? CalculateBenchmarkTimes(baseSolves) : { goodTime: previous.goodTime, badTime: previous.badTime }) }));
    }

    tabSelect(key: number) { this.setField('tabKey', key); }

    showFilters() { this.setField('showFilters', true); }

    hideFilters() { this.setField('showFilters', false); }

    resetFilters() {
        this.filterRevision++;
        const solves = this.state.allSolves;
        const sessions = this.props.sessionScope ? [{ label: this.props.sessionScope, value: this.props.sessionScope }] : CalculateAllSessionOptions(solves);
        this.setState({ ...defaultSelections(this.state.method.value, sessions, CalculateBenchmarkTimes(solves)), sessionOverride: false });
    }

    createFilterHtml(filter: JSX.Element, title: string, tooltip: string): JSX.Element {
        return <fieldset className="filter-card">
            <legend><span id={filterId(title)}>{title}</span><InfoTip>{tooltip}</InfoTip></legend>{filter}
        </fieldset>;
    }

    /** A multi-select filter card; every one of these shares the same wiring. */
    multiFilter(options: Option[], filterKey: MultiFilterKey, title: string, tooltip: string): JSX.Element {
        return this.createFilterHtml(<MultiSelect options={options} value={this.selectedOptions(filterKey, options)} onChange={(selected: Option[]) => this.setMulti(filterKey, selected)} labelledBy={filterId(title)} />, title, tooltip);
    }

    /** A multi-select filter card whose options are split into expandable sub-menus. */
    groupedMultiFilter(groups: OptionGroup[], filterKey: MultiFilterKey, title: string, tooltip: string): JSX.Element {
        return this.createFilterHtml(<GroupedMultiSelect groups={groups} value={this.selectedOptions(filterKey, groups.flatMap(group => group.options))} onChange={selected => this.setMulti(filterKey, selected)} labelledBy={filterId(title)} />, title, tooltip);
    }

    /** A filter card holding a low/high pair of numeric inputs. */
    rangeFilter(
        max: string, fields: [KeysOfType<Filters, number>, string][],
        title: string, tooltip: string): JSX.Element {
        return this.createFilterHtml(<div className="row">
            {fields.map(([field, id], index) => <div className="form-outline col-6" key={id}>
                <label htmlFor={id}>{index === 0 ? 'Minimum' : 'Maximum'} (s)</label>
                <DebouncedNumber min="0" max={max} id={id} aria-label={`${title} ${index === 0 ? 'minimum' : 'maximum'}`} value={this.state.filters[field]} onChange={event => this.setNumberFilter(field, event)} />
            </div>)}
        </div>, title, tooltip);
    }

    /** A filter card with an "Auto" switch that disables its numeric inputs. */
    autoFilter(
        auto: 'autoWindowSize' | 'autoBenchmarks', fields: KeysOfType<FilterPanelState, number>[], min: string, max: string,
        title: string, tooltip: string): JSX.Element {
        return this.createFilterHtml(<div className="row align-items-center g-2">
            <div className="col-auto d-flex align-items-center gap-2"><label htmlFor={auto} className="small">Auto</label>
                <ReactSwitch id={auto} checked={this.state[auto]} onChange={checked => auto === 'autoWindowSize' ? this.setAutoWindowSize(checked) : this.setAutoBenchmarks(checked)} /></div>
            {fields.map(field => <div className="col" key={field}>
                <label htmlFor={field}>{fields.length > 1 ? field === 'goodTime' ? 'Good (s)' : 'Bad (s)' : 'Solves'}</label>
                <DebouncedNumber min={min} max={max} id={field} aria-label={fields.length > 1 ? field === 'goodTime' ? 'Good solve time' : 'Bad solve time' : title} value={this.state[field]} onChange={event => this.setNumberField(field, event)} disabled={this.state[auto]} />
            </div>)}
        </div>, title, tooltip);
    }

    /** A filter card holding a single on/off switch. */
    switchFilter(id: string, checked: boolean, onChange: (v: boolean) => void, title: string, tooltip: string): JSX.Element {
        return this.createFilterHtml(<ReactSwitch id={id} aria-labelledby={filterId(title)} checked={checked} onChange={onChange} />, title, tooltip);
    }

    render() {
        const container = document.querySelector<HTMLElement>('.site-page--smartcubeanalyzer') ?? document.body;
        let filters: JSX.Element = (<></>);
        if (this.state.allSolves.length > 0) {
            filters = (
                <Container>
                    {this.createFilterHtml(
                        <></>,
                        `Showing ${this.state.filteredSolves.length} / ${this.state.allSolves.length} solves`,
                        this.state.showFilters ? FilterPanel.exclusionSummary(this.state.allSolves, this.state.filters, this.props.solveLimit ?? DEFAULT_SOLVE_LIMIT, this.props.sessionScope !== undefined) : 'Open filters to see why solves are excluded.'
                    )}

                    <details open className="filter-group"><summary>Basics</summary>
                    {this.createFilterHtml(<Select classNamePrefix="method-select" aria-labelledby={filterId('Which Method?')} options={this.getMethodOptions()} value={this.state.method} onChange={this.methodChanged.bind(this)} />, "Which Method?", "Choose the solving method.")}
                    {this.multiFilter(this.getSessionOptions(), 'sessions', "Which Sessions?", "Choose sessions to include.")}
                    {this.multiFilter(SOURCE_OPTIONS, 'sources', "Source", "Include CuberPlus, Cubeast or Acubemy solves.")}
                    {([['startDate', 'Start'], ['endDate', 'End']] as const).map(([field, label]) => <React.Fragment key={field}>{this.createFilterHtml(
                        <><label id={`filter-${field}`} htmlFor={field}>{label} date</label><DebouncedDate id={field} value={this.state.filters[field]} onChange={date => this.setFilter(field, date)} container={container} /></>,
                        `Pick ${label} Date`, `Choose ${label.toLowerCase()} date`
                    )}</React.Fragment>)}
                    {this.createFilterHtml(
                        <MultiSelect options={FilterPanel.getStepOptionsForMethod(this.state.filters.method)} value={this.state.chosenSteps} onChange={this.chosenStepsChanged.bind(this)} labelledBy={filterId('Which step to drill down?')} />,
                        "Which step to drill down?",
                        "Choose which steps to analyze across the dashboard."
                    )}
                    </details>

                    <details className="filter-group"><summary>Cases and solve quality</summary>
                    {this.groupedMultiFilter(Const.PllGroups, 'pllCases', "PLL Cases", "Choose PLL cases. Re-analyze saved recordings in Options to reconstruct missing cases.")}
                    {this.groupedMultiFilter(Const.OllGroups, 'ollCases', "OLL Cases", "Choose OLL cases. Re-analyze saved recordings in Options to reconstruct missing cases.")}
                    {this.multiFilter(Const.solveCleanliness, 'solveCleanliness', "Solve Cleanliness", "Clean means no detected mistake signals. See the Mistakes chart for the exact rules; missing data cannot prove a solve was clean.")}
                    {this.multiFilter(Const.solveLuckiness, 'solveLuckiness', "Solve Luckiness", "Choose fullstep solves or solves with skips.")}
                    {this.multiFilter(COLOR_OPTIONS, 'crossColors', "Cross Color", "Pick the starting cross color")}

                    {this.rangeFilter("300", [['fastestTime', 'fastestSolve'], ['slowestTime', 'slowestSolve']],
                        "Solve Times",
                        "Choose slowest and fastest solves to keep"
                    )}

                    {this.rangeFilter("100000", [['lowestInspection', 'lowestInspection'], ['highestInspection', 'highestInspection']],
                        "Inspection Time",
                        "Choose lowest and highest inspection times to keep"
                    )}
                    </details>

                    <details className="filter-group"><summary>Chart settings</summary>
                    {this.autoFilter('autoWindowSize', ['windowSize'], "5", "10000",
                        "Sliding Window Size",
                        "Choose the sliding window size. When Auto is enabled, the size is chosen automatically based on how many solves are shown. If you see no data, try lowering this value."
                    )}

                    {this.createFilterHtml(
                        <DebouncedNumber min="5" max="10000" id="pointsPerGraph" aria-labelledby={filterId('Points Per Graph')} value={this.state.pointsPerGraph} onChange={e => this.setNumberField('pointsPerGraph', e)} />,
                        "Points Per Graph",
                        "Choose how many points to show on each chart. If this value is set too high, you may see performance issues."
                    )}

                    {this.switchFilter("useLogScale", this.state.useLogScale, checked => this.setField('useLogScale', checked),
                        "Use Logarithmic Scale",
                        "Use a Logarithmic Scale for the Y axis. If you are unsure what this means, leave it disabled"
                    )}

                    {this.switchFilter("use4SegmentTiming", this.state.use4SegmentTiming, checked => this.setField('use4SegmentTiming', checked),
                        "4-Segment Timing",
                        "Show recognition, pre-AUF, execution, and post-AUF as separate segments in timing charts. When off, shows only recognition and execution."
                    )}

                    {this.autoFilter('autoBenchmarks', ['goodTime', 'badTime'], "0", "300",
                        "Benchmarks",
                        "Choose what you consider a 'good' solve and a 'bad' solve. When Auto is enabled, good/bad are calculated from your current Ao100 and +25% for bad."
                    )}

                    {this.createFilterHtml(
                        <div className="row align-items-center g-2">
                            <div className="col-auto d-flex align-items-center"><ReactSwitch id="chopAverages" aria-label="Chop rolling average" checked={this.state.chopAverages} onChange={checked => this.setField('chopAverages', checked)} /></div>
                            <div className="col"><DebouncedNumber id="chopPercentage" aria-label="Chop percentage per end" min="0" max="49" step="1" value={this.state.chopPercentage} disabled={!this.state.chopAverages} onChange={event => this.setNumberField('chopPercentage', event)} /></div>
                        </div>,
                        "Chop Rolling Average",
                        "Remove this percentage of the fastest and slowest solves from each rolling-average window, rounded up. At least one solve is retained. Does not change standard Ao5/Ao12/Ao100/Ao1000 records."
                    )}

                    </details>
                </Container>
            )
        }

        let analysis: JSX.Element = (<></>)
        if (this.state.allSolves.length > 0) {
            analysis = (
                <div>
                    <Row className="mt-3">
                        <Col>
                            <ChartPanel
                                windowSize={this.state.windowSize}
                                solves={this.state.compressedSolves} recordSolves={this.state.recordSolves}
                                pointsPerGraph={this.state.pointsPerGraph}
                                methodName={this.state.filters.method}
                                goodTime={this.state.goodTime}
                                badTime={this.state.badTime}
                                steps={this.state.filters.steps}
                                useLogScale={this.state.useLogScale}
                                use4SegmentTiming={this.state.use4SegmentTiming}
                                chopAverages={this.state.chopAverages}
                                chopPercentage={this.state.chopPercentage}
                                onReady={this.props.onReady}
                            />
                        </Col>
                    </Row>
                </div >
            );
        }

        const loading = this.props.isParsing && this.state.allSolves.length === 0 ? (
            <Container className="py-5 text-center">
                <Spinner animation="border" role="status" />
                <div className="mt-3">Parsing CSV and preparing charts...</div>
            </Container>
        ) : null;

        const f = this.state.filters, dates = defaultDateRange();
        const activeFilters = [
            f.sources.length !== SOURCE_OPTIONS.length, f.sessions.length > 0 && f.sessions.length !== this.getSessionOptions().length,
            f.startDate.getTime() !== dates.startDate.getTime() || f.endDate.getTime() !== dates.endDate.getTime(),
            f.steps.length !== Const.MethodSteps[f.method].length, f.crossColors.length !== COLOR_OPTIONS.length,
            f.pllCases.length !== Const.PllCases.length, f.ollCases.length !== Const.OllCases.length,
            f.solveCleanliness.length !== Const.solveCleanliness.length, f.solveLuckiness.length !== Const.solveLuckiness.length,
            f.fastestTime !== 0 || f.slowestTime !== 300, f.lowestInspection !== 0 || f.highestInspection !== 300,
        ].filter(Boolean).length;
        const source = this.props.source ?? 'Shown solves', demo = source.startsWith('Demo:');
        return (
            <div className="body">
                <section className="dashboard">
                    <Offcanvas container={container} aria-labelledby="analyzer-filter-title" show={this.state.showFilters && this.context !== false} onHide={this.hideFilters.bind(this)}>
                        <Offcanvas.Header closeButton>
                            <Offcanvas.Title id="analyzer-filter-title" className="me-3">Filters</Offcanvas.Title>
                            <Button variant="outline-secondary" size="sm" onClick={this.resetFilters.bind(this)}>
                                Reset filters
                            </Button>
                        </Offcanvas.Header>
                        <Offcanvas.Body key={this.filterRevision}>
                            {filters}
                        </Offcanvas.Body>
                    </Offcanvas>
                    {loading}
                    {this.state.allSolves.length > 0 && <>
                        <div className="analysis-summary">
                            <div className="analysis-context"><span className={demo ? 'analysis-demo' : ''}>{demo ? 'Demo' : source}</span><strong>{this.state.filteredSolves.length.toLocaleString()} / {this.state.allSolves.length.toLocaleString()} solves</strong><InfoTip>{demo ? `${source}. Demo data is temporary. Your saved solves are unchanged.` : `${source}. Session and recent-solves scope are shared across pages. Override the session in Filters, or show all sessions in Options. Session filters also scope all-time records; other filters affect charts only.`}</InfoTip></div>
                            <button className="btn btn-primary" aria-label={activeFilters ? `Open filters, ${activeFilters} active` : 'Open filters'} onClick={() => this.showFilters()}>Edit filters{activeFilters > 0 && ` (${activeFilters})`}</button>
                        </div>
                        {this.props.presets}
                    </>}
                    {analysis}
                </section>
            </div >
        )
    }
}