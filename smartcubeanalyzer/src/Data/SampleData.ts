/**
 * The demo datasets shipped in public/demo/, and the loader for them.
 *
 * Each file is a static asset rather than bundled, so offering a choice costs a
 * download when one is picked but nothing in the main bundle. They deliberately
 * vary - both export formats, several methods, and exports with and without
 * per-step case analysis.
 */
export interface DemoDataset { id: string; name: string; description: string; file: string; }

/** Dev Solves first - it is what the button itself loads - then alphabetical. */
export const DEMO_DATASETS: DemoDataset[] = [
    { id: 'dev', name: 'Dev Solves', description: 'CFOP with full case analysis, 21,793 solves', file: 'demo/demo-solves.csv' },
    { id: 'acubemy', name: 'Acubemy', description: 'Acubemy export covering CFOP, Roux and ZZ, 10,000 solves', file: 'demo/acubemy.csv' },
    { id: 'acubemy-all', name: 'Acubemy All', description: 'Complete Acubemy history, 14,977 solves', file: 'demo/acubemy-all-solves.csv' },
    { id: 'cfop-small', name: 'CFOP Small', description: 'CFOP with full case analysis, 467 solves', file: 'demo/cfop-small.csv' },
    { id: 'cubeast-full', name: 'Cubeast Full', description: 'CFOP with full case analysis, 36,281 solves', file: 'demo/cubeast-full.csv' },
    { id: 'free-large', name: 'Free Large', description: 'Free-tier CFOP export, no case analysis, 34,243 solves', file: 'demo/free-large.csv' },
    { id: 'free-small', name: 'Free Small', description: 'Free-tier Roux and Layer by Layer export, 2,010 solves', file: 'demo/free-small.csv' },
    { id: 'roux-large', name: 'Roux Large', description: 'Roux, 896 solves', file: 'demo/roux-large.csv' },
    { id: 'roux-small', name: 'Roux Small', description: 'Roux, 10 solves', file: 'demo/roux-small.csv' },
    { id: 'unsorted', name: 'Unsorted Sample', description: 'Rows out of date order, mixed CFOP variants, 54 solves', file: 'demo/unsorted-sample.csv' },
];

/** What the button itself loads, and what the site has always shown. */
export const DEFAULT_DEMO_FILE = DEMO_DATASETS[0].file;

/**
 * Builds a URL for a file in public/, relative to the app base path so it works
 * when the app is served from root (/) or a subpath (e.g. /analyzer),
 * with or without a trailing slash.
 */
function getDemoDataUrl(file: string, pagePath: string): string {
    const pathname = pagePath.replace(/\/index\.html$/, '/');
    return `${window.location.origin}${pathname.replace(/\/?$/, '/')}${file}`;
}

export function GetDemoData(file: string = DEFAULT_DEMO_FILE, pagePath = window.location.pathname): Promise<string> {
    const url = getDemoDataUrl(file, pagePath);
    const plain = () => fetch(url, { headers: { Accept: 'text/csv' } }).then(r => {
        if (!r.ok) throw new Error('Failed to load demo data'); return r.text();
    });
    const compressed = async () => {
        const response = await fetch(`${url}.gz`);
        if (!response.ok || !response.body) throw new Error('Compressed demo unavailable');
        return response.headers.get('Content-Encoding') === 'gzip' ? response.text()
            : new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).text();
    };
    return (typeof DecompressionStream === 'undefined' ? plain() : compressed().catch(plain)).then(text => {
        // Parsing an HTML page as a CSV silently produces junk solves and empty charts.
        if (text.trimStart().startsWith('<')) throw new Error('Demo data request returned a web page instead of the CSV');
        return text;
    });
}
