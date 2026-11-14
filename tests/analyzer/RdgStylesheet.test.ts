import { describe, expect, test } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * react-data-grid's stylesheet is served and emitted raw instead of imported,
 * because the production CSS minifier merges its @layer blocks and drops
 * declarations - it gave the sortable-header classes the column-resize-handle
 * rule and merged the measuring cell into the ordinary cell, which collapsed
 * every grid header to a single character on the live site while the dev server
 * looked fine. The tooling integration test verifies that both the development
 * response and production asset match the installed dependency byte for byte.
 */

const ROOT = join(process.cwd(), "smartcubeanalyzer");
const PACKAGED = join(ROOT, '..', 'node_modules', 'react-data-grid', 'lib', 'styles.css');
const INDEX_HTML = join(ROOT, '..', 'index.html');
const CHART_PANEL = join(ROOT, 'src', 'Components', 'ChartPanel.tsx');

describe('the unprocessed react-data-grid stylesheet', () => {
    test('is linked from index.html at its original standalone URL', () => {
        const html = readFileSync(INDEX_HTML, 'utf8');
        expect(html).toContain('/analyzer/react-data-grid.css');
    });

    test('keeps public asset URLs from being rebased twice in development', () => {
        const html = readFileSync(INDEX_HTML, 'utf8');
        const tags = html.match(/<(?:link|script)\b[^>]*(?:href|src)="\/analyzer\/[^"]+"[^>]*>/g) ?? [];
        expect(tags).toHaveLength(2);
        for (const tag of tags) expect(tag).toContain('vite-ignore');
    });

    test('is not also imported, which would reintroduce the minified copy', () => {
        expect(readFileSync(CHART_PANEL, 'utf8')).not.toContain('react-data-grid/lib/styles.css');
    });

    test('still contains the header rules the minifier was destroying', () => {
        const css = readFileSync(PACKAGED, 'utf8');
        // The sortable header lays its name out with flex; the measuring cell has
        // to stay hidden or it takes up a column and pushes the headers sideways.
        expect(css).toContain('rdg.SortableHeaderCell');
        expect(css).toContain('rdg.MeasuringCell');
        expect(css).toMatch(/rdg\.MeasuringCell\s*\{[^}]*visibility:\s*hidden/);
    });
});
