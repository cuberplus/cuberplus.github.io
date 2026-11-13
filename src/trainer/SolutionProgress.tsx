import { memo, useMemo } from 'react';
import { Alg, Move } from 'cubing/alg';
import type { KPattern } from 'cubing/kpuzzle';
import type { Cube } from '../../timer/src/Core/puzzle';
import { algorithmMatcher } from '../../timer/src/Analysis/algorithmMatching';

export const SolutionProgress = memo(function SolutionProgress({ cube, start, pattern, algorithm }: { cube: Cube; start: KPattern; pattern: KPattern; algorithm: string }) {
  const steps = useMemo(() => {
    const checkpoints: string[] = [];
    let state = start;
    algorithmMatcher(cube).outerMoves(algorithm, (move, index) => {
      state = state.applyMove(move); checkpoints[index] = cube.facelets(state);
    });
    let previous = cube.facelets(start);
    return [...new Alg(algorithm).experimentalExpand()].filter(node => node instanceof Move).map((move, index) => {
      previous = checkpoints[index] ?? previous;
      return { move: move.toString(), facelets: previous };
    });
  }, [cube, start, algorithm]);
  const facelets = cube.facelets(pattern);
  const completed = steps.reduce((count, step, index) => step.facelets === facelets ? index + 1 : count, 0);
  return <p className="trainer-solution" role="group" aria-label="Suggested solution" data-completed={completed}>
    {steps.map(({ move }, index) => <span key={index} className={`move${index < completed ? ' done' : ''}`}
      aria-current={index === completed ? 'step' : undefined}>{move}</span>)}
    <span className="visually-hidden"> {completed} of {steps.length} moves completed</span>
  </p>;
});
