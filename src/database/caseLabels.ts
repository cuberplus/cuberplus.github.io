import type { AlgorithmCase } from './algorithms';

export const caseNumber = ({ id }: Pick<AlgorithmCase, 'category' | 'id'>) => id;
export const caseLabel = (entry: Pick<AlgorithmCase, 'category' | 'id'>) => `${entry.category} ${caseNumber(entry)}`;
export const caseKeyLabel = (key: string) => key.split(' + ').map(part => part.replace('-', ' ')).join(' + ');
