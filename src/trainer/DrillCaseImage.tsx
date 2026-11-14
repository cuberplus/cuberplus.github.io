import { memo } from 'react';
import type { KPattern } from 'cubing/kpuzzle';
import type { Cube } from '../../timer/src/Core/puzzle';
import type { Category } from '../database/algorithms';
import CaseDiagram from '../database/CaseDiagram';

const colors = ['#ffffff', '#b71234', '#009b48', '#ffd500', '#ff5800', '#0046ad'];
const centerFaces = 'ULFRBD';
const visibleStickers = Array.from({ length: 54 }, (_, index) => index);
export const DrillCaseImage = memo(function DrillCaseImage({ cube, category, id, pattern, colorFrame = 'z2', hidePLL = false }: {
  cube: Cube; category: Category; id: string; pattern: KPattern; colorFrame?: string; hidePLL?: boolean;
}) {
  const centers = cube.solved().applyAlg(colorFrame).patternData['CENTERS'].pieces;
  const palette = [...'URFDLB'].map(face => colors['URFDLB'.indexOf(centerFaces[centers[centerFaces.indexOf(face)]])]);
  return <CaseDiagram category={category} id={id} algorithm="" facelets={cube.facelets(pattern)}
    visibleStickers={visibleStickers} palette={palette} showPLL={!hidePLL} />;
});
