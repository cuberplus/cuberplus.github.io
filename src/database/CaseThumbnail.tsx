import CaseImage from './CaseImage';
import images from './caseImages.json';
import type { Category } from './algorithms';

export function CaseThumbnail({ category, id }: { category: Category; id: string }) {
  const image = images[`${category}-${id}` as keyof typeof images];
  return image ? <CaseImage category={category} id={id} algorithm="" {...image} /> : null;
}
