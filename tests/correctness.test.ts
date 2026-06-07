import { describe, it, expect } from "vitest";
import { instantiateLayer, isInstanceCorrect, attributesMatch } from "../src/core/symmetry";
import type { Layer, MotifAttributes } from "../src/core/types";

const motif: MotifAttributes = { kind: "petal", hue: 200, spin: 0.5, scale: 1, mirrored: false };
const layer: Layer = { radius: 100, count: 6, group: "cyclic", phase: 0, motif };

describe("verification", () => {
  it("accepts an untouched instance", () => {
    const inst = instantiateLayer(layer, 0, { x: 0, y: 0 })[0]!;
    expect(isInstanceCorrect(inst, layer)).toBe(true);
  });

  it("rejects a hue-shifted instance", () => {
    const inst = instantiateLayer(layer, 0, { x: 0, y: 0 })[0]!;
    inst.attributes.hue = 230;
    expect(isInstanceCorrect(inst, layer)).toBe(false);
  });

  it("rejects a spin-shifted instance but tolerates tiny float noise", () => {
    const inst = instantiateLayer(layer, 0, { x: 0, y: 0 })[0]!;
    inst.attributes.spin = motif.spin + 1e-9;
    expect(isInstanceCorrect(inst, layer)).toBe(true);
    inst.attributes.spin = motif.spin + 0.2;
    expect(isInstanceCorrect(inst, layer)).toBe(false);
  });

  it("attributesMatch checks every corruptible axis", () => {
    expect(attributesMatch(motif, { ...motif })).toBe(true);
    expect(attributesMatch(motif, { ...motif, kind: "square" })).toBe(false);
    expect(attributesMatch(motif, { ...motif, mirrored: true })).toBe(false);
    expect(attributesMatch(motif, { ...motif, scale: 1.3 })).toBe(false);
  });
});
