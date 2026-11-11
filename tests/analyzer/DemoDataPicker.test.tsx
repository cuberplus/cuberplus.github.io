/**
 * @jest-environment jsdom
 *
 * The demo data picker: a split button whose main half loads the original demo
 * data, and whose menu offers every dataset shipped in public/demo.
 *
 * The menu markup is worth pinning. Bootstrap's .dropdown-item is `nowrap`, so
 * an earlier version that rendered a description <div> inside each item grew the
 * menu past the viewport and left the page itself scrolling, showing only a
 * couple of entries. Each item must stay a single short label.
 */
import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { readFileSync } from 'fs';
import { join } from 'path';
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
    requested.length = 0;
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
    await waitFor(() => expect(screen.getByLabelText('Choose demo data').hasAttribute('disabled')).toBe(false));
    fireEvent.click(screen.getByLabelText('Choose demo data'));
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

describe('the demo data picker', () => {
    test('the button is labelled Demo Data, on a single line', async () => {
        render(React.createElement(FileInput));
        await screen.findByText('Demo Data');
        const button = screen.getByText('Demo Data');
        expect(button).not.toBeNull();
        // A wrapped label looked broken on narrow screens.
        expect(button.classList.contains('text-nowrap')).toBe(true);
    });

    test('clicking the button loads the original demo data', async () => {
        render(React.createElement(FileInput));
        fireEvent.click(await screen.findByText('Demo Data'));
        expect(requested).toHaveLength(1);
        expect(requested[0].endsWith(DEFAULT_DEMO_FILE)).toBe(true);
    });

    test('the menu lists every dataset, in registry order', async () => {
        await openMenu();
        const items = Array.from(document.querySelectorAll('.demo-data-menu .dropdown-item'));
        expect(items.map(i => i.firstChild?.textContent)).toEqual(DEMO_DATASETS.map(d => d.name));
    });

    test('Dev Solves is first and the rest are alphabetical', () => {
        const [first, ...rest] = DEMO_DATASETS.map(d => d.name);
        expect(first).toBe('Dev Solves');
        expect(rest).toEqual([...rest].sort((a, b) => a.localeCompare(b)));
    });

    test('each entry shows its description under the name', async () => {
        await openMenu();
        const items = Array.from(document.querySelectorAll('.demo-data-menu .dropdown-item'));
        expect(items).toHaveLength(DEMO_DATASETS.length);
        expect(items.map(i => i.querySelector('span.d-block')?.textContent))
            .toEqual(DEMO_DATASETS.map(d => d.description));
    });

    test('descriptions are inline elements, keeping the item markup valid inside a link', async () => {
        await openMenu();
        for (const item of Array.from(document.querySelectorAll('.demo-data-menu .dropdown-item'))) {
            expect(item.querySelector('div')).toBeNull();
            expect(item.querySelector('span.d-block')?.tagName).toBe('SPAN');
        }
    });

    test('the menu escapes the page clipping instead of being cut off', async () => {
        // html and body both set `overflow-x: hidden`, which clips an absolutely
        // positioned menu. Popper's fixed strategy positions against the viewport
        // instead, and the stylesheet caps the height so a long list scrolls.
        await openMenu();
        await waitFor(() => {
            const menu = document.querySelector('.demo-data-menu') as HTMLElement | null;
            expect(menu?.style.position).toBe('fixed');
        });

        const css = readFileSync(join(process.cwd(), "smartcubeanalyzer", "src", "CSS", "Style.css"), 'utf8');
        const rule = css.slice(css.indexOf('.demo-data-menu {'));
        expect(rule).toMatch(/max-height:\s*\d+vh/);
        expect(rule).toMatch(/overflow-y:\s*auto/);
        // Entries wrap via Bootstrap's .text-wrap utility rather than a custom rule.
        for (const item of Array.from(document.querySelectorAll('.demo-data-menu .dropdown-item'))) {
            expect(item.classList.contains('text-wrap')).toBe(true);
        }
    });

    test('picking an entry fetches that dataset', async () => {
        await openMenu();
        fireEvent.click(screen.getByText('Roux Small'));
        expect(requested).toHaveLength(1);
        expect(requested[0].endsWith('demo/roux-small.csv')).toBe(true);
    });
});
