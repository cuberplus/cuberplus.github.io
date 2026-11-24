import React from "react";
import {
    AlgoPracticeRow,
    ChartPanelProps,
    ChartPanelState,
    ChartDataBundle,
    ChartType,
    DatedPoint,
    FastestSolve,
    getStep,
    caseCategory,
    caseSteps,
    LabelledChart,
    MethodName,
    Solve,
    StepName,
    OllEdgeOrientation,
    PllCornerPermutation,
} from "../Models/Types";
import { Chart as ChartJS, CategoryScale, ActiveElement, ChartData, ChartEvent } from 'chart.js/auto';
import { createOptions, buildChartHtml, databaseCaseUrl, withCaseTooltip } from "../Charts/ChartHelpers";
import { Row, Spinner } from "react-bootstrap";
import { ThemeContext } from "../contexts/ThemeContext";
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Const } from "../Models/Constants";
import DataGrid, { CellClickArgs, Column, RenderCellProps, SortColumn } from 'react-data-grid';
import 'chartjs-adapter-moment';
import { createChartWorker } from '../Workers/createChartWorker';
import { MistakeChart } from './MistakeChart';
import { Mistake, mistakeKey, mistakeLabel, mistakeWindow } from '../Analysis/MistakeAnalysis';
import { AverageModal } from './AverageModal';
import { splitIntoChunks } from '../Helpers/MathHelpers';
import { fastestByDay, streakSolves } from '../Charts/ChartDataBuilders';
import { compareDurationText, formatSeconds } from '../../../shared/display';
import type { WorkerOutput } from '../Workers/chartWorker';
import { CaseModal } from '../../../src/database/CaseModal';
import { CaseThumbnail } from '../../../src/database/CaseThumbnail';
import { F2LPracticeCase } from '../../../src/database/F2LPracticeCase';
import { relativeTime } from '../../../timer/src/Data/relativeTime';
import { TOOLTIPS } from '../../../shared/tooltips';
const TimerReplay = React.lazy(() => import('../../../timer/src/Components/analyzer-replay'));

ChartJS.register(CategoryScale);
const SECTIONS: Record<string, string[]> = {
    Overview: ['Average Time', 'Current Records', 'mistakes', 'Average Recognition and Execution'],
    Progress: ['Average Time', 'Average Turns Per Second', 'Average Turns', 'Average Standard Deviation', "Percentage of 'Good' and 'Bad' Solves", 'Count of Solves by How Long They Took'],
    Technique: ['Average Recognition and Execution', 'Solve Efficiency', 'Percentage of Solves by Cross Color', 'First F2L Pair', 'Average solve time by inspection time', 'Average Time by Step', 'Average Inspection Time', 'Time Per Step, Compared to Typical Solver', 'Percentage of the Solve Each Step Took', 'mistakes'],
    Cases: ['Average Recognition Time and Execution Time per Case', 'Algorithm Practice', 'OLL Edge Orientation', 'PLL Corner Permutation'],
    Records: ['Current Records', 'History of Records', 'Longest Daily Streaks', 'Daily Fastest Solve', `Top ${Const.FastestSolvesCount} Fastest Solves`],
};
/** Each watched prop is compared with !==, so only identity-comparable values belong here. */
type WatchedProp = Solve[] | number | string | boolean | MethodName;

type ThemeContextValue = { isDark?: boolean; precision?: 2 | 3; showMinutes?: boolean; disabledMistakes?: import('../../../shared/mistakes').MistakeCategory[] };

/** Fill the chart card / Ratio box; DataGrid defaults to ~350px without an explicit height chain. */
const chartDataGridWrapStyle: React.CSSProperties = { height: '100%', width: '100%', minHeight: 0, overflow: 'auto' };

// ── Static DataGrid column definitions ───────────────────────────────────────

const STREAK_COLS = [
    { key: 'time', name: 'Target Time' },
    { key: 'currentstreak', name: 'Current Streak' },
    { key: 'longeststreak', name: 'Longest Streak' },
];

const RECORD_COLS = [
    { key: 'recordType', name: 'Record Type' },
    { key: 'time', name: 'Time (s)' },
];

const ALGO_STAT_COLS = [
    { key: 'failureRate', name: 'Failure %', width: 100 },
    { key: 'avgTime', name: 'Avg Time (s)', width: 112 },
    { key: 'failed', name: 'Failed', width: 80 },
    { key: 'total', name: 'Total', width: 72 },
    { key: 'avgMoves', name: 'Avg Moves', width: 104 },
    { key: 'expectedMoves', name: 'Expected', width: 100 },
    { key: 'avgWasted', name: 'Avg Wasted', width: 112 },
];

/** Keep column identity stable to preserve the grid's layout and virtualisation. */
export function algoCols(step: StepName, openCase: (key: string) => void = () => {}, findSolve?: (name: string) => Solve | undefined): Column<AlgoPracticeRow>[] {
    return [
        {
            key: 'case', name: 'Case', minWidth: 80, width: 'max-content',
            cellClass: 'algo-case-cell', headerCellClass: 'algo-case-cell',
            renderCell: ({ row }: RenderCellProps<AlgoPracticeRow>) => {
                if (step === StepName.F2L) return <F2LPracticeCase caseName={row.case} solve={findSolve?.(row.case)} openCase={openCase} />;
                const url = databaseCaseUrl(step, row.case);
                return url === null ? row.case :
                    <button type="button" aria-label={row.case} className="algo-case-link btn btn-link" onClick={() => openCase(url.split('#')[1])}>
                        <CaseThumbnail category={step === StepName.OLL ? 'OLL' : step === StepName.PLL ? 'PLL' : 'F2L'} id={row.case} />{row.case}
                    </button>;
            },
        },
        ...ALGO_STAT_COLS,
    ];
}


// ── Sortable grid ────────────────────────────────────────────────────────────

/** Matches Date.toDateString() output, which is how dates reach these grids. */
const DATE_CELL = /^(?:\w{3} \w{3} \d{2} \d{4}|\d{4}-\d{2}-\d{2}T)/;

/** Natural ordering for formatted times, percentages, case numbers and AoN. */
const collate = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' }).compare;

/** Everything these grids display is already formatted for the user. */
export type CellValue = string | number | undefined;

export function compareCells(a: CellValue, b: CellValue): number {
    const left = String(a ?? '');
    const right = String(b ?? '');
    // Dates are the one case the collator cannot get right, since it would
    // compare the month name alphabetically.
    if (DATE_CELL.test(left) && DATE_CELL.test(right)) return Date.parse(left) - Date.parse(right);
    return compareDurationText(left, right) ?? collate(left, right);
}

interface SortableGridProps<R> {
    rows: readonly R[];
    columns: readonly Column<R>[];
    className?: string;
    onCellClick?: (args: CellClickArgs<R>) => void;
}

/** Sort a memoised copy: react-data-grid reports sort changes but doesn't reorder rows. */
export function SortableGrid<R>({ rows, columns, className, onCellClick }: SortableGridProps<R>) {
    const [sortColumns, setSortColumns] = React.useState<readonly SortColumn[]>([]);

    const sorted = React.useMemo(() => {
        if (sortColumns.length === 0) return rows;
        const { columnKey, direction } = sortColumns[0];
        const sign = direction === 'ASC' ? 1 : -1;
        return [...rows].sort((a, b) => sign * compareCells(
            (a as Record<string, CellValue>)[columnKey],
            (b as Record<string, CellValue>)[columnKey],
        ));
    }, [rows, sortColumns]);

    return <div style={chartDataGridWrapStyle} className={className}>
        <DataGrid style={{ height: '100%' }} rows={sorted} columns={columns} rowHeight={columns[0]?.key === 'case' ? 64 : 35}
            sortColumns={sortColumns} onSortColumnsChange={setSortColumns}
            defaultColumnOptions={{ sortable: true, minWidth: columns[0]?.key === 'case' ? 64 : 96 }} onCellClick={onCellClick}
            onCellKeyDown={(args, event) => { if (onCellClick && args.mode === 'SELECT' && !(event.target instanceof Element && event.target.closest('button,a,input,select,textarea')) && (event.key === 'Enter' || event.key === ' ')) { event.preventDefault(); event.preventGridDefault(); onCellClick({ ...args, selectCell: () => {} }); } }} />
    </div>;
}

export const BEST_SOLVES_COLS: Column<FastestSolve>[] = [
    { key: 'time', name: 'Time' },
    { key: 'fullstep', name: 'Full Step' },
    { key: 'date', name: 'When', renderCell: ({ row }) => <time dateTime={row.date} title={new Date(row.date).toLocaleString()}>{relativeTime(row.date)}</time> },
];

// ── Component ─────────────────────────────────────────────────────────────────

export class ChartPanel extends React.Component<ChartPanelProps, ChartPanelState & { _propsKey?: string }> {
    static contextType = ThemeContext;
    state: ChartPanelState & { _propsKey?: string } = { chartData: null, isComputing: false };

    static getDerivedStateFromProps(nextProps: ChartPanelProps, prevState: ChartPanelState & { _propsKey?: string }): Partial<ChartPanelState & { _propsKey?: string }> | null {
        const propsKey = `${nextProps.steps.join(',')}|${nextProps.methodName}`;
        return prevState._propsKey === propsKey ? null : { chartData: null, isComputing: true, _propsKey: propsKey, section: prevState.section === 'Cases' && !caseCategory(nextProps.steps) ? 'Overview' : prevState.section };
    }

    private _worker: Worker | null = null;
    private caseColumns = new Map([StepName.OLL, StepName.PLL, StepName.F2L].map(step => [step, algoCols(step, caseKey => this.setState({ caseKey }), name => {
        const solve = this.props.solves.filter(solve => !solve.dnf).slice(-this.props.windowSize).find(solve => caseSteps(solve, StepName.F2L).some(step => step.case === name));
        return this.props.recordSolves?.find(original => original.id === solve?.id) ?? solve;
    })]));
    private _pendingRequestId = 0;
    private readyFrame = 0;

    /** Snapshot of the props the worker depends on; `solves` is compared by reference. */
    private _lastWatched: WatchedProp[] = [];

    private _isDark(): boolean {
        return (this.context as ThemeContextValue | undefined)?.isDark ?? false;
    }
    private _precision(): 2 | 3 { return (this.context as ThemeContextValue | undefined)?.precision ?? 2; }

    private _watched(): WatchedProp[] {
        const p = this.props;
        return [p.solves, p.recordSolves ?? p.solves, p.windowSize, p.pointsPerGraph, p.steps.join(','), p.useLogScale,
            p.goodTime, p.badTime, p.methodName, p.use4SegmentTiming, p.chopAverages !== false, p.chopPercentage ?? 5, this._isDark(), this._precision(), (this.context as ThemeContextValue)?.showMinutes !== false, (this.context as ThemeContextValue)?.disabledMistakes?.join(',') ?? ''];
    }

    private _propsChanged(): boolean {
        const next = this._watched();
        return next.length !== this._lastWatched.length || next.some((v, i) => v !== this._lastWatched[i]);
    }

    private _sendWork(): void {
        if (!this._worker) return;
        const p = this.props;
        this._pendingRequestId++;
        this._lastWatched = this._watched();
        this.setState({ isComputing: true, chartData: null, average: undefined });
        this._worker.postMessage({
            requestId: this._pendingRequestId,
            solves: p.solves,
            recordSolves: p.recordSolves?.map(solve => ({ ...solve, steps: [], recording: undefined, mistakes: undefined })),
            windowSize: p.windowSize,
            pointsPerGraph: p.pointsPerGraph,
            steps: p.steps,
            goodTime: p.goodTime,
            badTime: p.badTime,
            methodName: p.methodName,
            use4SegmentTiming: p.use4SegmentTiming,
            isDark: this._isDark(),
            precision: this._precision(),
            showMinutes: (this.context as ThemeContextValue)?.showMinutes, disabledMistakes: (this.context as ThemeContextValue)?.disabledMistakes,
            chopPercentage: p.chopAverages === false ? 0 : p.chopPercentage ?? 5,
        });
    }

    componentDidMount() {
        this._worker = createChartWorker();
        this._worker.onmessage = (e: MessageEvent<WorkerOutput>) => {
            if (e.data.requestId !== this._pendingRequestId) return; // stale response
            this.setState({ chartData: e.data.chartData, isComputing: false }, () => {
                const request = e.data.requestId;
                cancelAnimationFrame(this.readyFrame);
                this.readyFrame = requestAnimationFrame(() => { this.readyFrame = requestAnimationFrame(() => { if (request === this._pendingRequestId) this.props.onReady?.(); }); });
            });
        };
        this._sendWork();
    }

    componentDidUpdate() {
        if (this._propsChanged()) this._sendWork();
    }

    componentWillUnmount() {
        cancelAnimationFrame(this.readyFrame);
        this._worker?.terminate();
        this._worker = null;
    }

    openSolveSource(row: Pick<FastestSolve, 'id' | 'source' | 'rawSourceId'>) {
        this.setState({ replayId: row.id });
    }

    selectSolves(solves: Solve[], percentage = 0, title?: string) {
        if (!solves.length) return;
        const numbers = new Map((this.props.recordSolves ?? this.props.solves).map((solve, index) => [solve.id, index + 1]));
        this.setState({ average: { solves, numbers: solves.map(solve => numbers.get(solve.id)!), percentage, title: title && `${title} (${solves.length} solves)` } });
    }

    openMistakes(mistake: Mistake) {
        this.selectSolves(mistakeWindow(this.props.solves, this.props.windowSize)
            .filter(solve => solve.mistakes?.some(item => mistakeKey(item) === mistakeKey(mistake))), 0, mistakeLabel(mistake));
    }

    openAverage(key: keyof ChartDataBundle, point?: ActiveElement) {
        const data = this.state.chartData?.[key], p = this.props;
        if (!point || !data || !('datasets' in data)) return;
        const dataset = data.datasets[point.datasetIndex], label = String(data.labels?.[point.index] ?? '');
        const endingSolve = (p.recordSolves ?? p.solves)[Number(label) - 1];
        if (!dataset || dataset.data[point.index] == null) return;
        let solves = key === 'recordHistory' || key === 'dailyRecord' ? (p.recordSolves ?? p.solves).filter(solve => !solve.isCorrupt && solve.session !== 'Retries') : p.solves, percentage = p.chopAverages === false ? 0 : p.chopPercentage ?? 5;
        if (key === 'dailyRecord') {
            const solve = fastestByDay(solves.filter(solve => !solve.dnf)).get(label);
            if (solve) this.openSolveSource(solve);
            return;
        } else if (key === 'histogram') {
            this.selectSolves(solves.filter(solve => !solve.dnf).slice(-p.windowSize).filter(solve => Math.trunc(solve.time) === Number(label)), 0, `${label}s to <${Number(label) + 1}s`);
            return;
        } else if (key === 'recordHistory') {
            const window = Number(dataset.label?.match(/^Record Ao(\d+)$/)?.[1]);
            const end = (dataset.data[point.index] as DatedPoint).endIndex;
            if (dataset.label === 'Record Single' && end) { this.openSolveSource(solves[end - 1]); return; }
            if (!window || !end) return;
            solves = solves.slice(end - window, end); percentage = 5;
        } else if (key === 'runningAverage') {
            const end = solves.findIndex(solve => solve.id === endingSolve?.id) + 1;
            solves = solves.slice(end - p.windowSize, end);
        } else {
            solves = solves.filter(s => !s.dnf);
            if (key === 'inspection' || key === 'runningInspection') solves = solves.filter(s => s.inspectionTime != null);
            if (key === 'inspection') solves = splitIntoChunks(solves.slice(-p.windowSize).sort((a, b) => a.inspectionTime! - b.inspectionTime!), Const.InspectionGraphChunks)[point.index];
            else if (key === 'caseData') solves = solves.slice(-p.windowSize).filter(s => caseSteps(s, caseCategory(p.steps)!).some(step => step.case === label));
            else if (key === 'stepPercentages' || key === 'typicalCompare') {
                if (key === 'typicalCompare' && point.datasetIndex !== 0) return;
                solves = solves.slice(-p.windowSize);
            } else {
                solves = solves.slice(0, solves.findIndex(solve => solve.id === endingSolve?.id) + 1).slice(-p.windowSize);
            }
        }
        let title: string | undefined;
        if (key === 'runningColorPercentages') {
            const color = dataset.label?.match(/with (\w+) cross/)?.[1];
            solves = solves.filter(solve => solve.crossColor === color); title = `${color} cross`;
        } else if (key === 'runningFirstPairPercentages') {
            const pair = dataset.label?.replace(' / ', '/');
            solves = solves.filter(solve => (solve.firstF2LPair || 'Unknown') === pair); title = `${dataset.label} first pair`;
        } else if (key === 'goodBad') {
            solves = solves.filter(solve => point.datasetIndex === 0 ? solve.time < p.goodTime : solve.time > p.badTime);
            title = point.datasetIndex === 0 ? 'Good solves' : 'Bad solves';
        } else if (key === 'ollCategory' || key === 'pllCategory') {
            const oll = key === 'ollCategory', category = (oll ? Object.values(OllEdgeOrientation) : Object.values(PllCornerPermutation))[point.datasetIndex];
            solves = solves.filter(solve => (oll ? Const.OllEdgeOrientationMapping : Const.PllCornerPermutationMapping).get(getStep(solve, oll ? StepName.OLL : StepName.PLL)?.case ?? '') === category);
            title = `${oll ? 'OLL' : 'PLL'} ${category}`;
        }
        this.selectSolves(solves, title ? 0 : percentage, title);
    }

    render() {
        const { chartData } = this.state;
        const p = this.props;
        const isDark = this._isDark();

        if (!chartData) return <div style={{ padding: '2rem', textAlign: 'center' }}>
            <Spinner animation="border" /><div>Computing charts…</div>
        </div>;

        const c = chartData;
        const charts: JSX.Element[] = [];
        const plot = (key: keyof ChartDataBundle, title: string, tooltip: string, type = ChartType.Line, x = 'Solve Number', y = 'Time (s)', stacked = true, date = false) => {
            const data = c[key];
            if (!data || !('datasets' in data)) return;
            const options = { ...createOptions(type, x, y, p.useLogScale, stacked, date, isDark),
                ...(y.endsWith('(s)') && key !== 'runningTps' ? { plugins: { tooltip: { callbacks: { label: (item: { dataset: { label?: string }; parsed: number | { y: number | null } }) => TOOLTIPS.chartPanel.segmentTime(item.dataset.label, formatSeconds(Number(typeof item.parsed === 'number' ? item.parsed : item.parsed.y), this._precision())) } } } } : key === 'histogram' ? { plugins: { tooltip: { callbacks: { title: (items: { label: string }[]) => items.map(item => TOOLTIPS.chartPanel.duration(formatSeconds(Number(item.label), this._precision()))) } } } } : {}),
                onClick: (_event: ChartEvent, points: ActiveElement[]) => this.openAverage(key, points[0]), ...(key === 'runningAverage' ? { spanGaps: false } : {}) };
            const chart = type === ChartType.Line ? <Line aria-label={title} data={data as ChartData<'line', (number | null | DatedPoint)[], string>} options={options} />
                : type === ChartType.Bar ? <Bar aria-label={title} data={data as LabelledChart<'bar', string | number>} options={key === 'caseData' ? withCaseTooltip(options, this._precision()) : options} />
                : <Doughnut aria-label={title} data={data as LabelledChart<'doughnut'>} options={options} />;
            charts.push(buildChartHtml(chart, title, tooltip));
        };

        const hasOll = p.steps.includes(StepName.OLL);
        const hasPll = p.steps.includes(StepName.PLL);
        // Some exports record a method as one block (Acubemy does for Roux and ZZ), so
        // steps exist by name with zero times. Those charts would be flat zeroes.
        const hasStepTimings = p.solves.some(s => s.steps.some(step => step.time > 0));

        const category = caseCategory(p.steps);
        if (hasStepTimings && category && c.caseData) {
            plot('caseData', "Average Recognition Time and Execution Time per Case", TOOLTIPS.chartPanel.caseData, ChartType.Bar, 'Case');
            charts.push(buildChartHtml(<SortableGrid rows={c.algoPracticeRows ?? []} columns={this.caseColumns.get(category)!} onCellClick={({ row, column }) => { if (column.key !== 'case') this.selectSolves(p.solves.filter(solve => !solve.dnf).slice(-p.windowSize).filter(solve => column.key === 'failed' ? row.failedSolveIds.includes(solve.id) : caseSteps(solve, category).some(step => step.case === row.case)), 0, `${category} ${row.case}${column.key === 'failed' ? ' - Failed' : ''}`); }} />, "Algorithm Practice", TOOLTIPS.chartPanel.algorithmPractice));
        }

        plot('runningAverage', "Average Time", TOOLTIPS.chartPanel.runningAverage(p.chopAverages === false ? 0 : p.chopPercentage ?? 5));
        if (hasStepTimings) plot('runningRecognitionExecution', "Average Recognition and Execution", TOOLTIPS.chartPanel.runningRecognitionExecution);
        plot('histogram', "Count of Solves by How Long They Took", TOOLTIPS.chartPanel.histogram, ChartType.Bar, 'Time (s)', 'Count');
        plot('runningTps', "Average Turns Per Second", TOOLTIPS.chartPanel.runningTps);
        plot('runningTurns', "Average Turns", TOOLTIPS.chartPanel.runningTurns, ChartType.Line, 'Solve Number', 'Turns');
        charts.push(<MistakeChart key="mistakes" summary={c.mistakes} select={mistake => this.openMistakes(mistake)} />);
        plot('runningEfficiency', "Solve Efficiency", TOOLTIPS.chartPanel.runningEfficiency, ChartType.Line, 'Solve Number', 'Percentage');
        charts.push(buildChartHtml(<SortableGrid rows={c.bestSolvesData} columns={BEST_SOLVES_COLS} className="clickable-grid" onCellClick={({ row }) => this.openSolveSource(row)} />, `Top ${Const.FastestSolvesCount} Fastest Solves`, TOOLTIPS.chartPanel.fastestSolves(Const.FastestSolvesCount)));
        plot('runningStdDev', "Average Standard Deviation", TOOLTIPS.chartPanel.runningStdDev);
        plot('runningColorPercentages', "Percentage of Solves by Cross Color", TOOLTIPS.chartPanel.runningColorPercentages, ChartType.Line, 'Solve Number', 'Percentage');
        plot('runningFirstPairPercentages', "First F2L Pair", TOOLTIPS.chartPanel.runningFirstPairPercentages, ChartType.Line, 'Solve Number', 'Percentage');
        plot('inspection', "Average solve time by inspection time", TOOLTIPS.chartPanel.inspection, ChartType.Bar, 'Inspection Time (s)', 'Solve Time (s)');
        if (hasStepTimings) plot('stepAverages', "Average Time by Step", TOOLTIPS.chartPanel.stepAverages);
        plot('runningInspection', "Average Inspection Time", TOOLTIPS.chartPanel.runningInspection);
        charts.push(buildChartHtml(<SortableGrid rows={c.streakRows} columns={STREAK_COLS} onCellClick={({ row, column }) => this.selectSolves(streakSolves((p.recordSolves ?? p.solves).filter(solve => !solve.isCorrupt && solve.session !== 'Retries'), column.key === 'currentstreak' ? row.currentDays : row.bestDays), 0, `Daily best - ${row.time}`)} />, "Longest Daily Streaks", TOOLTIPS.chartPanel.longestDailyStreaks));
        plot('dailyRecord', "Daily Fastest Solve", TOOLTIPS.chartPanel.dailyRecord, ChartType.Line, 'Date', 'Time (s)', true, true);
        charts.push(buildChartHtml(<SortableGrid rows={c.recordRows} columns={RECORD_COLS} onCellClick={({ row }) => {
            const datasetIndex = c.recordHistory.datasets.findIndex(dataset => dataset.label === `Record ${row.recordType}`), dataset = c.recordHistory.datasets[datasetIndex];
            if (dataset?.data.length) this.openAverage('recordHistory', { datasetIndex, index: dataset.data.length - 1 } as ActiveElement);
        }} />, "Current Records", TOOLTIPS.chartPanel.currentRecords));

        if (hasOll) plot('ollCategory', "OLL Edge Orientation", TOOLTIPS.chartPanel.ollCategory, ChartType.Line, 'Solve Number', 'Percentage');
        if (hasPll) plot('pllCategory', "PLL Corner Permutation", TOOLTIPS.chartPanel.pllCategory, ChartType.Line, 'Solve Number', 'Percentage');

        if (hasStepTimings && p.methodName === MethodName.CFOP && p.steps.length === Const.MethodSteps[MethodName.CFOP].length) {
            plot('typicalCompare', "Time Per Step, Compared to Typical Solver", TOOLTIPS.chartPanel.typicalCompare, ChartType.Bar, 'Step Name', 'Time (s)', false);
        }

        if (hasStepTimings && p.steps.length >= 2) {
            plot('stepPercentages', "Percentage of the Solve Each Step Took", TOOLTIPS.chartPanel.stepAverages, ChartType.Doughnut, '', '');
        }

        if (p.steps.length === Const.MethodSteps[p.methodName].length) {
            plot('goodBad', "Percentage of 'Good' and 'Bad' Solves", TOOLTIPS.chartPanel.goodBad, ChartType.Line, 'Solve Number', 'Percentage');
        }
        plot('recordHistory', "History of Records", TOOLTIPS.chartPanel.recordHistory, ChartType.Line, 'Date', 'Time (s)', true, true);

        return (
            <div>
                <nav aria-label="Analysis views" className="analysis-views">{[...Object.keys(SECTIONS), 'All charts'].map(section => <button key={section} className={`btn btn-${(this.state.section ?? 'Overview') === section ? 'primary' : 'outline-primary'}`} aria-pressed={(this.state.section ?? 'Overview') === section} onClick={() => this.setState({ section })}>{section === 'All charts' ? 'All' : section}</button>)}</nav>
                {this.state.section === 'Cases' && !category && <div className="alert alert-info">Choose the F2L, OLL or PLL preset for individual case statistics.</div>}
                <Row className="g-3">{charts.filter(chart => this.state.section === 'All charts' || SECTIONS[this.state.section ?? 'Overview'].includes(String(chart.key)))}</Row>
                {this.state.average && <AverageModal {...this.state.average} close={() => this.setState({ average: undefined })} view={solve => this.openSolveSource(solve)} />}
                {this.state.replayId && <React.Suspense fallback={<Spinner role="status" animation="border" />}><TimerReplay key={this.state.replayId} id={this.state.replayId} preview={(this.props.recordSolves ?? this.props.solves).find(solve => solve.id === this.state.replayId)} close={() => this.setState({ replayId: undefined })} /></React.Suspense>}
                {this.state.caseKey && <CaseModal caseKey={this.state.caseKey} close={() => this.setState({ caseKey: undefined })} />}
            </div>
        );
    }
}
