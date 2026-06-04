import type { Instance, Pattern } from "../core/types";
import { motifVertices } from "./shapes";

const MOTIF_RADIUS = 26; // base world radius of a motif at scale 1

export function hslString(hue: number, sat: number, light: number): string {
  return `hsl(${Math.round(hue)}, ${Math.round(sat * 100)}%, ${Math.round(light * 100)}%)`;
}

export function drawInstance(ctx: CanvasRenderingContext2D, inst: Instance, pop = 0): void {
  const a = inst.attributes;
  const mirrored = a.mirrored !== inst.mirroredBySym; // XOR: authored flip vs symmetry flip
  ctx.save();
  ctx.translate(inst.position.x, inst.position.y);
  ctx.rotate(inst.baseAngle + Math.PI / 2 + a.spin); // outward orientation + own spin
  if (mirrored) ctx.scale(-1, 1);
  ctx.scale(a.scale * MOTIF_RADIUS, a.scale * MOTIF_RADIUS);

  const verts = motifVertices(a.kind);
  ctx.beginPath();
  ctx.moveTo(verts[0]!.x, verts[0]!.y);
  for (let i = 1; i < verts.length; i++) ctx.lineTo(verts[i]!.x, verts[i]!.y);
  ctx.closePath();

  ctx.fillStyle = hslString(a.hue, 0.55 + pop * 0.25, 0.55 + pop * 0.08);
  ctx.fill();
  ctx.restore();
}

export function drawPattern(ctx: CanvasRenderingContext2D, instances: Instance[], pop = 0): void {
  for (const inst of instances) drawInstance(ctx, inst, pop);
}

/** Convenience used by the app to draw a full puzzle's instances. */
export function drawPuzzle(ctx: CanvasRenderingContext2D, pattern: Pattern, instances: Instance[], pop = 0): void {
  void pattern;
  drawPattern(ctx, instances, pop);
}
