import { describe, it, expect } from "vitest";
import { generatePattern } from "../src/core/generator";
import { instantiatePattern, isInstanceCorrect } from "../src/core/symmetry";
import { corruptPattern } from "../src/core/corruptor";
import type { GenConfig, CorruptConfig } from "../src/core/types";

const gen: GenConfig = {
  layerCount: [3, 3], countChoices: [8], scale: [1, 1],
  kinds: ["petal", "diamond", "triangle", "square"], dihedralChance: 0,
};
const corrupt: CorruptConfig = {
  defectCount: [3, 3], axesPerDefect: [1, 2],
  hueDelta: [40, 80], spinDelta: [0.4, 1.0], scaleDelta: [0.25, 0.4],
};

function build(seed: number) {
  const pattern = generatePattern(seed, gen);
  const instances = instantiatePattern(pattern);
  const result = corruptPattern(instances, pattern, seed, corrupt);
  return { pattern, ...result };
}

describe("corruptPattern", () => {
  it("produces the requested number of defects", () => {
    expect(build(1).defects).toHaveLength(3);
  });

  it("each defect instance fails verification on its corrupted axes", () => {
    const { pattern, instances, defects } = build(2);
    for (const d of defects) {
      const inst = instances.find((i) => i.layerIndex === d.layerIndex && i.index === d.index)!;
      expect(isInstanceCorrect(inst, pattern.layers[d.layerIndex]!)).toBe(false);
    }
  });

  it("applying the canonical attributes repairs the instance", () => {
    const { pattern, instances, defects } = build(3);
    for (const d of defects) {
      const inst = instances.find((i) => i.layerIndex === d.layerIndex && i.index === d.index)!;
      inst.attributes = { ...d.canonical };
      expect(isInstanceCorrect(inst, pattern.layers[d.layerIndex]!)).toBe(true);
    }
  });

  it("does not corrupt more than the requested instances", () => {
    const { pattern, instances, defects } = build(4);
    const corruptedSet = new Set(defects.map((d) => `${d.layerIndex}:${d.index}`));
    const actuallyWrong = instances.filter(
      (i) => !isInstanceCorrect(i, pattern.layers[i.layerIndex]!),
    );
    expect(actuallyWrong).toHaveLength(corruptedSet.size);
  });

  it("is deterministic for a seed", () => {
    expect(build(7).defects).toEqual(build(7).defects);
  });
});
