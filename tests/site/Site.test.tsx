import { useContext, useEffect, useRef, useState } from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import Navigation, { PageVisible, SettingsContext, usePageDialog } from '@cuberplus/navigation';
import Site, { toolAt } from '../../src/Site';

const lifecycle = { mounts: 0, unmounts: 0 };
jest.mock('../../timer/src/Bluetooth/bluetooth', () => ({ BluetoothCube: class {} }));
jest.mock('../../src/Pages/Home/Home', () => ({ __esModule: true, default: () => <><Navigation current="home" /><main><h1>Home</h1><a href="/timer/?solve=one">Shared solve<svg aria-hidden="true"><path /></svg></a><a href="https://example.com/timer/">External</a><input aria-label="Control" /></main></> }));
jest.mock('../../smartcubeanalyzer/src/Components/App', () => ({ __esModule: true, default: () => <><Navigation current="smartcubeanalyzer" /><main><h1>Analyzer</h1></main></> }));
jest.mock('../../scrambler/src/Components/App', () => ({ __esModule: true, default: () => <Navigation current="scrambler" /> }));
jest.mock('../../src/database/Database', () => ({ __esModule: true, default: () => <Navigation current="database" /> }));
jest.mock('../../src/trainer/Trainer', () => ({ __esModule: true, default: () => <Navigation current="trainer" /> }));
jest.mock('../../timer/src/App', () => ({ __esModule: true, default: function Timer() {
  const [solves, setSolves] = useState(0), dialog = useRef<HTMLDialogElement>(null);
  const { precision, solveLimit } = useContext(SettingsContext);
  usePageDialog(dialog);
  useEffect(() => { lifecycle.mounts++; return () => { lifecycle.unmounts++; }; }, []);
  return <><Navigation current="timer" /><p>Time: {(1.234).toFixed(precision)}</p><p>Recent scope: {solveLimit}</p><button onClick={() => setSolves(solves + 1)}>Record {solves}</button><dialog ref={dialog} aria-label="Retained modal" /></>;
} }));
beforeEach(() => {
  history.replaceState(null, '', '/');
  lifecycle.mounts = lifecycle.unmounts = 0;
  localStorage.clear();
  window.scrollTo = jest.fn();
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', { configurable: true, value: function(this: HTMLDialogElement) { this.open = true; } });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', { configurable: true, value: function(this: HTMLDialogElement) { this.open = false; } });
});
afterEach(cleanup);
const nav = () => within(screen.getByRole('navigation', { name: 'CuberPlus' }));
async function visit(name: string) { fireEvent.click(nav().getByRole('link', { name, exact: true })); await screen.findByRole('link', { name, current: 'page' }, { timeout: 10000 }); }

test('the site-wide recent-solve setting updates retained tools and survives a reload', async () => {
  const view = render(<Site />);
  await screen.findByRole('heading', { name: 'Home' });
  await visit('Timer');
  expect(screen.getByText('Recent scope: 10000')).toBeDefined();
  await visit('Options');
  const select = screen.getByRole('combobox', { name: 'Recent solves', exact: true });
  fireEvent.change(select, { target: { value: '25000' } });
  expect(localStorage.getItem('recent-solve-limit')).toBe('25000');
  await visit('Timer');
  expect(screen.getByText('Recent scope: 25000')).toBeDefined();
  view.unmount();
  render(<Site />);
  expect(await screen.findByText('Recent scope: 25000')).toBeDefined();
  await visit('Options');
  fireEvent.change(screen.getByRole('combobox', { name: 'Recent solves', exact: true }), { target: { value: '0' } });
  await visit('Timer');
  expect(screen.getByText('Recent scope: 0')).toBeDefined();
});

test('navigation disclosure closes on Escape, navigation, and leaving a retained page', () => {
  const view = render(<PageVisible.Provider value={true}><Navigation current="home" /></PageVisible.Provider>);
  const menu = screen.getByRole('button', { name: /^Menu/ });
  expect(menu.getAttribute('aria-expanded')).toBe('false');
  fireEvent.click(menu);
  expect(menu.getAttribute('aria-expanded')).toBe('true');
  fireEvent.keyDown(menu, { key: 'Escape' });
  expect(menu.getAttribute('aria-expanded')).toBe('false');
  expect(document.activeElement).toBe(menu);
  fireEvent.click(menu);
  fireEvent.click(nav().getByRole('link', { name: 'Timer', exact: true }));
  expect(menu.getAttribute('aria-expanded')).toBe('false');
  fireEvent.click(menu);
  view.rerender(<PageVisible.Provider value={false}><Navigation current="home" /></PageVisible.Provider>);
  expect(menu.getAttribute('aria-expanded')).toBe('false');
});

test('initial load avoids title focus while route changes focus headings and keep a stable skip target', async () => {
  render(<Site />);
  const home = await screen.findByRole('heading', { name: 'Home' });
  await act(async () => {});
  expect(document.activeElement).not.toBe(home);
  expect(home.id).toBe('home-content');
  await visit('Smartcube Analyzer');
  const analyzer = await screen.findByRole('heading', { name: 'Analyzer' });
  expect(document.activeElement).toBe(analyzer);
  expect(screen.getByRole('link', { name: 'Skip to content' }).getAttribute('href')).toBe('#smartcubeanalyzer-content');
  await visit('Home');
  expect(document.activeElement).toBe(home);
});
test('vertical intent or scrolling cancels a gesture even if it ends horizontally', async () => {
  render(<Site />);
  const element = await screen.findByRole('navigation');
  fireEvent.touchStart(element, { touches: [{ clientX: 160, clientY: 300 }] });
  fireEvent.touchMove(element, { touches: [{ clientX: 155, clientY: 340 }] });
  fireEvent.touchEnd(element, { touches: [], changedTouches: [{ clientX: 50, clientY: 305 }] });
  expect(location.pathname).toBe('/');
  const table = document.createElement('table');
  element.appendChild(table);
  swipe(table, -100);
  expect(location.pathname).toBe('/');
  table.remove();
});
test('tool URLs accept existing index paths but reject other files and nested routes', () => {
  expect(['/','/index.html','/timer','/timer/index.html','/analyzer/','/analyzer','/analyzer/index.html','/smartcubeanalyzer/','/scrambler/','/database/','/database/index.html'].map(toolAt)).toEqual(['home','home','timer','timer','smartcubeanalyzer','smartcubeanalyzer','smartcubeanalyzer','smartcubeanalyzer','scrambler','database','database']);
  expect(toolAt('/analyzer/help/')).toBeNull();
  expect(toolAt('/timer/help/mac-address.html')).toBeNull();
  expect(toolAt('/not-a-tool/')).toBeNull();
});
test.each(['/smartcubeanalyzer', '/smartcubeanalyzer/', '/smartcubeanalyzer/index.html'])('legacy Analyzer link %s redirects without dropping query or fragment', async path => {
  history.replaceState({ shared: true }, '', `${path}?source=timer#records`);
  render(<Site />);
  await screen.findByRole('heading', { name: 'Analyzer' });
  expect(location.pathname + location.search + location.hash).toBe('/analyzer/?source=timer#records');
  expect(history.state).toEqual({ shared: true });
  expect(nav().getByRole('link', { name: 'Smartcube Analyzer' }).getAttribute('href')).toBe('/analyzer/');
});
test('tool navigation retains Timer state and lifecycle, closes hidden top-layer modals, and restores them on return', async () => {
  render(<Site />);
  await screen.findByRole('navigation');
  await visit('Timer');
  fireEvent.click(screen.getByRole('button', { name: 'Record 0' }));
  expect(screen.getByRole('dialog').getAttribute('open')).not.toBeNull();
  await visit('Smartcube Analyzer');
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(lifecycle).toEqual({ mounts: 1, unmounts: 0 });
  await visit('Scrambler');
  await visit('Database');
  await visit('Timer');
  expect(screen.getByRole('button', { name: 'Record 1' })).toBeDefined();
  expect(screen.getByRole('dialog')).toBeDefined();
  expect(lifecycle).toEqual({ mounts: 1, unmounts: 0 });
});
test('database appears immediately after Scrambler in navigation and swipe order', async () => {
  history.replaceState(null, '', '/scrambler/');
  render(<Site />);
  const navigation = await screen.findByRole('navigation');
  expect(within(navigation).getAllByRole('link').map(link => link.getAttribute('href')))
    .toEqual(['/', '/timer/', '/analyzer/', '/trainer/', '/scrambler/', '/database/', '/options/']);
  swipe(navigation, -100);
  await screen.findByRole('link', { name: 'Database', current: 'page' });
  expect(location.pathname).toBe('/database/');
});
test('history navigation preserves query strings and retained page identity', async () => {
  render(<Site />);
  fireEvent.click(await screen.findByRole('link', { name: 'Shared solve' }));
  await screen.findByRole('button', { name: 'Record 0' });
  expect(location.pathname + location.search).toBe('/timer/?solve=one');
  await act(async () => { history.replaceState(null, '', '/'); dispatchEvent(new PopStateEvent('popstate')); });
  await screen.findByRole('link', { name: 'Home', current: 'page' });
  expect(lifecycle.unmounts).toBe(0);
});
test('modified links and external links retain native browser behavior', async () => {
  render(<Site />);
  await screen.findByRole('navigation');
  const push = jest.spyOn(history, 'pushState'), handled: boolean[] = [];
  const cancelNative = (event: Event) => { handled.push(event.defaultPrevented); event.preventDefault(); };
  document.addEventListener('click', cancelNative);
  try {
    fireEvent.click(nav().getByRole('link', { name: 'Timer', exact: true }), { ctrlKey: true });
    fireEvent.click(screen.getByRole('link', { name: 'External' }));
    expect(handled).toEqual([false, false]);
    expect(push).not.toHaveBeenCalled();
  } finally { document.removeEventListener('click', cancelNative); push.mockRestore(); }
});
test('saved light theme applies on every page, including navigation back to Analyzer', async () => {
  localStorage.setItem('theme', 'light');
  render(<Site />);
  await screen.findByRole('navigation');
  await visit('Smartcube Analyzer');
  expect(document.documentElement.dataset.bsTheme).toBe('light');
  await visit('Home');
  expect(document.documentElement.dataset.bsTheme).toBe('light');
  await visit('Smartcube Analyzer');
  expect(document.documentElement.dataset.bsTheme).toBe('light');
});

test.each(['missing', 'invalid', 'blocked'])('Aurora is the default when the saved theme is %s', async saved => {
  history.replaceState(null, '', '/options/');
  if (saved === 'invalid') localStorage.setItem('theme', 'system');
  const read = saved === 'blocked' ? jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => { throw new Error('Blocked'); }) : null;
  try {
    render(<Site />);
    const theme = await screen.findByRole('button', { name: 'Aurora theme' }, { timeout: 10000 });
    expect(theme.getAttribute('aria-pressed')).toBe('true');
    expect(document.documentElement.dataset.theme).toBe('aurora');
    expect(document.documentElement.dataset.bsTheme).toBe('dark');
    await visit('Scrambler');
    expect(document.documentElement.dataset.theme).toBe('aurora');
  } finally { read?.mockRestore(); }
}, 15000);

test.each(['light', 'dark', 'aurora', 'disco', 'inferno', '90s'])('options apply and persist the %s theme across all pages', async theme => {
  history.replaceState(null, '', '/options/');
  const view = render(<Site />);
  fireEvent.click(await screen.findByRole('button', { name: `${theme[0].toUpperCase() + theme.slice(1)} theme` }));
  expect(document.documentElement.dataset.theme).toBe(theme);
  expect(document.documentElement.dataset.bsTheme).toBe(theme === 'light' || theme === '90s' ? 'light' : 'dark');
  expect(localStorage.getItem('theme')).toBe(theme);
  await visit('Scrambler');
  expect(document.documentElement.dataset.theme).toBe(theme);
  view.unmount();
  render(<Site />);
  await screen.findByRole('navigation');
  expect(document.documentElement.dataset.theme).toBe(theme);
});

test('global precision updates a retained timer and survives reloads', async () => {
  const view = render(<Site />);
  await screen.findByRole('navigation');
  await visit('Timer');
  fireEvent.click(screen.getByRole('button', { name: 'Record 0' }));
  await visit('Options');
  fireEvent.change(screen.getByRole('combobox', { name: 'Time precision' }), { target: { value: '3' } });
  await visit('Timer');
  expect(screen.getByText('Time: 1.234')).toBeDefined();
  expect(screen.getByRole('button', { name: 'Record 1' })).toBeDefined();
  expect(localStorage.getItem('timer-time-precision')).toBe('3');
  view.unmount();
  render(<Site />);
  expect(await screen.findByText('Time: 1.234')).toBeDefined();
});

test('blocked storage does not prevent options taking effect', async () => {
  history.replaceState(null, '', '/options/');
  render(<Site />);
  const choice = await screen.findByRole('button', { name: 'Disco theme' });
  const save = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Blocked'); });
  try {
    fireEvent.click(choice);
    expect(document.documentElement.dataset.theme).toBe('disco');
    expect(screen.getByRole('alert').textContent).toContain('could not save');
    fireEvent.change(screen.getByRole('combobox', { name: 'Time precision' }), { target: { value: '3' } });
    await visit('Timer');
    expect(screen.getByText('Time: 1.234')).toBeDefined();
  } finally { save.mockRestore(); }
});
test('theme carousel wraps in both directions and keeps the selected theme accessible', async () => {
  history.replaceState(null, '', '/options/');
  render(<Site />);
  fireEvent.click(await screen.findByRole('button', { name: 'Light theme' }));
  fireEvent.click(screen.getByRole('button', { name: 'Previous theme' }));
  expect(screen.getByRole('button', { name: '90s theme' }).getAttribute('aria-pressed')).toBe('true');
  fireEvent.click(screen.getByRole('button', { name: 'Next theme' }));
  expect(screen.getByRole('button', { name: 'Light theme' }).getAttribute('aria-pressed')).toBe('true');
  expect(localStorage.getItem('theme')).toBe('light');
});

function swipe(element: Element, dx: number, dy = 0, x = 160) {
  fireEvent.touchStart(element, { touches: [{ clientX: x, clientY: 300 }] });
  fireEvent.touchEnd(element, { touches: [], changedTouches: [{ clientX: x + dx, clientY: 300 + dy }] });
}
test('horizontal swipes follow tab order without wrapping or remounting pages', async () => {
  render(<Site />);
  await screen.findByRole('navigation');
  swipe(screen.getByRole('navigation'), 100);
  expect(location.pathname).toBe('/');
  swipe(screen.getByRole('navigation'), -100);
  await screen.findByRole('button', { name: 'Record 0' });
  fireEvent.click(screen.getByRole('button', { name: 'Record 0' }));
  // An open dialog owns its gestures.
  swipe(screen.getByRole('navigation'), -100);
  expect(location.pathname).toBe('/timer/');
  screen.getByRole('dialog').removeAttribute('open');
  swipe(screen.getByRole('navigation'), -100);
  await screen.findByRole('link', { name: 'Smartcube Analyzer', current: 'page' });
  swipe(screen.getByRole('navigation'), 100);
  await screen.findByRole('button', { name: 'Record 1' });
  expect(lifecycle).toEqual({ mounts: 1, unmounts: 0 });
  await visit('Options');
  swipe(screen.getByRole('heading', { name: 'Options' }), -100);
  expect(location.pathname).toBe('/options/');
});
test('scrolling, controls, edge gestures, multitouch and cancelled touches do not navigate', async () => {
  render(<Site />);
  await screen.findByRole('navigation');
  const element = screen.getByRole('navigation');
  swipe(element, -100, 150);
  swipe(element, -20);
  swipe(element, 100, 0, 5);
  swipe(screen.getByRole('textbox', { name: 'Control' }), -100);
  fireEvent.touchStart(element, { touches: [{ clientX: 160, clientY: 300 }, { clientX: 180, clientY: 300 }] });
  fireEvent.touchEnd(element, { touches: [], changedTouches: [{ clientX: 50, clientY: 300 }] });
  fireEvent.touchStart(element, { touches: [{ clientX: 160, clientY: 300 }] });
  fireEvent.touchCancel(element);
  fireEvent.touchEnd(element, { touches: [], changedTouches: [{ clientX: 50, clientY: 300 }] });
  expect(location.pathname).toBe('/');
});
test('swiping a home card SVG changes tabs without following its link or losing ordinary taps', async () => {
  render(<Site />);
  const card = await screen.findByRole('link', { name: /Shared solve/ });
  swipe(card.querySelector('path')!, -100);
  await screen.findByRole('button', { name: 'Record 0' });
  expect(location.pathname + location.search).toBe('/timer/');
  fireEvent.click(card);
  expect(location.pathname + location.search).toBe('/timer/');
  await visit('Home');
  const link = screen.getByRole('link', { name: /Shared solve/ });
  swipe(link, -15);
  fireEvent.click(link);
  await screen.findByRole('button', { name: 'Record 0' });
  expect(location.pathname + location.search).toBe('/timer/?solve=one');
});
