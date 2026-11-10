import { useEffect } from 'react';
import { algorithms, type Category } from './algorithms';

export const caseImagePath = (category: Category, id: string) => `/case-images/${category}-${id}.svg`;
export default function CaseImage({ category, id }: { category: Category; id: string }) {
  return <img className="database-case-image" src={caseImagePath(category, id)} width="110" height="110"
    alt={`${category} ${id} case`} decoding="async" />;
}
export function CategoryImage({ category }: { category: Category }) {
  return <span className="database-category-image" aria-hidden="true">
    <img className="database-case-image" src={`/case-images/${category}.svg`} width="110" height="110" alt="" loading="eager" />
  </span>;
}
export function usePreloadCaseImages() {
  useEffect(() => {
    let cancelled = false, timer: ReturnType<typeof setTimeout>;
    const queue = [...algorithms];
    const preload = () => {
      if (cancelled) return;
      const entry = queue.shift();
      if (!entry) return;
      const image = new Image();
      image.onload = image.onerror = () => { if (!cancelled) timer = setTimeout(preload, 0); };
      image.src = caseImagePath(entry.category, entry.id);
    };
    const frame = requestAnimationFrame(() => { timer = setTimeout(preload, 0); });
    return () => { cancelled = true; cancelAnimationFrame(frame); clearTimeout(timer); };
  }, []);
}
