import type { Instance, Layer, Pattern, Vec2 } from "./types";
import { TWO_PI, pointOnCircle } from "./geometry";

export function instantiateLayer(layer: Layer, layerIndex: number, center: Vec2): Instance[] {
  const out: Instance[] = [];
  for (let i = 0; i < layer.count; i++) {
    const baseAngle = layer.phase + (TWO_PI * i) / layer.count;
    out.push({
      layerIndex,
      index: i,
      position: pointOnCircle(center, layer.radius, baseAngle),
      baseAngle,
      mirroredBySym: layer.group === "dihedral" && i % 2 === 1,
      attributes: { ...layer.motif },
    });
  }
  return out;
}

export function instantiatePattern(pattern: Pattern): Instance[] {
  return pattern.layers.flatMap((layer, idx) => instantiateLayer(layer, idx, pattern.center));
}
