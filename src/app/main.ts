import { initState, recordRepair, nextPuzzle, type AppState } from "./state";
import { Viewport, hitTest, clientToWorld } from "../render/viewport";
import { drawPattern, drawInstance } from "../render/renderer";
import { runLoop, tweenValue, lerp, type Tween } from "../render/animation";
import { isInstanceCorrect } from "../core/symmetry";
import { remainingCount, isComplete } from "../core/puzzle";
import { MAX_LEVEL } from "../core/difficulty";
import { applyControl, isWithinSnap } from "../ui/controls";
import { createHud } from "../ui/hud";
import { pickHintTarget } from "../ui/hint";
import type { Axis, Instance } from "../core/types";

const canvas = document.getElementById("board") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;
const hudRoot = document.getElementById("hud")!;
const state: AppState = initState();

// Build-time version label, injected by the deploy workflows (prod: run number;
// PR preview: PR number + run number). Lets you confirm which build is live.
const appVersion = import.meta.env.VITE_APP_VERSION as string | undefined;
if (appVersion) {
  const versionEl = document.createElement("div");
  versionEl.className = "app-version";
  versionEl.textContent = appVersion;
  document.body.appendChild(versionEl);
}

let vp = new Viewport(window.innerWidth, window.innerHeight);
let active: Instance | null = null;          // defect being repaired (zoomed in)
let glow: { x: number; y: number; until: number } | null = null;
let controlBar: HTMLElement | null = null;
let sweep: { x: number } | null = null;     // active completion shine: world-x of the sweep line

function fitOverview(): void {
  const r = state.puzzle.pattern.radius;
  const zoom = Math.min(vp.width, vp.height) / (r * 2.1);
  vp.setView(state.puzzle.pattern.center, zoom);
}

function resize(): void {
  const dpr = window.devicePixelRatio || 1;
  // Size from the canvas's actual displayed box, NOT window.innerWidth/Height.
  // On mobile the canvas (CSS 100dvw/100dvh) differs from window.innerHeight due
  // to dynamic browser chrome; using the displayed box keeps what we draw and
  // where we hit-test in the same coordinate space.
  const w = canvas.clientWidth || window.innerWidth;
  const h = canvas.clientHeight || window.innerHeight;
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  vp = new Viewport(w, h);
  fitOverview();
  render();
}
window.addEventListener("resize", resize);
// The visual viewport changes when mobile browser chrome shows/hides; re-sync then too.
window.visualViewport?.addEventListener("resize", resize);

const hud = createHud(hudRoot, {
  onHint: () => {
    const t = pickHintTarget(state.puzzle);
    if (t) glow = { x: t.position.x, y: t.position.y, until: performance.now() + 2500 };
  },
  onToggleCount: () => {
    state.session.showCount = !state.session.showCount;
    refreshHud();
  },
});

function refreshHud(): void {
  hud.setCount(remainingCount(state.puzzle), state.session.showCount);
}

// --- Minimal difficulty stepper (self-set difficulty) ---
const levelBar = document.createElement("div");
levelBar.style.cssText =
  "position:fixed;top:16px;right:16px;display:flex;gap:8px;align-items:center;font:600 15px system-ui;color:#cdd6f4;";
const levelLabel = document.createElement("span");
const easier = document.createElement("button");
easier.textContent = "−";
const harder = document.createElement("button");
harder.textContent = "+";
for (const b of [easier, harder]) {
  b.style.cssText = "width:34px;height:34px;border-radius:8px;border:0;background:#313244;color:#cdd6f4;font:600 18px system-ui;";
}
easier.addEventListener("click", () => changeLevel(state.session.level - 1));
harder.addEventListener("click", () => changeLevel(state.session.level + 1));
levelBar.append(easier, levelLabel, harder);
hudRoot.appendChild(levelBar);

function syncLevelLabel(): void {
  levelLabel.textContent = `Level ${state.session.level}`;
}

function changeLevel(level: number): void {
  const next = Math.max(1, Math.min(MAX_LEVEL, level));
  if (next === state.session.level) return;
  state.session.level = next;
  nextPuzzle(state);
  fitOverview();
  syncLevelLabel();
  refreshHud();
  render();
}

// --- Pointer: tap a still-broken defect to zoom in and repair it ---
canvas.addEventListener("pointerdown", (e) => {
  if (active) return;
  const rect = canvas.getBoundingClientRect();
  const world = clientToWorld(vp, rect, e.clientX, e.clientY);
  // Finger-friendly target: at least ~24 CSS px around a motif, in world units.
  const tol = Math.max(34, 24 / vp.zoom);
  const hit = hitTest(state.puzzle.instances, world, tol);
  if (hit && !isInstanceCorrect(hit, state.puzzle.pattern.layers[hit.layerIndex]!)) {
    zoomTo(hit);
  }
});

function step(axis: Axis, delta: number): void {
  if (!active) return;
  active.attributes = applyControl(active.attributes, { axis, delta });
  const layer = state.puzzle.pattern.layers[active.layerIndex]!;
  if (isWithinSnap(active.attributes, layer.motif)) {
    active.attributes = { ...layer.motif }; // snap exactly
    recordRepair(state, active.layerIndex, active.index);
    zoomOut();
  } else {
    render();
  }
}

function buildControlBar(defectAxes: Axis[]): void {
  controlBar?.remove();
  controlBar = document.createElement("div");
  controlBar.style.cssText =
    "position:fixed;bottom:90px;left:50%;transform:translateX(-50%);display:flex;gap:10px;flex-wrap:wrap;justify-content:center;";
  const steps: Record<Axis, number> = { hue: 12, spin: 0.15, scale: 0.08, kind: 1, mirrored: 1 };
  for (const axis of defectAxes) {
    const deltas = axis === "mirrored" ? [1] : [-steps[axis], steps[axis]];
    for (const d of deltas) {
      const b = document.createElement("button");
      b.textContent = `${axis}${axis === "mirrored" ? "" : d < 0 ? " −" : " +"}`;
      b.style.cssText = "padding:10px 14px;border-radius:10px;border:0;background:#45475a;color:#cdd6f4;font:600 14px system-ui;";
      b.addEventListener("click", () => step(axis, d));
      controlBar.appendChild(b);
    }
  }
  hudRoot.appendChild(controlBar);
}

function zoomTo(inst: Instance): void {
  active = inst;
  const from = { ...vp.center };
  const fromZoom = vp.zoom;
  const toZoom = Math.min(vp.width, vp.height) / 140;
  animateView(from, inst.position, fromZoom, toZoom, () => {
    const defect = state.puzzle.defects.find((d) => d.layerIndex === inst.layerIndex && d.index === inst.index)!;
    buildControlBar(defect.axes);
  });
}

function zoomOut(): void {
  controlBar?.remove();
  controlBar = null;
  active = null;
  const from = { ...vp.center };
  const fromZoom = vp.zoom;
  const overviewZoom = Math.min(vp.width, vp.height) / (state.puzzle.pattern.radius * 2.1);
  animateView(from, state.puzzle.pattern.center, fromZoom, overviewZoom, () => {
    refreshHud();
    if (isComplete(state.puzzle)) celebrate();
  });
}

function animateView(
  fromC: { x: number; y: number }, toC: { x: number; y: number },
  fromZ: number, toZ: number, done: () => void,
): void {
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

function celebrate(): void {
  const start = performance.now();
  const { center, radius } = state.puzzle.pattern;
  const fromX = center.x - radius - 60;
  const toX = center.x + radius + 60;
  runLoop((now) => {
    const p = Math.min(1, (now - start) / 1200);
    sweep = { x: lerp(fromX, toX, p) };
    render();
    return p >= 1;
  }, () => { sweep = null; nextPuzzle(state); fitOverview(); syncLevelLabel(); refreshHud(); render(); });
}

function render(): void {
  ctx.clearRect(0, 0, vp.width, vp.height);
  ctx.save();
  ctx.translate(vp.width / 2, vp.height / 2);
  ctx.scale(vp.zoom, vp.zoom);
  ctx.translate(-vp.center.x, -vp.center.y);
  if (sweep) {
    // A single shine sweeps across; the punched-up colors follow in its wake.
    const BAND = 70; // world-unit softness just ahead of the shine line
    for (const inst of state.puzzle.instances) {
      const ahead = inst.position.x - sweep.x;
      const pop = ahead <= 0 ? 1 : Math.max(0, 1 - ahead / BAND);
      drawInstance(ctx, inst, pop);
    }
    const reach = state.puzzle.pattern.radius + 40;
    const grad = ctx.createLinearGradient(sweep.x - 34, 0, sweep.x + 8, 0);
    grad.addColorStop(0, "rgba(255,255,255,0)");
    grad.addColorStop(1, "rgba(255,255,255,0.85)");
    ctx.strokeStyle = grad;
    ctx.lineWidth = 10 / vp.zoom;
    ctx.beginPath();
    ctx.moveTo(sweep.x, state.puzzle.pattern.center.y - reach);
    ctx.lineTo(sweep.x, state.puzzle.pattern.center.y + reach);
    ctx.stroke();
  } else {
    drawPattern(ctx, state.puzzle.instances, 0);
  }
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
syncLevelLabel();
refreshHud();
render();
// Keep the hint glow ring animating while it is active.
setInterval(() => {
  if (glow) {
    if (performance.now() >= glow.until) glow = null;
    render();
  }
}, 60);
