import { describe, it, expect } from "vitest";
import { generatePattern } from "../src/core/generator";
import type { GenConfig } from "../src/core/types";

const cfg: GenConfig = {
  layerCount: [2, 4],
  countChoices: [4, 6, 8, 12],
  scale: [0.7, 1.2],
  kinds: ["petal", "diamond", "triangle"],
  dihedralChance: 0.5,
};

describe("generatePattern", () => {
  it("is deterministic for a seed", () => {
    expect(generatePattern(123, cfg)).toEqual(generatePattern(123, cfg));
  });

  it("differs across seeds", () => {
    expect(generatePattern(1, cfg)).not.toEqual(generatePattern(2, cfg));
  });

  it("respects layer-count bounds", () => {
    for (let s = 0; s < 50; s++) {
      const p = generatePattern(s, cfg);
      expect(p.layers.length).toBeGreaterThanOrEqual(2);
      expect(p.layers.length).toBeLessThanOrEqual(4);
    }
  });

  it("uses only allowed counts and kinds, with increasing radii", () => {
    const p = generatePattern(99, cfg);
    let prevRadius = -1;
    for (const layer of p.layers) {
      expect(cfg.countChoices).toContain(layer.count);
      expect(cfg.kinds).toContain(layer.motif.kind);
      expect(layer.radius).toBeGreaterThan(prevRadius);
      prevRadius = layer.radius;
    }
  });

  it("sets pattern radius to cover the outermost layer", () => {
    const p = generatePattern(5, cfg);
    const maxLayer = Math.max(...p.layers.map((l) => l.radius));
    expect(p.radius).toBeGreaterThanOrEqual(maxLayer);
  });
});
