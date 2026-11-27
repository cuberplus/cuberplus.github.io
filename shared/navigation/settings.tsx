import { createContext, useLayoutEffect, useState, type ReactNode } from 'react';
import { readOption, setTimeDisplay, type FontSize } from '../display';
import { readDisabledMistakes, type MistakeCategory } from '../mistakes';
export const DEFAULT_SOLVE_LIMIT = 10000;
export type HighlightAura = 'black' | 'white' | 'color';

export type Theme = keyof typeof themeColors;
export const themeColors = { light: '#f3f6fa', dark: '#10141e', aurora: '#091e29', disco: '#20102e', inferno: '#1c0c0a', '90s': '#c0c0c0' };
const read = (key: string) => { try { return localStorage.getItem(key); } catch { return null; } };
const savedTheme = (): Theme => { const value = read('theme'); return value && Object.hasOwn(themeColors, value) ? value as Theme : 'dark'; };
const savedSolveLimit = () => { const value = Number(read('recent-solve-limit') ?? DEFAULT_SOLVE_LIMIT); return Number.isInteger(value) && value >= 0 ? value : DEFAULT_SOLVE_LIMIT; };
type Settings = {
  theme: Theme; isDark: boolean; precision: 2 | 3; solveLimit: number; session: string; allSessions: boolean; error: string;
  setTheme(value: Theme): void; setPrecision(value: 2 | 3): void; setSolveLimit(value: number): void;
  setSession(value: string): void; setAllSessions(value: boolean): void;
  showMinutes: boolean; fontSize: FontSize; disabledMistakes: MistakeCategory[];
  setShowMinutes(value: boolean): void; setFontSize(value: FontSize): void; setDisabledMistakes(value: MistakeCategory[]): void;
  replayHighlight: string; setReplayHighlight(value: string): void;
  highlightAura: HighlightAura; setHighlightAura(value: HighlightAura): void;
};
export const SettingsContext = createContext<Settings>({ theme: 'dark', isDark: true, precision: 2, solveLimit: DEFAULT_SOLVE_LIMIT, session: 'Default', allSessions: false, error: '', showMinutes: true, fontSize: 'normal', disabledMistakes: ['f2lChoice'], replayHighlight: 'current', highlightAura: 'black', setHighlightAura: () => {}, setReplayHighlight: () => {}, setShowMinutes: () => {}, setFontSize: () => {}, setDisabledMistakes: () => {}, setTheme: () => {}, setPrecision: () => {}, setSolveLimit: () => {}, setSession: () => {}, setAllSessions: () => {} });

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState(savedTheme), [precision, setPrecision] = useState<2 | 3>(() => read('timer-time-precision') === '3' ? 3 : 2);
  const [solveLimit, setSolveLimit] = useState(savedSolveLimit);
  const [session, setSession] = useState(() => read('selected-session')?.trim() || 'Default');
  const [allSessions, setAllSessions] = useState(() => read('timer-all-session-history') === 'true');
  const [error, setError] = useState('');
  const [showMinutes, setShowMinutes] = useState(() => readOption('show-minutes') !== 'false');
  const [fontSize, setFontSize] = useState<FontSize>(() => { const saved = readOption('font-size'); return saved === 'small' || saved === 'large' ? saved : 'normal'; });
  const [disabledMistakes, setDisabledMistakes] = useState(readDisabledMistakes);
  const [replayHighlight, setReplayHighlight] = useState(() => { const saved = read('replay-highlight'); return saved === 'none' || saved === 'suggested' ? saved : 'current'; });
  const [highlightAura, setHighlightAura] = useState<HighlightAura>(() => { const saved = read('highlight-aura'); return saved === 'white' || saved === 'color' ? saved : 'black'; });
  setTimeDisplay(showMinutes);
  useLayoutEffect(() => {
    document.body.style.zoom = fontSize === 'small' ? '0.8' : fontSize === 'large' ? '1.2' : '';
    document.body.style.setProperty('--cp-scramble-scale', fontSize === 'small' ? '0.9' : fontSize === 'large' ? '1.25' : '1');
  }, [fontSize]);
  function save(key: string, value: string) {
    try { localStorage.setItem(key, value); setError(''); }
    catch { setError('Options changed, but this browser could not save them.'); }
  }
  useLayoutEffect(() => {
    document.documentElement.dataset['theme'] = theme;
    document.documentElement.dataset['bsTheme'] = theme === 'light' || theme === '90s' ? 'light' : 'dark';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', themeColors[theme]);
  }, [theme]);
  return <SettingsContext.Provider value={{ theme, isDark: theme !== 'light' && theme !== '90s', precision, solveLimit, session, allSessions, error, showMinutes, fontSize, disabledMistakes, replayHighlight, highlightAura,
    setHighlightAura: value => { setHighlightAura(value); save('highlight-aura', value); },
    setReplayHighlight: value => { setReplayHighlight(value); save('replay-highlight', value); },
    setShowMinutes: value => { setShowMinutes(value); setTimeDisplay(value); save('show-minutes', String(value)); },
    setFontSize: value => { setFontSize(value); save('font-size', value); },
    setDisabledMistakes: value => { setDisabledMistakes(value); save('disabled-mistakes', JSON.stringify(value)); },
    setTheme: value => { setTheme(value); save('theme', value); },
    setPrecision: value => { setPrecision(value); save('timer-time-precision', String(value)); },
    setSolveLimit: value => { setSolveLimit(value); save('recent-solve-limit', String(value)); },
    setSession: value => { setSession(value); save('selected-session', value); },
    setAllSessions: value => { setAllSessions(value); save('timer-all-session-history', String(value)); },
  }}>{children}</SettingsContext.Provider>;
}
