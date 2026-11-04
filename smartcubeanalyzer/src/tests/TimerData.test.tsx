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

test('chooses CSV files separately from loading their stats without reading Timer storage', async () => {
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
    expect(ref.current?.state.solves).toHaveLength(0);
    fireEvent.click(screen.getByRole('button', { name: 'Display CSV Stats' }));
    await waitFor(() => expect(ref.current?.state.solves).toHaveLength(2));
    expect(ref.current?.state.solves.every(solve => solve.source === 'cubeast')).toBe(true);
    expect(timerData).not.toHaveBeenCalled();
    expect(screen.queryByText(/Read saved Timer/)).toBeNull();
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
