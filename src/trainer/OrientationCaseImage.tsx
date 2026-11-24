import { memo, useContext, useMemo } from 'react';
import { SettingsContext } from '@cuberplus/navigation';
import { locations } from '../../shared/cube/cubeLocations';
import type { Cube } from '../../timer/src/Core/puzzle';
import { ORIENTATION_CAMERA, edgeName, orientationStagePieces, orientationStages, type OrientationCard } from './orientation';

const palette = ['#ffffff', '#b71234', '#009b48', '#ffd500', '#ff5800', '#0046ad'];
const latitude = ORIENTATION_CAMERA.latitude * Math.PI / 180, longitude = ORIENTATION_CAMERA.longitude * Math.PI / 180;
const normals = [[0, 1, 0], [1, 0, 0], [0, 0, 1], [0, -1, 0], [-1, 0, 0], [0, 0, -1]];
function project(face: number, col: number, row: number, offset: number[]): string {
  const u = col * 2 / 3 - 1, v = row * 2 / 3 - 1;
  const point = [[u, 1, v], [1, -v, -u], [u, -v, 1]][face].map((value, axis) => value + offset[axis]);
  const [x, y, z] = point;
  return `${55 + 29 * (Math.cos(longitude) * x - Math.sin(longitude) * z)},${55 + 29 * (Math.sin(latitude) * Math.sin(longitude) * x - Math.cos(latitude) * y + Math.sin(latitude) * Math.cos(longitude) * z)}`;
}
export const OrientationCaseImage = memo(function OrientationCaseImage({ cube, card, gray }: { cube: Cube | null; card: OrientationCard; gray: boolean }) {
  const { highlightAura } = useContext(SettingsContext);
  const frame = useMemo(() => cube ? cube.solved().applyAlg(card.colorFrame ?? '').patternData['CENTERS'].pieces : null, [cube, card.colorFrame]);
  if (!frame) return null;
  const target = locations.EDGES[card.position], preserved = orientationStagePieces[card.stage];
  const colored = new Set([4, 13, 22, 31, 40, 49, ...target,
    ...(['EDGES', 'CORNERS'] as const).flatMap(orbit => (preserved[orbit] ?? []).flatMap(piece => locations[orbit][piece]))]);
  const lift = target.map(index => normals[Math.floor(index / 9)]).reduce((a, b) => a.map((n, axis) => n + b[axis])).map(n => n * .14);
  const label = `${orientationStages[card.stage]} ${edgeName(card.position)} case`;
  return <svg className="orientation-case-image" viewBox="0 0 110 110" width="84" height="84" role="img" aria-label={label} data-facelets={card.facelets} data-color-frame={card.colorFrame ?? ''}>
    <title>{label}</title>
    {[0, 2, 1].flatMap(face => Array.from({ length: 9 }, (_, i) => face * 9 + i))
      .sort((a, b) => Number(target.includes(a)) - Number(target.includes(b))).map(index => {
        const face = Math.floor(index / 9), col = index % 3, row = Math.floor(index % 9 / 3), selected = target.includes(index);
        const color = gray && !colored.has(index) ? '#697384' : palette['URFDLB'.indexOf('ULFRBD'[frame['ULFRBD'.indexOf(card.facelets[index])]])];
        const stroke = !selected ? '#17212b' : highlightAura === 'white' ? '#ffffff' : '#000000';
        return <polygon key={index} data-facelet={index} data-highlighted={selected || undefined}
          points={[[col, row], [col + 1, row], [col + 1, row + 1], [col, row + 1]].map(([x, y]) => project(face, x, y, selected ? lift : [0, 0, 0])).join(' ')}
          fill={color} stroke={stroke} strokeWidth={selected ? 2.5 : .8} strokeLinejoin="round"
          style={selected && highlightAura === 'color' ? { stroke: `color-mix(in srgb, ${color} 40%, black)` } : undefined} />;
      })}
  </svg>;
});
