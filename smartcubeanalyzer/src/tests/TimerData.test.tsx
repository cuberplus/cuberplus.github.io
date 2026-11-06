/** @jest-environment jsdom */
import React from 'react';
import { beforeEach, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { FileInput } from '../Components/FileInput';
import { readTimerData } from '../../../timer/src/analyzer-data';
import type { FilterPanelProps } from '../Helpers/Types';

jest.mock('../../../timer/src/analyzer-data', () => ({ readTimerData: jest.fn() }));
jest.mock('../Components/FilterPanel', () => {
    const { createElement, forwardRef } = jest.requireActual<typeof import('react')>('react');
    return { FilterPanel: forwardRef((_props: FilterPanelProps, _ref) => createElement('div')) };
});

const timerData = jest.mocked(readTimerData);
const csv = 'id,date,dnf,time,solving_method,solving_time,one_turn_away_two_second_penalty,session_name\r\nnew,2026-01-03 00:00:00 UTC,false,14000,CFOP,12000,true,"Practice, ""Summer"""\r\nold,2026-01-01 00:00:00 UTC,true,,CFOP,,,Other\r\n';

beforeEach(() => { timerData.mockReset(); });

test('choosing a CSV automatically loads its stats without a second button or Timer storage', async () => {
    const ref = React.createRef<FileInput>();
    render(<FileInput ref={ref} />);
    const input = screen.getByLabelText<HTMLInputElement>('CSV files');
    const choose = screen.getByRole('button', { name: 'Choose CSV File' });
    const open = jest.spyOn(input, 'click').mockImplementation(() => {});
    fireEvent.click(choose);
    expect(open).toHaveBeenCalledTimes(1);
    open.mockRestore();
    const file = Object.assign(new File([], 'my-solves.csv', { type: 'text/csv' }), { text: () => Promise.resolve(csv) });
    fireEvent.change(input, { target: { files: [file] } });
    expect(choose.textContent).toContain('my-solves.csv');
    expect(screen.queryByRole('button', { name: 'Display CSV Stats' })).toBeNull();
    await waitFor(() => expect(ref.current?.state.solves).toHaveLength(2));
    expect(ref.current?.state.solves.every(solve => solve.source === 'cubeast')).toBe(true);
    expect(timerData).not.toHaveBeenCalled();
    expect(screen.queryByText(/Read saved Timer/)).toBeNull();
});

test('multiple CSV files load together, cancelling keeps the stats, and a later selection replaces them', async () => {
    const ref = React.createRef<FileInput>();
    render(<FileInput ref={ref} />);
    const input = screen.getByLabelText<HTMLInputElement>('CSV files');
    const first = Object.assign(new File([], 'first.csv'), { text: () => Promise.resolve(csv) });
    const second = Object.assign(new File([], 'second.csv'), { text: () => Promise.resolve(csv.replace('new,', 'another,')) });
    fireEvent.change(input, { target: { files: [first, second] } });
    await waitFor(() => expect(ref.current?.state.solves).toHaveLength(4));
    expect(screen.getByRole('button', { name: 'Choose CSV File' }).textContent).toContain('first.csv, second.csv');
    fireEvent.change(input, { target: { files: [] } });
    expect(ref.current?.state.solves).toHaveLength(4);
    fireEvent.change(input, { target: { files: [first] } });
    await waitFor(() => expect(ref.current?.state.solves).toHaveLength(2));
    expect(timerData).not.toHaveBeenCalled();
});

test('CSV reading disables competing loads and reports errors without discarding previous stats', async () => {
    const ref = React.createRef<FileInput>();
    render(<FileInput ref={ref} />);
    const input = screen.getByLabelText<HTMLInputElement>('CSV files');
    let finish: (value: string) => void = () => {};
    const file = Object.assign(new File([], 'solves.csv'), { text: () => new Promise<string>(resolve => { finish = resolve; }) });
    fireEvent.change(input, { target: { files: [file] } });
    expect(screen.getByRole('button', { name: 'Choose CSV File' }).hasAttribute('disabled')).toBe(true);
    expect(screen.getByRole('button', { name: 'Choose demo data' }).hasAttribute('disabled')).toBe(true);
    expect(input.disabled).toBe(true);
    await act(async () => finish(csv));
    await waitFor(() => expect(ref.current?.state.solves).toHaveLength(2));
    const bad = Object.assign(new File([], 'bad.csv'), { text: () => Promise.reject(new Error('File could not be read')) });
    fireEvent.change(input, { target: { files: [bad] } });
    expect((await screen.findByRole('alert')).textContent).toContain('File could not be read');
    expect(ref.current?.state.solves).toHaveLength(2);
    expect(screen.getByRole('button', { name: 'Choose CSV File' }).hasAttribute('disabled')).toBe(false);
    expect(input.disabled).toBe(false);
});

test('loads Timer attempts into the analysis pipeline with provenance, sessions, penalties and DNFs', async () => {
    timerData.mockResolvedValue(csv);
    const ref = React.createRef<FileInput>();
    render(<FileInput ref={ref} />);
    fireEvent.click(screen.getByRole('button', { name: 'Display My Stats!' }));
    await waitFor(() => expect(ref.current?.state.solves).toHaveLength(2));
    const solves = ref.current!.state.solves;
    expect(solves.map(solve => solve.id)).toEqual(['old', 'new']);
    expect(solves.every(solve => solve.source === 'timer' && solve.rawSource === 'timer')).toBe(true);
    expect(solves[0].dnf).toBe(true);
    expect(solves[1]).toMatchObject({ time: 14, session: 'Practice, "Summer"' });
    expect(ref.current?.state.showTestAlert).toBe(false);
    expect(ref.current?.state.suggestedSessions?.map(session => session.value)).toContain('Practice, "Summer"');
});

test('shows an empty state and allows a later snapshot to be loaded', async () => {
    timerData.mockResolvedValueOnce('').mockResolvedValueOnce(csv);
    render(<FileInput />);
    const button = screen.getByRole('button', { name: 'Display My Stats!' });
    fireEvent.click(button);
    expect((await screen.findByRole('alert')).textContent).toContain('No saved Timer solves found');
    fireEvent.click(button);
    await waitFor(() => expect(screen.queryByRole('alert')).toBeNull());
    await waitFor(() => expect(button.getAttribute('disabled')).toBeNull());
    expect(timerData).toHaveBeenCalledTimes(2);
});

test('disables competing loads while reading and refreshes instead of appending duplicates', async () => {
    let finish: (value: string) => void = () => {};
    timerData.mockReturnValueOnce(new Promise(resolve => { finish = resolve; })).mockResolvedValueOnce(csv);
    const ref = React.createRef<FileInput>();
    render(<FileInput ref={ref} />);
    const button = screen.getByRole('button', { name: 'Display My Stats!' });
    fireEvent.click(button);
    expect(button.getAttribute('disabled')).not.toBeNull();
    expect(screen.getAllByRole('button', { name: 'Parsing...' }).every(control => control.hasAttribute('disabled'))).toBe(true);
    await act(async () => finish(csv));
    fireEvent.click(button);
    await waitFor(() => expect(timerData).toHaveBeenCalledTimes(2));
    await waitFor(() => expect(button.hasAttribute('disabled')).toBe(false));
    expect(ref.current?.state.solves).toHaveLength(2);
});

test('reports storage failures without discarding the previously loaded data', async () => {
    timerData.mockResolvedValueOnce(csv).mockRejectedValueOnce(new Error('Local storage is unavailable'));
    const ref = React.createRef<FileInput>();
    render(<FileInput ref={ref} />);
    const button = screen.getByRole('button', { name: 'Display My Stats!' });
    fireEvent.click(button);
    await waitFor(() => expect(ref.current?.state.solves).toHaveLength(2));
    fireEvent.click(button);
    expect((await screen.findByRole('alert')).textContent).toContain('Local storage is unavailable');
    expect(button.hasAttribute('disabled')).toBe(false);
    expect(ref.current?.state.solves).toHaveLength(2);
});
