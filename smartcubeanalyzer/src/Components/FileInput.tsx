import React from "react";
import Navigation from '@cuberplus/navigation';
import { FileInputProps, FileInputState, MethodName, Solve, StepName } from "../Models/Types";
import { dataTask } from '../../../shared/workers/dataClient';
import type { DataTask } from '../../../shared/workers/dataTasks';
import { FilterPanel } from "./FilterPanel";
import { GetDemoData, DEMO_DATASETS } from "../Data/SampleData"
import { Alert, Button, Form, FormControl, Card, Row, Col, ButtonGroup, Container, Dropdown } from "react-bootstrap";
import { HelpPanel } from "./HelpPanel";
import { CalculateMostUsedMethod, CalculateWindowSize, CalculateAllSessionOptions } from "../Helpers/CubeHelpers";
import ReactGA from 'react-ga4';
import { PageVisible } from '@cuberplus/navigation';

const CFOP_PRESETS: { label: string; steps: StepName[] }[] = [
    { label: 'Cross+1', steps: [StepName.Cross, StepName.F2L_1] },
    { label: 'F2L', steps: [StepName.F2L_1, StepName.F2L_2, StepName.F2L_3, StepName.F2L_4] },
    { label: 'OLL', steps: [StepName.OLL] },
    { label: 'PLL', steps: [StepName.PLL] },
    { label: 'Full', steps: [StepName.Cross, StepName.F2L_1, StepName.F2L_2, StepName.F2L_3, StepName.F2L_4, StepName.OLL, StepName.PLL] },
];

export class FileInput extends React.Component<FileInputProps, FileInputState> {
    static contextType = PageVisible;
    state: FileInputState = { solves: [], showHelpModal: false, isParsing: false, currentMethod: MethodName.CFOP };

    private filterPanelRef = React.createRef<FilterPanel>();
    private requestId = 0;
    private wasVisible = true;
    private tasks = new Set<() => void>();
    private loadedIds = new Set<string>();
    private mounted = false;

    constructor(props: FileInputProps) {
        super(props);
        ReactGA.initialize('G-BHXNCQ3K0D');
    }

    private removeSolve = (event: Event) => {
        const id = (event as CustomEvent<string>).detail;
        this.setState(state => ({ solves: state.solves.filter(solve => solve.id !== id || (solve.source !== 'timer' && !solve.id.startsWith(`${solve.source}:`))) }));
    };
    private refresh = () => { void import('../../../timer/src/Data/storage').then(async ({ readSolveIds }) => {
        const ids = await readSolveIds();
        if (this.mounted) this.setState({ unloadedCount: ids.filter(id => !this.loadedIds.has(id)).length });
    }).catch(() => {}); };
    componentDidMount() { this.mounted = true; this.wasVisible = this.context !== false; window.addEventListener('timer-solve-deleted', this.removeSolve); window.addEventListener('timer-solves-changed', this.refresh); this.showTimerData(true); }
    componentDidUpdate() { const visible = this.context !== false, entering = visible && !this.wasVisible; this.wasVisible = visible; if (entering) this.refresh(); }
    componentWillUnmount() { this.mounted = false; this.requestId++; this.tasks.forEach(cancel => cancel()); window.removeEventListener('timer-solve-deleted', this.removeSolve); window.removeEventListener('timer-solves-changed', this.refresh); }
    private async read(task: DataTask): Promise<Solve[]> {
        if (!this.mounted) throw new Error('Data loading cancelled.');
        const { promise, cancel } = dataTask(task); this.tasks.add(cancel);
        try { const result = await promise; if (!('solves' in result)) throw new Error('Invalid analysis data.'); return result.solves; }
        finally { this.tasks.delete(cancel); }
    }

    private async loadData(read: (requestId: number) => Promise<Solve[]>, demo: boolean | (() => boolean) = false) {
        const requestId = ++this.requestId;
        this.tasks.forEach(cancel => cancel()); this.tasks.clear();
        this.setState({ isParsing: true, loadError: undefined });
        try {
            const solves = (await read(requestId)).sort((a, b) => a.date.getTime() - b.date.getTime());
            if (requestId !== this.requestId) return;
            if (!solves.length) throw new Error('No solves found in the selected data source.');
            const method = CalculateMostUsedMethod(solves);
            this.loadedIds = new Set(solves.map(solve => solve.id));
            this.setState({
                solves, currentMethod: method, showTestAlert: typeof demo === 'function' ? demo() : demo,
                suggestedMethod: { label: method, value: method },
                suggestedSessions: CalculateAllSessionOptions(solves),
                suggestedWindowSize: CalculateWindowSize(solves.length),
                unloadedCount: 0,
            });
            ReactGA.event({ category: 'DataLoaded', action: demo ? 'Loaded Test Data' : 'Loaded User Data', value: solves.length });
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
        })).then(results => results.flat()));
    }

    showTestData(file?: string) {
        void this.loadData(async requestId => {
            const csv = await GetDemoData(file, '/smartcubeanalyzer/');
            return requestId === this.requestId ? this.read({ type: 'parse', csv }) : [];
        }, true);
    }

    showTimerData(auto = false) {
        if (auto && (this.state.solves.length || this.state.isParsing)) return;
        let demo = false; const requestId = this.requestId + 1;
        void this.loadData(async () => {
            const solves = await this.read({ type: 'local' });
            if (requestId !== this.requestId) return [];
            if (solves.length) { this.loadedIds = new Set(solves.map(solve => solve.id)); this.setState({ unloadedCount: 0 }); return solves; }
            if (!auto) throw new Error('No saved CuberPlus solves found. Import CSVs in Options or use Timer, then try again.');
            demo = true;
            const csv = await GetDemoData(undefined, '/smartcubeanalyzer/');
            return requestId === this.requestId ? this.read({ type: 'parse', csv }) : [];
        }, () => demo);
    }

    render() {
        return (
            <div>
                <header className="header cuberplus-header">
                    <Navigation current="smartcubeanalyzer" />
                    <div className="cuberplus-header-controls">
                        {this.state.solves.length > 0 && (
                            <Button
                                variant="primary"
                                style={{ fontSize: '1.2rem', lineHeight: 1, padding: '0.35rem 0.65rem' }}
                                onClick={() => this.filterPanelRef.current?.showFilters()}
                                aria-label="Open filters"
                            >
                                &#9776;
                            </Button>
                        )}
                        <Button onClick={() => this.setState({ showHelpModal: true })}>
                            Help
                        </Button>
                    </div>
                </header>

                <HelpPanel showHelpPanel={this.state.showHelpModal} onCloseHandler={() => this.setState({ showHelpModal: false })} />

                <Container className="container-fluid mt-2 mt-md-3">
                    {!!this.state.unloadedCount && <Alert variant="warning">{this.state.unloadedCount} saved solves are not loaded. Your current data has been kept. <Button variant="outline-primary" disabled={this.state.isParsing} onClick={() => this.showTimerData()}>Load saved solves</Button></Alert>}
                    <Row className="align-items-stretch g-2 g-md-3">
                        <Col lg={6} md={12}>
                            <Card className="info-card h-100">
                                <Form className="data-controls m-2">
                                    <Button variant="success" disabled={this.state.isParsing} onClick={() => this.showTimerData()}>
                                        {this.state.isParsing ? "Parsing..." : "Display My Stats!"}
                                    </Button>
                                    <Dropdown as={ButtonGroup} className="demo-data-picker">
                                        <Button className="text-nowrap" disabled={this.state.isParsing} onClick={() => { this.showTestData(); }}>
                                            {this.state.isParsing ? "Parsing..." : "Demo Data"}
                                        </Button>
                                        <Dropdown.Toggle split id="demo-data" disabled={this.state.isParsing} aria-label="Choose demo data" />
                                        {/* Fixed positioning avoids the page's overflow clipping. */}
                                        <Dropdown.Menu align="end" className="demo-data-menu" renderOnMount popperConfig={{ strategy: 'fixed' }}>
                                            {DEMO_DATASETS.map(dataset => (
                                                <Dropdown.Item key={dataset.id} className="text-wrap" onClick={() => { this.showTestData(dataset.file); }}>
                                                    {dataset.name}
                                                    <span className="d-block small text-muted">{dataset.description}</span>
                                                </Dropdown.Item>
                                            ))}
                                        </Dropdown.Menu>
                                    </Dropdown>
                                    <Button variant="outline-secondary" style={{ gridColumn: '1 / -1' }} aria-label="Choose CSV File" disabled={this.state.isParsing} onClick={() => document.getElementById('uploaded_data')?.click()}>
                                        Choose CSV File
                                        {this.state.csvFileNames && <span className="d-block small text-truncate">{this.state.csvFileNames}</span>}
                                    </Button>
                                    <FormControl type="file" id="uploaded_data" aria-label="CSV files" className="d-none" disabled={this.state.isParsing} accept=".csv" multiple onChange={event => this.showFileData(Array.from((event.currentTarget as HTMLInputElement).files ?? []))} />
                                </Form>
                                {this.state.loadError && <Alert variant="warning" className="m-2 mt-0">{this.state.loadError}</Alert>}
                            </Card>
                        </Col>

                        {this.state.solves.length > 0 && this.state.currentMethod === MethodName.CFOP && (
                            <Col lg={6} md={12}>
                                <Card className="info-card h-100">
                                    <Card.Body>
                                        <Card.Title>Preset Step Filters</Card.Title>
                                        <div className="preset-filters gap-1 gap-sm-2">
                                            {CFOP_PRESETS.map(preset => (
                                                <Button
                                                    key={preset.label}
                                                    variant="outline-primary"
                                                    onClick={() => this.filterPanelRef.current?.applyStepsPreset(preset.steps)}
                                                >
                                                    {preset.label}
                                                </Button>
                                            ))}
                                        </div>
                                    </Card.Body>
                                </Card>
                            </Col>
                        )}
                    </Row>

                    <FilterPanel
                        ref={this.filterPanelRef}
                        solves={this.state.solves}
                        suggestedMethod={this.state.suggestedMethod}
                        suggestedSessions={this.state.suggestedSessions}
                        suggestedWindowSize={this.state.suggestedWindowSize}
                        showTestAlert={this.state.showTestAlert}
                        isParsing={this.state.isParsing}
                        onMethodChange={(m) => this.setState({ currentMethod: m })}
                    />
                </Container>
            </div >
        )
    }
}