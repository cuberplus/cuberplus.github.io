import type { AlgorithmCase } from './algorithms';
import { patternDefinitions } from './patterns';

export const caseNumber = ({ category, id }: Pick<AlgorithmCase, 'category' | 'id'>) =>
  category === 'Patterns' ? patternDefinitions.find(entry => entry.id === id)?.name ?? id : id;
export const caseLabel = (entry: Pick<AlgorithmCase, 'category' | 'id'>) => entry.category === 'Patterns' ? caseNumber(entry) : `${entry.category} ${caseNumber(entry)}`;
export const caseKeyLabel = (key: string) => key.split(' + ').map(part =>
  part.startsWith('Patterns-') ? caseNumber({ category: 'Patterns', id: part.slice(9) }) : part.replace('-', ' ')).join(' + ');
