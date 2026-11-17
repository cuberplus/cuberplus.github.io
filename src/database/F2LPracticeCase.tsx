import { useEffect, useState } from 'react';
import type { Cube } from '../../timer/src/Core/puzzle';
import type { Solve } from '../../smartcubeanalyzer/src/Models/Types';
import { algorithms, databaseCaseKeys } from './algorithms';
import { CaseThumbnail } from './CaseThumbnail';
import CaseDiagram from './CaseDiagram';
import type { PracticeImage, f2lPracticeImages } from './f2lPracticeImages';

let runtime: Promise<{ cube: Cube; images: typeof f2lPracticeImages }> | undefined;
const cache = new WeakMap<Solve, Map<string, PracticeImage[]>>();
export function F2LPracticeCase({ caseName, solve, openCase }: { caseName: string; solve?: Solve; openCase: (key: string) => void }) {
  const [images, setImages] = useState<PracticeImage[]>();
  useEffect(() => {
    let active = true;
    setImages(undefined);
    if (solve) void (runtime ??= Promise.all([import('../../timer/src/Core/puzzle'), import('./f2lPracticeImages')])
      .then(async ([puzzle, module]) => ({ cube: await puzzle.loadCube(), images: module.f2lPracticeImages }))).then(({ cube, images: resolve }) => {
      let saved = cache.get(solve);
      if (!saved) cache.set(solve, saved = new Map<string, PracticeImage[]>());
      let result = saved.get(caseName);
      if (!result) { result = resolve(cube, solve, caseName); saved.set(caseName, result); }
      if (active) setImages(result);
    }).catch(() => { if (active) setImages([]); });
    return () => { active = false; };
  }, [solve, caseName]);
  return <div className="algo-f2l-images">{solve ? images?.map((image, index) => {
    const diagram = <CaseDiagram category="F2L" id={caseName} pair={4} algorithm="" {...image} />;
    return image.key ? <button key={index} type="button" className="algo-case-link btn btn-link" aria-label={image.key} onClick={() => openCase(image.key!)}>{diagram}</button>
      : <span key={index} className="algo-case-link">{diagram}</span>;
  }) : databaseCaseKeys('F2L', caseName).map(key => {
    const entry = algorithms.find(entry => `${entry.category}-${entry.id}` === key);
    return entry ? <button key={key} type="button" className="algo-case-link btn btn-link" aria-label={key} onClick={() => openCase(key)}>
      <CaseThumbnail category={entry.category} id={entry.id} /></button> : null;
  })}</div>;
}
