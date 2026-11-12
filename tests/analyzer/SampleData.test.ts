import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { gzipSync } from 'node:zlib';
import { GetDemoData, DEFAULT_DEMO_FILE } from '../../smartcubeanalyzer/src/Data/SampleData';

/** Only the globals this suite fakes. globalThis is structurally assignable to it, so no cast is needed. */
interface TestGlobals {
    window?: { location: { origin: string; pathname: string } };
    fetch?: (url: string) => Promise<{ ok: boolean; text: () => Promise<string> }>;
}
const globalAny: TestGlobals = globalThis;
const originalWindow = globalAny.window;
const originalFetch = globalAny.fetch;
const originalDecompression = globalThis.DecompressionStream;
beforeEach(() => { Object.defineProperty(globalThis, 'DecompressionStream', { configurable: true, value: undefined }); });

function mockFetch(response: { ok: boolean; text?: string }) {
    const calls: string[] = [];
    globalAny.fetch = (url: string) => {
        calls.push(url);
        return Promise.resolve({
            ok: response.ok,
            text: () => Promise.resolve(response.text ?? ''),
        });
    };
    return calls;
}

function setWindowLocation(origin: string, pathname: string) {
    globalAny.window = { location: { origin, pathname } };
}

afterEach(() => {
    globalAny.window = originalWindow;
    globalAny.fetch = originalFetch;
    Object.defineProperty(globalThis, 'DecompressionStream', { configurable: true, value: originalDecompression });
});

describe('GetDemoData', () => {
    test('decompresses the static gzip asset without fetching the large CSV', async () => {
        Object.defineProperty(globalThis, 'DecompressionStream', { value: originalDecompression });
        setWindowLocation('https://cuberplus.com', '/analyzer/');
        const csv = 'id,time\n1,12.34';
        const fetch = jest.fn<typeof globalThis.fetch>().mockResolvedValue(new Response(new Uint8Array(gzipSync(csv)).buffer));
        globalThis.fetch = fetch;
        await expect(GetDemoData()).resolves.toBe(csv);
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith('https://cuberplus.com/analyzer/demo/demo-solves.csv.gz');
    });
    test.each(['missing', 'corrupt'])('falls back to CSV when the compressed asset is %s', async kind => {
        Object.defineProperty(globalThis, 'DecompressionStream', { value: originalDecompression });
        setWindowLocation('https://cuberplus.com', '/analyzer/');
        const fetch = jest.fn<typeof globalThis.fetch>()
            .mockResolvedValueOnce(new Response('invalid gzip', { status: kind === 'missing' ? 404 : 200 }))
            .mockResolvedValueOnce(new Response('id,time\n1,12.34'));
        globalThis.fetch = fetch;
        await expect(GetDemoData()).resolves.toBe('id,time\n1,12.34');
        expect(fetch).toHaveBeenLastCalledWith('https://cuberplus.com/analyzer/demo/demo-solves.csv', { headers: { Accept: 'text/csv' } });
    });
    test('does not decompress twice when Fetch already decoded the content encoding', async () => {
        Object.defineProperty(globalThis, 'DecompressionStream', { value: originalDecompression });
        setWindowLocation('https://cuberplus.com', '/analyzer/');
        globalThis.fetch = jest.fn<typeof globalThis.fetch>().mockResolvedValue(new Response('id,time\n1,12.34', { headers: { 'Content-Encoding': 'gzip' } }));
        await expect(GetDemoData()).resolves.toBe('id,time\n1,12.34');
    });
    test('retains the analyzer base when navigation changes during loading', async () => {
        setWindowLocation('https://cuberplus.com', '/options/');
        const calls = mockFetch({ ok: true, text: 'a,b' });
        await GetDemoData(undefined, '/analyzer/');
        expect(calls[0]).toBe('https://cuberplus.com/analyzer/demo/demo-solves.csv');
    });
    test('resolves the CSV relative to an explicit index page', async () => {
        setWindowLocation('https://cuberplus.com', '/analyzer/index.html');
        const calls = mockFetch({ ok: true, text: 'a,b' });
        await GetDemoData();
        expect(calls[0]).toBe('https://cuberplus.com/analyzer/demo/demo-solves.csv');
    });

    test('resolves the CSV relative to an index page at the site root', async () => {
        setWindowLocation('https://cuberplus.com', '/index.html');
        const calls = mockFetch({ ok: true });
        await GetDemoData();
        expect(calls[0]).toBe('https://cuberplus.com/demo/demo-solves.csv');
    });

    test('resolves the CSV relative to the page location', async () => {
        setWindowLocation('https://cuberplus.com', '/analyzer');
        const calls = mockFetch({ ok: true });
        await GetDemoData();
        expect(calls[0]).toBe('https://cuberplus.com/analyzer/demo/demo-solves.csv');
    });

    test('works when the page path already ends with a slash', async () => {
        setWindowLocation('https://cuberplus.com', '/analyzer/');
        const calls = mockFetch({ ok: true });
        await GetDemoData();
        expect(calls[0]).toBe('https://cuberplus.com/analyzer/demo/demo-solves.csv');
    });

    test('works when the app is served from the site root', async () => {
        setWindowLocation('http://localhost:3000', '/');
        const calls = mockFetch({ ok: true });
        await GetDemoData();
        expect(calls[0]).toBe('http://localhost:3000/demo/demo-solves.csv');
    });

    test('returns the CSV text on success', async () => {
        setWindowLocation('https://cuberplus.com', '/app/');
        mockFetch({ ok: true, text: 'time,date\n10,2024-01-01' });
        await expect(GetDemoData()).resolves.toBe('time,date\n10,2024-01-01');
    });

    test('rejects when the demo CSV cannot be fetched', async () => {
        setWindowLocation('https://cuberplus.com', '/app/');
        mockFetch({ ok: false });
        await expect(GetDemoData()).rejects.toThrow('Failed to load demo data');
    });

    test('fetches the dataset the picker asked for', async () => {
        setWindowLocation('https://cuberplus.com', '/analyzer/');
        const calls = mockFetch({ ok: true, text: 'a,b' });
        await GetDemoData('demo/roux-small.csv');
        expect(calls[0]).toBe('https://cuberplus.com/analyzer/demo/roux-small.csv');
    });

    test('falls back to the original demo data when no dataset is named', async () => {
        setWindowLocation('https://cuberplus.com', '/analyzer/');
        const calls = mockFetch({ ok: true, text: 'a,b' });
        await GetDemoData();
        expect(calls[0]).toBe(`https://cuberplus.com/analyzer/${DEFAULT_DEMO_FILE}`);
    });
});
