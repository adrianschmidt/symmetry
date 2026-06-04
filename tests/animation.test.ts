import { describe, it, expect } from "vitest";
import { easeInOut, lerp, lerpVec, type Tween, tweenValue } from "../src/render/animation";

describe("animation math", () => {
  it("easeInOut is 0 at 0, 1 at 1, 0.5 at 0.5", () => {
    expect(easeInOut(0)).toBeCloseTo(0);
    expect(easeInOut(1)).toBeCloseTo(1);
    expect(easeInOut(0.5)).toBeCloseTo(0.5);
  });

  it("lerp interpolates", () => {
    expect(lerp(10, 20, 0.5)).toBe(15);
    expect(lerpVec({ x: 0, y: 0 }, { x: 4, y: 8 }, 0.25)).toEqual({ x: 1, y: 2 });
  });

  it("tweenValue eases between endpoints over its duration", () => {
    const t: Tween = { from: 0, to: 100, start: 1000, duration: 200 };
    expect(tweenValue(t, 1000)).toBeCloseTo(0);
    expect(tweenValue(t, 1200)).toBeCloseTo(100);
    expect(tweenValue(t, 5000)).toBeCloseTo(100); // clamps past the end
  });
});
