import type { AlgorithmCase } from '../database/algorithms';
import { getAlgorithms } from '../database/customAlgorithms';

export const caseKey = (entry: Pick<AlgorithmCase, 'category' | 'id'>) => `${entry.category}-${entry.id}`;
export const trainingLink = (key: string) => `/trainer/?case=${encodeURIComponent(key)}`;
export const findTrainingCase = (key: string) => getAlgorithms().find(entry => caseKey(entry) === key);
