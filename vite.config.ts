import { createHash } from 'node:crypto';
import { cpSync, createReadStream, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { extname, resolve, sep } from 'node:path';
import { gzipSync } from 'node:zlib';
import { createRequire } from 'node:module';
import { defineConfig, loadEnv, transformWithEsbuild } from 'vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'postcss';

const root = fileURLToPath(new URL('.', import.meta.url));
const gridStyles = createRequire(import.meta.url).resolve('react-data-grid/lib/styles.css');
const classicScript = async (file: string) => (await transformWithEsbuild(
  readFileSync(resolve(root, file), 'utf8'), file, { loader: 'ts', format: 'iife' })).code;
const scopeStyles: Plugin = {
  postcssPlugin: 'cuberplus-tool-styles',
  Rule(rule) {
    const file = rule.source?.input.file?.replaceAll('\\', '/') ?? '';
    const tool = file.includes('/scrambler/src/') ? 'scrambler' : file.includes('/smartcubeanalyzer/src/') ? 'smartcubeanalyzer' : file.includes('/src/Pages/Home/Style.css') ? 'home' : null;
    if (rule.parent?.type === 'atrule' && /keyframes$/i.test(rule.parent.name)) return;
    if (tool) rule.selectors = rule.selectors.map(selector => {
      const prefix = `:where(.site-page--${tool})`;
      return /^(?::root|html|body)(?=[\s:.#[]|$)/.test(selector)
        ? selector.replace(/^(?::root|html|body)/, prefix)
        : `${prefix} ${selector}`;
    });
    else if (file.endsWith('/timer/src/CSS/style.css')) rule.selectors = rule.selectors.map(selector =>
      /^(?::root|body|h[12])$/.test(selector) ? `:where(.site-page--timer) ${selector.replace(/^(?::root|body)$/, '').trim()}`.trim() : selector);
  },
};

export default defineConfig(({ mode }) => ({
  define: {
    __GOOGLE_CLIENT_ID__: JSON.stringify(loadEnv(mode, root)['VITE_GOOGLE_CLIENT_ID'] ?? ''),
    __MICROSOFT_CLIENT_ID__: JSON.stringify(loadEnv(mode, root)['VITE_MICROSOFT_CLIENT_ID'] ?? ''),
  },
  plugins: [react({ exclude: /[/\\](?:Helpers|cube)[/\\]/ }), {
    name: 'cuberplus-pages-and-offline',
    transformIndexHtml: {
      order: 'pre',
      handler: (html, context) => context.server ? html.replace(/\s*<meta http-equiv="Content-Security-Policy"[^>]*\/>/, '') : html,
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const pathname = new URL(request.url ?? '/', 'http://localhost').pathname;
        if (pathname === '/analyzer/react-data-grid.css') {
          response.setHeader('Content-Type', 'text/css');
          createReadStream(gridStyles).pipe(response);
          return;
        }
        if (pathname === '/analyzer/theme-init.js') {
          response.setHeader('Content-Type', 'text/javascript');
          void classicScript('shared/config/theme-init.ts').then(response.end.bind(response), next);
          return;
        }
        const path = new URL(request.url ?? '/', 'http://localhost').pathname.match(/^\/(timer|analyzer|scrambler)\/(.+)$/);
        if (!path || path[2] === 'index.html') return next();
        let decoded: string;
        try { decoded = decodeURIComponent(path[2]); } catch { return next(); }
        const base = resolve(root, path[1] === 'analyzer' ? 'smartcubeanalyzer' : path[1], 'public'), file = resolve(base, decoded);
        if (!file.startsWith(base + sep) || !existsSync(file) || !statSync(file).isFile()) return next();
        const types: Record<string, string> = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.csv': 'text/csv', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
        response.setHeader('Content-Type', types[extname(file)] ?? 'application/octet-stream');
        createReadStream(file).pipe(response);
      });
    },
    generateBundle() {
      // Keep the dependency's cascade layers out of the CSS minifier.
      this.emitFile({ type: 'asset', fileName: 'analyzer/react-data-grid.css', source: readFileSync(gridStyles) });
    },
    async closeBundle() {
      const output = resolve(root, 'build'), shell = readFileSync(resolve(output, 'index.html'), 'utf8');
      for (const app of ['timer', 'smartcubeanalyzer', 'scrambler']) cpSync(resolve(root, app, 'public'),
        resolve(output, app === 'smartcubeanalyzer' ? 'analyzer' : app), { recursive: true, filter: source => !/(?:manifest[^\\/]*|index\.html)$/.test(source) });
      writeFileSync(resolve(output, 'analyzer', 'theme-init.js'), await classicScript('shared/config/theme-init.ts'));
      const demos = resolve(output, 'analyzer', 'demo');
      for (const file of readdirSync(demos).filter(file => file.endsWith('.csv'))) writeFileSync(resolve(demos, `${file}.gz`), gzipSync(readFileSync(resolve(demos, file)), { level: 9 }));
      for (const page of ['timer', 'analyzer', 'scrambler', 'database', 'trainer', 'options', 'smartcubeanalyzer']) {
        mkdirSync(resolve(output, page), { recursive: true });
        writeFileSync(resolve(output, page, 'index.html'), shell);
      }
      for (const size of [192, 512]) cpSync(resolve(root, 'timer', 'public', `icon-${size}.png`), resolve(output, `icon-${size}.png`));
      writeFileSync(resolve(output, '404.html'), shell);
      const assets = readdirSync(resolve(output, 'assets')).filter(file => !file.endsWith('.map')).map(file => `/assets/${file}`);
      const caseImages = readdirSync(resolve(output, 'case-images')).filter(file => file.endsWith('.svg'))
        .sort((a, b) => Number(a.includes('-')) - Number(b.includes('-'))).map(file => `/case-images/${file}`);
      const precache = ['/index.html', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', '/favicon.ico', '/trainer-preview.svg', '/analyzer/theme-init.js', '/analyzer/react-data-grid.css', ...assets, ...caseImages];
      const version = createHash('sha256');
      for (const file of precache) if (existsSync(resolve(output, `.${file}`))) version.update(readFileSync(resolve(output, `.${file}`)));
      const worker = (await classicScript('src/pwa/service-worker.ts')).replace('__CACHE_VERSION__', version.digest('hex').slice(0, 16)).replace('__PRECACHE__', JSON.stringify(precache));
      writeFileSync(resolve(output, 'sw.js'), worker);
    },
  }],
  resolve: {
    dedupe: ['react', 'react-dom', 'cubing', 'smartcube-web-bluetooth'],
    alias: { '@cuberplus/navigation': resolve(root, 'shared', 'navigation') },
  },
  css: { postcss: { plugins: [scopeStyles] } },
  build: {
    outDir: 'build', target: 'es2022', modulePreload: false,
    rollupOptions: {
      input: { main: resolve(root, 'index.html'), auth: resolve(root, 'auth-callback.html') },
      // Keep the solver worker DOM-free and the shared preload helper independent of the cube runtime.
      output: {
        manualChunks: id => id.includes('vite/preload-helper') ? 'preload-helper' :
          /[/\\]cubing[/\\]dist[/\\]lib[/\\]cubing[/\\](alg|kpuzzle|puzzles|scramble|search)[/\\]index\.js$/.test(id) ? 'cubing-core' : undefined,
      },
    },
  },
  worker: { format: 'es' },
}));
