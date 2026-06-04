import type { Instance, Vec2 } from "../core/types";

/** Maps between world coordinates (pattern space) and screen pixels. */
export class Viewport {
  center: Vec2 = { x: 0, y: 0 }; // world point shown at screen center
  zoom = 1;
  constructor(public width: number, public height: number) {}

  setView(center: Vec2, zoom: number): void {
    this.center = center;
    this.zoom = zoom;
  }

  worldToScreen(p: Vec2): Vec2 {
    return {
      x: (p.x - this.center.x) * this.zoom + this.width / 2,
      y: (p.y - this.center.y) * this.zoom + this.height / 2,
    };
  }

  screenToWorld(p: Vec2): Vec2 {
    return {
      x: (p.x - this.width / 2) / this.zoom + this.center.x,
      y: (p.y - this.height / 2) / this.zoom + this.center.y,
    };
  }
}

/** Nearest instance to a world point within `radius` world units, else null. */
export function hitTest(instances: Instance[], world: Vec2, radius: number): Instance | null {
  let best: Instance | null = null;
  let bestDist = radius;
  for (const i of instances) {
    const d = Math.hypot(i.position.x - world.x, i.position.y - world.y);
    if (d <= bestDist) { best = i; bestDist = d; }
  }
  return best;
}
