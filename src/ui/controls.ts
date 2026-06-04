import type { Axis, MotifAttributes, MotifKind } from "../core/types";
import { MOTIF_KINDS } from "../core/types";
import { attributesMatch } from "../core/symmetry";
import { normalizeAngle, angleDistance, hueDistance } from "../core/geometry";

export interface ControlInput { axis: Axis; delta: number; }

export function applyControl(attr: MotifAttributes, input: ControlInput): MotifAttributes {
  const next = { ...attr };
  switch (input.axis) {
    case "hue": next.hue = (attr.hue + input.delta + 360) % 360; break;
    case "spin": next.spin = normalizeAngle(attr.spin + input.delta); break;
    case "scale": next.scale = Math.max(0.4, Math.min(1.8, attr.scale + input.delta)); break;
    case "kind": {
      const i = MOTIF_KINDS.indexOf(attr.kind);
      const n = MOTIF_KINDS.length;
      next.kind = MOTIF_KINDS[((i + Math.sign(input.delta) + n) % n)] as MotifKind;
      break;
    }
    case "mirrored": next.mirrored = !attr.mirrored; break;
  }
  return next;
}

/** True when the current attributes match canonical on the corrupted axes. */
export function isRepaired(cur: MotifAttributes, canonical: MotifAttributes, _axes: Axis[]): boolean {
  // attributesMatch already checks every axis with the same tolerances used for
  // verification, so a full match is sufficient (and stricter is fine).
  return attributesMatch(cur, canonical);
}

// Snap tolerances are >= one control step (see main.ts step sizes) so any defect
// is always reachable by stepping; once within range, the app snaps to exact canonical.
const HUE_SNAP = 12;    // degrees
const SPIN_SNAP = 0.15; // radians
const SCALE_SNAP = 0.08;

/** True when every axis is within magnetic snap range of canonical. */
export function isWithinSnap(cur: MotifAttributes, canonical: MotifAttributes): boolean {
  return (
    cur.kind === canonical.kind &&
    cur.mirrored === canonical.mirrored &&
    hueDistance(cur.hue, canonical.hue) <= HUE_SNAP &&
    angleDistance(cur.spin, canonical.spin) <= SPIN_SNAP &&
    Math.abs(cur.scale - canonical.scale) <= SCALE_SNAP
  );
}
