import { describe, it, expect } from "vitest";
import { instantiateLayer, instantiatePattern } from "../src/core/symmetry";
import type { Layer, Pattern, MotifAttributes } from "../src/core/types";

const motif: MotifAttributes = { kind: "petal", hue: 200, spin: 0, scale: 1, mirrored: false };
const center = { x: 0, y: 0 };

describe("instantiateLayer", () => {
  it("produces exactly `count` instances on the layer radius", () => {
    const layer: Layer = { radius: 100, count: 6, group: "cyclic", phase: 0, motif };
    const inst = instantiateLayer(layer, 0, center);
    expect(inst).toHaveLength(6);
    for (const i of inst) {
      expect(Math.hypot(i.position.x, i.position.y)).toBeCloseTo(100, 5);
      expect(i.attributes).toEqual(motif);
    }
  });

  it("spaces instances evenly and honors phase", () => {
    const layer: Layer = { radius: 50, count: 4, group: "cyclic", phase: 0, motif };
    const inst = instantiateLayer(layer, 0, center);
    expect(inst.map((i) => i.baseAngle)).toEqual([0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2]);
  });

  it("cyclic groups never mirror", () => {
    const layer: Layer = { radius: 50, count: 5, group: "cyclic", phase: 0, motif };
    expect(instantiateLayer(layer, 0, center).every((i) => !i.mirroredBySym)).toBe(true);
  });

  it("dihedral groups mirror alternate instances", () => {
    const layer: Layer = { radius: 50, count: 6, group: "dihedral", phase: 0, motif };
    expect(instantiateLayer(layer, 0, center).map((i) => i.mirroredBySym))
      .toEqual([false, true, false, true, false, true]);
  });
});

describe("instantiatePattern", () => {
  it("flattens all layers and tags layerIndex", () => {
    const pattern: Pattern = {
      center, radius: 120,
      layers: [
        { radius: 40, count: 3, group: "cyclic", phase: 0, motif },
        { radius: 100, count: 6, group: "cyclic", phase: 0, motif },
      ],
    };
    const inst = instantiatePattern(pattern);
    expect(inst).toHaveLength(9);
    expect(inst.filter((i) => i.layerIndex === 0)).toHaveLength(3);
    expect(inst.filter((i) => i.layerIndex === 1)).toHaveLength(6);
  });
});
