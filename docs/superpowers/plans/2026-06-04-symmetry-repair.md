# Symmetry Repair Implementation Plan

> ✅ **This plan was fully executed — v1 is built.** For current state and next steps see [STATUS.md](../../../STATUS.md). Kept for reference.

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build v1 of Symmetry Repair — a calm, endless visual puzzle where you find subtly corrupted elements in a layered-symmetry pattern and zoom in to transform them back into harmony, all playable without engaging language.

**Architecture:** Pure, seed-deterministic core (geometry → symmetry engine → generator → corruptor → puzzle state) with zero rendering dependencies, unit-tested with vitest. A canvas renderer and a pointer/zoom interaction layer sit on top. v1 patterns are concentric **rosette layers**: each layer is a motif repeated `n` times around a shared center under a cyclic (rotation-only) or dihedral (rotation + mirror) group. A defect is one instance whose attributes (hue, spin, scale, shape, chirality) are perturbed off its layer's canonical values; repair is the inverse transform applied to that same instance.

**Tech Stack:** TypeScript, Vite, vitest, HTML canvas, vite-plugin-pwa. Vanilla TS (no framework), matching the existing jigsaw app.

---

## File Structure

```
src/
  core/
    types.ts          # Vec2, MotifAttributes, Layer, Pattern, Instance, Defect, configs
    geometry.ts       # angle/hue normalization, point-on-circle, epsilon compares
    rng.ts            # seeded deterministic PRNG + helpers (randInt, pick, randRange)
    symmetry.ts       # instantiateLayer / instantiatePattern, isInstanceCorrect
    generator.ts      # generatePattern(seed, GenConfig) -> Pattern
    corruptor.ts      # corruptPattern(instances, seed, CorruptConfig) -> {instances, defects}
    difficulty.ts     # configForLevel(level, puzzleIndex) -> {gen, corrupt}
    puzzle.ts         # createPuzzle / repair application / completion checks
  render/
    shapes.ts         # motif kind -> Path2D vertex generation (pure, testable)
    renderer.ts       # draw pattern/instances to a CanvasRenderingContext2D
    viewport.ts       # screen<->world transform, hit-testing (pure, testable)
    animation.ts      # zoom tween + completion shine/pop (requestAnimationFrame driver)
  ui/
    controls.ts       # transform-control logic: axis -> attribute mutation, snap detection
    hud.ts            # remaining-count display, hint button, settings toggle
  app/
    state.ts          # app session: current level, puzzle index, settings
    persistence.ts    # localStorage save/restore (puzzle + settings)
    main.ts           # compose everything; the running app entry
  style.css
index.html
vite.config.ts
tsconfig.json
package.json
tests/                # mirrors src/core and the pure parts of render/ui
```

Files are split by responsibility. The `core/` directory is pure and holds all game logic; it has no DOM/canvas imports and is fully unit-tested. `render/` and `ui/` depend on `core/` but not vice-versa.

---

## Task 1: Project scaffolding

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/app/main.ts`
- Create: `src/style.css`

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "symmetry-repair",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "devDependencies": {
    "typescript": "~5.9.3",
    "vite": "^8.0.1",
    "vite-plugin-pwa": "^1.2.0",
    "vitest": "^4.1.0"
  }
}
```

- [ ] **Step 2: Create `tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noUncheckedIndexedAccess": true,
    "lib": ["ES2022", "DOM", "DOM.Iterable"],
    "types": ["vitest/globals"],
    "skipLibCheck": true
  },
  "include": ["src", "tests"]
}
```

- [ ] **Step 3: Create `vite.config.ts`** (PWA wired but minimal; expanded in Task 19)

```ts
import { defineConfig } from "vite";

export default defineConfig({
  test: { globals: true, environment: "node" },
});
```

- [ ] **Step 4: Create `index.html`**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
    <title>Symmetry Repair</title>
    <link rel="stylesheet" href="/src/style.css" />
  </head>
  <body>
    <canvas id="board"></canvas>
    <div id="hud"></div>
    <script type="module" src="/src/app/main.ts"></script>
  </body>
</html>
```

- [ ] **Step 5: Create `src/style.css`**

```css
:root { color-scheme: dark; }
html, body { margin: 0; height: 100%; background: #0e1014; overflow: hidden; }
#board { display: block; width: 100vw; height: 100vh; touch-action: none; }
#hud { position: fixed; inset: 0; pointer-events: none; }
#hud > * { pointer-events: auto; }
```

- [ ] **Step 6: Create placeholder `src/app/main.ts`**

```ts
const canvas = document.getElementById("board") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
ctx.fillStyle = "#7aa2f7";
ctx.fillText("Symmetry Repair — scaffolding OK", 20, 40);
```

- [ ] **Step 7: Install and verify**

Run: `npm install && npm run dev`
Expected: dev server starts; opening the URL shows the placeholder text. Stop the server.

- [ ] **Step 8: Commit**

```bash
git add package.json tsconfig.json vite.config.ts index.html src/
git commit -m "chore: scaffold Vite + TS + vitest project"
```

---

## Task 2: Core types

**Files:**
- Create: `src/core/types.ts`

- [ ] **Step 1: Write the types** (no test — pure declarations consumed by later tasks)

```ts
export interface Vec2 { x: number; y: number; }

export type MotifKind =
  | "triangle" | "square" | "pentagon" | "hexagon" | "petal" | "diamond";

export const MOTIF_KINDS: MotifKind[] =
  ["triangle", "square", "pentagon", "hexagon", "petal", "diamond"];

/** Symmetry-independent appearance of a motif, shared by every instance in a layer. */
export interface MotifAttributes {
  kind: MotifKind;
  hue: number;        // 0..360
  spin: number;       // radians, the motif's own rotation on top of its outward orientation
  scale: number;      // multiplier, ~0.5..1.5
  mirrored: boolean;  // chirality flip authored into the motif
}

export type GroupType = "cyclic" | "dihedral"; // C_n (rotation) | D_n (rotation + mirror)

/** One concentric ring: a motif repeated `count` times around the shared center. */
export interface Layer {
  radius: number;     // distance of motif centers from the pattern center
  count: number;      // n: orbit size (number of repetitions)
  group: GroupType;
  phase: number;      // starting angular offset, radians
  motif: MotifAttributes;
}

export interface Pattern {
  center: Vec2;
  radius: number;     // overall pattern radius (largest layer radius + margin)
  layers: Layer[];
}

/** A concrete placed motif. `attributes` may be canonical or corrupted. */
export interface Instance {
  layerIndex: number;
  index: number;          // 0..count-1 within the layer
  position: Vec2;
  baseAngle: number;      // angular position around the center, radians
  mirroredBySym: boolean; // dihedral groups mirror alternate instances
  attributes: MotifAttributes;
}

export type Axis = "hue" | "spin" | "scale" | "kind" | "mirrored";

export const ALL_AXES: Axis[] = ["hue", "spin", "scale", "kind", "mirrored"];

/** Records a corrupted instance and the canonical attributes that repair it. */
export interface Defect {
  layerIndex: number;
  index: number;
  axes: Axis[];
  canonical: MotifAttributes;
}

export interface GenConfig {
  layerCount: [number, number];   // inclusive range
  countChoices: number[];         // allowed n values per layer
  scale: [number, number];        // motif scale range
  kinds: MotifKind[];             // allowed shapes
  dihedralChance: number;         // 0..1 probability a layer is dihedral
}

export interface CorruptConfig {
  defectCount: [number, number];  // inclusive range
  axesPerDefect: [number, number];// inclusive range
  hueDelta: [number, number];     // min..max degrees of hue perturbation
  spinDelta: [number, number];    // min..max radians of spin perturbation
  scaleDelta: [number, number];   // min..max additive scale perturbation
}
```

- [ ] **Step 2: Commit**

```bash
git add src/core/types.ts
git commit -m "feat(core): add core domain types"
```

---

## Task 3: Geometry helpers

**Files:**
- Create: `src/core/geometry.ts`
- Test: `tests/geometry.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { normalizeAngle, hueDistance, angleDistance, pointOnCircle, approx } from "../src/core/geometry";

describe("geometry", () => {
  it("normalizes angles into [0, 2π)", () => {
    expect(normalizeAngle(0)).toBeCloseTo(0);
    expect(normalizeAngle(2 * Math.PI)).toBeCloseTo(0);
    expect(normalizeAngle(-Math.PI / 2)).toBeCloseTo((3 * Math.PI) / 2);
  });

  it("computes shortest angular distance", () => {
    expect(angleDistance(0.1, 6.2)).toBeCloseTo(Math.abs(0.1 - (6.2 - 2 * Math.PI)), 5);
    expect(angleDistance(0, Math.PI)).toBeCloseTo(Math.PI, 5);
  });

  it("computes shortest hue distance on the 360 wheel", () => {
    expect(hueDistance(10, 350)).toBeCloseTo(20);
    expect(hueDistance(0, 180)).toBeCloseTo(180);
  });

  it("places points on a circle", () => {
    const p = pointOnCircle({ x: 0, y: 0 }, 10, 0);
    expect(p.x).toBeCloseTo(10);
    expect(p.y).toBeCloseTo(0);
  });

  it("approx compares with epsilon", () => {
    expect(approx(1.0, 1.0 + 1e-9)).toBe(true);
    expect(approx(1.0, 1.1)).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/geometry.test.ts`
Expected: FAIL — module `../src/core/geometry` not found.

- [ ] **Step 3: Write the implementation**

```ts
import type { Vec2 } from "./types";

export const TWO_PI = Math.PI * 2;

export function normalizeAngle(a: number): number {
  return ((a % TWO_PI) + TWO_PI) % TWO_PI;
}

/** Shortest absolute distance between two angles, in [0, π]. */
export function angleDistance(a: number, b: number): number {
  const d = normalizeAngle(a - b);
  return Math.min(d, TWO_PI - d);
}

/** Shortest absolute distance between two hues on the 360° wheel, in [0, 180]. */
export function hueDistance(a: number, b: number): number {
  const d = ((a - b) % 360 + 360) % 360;
  return Math.min(d, 360 - d);
}

export function pointOnCircle(center: Vec2, radius: number, angle: number): Vec2 {
  return { x: center.x + radius * Math.cos(angle), y: center.y + radius * Math.sin(angle) };
}

export function approx(a: number, b: number, eps = 1e-6): boolean {
  return Math.abs(a - b) <= eps;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/geometry.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/core/geometry.ts tests/geometry.test.ts
git commit -m "feat(core): add geometry helpers"
```

---

## Task 4: Seeded RNG

**Files:**
- Create: `src/core/rng.ts`
- Test: `tests/rng.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { createRng, randInt, randRange, pick } from "../src/core/rng";

describe("rng", () => {
  it("is deterministic for a given seed", () => {
    const a = createRng(42); const b = createRng(42);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });

  it("differs across seeds", () => {
    expect(createRng(1)()).not.toEqual(createRng(2)());
  });

  it("randInt stays within inclusive bounds", () => {
    const r = createRng(7);
    for (let i = 0; i < 200; i++) {
      const n = randInt(r, 3, 6);
      expect(n).toBeGreaterThanOrEqual(3);
      expect(n).toBeLessThanOrEqual(6);
    }
  });

  it("pick returns an element of the array", () => {
    const r = createRng(9);
    const arr = ["a", "b", "c"];
    expect(arr).toContain(pick(r, arr));
  });

  it("randRange stays within bounds", () => {
    const r = createRng(11);
    for (let i = 0; i < 200; i++) {
      const n = randRange(r, 2, 5);
      expect(n).toBeGreaterThanOrEqual(2);
      expect(n).toBeLessThan(5);
    }
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/rng.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation** (mulberry32)

```ts
export type Rng = () => number;

export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randRange(r: Rng, min: number, max: number): number {
  return min + r() * (max - min);
}

export function randInt(r: Rng, min: number, max: number): number {
  return min + Math.floor(r() * (max - min + 1));
}

export function pick<T>(r: Rng, arr: T[]): T {
  return arr[Math.floor(r() * arr.length)]!;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/rng.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/core/rng.ts tests/rng.test.ts
git commit -m "feat(core): add seeded deterministic RNG"
```

---

## Task 5: Symmetry engine — instantiate layers

**Files:**
- Create: `src/core/symmetry.ts`
- Test: `tests/symmetry.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/symmetry.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```ts
import type { Instance, Layer, Pattern, Vec2 } from "./types";
import { TWO_PI, pointOnCircle } from "./geometry";

export function instantiateLayer(layer: Layer, layerIndex: number, center: Vec2): Instance[] {
  const out: Instance[] = [];
  for (let i = 0; i < layer.count; i++) {
    const baseAngle = layer.phase + (TWO_PI * i) / layer.count;
    out.push({
      layerIndex,
      index: i,
      position: pointOnCircle(center, layer.radius, baseAngle),
      baseAngle,
      mirroredBySym: layer.group === "dihedral" && i % 2 === 1,
      attributes: { ...layer.motif },
    });
  }
  return out;
}

export function instantiatePattern(pattern: Pattern): Instance[] {
  return pattern.layers.flatMap((layer, idx) => instantiateLayer(layer, idx, pattern.center));
}
```

> Note: `baseAngle` for the phase-0 / count-4 case yields exactly `[0, π/2, π, 3π/2]` because `pointOnCircle` and the angle arithmetic are exact at these multiples; the test asserts exact equality intentionally.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/symmetry.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/core/symmetry.ts tests/symmetry.test.ts
git commit -m "feat(core): instantiate rosette layers into instances"
```

---

## Task 6: Correctness verification

**Files:**
- Modify: `src/core/symmetry.ts`
- Test: `tests/correctness.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/correctness.test.ts`
Expected: FAIL — `isInstanceCorrect` / `attributesMatch` not exported.

- [ ] **Step 3: Add the implementation to `src/core/symmetry.ts`**

```ts
import type { MotifAttributes, Layer, Instance } from "./types";
import { angleDistance, hueDistance, approx } from "./geometry";

const HUE_EPS = 1.0;     // degrees
const SPIN_EPS = 0.02;   // radians
const SCALE_EPS = 0.02;

export function attributesMatch(a: MotifAttributes, b: MotifAttributes): boolean {
  return (
    a.kind === b.kind &&
    a.mirrored === b.mirrored &&
    hueDistance(a.hue, b.hue) <= HUE_EPS &&
    angleDistance(a.spin, b.spin) <= SPIN_EPS &&
    approx(a.scale, b.scale, SCALE_EPS)
  );
}

export function isInstanceCorrect(inst: Instance, layer: Layer): boolean {
  return attributesMatch(inst.attributes, layer.motif);
}
```

> Add these to the existing `symmetry.ts` (keep the Task 5 exports). Merge the two `import type` lines from `./types` into one if your linter prefers.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/correctness.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/core/symmetry.ts tests/correctness.test.ts
git commit -m "feat(core): add instance correctness verification"
```

---

## Task 7: Pattern generator

**Files:**
- Create: `src/core/generator.ts`
- Test: `tests/generator.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { generatePattern } from "../src/core/generator";
import type { GenConfig } from "../src/core/types";

const cfg: GenConfig = {
  layerCount: [2, 4],
  countChoices: [4, 6, 8, 12],
  scale: [0.7, 1.2],
  kinds: ["petal", "diamond", "triangle"],
  dihedralChance: 0.5,
};

describe("generatePattern", () => {
  it("is deterministic for a seed", () => {
    expect(generatePattern(123, cfg)).toEqual(generatePattern(123, cfg));
  });

  it("differs across seeds", () => {
    expect(generatePattern(1, cfg)).not.toEqual(generatePattern(2, cfg));
  });

  it("respects layer-count bounds", () => {
    for (let s = 0; s < 50; s++) {
      const p = generatePattern(s, cfg);
      expect(p.layers.length).toBeGreaterThanOrEqual(2);
      expect(p.layers.length).toBeLessThanOrEqual(4);
    }
  });

  it("uses only allowed counts and kinds, with increasing radii", () => {
    const p = generatePattern(99, cfg);
    let prevRadius = -1;
    for (const layer of p.layers) {
      expect(cfg.countChoices).toContain(layer.count);
      expect(cfg.kinds).toContain(layer.motif.kind);
      expect(layer.radius).toBeGreaterThan(prevRadius);
      prevRadius = layer.radius;
    }
  });

  it("sets pattern radius to cover the outermost layer", () => {
    const p = generatePattern(5, cfg);
    const maxLayer = Math.max(...p.layers.map((l) => l.radius));
    expect(p.radius).toBeGreaterThanOrEqual(maxLayer);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/generator.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```ts
import type { GenConfig, Layer, Pattern } from "./types";
import { createRng, randInt, randRange, pick } from "./rng";
import { TWO_PI } from "./geometry";

const LAYER_SPACING = 90;   // world units between successive layer radii
const FIRST_RADIUS = 80;
const MARGIN = 70;

export function generatePattern(seed: number, cfg: GenConfig): Pattern {
  const r = createRng(seed);
  const layerCount = randInt(r, cfg.layerCount[0], cfg.layerCount[1]);
  const layers: Layer[] = [];

  for (let i = 0; i < layerCount; i++) {
    const radius = FIRST_RADIUS + i * LAYER_SPACING;
    const count = pick(r, cfg.countChoices);
    const group = r() < cfg.dihedralChance ? "dihedral" : "cyclic";
    layers.push({
      radius,
      count,
      group,
      phase: randRange(r, 0, TWO_PI),
      motif: {
        kind: pick(r, cfg.kinds),
        hue: randRange(r, 0, 360),
        spin: randRange(r, 0, TWO_PI),
        scale: randRange(r, cfg.scale[0], cfg.scale[1]),
        mirrored: false,
      },
    });
  }

  const outer = layers[layers.length - 1]!.radius;
  return { center: { x: 0, y: 0 }, radius: outer + MARGIN, layers };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/generator.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/core/generator.ts tests/generator.test.ts
git commit -m "feat(core): add seed-deterministic pattern generator"
```

---

## Task 8: Corruptor

**Files:**
- Create: `src/core/corruptor.ts`
- Test: `tests/corruptor.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/corruptor.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```ts
import type { Axis, CorruptConfig, Defect, Instance, MotifAttributes, MotifKind, Pattern } from "./types";
import { MOTIF_KINDS } from "./types";
import { createRng, randInt, randRange, pick, type Rng } from "./rng";
import { normalizeAngle } from "./geometry";

const CORRUPTIBLE: Axis[] = ["hue", "spin", "scale", "kind", "mirrored"];

function perturb(attr: MotifAttributes, axis: Axis, r: Rng, cfg: CorruptConfig): MotifAttributes {
  const next = { ...attr };
  const sign = r() < 0.5 ? -1 : 1;
  switch (axis) {
    case "hue":
      next.hue = (attr.hue + sign * randRange(r, cfg.hueDelta[0], cfg.hueDelta[1]) + 360) % 360;
      break;
    case "spin":
      next.spin = normalizeAngle(attr.spin + sign * randRange(r, cfg.spinDelta[0], cfg.spinDelta[1]));
      break;
    case "scale":
      next.scale = Math.max(0.4, attr.scale + sign * randRange(r, cfg.scaleDelta[0], cfg.scaleDelta[1]));
      break;
    case "kind": {
      const others = MOTIF_KINDS.filter((k) => k !== attr.kind);
      next.kind = pick(r, others) as MotifKind;
      break;
    }
    case "mirrored":
      next.mirrored = !attr.mirrored;
      break;
  }
  return next;
}

export function corruptPattern(
  instances: Instance[],
  pattern: Pattern,
  seed: number,
  cfg: CorruptConfig,
): { instances: Instance[]; defects: Defect[] } {
  const r = createRng(seed ^ 0x9e3779b9);
  const defectTotal = Math.min(randInt(r, cfg.defectCount[0], cfg.defectCount[1]), instances.length);

  // Choose distinct instances to corrupt.
  const indices = instances.map((_, i) => i);
  for (let i = indices.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [indices[i], indices[j]] = [indices[j]!, indices[i]!];
  }
  const chosen = indices.slice(0, defectTotal);

  const defects: Defect[] = [];
  for (const idx of chosen) {
    const inst = instances[idx]!;
    const canonical = pattern.layers[inst.layerIndex]!.motif;
    const axisCount = randInt(r, cfg.axesPerDefect[0], cfg.axesPerDefect[1]);

    // Pick distinct axes for this defect.
    const pool = [...CORRUPTIBLE];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(r() * (i + 1));
      [pool[i], pool[j]] = [pool[j]!, pool[i]!];
    }
    const axes = pool.slice(0, axisCount);

    let attrs = { ...canonical };
    for (const axis of axes) attrs = perturb(attrs, axis, r, cfg);
    inst.attributes = attrs;
    defects.push({ layerIndex: inst.layerIndex, index: inst.index, axes, canonical: { ...canonical } });
  }
  return { instances, defects };
}
```

> The `seed ^ 0x9e3779b9` keeps the corruption RNG stream independent of the generator's, so the same seed produces a stable (pattern, defects) pair.

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/corruptor.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/core/corruptor.ts tests/corruptor.test.ts
git commit -m "feat(core): add defect corruptor with canonical repair record"
```

---

## Task 9: Difficulty configs

**Files:**
- Create: `src/core/difficulty.ts`
- Test: `tests/difficulty.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { configForLevel, MAX_LEVEL } from "../src/core/difficulty";

describe("configForLevel", () => {
  it("returns gen and corrupt configs for every level", () => {
    for (let lvl = 1; lvl <= MAX_LEVEL; lvl++) {
      const { gen, corrupt } = configForLevel(lvl, 100);
      expect(gen.layerCount[0]).toBeGreaterThanOrEqual(2);
      expect(corrupt.defectCount[0]).toBeGreaterThanOrEqual(1);
      expect(corrupt.hueDelta[0]).toBeGreaterThan(0);
    }
  });

  it("higher levels are not easier (defects and layers are monotonic non-decreasing)", () => {
    const low = configForLevel(1, 100);
    const high = configForLevel(MAX_LEVEL, 100);
    expect(high.corrupt.defectCount[1]).toBeGreaterThanOrEqual(low.corrupt.defectCount[1]);
    expect(high.gen.layerCount[1]).toBeGreaterThanOrEqual(low.gen.layerCount[1]);
  });

  it("higher levels are subtler (smaller minimum perturbations)", () => {
    const low = configForLevel(1, 100);
    const high = configForLevel(MAX_LEVEL, 100);
    expect(high.corrupt.hueDelta[0]).toBeLessThanOrEqual(low.corrupt.hueDelta[0]);
  });

  it("auto-eases the first few puzzles below the chosen level", () => {
    const eased = configForLevel(5, 0);     // very first puzzle
    const settled = configForLevel(5, 50);   // later puzzle, same level
    expect(eased.corrupt.defectCount[1]).toBeLessThanOrEqual(settled.corrupt.defectCount[1]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/difficulty.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```ts
import type { CorruptConfig, GenConfig } from "./types";

export const MAX_LEVEL = 8;

/**
 * Maps a player-chosen difficulty level (1..MAX_LEVEL) and the running puzzle
 * index to generator + corruptor configs. Difficulty scales by perceptual
 * richness (more layers, more defects) and subtlety (smaller perturbations),
 * never by deductive depth. The first few puzzles of a session are auto-eased.
 */
export function configForLevel(level: number, puzzleIndex: number): { gen: GenConfig; corrupt: CorruptConfig } {
  const ease = puzzleIndex < 3 ? 1 : 0;                 // first 3 puzzles: one notch easier
  const t = Math.max(1, level - ease) / MAX_LEVEL;      // normalized 0..1 difficulty

  const maxLayers = Math.round(2 + t * 3);              // 2..5 layers
  const maxDefects = Math.round(2 + t * 5);             // 2..7 defects
  const maxAxes = t > 0.6 ? 2 : 1;                      // multi-axis only at higher levels

  // Subtler perturbations as difficulty rises (still above perceptibility floor).
  const hueMin = Math.round(70 - t * 45);               // 70 -> 25 degrees
  const spinMin = 0.9 - t * 0.55;                       // 0.9 -> 0.35 radians
  const scaleMin = 0.35 - t * 0.2;                      // 0.35 -> 0.15

  return {
    gen: {
      layerCount: [2, maxLayers],
      countChoices: [4, 6, 8, 12],
      scale: [0.7, 1.2],
      kinds: ["petal", "diamond", "triangle", "square", "pentagon", "hexagon"],
      dihedralChance: t > 0.4 ? 0.5 : 0.2,
    },
    corrupt: {
      defectCount: [Math.max(1, maxDefects - 2), maxDefects],
      axesPerDefect: [1, maxAxes],
      hueDelta: [hueMin, hueMin + 30],
      spinDelta: [spinMin, spinMin + 0.5],
      scaleDelta: [scaleMin, scaleMin + 0.15],
    },
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/difficulty.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/core/difficulty.ts tests/difficulty.test.ts
git commit -m "feat(core): map difficulty levels to generation configs"
```

---

## Task 10: Puzzle state

**Files:**
- Create: `src/core/puzzle.ts`
- Test: `tests/puzzle.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { createPuzzle, instanceAt, repairDefect, remainingCount, isComplete } from "../src/core/puzzle";

describe("puzzle", () => {
  it("creates a puzzle with defects and a matching remaining count", () => {
    const p = createPuzzle(123, 4, 100);
    expect(p.defects.length).toBeGreaterThan(0);
    expect(remainingCount(p)).toBe(p.defects.length);
    expect(isComplete(p)).toBe(false);
  });

  it("is deterministic for the same (seed, level, index)", () => {
    expect(createPuzzle(5, 3, 10)).toEqual(createPuzzle(5, 3, 10));
  });

  it("repairing a defect restores its instance and lowers the count", () => {
    const p = createPuzzle(123, 4, 100);
    const d = p.defects[0]!;
    const before = remainingCount(p);
    repairDefect(p, d.layerIndex, d.index);
    const inst = instanceAt(p, d.layerIndex, d.index)!;
    expect(inst.attributes).toEqual(d.canonical);
    expect(remainingCount(p)).toBe(before - 1);
  });

  it("is complete once all defects are repaired", () => {
    const p = createPuzzle(123, 4, 100);
    for (const d of [...p.defects]) repairDefect(p, d.layerIndex, d.index);
    expect(remainingCount(p)).toBe(0);
    expect(isComplete(p)).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/puzzle.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```ts
import type { Defect, Instance, Pattern } from "./types";
import { generatePattern } from "./generator";
import { corruptPattern } from "./corruptor";
import { instantiatePattern, isInstanceCorrect } from "./symmetry";
import { configForLevel } from "./difficulty";

export interface Puzzle {
  seed: number;
  level: number;
  pattern: Pattern;
  instances: Instance[];
  defects: Defect[];
}

export function createPuzzle(seed: number, level: number, puzzleIndex: number): Puzzle {
  const { gen, corrupt } = configForLevel(level, puzzleIndex);
  const pattern = generatePattern(seed, gen);
  const instances = instantiatePattern(pattern);
  const { defects } = corruptPattern(instances, pattern, seed, corrupt);
  return { seed, level, pattern, instances, defects };
}

export function instanceAt(p: Puzzle, layerIndex: number, index: number): Instance | undefined {
  return p.instances.find((i) => i.layerIndex === layerIndex && i.index === index);
}

/** Snap an instance to its canonical attributes (used when a repair is completed). */
export function repairDefect(p: Puzzle, layerIndex: number, index: number): void {
  const inst = instanceAt(p, layerIndex, index);
  const layer = p.pattern.layers[layerIndex];
  if (inst && layer) inst.attributes = { ...layer.motif };
}

export function remainingCount(p: Puzzle): number {
  return p.instances.filter((i) => !isInstanceCorrect(i, p.pattern.layers[i.layerIndex]!)).length;
}

export function isComplete(p: Puzzle): boolean {
  return remainingCount(p) === 0;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/puzzle.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/core/puzzle.ts tests/puzzle.test.ts
git commit -m "feat(core): add puzzle aggregate state and repair logic"
```

---

## Task 11: Motif shape geometry

**Files:**
- Create: `src/render/shapes.ts`
- Test: `tests/shapes.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/shapes.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/shapes.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/render/shapes.ts tests/shapes.test.ts
git commit -m "feat(render): add motif shape vertex geometry"
```

---

## Task 12: Viewport transform and hit-testing

**Files:**
- Create: `src/render/viewport.ts`
- Test: `tests/viewport.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/viewport.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```ts
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/viewport.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/render/viewport.ts tests/viewport.test.ts
git commit -m "feat(render): add viewport transform and hit-testing"
```

---

## Task 13: Transform-control logic

**Files:**
- Create: `src/ui/controls.ts`
- Test: `tests/controls.test.ts`

This is the inner-puzzle logic, kept pure so it is testable. The DOM widgets in Task 17 call into it.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { applyControl, isRepaired } from "../src/ui/controls";
import type { MotifAttributes } from "../src/core/types";

const canon: MotifAttributes = { kind: "petal", hue: 200, spin: 1.0, scale: 1, mirrored: false };

describe("controls", () => {
  it("rotating nudges spin and reports closeness", () => {
    const cur = { ...canon, spin: 1.6 };
    const next = applyControl(cur, { axis: "spin", delta: -0.3 });
    expect(next.spin).toBeCloseTo(1.3, 5);
    expect(isRepaired(next, canon, ["spin"])).toBe(false);
  });

  it("reports repaired once every corrupted axis is within tolerance", () => {
    const cur = { ...canon, hue: 240, spin: 1.4 };
    let s = applyControl(cur, { axis: "hue", delta: -40 });
    s = applyControl(s, { axis: "spin", delta: -0.4 });
    expect(isRepaired(s, canon, ["hue", "spin"])).toBe(true);
  });

  it("cycling kind moves through the kind list", () => {
    const cur = { ...canon, kind: "square" as const };
    const next = applyControl(cur, { axis: "kind", delta: 1 });
    expect(next.kind).not.toBe("square");
  });

  it("toggling mirror flips chirality", () => {
    const next = applyControl({ ...canon, mirrored: true }, { axis: "mirrored", delta: 1 });
    expect(next.mirrored).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/controls.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```ts
import type { Axis, MotifAttributes, MotifKind } from "../core/types";
import { MOTIF_KINDS } from "../core/types";
import { attributesMatch } from "../core/symmetry";
import { normalizeAngle } from "../core/geometry";

export interface ControlInput { axis: Axis; delta: number; }

export function applyControl(attr: MotifAttributes, input: ControlInput): MotifAttributes {
  const next = { ...attr };
  switch (input.axis) {
    case "hue": next.hue = (attr.hue + input.delta + 360) % 360; break;
    case "spin": next.spin = normalizeAngle(attr.spin + input.delta); break;
    case "scale": next.scale = Math.max(0.4, Math.min(1.8, attr.scale + input.delta)); break;
    case "kind": {
      const i = MOTIF_KINDS.indexOf(attr.kind);
      const n = MOTIF_KINDS.length;
      next.kind = MOTIF_KINDS[((i + Math.sign(input.delta) + n) % n)] as MotifKind;
      break;
    }
    case "mirrored": next.mirrored = !attr.mirrored; break;
  }
  return next;
}

/** True when the current attributes match canonical on the corrupted axes. */
export function isRepaired(cur: MotifAttributes, canonical: MotifAttributes, _axes: Axis[]): boolean {
  // attributesMatch already checks every axis with the same tolerances used for
  // verification, so a full match is sufficient (and stricter is fine).
  return attributesMatch(cur, canonical);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/controls.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add src/ui/controls.ts tests/controls.test.ts
git commit -m "feat(ui): add pure transform-control logic"
```

---

## Task 14: Hint target selection

**Files:**
- Create: `src/ui/hint.ts`
- Test: `tests/hint.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/hint.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```ts
import type { Vec2 } from "../core/types";
import type { Puzzle } from "../core/puzzle";
import { isInstanceCorrect } from "../core/symmetry";

export interface HintTarget { layerIndex: number; index: number; position: Vec2; }

/** Picks the first still-corrupted instance to glow toward; null if solved. */
export function pickHintTarget(p: Puzzle): HintTarget | null {
  for (const i of p.instances) {
    if (!isInstanceCorrect(i, p.pattern.layers[i.layerIndex]!)) {
      return { layerIndex: i.layerIndex, index: i.index, position: i.position };
    }
  }
  return null;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/hint.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/ui/hint.ts tests/hint.test.ts
git commit -m "feat(ui): add hint target selection"
```

---

## Task 15: Persistence

**Files:**
- Create: `src/app/persistence.ts`
- Test: `tests/persistence.test.ts`

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import { saveSession, loadSession, defaultSession, type Session } from "../src/app/persistence";

const store = new Map<string, string>();
beforeEach(() => {
  store.clear();
  vi.stubGlobal("localStorage", {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
  });
});

describe("persistence", () => {
  it("round-trips a session", () => {
    const s: Session = { level: 4, puzzleIndex: 12, seed: 9981, repaired: ["0:1", "2:3"], showCount: false };
    saveSession(s);
    expect(loadSession()).toEqual(s);
  });

  it("returns a default session when storage is empty", () => {
    expect(loadSession()).toEqual(defaultSession());
  });

  it("returns a default session when stored JSON is corrupt", () => {
    localStorage.setItem("symmetry-repair/session", "{not json");
    expect(loadSession()).toEqual(defaultSession());
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/persistence.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```ts
export interface Session {
  level: number;
  puzzleIndex: number;
  seed: number;
  repaired: string[];   // "layerIndex:index" keys already healed in the current puzzle
  showCount: boolean;
}

const KEY = "symmetry-repair/session";

export function defaultSession(): Session {
  return { level: 3, puzzleIndex: 0, seed: 1, repaired: [], showCount: true };
}

export function saveSession(s: Session): void {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function loadSession(): Session {
  const raw = localStorage.getItem(KEY);
  if (!raw) return defaultSession();
  try {
    const parsed = JSON.parse(raw) as Partial<Session>;
    return { ...defaultSession(), ...parsed };
  } catch {
    return defaultSession();
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/persistence.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/app/persistence.ts tests/persistence.test.ts
git commit -m "feat(app): add session persistence"
```

---

## Task 16: Renderer

**Files:**
- Create: `src/render/renderer.ts`
- Test: `tests/renderer.test.ts`

Canvas pixels are verified by running the app (Task 21), but the renderer must not throw and must honor mirror/scale/spin. We test it against a minimal fake 2D context that records calls.

- [ ] **Step 1: Write the failing test**

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/renderer.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```ts
import type { Instance, Pattern } from "../core/types";
import { motifVertices } from "./shapes";

const MOTIF_RADIUS = 26; // base world radius of a motif at scale 1

export function hslString(hue: number, sat: number, light: number): string {
  return `hsl(${Math.round(hue)}, ${Math.round(sat * 100)}%, ${Math.round(light * 100)}%)`;
}

export function drawInstance(ctx: CanvasRenderingContext2D, inst: Instance, pop = 0): void {
  const a = inst.attributes;
  const mirrored = a.mirrored !== inst.mirroredBySym; // XOR: authored flip vs symmetry flip
  ctx.save();
  ctx.translate(inst.position.x, inst.position.y);
  ctx.rotate(inst.baseAngle + Math.PI / 2 + a.spin); // outward orientation + own spin
  if (mirrored) ctx.scale(-1, 1);
  ctx.scale(a.scale * MOTIF_RADIUS, a.scale * MOTIF_RADIUS);

  const verts = motifVertices(a.kind);
  ctx.beginPath();
  ctx.moveTo(verts[0]!.x, verts[0]!.y);
  for (let i = 1; i < verts.length; i++) ctx.lineTo(verts[i]!.x, verts[i]!.y);
  ctx.closePath();

  ctx.fillStyle = hslString(a.hue, 0.55 + pop * 0.25, 0.55 + pop * 0.08);
  ctx.fill();
  ctx.restore();
}

export function drawPattern(ctx: CanvasRenderingContext2D, instances: Instance[], pop = 0): void {
  for (const inst of instances) drawInstance(ctx, inst, pop);
}

/** Convenience used by the app to draw a full puzzle's instances. */
export function drawPuzzle(ctx: CanvasRenderingContext2D, pattern: Pattern, instances: Instance[], pop = 0): void {
  void pattern;
  drawPattern(ctx, instances, pop);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/renderer.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/render/renderer.ts tests/renderer.test.ts
git commit -m "feat(render): draw motif instances to canvas"
```

---

## Task 17: Animation driver (zoom + completion)

**Files:**
- Create: `src/render/animation.ts`
- Test: `tests/animation.test.ts`

The tween math is pure and tested; the `requestAnimationFrame` loop is a thin wrapper.

- [ ] **Step 1: Write the failing test**

```ts
import { describe, it, expect } from "vitest";
import { easeInOut, lerp, lerpVec, type Tween, tweenValue } from "../src/render/animation";

describe("animation math", () => {
  it("easeInOut is 0 at 0, 1 at 1, 0.5 at 0.5", () => {
    expect(easeInOut(0)).toBeCloseTo(0);
    expect(easeInOut(1)).toBeCloseTo(1);
    expect(easeInOut(0.5)).toBeCloseTo(0.5);
  });

  it("lerp interpolates", () => {
    expect(lerp(10, 20, 0.5)).toBe(15);
    expect(lerpVec({ x: 0, y: 0 }, { x: 4, y: 8 }, 0.25)).toEqual({ x: 1, y: 2 });
  });

  it("tweenValue eases between endpoints over its duration", () => {
    const t: Tween = { from: 0, to: 100, start: 1000, duration: 200 };
    expect(tweenValue(t, 1000)).toBeCloseTo(0);
    expect(tweenValue(t, 1200)).toBeCloseTo(100);
    expect(tweenValue(t, 5000)).toBeCloseTo(100); // clamps past the end
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run tests/animation.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Write the implementation**

```ts
import type { Vec2 } from "../core/types";

export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpVec(a: Vec2, b: Vec2, t: number): Vec2 {
  return { x: lerp(a.x, b.x, t), y: lerp(a.y, b.y, t) };
}

export interface Tween { from: number; to: number; start: number; duration: number; }

export function tweenValue(t: Tween, now: number): number {
  const raw = (now - t.start) / t.duration;
  const clamped = Math.max(0, Math.min(1, raw));
  return lerp(t.from, t.to, easeInOut(clamped));
}

/** Runs `tick(now)` each frame until it returns true, then calls `done`. */
export function runLoop(tick: (now: number) => boolean, done: () => void): void {
  const frame = (now: number) => {
    if (tick(now)) done();
    else requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run tests/animation.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/render/animation.ts tests/animation.test.ts
git commit -m "feat(render): add tween math and animation loop driver"
```

---

## Task 18: HUD (remaining count, hint button, settings)

**Files:**
- Create: `src/ui/hud.ts`
- Test: `tests/hud.test.ts` (jsdom)

- [ ] **Step 1: Add a jsdom test project to `vite.config.ts`**

Replace the `test` block in `vite.config.ts` so DOM tests get jsdom while core tests stay on node:

```ts
import { defineConfig } from "vite";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    environmentMatchGlobs: [["tests/hud.test.ts", "jsdom"]],
  },
});
```

Add `jsdom` to devDependencies:

Run: `npm install -D jsdom@^29.0.1`

- [ ] **Step 2: Write the failing test**

```ts
import { describe, it, expect, vi } from "vitest";
import { createHud } from "../src/ui/hud";

describe("hud", () => {
  it("shows the remaining count and hides it when disabled", () => {
    const root = document.createElement("div");
    const hud = createHud(root, { onHint: () => {}, onToggleCount: () => {}, onLevel: () => {} });
    hud.setCount(3, true);
    expect(root.querySelector("[data-count]")!.textContent).toContain("3");
    hud.setCount(3, false);
    expect((root.querySelector("[data-count]") as HTMLElement).style.display).toBe("none");
  });

  it("fires onHint when the hint button is clicked", () => {
    const root = document.createElement("div");
    const onHint = vi.fn();
    createHud(root, { onHint, onToggleCount: () => {}, onLevel: () => {} });
    (root.querySelector("[data-hint]") as HTMLButtonElement).click();
    expect(onHint).toHaveBeenCalledOnce();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run tests/hud.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 4: Write the implementation**

```ts
export interface HudCallbacks {
  onHint: () => void;
  onToggleCount: () => void;
  onLevel: (level: number) => void;
}

export interface Hud {
  setCount: (n: number, show: boolean) => void;
}

export function createHud(root: HTMLElement, cb: HudCallbacks): Hud {
  const count = document.createElement("div");
  count.dataset.count = "";
  count.style.cssText = "position:fixed;top:16px;left:16px;font:600 18px system-ui;color:#cdd6f4;";

  const hint = document.createElement("button");
  hint.dataset.hint = "";
  hint.textContent = "Hint";
  hint.style.cssText = "position:fixed;bottom:16px;right:16px;padding:10px 16px;border-radius:10px;border:0;background:#313244;color:#cdd6f4;font:600 15px system-ui;";
  hint.addEventListener("click", cb.onHint);

  const toggle = document.createElement("button");
  toggle.textContent = "Count";
  toggle.style.cssText = "position:fixed;bottom:16px;left:16px;padding:10px 16px;border-radius:10px;border:0;background:#313244;color:#cdd6f4;font:600 15px system-ui;";
  toggle.addEventListener("click", cb.onToggleCount);

  root.append(count, hint, toggle);

  return {
    setCount(n: number, show: boolean) {
      count.style.display = show ? "block" : "none";
      count.textContent = `${n} left`;
    },
  };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run tests/hud.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add src/ui/hud.ts tests/hud.test.ts vite.config.ts package.json package-lock.json
git commit -m "feat(ui): add HUD with count, hint, and settings toggle"
```

---

## Task 19: App wiring — the running game

**Files:**
- Modify: `src/app/main.ts` (replace the scaffolding placeholder entirely)
- Create: `src/app/state.ts`

This task has no new unit tests; it composes tested units. Verification is by running (Task 21). Implement carefully and follow the inline comments.

- [ ] **Step 1: Write `src/app/state.ts`**

```ts
import { createPuzzle, type Puzzle } from "../core/puzzle";
import { loadSession, saveSession, type Session } from "./persistence";

export interface AppState {
  session: Session;
  puzzle: Puzzle;
}

/** Builds the live puzzle from the session, replaying any already-repaired defects. */
export function buildPuzzle(session: Session): Puzzle {
  const puzzle = createPuzzle(session.seed, session.level, session.puzzleIndex);
  for (const key of session.repaired) {
    const [layerIndex, index] = key.split(":").map(Number);
    const inst = puzzle.instances.find((i) => i.layerIndex === layerIndex && i.index === index);
    const layer = puzzle.pattern.layers[layerIndex!];
    if (inst && layer) inst.attributes = { ...layer.motif };
  }
  return puzzle;
}

export function initState(): AppState {
  const session = loadSession();
  return { session, puzzle: buildPuzzle(session) };
}

export function recordRepair(state: AppState, layerIndex: number, index: number): void {
  const key = `${layerIndex}:${index}`;
  if (!state.session.repaired.includes(key)) state.session.repaired.push(key);
  saveSession(state.session);
}

/** Advances to the next puzzle in the endless stream. */
export function nextPuzzle(state: AppState): void {
  state.session.puzzleIndex += 1;
  state.session.seed = (state.session.seed * 1664525 + 1013904223) >>> 0;
  state.session.repaired = [];
  saveSession(state.session);
  state.puzzle = buildPuzzle(state.session);
}
```

- [ ] **Step 2: Write `src/app/main.ts`**

```ts
import { initState, recordRepair, nextPuzzle, type AppState } from "./state";
import { Viewport, hitTest } from "../render/viewport";
import { drawPattern } from "../render/renderer";
import { runLoop, tweenValue, lerpVec, type Tween } from "../render/animation";
import { isInstanceCorrect } from "../core/symmetry";
import { remainingCount, isComplete } from "../core/puzzle";
import { applyControl, isRepaired } from "../ui/controls";
import { createHud } from "../ui/hud";
import { pickHintTarget } from "../ui/hint";
import type { Instance } from "../core/types";

const canvas = document.getElementById("board") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
const hudRoot = document.getElementById("hud")!;
const state: AppState = initState();

let vp = new Viewport(window.innerWidth, window.innerHeight);
let active: Instance | null = null;          // defect being repaired (zoomed in)
let glow: { x: number; y: number; until: number } | null = null;

function resize() {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = window.innerWidth * dpr;
  canvas.height = window.innerHeight * dpr;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  vp = new Viewport(window.innerWidth, window.innerHeight);
  fitOverview();
}
window.addEventListener("resize", resize);

function fitOverview() {
  const r = state.puzzle.pattern.radius;
  const zoom = Math.min(vp.width, vp.height) / (r * 2.1);
  vp.setView(state.puzzle.pattern.center, zoom);
}

const hud = createHud(hudRoot, {
  onHint: () => {
    const t = pickHintTarget(state.puzzle);
    if (t) glow = { x: t.position.x, y: t.position.y, until: performance.now() + 2500 };
  },
  onToggleCount: () => {
    state.session.showCount = !state.session.showCount;
    refreshHud();
  },
  onLevel: (lvl) => { state.session.level = lvl; nextPuzzle(state); fitOverview(); },
});

function refreshHud() {
  hud.setCount(remainingCount(state.puzzle), state.session.showCount);
}

// --- Pointer handling: tap a defect to zoom in; in zoom, drag to rotate / tap controls ---
canvas.addEventListener("pointerdown", (e) => {
  const world = vp.screenToWorld({ x: e.clientX, y: e.clientY });
  if (!active) {
    const hit = hitTest(state.puzzle.instances, world, 34);
    if (hit && !isInstanceCorrect(hit, state.puzzle.pattern.layers[hit.layerIndex]!)) {
      zoomTo(hit);
    }
  }
});

// Repair controls live in the zoom view. For v1 the active defect's corrupted axes
// are stepped with on-screen buttons rendered by buildControlBar(); each calls step().
function step(axis: import("../core/types").Axis, delta: number) {
  if (!active) return;
  active.attributes = applyControl(active.attributes, { axis, delta });
  const layer = state.puzzle.pattern.layers[active.layerIndex]!;
  const defect = state.puzzle.defects.find(
    (d) => d.layerIndex === active!.layerIndex && d.index === active!.index,
  )!;
  if (isRepaired(active.attributes, layer.motif, defect.axes)) {
    active.attributes = { ...layer.motif };          // snap exactly
    recordRepair(state, active.layerIndex, active.index);
    zoomOut();
  }
}

let controlBar: HTMLElement | null = null;
function buildControlBar(defectAxes: import("../core/types").Axis[]) {
  controlBar?.remove();
  controlBar = document.createElement("div");
  controlBar.style.cssText =
    "position:fixed;bottom:90px;left:50%;transform:translateX(-50%);display:flex;gap:10px;";
  const steps: Record<string, [number, number]> = {
    hue: [-12, 12], spin: [-0.15, 0.15], scale: [-0.08, 0.08], kind: [-1, 1], mirrored: [1, 1],
  };
  for (const axis of defectAxes) {
    for (const d of (axis === "mirrored" ? [steps[axis]![0]] : steps[axis]!)) {
      const b = document.createElement("button");
      b.textContent = `${axis}${axis === "mirrored" ? "" : d < 0 ? " −" : " +"}`;
      b.style.cssText = "padding:10px 14px;border-radius:10px;border:0;background:#45475a;color:#cdd6f4;font:600 14px system-ui;";
      b.addEventListener("click", () => step(axis, d));
      controlBar.appendChild(b);
    }
  }
  hudRoot.appendChild(controlBar);
}

function zoomTo(inst: Instance) {
  active = inst;
  const from = { ...vp.center }; const fromZoom = vp.zoom;
  const toZoom = Math.min(vp.width, vp.height) / 140;
  animateView(from, inst.position, fromZoom, toZoom, () => {
    const defect = state.puzzle.defects.find((d) => d.layerIndex === inst.layerIndex && d.index === inst.index)!;
    buildControlBar(defect.axes);
  });
}

function zoomOut() {
  controlBar?.remove(); controlBar = null;
  const from = { ...vp.center }; const fromZoom = vp.zoom;
  active = null;
  const overviewZoom = Math.min(vp.width, vp.height) / (state.puzzle.pattern.radius * 2.1);
  animateView(from, state.puzzle.pattern.center, fromZoom, overviewZoom, () => {
    refreshHud();
    if (isComplete(state.puzzle)) celebrate();
  });
}

function animateView(fromC: { x: number; y: number }, toC: { x: number; y: number },
                     fromZ: number, toZ: number, done: () => void) {
  const start = performance.now();
  const cx: Tween = { from: fromC.x, to: toC.x, start, duration: 500 };
  const cy: Tween = { from: fromC.y, to: toC.y, start, duration: 500 };
  const z: Tween = { from: fromZ, to: toZ, start, duration: 500 };
  runLoop((now) => {
    vp.setView({ x: tweenValue(cx, now), y: tweenValue(cy, now) }, tweenValue(z, now));
    render();
    return now >= start + 500;
  }, done);
}

function celebrate() {
  const start = performance.now();
  runLoop((now) => {
    const p = Math.min(1, (now - start) / 1200);
    render(p);                                  // pop intensity ramps 0..1
    return p >= 1;
  }, () => { nextPuzzle(state); fitOverview(); refreshHud(); render(); });
}

function render(pop = 0) {
  ctx.clearRect(0, 0, vp.width, vp.height);
  ctx.save();
  ctx.translate(vp.width / 2, vp.height / 2);
  ctx.scale(vp.zoom, vp.zoom);
  ctx.translate(-vp.center.x, -vp.center.y);
  drawPattern(ctx, state.puzzle.instances, pop);
  if (glow && performance.now() < glow.until) {
    ctx.beginPath();
    ctx.arc(glow.x, glow.y, 44, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(166,227,161,0.8)";
    ctx.lineWidth = 4 / vp.zoom;
    ctx.stroke();
  }
  ctx.restore();
}

resize();
refreshHud();
render();
// Keep the glow ring animating while active.
setInterval(() => { if (glow) { if (performance.now() >= glow.until) glow = null; render(); } }, 60);
```

- [ ] **Step 3: Type-check and run**

Run: `npm run build`
Expected: `tsc` passes with no errors, Vite produces a build.

Run: `npm run dev`
Expected: a mandala appears; tapping a visibly-off motif zooms in and shows control buttons for exactly its corrupted axes; stepping them until it matches snaps it and zooms out; the count decrements; clearing the last defect plays the pop and loads a new puzzle. Stop the server.

- [ ] **Step 4: Commit**

```bash
git add src/app/main.ts src/app/state.ts
git commit -m "feat(app): wire up the playable game loop"
```

---

## Task 20: PWA / offline

**Files:**
- Modify: `vite.config.ts`
- Create: `public/manifest.webmanifest`
- Create: app icons `public/icon-192.png`, `public/icon-512.png` (any simple placeholder mandala render is fine for v1)

- [ ] **Step 1: Add the PWA plugin to `vite.config.ts`**

```ts
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Symmetry Repair",
        short_name: "Symmetry",
        background_color: "#0e1014",
        theme_color: "#0e1014",
        display: "standalone",
        icons: [
          { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
    }),
  ],
  test: {
    globals: true,
    environment: "node",
    environmentMatchGlobs: [["tests/hud.test.ts", "jsdom"]],
  },
});
```

- [ ] **Step 2: Build and verify the service worker is emitted**

Run: `npm run build`
Expected: build output lists `sw.js` and `manifest.webmanifest`. Run `npm run preview`, load the app, reload offline (DevTools → Network → Offline) and confirm it still loads.

- [ ] **Step 3: Commit**

```bash
git add vite.config.ts public/
git commit -m "feat(app): add PWA manifest and offline service worker"
```

---

## Task 21: Full suite + manual play verification

**Files:** none (verification only)

- [ ] **Step 1: Run the whole test suite**

Run: `npm test`
Expected: all suites pass.

- [ ] **Step 2: Type-check the production build**

Run: `npm run build`
Expected: no TypeScript errors; build succeeds.

- [ ] **Step 3: Manual play pass** (`npm run dev`)

Verify against the spec:
- A layered mandala renders; corrupted motifs visibly pop out.
- Remaining count shows by default; the toggle hides/shows it and persists across reload.
- Tapping a defect zooms in; only its corrupted-axis controls appear; stepping to match snaps and zooms out; count decrements.
- The hint button (and only the button — never a timer) glows toward an unsolved defect.
- Clearing the last defect plays the shine/pop and centers, then a fresh puzzle loads.
- Reloading mid-puzzle restores progress.

- [ ] **Step 4: Commit any fixes found during manual play, then tag v1**

```bash
git commit -am "fix: address issues found in manual play pass"   # only if needed
git tag v1.0.0
```

---

## Self-Review

**Spec coverage:**
- Ambient band / difficulty by perceptual richness → Task 9 (`difficulty.ts`: more layers/defects + subtler perturbations, no deductive depth). ✓
- Layered mixed symmetries (rotational + reflection) → Tasks 5–7 (cyclic/dihedral rosette layers). ✓
- Defect = orbit-violating instance; exact verification → Tasks 6, 8. ✓
- Zoom-in repair as inverse transform on the same element; visual continuity → Tasks 13, 19 (controls mutate the live instance; snap to canonical). ✓
- Every intermediate state visually evaluable (hill-climb) → Task 19 renders the live instance each step. ✓
- Remaining count, default on, toggleable → Tasks 15, 18, 19. ✓
- Hint user-triggered only, never timed → Tasks 14, 19 (button-only). ✓
- No timer/score in v1 → not built (omission is intentional and noted in spec). ✓
- Completion: shine + color pop + zoom out and center → Tasks 17, 19 (`celebrate`, pop param, `fitOverview`). ✓
- Endless seed-based stream; self-set difficulty; soft auto-ease → Tasks 9, 19 (`nextPuzzle`, `onLevel`, ease in `configForLevel`). ✓
- Persistence / resume mid-puzzle → Tasks 15, 19 (`buildPuzzle` replays repaired). ✓
- PWA/offline → Task 20. ✓
- Architecture units (engine/generator/corruptor/renderer/interaction/controls/progression/persistence/hint) → one file + task each. ✓
- Seed-based deterministic generation → Tasks 4, 7, 8 (determinism tests). ✓

**Growth-path items correctly deferred (not in v1 tasks):** coupled controls, fuller wallpaper groups, representational/themed skins, daily puzzle, shareable codes, opt-in timed mode/hints. ✓

**Placeholder scan:** No "TBD/TODO"; every code step contains complete code. The only intentionally simple artifact is the v1 app icon (Task 20), which is acceptable for v1 and explicitly noted. ✓

**Type consistency:** `MotifAttributes` fields (`kind/hue/spin/scale/mirrored`) are used identically across symmetry, corruptor, controls, renderer. `Axis` union is consistent. `Puzzle`, `Instance`, `Defect`, `Layer`, `Pattern` signatures match across tasks. `attributesMatch`/`isInstanceCorrect`/`applyControl`/`isRepaired`/`createPuzzle`/`repairDefect`/`remainingCount`/`isComplete`/`drawPattern`/`drawInstance`/`Viewport`/`hitTest`/`pickHintTarget`/`tweenValue`/`runLoop` names are referenced consistently by their definitions. ✓
