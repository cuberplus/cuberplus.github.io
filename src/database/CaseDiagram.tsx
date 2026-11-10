import { FACES, HEX } from '../../scrambler/src/cube/cube';
import type { Category, IllustratedCase } from './algorithms';

const WHITE_CROSS_COLORS = [HEX[3], HEX[4], HEX[2], HEX[0], HEX[1], HEX[5]];

function project(face: number, col: number, row: number): string {
  const u = col * 2 / 3 - 1, v = row * 2 / 3 - 1;
  const [x, y, z] = face === 0 ? [u, 1, v] : face === 1 ? [1, -v, -u] : [u, -v, 1];
  return `${55 + 27 * (x - z)},${55 + 13.5 * (x + z) - 27 * y}`;
}

export function CategoryImage({ category, example }: { category: Category; example?: IllustratedCase }) {
  const facelets = example?.facelets ?? FACES.map(face => face.repeat(9)).join('');
  const visibleStickers = Array.from({ length: 54 }, (_, i) => i)
    .filter(i => i >= 9 && (Math.floor(i / 9) === 3 || i % 9 >= 3));
  return <span className="database-category-image" aria-hidden="true">
    <CaseDiagram category={category} id="" algorithm="" facelets={facelets} visibleStickers={visibleStickers} />
  </span>;
}

export default function CaseDiagram({ category, id, facelets, visibleStickers, palette = WHITE_CROSS_COLORS, topColor = palette[0], showPLL = false }: Omit<IllustratedCase, 'options'> & { palette?: string[]; topColor?: string; showPLL?: boolean }) {
  const f2l = category === 'F2L' || category === 'AF2L';
  const color = (index: number) => f2l && !visibleStickers.includes(index) ? '#697384' :
    category === 'OLL' && !showPLL ? (facelets[index] === 'U' ? topColor : '#697384') :
      palette['URFDLB'.indexOf(facelets[index])];
  return <svg className="database-case-image" viewBox="0 0 110 110" role="img" aria-label={`${category} ${id} case`}>
    <title>{`${category} ${id} starting position${category === 'OLL' && !showPLL ? ': top-face stickers highlighted, other stickers gray' : ''}`}</title>
    {f2l ? [0, 2, 1].map(face => <g key={face}>
      {Array.from({ length: 9 }, (_, i) => {
        const col = i % 3, row = Math.floor(i / 3), index = face * 9 + i;
        return <polygon key={i} data-facelet={index}
          points={[[col, row], [col + 1, row], [col + 1, row + 1], [col, row + 1]]
            .map(([x, y]) => project(face, x, y)).join(' ')}
          fill={color(index)} stroke="#243c35" strokeWidth="1" strokeLinejoin="round">
          <title>{`${FACES[face]} ${row + 1},${col + 1}`}</title>
        </polygon>;
      })}
    </g>) : <>
      {Array.from({ length: 9 }, (_, i) => <rect key={i} x={25 + i % 3 * 20} y={25 + Math.floor(i / 3) * 20}
        width="19" height="19" rx="1" fill={color(i)} stroke="#243c35" strokeWidth=".7" />)}
      {[45, 9, 18, 36].map((face, side) => <g key={face} transform={`rotate(${side * 90} 55 55)`}>
        {[0, 1, 2].map(i => <rect key={i} x={25 + i * 20} y="14" width="19" height="9" rx="1"
          fill={color(face + 2 - i)} stroke="#243c35" strokeWidth=".7" />)}
      </g>)}
    </>}
  </svg>;
}
