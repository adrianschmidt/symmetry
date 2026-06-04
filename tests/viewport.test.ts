import { describe, it, expect } from "vitest";
import { Viewport, hitTest } from "../src/render/viewport";
import type { Instance } from "../src/core/types";

function inst(layerIndex: number, index: number, x: number, y: number): Instance {
  return {
    layerIndex, index, position: { x, y }, baseAngle: 0, mirroredBySym: false,
    attributes: { kind: "petal", hue: 0, spin: 0, scale: 1, mirrored: false },
  };
}

describe("Viewport", () => {
  it("round-trips world -> screen -> world", () => {
    const vp = new Viewport(800, 600);
    vp.setView({ x: 10, y: -5 }, 2);
    const screen = vp.worldToScreen({ x: 30, y: 40 });
    const world = vp.screenToWorld(screen);
    expect(world.x).toBeCloseTo(30, 4);
    expect(world.y).toBeCloseTo(40, 4);
  });
});

describe("hitTest", () => {
  const instances = [inst(0, 0, 0, 0), inst(1, 2, 100, 0)];
  it("returns the instance under a world point within radius", () => {
    expect(hitTest(instances, { x: 102, y: 3 }, 30)).toEqual(instances[1]);
  });
  it("returns null when nothing is within radius", () => {
    expect(hitTest(instances, { x: 500, y: 500 }, 30)).toBeNull();
  });
});
