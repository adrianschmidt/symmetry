import type { Instance, Layer, Pattern, Vec2, MotifAttributes } from "./types";
import { TWO_PI, pointOnCircle, angleDistance, hueDistance, approx } from "./geometry";

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

const HUE_EPS = 1.0;     // degrees
const SPIN_EPS = 0.02;   // radians
const SCALE_EPS = 0.02;

export function attributesMatch(a: MotifAttributes, b: MotifAttributes): boolean {
  return (
    a.kind === b.kind &&
    a.mirrored === b.mirrored &&
    hueDistance(a.hue, b.hue) <= HUE_EPS &&
    angleDistance(a.spin, b.spin) <= SPIN_EPS &&
    approx(a.scale, b.scale, SCALE_EPS)
  );
}

export function isInstanceCorrect(inst: Instance, layer: Layer): boolean {
  return attributesMatch(inst.attributes, layer.motif);
}
