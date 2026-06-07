import type { Vec2 } from "../core/types";
import type { Puzzle } from "../core/puzzle";
import { isInstanceCorrect } from "../core/symmetry";

export interface HintTarget { layerIndex: number; index: number; position: Vec2; }

/** Picks the first still-corrupted instance to glow toward; null if solved. */
export function pickHintTarget(p: Puzzle): HintTarget | null {
  for (const i of p.instances) {
    if (!isInstanceCorrect(i, p.pattern.layers[i.layerIndex]!)) {
      return { layerIndex: i.layerIndex, index: i.index, position: i.position };
    }
  }
  return null;
}
