import { describe, it, expect } from "vitest";
import { Viewport, hitTest, clientToWorld } from "../src/render/viewport";
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

describe("clientToWorld", () => {
  it("subtracts the canvas rect offset before mapping", () => {
    const vp = new Viewport(800, 600);
    vp.setView({ x: 0, y: 0 }, 1);
    // A pointer at the canvas's visual center (offset + width/2, height/2) is world origin.
    const w = clientToWorld(vp, { left: 30, top: 40 }, 30 + 400, 40 + 300);
    expect(w.x).toBeCloseTo(0, 6);
    expect(w.y).toBeCloseTo(0, 6);
  });

  it("round-trips with worldToScreen plus the rect offset", () => {
    const vp = new Viewport(800, 600);
    vp.setView({ x: 10, y: -5 }, 2);
    const rect = { left: 12, top: 7 };
    const s = vp.worldToScreen({ x: 33, y: -9 });
    const w = clientToWorld(vp, rect, s.x + rect.left, s.y + rect.top);
    expect(w.x).toBeCloseTo(33, 6);
    expect(w.y).toBeCloseTo(-9, 6);
  });
});
