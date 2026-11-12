import { createContext, useContext, useEffect, useId, useRef, useState, type RefObject } from 'react';

import { APP_VERSION } from '../config/version';
export { APP_VERSION } from '../config/version';
export { SettingsContext, SettingsProvider } from './settings';
export type Tool = 'home' | 'timer' | 'smartcubeanalyzer' | 'scrambler' | 'database' | 'trainer' | 'options';
export const PageVisible = createContext(true);
export const PageLocation = createContext('');
export function usePageDialog(ref: RefObject<HTMLDialogElement>, autoOpen = true) {
  const visible = useContext(PageVisible);
  useEffect(() => {
    const dialog = ref.current;
    if (visible && autoOpen) dialog?.showModal();
    return () => { if (dialog?.open) dialog.close(); };
  }, [ref, visible, autoOpen]);
  return visible;
}
export const links = [
  ['home', '/', 'Home', 'M3 10 12 3l9 7M5 9v12h5v-7h4v7h5V9'],
  ['timer', '/timer/', 'Timer', 'M9 2h6m-3 0v3m6 2 2-2M12 9v5l3 2M21 14a9 9 0 1 1-18 0 9 9 0 0 1 18 0'],
  ['smartcubeanalyzer', '/analyzer/', 'Smartcube Analyzer', 'M3 3v18h18M7 16l4-5 4 2 5-7'],
  ['trainer', '/trainer/', 'Trainer', 'M15.5 22h3l-1.7-4.2c2.8-.4 4.7-2 4.8-4.1 1.6-1.5 1.8-4 .2-5.7.5-2.8-2.2-5.2-5-4.9C14.3 1.4 11 1.2 8.8 3 6.2 2.8 3.9 4.5 3.5 6.9.9 8.7 1.2 12.6 3.8 13.9c1 .5 2 .5 3 .3-.6 2.3 1.3 4.4 3.6 4.3l2.2-.3L15.5 22ZM9 5.5c-.6 1.5-1.8 1.3-3.1 2.2-1.4 1-1.3 2.4.3 2.8 1 .3 2.2-.2 2.9.5.6.6.2 1.6-.3 2.1m3.5-8.4c2.1.3 2 2.7.7 3.6-1.4.9-2 1.7-1.9 3.3m6.6-4.3c-1.4.2-2.2 1.4-2 2.6.3 1.5-.8 2.4-2.3 3.1-1 .5-2.3.8-3.2.5M20 11c-2.3-.9-3.1.6-4.1.9m1.6 4.1c-1.5-.7-3.2-.5-4.7.2'],
  ['scrambler', '/scrambler/', 'Scrambler', 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM7 7h.01M17 7h.01M12 12h.01M7 17h.01M17 17h.01'],
  ['database', '/database/', 'Database', 'M12 6C9 4 6 4 3 4v14c3 0 6 0 9 3 3-3 6-3 9-3V4c-3 0-6 0-9 2Zm0 0v15'],
  ['options', '/options/', 'Options', 'M4 7h16M4 17h16M8 4v6M16 14v6'],
] as const;

export default function Navigation({ current }: { current: Tool }) {
  const [open, setOpen] = useState(false), id = useId(), toggle = useRef<HTMLButtonElement>(null), visible = useContext(PageVisible);
  useEffect(() => { if (!visible) setOpen(false); }, [visible]);
  return <div className={`cuberplus-navigation cuberplus-navigation--${current}`} onKeyDown={event => {
    if (event.key === 'Escape' && open) { setOpen(false); toggle.current?.focus(); }
  }}>
    <div className="cuberplus-title"><a className="cuberplus-brand" href="/" aria-label="CuberPlus home">CuberPlus</a></div>
    <button ref={toggle} type="button" className="cuberplus-menu btn btn-outline-secondary" aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}>Menu <span aria-hidden="true">{open ? '\u00d7' : '\u2630'}</span></button>
    <nav id={id} className={`cuberplus-links${open ? ' is-open' : ''}`} aria-label="CuberPlus" onClick={() => setOpen(false)}>
      {links.map(([id, href, label, path]) => <a key={id} href={href} title={label} aria-label={label} aria-current={current === id ? 'page' : undefined}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={path} /></svg>
        <span>{id === 'smartcubeanalyzer' ? 'Analyzer' : label}</span>
      </a>)}
    </nav>
  </div>;
}

export function Footer() {
  return <footer className="cuberplus-footer">CuberPlus {APP_VERSION}</footer>;
}
