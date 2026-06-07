import { describe, it, expect } from "vitest";
import { normalizeAngle, hueDistance, angleDistance, pointOnCircle, approx } from "../src/core/geometry";

describe("geometry", () => {
  it("normalizes angles into [0, 2π)", () => {
    expect(normalizeAngle(0)).toBeCloseTo(0);
    expect(normalizeAngle(2 * Math.PI)).toBeCloseTo(0);
    expect(normalizeAngle(-Math.PI / 2)).toBeCloseTo((3 * Math.PI) / 2);
  });

  it("computes shortest angular distance", () => {
    expect(angleDistance(0.1, 6.2)).toBeCloseTo(Math.abs(0.1 - (6.2 - 2 * Math.PI)), 5);
    expect(angleDistance(0, Math.PI)).toBeCloseTo(Math.PI, 5);
  });

  it("computes shortest hue distance on the 360 wheel", () => {
    expect(hueDistance(10, 350)).toBeCloseTo(20);
    expect(hueDistance(0, 180)).toBeCloseTo(180);
  });

  it("places points on a circle", () => {
    const p = pointOnCircle({ x: 0, y: 0 }, 10, 0);
    expect(p.x).toBeCloseTo(10);
    expect(p.y).toBeCloseTo(0);
  });

  it("approx compares with epsilon", () => {
    expect(approx(1.0, 1.0 + 1e-9)).toBe(true);
    expect(approx(1.0, 1.1)).toBe(false);
  });
});
