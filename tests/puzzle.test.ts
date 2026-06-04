import { describe, it, expect } from "vitest";
import { createPuzzle, instanceAt, repairDefect, remainingCount, isComplete } from "../src/core/puzzle";

describe("puzzle", () => {
  it("creates a puzzle with defects and a matching remaining count", () => {
    const p = createPuzzle(123, 4, 100);
    expect(p.defects.length).toBeGreaterThan(0);
    expect(remainingCount(p)).toBe(p.defects.length);
    expect(isComplete(p)).toBe(false);
  });

  it("is deterministic for the same (seed, level, index)", () => {
    expect(createPuzzle(5, 3, 10)).toEqual(createPuzzle(5, 3, 10));
  });

  it("repairing a defect restores its instance and lowers the count", () => {
    const p = createPuzzle(123, 4, 100);
    const d = p.defects[0]!;
    const before = remainingCount(p);
    repairDefect(p, d.layerIndex, d.index);
    const inst = instanceAt(p, d.layerIndex, d.index)!;
    expect(inst.attributes).toEqual(d.canonical);
    expect(remainingCount(p)).toBe(before - 1);
  });

  it("is complete once all defects are repaired", () => {
    const p = createPuzzle(123, 4, 100);
    for (const d of [...p.defects]) repairDefect(p, d.layerIndex, d.index);
    expect(remainingCount(p)).toBe(0);
    expect(isComplete(p)).toBe(true);
  });
});
