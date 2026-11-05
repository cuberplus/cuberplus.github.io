import { useEffect, useState } from 'react';
import { algorithms, type AlgorithmCase } from './algorithms';

export const FAVORITES_KEY = 'cuberplus-database-favorites';
export const MISTAKES_KEY = 'timer-non-favorite-mistakes';
export const CATEGORIES_KEY = 'timer-non-favorite-categories';
export type FavoriteCategories = { F2L: boolean; OLL: boolean; PLL: boolean };
type Preferences = { favorites?: Set<string>; enabled?: boolean; categories?: FavoriteCategories };
const changed = 'cuberplus-algorithm-preferences';
export const favoriteId = (entry: Pick<AlgorithmCase, 'category' | 'id'>, algorithm: string) =>
  `${entry.category}-${entry.id}:${algorithm}`;
const validFavorites = new Set(algorithms.flatMap(entry => entry.options.map(algorithm => favoriteId(entry, algorithm))));
export function readFavorites(): Set<string> {
  try {
    const saved = JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? '[]') as string[] | null;
    return new Set((Array.isArray(saved) ? saved : []).filter(id => typeof id === 'string').flatMap(id => {
      const legacy = algorithms.find(entry => `${entry.category}-${entry.id}` === id);
      return legacy ? [favoriteId(legacy, legacy.algorithm)] : validFavorites.has(id) ? [id] : [];
    }));
  } catch { return new Set(); }
}
const readEnabled = () => { try { return localStorage.getItem(MISTAKES_KEY) === 'true'; } catch { return false; } };
function readCategories(): FavoriteCategories {
  try {
    const saved = JSON.parse(localStorage.getItem(CATEGORIES_KEY) ?? '{}') as Partial<FavoriteCategories> | null;
    return { F2L: saved?.F2L !== false, OLL: saved?.OLL !== false, PLL: saved?.PLL !== false };
  } catch { return { F2L: true, OLL: true, PLL: true }; }
}
export function useAlgorithmPreferences() {
  const [favorites, updateFavorites] = useState(readFavorites);
  const [enabled, updateEnabled] = useState(readEnabled);
  const [categories, updateCategories] = useState(readCategories);
  const [error, setError] = useState('');
  useEffect(() => {
    const refresh = (event: Event) => {
      const detail = (event as CustomEvent<Preferences>).detail;
      if (!detail || detail.favorites) updateFavorites(detail?.favorites ?? readFavorites());
      if (!detail || detail.enabled !== undefined) updateEnabled(detail?.enabled ?? readEnabled());
      if (!detail || detail.categories) updateCategories(detail?.categories ?? readCategories());
    };
    window.addEventListener('storage', refresh);
    window.addEventListener(changed, refresh);
    return () => { window.removeEventListener('storage', refresh); window.removeEventListener(changed, refresh); };
  }, []);
  function save(key: string, value: string, detail: Preferences) {
    try { localStorage.setItem(key, value); setError(''); }
    catch { setError('Algorithm preferences work for this visit, but could not be saved in this browser.'); }
    window.dispatchEvent(new CustomEvent(changed, { detail }));
  }
  return { favorites, enabled, categories, error,
    setFavorites: (value: Set<string>) => save(FAVORITES_KEY, JSON.stringify([...value]), { favorites: value }),
    setEnabled: (value: boolean) => save(MISTAKES_KEY, String(value), { enabled: value }),
    setCategories: (value: FavoriteCategories) => save(CATEGORIES_KEY, JSON.stringify(value), { categories: value }),
  };
}
