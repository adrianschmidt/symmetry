import { describe, it, expect } from "vitest";
import { applyControl, isRepaired, isWithinSnap } from "../src/ui/controls";
import type { MotifAttributes } from "../src/core/types";

const canon: MotifAttributes = { kind: "petal", hue: 200, spin: 1.0, scale: 1, mirrored: false };

describe("controls", () => {
  it("rotating nudges spin and reports closeness", () => {
    const cur = { ...canon, spin: 1.6 };
    const next = applyControl(cur, { axis: "spin", delta: -0.3 });
    expect(next.spin).toBeCloseTo(1.3, 5);
    expect(isRepaired(next, canon, ["spin"])).toBe(false);
  });

  it("reports repaired once every corrupted axis is within tolerance", () => {
    const cur = { ...canon, hue: 240, spin: 1.4 };
    let s = applyControl(cur, { axis: "hue", delta: -40 });
    s = applyControl(s, { axis: "spin", delta: -0.4 });
    expect(isRepaired(s, canon, ["hue", "spin"])).toBe(true);
  });

  it("cycling kind moves through the kind list", () => {
    const cur = { ...canon, kind: "square" as const };
    const next = applyControl(cur, { axis: "kind", delta: 1 });
    expect(next.kind).not.toBe("square");
  });

  it("toggling mirror flips chirality", () => {
    const next = applyControl({ ...canon, mirrored: true }, { axis: "mirrored", delta: 1 });
    expect(next.mirrored).toBe(false);
  });

  it("isWithinSnap accepts near-canonical and rejects a fresh corruption", () => {
    expect(isWithinSnap({ ...canon, hue: 206, spin: 1.05 }, canon)).toBe(true);
    expect(isWithinSnap({ ...canon, hue: 250 }, canon)).toBe(false);
  });
});
