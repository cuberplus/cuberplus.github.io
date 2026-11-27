import { FACES, HEX } from '../../scrambler/src/cube/cube';
import { algorithms, type Category, type IllustratedCase } from './algorithms';
import { diagramViewBox, floatingFaces, projectFace } from './caseDiagramGeometry';
import { caseLabel } from './caseLabels';

const WHITE_CROSS_COLORS = [HEX[3], HEX[4], HEX[2], HEX[0], HEX[1], HEX[5]];

export function CategoryImage({ category, example }: { category: Category; example?: IllustratedCase }) {
  const facelets = example?.facelets ?? FACES.map(face => face.repeat(9)).join('');
  const visibleStickers = Array.from({ length: 54 }, (_, i) => i)
    .filter(i => i >= 9 && (Math.floor(i / 9) === 3 || i % 9 >= 3));
  return <span className="database-category-image" aria-hidden="true">
    <CaseDiagram category={category} id="" algorithm="" facelets={facelets} visibleStickers={visibleStickers} />
  </span>;
}

export default function CaseDiagram({ category, id, pair, facelets, visibleStickers, palette = category === 'Patterns' ? HEX : WHITE_CROSS_COLORS, topColor = palette[0], showPLL = false }: Omit<IllustratedCase, 'options'> & { palette?: string[]; topColor?: string; showPLL?: boolean }) {
  const f2l = category.endsWith('F2L');
  const faces = f2l && id ? floatingFaces(facelets, pair ?? algorithms.find(entry => entry.category === category && entry.id === id)?.pair) : [];
  const mirrors = faces.length > 0;
  const label = caseLabel({ category, id });
  const color = (index: number) => f2l && !visibleStickers.includes(index) ? '#697384' :
    category === 'OLL' && !showPLL ? (facelets[index] === 'U' ? topColor : '#697384') :
      palette['URFDLB'.indexOf(facelets[index])];
  return <svg className={`database-case-image${mirrors ? ' database-case-image--mirrored' : ''}`} viewBox={diagramViewBox(faces)} role="img" aria-label={`${label} case`}
    aria-description={mirrors ? 'Floating mirrored faces reveal target F2L stickers hidden on the cube.' : undefined}>
    <title>{`${label} starting position${category === 'OLL' && !showPLL ? ': top-face stickers highlighted, other stickers gray' : ''}`}</title>
    {f2l || category === 'Patterns' ? [...faces, 0, 2, 1].map(face => <g key={face}
      data-mirrored-face={face >= 3 ? FACES[face] : undefined} data-visible-face={face < 3 ? FACES[face] : undefined}>
      {Array.from({ length: 9 }, (_, i) => {
        const col = i % 3, row = Math.floor(i / 3), index = face * 9 + i;
        return <polygon key={i} data-facelet={index}
          points={[[col, row], [col + 1, row], [col + 1, row + 1], [col, row + 1]]
            .map(([x, y]) => projectFace(face, x, y, face >= 3).join(',')).join(' ')}
          fill={color(index)} stroke="#243c35" strokeWidth="1" strokeLinejoin="round">
          <title>{`${FACES[face]} ${row + 1},${col + 1}${face >= 3 ? ' (mirrored)' : ''}`}</title>
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
