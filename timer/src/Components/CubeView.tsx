import { useEffect, useRef } from 'react';
import { Alg, Move } from 'cubing/alg';
import { TwistyPlayer, type ExperimentalMillisecondTimestamp } from 'cubing/twisty';
import { Cube, crossRotation, locations } from '../Core/puzzle';
import { cfopFrame } from '../Analysis/cfop';

interface Animation {
  cube: Cube; moves: readonly string[]; rotation: string; colorFrame: string; length: number;
  cursor: number; target: number; speed: number; playback: boolean; seekVersion: number; time: number; frame: number;
}
const timestamp = (position: number) => position * 1000 as ExperimentalMillisecondTimestamp;

export function CubeView({ cube, facelets, moves, position = moves.length, speed = 1, animateSeeks = false, playback = false, seekVersion = 0, cross = null, rotation = crossRotation(cross), colorFrame = '', height = 280, hidePLL = false }: {
  cube: Cube; facelets: string; moves: readonly string[]; position?: number; speed?: number; animateSeeks?: boolean; playback?: boolean; seekVersion?: number; cross?: number | null; rotation?: string; colorFrame?: string; height?: number; hidePLL?: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  const player = useRef<TwistyPlayer | null>(null);
  const animation = useRef<Animation | null>(null);
  useEffect(() => {
    const element = new TwistyPlayer({ puzzle: '3x3x3', visualization: '3D', background: 'none', controlPanel: 'none', hintFacelets: 'none' });
    element.style.width = '100%';
    element.style.height = `${height}px`;
    container.current?.appendChild(element);
    player.current = element;
    return () => {
      if (animation.current) cancelAnimationFrame(animation.current.frame);
      animation.current = null; element.pause(); element.remove(); player.current = null;
    };
  }, [height]);
  useEffect(() => {
    const element = player.current;
    if (!element) return;
    const frame = cube.solved().applyAlg(colorFrame).patternData;
    // Masks follow physical stickers through turns, including non-default color frames.
    element.experimentalStickeringMaskOrbits = { orbits: { CENTERS: { pieces: Array.from({ length: 6 }, () => null) },
      ...Object.fromEntries((['EDGES', 'CORNERS'] as const).map(orbit => [orbit, {
      pieces: locations[orbit].map((indices, piece) => {
        const position = frame[orbit].pieces.indexOf(piece);
        return { facelets: indices.map((_, sticker) => hidePLL && position < 4 &&
          sticker !== (indices.length - frame[orbit].orientation[position]) % indices.length ? 'ignored' as const : 'regular' as const) };
      }),
    }])) } };
  }, [cube, colorFrame, hidePLL, height]);
  useEffect(() => {
    const element = player.current;
    if (!element) return;
    let state = animation.current;
    if (!state || state.cube !== cube || state.moves !== moves || state.rotation !== rotation || state.colorFrame !== colorFrame) {
      if (state) cancelAnimationFrame(state.frame);
      const prefix = new Alg(moves.slice(0, position).join(' '));
      const setup = cube.parse(facelets).applyAlg(prefix.invert()).experimentalToTransformation()!;
      element.experimentalModel.setupTransformation.set(cube.solved().applyAlg(colorFrame).applyTransformation(setup).applyAlg(rotation).experimentalToTransformation());
      state = { cube, moves, rotation, colorFrame, length: -1, cursor: position, target: position, speed, playback, seekVersion, time: 0, frame: 0 };
      animation.current = state;
    }
    if (state.length !== moves.length) {
      const leaves = moves.map(cfopFrame(cube, rotation)).map(move => new Move(move));
      element.alg = new Alg(leaves);
      // Explicit, non-overlapping intervals keep repeated and opposite-face turns separate.
      element.experimentalModel.animationTimelineLeavesRequest.set(leaves.map((animLeaf, index) => ({
        animLeaf, start: timestamp(index), end: timestamp(index + 1),
      })));
      state.length = moves.length;
    }
    if ((seekVersion !== state.seekVersion || (!animateSeeks && !playback)) && Math.abs(position - state.target) > 1) {
      cancelAnimationFrame(state.frame); state.frame = 0; state.cursor = position;
    }
    state.target = position; state.speed = speed; state.playback = playback; state.seekVersion = seekVersion;
    element.timestamp = timestamp(state.cursor);
    if (state.frame || state.cursor === state.target) return;
    const active = state;
    active.time = performance.now();
    const tick = (now: number) => {
      // A stalled/background frame must not skip an entire batch of individual turns.
      const remaining = Math.abs(active.target - active.cursor);
      const pace = Math.max(1, remaining) / (active.playback ? 80 : 100);
      const distance = Math.min(0.95, Math.max(0, now - active.time) * active.speed * pace);
      active.time = now;
      active.cursor += Math.sign(active.target - active.cursor) * Math.min(Math.abs(active.target - active.cursor), distance);
      element.timestamp = timestamp(active.cursor);
      active.frame = active.cursor === active.target ? 0 : requestAnimationFrame(tick);
    };
    active.frame = requestAnimationFrame(tick);
  }, [cube, facelets, moves, moves.length, position, speed, animateSeeks, playback, seekVersion, rotation, colorFrame, height]);
  return <div ref={container} role="img" aria-label="Live 3x3 cube state" />;
}
