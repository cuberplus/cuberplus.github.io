import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState, type MouseEvent, type TouchEvent } from 'react';
import { links, PageLocation, PageVisible, SettingsProvider, type Tool } from '@cuberplus/navigation';
import { useInstall } from './pwa/pwa';
import { CloudNotice } from './cloud/CloudOptions';

const pages = {
  home: lazy(() => import('./Pages/Home/Home')),
  timer: lazy(() => import('../timer/src/App')),
  smartcubeanalyzer: lazy(() => import('../smartcubeanalyzer/src/Components/App')),
  scrambler: lazy(() => import('../scrambler/src/Components/App')),
  database: lazy(() => import('./database/Database')),
  trainer: lazy(() => import('./trainer/Trainer')),
  options: lazy(() => import('./Pages/Options/Options')),
};
export function toolAt(path: string): Tool | null {
  const name = path.replace(/\/index\.html$/, '/').replace(/^\/|\/$/g, '') || 'home';
  if (name === 'analyzer') return 'smartcubeanalyzer';
  return Object.prototype.hasOwnProperty.call(pages, name) ? name as Tool : null;
}

function currentAddress() {
  if (/^\/smartcubeanalyzer(?:\/(?:index\.html)?)?$/.test(location.pathname)) history.replaceState(history.state, '', `/analyzer/${location.search}${location.hash}`);
  return location.pathname + location.search;
}

export default function Site() {
  return <SettingsProvider><Router /></SettingsProvider>;
}
function Router() {
  useInstall();
  const swipe = useRef<{ x: number; y: number; time: number; target: Element; scrollX: number; scrollY: number } | null>(null);
  const swiped = useRef<{ target: Element; time: number } | null>(null);
  const [address, setAddress] = useState(() => {
    if (toolAt(location.pathname) === 'smartcubeanalyzer') performance.mark?.('analyzer-load-start', { startTime: 0 });
    return currentAddress();
  });
  const route = toolAt(address.split('?')[0]);
  const previousRoute = useRef(route);
  const [visited, setVisited] = useState(() => route ? [route] : []);
  const change = () => {
    const address = currentAddress(), next = toolAt(location.pathname);
    setAddress(address);
    if (next) setVisited(previous => previous.includes(next) ? previous : [...previous, next]);
  };
  useEffect(() => { addEventListener('popstate', change); return () => removeEventListener('popstate', change); }, []);
  useLayoutEffect(() => {
    const shouldFocus = previousRoute.current !== route;
    previousRoute.current = route;
    document.title = route === 'home' ? 'CuberPlus | Tools for better solves' : `CuberPlus - ${links.find(([id]) => id === route)?.[2] ?? 'Page not found'}`;
    if (!route) return;
    const focusHeading = () => {
      const main = document.querySelector<HTMLElement>(`.site-page--${route} main`);
      if (!main) return false;
      const heading = main.querySelector<HTMLElement>('h1') ?? main;
      heading.id = `${route}-content`; heading.tabIndex = -1;
      if (shouldFocus) heading.focus({ preventScroll: true });
      return true;
    };
    if (focusHeading()) return;
    const observer = new MutationObserver(() => { if (focusHeading()) observer.disconnect(); });
    observer.observe(document.querySelector(`.site-page--${route}`)!, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [route]);
  function navigate(event: MouseEvent) {
    const gesture = swiped.current;
    swiped.current = null;
    if (gesture && Date.now() - gesture.time < 500 && event.target instanceof Node && gesture.target.contains(event.target)) {
      event.preventDefault(); return;
    }
    const link = event.target instanceof Element ? event.target.closest('a') : null;
    if (!link || event.defaultPrevented || event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || link.target || link.hasAttribute('download')) return;
    const url = new URL(link.href);
    if (url.origin !== location.origin || url.hash || !toolAt(url.pathname)) return;
    event.preventDefault();
    go(url.pathname + url.search);
  }
  function go(path: string) {
    if (toolAt(path.split('?')[0]) === 'smartcubeanalyzer') performance.mark?.('analyzer-load-start');
    history.pushState(null, '', path);
    change();
    window.scrollTo(0, 0);
  }
  function startSwipe(event: TouchEvent) {
    swipe.current = null;
    swiped.current = null;
    if (event.defaultPrevented || event.touches.length !== 1 || !(event.target instanceof Element) ||
      (window.visualViewport?.scale ?? 1) > 1 || window.getSelection()?.toString() || document.querySelector('dialog[open], .offcanvas.show, .modal.show')) return;
    for (let element: Element | null = event.target; element; element = element.parentElement) {
      if (element.matches('button, input, select, textarea, summary, table, [role="button"], [role="tab"], [contenteditable]:not([contenteditable="false"]), canvas, twisty-player, [role="grid"], [role="slider"], [data-no-swipe]') ||
        (element.scrollWidth > element.clientWidth && /auto|scroll/.test(getComputedStyle(element).overflowX))) return;
    }
    const touch = event.touches[0];
    if (touch.clientX > 24 && touch.clientX < innerWidth - 24) swipe.current = {
      x: touch.clientX, y: touch.clientY, time: Date.now(), target: event.target.closest('a') ?? event.target, scrollX, scrollY,
    };
  }
  function moveSwipe(event: TouchEvent) {
    const start = swipe.current, touch = event.touches[0];
    if (!start) return;
    if (event.touches.length !== 1 || !touch || Math.abs(touch.clientY - start.y) > 20 ||
      scrollX !== start.scrollX || scrollY !== start.scrollY) swipe.current = null;
  }
  function endSwipe(event: TouchEvent) {
    const start = swipe.current, touch = event.changedTouches[0];
    swipe.current = null;
    if (!start || !touch || event.touches.length || !route || Date.now() - start.time > 700 ||
      scrollX !== start.scrollX || scrollY !== start.scrollY) return;
    const dx = touch.clientX - start.x, dy = touch.clientY - start.y;
    const next = links[links.findIndex(([id]) => id === route) + (dx < 0 ? 1 : -1)];
    if (Math.abs(dx) >= 70 && Math.abs(dx) > Math.abs(dy) * 2 && next) {
      swiped.current = { target: start.target, time: Date.now() };
      event.preventDefault();
      go(next[1]);
    }
  }
  return <PageLocation.Provider value={address}>
    <div onClick={navigate} onTouchStart={startSwipe} onTouchMove={moveSwipe} onTouchEnd={endSwipe} onTouchCancel={() => { swipe.current = null; }}>
      {route && <a className="route-skip" href={`#${route}-content`}>Skip to content</a>}
      <CloudNotice />
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
