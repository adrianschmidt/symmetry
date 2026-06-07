import type { Vec2 } from "../core/types";

export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpVec(a: Vec2, b: Vec2, t: number): Vec2 {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

export interface Tween { from: number; to: number; start: number; duration: number; }

export function tweenValue(t: Tween, now: number): number {
  const raw = (now - t.start) / t.duration;
  const clamped = Math.max(0, Math.min(1, raw));
  return lerp(t.from, t.to, easeInOut(clamped));
}

/** Runs `tick(now)` each frame until it returns true, then calls `done`. */
export function runLoop(tick: (now: number) => boolean, done: () => void): void {
  const frame = (now: number) => {
    if (tick(now)) done();
    else requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
