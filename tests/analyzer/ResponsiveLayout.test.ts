/**
 * The preset buttons must stay on one row on phones, rather than wrapping a
 * lone button. Assert the media rules and markup opt in to that layout.
 */
import { describe, expect, test } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';

const css = fs.readFileSync(path.join(process.cwd(), "smartcubeanalyzer", "src", "CSS", "Style.css"), 'utf8');
const fileInput = fs.readFileSync(path.join(process.cwd(), "smartcubeanalyzer", "src", "Components", "FileInput.tsx"), 'utf8');

/** Returns the body of the rule for `selector` inside the media query starting with `media`. */
function ruleInMedia(media: string, selector: string): string {
    // The stylesheet has several blocks per breakpoint, so keep looking until one carries the rule.
    for (let from = 0; ;) {
        const mediaStart = css.indexOf(`@media ${media}`, from);
        expect(mediaStart).toBeGreaterThan(-1);
        from = mediaStart + 1;

        // Media blocks here are one level deep, so the matching close brace is the
        // first one that returns the depth to zero.
        let depth = 0, end = css.length;
        for (let i = css.indexOf('{', mediaStart); i < css.length; i++) {
            if (css[i] === '{') depth++;
            else if (css[i] === '}' && --depth === 0) { end = i; break; }
        }

        const block = css.slice(mediaStart, end);
        const ruleStart = block.indexOf(selector);
        if (ruleStart < 0) continue;
        return block.slice(block.indexOf('{', ruleStart) + 1, block.indexOf('}', ruleStart));
    }
}

describe('preset step filters', () => {
    test('the button row opts into the responsive layout', () => {
        expect(fileInput).toContain('className="preset-filters gap-1 gap-sm-2"');
        // The old Bootstrap utility set display with !important and would win over the custom rules.
        expect(fileInput).not.toContain('d-flex flex-wrap gap-2');
    });

    test('is a plain wrapping row on anything wider than a phone', () => {
        const base = css.slice(css.indexOf('.preset-filters {'));
        const rule = base.slice(0, base.indexOf('}'));
        expect(rule).toContain('display: flex');
        expect(rule).toContain('flex-wrap: wrap');
    });

    test('stays on one row on a phone rather than wrapping a lone button', () => {
        expect(ruleInMedia('(max-width: 575.98px)', '.preset-filters {')).toContain('flex-wrap: nowrap');
    });

    test('shares the row evenly and shrinks so five buttons fit', () => {
        const rule = ruleInMedia('(max-width: 575.98px)', '.preset-filters > .btn');
        expect(rule).toContain('flex: 1 1 0');
        expect(rule).toContain('font-size: 13px');
    });

    test('has five short preset labels, which is what fitting one row depends on', () => {
        const labels = (fileInput.match(/\{ label: '[^']+'/g) ?? []).map(m => m.slice("{ label: '".length, -1));
        expect(labels).toEqual(['Cross+1', 'F2L', 'OLL', 'PLL', 'Full']);
    });
});
