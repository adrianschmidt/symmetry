import { describe, it, expect } from "vitest";
import { createPuzzle, repairDefect } from "../src/core/puzzle";
import { pickHintTarget } from "../src/ui/hint";

describe("pickHintTarget", () => {
  it("returns the world position of an unsolved defect", () => {
    const p = createPuzzle(123, 4, 100);
    const target = pickHintTarget(p)!;
    const inst = p.instances.find((i) => i.layerIndex === target.layerIndex && i.index === target.index)!;
    expect(target.position).toEqual(inst.position);
  });

  it("never points at an already-repaired defect", () => {
    const p = createPuzzle(123, 4, 100);
    const all = [...p.defects];
    for (let k = 0; k < all.length - 1; k++) repairDefect(p, all[k]!.layerIndex, all[k]!.index);
    const last = all[all.length - 1]!;
    const target = pickHintTarget(p)!;
    expect({ layerIndex: target.layerIndex, index: target.index })
      .toEqual({ layerIndex: last.layerIndex, index: last.index });
  });

  it("returns null when nothing remains", () => {
    const p = createPuzzle(123, 4, 100);
    for (const d of [...p.defects]) repairDefect(p, d.layerIndex, d.index);
    expect(pickHintTarget(p)).toBeNull();
  });
});
