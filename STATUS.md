# Status & handoff

_Last updated: 2026-06-07. Point-in-time state for resuming work. See [CLAUDE.md](CLAUDE.md)
for how to run/build and the design north star._

## Where things stand

- **v1 is complete and verified.** All 21 tasks of the implementation plan are done.
- Work lives on branch **`feat/v1-implementation`**, open as **PR #1** (not yet merged):
  https://github.com/adrianschmidt/symmetry/pull/1
- **Preview is live:** https://adrianschmidt.github.io/symmetry/dev/ (rebuilds on every push to the PR).
- **Production** publishes to https://adrianschmidt.github.io/symmetry/ automatically **when PR #1 merges to `main`** (nothing is there yet).
- `main` currently contains only the spec + plan docs; all implementation is on the PR branch.

## Verification state

- `npm test` → 16 files / 64 tests passing. `npm run build` clean. CI green on the PR.
- Browser-verified (desktop + forced mobile-condition): boot, render, find→zoom→repair→snap,
  hint glow, complete→shine-sweep→next puzzle, persistence across reload.

## What works (feature checklist)

Layered rosette mandalas (cyclic/dihedral rings) · subtly-corrupted defects on 1–2 axes ·
tap-to-zoom repair with magnetic snap · remaining count (default on, toggle) · user-triggered
hint glow (never timed) · self-set difficulty with soft auto-ease for the first few puzzles ·
shine-sweep completion · endless seed-based stream · localStorage persistence · offline PWA ·
mobile touch input · build-version label.

## Built beyond the original plan (already merged into the PR)

- Mobile input fix (pointer mapping from the displayed box — see CLAUDE.md gotchas).
- Directional shine-sweep completion animation (was a flat color-pop).
- CI/deploy/preview/autosquash workflows + Vite `base` path + PWA SW denylist for sibling deploys.
- Lockfile regenerated for cross-platform `npm ci`. Build-version label.

## Candidate next steps (not yet done — roughly prioritized)

1. **Confirm the mobile input fix on a real device.** The fix is verified off-device and via a
   forced-condition test; the owner was mid-testing on a phone. Confirm taps land, then tune
   touch feel (hit tolerance, target size) if needed.
2. **"Back out" of a zoomed-in defect.** Currently once you tap a defect you must complete the
   repair or reload — there's no cancel/tap-to-exit. Good, small UX win.
3. **Art pass.** App icons are solid-color placeholders; motifs are flat polygons (incl. a
   polygonal "petal"). Organic shapes + real iconography would lift it a lot.
4. **Merge PR #1** once the owner is happy (enables production at the prod URL).
5. **Growth ideas from the spec** (all must stay inside the "ambient band"): coupled/non-orthogonal
   controls for richer repairs; fuller wallpaper-group patterns (translation/glide, not just
   rosettes); representational/themed motif skins; daily puzzle; shareable seed codes; opt-in
   timed mode and opt-in timed hints (off by default).
6. **Storage:** all the owner's games share one `adrianschmidt.github.io` localStorage (~5 MB)
   and the jigsaw app is the heavy user. Keep this game's state frugal (it already is). Eventual
   origin-level fix is IndexedDB (in the heavy app) and/or per-app subdomains — not this app's job yet.

## How to resume

1. You're on `feat/v1-implementation`. `npm install`, then `npm run dev` (opens under `/symmetry/`).
2. Read [CLAUDE.md](CLAUDE.md) (design north star + conventions) and the
   [spec](docs/superpowers/specs/2026-06-04-symmetry-repair-design.md) for the "why".
3. Pick a next step above. Keep `src/core` pure + TDD'd; commit in conventional, focused chunks;
   pushing the branch redeploys the `/dev` preview so you can check changes on the phone.
