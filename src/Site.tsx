import { lazy, Suspense, useEffect, useLayoutEffect, useState, type MouseEvent } from 'react';
import { HeaderActions, PageLocation, PageVisible, type Tool } from '@cuberplus/navigation';
import { InstallControl } from './pwa';

const pages = {
  home: lazy(() => import('./Components/App')),
  timer: lazy(() => import('../timer/src/App')),
  smartcubeanalyzer: lazy(() => import('../smartcubeanalyzer/src/Components/App')),
  scrambler: lazy(() => import('../scrambler/src/Components/App')),
};
export function toolAt(path: string): Tool | null {
  const name = path.replace(/\/index\.html$/, '/').replace(/^\/|\/$/g, '') || 'home';
  return Object.prototype.hasOwnProperty.call(pages, name) ? name as Tool : null;
}

export default function Site() {
  const [address, setAddress] = useState(() => location.pathname + location.search);
  const route = toolAt(address.split('?')[0]);
  const [visited, setVisited] = useState(() => route ? [route] : []);
  const change = () => {
    const next = toolAt(location.pathname);
    setAddress(location.pathname + location.search);
    if (next) setVisited(previous => previous.includes(next) ? previous : [...previous, next]);
  };
  useEffect(() => { addEventListener('popstate', change); return () => removeEventListener('popstate', change); }, []);
  useLayoutEffect(() => {
    let theme = 'dark';
    try { if (route === 'smartcubeanalyzer' && localStorage.getItem('theme') === 'light') theme = 'light'; } catch { /* Keep the default theme. */ }
    document.documentElement.dataset.bsTheme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#10141e' : '#f3f6fa');
    document.title = route === 'home' ? 'CuberPlus | Tools for better solves' : `CuberPlus - ${route === 'smartcubeanalyzer' ? 'Smartcube Analyzer' : route === 'timer' ? 'Timer' : 'Scrambler'}`;
  }, [route]);
  function navigate(event: MouseEvent) {
    const link = event.target instanceof Element ? event.target.closest('a') : null;
    if (!link || event.defaultPrevented || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target || link.hasAttribute('download')) return;
    const url = new URL(link.href);
    if (url.origin !== location.origin || url.hash || !toolAt(url.pathname)) return;
    event.preventDefault();
    history.pushState(null, '', url.pathname + url.search);
    change();
    window.scrollTo(0, 0);
  }
  return <PageLocation.Provider value={address}><HeaderActions.Provider value={<InstallControl />}>
    <div onClick={navigate}>
      {!route && <main><h1>Page not found</h1><a href="/">CuberPlus home</a></main>}
      {visited.map(tool => {
        const Page = pages[tool], visible = route === tool;
        return <PageVisible.Provider key={tool} value={visible}>
          <div className={`site-page--${tool}`} hidden={!visible}>
            <Suspense fallback={<p role="status">Loading {tool === 'smartcubeanalyzer' ? 'Analyzer' : tool}...</p>}><Page /></Suspense>
          </div>
        </PageVisible.Provider>;
      })}
    </div>
  </HeaderActions.Provider></PageLocation.Provider>;
}
