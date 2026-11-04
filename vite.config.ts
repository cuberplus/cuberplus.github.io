import { createHash } from 'node:crypto';
import { cpSync, createReadStream, existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { extname, resolve, sep } from 'node:path';
import { defineConfig, transformWithEsbuild } from 'vite';
import react from '@vitejs/plugin-react';
import type { Plugin } from 'postcss';

const root = fileURLToPath(new URL('.', import.meta.url));
const scopeStyles: Plugin = {
  postcssPlugin: 'cuberplus-tool-styles',
  Rule(rule) {
    const file = rule.source?.input.file?.replaceAll('\\', '/') ?? '';
    const tool = file.includes('/scrambler/src/') ? 'scrambler' : file.includes('/smartcubeanalyzer/src/') ? 'smartcubeanalyzer' : file.includes('/src/CSS/App.css') ? 'home' : null;
    if (rule.parent?.type === 'atrule' && /keyframes$/i.test(rule.parent.name)) return;
    if (tool) rule.selectors = rule.selectors.map(selector => {
      const prefix = `:where(.site-page--${tool})`;
      return /^(?::root|html|body)(?=[\s:.#[]|$)/.test(selector)
        ? selector.replace(/^(?::root|html|body)/, prefix)
        : `${prefix} ${selector}`;
    });
    else if (file.endsWith('/timer/src/style.css')) rule.selectors = rule.selectors.map(selector =>
      /^(?::root|body|h[12])$/.test(selector) ? `:where(.site-page--timer) ${selector.replace(/^(?::root|body)$/, '').trim()}`.trim() : selector);
  },
};

export default defineConfig({
  plugins: [react({ exclude: /[/\\](?:Helpers|cube)[/\\]/ }), {
    name: 'cuberplus-pages-and-offline',
    transformIndexHtml: {
      order: 'pre',
      handler: (html, context) => context.server ? html.replace(/\s*<meta http-equiv="Content-Security-Policy"[^>]*\/>/, '') : html,
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const path = new URL(request.url ?? '/', 'http://localhost').pathname.match(/^\/(timer|smartcubeanalyzer|scrambler)\/(.+)$/);
        if (!path || path[2] === 'index.html') return next();
        let decoded: string;
        try { decoded = decodeURIComponent(path[2]); } catch { return next(); }
        const base = resolve(root, path[1], 'public'), file = resolve(base, decoded);
        if (!file.startsWith(base + sep) || !existsSync(file) || !statSync(file).isFile()) return next();
        const types: Record<string, string> = { '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css', '.csv': 'text/csv', '.png': 'image/png', '.svg': 'image/svg+xml', '.ico': 'image/x-icon' };
        response.setHeader('Content-Type', types[extname(file)] ?? 'application/octet-stream');
        createReadStream(file).pipe(response);
      });
    },
    async closeBundle() {
      const output = resolve(root, 'build'), shell = readFileSync(resolve(output, 'index.html'), 'utf8');
      for (const app of ['timer', 'smartcubeanalyzer', 'scrambler']) {
        cpSync(resolve(root, app, 'public'), resolve(output, app), { recursive: true, filter: source => !/(?:manifest[^\\/]*|index\.html)$/.test(source) });
        writeFileSync(resolve(output, app, 'index.html'), shell);
      }
      for (const size of [192, 512]) cpSync(resolve(root, 'timer', 'public', `icon-${size}.png`), resolve(output, `icon-${size}.png`));
      writeFileSync(resolve(output, '404.html'), shell);
      const assets = readdirSync(resolve(output, 'assets')).filter(file => !file.endsWith('.map')).map(file => `/assets/${file}`);
      const precache = ['/index.html', '/manifest.webmanifest', '/icon-192.png', '/icon-512.png', '/favicon.ico', '/smartcubeanalyzer/theme-init.js', '/smartcubeanalyzer/react-data-grid.css', ...assets];
      const version = createHash('sha256');
      for (const file of precache) if (existsSync(resolve(output, `.${file}`))) version.update(readFileSync(resolve(output, `.${file}`)));
      const { code } = await transformWithEsbuild(readFileSync(resolve(root, 'src', 'service-worker.ts'), 'utf8'), 'service-worker.ts', { loader: 'ts', format: 'iife' });
      const worker = code.replace('__CACHE_VERSION__', version.digest('hex').slice(0, 16)).replace('__PRECACHE__', JSON.stringify(precache));
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
      // Cubing's solver worker must not share a chunk with the DOM entrypoint.
      output: { manualChunks: { 'cubing-core': ['cubing/alg', 'cubing/kpuzzle', 'cubing/puzzles', 'cubing/scramble', 'cubing/search'] } },
    },
  },
  worker: { format: 'es' },
});
