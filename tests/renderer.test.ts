import { describe, it, expect } from "vitest";
import { drawInstance, hslString } from "../src/render/renderer";
import type { Instance } from "../src/core/types";

function fakeCtx() {
  const calls: string[] = [];
  const ctx: any = {};
  for (const m of ["save", "restore", "translate", "rotate", "scale", "beginPath",
                    "moveTo", "lineTo", "closePath", "fill", "stroke", "bezierCurveTo"]) {
    ctx[m] = (...a: number[]) => calls.push(`${m}(${a.map((n) => Math.round(n)).join(",")})`);
  }
  ctx.fillStyle = ""; ctx.strokeStyle = ""; ctx.lineWidth = 1; ctx.globalAlpha = 1;
  return { ctx, calls };
}

const base: Instance = {
  layerIndex: 0, index: 0, position: { x: 10, y: 20 }, baseAngle: 0, mirroredBySym: false,
  attributes: { kind: "square", hue: 120, spin: 0, scale: 1, mirrored: false },
};

describe("renderer", () => {
  it("hslString formats a hue", () => {
    expect(hslString(120, 0.6, 0.55)).toBe("hsl(120, 60%, 55%)");
  });

  it("draws an instance without throwing and saves/restores state", () => {
    const { ctx, calls } = fakeCtx();
    drawInstance(ctx, base);
    expect(calls[0]).toBe("save()");
    expect(calls[calls.length - 1]).toBe("restore()");
    expect(calls).toContain("fill()");
  });

  it("applies a negative x-scale when mirrored", () => {
    const { ctx, calls } = fakeCtx();
    drawInstance(ctx, { ...base, attributes: { ...base.attributes, mirrored: true } });
    expect(calls.some((c) => c.startsWith("scale(-"))).toBe(true);
  });
});
