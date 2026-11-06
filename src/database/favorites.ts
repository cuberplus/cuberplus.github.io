import { useEffect, useState } from 'react';
import { algorithms, type AlgorithmCase } from './algorithms';
import { getAlgorithms, CATALOG_CHANGED } from './customAlgorithms';

export const FAVORITES_KEY = 'cuberplus-database-favorites';
export const MISTAKES_KEY = 'timer-non-favorite-mistakes';
export const CATEGORIES_KEY = 'timer-non-favorite-categories';
export const UNLEARN_KEY = 'cuberplus-unlearn-algorithms';
export type FavoriteCategories = { F2L: boolean; OLL: boolean; PLL: boolean };
type Preferences = { favorites?: Set<string>; unlearn?: Set<string>; enabled?: boolean; categories?: FavoriteCategories };
const changed = 'cuberplus-algorithm-preferences';
export const favoriteId = (entry: Pick<AlgorithmCase, 'category' | 'id'>, algorithm: string) =>
  `${entry.category}-${entry.id}:${algorithm}`;
export function readFavorites(key = FAVORITES_KEY): Set<string> {
  try {
    const validFavorites = new Set(getAlgorithms().flatMap(entry => entry.options.map(algorithm => favoriteId(entry, algorithm))));
    const saved = JSON.parse(localStorage.getItem(key) ?? '[]') as string[] | null;
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
  const [unlearn, updateUnlearn] = useState(() => readFavorites(UNLEARN_KEY));
  const [enabled, updateEnabled] = useState(readEnabled);
  const [categories, updateCategories] = useState(readCategories);
  const [error, setError] = useState('');
  useEffect(() => {
    const refresh = (event: Event) => {
      const detail = (event as CustomEvent<Preferences>).detail;
      if (!detail || detail.favorites) updateFavorites(detail?.favorites ?? readFavorites());
      if (!detail || detail.unlearn) updateUnlearn(detail?.unlearn ?? readFavorites(UNLEARN_KEY));
      if (!detail || detail.enabled !== undefined) updateEnabled(detail?.enabled ?? readEnabled());
      if (!detail || detail.categories) updateCategories(detail?.categories ?? readCategories());
    };
    window.addEventListener('storage', refresh);
    window.addEventListener(changed, refresh);
    window.addEventListener(CATALOG_CHANGED, refresh);
    return () => { window.removeEventListener('storage', refresh); window.removeEventListener(changed, refresh); window.removeEventListener(CATALOG_CHANGED, refresh); };
  }, []);
  function save(key: string, value: string, detail: Preferences) {
    try { localStorage.setItem(key, value); setError(''); }
    catch { setError('Algorithm preferences work for this visit, but could not be saved in this browser.'); }
    window.dispatchEvent(new CustomEvent(changed, { detail }));
  }
  return { favorites, unlearn, enabled, categories, error,
    setFavorites: (value: Set<string>) => save(FAVORITES_KEY, JSON.stringify([...value]), { favorites: value }),
    setUnlearn: (value: Set<string>) => save(UNLEARN_KEY, JSON.stringify([...value]), { unlearn: value }),
    setEnabled: (value: boolean) => save(MISTAKES_KEY, String(value), { enabled: value }),
    setCategories: (value: FavoriteCategories) => save(CATEGORIES_KEY, JSON.stringify(value), { categories: value }),
  };
}
