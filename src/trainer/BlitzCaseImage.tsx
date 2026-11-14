import { memo } from 'react';
import { algorithms } from '../database/algorithms';
import { type Cube } from '../../timer/src/Core/puzzle';
import { blitzPattern, type BlitzKind, type BlitzCase } from './blitz';
import { DrillCaseImage } from './DrillCaseImage';

export const BlitzCaseImage = memo(function BlitzCaseImage({ cube, kind, id, auf = '', preAuf, postAuf, colorFrame, permutation, hidePLL = false }: {
  cube: Cube; kind: BlitzKind; id: string; auf?: string; preAuf?: string; postAuf?: string; colorFrame?: string; permutation?: BlitzCase['permutation']; hidePLL?: boolean;
}) {
  const entry = algorithms.find(entry => entry.category === kind && entry.id === id);
  if (!entry) return null;
  return <DrillCaseImage cube={cube} category={kind} id={id} pattern={blitzPattern(cube, { ...entry, auf, preAuf, postAuf, permutation })}
    colorFrame={colorFrame} hidePLL={hidePLL} />;
});
