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
    LabelledChart,
    MethodName,
    Solve,
    StepName,
    OllEdgeOrientation,
    PllCornerPermutation,
} from "../Helpers/Types";
import { Chart as ChartJS, CategoryScale, ActiveElement, ChartData, ChartEvent } from 'chart.js/auto';
import { createOptions, buildChartHtml, speedCubeDbUrl, withCaseTooltip } from "../Helpers/ChartHelpers";
import { Row, Spinner } from "react-bootstrap";
import { ThemeContext } from "../contexts/ThemeContext";
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { Const } from "../Helpers/Constants";
import DataGrid, { CellClickArgs, Column, RenderCellProps, SortColumn } from 'react-data-grid';
import 'chartjs-adapter-moment';
import { createChartWorker } from '../Workers/createChartWorker';
import { MistakeChart } from './MistakeChart';
import { Mistake, mistakeKey, mistakeLabel, mistakeWindow } from '../Helpers/MistakeAnalysis';
import { AverageModal } from './AverageModal';
import { splitIntoChunks } from '../Helpers/MathHelpers';
import { fastestByDay } from '../Helpers/ChartDataBuilders';
import type { WorkerOutput } from '../Workers/chartWorker';

const TimerReplay = React.lazy(() => import('../../../timer/src/analyzer-replay'));

ChartJS.register(CategoryScale);

/** Each watched prop is compared with !==, so only identity-comparable values belong here. */
type WatchedProp = Solve[] | number | string | boolean | MethodName;

type ThemeContextValue = { isDark?: boolean; precision?: 2 | 3 };

/** Fill the chart card / Ratio box; DataGrid defaults to ~350px without an explicit height chain. */
const chartDataGridWrapStyle: React.CSSProperties = { height: '100%', width: '100%', minHeight: 0, overflow: 'auto' };

const chartDataGridStyle: React.CSSProperties = { height: '100%' };

// A sortable header gives up part of its width to the sort arrow, so a narrow
// phone column clips the name to a character or two. Below this the grid scrolls.
const MIN_COL_WIDTH = 96;

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
    { key: 'total', name: 'Total' },
    { key: 'failed', name: 'Failed' },
    { key: 'failureRate', name: 'Failure %' },
    { key: 'avgMoves', name: 'Avg Moves' },
    { key: 'expectedMoves', name: 'Expected' },
    { key: 'avgWasted', name: 'Avg Wasted' },
    { key: 'avgTime', name: 'Avg Time (s)' },
];

/** Keep column identity stable to preserve the grid's layout and virtualisation. */
export function algoCols(step: StepName): Column<AlgoPracticeRow>[] {
    return [
        {
            key: 'case',
            name: 'Case',
            renderCell: ({ row }: RenderCellProps<AlgoPracticeRow>) => {
                const url = speedCubeDbUrl(step, row.case);
                return url === null ? row.case :
                    <a className="algo-case-link" href={url} target="_blank" rel="noopener noreferrer">{row.case}</a>;
            },
        },
        ...ALGO_STAT_COLS,
    ];
}

const ALGO_COLS_OLL = algoCols(StepName.OLL);
const ALGO_COLS_PLL = algoCols(StepName.PLL);

// ── Sortable grid ────────────────────────────────────────────────────────────

/** Matches Date.toDateString() output, which is how dates reach these grids. */
const DATE_CELL = /^\w{3} \w{3} \d{2} \d{4}$/;

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
    return collate(left, right);
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
        <DataGrid style={chartDataGridStyle} rows={sorted} columns={columns}
            sortColumns={sortColumns} onSortColumnsChange={setSortColumns}
            defaultColumnOptions={{ sortable: true, minWidth: MIN_COL_WIDTH }} onCellClick={onCellClick} />
    </div>;
}

const BEST_SOLVES_COLS = [
    { key: 'time', name: 'Time' },
    { key: 'date', name: 'Date' },
    { key: 'scramble', name: 'Scramble' },
    { key: 'id', name: 'ID' },
    { key: 'fullstep', name: 'Full Step' },
];

// ── Component ─────────────────────────────────────────────────────────────────

export class ChartPanel extends React.Component<ChartPanelProps, ChartPanelState & { _propsKey?: string }> {
    static contextType = ThemeContext;
    state: ChartPanelState & { _propsKey?: string } = { chartData: null, isComputing: false };

    static getDerivedStateFromProps(nextProps: ChartPanelProps, prevState: ChartPanelState & { _propsKey?: string }): Partial<ChartPanelState & { _propsKey?: string }> | null {
        const propsKey = `${nextProps.steps.join(',')}|${nextProps.methodName}`;
        return prevState._propsKey === propsKey ? null : { chartData: null, isComputing: true, _propsKey: propsKey };
    }

    private _worker: Worker | null = null;
    private _pendingRequestId = 0;

    /** Snapshot of the props the worker depends on; `solves` is compared by reference. */
    private _lastWatched: WatchedProp[] = [];

    private _isDark(): boolean {
        return (this.context as ThemeContextValue | undefined)?.isDark ?? false;
    }
    private _precision(): 2 | 3 { return (this.context as ThemeContextValue | undefined)?.precision ?? 2; }

    private _watched(): WatchedProp[] {
        const p = this.props;
        return [p.solves, p.windowSize, p.pointsPerGraph, p.steps.join(','), p.useLogScale,
            p.goodTime, p.badTime, p.methodName, p.use4SegmentTiming, p.chopAverages !== false, p.chopPercentage ?? 5, this._isDark(), this._precision()];
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
            windowSize: p.windowSize,
            pointsPerGraph: p.pointsPerGraph,
            steps: p.steps,
            goodTime: p.goodTime,
            badTime: p.badTime,
            methodName: p.methodName,
            use4SegmentTiming: p.use4SegmentTiming,
            isDark: this._isDark(),
            precision: this._precision(),
            chopPercentage: p.chopAverages === false ? 0 : p.chopPercentage ?? 5,
        });
    }

    componentDidMount() {
        this._worker = createChartWorker();
        this._worker.onmessage = (e: MessageEvent<WorkerOutput>) => {
            if (e.data.requestId !== this._pendingRequestId) return; // stale response
            this.setState({ chartData: e.data.chartData, isComputing: false });
        };
        this._sendWork();
    }

    componentDidUpdate() {
        if (this._propsChanged()) this._sendWork();
    }

    componentWillUnmount() {
        this._worker?.terminate();
        this._worker = null;
    }

    openSolveSource(row: Pick<FastestSolve, 'id' | 'source' | 'rawSourceId'>) {
        if (row.source === 'timer') { this.setState({ replayId: row.id }); return; }
        const url = row.source === 'acubemy' && row.rawSourceId
            ? "https://acubemy.com/shared/" + encodeURIComponent(row.rawSourceId)
            : "https://app.cubeast.com/log/solves/" + encodeURIComponent(row.id);
        window.open(url, '_blank', 'noopener,noreferrer');
    }

    selectSolves(solves: Solve[], percentage = 0, title?: string) {
        if (!solves.length) return;
        const numbers = new Map(this.props.solves.map((solve, index) => [solve, index + 1]));
        this.setState({ average: { solves, numbers: solves.map(solve => numbers.get(solve)!), percentage, title: title && `${title} (${solves.length} solves)` } });
    }

    openMistakes(mistake: Mistake) {
        this.selectSolves(mistakeWindow(this.props.solves, this.props.windowSize)
            .filter(solve => solve.mistakes?.some(item => mistakeKey(item) === mistakeKey(mistake))), 0, mistakeLabel(mistake));
    }

    openAverage(key: keyof ChartDataBundle, point?: ActiveElement) {
        const data = this.state.chartData?.[key], p = this.props;
        if (!point || !data || !('datasets' in data)) return;
        const dataset = data.datasets[point.datasetIndex], label = String(data.labels?.[point.index] ?? '');
        if (!dataset || dataset.data[point.index] == null) return;
        let solves = p.solves, percentage = p.chopAverages === false ? 0 : p.chopPercentage ?? 5;
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
            const end = Number(label);
            solves = solves.slice(end - p.windowSize, end);
        } else {
            solves = solves.filter(s => !s.dnf);
            if (key === 'inspection' || key === 'runningInspection') solves = solves.filter(s => s.inspectionTime != null);
            if (key === 'inspection') solves = splitIntoChunks(solves.slice(-p.windowSize).sort((a, b) => a.inspectionTime! - b.inspectionTime!), Const.InspectionGraphChunks)[point.index];
            else if (key === 'caseData') solves = solves.slice(-p.windowSize).filter(s => getStep(s, p.steps[0])?.case === label);
            else if (key === 'stepPercentages' || key === 'typicalCompare') {
                if (key === 'typicalCompare' && point.datasetIndex !== 0) return;
                solves = solves.slice(-p.windowSize);
            } else {
                const end = p.solves[Number(label) - 1];
                solves = solves.slice(0, solves.indexOf(end) + 1).slice(-p.windowSize);
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
                ...(y.endsWith('(s)') && key !== 'runningTps' ? { plugins: { tooltip: { callbacks: { label: (item: { dataset: { label?: string }; parsed: number | { y: number | null } }) => `${item.dataset.label}: ${Number(typeof item.parsed === 'number' ? item.parsed : item.parsed.y).toFixed(this._precision())}s` } } } } : {}),
                onClick: (_event: ChartEvent, points: ActiveElement[]) => this.openAverage(key, points[0]), ...(key === 'runningAverage' ? { spanGaps: false } : {}) };
            const chart = type === ChartType.Line ? <Line data={data as ChartData<'line', (number | null | DatedPoint)[], string>} options={options} />
                : type === ChartType.Bar ? <Bar data={data as LabelledChart<'bar', string | number>} options={key === 'caseData' ? withCaseTooltip(options, this._precision()) : options} />
                : <Doughnut data={data as LabelledChart<'doughnut'>} options={options} />;
            charts.push(buildChartHtml(chart, title, tooltip));
        };

        const hasOll = p.steps.includes(StepName.OLL);
        const hasPll = p.steps.includes(StepName.PLL);
        // Some exports record a method as one block (Acubemy does for Roux and ZZ), so
        // steps exist by name with zero times. Those charts would be flat zeroes.
        const hasStepTimings = p.solves.some(s => s.steps.some(step => step.time > 0));

        if (hasStepTimings && p.steps.length === 1 && (p.steps[0] === StepName.OLL || p.steps[0] === StepName.PLL) && c.caseData) {
            plot('caseData', "Average Recognition Time and Execution Time per Case", "This chart shows how long your execution/recognition took for any individual last layer algorithm, sorted by how long each took.", ChartType.Bar, 'Case');
            charts.push(buildChartHtml(<SortableGrid rows={c.algoPracticeRows ?? []} columns={p.steps[0] === StepName.OLL ? ALGO_COLS_OLL : ALGO_COLS_PLL} onCellClick={({ row, column }) => { if (column.key !== 'case') this.selectSolves(p.solves.filter(solve => !solve.dnf).slice(-p.windowSize).filter(solve => getStep(solve, p.steps[0])?.case === row.case), 0, `${p.steps[0]} ${row.case}`); }} />, "Algorithm Practice", "Click statistics to view contributing solves, or a case to see its algorithms on SpeedCubeDB. 'Failed' means core move count exceeded mode and average time for that case. 'Avg Wasted' shows redundant same-face moves that could be cancelled."));
        }

        plot('runningAverage', "Average Time", `Rolling average chopping ${p.chopAverages === false ? 0 : p.chopPercentage ?? 5}% per end (rounded up, retaining at least one solve). Untrimmed DNFs create gaps. Best and worst valid averages are always plotted; solve numbers mark each window's end. Record averages always use standard 5% trimming.`);
        if (hasStepTimings) plot('runningRecognitionExecution', "Average Recognition and Execution", "This chart shows your running average, split up by recognition time and execution time");
        plot('histogram', "Count of Solves by How Long They Took", "This chart shows how many solves you have done in 10s, 11s, 12s, etc...", ChartType.Bar, 'Time (s)', 'Count');
        plot('runningTps', "Average Turns Per Second", "This chart shows your average turns per second. 'TPS During Execution' only counts your TPS while actively turning the cube");
        plot('runningTurns', "Average Turns", "This chart shows your average number of turns, in quarter turn metric", ChartType.Line, 'Solve Number', 'Turns');
        charts.push(<MistakeChart key="mistakes" summary={c.mistakes} select={mistake => this.openMistakes(mistake)} />);
        plot('runningEfficiency', "Solve Efficiency", "This chart shows move efficiency ratio (after cancelling redundant same-face moves; 100% = no wasted moves), OLL/PLL success rates, and a combined solve efficiency (move efficiency minus failure rates).", ChartType.Line, 'Solve Number', 'Percentage');
        charts.push(buildChartHtml(<SortableGrid rows={c.bestSolvesData} columns={BEST_SOLVES_COLS} className="clickable-grid" onCellClick={({ row }) => this.openSolveSource(row)} />, `Top ${Const.FastestSolvesCount} Fastest Solves`, `This shows your ${Const.FastestSolvesCount} fastest solves, given the filters`));
        plot('runningStdDev', "Average Standard Deviation", "This chart shows your running average's standard deviation");
        plot('runningColorPercentages', "Percentage of Solves by Cross Color", "This chart shows what percentage of solves started with cross on White/Yellow/etc...", ChartType.Line, 'Solve Number', 'Percentage');
        plot('runningFirstPairPercentages', "First F2L Pair", "Rolling percentage of solves starting with each F2L pair's two side colors. Unknown includes simultaneous pairs, skipped pairs with no identifiable order, and exports without usable recordings.", ChartType.Line, 'Solve Number', 'Percentage');
        plot('inspection', "Average solve time by inspection time", "This chart shows your average, grouped up by how much inspection time (For example, the left bar is the 1/7 of your solves with the lowest inspection time, and the right bar is the 1/7 of your solves with the most inspection time)", ChartType.Bar, 'Inspection Time (s)', 'Solve Time (s)');
        if (hasStepTimings) plot('stepAverages', "Average Time by Step", "This chart shows what percentage of your solve each step takes");
        plot('runningInspection', "Average Inspection Time", "This chart shows how much inspection time you use on average");
        charts.push(buildChartHtml(<SortableGrid rows={c.streakRows} columns={STREAK_COLS} onCellClick={({ row }) => this.selectSolves([...fastestByDay(p.solves.filter(solve => !solve.dnf)).values()].filter(solve => row.time === 'Overall' || solve.time < Number(row.time.slice(4))), 0, `Daily best - ${row.time}`)} />, "Longest Daily Streaks", "How many days in a row you've achieved solves of each time. Click to view qualifying daily best solves."));
        plot('dailyRecord', "Daily Fastest Solve", "This chart shows the fastest solve for each day, based on the selected filters", ChartType.Line, 'Date', 'Time (s)', true, true);
        charts.push(buildChartHtml(<SortableGrid rows={c.recordRows} columns={RECORD_COLS} onCellClick={({ row }) => {
            const datasetIndex = c.recordHistory.datasets.findIndex(dataset => dataset.label === `Record ${row.recordType}`), dataset = c.recordHistory.datasets[datasetIndex];
            if (dataset?.data.length) this.openAverage('recordHistory', { datasetIndex, index: dataset.data.length - 1 } as ActiveElement);
        }} />, "Current Records", "Your current records for Single, Ao5, Ao12, Ao100, and Ao1000. Click to view the record solve or average."));

        if (hasOll) plot('ollCategory', "OLL Edge Orientation", "This chart shows your percentage of OLL cases by edge orientation", ChartType.Line, 'Solve Number', 'Percentage');
        if (hasPll) plot('pllCategory', "PLL Corner Permutation", "This chart shows your percentage of PLL cases by corner permutation", ChartType.Line, 'Solve Number', 'Percentage');

        if (hasStepTimings && p.methodName === MethodName.CFOP && p.steps.length === Const.MethodSteps[MethodName.CFOP].length) {
            plot('typicalCompare', "Time Per Step, Compared to Typical Solver", "This chart shows how long each step takes, compared to a typical solver at your average. The 'typical' data is calculated based on a tool provided from Felix Zemdegs's CubeSkills blog", ChartType.Bar, 'Step Name', 'Time (s)', false);
        }

        if (hasStepTimings && p.steps.length >= 2) {
            plot('stepPercentages', "Percentage of the Solve Each Step Took", "This chart shows what percentage of your solve each step takes", ChartType.Doughnut, '', '');
        }

        if (p.steps.length === Const.MethodSteps[p.methodName].length) {
            plot('goodBad', "Percentage of 'Good' and 'Bad' Solves", "This chart shows your running average of solves considered 'good' and 'bad'. This can be configured in the filter panel. Just set the good and bad values to times you feel are correct", ChartType.Line, 'Solve Number', 'Percentage');
            plot('recordHistory', "History of Records", "This chart shows your history of PBs. Note that this will only show solves that meet the criteria in your filters, so don't be alarmed if you don't see your PB here. As a note, Ao12 removes the best and worst solves of the 12. Ao100 removes the best and worst 5. Ao1000 removes the best and worst 50.", ChartType.Line, 'Date', 'Time (s)', true, true);
        }

        return (
            <div>
                <Row className="g-2 g-md-3">{charts}</Row>
                {this.state.average && <AverageModal {...this.state.average} close={() => this.setState({ average: undefined })} view={solve => this.openSolveSource(solve)} />}
                {this.state.replayId && <React.Suspense fallback={<Spinner role="status" animation="border" />}><TimerReplay key={this.state.replayId} id={this.state.replayId} close={() => this.setState({ replayId: undefined })} /></React.Suspense>}
            </div>
        );
    }
}
