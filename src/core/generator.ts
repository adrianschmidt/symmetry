import type { GenConfig, Layer, Pattern } from "./types";
import { createRng, randInt, randRange, pick } from "./rng";
import { TWO_PI } from "./geometry";

const LAYER_SPACING = 90;   // world units between successive layer radii
const FIRST_RADIUS = 80;
const MARGIN = 70;

export function generatePattern(seed: number, cfg: GenConfig): Pattern {
  const r = createRng(seed);
  const layerCount = randInt(r, cfg.layerCount[0], cfg.layerCount[1]);
  const layers: Layer[] = [];

  for (let i = 0; i < layerCount; i++) {
    const radius = FIRST_RADIUS + i * LAYER_SPACING;
    const count = pick(r, cfg.countChoices);
    const group = r() < cfg.dihedralChance ? "dihedral" : "cyclic";
    layers.push({
      radius,
      count,
      group,
      phase: randRange(r, 0, TWO_PI),
      motif: {
        kind: pick(r, cfg.kinds),
        hue: randRange(r, 0, 360),
        spin: randRange(r, 0, TWO_PI),
        scale: randRange(r, cfg.scale[0], cfg.scale[1]),
        mirrored: false,
      },
    });
  }

  const outer = layers[layers.length - 1]!.radius;
  return { center: { x: 0, y: 0 }, radius: outer + MARGIN, layers };
}
