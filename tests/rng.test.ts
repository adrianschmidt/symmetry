import { describe, it, expect } from "vitest";
import { createRng, randInt, randRange, pick } from "../src/core/rng";

describe("rng", () => {
  it("is deterministic for a given seed", () => {
    const a = createRng(42); const b = createRng(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it("differs across seeds", () => {
    expect(createRng(1)()).not.toEqual(createRng(2)());
  });

  it("randInt stays within inclusive bounds", () => {
    const r = createRng(7);
    for (let i = 0; i < 200; i++) {
      const n = randInt(r, 3, 6);
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(6);
    }
  });

  it("pick returns an element of the array", () => {
    const r = createRng(9);
    const arr = ["a", "b", "c"];
    expect(arr).toContain(pick(r, arr));
  });

  it("randRange stays within bounds", () => {
    const r = createRng(11);
    for (let i = 0; i < 200; i++) {
      const n = randRange(r, 2, 5);
      expect(n).toBeGreaterThanOrEqual(2);
      expect(n).toBeLessThan(5);
    }
  });
});
