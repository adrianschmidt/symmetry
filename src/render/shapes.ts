import type { MotifKind, Vec2 } from "../core/types";

function regularPolygon(n: number, rotation = -Math.PI / 2): Vec2[] {
  const out: Vec2[] = [];
  for (let i = 0; i < n; i++) {
    const a = rotation + (Math.PI * 2 * i) / n;
    out.push({ x: Math.cos(a), y: Math.sin(a) });
  }
  return out;
}

/** Unit-scale vertices centered on the origin; the renderer scales/rotates them. */
export function motifVertices(kind: MotifKind): Vec2[] {
  switch (kind) {
    case "triangle": return regularPolygon(3);
    case "square": return regularPolygon(4, Math.PI / 4);
    case "pentagon": return regularPolygon(5);
    case "hexagon": return regularPolygon(6);
    case "diamond": return [
      { x: 0, y: -1 }, { x: 0.6, y: 0 }, { x: 0, y: 1 }, { x: -0.6, y: 0 },
    ];
    case "petal": return [
      { x: 0, y: -1 }, { x: 0.7, y: -0.3 }, { x: 0.35, y: 0.6 },
      { x: 0, y: 1 }, { x: -0.35, y: 0.6 }, { x: -0.7, y: -0.3 },
    ];
  }
}
