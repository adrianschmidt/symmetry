import type { Defect, Instance, Pattern } from "./types";
import { generatePattern } from "./generator";
import { corruptPattern } from "./corruptor";
import { instantiatePattern, isInstanceCorrect } from "./symmetry";
import { configForLevel } from "./difficulty";

export interface Puzzle {
  seed: number;
  level: number;
  pattern: Pattern;
  instances: Instance[];
  defects: Defect[];
}

export function createPuzzle(seed: number, level: number, puzzleIndex: number): Puzzle {
  const { gen, corrupt } = configForLevel(level, puzzleIndex);
  const pattern = generatePattern(seed, gen);
  const instances = instantiatePattern(pattern);
  const { defects } = corruptPattern(instances, pattern, seed, corrupt);
  return { seed, level, pattern, instances, defects };
}

export function instanceAt(p: Puzzle, layerIndex: number, index: number): Instance | undefined {
  return p.instances.find((i) => i.layerIndex === layerIndex && i.index === index);
}

/** Snap an instance to its canonical attributes (used when a repair is completed). */
export function repairDefect(p: Puzzle, layerIndex: number, index: number): void {
  const inst = instanceAt(p, layerIndex, index);
  const layer = p.pattern.layers[layerIndex];
  if (inst && layer) inst.attributes = { ...layer.motif };
}

export function remainingCount(p: Puzzle): number {
  return p.instances.filter((i) => !isInstanceCorrect(i, p.pattern.layers[i.layerIndex]!)).length;
}

export function isComplete(p: Puzzle): boolean {
  return remainingCount(p) === 0;
}
