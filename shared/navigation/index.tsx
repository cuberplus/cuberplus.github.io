import { createContext, useContext, useEffect, type RefObject } from 'react';

import { APP_VERSION } from '../config/version';
export { APP_VERSION } from '../config/version';
export { SettingsContext, SettingsProvider } from './settings';
export type Tool = 'home' | 'timer' | 'smartcubeanalyzer' | 'scrambler' | 'database' | 'options';
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
  ['smartcubeanalyzer', '/smartcubeanalyzer/', 'Smartcube Analyzer', 'M3 3v18h18M7 16l4-5 4 2 5-7'],
  ['scrambler', '/scrambler/', 'Scrambler', 'M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2ZM7 7h.01M17 7h.01M12 12h.01M7 17h.01M17 17h.01'],
  ['database', '/database/', 'Database', 'M12 6C9 4 6 4 3 4v14c3 0 6 0 9 3 3-3 6-3 9-3V4c-3 0-6 0-9 2Zm0 0v15'],
  ['options', '/options/', 'Options', 'M4 7h16M4 17h16M8 4v6M16 14v6'],
] as const;

export default function Navigation({ current }: { current: Tool }) {
  return <div className={`cuberplus-navigation cuberplus-navigation--${current}`}>
    <h1 className="cuberplus-title"><a className="cuberplus-brand" href="/" aria-label="CuberPlus home">CuberPlus</a></h1>
    <nav className="cuberplus-links" aria-label="CuberPlus">
      {links.map(([id, href, label, path]) => <a key={id} href={href} title={label} aria-label={label} aria-current={current === id ? 'page' : undefined}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false"><path d={path} /></svg>
      </a>)}
    </nav>
  </div>;
}

export function Footer() {
  return <footer className="cuberplus-footer">CuberPlus {APP_VERSION}</footer>;
}
