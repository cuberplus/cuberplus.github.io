import type { TwistyPlayer } from 'cubing/twisty';
import type { PieceSelection } from '../Analysis/f2lSuggestions';
import type { HighlightAura } from '../../../shared/navigation/settings';
type SceneNode = Awaited<ReturnType<TwistyPlayer['experimentalCurrentThreeJSPuzzleObject']>>;
type Material = { clone(): Material; color: { set(value: string): void; multiplyScalar(value: number): void }; opacity: number; transparent: boolean; depthWrite: boolean; polygonOffset: boolean; polygonOffsetFactor: number; polygonOffsetUnits: number; dispose(): void };
type PuzzleObject = SceneNode & { pieces?: Record<string, SceneNode[]>; scheduleRenderCallback?: () => void };
export function highlightCubies(object: SceneNode, selection: PieceSelection, aura: HighlightAura = 'black'): () => void {
  const puzzle = object as PuzzleObject, restore: (() => void)[] = [];
  for (const [orbit, selected] of Object.entries(selection)) for (const piece of selected) {
    const cubie = puzzle.pieces?.[orbit]?.[piece];
    if (!cubie) continue;
    const center = orbit === 'CENTERS', expansion = center ? 1.06 : 1.1, lift = center ? 0.1 : 0.16;
    for (const [index, node] of [...cubie.children].entries()) {
      if (!node.visible) continue;
      const position = node.position.clone(), scale = node.scale.clone();
      node.scale.multiplyScalar(expansion);
      node.position.multiplyScalar(expansion);
      // Canonical local outward axes rotate with each physical cubie, including during turns.
      node.position.x += orbit === 'CORNERS' ? lift : 0;
      node.position.y += lift;
      node.position.z += orbit === 'CENTERS' ? 0 : lift;
      restore.push(() => { node.position.copy(position); node.scale.copy(scale); });
      const foundation = node as SceneNode & { material?: Material };
      if (index === 0 && foundation.material?.clone) {
        const original = foundation.material, outline = original.clone();
        outline.color.set(aura === 'white' ? '#ffffff' : '#000000'); outline.opacity = 1; outline.transparent = false;
        foundation.material = outline;
        restore.push(() => { foundation.material = original; outline.dispose(); });
      }
      if (index > 0 && (aura === 'color' || !center) && foundation.material?.clone) {
        const outline = node.clone() as SceneNode & { material: Material };
        outline.material = foundation.material.clone();
        outline.material.opacity = 1; outline.material.transparent = false; outline.material.depthWrite = false;
        // Bias the aura behind its sticker without disabling occlusion by other cubies.
        outline.material.polygonOffset = true; outline.material.polygonOffsetFactor = 1; outline.material.polygonOffsetUnits = 1;
        if (aura === 'color') outline.material.color.multiplyScalar(0.35);
        else outline.material.color.set(aura === 'white' ? '#ffffff' : '#000000');
        outline.scale.multiplyScalar(center ? 1.15 : 1.2); outline.position.multiplyScalar(0.995);
        cubie.add(outline);
        restore.push(() => { cubie.remove(outline); outline.material.dispose(); });
      }
    }
  }
  puzzle.scheduleRenderCallback?.();
  return () => { restore.forEach(reset => reset()); puzzle.scheduleRenderCallback?.(); };
}
