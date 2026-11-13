/**
 * @jest-environment jsdom
 *
 * The Data dialog keeps saved solves, CSVs, demos, and CSV help together.
 */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { deserialize, serialize } from 'node:v8';
import React from 'react';
import { FileInput } from '../../smartcubeanalyzer/src/Components/FileInput';
import { DEMO_DATASETS, DEFAULT_DEMO_FILE } from '../../smartcubeanalyzer/src/Data/SampleData';
import { parseCsv } from '../../smartcubeanalyzer/src/Data/CsvParser';

const requested: string[] = [];
jest.mock('../../timer/src/Analysis/analyzer-data', () => ({
    readLocalAnalysis: jest.fn(async () => {
        const { parseCsv } = jest.requireActual<typeof import('../../smartcubeanalyzer/src/Data/CsvParser')>('../../smartcubeanalyzer/src/Data/CsvParser');
        return parseCsv('id,date,dnf,time,solving_method\nlocal,2024-01-01 00:00:00 UTC,false,10000,CFOP', ',');
    }),
}));

beforeEach(() => {
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function(this: HTMLDialogElement) { this.open = true; } });
    Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: function(this: HTMLDialogElement) { this.open = false; } });
    requested.length = 0;
    Object.defineProperty(globalThis, 'structuredClone', { configurable: true, value: <T,>(value: T): T => deserialize(serialize(value)) as T });
    if (!('ResizeObserver' in globalThis)) {
        Object.assign(globalThis, { ResizeObserver: class { observe() { } unobserve() { } disconnect() { } } });
    }
    if (!('CSS' in globalThis)) Object.assign(globalThis, { CSS: { supports: () => false, escape: (value: string) => value } });
    if (!('matchMedia' in globalThis)) {
        Object.assign(globalThis, {
            matchMedia: () => ({ matches: false, addListener() { }, removeListener() { }, addEventListener() { }, removeEventListener() { } }),
        });
    }
    globalThis.fetch = jest.fn((url: string | URL | Request) => {
        requested.push(String(url));
        // One well-formed solve is enough; this suite is about the picker, not parsing.
        return Promise.resolve({ ok: true, text: () => Promise.resolve('id,date,dnf,time,solving_method\nx,2024-01-01 00:00:00 UTC,false,10000,CFOP') } as Response);
    }) as typeof globalThis.fetch;
});

async function openMenu() {
    render(React.createElement(FileInput));
    await waitFor(() => expect(screen.getByRole('button', { name: 'Data', exact: true }).hasAttribute('disabled')).toBe(false));
    fireEvent.click(screen.getByRole('button', { name: 'Data', exact: true }));
}

test('deleted Timer solves leave the loaded Analyzer data without removing other sources with the same ID', async () => {
    const ref = React.createRef<FileInput>();
    const { unmount } = render(React.createElement(FileInput, { ref }));
    await waitFor(() => expect(ref.current!.state.isParsing).toBe(false));
    const [sample] = parseCsv('id,date,dnf,time,solving_method\nsame,2024-01-01 00:00:00 UTC,false,10000,CFOP', ',');
    const keep = { ...sample, id: 'keep', source: 'timer' as const }, external = { ...sample, source: 'cubeast' as const };
    act(() => ref.current!.setState({ solves: [{ ...sample, source: 'timer' }, keep, external] }));
    act(() => window.dispatchEvent(new CustomEvent('timer-solve-deleted', { detail: sample.id })));
    expect(ref.current!.state.solves).toEqual([keep, external]);
    act(() => window.dispatchEvent(new CustomEvent('timer-solve-deleted', { detail: 'keep' })));
    expect(ref.current!.state.solves).toEqual([external]);
    act(() => window.dispatchEvent(new CustomEvent('timer-solves-changed', { detail: { reanalyzed: true } })));
    expect(ref.current!.state.savedAnalysisChanged).toBe(true);
    expect(ref.current!.state.solves).toEqual([external]);
    expect(screen.getByText('Load saved solves')).not.toBeNull();
    unmount();
});

test('a session deletion removes all matching Timer solves in a single update', async () => {
    const ref = React.createRef<FileInput>();
    const { unmount } = render(React.createElement(FileInput, { ref }));
    await waitFor(() => expect(ref.current!.state.isParsing).toBe(false));
    const [sample] = parseCsv('id,date,dnf,time,solving_method\nsame,2024-01-01 00:00:00 UTC,false,10000,CFOP', ',');
    const keep = { ...sample, id: 'keep', source: 'timer' as const }, external = { ...sample, source: 'cubeast' as const };
    act(() => ref.current!.setState({ solves: [{ ...sample, source: 'timer' }, { ...sample, id: 'second', source: 'timer' }, keep, external] }));
    const update = jest.spyOn(ref.current!, 'setState');
    act(() => window.dispatchEvent(new CustomEvent('timer-solve-deleted', { detail: [sample.id, 'second'] })));
    expect(ref.current!.state.solves).toEqual([keep, external]);
    expect(update).toHaveBeenCalledTimes(1);
    unmount();
});

describe('the demo data picker', () => {
    test('source, CSV help and import actions stay inside the named Data dialog', async () => {
        render(React.createElement(FileInput));
        const button = await screen.findByRole('button', { name: 'Data', exact: true });
        await waitFor(() => expect(button.hasAttribute('disabled')).toBe(false));
        expect(screen.queryByRole('dialog')).toBeNull();
        expect(screen.queryByRole('button', { name: 'My saved solves' })).toBeNull();
        fireEvent.click(button);
        const dialog = screen.getByRole<HTMLDialogElement>('dialog', { name: 'Load analysis data' });
        expect(screen.getByRole('button', { name: 'My saved solves' })).not.toBeNull();
        expect(screen.getByLabelText('CSV files').getAttribute('type')).toBe('file');
        expect(screen.getByRole('link', { name: 'Import solves' }).getAttribute('href')).toBe('/options/#import-heading');
        expect(screen.getByText('Demo data').closest('details')?.open).toBe(false);
        const help = screen.getByText('CSV help');
        expect(help.closest('details')?.open).toBe(false);
        fireEvent.click(help);
        expect(help.closest('details')?.open).toBe(true);
        expect(screen.getByRole('link', { name: /^Export solves as CSV/ }).getAttribute('href')).toBe('https://app.cubeast.com/log/solves');
        fireEvent.click(screen.getByRole('button', { name: 'Close data' }));
        expect(dialog.open).toBe(false);
    });

    test('clicking the button loads the original demo data', async () => {
        await openMenu();
        fireEvent.click(screen.getByText('Demo data'));
        fireEvent.click(screen.getByText('Dev Solves', { exact: true }));
        expect(requested).toHaveLength(1);
        expect(requested[0].endsWith(DEFAULT_DEMO_FILE)).toBe(true);
    });

    test('the menu lists every dataset, in registry order', async () => {
        await openMenu();
        const items = Array.from(document.querySelectorAll('.analyzer-data-dialog .demo-dataset'));
        expect(items.map(i => i.firstChild?.textContent)).toEqual(DEMO_DATASETS.map(d => d.name));
    });

    test('Dev Solves is first and the rest are alphabetical', () => {
        const [first, ...rest] = DEMO_DATASETS.map(d => d.name);
        expect(first).toBe('Dev Solves');
        expect(rest).toEqual([...rest].sort((a, b) => a.localeCompare(b)));
    });

    test('each entry shows its description under the name', async () => {
        await openMenu();
        const items = Array.from(document.querySelectorAll('.analyzer-data-dialog .demo-dataset'));
        expect(items).toHaveLength(DEMO_DATASETS.length);
        expect(items.map(i => i.querySelector('span.d-block')?.textContent))
            .toEqual(DEMO_DATASETS.map(d => d.description));
    });

    test('descriptions are inline elements, keeping the item markup valid inside a link', async () => {
        await openMenu();
        for (const item of Array.from(document.querySelectorAll('.analyzer-data-dialog .demo-dataset'))) {
            expect(item.querySelector('div')).toBeNull();
            expect(item.querySelector('span.d-block')?.tagName).toBe('SPAN');
        }
    });

    test('picking an entry fetches that dataset', async () => {
        await openMenu();
        fireEvent.click(screen.getByText('Demo data'));
        fireEvent.click(screen.getByText('Roux Small'));
        expect(requested).toHaveLength(1);
        expect(requested[0].endsWith('demo/roux-small.csv')).toBe(true);
    });
});
