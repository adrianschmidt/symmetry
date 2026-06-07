import type { CorruptConfig, GenConfig } from "./types";

export const MAX_LEVEL = 8;

/**
 * Maps a player-chosen difficulty level (1..MAX_LEVEL) and the running puzzle
 * index to generator + corruptor configs. Difficulty scales by perceptual
 * richness (more layers, more defects) and subtlety (smaller perturbations),
 * never by deductive depth. The first few puzzles of a session are auto-eased.
 */
export function configForLevel(level: number, puzzleIndex: number): { gen: GenConfig; corrupt: CorruptConfig } {
  const ease = puzzleIndex < 3 ? 1 : 0;                 // first 3 puzzles: one notch easier
  const t = Math.max(1, level - ease) / MAX_LEVEL;      // normalized 0..1 difficulty

  const maxLayers = Math.round(2 + t * 3);              // 2..5 layers
  const maxDefects = Math.round(2 + t * 5);             // 2..7 defects
  const maxAxes = t > 0.6 ? 2 : 1;                      // multi-axis only at higher levels

  // Subtler perturbations as difficulty rises (still above perceptibility floor).
  const hueMin = Math.round(70 - t * 45);               // 70 -> 25 degrees
  const spinMin = 0.9 - t * 0.55;                       // 0.9 -> 0.35 radians
  const scaleMin = 0.35 - t * 0.2;                      // 0.35 -> 0.15

  return {
    gen: {
      layerCount: [2, maxLayers],
      countChoices: [4, 6, 8, 12],
      scale: [0.7, 1.2],
      kinds: ["petal", "diamond", "triangle", "square", "pentagon", "hexagon"],
      dihedralChance: t > 0.4 ? 0.5 : 0.2,
    },
    corrupt: {
      defectCount: [Math.max(1, maxDefects - 2), maxDefects],
      axesPerDefect: [1, maxAxes],
      hueDelta: [hueMin, hueMin + 30],
      spinDelta: [spinMin, spinMin + 0.5],
      scaleDelta: [scaleMin, scaleMin + 0.15],
    },
  };
}
