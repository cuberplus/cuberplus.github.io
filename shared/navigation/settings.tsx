import { createContext, useLayoutEffect, useState, type ReactNode } from 'react';

export type Theme = keyof typeof themeColors;
export const themeColors = { light: '#f3f6fa', dark: '#10141e', aurora: '#091e29', disco: '#20102e', inferno: '#1c0c0a' };
const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const savedTheme = (): Theme => { const value = read('theme'); return value && Object.hasOwn(themeColors, value) ? value as Theme : 'aurora'; };
export const SettingsContext = createContext({ theme: 'aurora' as Theme, isDark: true, precision: 2 as 2 | 3, error: '', setTheme: (_value: Theme) => {}, setPrecision: (_value: 2 | 3) => {} });

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState(savedTheme), [precision, setPrecision] = useState<2 | 3>(() => read('timer-time-precision') === '3' ? 3 : 2);
  const [error, setError] = useState('');
  function save(key: string, value: string) {
    try { localStorage.setItem(key, value); setError(''); }
    catch { setError('Options changed, but this browser could not save them.'); }
  }
  useLayoutEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.documentElement.dataset.bsTheme = theme === 'light' ? 'light' : 'dark';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColors[theme]);
  }, [theme]);
  return <SettingsContext.Provider value={{ theme, isDark: theme !== 'light', precision, error,
    setTheme: value => { setTheme(value); save('theme', value); },
    setPrecision: value => { setPrecision(value); save('timer-time-precision', String(value)); },
  }}>{children}</SettingsContext.Provider>;
}
