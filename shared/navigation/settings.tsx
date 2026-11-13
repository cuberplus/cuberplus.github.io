import { createContext, useLayoutEffect, useState, type ReactNode } from 'react';
export const DEFAULT_SOLVE_LIMIT = 10000;

export type Theme = keyof typeof themeColors;
export const themeColors = { light: '#f3f6fa', dark: '#10141e', aurora: '#091e29', disco: '#20102e', inferno: '#1c0c0a', '90s': '#c0c0c0' };
const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const savedTheme = (): Theme => { const value = read('theme'); return value && Object.hasOwn(themeColors, value) ? value as Theme : 'aurora'; };
const savedSolveLimit = () => { const value = Number(read('recent-solve-limit') ?? DEFAULT_SOLVE_LIMIT); return Number.isInteger(value) && value >= 0 ? value : DEFAULT_SOLVE_LIMIT; };
export const SettingsContext = createContext({ theme: 'aurora' as Theme, isDark: true, precision: 2 as 2 | 3, solveLimit: DEFAULT_SOLVE_LIMIT, session: 'Default', allSessions: false, error: '', setTheme: (_value: Theme) => {}, setPrecision: (_value: 2 | 3) => {}, setSolveLimit: (_value: number) => {}, setSession: (_value: string) => {}, setAllSessions: (_value: boolean) => {} });

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState(savedTheme), [precision, setPrecision] = useState<2 | 3>(() => read('timer-time-precision') === '3' ? 3 : 2);
  const [solveLimit, setSolveLimit] = useState(savedSolveLimit);
  const [session, setSession] = useState(() => read('selected-session')?.trim() || 'Default');
  const [allSessions, setAllSessions] = useState(() => read('timer-all-session-history') === 'true');
  const [error, setError] = useState('');
  function save(key: string, value: string) {
    try { localStorage.setItem(key, value); setError(''); }
    catch { setError('Options changed, but this browser could not save them.'); }
  }
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.bsTheme = theme === 'light' || theme === '90s' ? 'light' : 'dark';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColors[theme]);
  }, [theme]);
  return <SettingsContext.Provider value={{ theme, isDark: theme !== 'light' && theme !== '90s', precision, solveLimit, session, allSessions, error,
    setTheme: value => { setTheme(value); save('theme', value); },
    setPrecision: value => { setPrecision(value); save('timer-time-precision', String(value)); },
    setSolveLimit: value => { setSolveLimit(value); save('recent-solve-limit', String(value)); },
    setSession: value => { setSession(value); save('selected-session', value); },
    setAllSessions: value => { setAllSessions(value); save('timer-all-session-history', String(value)); },
  }}>{children}</SettingsContext.Provider>;
}
