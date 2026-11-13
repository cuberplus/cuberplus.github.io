import React from "react";
import Navigation, { PageVisible, SettingsContext, usePageDialog } from '@cuberplus/navigation';
import { FileInputProps, FileInputState, MethodName, Solve, StepName } from "../Models/Types";
import { dataTask } from '../../../shared/workers/dataClient';
import type { DataTask } from '../../../shared/workers/dataTasks';
import { FilterPanel } from "./FilterPanel";
import { GetDemoData, DEMO_DATASETS } from "../Data/SampleData"
import { Alert, Button, FormControl, Container } from "react-bootstrap";
import { HelpPanel } from "./HelpPanel";
import { CalculateMostUsedMethod, CalculateWindowSize, CalculateAllSessionOptions } from "../Helpers/CubeHelpers";
import ReactGA from 'react-ga4';
import { DEFAULT_SOLVE_LIMIT } from '../../../shared/Components/SolveLimit';
import { InfoTip } from '../../../shared/Components/InfoTip';

function ScopeSync({ limit, change }: { limit: number; change: (limit: number) => void }) {
    React.useLayoutEffect(() => change(limit), [limit, change]);
    return null;
}

const CFOP_PRESETS: { label: string; steps: StepName[] }[] = [
    { label: 'Full', steps: [StepName.Cross, StepName.F2L_1, StepName.F2L_2, StepName.F2L_3, StepName.F2L_4, StepName.OLL, StepName.PLL] },
    { label: 'Cross+1', steps: [StepName.Cross, StepName.F2L_1] },
    { label: 'F2L', steps: [StepName.F2L_1, StepName.F2L_2, StepName.F2L_3, StepName.F2L_4] },
    { label: 'OLL', steps: [StepName.OLL] },
    { label: 'PLL', steps: [StepName.PLL] },
];

function DataDialog({ dialog, children }: { dialog: React.RefObject<HTMLDialogElement>; children: React.ReactNode }) {
    usePageDialog(dialog, false);
    return <dialog ref={dialog} className="panel options-dialog analyzer-data-dialog" aria-labelledby="analyzer-data-title">
        <div className="page-heading"><h2 id="analyzer-data-title">Load analysis data</h2><button className="btn-close" aria-label="Close data" ref={button => { if (button) button.autofocus = true; }} onClick={() => dialog.current?.close()} /></div>{children}
    </dialog>;
}

export class FileInput extends React.Component<FileInputProps, FileInputState> {
    static contextType = PageVisible;
    state: FileInputState = { solves: [], isParsing: false, currentMethod: MethodName.CFOP };

    private dataDialogRef = React.createRef<HTMLDialogElement>();
    private filterPanelRef = React.createRef<FilterPanel>();
    private requestId = 0;
    private wasVisible = true;
    private tasks = new Set<() => void>();
    private loadedIds = new Set<string>();
    private mounted = false;
    private preparedSolves?: Solve[];
    private solveLimit = DEFAULT_SOLVE_LIMIT;
    private sessions: string[] = [];
    private changeSessions = (sessions: string[]) => { if (JSON.stringify(sessions) === JSON.stringify(this.sessions)) return; this.sessions = sessions; if (this.mounted && this.solveLimit && (this.state.isParsing || this.state.solves.length > this.solveLimit)) this.reload?.(); };
    private reload?: () => void;
    private changeLimit = (limit: number) => { const previous = this.solveLimit; if (limit === previous) return; this.solveLimit = limit; if (this.mounted && previous && (!limit || limit > previous) && (this.state.isParsing || this.state.solves.length > previous)) this.reload?.(); };
    private loadStarted = performance.getEntriesByName?.('analyzer-load-start').at(-1)?.startTime ?? performance.now();
    private initialLoad = true;
    private pendingLog = false;
    private logReady = () => {
        if (!this.pendingLog || !this.mounted) return;
        this.pendingLog = false;
        const duration = performance.now() - this.loadStarted;
        performance.measure?.('Analyzer load', { start: this.loadStarted, duration });
        console.info(`[Analyzer] Loaded in ${duration.toFixed(1)} ms (${this.state.source ?? 'Shown solves'}, ${this.state.solves.length} solves)`);
    };

    constructor(props: FileInputProps) {
        super(props);
        ReactGA.initialize('G-BHXNCQ3K0D');
    }

    private removeSolve = (event: Event) => {
        const detail = (event as CustomEvent<string | string[]>).detail, ids = new Set(Array.isArray(detail) ? detail : [detail]);
        this.setState(state => ({ solves: state.solves.filter(solve => !ids.has(solve.id) || (solve.source !== 'timer' && !solve.id.startsWith(`${solve.source}:`))) }));
    };
    private refresh = (event?: Event) => {
        if (event instanceof CustomEvent && (event as CustomEvent<{ reanalyzed?: boolean }>).detail?.reanalyzed) this.setState({ savedAnalysisChanged: true });
        void import('../../../timer/src/Data/storage').then(async ({ readSolveIds }) => {
        const ids = await readSolveIds();
        if (this.mounted) this.setState({ unloadedCount: ids.filter(id => !this.loadedIds.has(id)).length });
    }).catch(() => {}); };
    componentDidMount() { this.mounted = true; this.wasVisible = this.context !== false; window.addEventListener('timer-solve-deleted', this.removeSolve); window.addEventListener('timer-solves-changed', this.refresh); this.showTimerData(true); }
    componentDidUpdate() { const visible = this.context !== false, entering = visible && !this.wasVisible; this.wasVisible = visible; if (entering) this.refresh(); }
    componentWillUnmount() { this.mounted = false; this.requestId++; this.tasks.forEach(cancel => cancel()); window.removeEventListener('timer-solve-deleted', this.removeSolve); window.removeEventListener('timer-solves-changed', this.refresh); }
    private async read(task: DataTask): Promise<Solve[]> {
        if (!this.mounted) throw new Error('Data loading cancelled.');
        const { promise, cancel } = dataTask(task.type === 'parse' || task.type === 'local' ? { ...task, solveLimit: this.solveLimit, sessions: this.sessions } : task); this.tasks.add(cancel);
        try { const result = await promise; if (!('solves' in result)) throw new Error('Invalid analysis data.'); return result.solves; }
        finally { this.tasks.delete(cancel); }
    }

    private async loadData(read: (requestId: number) => Promise<Solve[]>, source: string | (() => string) = 'Shown solves', prepared = true, report = true) {
        this.reload = () => { void this.loadData(read, source, prepared, false); };
        const requestId = ++this.requestId;
        if (!this.initialLoad) this.loadStarted = performance.now();
        this.initialLoad = false; this.pendingLog = false;
        this.tasks.forEach(cancel => cancel()); this.tasks.clear();
        this.dataDialogRef.current?.close();
        this.setState({ isParsing: true, loadError: undefined });
        try {
            const solves = (await read(requestId)).sort((a, b) => a.date.getTime() - b.date.getTime());
            if (requestId !== this.requestId) return;
            if (!solves.length) throw new Error('No solves found in the selected data source.');
            const sourceName = typeof source === 'function' ? source() : source;
            const method = CalculateMostUsedMethod(solves);
            this.preparedSolves = prepared ? solves : undefined;
            this.loadedIds = new Set(solves.map(solve => solve.id));
            this.pendingLog = report || !this.state.solves.length;
            this.setState({
                solves, source: sourceName, currentMethod: method,
                suggestedMethod: this.pendingLog ? { label: method, value: method } : undefined,
                suggestedSessions: this.pendingLog ? CalculateAllSessionOptions(solves) : undefined,
                suggestedWindowSize: this.pendingLog ? CalculateWindowSize(solves.length) : undefined,
                unloadedCount: 0,
                savedAnalysisChanged: false,
            });
            ReactGA.event({ category: 'DataLoaded', action: sourceName.startsWith('Demo:') ? 'Loaded Test Data' : 'Loaded User Data', value: solves.length });
        } catch (error) {
            if (requestId === this.requestId) this.setState({ loadError: error instanceof Error ? error.message : 'Unable to load solves. Please try again.' });
        } finally {
            if (requestId === this.requestId) this.setState({ isParsing: false });
        }
    }

    showFileData(files: File[]) {
        if (!files.length) return;
        this.setState({ csvFileNames: files.map(file => file.name).join(', ') });
        void this.loadData(requestId => Promise.all(files.map(async file => {
            const csv = await file.text();
            return requestId === this.requestId ? this.read({ type: 'parse', csv }) : [];
        })).then(results => results.flat()), 'Temporary CSV preview', files.length === 1);
    }

    showTestData(file?: string) {
        void this.loadData(async requestId => {
            const csv = await GetDemoData(file, '/analyzer/');
            return requestId === this.requestId ? this.read({ type: 'parse', csv }) : [];
        }, `Demo: ${DEMO_DATASETS.find(dataset => dataset.file === file)?.name ?? 'Dev Solves'}`);
    }

    showTimerData(auto = false) {
        if (auto && (this.state.solves.length || this.state.isParsing)) return;
        let demo = false;
        void this.loadData(async requestId => {
            const solves = demo ? [] : await this.read({ type: 'local' });
            if (requestId !== this.requestId) return [];
            if (solves.length) { this.loadedIds = new Set(solves.map(solve => solve.id)); this.setState({ unloadedCount: 0 }); return solves; }
            if (!auto) throw new Error('No saved CuberPlus solves found. Import CSVs in Options or use Timer, then try again.');
            demo = true;
            const csv = await GetDemoData(undefined, '/analyzer/');
            return requestId === this.requestId ? this.read({ type: 'parse', csv }) : [];
        }, () => demo ? 'Demo: Dev Solves' : 'Shown solves');
    }

    render() {
        const activePreset = CFOP_PRESETS.find(preset => preset.steps.length === this.state.selectedSteps?.length && preset.steps.every(step => this.state.selectedSteps?.includes(step)))?.label;
        return (
            <>
                <header className="header cuberplus-header">
                    <Navigation current="smartcubeanalyzer" />
                </header>

                <main><Container>
                    <div className="page-heading">
                        <h1 className="route-heading">Analyzer</h1>
                        <Button id="analyzer-data" variant="outline-secondary" disabled={this.state.isParsing} onClick={() => this.dataDialogRef.current?.showModal()}>{this.state.isParsing ? 'Loading...' : 'Data'}</Button>
                    </div>
                    <DataDialog dialog={this.dataDialogRef}>
                        <div className="d-grid gap-3">
                            <Button variant="outline-primary" onClick={() => this.showTimerData()}>My saved solves</Button>
                            <label>Preview CSV<InfoTip>Analyze CSVs temporarily without changing saved solves. To keep them, use Import solves in Options.</InfoTip>
                                <FormControl type="file" id="uploaded_data" aria-label="CSV files" disabled={this.state.isParsing} accept=".csv" multiple onChange={event => this.showFileData(Array.from((event.currentTarget as HTMLInputElement).files ?? []))} />
                                {this.state.csvFileNames && <span className="small text-break">{this.state.csvFileNames}</span>}
                            </label>
                            <a className="btn btn-outline-primary" href="/options/#import-heading" onClick={() => this.dataDialogRef.current?.close()}>Import solves</a>
                            <details><summary>Demo data</summary><div className="d-grid gap-2 mt-2">{DEMO_DATASETS.map(dataset => <Button variant="outline-secondary" key={dataset.id} className="demo-dataset text-start text-wrap" onClick={() => this.showTestData(dataset.file)}>{dataset.name}<span className="d-block small text-muted">{dataset.description}</span></Button>)}</div></details>
                            <details><summary>CSV help</summary><HelpPanel /></details>
                        </div>
                    </DataDialog>
                    {(!!this.state.unloadedCount || this.state.savedAnalysisChanged) && <Alert variant="warning">{this.state.savedAnalysisChanged ? 'Saved solve analysis has changed.' : `${this.state.unloadedCount} saved solves are not loaded.`} Your current data has been kept. <Button variant="outline-primary" disabled={this.state.isParsing} onClick={() => this.showTimerData()}>Reload all solves</Button></Alert>}
                    {this.state.loadError && <Alert variant="warning">{this.state.loadError}</Alert>}
                    <SettingsContext.Consumer>{({ solveLimit, session, allSessions }) => <><ScopeSync limit={solveLimit} change={this.changeLimit} /><FilterPanel
                        ref={this.filterPanelRef}
                        solves={this.state.solves} solveLimit={solveLimit} sessionScope={allSessions ? '' : session} onSessionsChange={this.changeSessions}
                        preparedSolves={this.preparedSolves}
                        suggestedMethod={this.state.suggestedMethod}
                        suggestedSessions={this.state.suggestedSessions}
                        suggestedWindowSize={this.state.suggestedWindowSize}
                        source={this.state.source}
                        presets={this.state.currentMethod === MethodName.CFOP && <div role="group" aria-label="Solve phase" className="preset-filters">{CFOP_PRESETS.map(preset => <Button key={preset.label} aria-pressed={activePreset === preset.label} variant={activePreset === preset.label ? 'primary' : 'outline-primary'} onClick={() => this.filterPanelRef.current?.applyStepsPreset(preset.steps)}>{preset.label}</Button>)}</div>}
                        isParsing={this.state.isParsing}
                        onReady={this.logReady}
                        onMethodChange={(m) => this.setState({ currentMethod: m })}
                        onStepsChange={selectedSteps => this.setState({ selectedSteps })}
                    /></>}</SettingsContext.Consumer>
                </Container></main>
            </>
        )
    }
}