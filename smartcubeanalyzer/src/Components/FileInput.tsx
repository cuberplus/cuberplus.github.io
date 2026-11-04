import React from "react";
import Navigation from '@cuberplus/navigation';
import { FileInputProps, FileInputState, MethodName, Solve, StepName } from "../Helpers/Types";
import { parseCsv } from "../Helpers/CsvParser";
import { FilterPanel } from "./FilterPanel";
import { GetDemoData, DEMO_DATASETS } from "../Helpers/SampleData"
import { Alert, Button, Form, FormControl, Card, Row, Col, ButtonGroup, Container, Dropdown } from "react-bootstrap";
import { HelpPanel } from "./HelpPanel";
import { CalculateMostUsedMethod, CalculateWindowSize, CalculateAllSessionOptions } from "../Helpers/CubeHelpers";
import ReactGA from 'react-ga4';

const CFOP_PRESETS: { label: string; steps: StepName[] }[] = [
    { label: 'Cross+1', steps: [StepName.Cross, StepName.F2L_1] },
    { label: 'F2L', steps: [StepName.F2L_1, StepName.F2L_2, StepName.F2L_3, StepName.F2L_4] },
    { label: 'OLL', steps: [StepName.OLL] },
    { label: 'PLL', steps: [StepName.PLL] },
    { label: 'Full', steps: [StepName.Cross, StepName.F2L_1, StepName.F2L_2, StepName.F2L_3, StepName.F2L_4, StepName.OLL, StepName.PLL] },
];

export class FileInput extends React.Component<FileInputProps, FileInputState> {
    state: FileInputState = { solves: [], showHelpModal: false, isParsing: false, currentMethod: MethodName.CFOP };

    private filterPanelRef = React.createRef<FilterPanel>();

    constructor(props: FileInputProps) {
        super(props);
        ReactGA.initialize('G-BHXNCQ3K0D');
    }

    private async loadData(read: () => Promise<Solve[]>, demo = false) {
        this.setState({ isParsing: true, loadError: undefined });
        try {
            const solves = (await read()).sort((a, b) => a.date.getTime() - b.date.getTime());
            if (!solves.length) throw new Error('No solves found in the selected data source.');
            const method = CalculateMostUsedMethod(solves);
            this.setState({
                solves, currentMethod: method, showTestAlert: demo,
                suggestedMethod: { label: method, value: method },
                suggestedSessions: CalculateAllSessionOptions(solves),
                suggestedWindowSize: CalculateWindowSize(solves.length),
            });
            ReactGA.event({ category: 'DataLoaded', action: demo ? 'Loaded Test Data' : 'Loaded User Data', value: solves.length });
        } catch (error) {
            this.setState({ loadError: error instanceof Error ? error.message : 'Unable to load solves. Please try again.' });
        } finally {
            this.setState({ isParsing: false });
        }
    }

    showFileData() {
        const files = (document.getElementById("uploaded_data") as HTMLInputElement).files;
        if (files?.length) void this.loadData(() => Promise.all(Array.from(files, file => file.text().then(csv => parseCsv(csv, ',')))).then(results => results.flat()));
    }

    showTestData(file?: string) {
        void this.loadData(() => GetDemoData(file).then(csv => parseCsv(csv, ',')), true);
    }

    showTimerData() {
        void this.loadData(async () => {
            const { readTimerData } = await import('../../../timer/src/analyzer-data');
            const csv = await readTimerData();
            if (!csv) throw new Error('No saved Timer solves found. Use Timer in this browser on this website, then try again.');
            return parseCsv(csv, ',').map(solve => ({ ...solve, source: 'timer', rawSource: 'timer' }));
        });
    }

    helpButtonClicked() {
        this.setState({ showHelpModal: true });
    }

    closeButtonClicked() {
        this.setState({ showHelpModal: false });
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
                        <Button onClick={() => { this.helpButtonClicked() }}>
                            Help
                        </Button>
                    </div>
                </header>

                <HelpPanel showHelpPanel={this.state.showHelpModal} onCloseHandler={() => this.closeButtonClicked()} />

                <Container className="container-fluid mt-2 mt-md-3">
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
                                    <Button variant="outline-secondary" aria-label="Choose CSV File" onClick={() => document.getElementById('uploaded_data')?.click()}>
                                        Choose CSV File
                                        {this.state.csvFileNames && <span className="d-block small text-truncate">{this.state.csvFileNames}</span>}
                                    </Button>
                                    <FormControl type="file" id="uploaded_data" aria-label="CSV files" className="d-none" accept=".csv" multiple onChange={event => this.setState({ csvFileNames: Array.from((event.currentTarget as HTMLInputElement).files ?? [], file => file.name).join(', ') })} />
                                    <Button disabled={this.state.isParsing} onClick={() => this.showFileData()}>{this.state.isParsing ? "Parsing..." : "Display CSV Stats"}</Button>
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