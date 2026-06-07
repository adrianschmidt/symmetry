import type { Vec2 } from "./types";

export const TWO_PI = Math.PI * 2;

export function normalizeAngle(a: number): number {
  return ((a % TWO_PI) + TWO_PI) % TWO_PI;
}

/** Shortest absolute distance between two angles, in [0, π]. */
export function angleDistance(a: number, b: number): number {
  const d = normalizeAngle(a - b);
  return Math.min(d, TWO_PI - d);
}

/** Shortest absolute distance between two hues on the 360° wheel, in [0, 180]. */
export function hueDistance(a: number, b: number): number {
  const d = ((a - b) % 360 + 360) % 360;
  return Math.min(d, 360 - d);
}

export function pointOnCircle(center: Vec2, radius: number, angle: number): Vec2 {
  return { x: center.x + radius * Math.cos(angle), y: center.y + radius * Math.sin(angle) };
}

export function approx(a: number, b: number, eps = 1e-6): boolean {
  return Math.abs(a - b) <= eps;
}
