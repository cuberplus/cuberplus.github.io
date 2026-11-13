/** @jest-environment jsdom */
import React from 'react';
import { beforeEach, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PageVisible, SettingsContext, SettingsProvider } from '@cuberplus/navigation';
import { FileInput } from '../../smartcubeanalyzer/src/Components/FileInput';
import { readLocalAnalysis } from '../../timer/src/Analysis/analyzer-data';
import { readSolveIds } from '../../timer/src/Data/storage';
import { GetDemoData } from '../../smartcubeanalyzer/src/Data/SampleData';
import { parseCsv } from '../../smartcubeanalyzer/src/Data/CsvParser';
import { StepName, type FilterPanelProps, type Solve } from '../../smartcubeanalyzer/src/Models/Types';
let mockFilterProps: FilterPanelProps;

jest.mock('../../timer/src/Analysis/analyzer-data', () => ({ readLocalAnalysis: jest.fn() }));
jest.mock('../../timer/src/Data/storage', () => ({ readSolveIds: jest.fn() }));
jest.mock('../../smartcubeanalyzer/src/Data/SampleData', () => ({
    GetDemoData: jest.fn(), DEMO_DATASETS: [],
}));
jest.mock('../../smartcubeanalyzer/src/Components/FilterPanel', () => {
    const { createElement, forwardRef } = jest.requireActual<typeof import('react')>('react');
    return { FilterPanel: forwardRef((props: FilterPanelProps, _ref) => { mockFilterProps = props; return createElement('div', null, props.presets); }) };
});

const localData = jest.mocked(readLocalAnalysis);
const csv = 'id,date,dnf,time,solving_method,solving_time,one_turn_away_two_second_penalty,session_name\r\nnew,2026-01-03 00:00:00 UTC,false,14000,CFOP,12000,true,"Practice, ""Summer"""\r\nold,2026-01-01 00:00:00 UTC,true,,CFOP,,,Other\r\n';
const own = () => parseCsv(csv, ',').map(solve => ({ ...solve, source: 'timer' as const, rawSource: 'timer' }));
const file = (name: string, content = csv) => Object.assign(new File([], name), { text: () => Promise.resolve(content) });
async function ready(ref: React.RefObject<FileInput>, count = 2) {
    await waitFor(() => { expect(ref.current?.state.isParsing).toBe(false); expect(ref.current?.state.solves).toHaveLength(count); });
}
function openDataMenu() {
    const data = screen.getByRole('button', { name: 'Data', exact: true });
    if (!document.querySelector<HTMLDialogElement>('.analyzer-data-dialog')?.open) fireEvent.click(data);
}
beforeEach(() => {
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function(this: HTMLDialogElement) { this.open = true; } });
    Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: function(this: HTMLDialogElement) { this.open = false; } });
    jest.clearAllMocks(); localData.mockReset().mockResolvedValue(own()); jest.mocked(readSolveIds).mockResolvedValue(['old', 'new']); jest.mocked(GetDemoData).mockResolvedValue(csv);
});

test('Analyzer receives the shared solve limit and updates without reloading its dataset', async () => {
    localStorage.removeItem('recent-solve-limit');
    function ChangeScope() {
        const { setSolveLimit } = React.useContext(SettingsContext);
        return <button onClick={() => setSolveLimit(25000)}>Increase recent scope</button>;
    }
    const ref = React.createRef<FileInput>();
    render(<SettingsProvider><FileInput ref={ref} /><ChangeScope /></SettingsProvider>);
    await ready(ref);
    const solves = mockFilterProps.solves;
    expect(mockFilterProps.solveLimit).toBe(10000);
    fireEvent.click(screen.getByRole('button', { name: 'Increase recent scope' }));
    expect(mockFilterProps.solveLimit).toBe(25000);
    expect(mockFilterProps.solves).toBe(solves);
    expect(localData).toHaveBeenCalledTimes(1);
    localStorage.removeItem('recent-solve-limit');
});
test('increasing a capped dataset scope reloads details with the new limit', async () => {
    localStorage.setItem('recent-solve-limit', '1000');
    const solves = Array.from({ length: 1005 }, (_, i) => ({ ...own()[0], id: String(i), date: new Date(Date.UTC(2026, 0, 1, 0, 0, i)) }));
    localData.mockResolvedValue(solves);
    function ChangeScope() {
        const { setSolveLimit } = React.useContext(SettingsContext);
        return <button onClick={() => setSolveLimit(0)}>Analyze all solves</button>;
    }
    const ref = React.createRef<FileInput>();
    render(<SettingsProvider><FileInput ref={ref} /><ChangeScope /></SettingsProvider>);
    await ready(ref, 1005);
    expect(localData).toHaveBeenLastCalledWith(1000);
    fireEvent.click(screen.getByRole('button', { name: 'Analyze all solves' }));
    await waitFor(() => expect(localData).toHaveBeenLastCalledWith(0));
    await ready(ref, 1005);
    expect(mockFilterProps.solveLimit).toBe(0);
    expect(mockFilterProps.suggestedMethod).toBeUndefined();
    expect(mockFilterProps.suggestedSessions).toBeUndefined();
    expect(mockFilterProps.suggestedWindowSize).toBeUndefined();
    localStorage.removeItem('recent-solve-limit');
});

test('presets keep a visible selected state derived from the actual step filters', async () => {
    const ref = React.createRef<FileInput>();
    render(<FileInput ref={ref} />);
    await ready(ref);
    expect(Array.from(document.querySelectorAll('.preset-filters button')).map(button => button.textContent)).toEqual(['Full', 'Cross+1', 'F2L', 'OLL', 'PLL']);
    act(() => mockFilterProps.onStepsChange?.([StepName.OLL]));
    const oll = screen.getByRole('button', { name: 'OLL', exact: true });
    expect(oll.getAttribute('aria-pressed')).toBe('true');
    expect(oll.className).toContain('btn-primary');
    expect(screen.getByRole('button', { name: 'PLL', exact: true }).getAttribute('aria-pressed')).toBe('false');
    fireEvent.mouseLeave(oll);
    expect(oll.getAttribute('aria-pressed')).toBe('true');
    act(() => mockFilterProps.onStepsChange?.([StepName.OLL, StepName.PLL]));
    expect(oll.getAttribute('aria-pressed')).toBe('false');
});

test('logs load duration once after charts are ready for each dataset, not for filter-only changes or unmounts', async () => {
    const info = jest.spyOn(console, 'info').mockImplementation(() => {});
    try {
        const ref = React.createRef<FileInput>(), view = render(<FileInput ref={ref} />);
        await ready(ref);
        expect(info).not.toHaveBeenCalled();
        act(() => mockFilterProps.onReady?.());
        expect(info).toHaveBeenLastCalledWith(expect.stringMatching(/^\[Analyzer\] Loaded in [\d.]+ ms \(Saved solves, 2 solves\)$/));
        act(() => mockFilterProps.onReady?.());
        expect(info).toHaveBeenCalledTimes(1);
        fireEvent.change(screen.getByLabelText('CSV files'), { target: { files: [file('new.csv')] } });
        await ready(ref);
        act(() => mockFilterProps.onReady?.());
        expect(info).toHaveBeenLastCalledWith(expect.stringContaining('(Temporary CSV preview, 2 solves)'));
        expect(info).toHaveBeenCalledTimes(2);
        view.unmount();
        act(() => mockFilterProps.onReady?.());
        expect(info).toHaveBeenCalledTimes(2);
    } finally { info.mockRestore(); }
});
test('opening Analyzer automatically loads local data with provenance, sessions, penalties and DNFs', async () => {
    const ref = React.createRef<FileInput>();
    render(<FileInput ref={ref} />);
    await ready(ref);
    expect(ref.current!.state.solves.map(solve => solve.id)).toEqual(['old', 'new']);
    expect(ref.current!.state.solves.every(solve => solve.source === 'timer')).toBe(true);
    expect(ref.current!.state.solves[0].dnf).toBe(true);
    expect(ref.current!.state.solves[1]).toMatchObject({ time: 14, session: 'Practice, "Summer"' });
    expect(mockFilterProps.source).toBe('Saved solves');
    expect(GetDemoData).not.toHaveBeenCalled();
});

test('an empty database automatically loads Dev Solves, but manual refresh explains the empty database', async () => {
    localData.mockResolvedValue([]);
    const ref = React.createRef<FileInput>();
    render(<FileInput ref={ref} />);
    await ready(ref);
    expect(GetDemoData).toHaveBeenCalledTimes(1);
    expect(mockFilterProps.source).toBe('Demo: Dev Solves');
    openDataMenu();
    fireEvent.click(screen.getByRole('button', { name: 'My saved solves' }));
    expect((await screen.findByRole('alert')).textContent).toContain('No saved CuberPlus solves found');
    expect(ref.current!.state.solves).toHaveLength(2);
});

test('CSV selection loads all files automatically, cancelling preserves stats, and later selections replace them', async () => {
    const ref = React.createRef<FileInput>();
    render(<FileInput ref={ref} />);
    await ready(ref);
    const input = screen.getByLabelText<HTMLInputElement>('CSV files');
    const first = file('first.csv'), second = file('second.csv', csv.replace('new,', 'another,'));
    openDataMenu();
    expect(input.closest('dialog')?.open).toBe(true);
    fireEvent.change(input, { target: { files: [first, second] } });
    await ready(ref, 4);
    openDataMenu();
    expect(screen.getByRole('dialog', { name: 'Load analysis data' }).textContent).toContain('first.csv, second.csv');
    expect(ref.current!.state.solves.every(solve => solve.source === 'cubeast')).toBe(true);
    fireEvent.change(input, { target: { files: [] } });
    expect(ref.current!.state.solves).toHaveLength(4);
    fireEvent.change(input, { target: { files: [first] } });
    await ready(ref);
    expect(localData).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Display CSV Stats' })).toBeNull();
});

test('CSV reading disables competing loads and errors preserve the previous stats', async () => {
    const ref = React.createRef<FileInput>();
    render(<FileInput ref={ref} />);
    await ready(ref);
    let finish!: (value: string) => void;
    const pending = Object.assign(new File([], 'pending.csv'), { text: () => new Promise<string>(resolve => { finish = resolve; }) });
    const input = screen.getByLabelText<HTMLInputElement>('CSV files');
    fireEvent.change(input, { target: { files: [pending] } });
    expect(input.disabled).toBe(true);
    expect(screen.getByRole('button', { name: 'Loading...' }).hasAttribute('disabled')).toBe(true);
    await act(async () => finish(csv));
    await ready(ref);
    const bad = Object.assign(new File([], 'bad.csv'), { text: () => Promise.reject(new Error('File could not be read')) });
    fireEvent.change(input, { target: { files: [bad] } });
    expect((await screen.findByRole('alert')).textContent).toContain('File could not be read');
    expect(ref.current!.state.solves).toHaveLength(2);
    expect(input.disabled).toBe(false);
});

test('new solves and returning to the retained page preserve snapshots and warn until explicitly loaded', async () => {
    const imported = { ...own()[1], id: 'acubemy:new', source: 'acubemy' as const };
    localData.mockResolvedValueOnce(own()).mockResolvedValue([imported]);
    const ref = React.createRef<FileInput>();
    const view = render(<PageVisible.Provider value={true}><FileInput ref={ref} /></PageVisible.Provider>);
    await ready(ref);
    jest.mocked(readSolveIds).mockResolvedValue(['old', 'new', 'acubemy:new']);
    act(() => window.dispatchEvent(new Event('timer-solves-changed')));
    expect((await screen.findByRole('alert')).textContent).toContain('1 saved solves are not loaded');
    expect(ref.current!.state.solves).toHaveLength(2);
    view.rerender(<PageVisible.Provider value={false}><FileInput ref={ref} /></PageVisible.Provider>);
    view.rerender(<PageVisible.Provider value={true}><FileInput ref={ref} /></PageVisible.Provider>);
    await waitFor(() => expect(readSolveIds).toHaveBeenCalledTimes(2));
    expect(localData).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Load saved solves' }));
    await ready(ref, 1);
    expect(ref.current!.state.solves[0].source).toBe('acubemy');
    expect(screen.queryByRole('alert')).toBeNull();
});

test('a newer request wins and late completion after unmount is ignored', async () => {
    let finish!: (value: Solve[]) => void;
    localData.mockReturnValueOnce(new Promise(resolve => { finish = resolve; })).mockResolvedValue(own());
    const ref = React.createRef<FileInput>();
    const view = render(<FileInput ref={ref} />);
    await waitFor(() => expect(localData).toHaveBeenCalledTimes(1));
    act(() => ref.current!.showTimerData());
    await ready(ref);
    await act(async () => finish([]));
    expect(ref.current!.state.solves).toHaveLength(2);
    expect(GetDemoData).not.toHaveBeenCalled();
    localData.mockReturnValueOnce(new Promise(resolve => { finish = resolve; }));
    act(() => ref.current!.showTimerData());
    await waitFor(() => expect(localData).toHaveBeenCalledTimes(3));
    view.unmount();
    await act(async () => finish(own()));
});

test('storage failures preserve previously loaded data', async () => {
    localData.mockResolvedValueOnce(own()).mockRejectedValueOnce(new Error('Local storage is unavailable'));
    const ref = React.createRef<FileInput>();
    render(<FileInput ref={ref} />);
    await ready(ref);
    openDataMenu();
    fireEvent.click(screen.getByRole('button', { name: 'My saved solves' }));
    expect((await screen.findByRole('alert')).textContent).toContain('Local storage is unavailable');
    expect(ref.current!.state.solves).toHaveLength(2);
});
