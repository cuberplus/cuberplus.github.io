import { algorithms, type AlgorithmCase } from './algorithms';

export const CUSTOM_ALGORITHMS_KEY = 'cuberplus-custom-algorithms';
export const CATALOG_CHANGED = 'cuberplus-algorithm-catalog';
export type CustomAlgorithms = Record<string, string[]>;
let saved: string | null = null, catalog = algorithms;

export function readCustomAlgorithms(): CustomAlgorithms {
  try {
    const value = JSON.parse(localStorage.getItem(CUSTOM_ALGORITHMS_KEY) ?? '{}') as CustomAlgorithms | null;
    return Object.fromEntries(algorithms.flatMap(entry => {
      const key = `${entry.category}-${entry.id}`, options = value?.[key];
      return Array.isArray(options) ? [[key, [...new Set(options.filter(alg =>
        typeof alg === 'string' && alg.trim().length > 0 && alg.length <= 1000))]]] : [];
    }));
  } catch { return {}; }
}
export function getAlgorithms(): AlgorithmCase[] {
  let value: string | null;
  try { value = localStorage.getItem(CUSTOM_ALGORITHMS_KEY); } catch { return catalog; }
  if (value !== saved) {
    saved = value;
    const custom = readCustomAlgorithms();
    catalog = algorithms.map(entry => ({ ...entry,
      options: [...new Set([...entry.options, ...(custom[`${entry.category}-${entry.id}`] ?? [])])],
    }));
  }
  return catalog;
}
export function saveCustomAlgorithms(custom: CustomAlgorithms): void {
  localStorage.setItem(CUSTOM_ALGORITHMS_KEY, JSON.stringify(custom));
  window.dispatchEvent(new Event(CATALOG_CHANGED));
}
