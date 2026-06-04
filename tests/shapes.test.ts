import { describe, it, expect } from "vitest";
import { motifVertices } from "../src/render/shapes";

describe("motifVertices", () => {
  it("returns the expected vertex count per kind", () => {
    expect(motifVertices("triangle")).toHaveLength(3);
    expect(motifVertices("square")).toHaveLength(4);
    expect(motifVertices("pentagon")).toHaveLength(5);
    expect(motifVertices("hexagon")).toHaveLength(6);
    expect(motifVertices("diamond")).toHaveLength(4);
  });

  it("produces unit-ish vertices centered on origin", () => {
    for (const v of motifVertices("hexagon")) {
      expect(Math.hypot(v.x, v.y)).toBeLessThanOrEqual(1.0001);
    }
  });

  it("petal returns a non-empty control-point outline", () => {
    expect(motifVertices("petal").length).toBeGreaterThanOrEqual(3);
  });
});
