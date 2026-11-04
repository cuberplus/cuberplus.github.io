import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState, type MouseEvent, type TouchEvent } from 'react';
import { links, PageLocation, PageVisible, SettingsProvider, type Tool } from '@cuberplus/navigation';
import { useInstall } from './pwa';

const pages = {
  home: lazy(() => import('./Components/App')),
  timer: lazy(() => import('../timer/src/App')),
  smartcubeanalyzer: lazy(() => import('../smartcubeanalyzer/src/Components/App')),
  scrambler: lazy(() => import('../scrambler/src/Components/App')),
  options: lazy(() => import('./Options')),
};
export function toolAt(path: string): Tool | null {
  const name = path.replace(/\/index\.html$/, '/').replace(/^\/|\/$/g, '') || 'home';
  return Object.prototype.hasOwnProperty.call(pages, name) ? name as Tool : null;
}

export default function Site() {
  return <SettingsProvider><Router /></SettingsProvider>;
}
function Router() {
  useInstall();
  const swipe = useRef<{ x: number; y: number; time: number } | null>(null);
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
    document.title = route === 'home' ? 'CuberPlus | Tools for better solves' : `CuberPlus - ${links.find(([id]) => id === route)?.[2] ?? 'Page not found'}`;
  }, [route]);
  function navigate(event: MouseEvent) {
    const link = event.target instanceof Element ? event.target.closest('a') : null;
    if (!link || event.defaultPrevented || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target || link.hasAttribute('download')) return;
    const url = new URL(link.href);
    if (url.origin !== location.origin || url.hash || !toolAt(url.pathname)) return;
    event.preventDefault();
    go(url.pathname + url.search);
  }
  function go(path: string) {
    history.pushState(null, '', path);
    change();
    window.scrollTo(0, 0);
  }
  function startSwipe(event: TouchEvent) {
    swipe.current = null;
    if (event.touches.length !== 1 || !(event.target instanceof Element) || document.querySelector('dialog[open], .offcanvas.show, .modal.show')) return;
    for (let element: Element | null = event.target; element; element = element.parentElement) {
      if (element.matches('a, button, input, select, textarea, summary, [contenteditable]:not([contenteditable="false"]), canvas, svg, twisty-player, [role="grid"], [role="slider"], [data-no-swipe]') ||
        (element.scrollWidth > element.clientWidth && /auto|scroll/.test(getComputedStyle(element).overflowX))) return;
    }
    const touch = event.touches[0];
    if (touch.clientX > 24 && touch.clientX < innerWidth - 24) swipe.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
  }
  function endSwipe(event: TouchEvent) {
    const start = swipe.current, touch = event.changedTouches[0];
    swipe.current = null;
    if (!start || !touch || event.touches.length || !route || Date.now() - start.time > 700) return;
    const dx = touch.clientX - start.x, dy = touch.clientY - start.y;
    const next = links[links.findIndex(([id]) => id === route) + (dx < 0 ? 1 : -1)];
    if (Math.abs(dx) >= 70 && Math.abs(dx) > Math.abs(dy) * 2 && next) go(next[1]);
  }
  return <PageLocation.Provider value={address}>
    <div onClick={navigate} onTouchStart={startSwipe} onTouchEnd={endSwipe} onTouchCancel={() => { swipe.current = null; }}>
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
  </PageLocation.Provider>;
}
