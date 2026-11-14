import { useEffect } from 'react';
import { algorithms, type Category } from './algorithms';
import images from './caseImages.json';
import { floatingFaces } from './caseDiagramGeometry';
import { caseLabel } from './caseLabels';

export const caseImagePath = (category: Category, id: string) => `/case-images/${category}-${id}.svg`;
export default function CaseImage({ category, id }: { category: Category; id: string }) {
  const image = images[`${category}-${id}` as keyof typeof images];
  const mirrors = category.endsWith('F2L') && image && floatingFaces(image.facelets,
    algorithms.find(entry => entry.category === category && entry.id === id)?.pair).length > 0;
  return <img className={`database-case-image${mirrors ? ' database-case-image--mirrored' : ''}`} src={caseImagePath(category, id)} width={mirrors ? 174 : 110} height={mirrors ? 155 : 110}
    alt={`${caseLabel({ category, id })} case`} aria-description={mirrors ? 'Floating mirrored faces reveal target F2L stickers hidden on the cube.' : undefined} decoding="async" />;
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
