/** @jest-environment jsdom */
import { describe, expect, jest, test } from '@jest/globals';
import { fireEvent, render, screen } from '@testing-library/react';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { RenderCellProps } from 'react-data-grid';
import { algoCols } from '../../smartcubeanalyzer/src/Components/ChartPanel';
import { databaseCaseUrl } from '../../smartcubeanalyzer/src/Charts/ChartHelpers';
import { Const } from '../../smartcubeanalyzer/src/Models/Constants';
import { AlgoPracticeRow, StepName } from '../../smartcubeanalyzer/src/Models/Types';

const DATABASE_PLL_IDS = [
    'Aa', 'Ab', 'E', 'F', 'Ga', 'Gb', 'Gc', 'Gd', 'H', 'Ja', 'Jb',
    'Na', 'Nb', 'Ra', 'Rb', 'T', 'Ua', 'Ub', 'V', 'Y', 'Z',
];

function algoRow(caseName: string): AlgoPracticeRow {
    return {
        case: caseName, total: 5, failed: 1, failureRate: '20.0%',
        avgMoves: '9.0', expectedMoves: 9, avgWasted: '0.5', avgTime: '1.500',
    };
}

function renderCase(step: StepName, caseName: string): HTMLElement {
    const column = algoCols(step)[0];
    const props = { row: algoRow(caseName) } as RenderCellProps<AlgoPracticeRow>;
    const { container } = render(<>{column.renderCell?.(props)}</>);
    return container;
}

describe('databaseCaseUrl', () => {
    test('every OLL case links to its numbered database entry', () => {
        const ollNumbers = Const.OllCases.filter(c => c.value !== 'Solved');
        expect(ollNumbers).toHaveLength(57);
        for (const c of ollNumbers) {
            expect(databaseCaseUrl(StepName.OLL, c.value))
                .toBe(`/database/#OLL-${c.value}`);
        }
    });

    test('every PLL case links to its perm page', () => {
        const perms = Const.PllCases.filter(c => c.value !== 'Solved');
        for (const c of perms) {
            expect(databaseCaseUrl(StepName.PLL, c.value))
                .toBe(`/database/#PLL-${c.value}`);
        }
    });

    test('our PLL case values match the database case IDs', () => {
        const ours = Const.PllCases.filter(c => c.value !== 'Solved').map(c => c.value).sort();
        expect(ours).toEqual([...DATABASE_PLL_IDS].sort());
    });

    test('a skipped step has no algorithm page to link to', () => {
        expect(databaseCaseUrl(StepName.OLL, 'Solved')).toBeNull();
        expect(databaseCaseUrl(StepName.PLL, 'Solved')).toBeNull();
    });

    test('steps other than OLL and PLL are not linked', () => {
        expect(databaseCaseUrl(StepName.Cross, '1')).toBeNull();
        expect(databaseCaseUrl(StepName.F2L_1, 'T')).toBeNull();
    });

    test('an unrecognised case is not linked rather than guessed at', () => {
        expect(databaseCaseUrl(StepName.OLL, '58')).toBeNull();
        expect(databaseCaseUrl(StepName.OLL, '')).toBeNull();
        expect(databaseCaseUrl(StepName.PLL, 'Qq')).toBeNull();
    });

    test('a case cannot be used to point the link somewhere else', () => {
        // Cases originate in user-supplied CSVs, so they are matched against the
        // known list rather than substituted into the URL.
        expect(databaseCaseUrl(StepName.PLL, '../../evil')).toBeNull();
        expect(databaseCaseUrl(StepName.OLL, '1/../../evil')).toBeNull();
        expect(databaseCaseUrl(StepName.PLL, 'T"onmouseover="alert(1)')).toBeNull();
        expect(databaseCaseUrl(StepName.OLL, 'javascript:alert(1)')).toBeNull();
    });

    test('OLL and PLL never collide on the same URL', () => {
        const urls = [
            ...Const.OllCases.map(c => databaseCaseUrl(StepName.OLL, c.value)),
            ...Const.PllCases.map(c => databaseCaseUrl(StepName.PLL, c.value)),
        ].filter((u): u is string => u !== null);
        expect(new Set(urls).size).toBe(urls.length);
    });
});

describe('Algorithm Practice case cells', () => {
    test('a known OLL case renders as a modal button beside its image', () => {
        renderCase(StepName.OLL, '21');
        expect(screen.getByRole('button', { name: '21' })).toBeDefined();
        expect(screen.getByRole('img')).toBeDefined();
    });

    test('a known PLL case renders as a modal button', () => {
        renderCase(StepName.PLL, 'Ga');
        expect(screen.getByRole('button', { name: 'Ga' })).toBeDefined();
    });

    test('choosing a case opens the existing modal without navigating away', () => {
        const open = jest.fn(), column = algoCols(StepName.PLL, open)[0];
        render(<>{column.renderCell?.({ row: algoRow('T') } as RenderCellProps<AlgoPracticeRow>)}</>);
        fireEvent.click(screen.getByRole('button', { name: 'T' }));
        expect(open).toHaveBeenCalledWith('PLL-T');
        expect(screen.queryByRole('link')).toBeNull();
    });

    test('the link carries the class that stretches it over the whole cell', () => {
        // The click target is widened in CSS, so the hook it depends on is asserted here.
        renderCase(StepName.OLL, '7');
        expect(screen.getByRole('button', { name: '7' }).className).toContain('algo-case-link');
    });

    test('Solved renders as plain text so there is no dead link', () => {
        const container = renderCase(StepName.PLL, 'Solved');
        expect(container.textContent).toBe('Solved');
        expect(screen.queryByRole('link')).toBeNull();
    });

    test('an unknown case still shows its name, just without a link', () => {
        const container = renderCase(StepName.OLL, 'Bogus');
        expect(container.textContent).toBe('Bogus');
        expect(screen.queryByRole('link')).toBeNull();
    });
});

describe('clickable cell styling', () => {
    const css = readFileSync(join(process.cwd(), "smartcubeanalyzer", "src", "CSS", "Style.css"), 'utf8');

    function ruleFor(selector: string): string {
        const start = css.indexOf(selector);
        expect(start).toBeGreaterThan(-1);
        return css.slice(start, css.indexOf('}', start));
    }

    test('the case link fills its cell so the whole box is clickable', () => {
        const rule = ruleFor('.algo-case-link {');
        expect(rule).toContain('block-size: 100%');
        // Cancels the grid's 8px cell padding so the click target reaches the edges.
        expect(rule).toContain('margin-inline: -8px');
    });

    test('the fastest-solves grid marks its cells as clickable', () => {
        const rule = ruleFor('.clickable-grid .rdg-row .rdg-cell {');
        expect(rule).toContain('cursor: pointer');
        expect(rule).toContain('underline');
    });

    test('the fastest-solves grid is the one wired up to open solves', () => {
        const panel = readFileSync(join(process.cwd(), "smartcubeanalyzer", "src", "Components", "ChartPanel.tsx"), 'utf8');
        const grid = panel.split('\n').find(l => l.includes('onCellClick={({ row }) => this.openSolveSource(row)}'));
        expect(grid).toContain('clickable-grid');
    });
});
