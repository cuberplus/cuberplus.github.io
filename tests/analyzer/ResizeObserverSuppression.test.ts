/** @jest-environment jsdom */
import { describe, expect, test } from '@jest/globals';
import { readFileSync } from 'fs';
import { join } from 'path';
import { ScriptTarget, transpileModule } from 'typescript';

/**
 * Chart.js and react-data-grid trip the browser's benign "ResizeObserver loop"
 * warning when charts resize (notably while changing filters). The dev server's
 * error overlay turns that warning into a full-screen "Uncaught runtime error",
 * so it is suppressed with a window error listener.
 *
 * The suppression relies on stopImmediatePropagation, which only silences
 * listeners registered *after* ours. The dev overlay registers its listener as
 * the bundle loads, so a suppressor living in src/index.tsx is always too late.
 * It therefore has to sit in /analyzer/theme-init.js, which index.html loads ahead
 * of the bundle. These tests guard both the behavior and that ordering, since
 * moving the listener "somewhere tidier" silently breaks it.
 */

const themeInit = transpileModule(readFileSync(join(process.cwd(), 'shared', 'config', 'theme-init.ts'), 'utf8'),
    { compilerOptions: { target: ScriptTarget.ES2022 } }).outputText;
const indexHtml = readFileSync(join(process.cwd(), 'index.html'), 'utf8');
const indexTsx = readFileSync(join(process.cwd(), 'src', 'index.tsx'), 'utf8');

const RESIZE_OBSERVER_MESSAGES = [
    'ResizeObserver loop completed with undelivered notifications.',
    'ResizeObserver loop limit exceeded',
];

/**
 * Runs the compiled theme initializer, then dispatches an error
 * event and reports whether a listener registered afterwards (standing in for
 * the dev server's overlay) still saw it.
 */
function dispatchErrorAfterThemeInit(message: string): { reachedLaterListener: boolean; defaultPrevented: boolean } {
    localStorage.clear();
    // eslint-disable-next-line no-new-func
    new Function(themeInit).call(window);

    let reachedLaterListener = false;
    const overlayListener = () => { reachedLaterListener = true; };
    window.addEventListener('error', overlayListener);

    const event = new ErrorEvent('error', { message, cancelable: true });
    window.dispatchEvent(event);
    window.removeEventListener('error', overlayListener);

    return { reachedLaterListener, defaultPrevented: event.defaultPrevented };
}

describe('ResizeObserver warning suppression', () => {
    test.each(RESIZE_OBSERVER_MESSAGES)('%s never reaches the error overlay', (message) => {
        const { reachedLaterListener, defaultPrevented } = dispatchErrorAfterThemeInit(message);
        expect(reachedLaterListener).toBe(false);
        expect(defaultPrevented).toBe(true);
    });

    test('unrelated runtime errors are still reported', () => {
        const { reachedLaterListener, defaultPrevented } = dispatchErrorAfterThemeInit('TypeError: x is not a function');
        expect(reachedLaterListener).toBe(true);
        expect(defaultPrevented).toBe(false);
    });

    test('theme-init.js defaults to Aurora before paint', () => {
        dispatchErrorAfterThemeInit('noop');
        expect(document.documentElement.getAttribute('data-theme')).toBe('aurora');
        expect(document.documentElement.getAttribute('data-bs-theme')).toBe('dark');
    });

    test.each(['light', 'dark', 'aurora', 'disco', 'inferno'])('theme-init.js preserves the saved %s theme', theme => {
        localStorage.setItem('theme', theme);
        // eslint-disable-next-line no-new-func
        new Function(themeInit).call(window);
        expect(document.documentElement.getAttribute('data-theme')).toBe(theme);
        expect(document.documentElement.getAttribute('data-bs-theme')).toBe(theme === 'light' ? 'light' : 'dark');
        localStorage.clear();
    });

    test.each(['', 'invalid', 'constructor', '__proto__'])('invalid theme %s falls back to Aurora', theme => {
        localStorage.setItem('theme', theme);
        new Function(themeInit).call(window);
        expect(document.documentElement.getAttribute('data-theme')).toBe('aurora');
        expect(document.documentElement.getAttribute('data-bs-theme')).toBe('dark');
        localStorage.clear();
    });

    test('storage failure and absent metadata never block initialization', () => {
        const getItem = jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('blocked'); });
        try {
            new Function(themeInit).call(window);
            expect(document.documentElement.getAttribute('data-theme')).toBe('aurora');
        } finally { getItem.mockRestore(); }
    });

    test.each([
        ['light', '#f3f6fa'], ['dark', '#10141e'], ['aurora', '#091e29'],
        ['disco', '#20102e'], ['inferno', '#1c0c0a'], ['invalid', '#091e29'],
    ])('sets the browser color for %s without leaking script variables', (theme, color) => {
        const meta = document.createElement('meta');
        meta.name = 'theme-color';
        document.head.append(meta);
        localStorage.setItem('theme', theme);
        const globals = Object.getOwnPropertyNames(window);
        try {
            new Function(themeInit).call(window);
            expect(meta.content).toBe(color);
            expect(Object.getOwnPropertyNames(window)).toEqual(globals);
        } finally { meta.remove(); localStorage.clear(); }
    });
});

describe('suppression is registered early enough to work', () => {
    test('the listener lives in theme-init.js, not in the bundle', () => {
        expect(themeInit).toContain('stopImmediatePropagation');
        // In src/index.tsx it would run after the overlay registers its own listener.
        expect(indexTsx).not.toContain('stopImmediatePropagation');
        expect(indexTsx).not.toContain('ResizeObserver loop');
    });

    test('index.html loads theme-init.js before the bundle', () => {
        expect(indexHtml).toContain('theme-init.js');
        const tag = indexHtml.match(/<script[^>]*src="\/analyzer\/theme-init\.js"[^>]*>/)?.[0] ?? '';
        expect(tag).not.toBe('');
        expect(tag).not.toMatch(/\s(?:async|defer|type)(?=[\s=>])/);
        expect(indexHtml.indexOf('theme-init.js')).toBeLessThan(indexHtml.indexOf('<script type="module"'));
        expect(indexHtml).not.toMatch(/<script(?![^>]*\bsrc=)[^>]*>[\s\S]*?<\/script>/);
    });
});
