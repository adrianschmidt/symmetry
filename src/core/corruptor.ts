import type { Axis, CorruptConfig, Defect, Instance, MotifAttributes, MotifKind, Pattern } from "./types";
import { MOTIF_KINDS } from "./types";
import { createRng, randInt, randRange, pick, type Rng } from "./rng";
import { normalizeAngle } from "./geometry";

const CORRUPTIBLE: Axis[] = ["hue", "spin", "scale", "kind", "mirrored"];

function perturb(attr: MotifAttributes, axis: Axis, r: Rng, cfg: CorruptConfig): MotifAttributes {
  const next = { ...attr };
  const sign = r() < 0.5 ? -1 : 1;
  switch (axis) {
    case "hue":
      next.hue = (attr.hue + sign * randRange(r, cfg.hueDelta[0], cfg.hueDelta[1]) + 360) % 360;
      break;
    case "spin":
      next.spin = normalizeAngle(attr.spin + sign * randRange(r, cfg.spinDelta[0], cfg.spinDelta[1]));
      break;
    case "scale":
      next.scale = Math.max(0.4, attr.scale + sign * randRange(r, cfg.scaleDelta[0], cfg.scaleDelta[1]));
      break;
    case "kind": {
      const others = MOTIF_KINDS.filter((k) => k !== attr.kind);
      next.kind = pick(r, others) as MotifKind;
      break;
    }
    case "mirrored":
      next.mirrored = !attr.mirrored;
      break;
  }
  return next;
}

export function corruptPattern(
  instances: Instance[],
  pattern: Pattern,
  seed: number,
  cfg: CorruptConfig,
): { instances: Instance[]; defects: Defect[] } {
  const r = createRng(seed ^ 0x9e3779b9);
  const defectTotal = Math.min(randInt(r, cfg.defectCount[0], cfg.defectCount[1]), instances.length);

  // Choose distinct instances to corrupt.
  const indices = instances.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [indices[i], indices[j]] = [indices[j]!, indices[i]!];
  }
  const chosen = indices.slice(0, defectTotal);

  const defects: Defect[] = [];
  for (const idx of chosen) {
    const inst = instances[idx]!;
    const canonical = pattern.layers[inst.layerIndex]!.motif;
    const axisCount = randInt(r, cfg.axesPerDefect[0], cfg.axesPerDefect[1]);

    // Pick distinct axes for this defect.
    const pool = [...CORRUPTIBLE];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [pool[i], pool[j]] = [pool[j]!, pool[i]!];
    }
    const axes = pool.slice(0, axisCount);

    let attrs = { ...canonical };
    for (const axis of axes) attrs = perturb(attrs, axis, r, cfg);
    inst.attributes = attrs;
    defects.push({ layerIndex: inst.layerIndex, index: inst.index, axes, canonical: { ...canonical } });
  }
  return { instances, defects };
}
