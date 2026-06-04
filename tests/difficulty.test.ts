import { describe, it, expect } from "vitest";
import { configForLevel, MAX_LEVEL } from "../src/core/difficulty";

describe("configForLevel", () => {
  it("returns gen and corrupt configs for every level", () => {
    for (let lvl = 1; lvl <= MAX_LEVEL; lvl++) {
      const { gen, corrupt } = configForLevel(lvl, 100);
      expect(gen.layerCount[0]).toBeGreaterThanOrEqual(2);
      expect(corrupt.defectCount[0]).toBeGreaterThanOrEqual(1);
      expect(corrupt.hueDelta[0]).toBeGreaterThan(0);
    }
  });

  it("higher levels are not easier (defects and layers are monotonic non-decreasing)", () => {
    const low = configForLevel(1, 100);
    const high = configForLevel(MAX_LEVEL, 100);
    expect(high.corrupt.defectCount[1]).toBeGreaterThanOrEqual(low.corrupt.defectCount[1]);
    expect(high.gen.layerCount[1]).toBeGreaterThanOrEqual(low.gen.layerCount[1]);
  });

  it("higher levels are subtler (smaller minimum perturbations)", () => {
    const low = configForLevel(1, 100);
    const high = configForLevel(MAX_LEVEL, 100);
    expect(high.corrupt.hueDelta[0]).toBeLessThanOrEqual(low.corrupt.hueDelta[0]);
  });

  it("auto-eases the first few puzzles below the chosen level", () => {
    const eased = configForLevel(5, 0);     // very first puzzle
    const settled = configForLevel(5, 50);   // later puzzle, same level
    expect(eased.corrupt.defectCount[1]).toBeLessThanOrEqual(settled.corrupt.defectCount[1]);
  });
});
