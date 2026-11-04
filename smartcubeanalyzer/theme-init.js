// Applies the saved theme before first paint so the page never flashes the
// wrong colors. Kept as a separate file (rather than inline) so the Content
// Security Policy in index.html can forbid inline script entirely: files in
// public/ are copied verbatim, so no build-time hash has to be maintained.
(function () {
    var colors = { light: '#f3f6fa', dark: '#10141e', aurora: '#091e29', disco: '#20102e', inferno: '#1c0c0a' }, stored;
    try { stored = localStorage.getItem('theme'); } catch (_) { /* Storage is optional. */ }
    var theme = Object.prototype.hasOwnProperty.call(colors, stored) ? stored : 'aurora';
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-bs-theme', theme === 'light' ? 'light' : 'dark');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', colors[theme]);
})();

// Chart.js and react-data-grid use ResizeObserver internally; this benign
// warning fires when an observer callback can't deliver notifications within a
// single animation frame. stopImmediatePropagation only silences listeners
// registered after ours, and the dev server's error overlay registers its own
// when the bundle loads, so this has to run here rather than in src/index.tsx:
// this file is loaded ahead of the bundle.
window.addEventListener('error', function (e) {
    if (e.message === 'ResizeObserver loop completed with undelivered notifications.'
        || e.message === 'ResizeObserver loop limit exceeded') {
        e.stopImmediatePropagation();
        e.preventDefault();
    }
});
