# Symmetry Repair — project guide

A calm, endless browser puzzle. You're shown an abstract geometric mandala (concentric
rosette rings of motifs). A few motifs are subtly **corrupted** off their ring's canonical
attributes (hue / spin / scale / shape / chirality). Find them by eye, tap to zoom in,
transform them back into harmony. Clear them all → a shine sweep → next puzzle.

> **For current status, what's done, and what to do next, read [STATUS.md](STATUS.md).**
> Full design rationale: [docs/superpowers/specs/2026-06-04-symmetry-repair-design.md](docs/superpowers/specs/2026-06-04-symmetry-repair-design.md).
> Implementation plan (v1, fully executed): [docs/superpowers/plans/2026-06-04-symmetry-repair.md](docs/superpowers/plans/2026-06-04-symmetry-repair.md).

## The north star — the "ambient band" (read before designing anything)

The whole point is that the game is solvable **wordlessly** — pure visual pattern-matching,
no engaging the speech centre — so it can be played while listening to an audiobook. Two
hard limits define the target:

1. **No symbolic load.** Nothing you'd *name or count* in your head. Quantities only stay
   wordless within the subitizing range (≤ ~4). The only number on screen (remaining-defect
   count) is progress feedback, not part of solving.
2. **No deductive depth.** Even with wordless input, long deductive chains flip the game from
   an *idle* activity into "the thing you're doing." Avoid that.

**Difficulty must scale by perceptual richness/subtlety, never by deductive depth.** When
proposing features or difficulty changes, stay inside this band. Lead with spatial/visual
mechanics; never add word/number/arithmetic/logic-chain mechanics.

## Run / test / build

```bash
npm install                 # first time (CI uses: npm ci --legacy-peer-deps)
npm run dev                 # dev server — NOTE the base path: http://localhost:5173/symmetry/
npm test                    # vitest run — the pure core is fully unit-tested
npm run build               # tsc --noEmit + vite build (emits PWA service worker + manifest)
```

- The app is served from a GitHub Pages subpath, so Vite `base` is `/symmetry/` (prod) or
  `/symmetry/dev/` (PR previews, via `VITE_BASE_PATH`). That's why dev runs under `/symmetry/`.

## Architecture (one responsibility per file)

`src/core/` is **pure and has no DOM/canvas imports** — all game logic, fully tested:
`types` → `geometry` → `rng` (seeded, deterministic) → `symmetry` (rosette orbits +
verification) → `generator` → `corruptor` → `difficulty` → `puzzle` (aggregate).
`src/render/` (shapes, renderer, viewport+hit-testing, animation) and `src/ui/`
(controls, hud, hint) depend on core. `src/app/` (state, persistence, main) composes it.
Puzzles are **seed-deterministic**: persistence stores a seed + small session, never blobs.

## Conventions

- TypeScript strict. **American English** in all code/identifiers/comments.
- **TDD for core logic**: write the failing test, then the implementation. Keep `src/core` pure.
- Conventional commits (`feat(scope): …`, `fix:`, `ci:`, `docs:`, `chore:`). Frequent, focused commits.
- **Do NOT put Claude/Co-Authored-By attribution in commit messages.** (PR bodies may include it.)
- Match the existing code's style and the established file structure.

## CI / deploy (GitHub: `adrianschmidt/symmetry`)

- `.github/workflows/`: `ci.yml` (build+test on PRs), `deploy.yml` (push to `main` → publishes
  to `gh-pages` → prod at `https://adrianschmidt.github.io/symmetry/`), `deploy-preview.yml`
  (PRs → `https://adrianschmidt.github.io/symmetry/dev/`, comments the URL),
  `block-autosquash-commits.yml`.
- The repo merges via **Rebase and merge** onto a linear `main`; an un-squashed `fixup!`/
  `squash!`/`amend!` commit in a PR **fails CI** — fold them in before merge.
- A build-version label (bottom-center) is injected via `VITE_APP_VERSION` (prod: `#<run>`,
  preview: `PR #<n> (run <n>)`) so you can confirm which build is live.

## Gotchas

- **PWA cache:** after a deploy, the live site may need **two refreshes** (the new service
  worker activates on the load after it downloads).
- **Git email:** commits must use a GitHub `noreply` email or pushes are rejected (GH007).
  This is already fixed globally (`~/.gitconfig.local`), so new commits are fine.
- **Lockfile:** keep `package-lock.json` cross-platform-complete (it must contain the Linux
  optional native deps) or `npm ci` fails in CI. Regenerate with a recent npm if needed.
- **Mobile pointer mapping:** size the canvas/viewport from the canvas's *displayed box*
  (`clientWidth/Height` + `getBoundingClientRect`), never `window.innerHeight` — on mobile
  `100vh ≠ innerHeight`. See `src/render/viewport.ts` `clientToWorld` and `src/app/main.ts` `resize`.

## Related

There is a sibling game (jigsaw) at `../puzzle` (`adrianschmidt/puzzle`) with the same
CI/deploy/preview/autosquash setup — a good reference for established patterns. Both are
served from the same `adrianschmidt.github.io` origin, so they **share one ~5 MB localStorage**;
keep this game's persisted state tiny (it already is).
