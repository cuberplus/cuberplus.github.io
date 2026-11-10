import { memo } from 'react';
import { algorithms } from '../database/algorithms';
import CaseDiagram from '../database/CaseDiagram';
import { type Cube } from '../../timer/src/Core/puzzle';
import { blitzPattern, type BlitzKind, type BlitzCase } from './blitz';

const colors = ['#ffffff', '#b71234', '#009b48', '#ffd500', '#ff5800', '#0046ad'];
const centerFaces = 'ULFRBD';
export const BlitzCaseImage = memo(function BlitzCaseImage({ cube, kind, id, auf = '', preAuf, postAuf, colorFrame, permutation, hidePLL = false }: {
  cube: Cube; kind: BlitzKind; id: string; auf?: string; preAuf?: string; postAuf?: string; colorFrame?: string; permutation?: BlitzCase['permutation']; hidePLL?: boolean;
}) {
  const entry = algorithms.find(entry => entry.category === kind && entry.id === id);
  if (!entry) return null;
  const facelets = cube.facelets(blitzPattern(cube, { ...entry, auf, preAuf, postAuf, permutation }));
  const centers = cube.solved().applyAlg(colorFrame ?? 'z2').patternData.CENTERS.pieces;
  const palette = [...'URFDLB'].map(face => colors['URFDLB'.indexOf(centerFaces[centers[centerFaces.indexOf(face)]])]);
  return <CaseDiagram category={kind} id={id} algorithm="" facelets={facelets} visibleStickers={[]}
    palette={palette} showPLL={!hidePLL} />;
});
