/** @jest-environment jsdom */
import { describe, expect, jest, test } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ChartPanel } from '../../smartcubeanalyzer/src/Components/ChartPanel';
import { FastestSolve } from '../../smartcubeanalyzer/src/Models/Types';

/**
 * Guards the site's non-dependency security properties. These are cheap to
 * regress by accident (a stray window.open, a dropped meta tag), so they are
 * asserted rather than left to review.
 */

function solve(overrides: Partial<FastestSolve>): FastestSolve {
    return {
        time: '10.00', date: '2024-01-01', scramble: 'R U', id: 'abc',
        source: 'cubeast', fullstep: '', ...overrides,
    };
}

describe('local solve replay', () => {
    test.each([
        { id: 'solve-1' },
        { source: 'acubemy' as const, rawSourceId: 'share-1' },
        { id: '../../../evil?x=1#y' },
        { source: 'acubemy' as const, id: 'javascript:alert(1)' },
    ])('all sources and untrusted IDs stay in the native modal: %j', overrides => {
        const row = solve(overrides), setState = jest.fn(), open = jest.spyOn(window, 'open').mockReturnValue(null);
        try {
            ChartPanel.prototype.openSolveSource.call({ setState } as object as ChartPanel, row);
            expect(setState).toHaveBeenCalledWith({ replayId: row.id });
            expect(open).not.toHaveBeenCalled();
        } finally { open.mockRestore(); }
    });
});

describe('index.html security headers', () => {
    const html = readFileSync(join(process.cwd(), "index.html"), 'utf8');
    const csp = /<meta http-equiv="Content-Security-Policy" content="([^"]+)"/.exec(html)?.[1] ?? '';

    test('ships a Content-Security-Policy, since GitHub Pages cannot send headers', () => {
        expect(csp).not.toBe('');
    });

    test('blocks plugins, form posts and base-tag hijacking', () => {
        expect(csp).toContain("default-src 'self'");
        expect(csp).toContain("object-src 'none'");
        expect(csp).toContain("base-uri 'self'");
        expect(csp).toContain("form-action 'none'");
    });

    test('never allows unsafe-eval or inline script', () => {
        const scriptSrc = /script-src ([^;]+)/.exec(csp)?.[1] ?? '';
        expect(csp).not.toContain("'unsafe-eval'");
        expect(scriptSrc).not.toContain("'unsafe-inline'");
    });

    // A hash would have to be regenerated whenever the build's minifier touches
    // an inline script, so the policy forbids inline script outright instead.
    test('contains no inline script to keep script-src hash-free', () => {
        expect(/<script>[\s\S]*?<\/script>/.test(html)).toBe(false);
        expect(html).toContain('theme-init.js');
    });

    test('the theme bootstrap it loads actually exists', () => {
        const script = readFileSync(join(process.cwd(), 'shared', 'config', 'theme-init.ts'), 'utf8');
        expect(script).toContain('data-bs-theme');
    });

    // Browsers ignore frame-ancestors in a meta tag; including it only logs a warning.
    test('omits directives that are invalid in a meta tag', () => {
        expect(csp).not.toContain('frame-ancestors');
        expect(csp).not.toContain('report-uri');
    });

    test('sends a privacy-preserving referrer policy', () => {
        expect(html).toContain('name="referrer"');
        expect(html).toContain('strict-origin-when-cross-origin');
    });
});
