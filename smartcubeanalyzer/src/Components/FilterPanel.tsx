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
import { CalculateAllSessionOptions, CalculateBenchmarkTimes, CalculateWindowSize } from "../Helpers/CubeHelpers";
import ReactSwitch from "react-switch";
import { PageVisible } from '@cuberplus/navigation';
import { DEFAULT_SOLVE_LIMIT, latestSolves } from '../../../shared/Components/SolveLimit';

/** react-bootstrap's FormControl accepts input, select and textarea events, so borrow its own handler type. */
type FormControlChangeHandler = NonNullable<React.ComponentProps<typeof FormControl>['onChange']>;

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
        chosenColors: COLOR_OPTIONS,
        chosenSessions: sessions,
        chosenSources: SOURCE_OPTIONS,
        chosenPLLs: Const.PllCases,
        chosenOLLs: Const.OllCases,
        solveCleanliness: Const.solveCleanliness,
        solveLuckiness: Const.solveLuckiness,
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
        allSolves: [],
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
        // Only filter by session when the solve has a session set; avoids excluding rows where session wasn't parsed (e.g. CSV column alignment).
        if (filters.sessions.length > 0 && (solve.session !== '' && solve.session != null) && filters.sessions.indexOf(solve.session) < 0) return 'Session';

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
    static exclusionSummary(solves: Solve[], filters: Filters, limit = 0): string {
        const counts = new Map<string, number>();
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

            let stepTime = 0, stepTurns = 0, execution = 0, recognition = 0, preAuf = 0, postAuf = 0;
            for (const step of newSteps) {
                stepTime += step.time;
                stepTurns += step.turns;
                execution += step.executionTime;
                recognition += step.recognitionTime;
                preAuf += step.preAufTime;
                postAuf += step.postAufTime;
            }

            const turns = stepTurns > 0 ? stepTurns : solve.turns;
            // Full solves retain source timing and penalties; subsets use step timing.
            const hasStepTimings = solve.steps.some(step => step.time > 0);
            const fullSolve = Const.MethodSteps[solve.method].every(step => steps.includes(step));
            const time = fullSolve || !hasStepTimings ? solve.time : stepTime;
            const tps = stepTime > 0 && turns > 0 ? turns / stepTime : solve.tps;

            // Every other field is carried over untouched.
            return {
                ...solve,
                time,
                tps,
                recognitionTime: recognition,
                executionTime: execution,
                preAufTime: preAuf,
                postAufTime: postAuf,
                turns,
                steps: newSteps,
            };
        });
    }

    static getDerivedStateFromProps(nextProps: FilterPanelProps, prevState: FilterPanelState) {
        const solveLimit = nextProps.solveLimit ?? DEFAULT_SOLVE_LIMIT;
        const inputsUnchanged =
            nextProps.solves === prevState.lastAppliedSolves &&
            prevState.filters === prevState.lastAppliedFilters &&
            prevState.windowSize === prevState.lastAppliedWindowSize && solveLimit === prevState.lastAppliedSolveLimit;

        // Everything carries over; only the incoming solves and whatever depends
        // on them is recomputed below.
        const newState: FilterPanelState = { ...prevState, allSolves: nextProps.solves };
        if (inputsUnchanged) return newState;

        const solvesChanged = nextProps.solves !== prevState.lastAppliedSolves;
        const recent = latestSolves(nextProps.solves, solveLimit, solve => solve.date.getTime());
        if (solvesChanged) {
            if (nextProps.suggestedMethod !== undefined) {
                const method = nextProps.suggestedMethod.value as MethodName;
                newState.method = nextProps.suggestedMethod;
                newState.filters = { ...newState.filters, method, steps: Const.MethodSteps[method] };
                newState.chosenSteps = FilterPanel.getStepOptionsForMethod(method);
            }
            if (nextProps.suggestedSessions !== undefined) {
                newState.chosenSessions = nextProps.suggestedSessions;
                newState.filters = { ...newState.filters, sessions: nextProps.suggestedSessions.map(x => x.value) };
            }
            if (nextProps.suggestedWindowSize !== undefined) {
                newState.windowSize = nextProps.suggestedWindowSize;
            }
        }
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
        return newState;
    }
    componentDidMount() { this.props.onStepsChange?.(this.state.filters.steps); }
    componentDidUpdate(_props: FilterPanelProps, previous: FilterPanelState) { if (previous.filters.steps !== this.state.filters.steps) this.props.onStepsChange?.(this.state.filters.steps); }

    /** Multi-selects all behave the same: raw options in state, their values in filters. */
    setMulti(filterKey: keyof Filters, stateKey: keyof FilterPanelState, selectedList: Option[]) {
        this.setState(prev => {
            const filters: Filters = { ...prev.filters, [filterKey]: selectedList.map(x => x.value) };
            return { ...prev, filters, [stateKey]: selectedList };
        });
    }

    setFilter<K extends keyof Filters>(filterKey: K, value: Filters[K]) {
        this.setState(prev => {
            const filters: Filters = { ...prev.filters, [filterKey]: value };
            return { ...prev, filters };
        });
    }

    setNumberFilter(filterKey: KeysOfType<Filters, number>, event: React.ChangeEvent<HTMLInputElement>) {
        this.setFilter(filterKey, parseInt(event.target.value));
    }

    setField<K extends keyof FilterPanelState>(stateKey: K, value: FilterPanelState[K]) {
        this.setState(prev => ({ ...prev, [stateKey]: value }));
    }

    setNumberField(stateKey: KeysOfType<FilterPanelState, number>, event: React.ChangeEvent<HTMLInputElement>) {
        this.setField(stateKey, parseInt(event.target.value));
    }

    crossColorsChanged(selectedList: Option[]) { this.setMulti('crossColors', 'chosenColors', selectedList); }

    chosenSessionsChanged(selectedList: Option[]) { this.setMulti('sessions', 'chosenSessions', selectedList); }

    sourcesChanged(selectedList: Option[]) { this.setMulti('sources', 'chosenSources', selectedList); }

    pllChanged(selectedList: Option[]) { this.setMulti('pllCases', 'chosenPLLs', selectedList); }

    ollChanged(selectedList: Option[]) { this.setMulti('ollCases', 'chosenOLLs', selectedList); }

    setCleanliness(selectedList: Option[]) { this.setMulti('solveCleanliness', 'solveCleanliness', selectedList); }

    setLuckiness(selectedList: Option[]) { this.setMulti('solveLuckiness', 'solveLuckiness', selectedList); }

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

    static getStepOptionsForMethod(method: MethodName) {
        return FilterPanel.toOptions(Const.MethodSteps[method]);
    }

    getMethodOptions(): Option<MethodName>[] {
        return FilterPanel.toOptions(Object.values(MethodName));
    }

    getSessionOptions() {
        return CalculateAllSessionOptions(this.props.solves);
    }

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

    applyStepsPreset(steps: StepName[]) {
        this.setState({
            filters: { ...this.state.filters, steps },
            chosenSteps: FilterPanel.toOptions(steps),
        });
    }

    setStartDate(newStartDate: Date) { this.setFilter('startDate', newStartDate); }

    setEndDate(newEndDate: Date) { this.setFilter('endDate', newEndDate); }

    setSlowestSolve(event: React.ChangeEvent<HTMLInputElement>) { this.setNumberFilter('slowestTime', event); }

    setFastestSolve(event: React.ChangeEvent<HTMLInputElement>) { this.setNumberFilter('fastestTime', event); }

    setLowestInspection(event: React.ChangeEvent<HTMLInputElement>) { this.setNumberFilter('lowestInspection', event); }

    setHighestInspection(event: React.ChangeEvent<HTMLInputElement>) { this.setNumberFilter('highestInspection', event); }

    setBadTime(event: React.ChangeEvent<HTMLInputElement>) { this.setNumberField('badTime', event); }

    setGoodTime(event: React.ChangeEvent<HTMLInputElement>) { this.setNumberField('goodTime', event); }

    setChopPercentage(event: React.ChangeEvent<HTMLInputElement>) {
        this.setField('chopPercentage', Math.max(0, Math.min(49, Number(event.target.value) || 0)));
    }

    setWindowSize(event: React.ChangeEvent<HTMLInputElement>) { this.setField('windowSize', Math.max(5, Number(event.target.value) || 5)); }

    setAutoWindowSize(checked: boolean) {
        this.setState(previous => ({ autoWindowSize: checked, windowSize: checked ? CalculateWindowSize(previous.filteredSolves.length) : previous.windowSize }));
    }

    setAutoBenchmarks(checked: boolean) {
        const baseSolves = this.state.filteredSolves.length > 0 ? this.state.filteredSolves : this.state.allSolves;
        this.setState(previous => ({ autoBenchmarks: checked, ...(checked ? CalculateBenchmarkTimes(baseSolves) : { goodTime: previous.goodTime, badTime: previous.badTime }) }));
    }

    setPointsPerGraph(event: React.ChangeEvent<HTMLInputElement>) { this.setNumberField('pointsPerGraph', event); }

    setUseLogScale(checked: boolean) { this.setField('useLogScale', checked); }

    setUse4SegmentTiming(checked: boolean) { this.setField('use4SegmentTiming', checked); }

    tabSelect(key: number) { this.setField('tabKey', key); }

    showFilters() { this.setField('showFilters', true); }

    hideFilters() { this.setField('showFilters', false); }

    resetFilters() {
        this.filterRevision++;
        const solves = this.state.allSolves;
        this.setState(defaultSelections(this.state.method.value as MethodName, CalculateAllSessionOptions(solves), CalculateBenchmarkTimes(solves)));
    }

    createFilterHtml(filter: JSX.Element, title: string, tooltip: string): JSX.Element {
        return <fieldset className="filter-card">
            <legend><span id={filterId(title)}>{title}</span><InfoTip>{tooltip}</InfoTip></legend>{filter}
        </fieldset>;
    }

    /** A multi-select filter card; every one of these shares the same wiring. */
    multiFilter<T extends string>(options: Option<T>[], value: Option<T>[], onChange: (v: Option<T>[]) => void, title: string, tooltip: string): JSX.Element {
        return this.createFilterHtml(<MultiSelect options={options} value={value} onChange={onChange} labelledBy={filterId(title)} />, title, tooltip);
    }

    /** A multi-select filter card whose options are split into expandable sub-menus. */
    groupedMultiFilter(groups: OptionGroup[], value: Option[], onChange: (v: Option[]) => void, title: string, tooltip: string): JSX.Element {
        return this.createFilterHtml(<GroupedMultiSelect groups={groups} value={value} onChange={onChange} labelledBy={filterId(title)} />, title, tooltip);
    }

    /** A filter card holding a low/high pair of numeric inputs. */
    rangeFilter(
        max: string,
        low: { id: string; value: number; onChange: FormControlChangeHandler },
        high: { id: string; value: number; onChange: FormControlChangeHandler },
        title: string, tooltip: string): JSX.Element {
        return this.createFilterHtml(<div className="row">
            {[low, high].map((f, index) => <div className="form-outline col-6" key={f.id}>
                <label htmlFor={f.id}>{index === 0 ? 'Minimum' : 'Maximum'} (s)</label>
                <DebouncedNumber min="0" max={max} id={f.id} aria-label={`${title} ${index === 0 ? 'minimum' : 'maximum'}`} value={f.value} onChange={f.onChange} />
            </div>)}
        </div>, title, tooltip);
    }

    /** A filter card with an "Auto" switch that disables its numeric inputs. */
    autoFilter(
        auto: { id: string; checked: boolean; onChange: (v: boolean) => void },
        min: string,
        max: string,
        fields: { id: string; value: number; onChange: FormControlChangeHandler }[],
        title: string, tooltip: string): JSX.Element {
        return this.createFilterHtml(<div className="row align-items-center g-2">
            <div className="col-auto d-flex align-items-center gap-2"><label htmlFor={auto.id} className="small">Auto</label>
                <ReactSwitch id={auto.id} checked={auto.checked} onChange={auto.onChange} /></div>
            {fields.map(f => <div className="col" key={f.id}>
                <label htmlFor={f.id}>{fields.length > 1 ? f.id === 'goodTime' ? 'Good (s)' : 'Bad (s)' : 'Solves'}</label>
                <DebouncedNumber min={min} max={max} id={f.id} aria-label={fields.length > 1 ? f.id === 'goodTime' ? 'Good solve time' : 'Bad solve time' : title} value={f.value} onChange={f.onChange} disabled={auto.checked} />
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
                        this.state.showFilters ? FilterPanel.exclusionSummary(this.state.allSolves, this.state.filters, this.props.solveLimit ?? DEFAULT_SOLVE_LIMIT) : 'Open filters to see why solves are excluded.'
                    )}

                    <details open className="filter-group"><summary>Basics</summary>
                    {this.createFilterHtml(<Select classNamePrefix="method-select" aria-labelledby={filterId('Which Method?')} options={this.getMethodOptions()} value={this.state.method} onChange={this.methodChanged.bind(this)} />, "Which Method?", "Choose the solving method.")}
                    {this.multiFilter(this.getSessionOptions(), this.state.chosenSessions, this.chosenSessionsChanged.bind(this), "Which Sessions?", "Choose sessions to include.")}
                    {this.multiFilter(SOURCE_OPTIONS, this.state.chosenSources, this.sourcesChanged.bind(this), "Source", "Include CuberPlus, Cubeast or Acubemy solves.")}
                    {([['startDate', 'Start'], ['endDate', 'End']] as const).map(([field, label]) => <React.Fragment key={field}>{this.createFilterHtml(
                        <><label id={`filter-${field}`} htmlFor={field}>{label} date</label><DebouncedDate id={field} value={this.state.filters[field]} onChange={date => this.setFilter(field, date)} container={container} /></>,
                        `Pick ${label} Date`, `Choose ${label.toLowerCase()} date`
                    )}</React.Fragment>)}
                    {this.multiFilter(
                        FilterPanel.getStepOptionsForMethod(this.state.filters.method),
                        this.state.chosenSteps, this.chosenStepsChanged.bind(this),
                        "Which step to drill down?",
                        "Choose which steps to analyze across the dashboard."
                    )}
                    </details>

                    <details className="filter-group"><summary>Cases and solve quality</summary>
                    {this.groupedMultiFilter(Const.PllGroups, this.state.chosenPLLs, this.pllChanged.bind(this), "PLL Cases", "Choose PLL cases. Re-analyze saved recordings in Options to reconstruct missing cases.")}
                    {this.groupedMultiFilter(Const.OllGroups, this.state.chosenOLLs, this.ollChanged.bind(this), "OLL Cases", "Choose OLL cases. Re-analyze saved recordings in Options to reconstruct missing cases.")}
                    {this.multiFilter(Const.solveCleanliness, this.state.solveCleanliness, this.setCleanliness.bind(this), "Solve Cleanliness", "Clean means no detected mistake signals. See the Mistakes chart for the exact rules; missing data cannot prove a solve was clean.")}
                    {this.multiFilter(Const.solveLuckiness, this.state.solveLuckiness, this.setLuckiness.bind(this), "Solve Luckiness", "Choose fullstep solves or solves with skips.")}
                    {this.multiFilter(COLOR_OPTIONS, this.state.chosenColors, this.crossColorsChanged.bind(this), "Cross Color", "Pick the starting cross color")}

                    {this.rangeFilter("300",
                        { id: "fastestSolve", value: this.state.filters.fastestTime, onChange: this.setFastestSolve.bind(this) },
                        { id: "slowestSolve", value: this.state.filters.slowestTime, onChange: this.setSlowestSolve.bind(this) },
                        "Solve Times",
                        "Choose slowest and fastest solves to keep"
                    )}

                    {this.rangeFilter("100000",
                        { id: "lowestInspection", value: this.state.filters.lowestInspection, onChange: this.setLowestInspection.bind(this) },
                        { id: "highestInspection", value: this.state.filters.highestInspection, onChange: this.setHighestInspection.bind(this) },
                        "Inspection Time",
                        "Choose lowest and highest inspection times to keep"
                    )}
                    </details>

                    <details className="filter-group"><summary>Chart settings</summary>
                    {this.autoFilter(
                        { id: "autoWindowSize", checked: this.state.autoWindowSize, onChange: this.setAutoWindowSize.bind(this) },
                        "5", "10000",
                        [{ id: "windowSize", value: this.state.windowSize, onChange: this.setWindowSize.bind(this) }],
                        "Sliding Window Size",
                        "Choose the sliding window size. When Auto is enabled, the size is chosen automatically based on how many solves are shown. If you see no data, try lowering this value."
                    )}

                    {this.createFilterHtml(
                        <DebouncedNumber min="5" max="10000" id="pointsPerGraph" aria-labelledby={filterId('Points Per Graph')} value={this.state.pointsPerGraph} onChange={this.setPointsPerGraph.bind(this)} />,
                        "Points Per Graph",
                        "Choose how many points to show on each chart. If this value is set too high, you may see performance issues."
                    )}

                    {this.switchFilter("useLogScale", this.state.useLogScale, this.setUseLogScale.bind(this),
                        "Use Logarithmic Scale",
                        "Use a Logarithmic Scale for the Y axis. If you are unsure what this means, leave it disabled"
                    )}

                    {this.switchFilter("use4SegmentTiming", this.state.use4SegmentTiming, this.setUse4SegmentTiming.bind(this),
                        "4-Segment Timing",
                        "Show recognition, pre-AUF, execution, and post-AUF as separate segments in timing charts. When off, shows only recognition and execution."
                    )}

                    {this.autoFilter(
                        { id: "autoBenchmarks", checked: this.state.autoBenchmarks, onChange: this.setAutoBenchmarks.bind(this) },
                        "0", "300",
                        [
                            { id: "goodTime", value: this.state.goodTime, onChange: this.setGoodTime.bind(this) },
                            { id: "badTime", value: this.state.badTime, onChange: this.setBadTime.bind(this) },
                        ],
                        "Benchmarks",
                        "Choose what you consider a 'good' solve and a 'bad' solve. When Auto is enabled, good/bad are calculated from your current Ao100 and +25% for bad."
                    )}

                    {this.createFilterHtml(
                        <div className="row align-items-center g-2">
                            <div className="col-auto d-flex align-items-center"><ReactSwitch id="chopAverages" aria-label="Chop rolling average" checked={this.state.chopAverages} onChange={checked => this.setField('chopAverages', checked)} /></div>
                            <div className="col"><DebouncedNumber id="chopPercentage" aria-label="Chop percentage per end" min="0" max="49" step="1" value={this.state.chopPercentage} disabled={!this.state.chopAverages} onChange={this.setChopPercentage.bind(this)} /></div>
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
                                solves={this.state.compressedSolves} recordSolves={this.props.solves}
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
            f.sources.length !== SOURCE_OPTIONS.length, f.sessions.length > 0 && this.state.chosenSessions.length !== this.getSessionOptions().length,
            f.startDate.getTime() !== dates.startDate.getTime() || f.endDate.getTime() !== dates.endDate.getTime(),
            f.steps.length !== Const.MethodSteps[f.method].length, f.crossColors.length !== COLOR_OPTIONS.length,
            f.pllCases.length !== Const.PllCases.length, f.ollCases.length !== Const.OllCases.length,
            f.solveCleanliness.length !== Const.solveCleanliness.length, f.solveLuckiness.length !== Const.solveLuckiness.length,
            f.fastestTime !== 0 || f.slowestTime !== 300, f.lowestInspection !== 0 || f.highestInspection !== 300,
        ].filter(Boolean).length;
        const source = this.props.source ?? 'Saved solves', demo = source.startsWith('Demo:');
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
                            <div className="analysis-context"><span className={demo ? 'analysis-demo' : ''}>{demo ? 'Demo' : source}</span><strong>{this.state.filteredSolves.length.toLocaleString()} / {this.state.allSolves.length.toLocaleString()} solves</strong><InfoTip>{demo ? `${source}. Demo data is temporary. Your saved solves are unchanged.` : `${source}. The recent-solves limit is shared across pages and can be changed in Options. Filters affect charts, not all-time records.`}</InfoTip></div>
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