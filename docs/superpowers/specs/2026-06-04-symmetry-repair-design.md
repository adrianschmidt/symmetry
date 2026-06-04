# Symmetry Repair — Design (v1)

*Working title. Status: design, pending review. Date: 2026-06-04.*

## Concept

A calm, endless visual puzzle. You're shown an abstract geometric pattern built
from layered symmetries (rotation, reflection, repetition). A few elements have
been subtly *corrupted* — rotated wrong, recolored, reshaped, displaced. Find the
breaks and restore them, and the pattern returns to harmony.

It is designed to be played **wordlessly** — without engaging the speech centre —
so it can be layered under an audiobook or podcast, the way you'd do a jigsaw.

## The core design principle: the "ambient band"

This is the constraint every other decision serves. There are **two independent
limits** that, if crossed, pull in language and break the wordless, ambient feel:

1. **Symbolic load.** Anything you'd *name or count* in your head breaks it.
   Quantities stay wordless only in the *subitizing* range (≤ ~4). This game uses
   essentially no numbers in its solving; the only number shown (remaining-defect
   count) is progress feedback, not part of solving.
2. **Reasoning depth.** Even with wordless input, long deductive chains flip the
   activity from pattern-matching into deliberate verbal reasoning — at which point
   it stops being an *idle* game and becomes *the thing you're doing*.

**The target band:** wordless input *and* pattern-matching-dominant solving, with
**difficulty that scales by perceptual richness and scale — never by deductive
depth.** This is the opposite of most logic puzzles, which are designed to escalate
into hard deduction. Here, getting harder must mean getting *richer to look at*,
not *harder to reason about*.

Two concrete sub-principles fall out of this and govern the two puzzle layers:

- **Outer puzzle (find the breaks):** difficulty comes from the number and
  subtlety of coexisting symmetry systems. There is a ceiling — too many layers and
  the player can no longer *see* the governing rule and must consciously *derive* it
  (the verbal cliff). We tune to sit just below it. Pleasingly, the thing that makes
  it harder (more layered symmetry) is the same thing that makes it more beautiful.
- **Inner puzzle (fix a break):** **every intermediate state must be visually
  evaluable** — you can always glance and tell "warmer / colder." This keeps fixing
  a matter of *perceptual hill-climbing* (nudge until it clicks) rather than verbal
  search ("if I press A twice then B once…").

## Gameplay loop

1. A generated pattern fills the canvas. A small **remaining count** shows how many
   defects are present (default on; can be disabled).
2. You scan. Corrupted elements *pop out* perceptually (the design exploits
   pre-attentive detection of asymmetry).
3. You **tap a defect** → the view **zooms in** to that element.
4. In the zoomed view, a small set of **transform controls** — only the ones
   relevant to *this* defect — let you manipulate the element back toward agreement
   with its symmetry. You hill-climb by eye; when it matches, it **snaps** and the
   view **zooms back out**. Count decrements.
5. When the last defect is healed: a **shine sweeps across the pattern, leaving
   punched-up colors in its wake**, then the view **zooms out and centers**. Next
   puzzle.

If you genuinely can't find a remaining defect, a **user-triggered hint** drifts a
soft glow toward the offending region. It is *never* time-triggered.

## The outer puzzle: layered mixed symmetries

A pattern is composed of **motifs** placed on **orbits** under a **symmetry group**.

- A **symmetry group** is a set of generator transformations: rotations about
  centers, reflections about axes, translations. (Mathematically, repeating plane
  patterns fall into the 17 wallpaper groups; v1 uses a small chosen subset.)
- A **motif** is a small vector element with attributes: shape, color/hue,
  orientation, scale, and base position.
- Placing a motif under the group generates its **orbit** — the full set of copies,
  each transformed by a group element. All members of an orbit share the same
  *canonical* attributes (mapped appropriately through their group element).
- **Different motifs can be governed by different symmetries** in the same pattern
  (e.g. rosettes follow 6-fold rotation; border elements follow a reflection). This
  is the two-layer cognition that gives depth: first *perceive which rule governs a
  feature* (still gestalt, still wordless), then *check each instance against it*.

**A defect** is one instance in one orbit whose attributes have been perturbed away
from canonical, along one or more axes (rotation, hue, shape, scale, position,
reflection). It is *correct* iff its attributes equal the orbit's canonical values;
this makes verification exact and cheap.

## The inner puzzle: zoom-in repair

Tapping a defect zooms into it. The repair is **the inverse of the corruption** —
applied to *the same element on screen*, never a substituted representation. This is
the design rule that guarantees visual continuity: the start state literally *is*
the defect, the end state literally *is* the corrected element. (A mini-game that
swapped in a different puzzle — e.g. a jumbled jigsaw of the element — would feel
disconnected and is explicitly rejected.)

- **Controls** are a small row of transform actions — rotate, hue, shape, flip,
  nudge — and only those corresponding to the axes *this* defect is wrong on are
  shown/active.
- **v1: controls are orthogonal.** Each corrupted axis is corrected independently.
  Simplest defects are wrong on one axis (see it's rotated → rotate till it lines
  up). Richer ones are wrong on several at once.
- The element **snaps and confirms** when all axes match canonical. Feedback always
  makes "closer/farther" visible (hill-climbing by eye).

This is barely more than tap-to-fix at the easy end, but with real agency and a
satisfying "click," and it scales smoothly (see growth path).

## Detection, count, hints, completion

- **Remaining count:** small tally of unsolved defects. On by default (so new users
  discover it exists), can be disabled in settings. Never reveals locations.
- **Hint:** user-triggered only. A soft glow drifts toward an unsolved defect's
  region. No time-based hinting in v1 (a clock that punishes savoring the puzzle
  defeats the purpose). A timed-hint *option, off by default,* is a possible future
  addition — not built now.
- **No timer / no score in v1.** Nothing that turns relaxation into performance.
  (Opt-in timed mode is a possible future addition; not built now.)
- **Completion animation:** a single shine sweeps across the pattern and the
  saturated "pop" colors follow in its wake (one gesture, not two stacked effects),
  then zoom out and center — echoing the jigsaw app's resolve. No grey-to-color
  fill, since patterns start fully colored.

## Progression

- **Endless stream of freshly generated puzzles.**
- **Self-set difficulty** (a level or slider controlling number of symmetry layers,
  subtlety of corruption, number of defects).
- **Soft auto-ease** for a brand-new player's first few puzzles, then it hands over
  the dial.
- No meta-progression, streaks, or scores.
- **State persists** so a puzzle can be put down mid-solve and resumed.

## Difficulty dials (all within the band)

- Number of coexisting symmetry systems in a pattern.
- Subtlety of corruption (small orientation/hue offsets are subtler than large ones).
- Number of defects per pattern.
- Number of corrupted axes per defect.
- *(Later)* Coupled (non-orthogonal) controls in the inner puzzle.

## Representation & architecture

**Representation decision:** patterns are **freeform vector motifs placed on orbits
under a symmetry group, rendered to canvas** — *not* a discrete tile grid. A square
grid is awkward for n-fold rotation (n ≠ 4); freeform placement handles arbitrary
rotation centers, reflection axes, and translation lattices naturally.

**Generation is seed-based and deterministic:** a puzzle is fully described by a
seed + difficulty config. This makes persistence trivial (store seed + which defects
are healed), enables an effectively infinite stream, and allows shareable/replayable
puzzles later. (Mirrors the jigsaw app's compact encoded-state approach;
`lz-string` available if needed.)

Units (each with one clear purpose, testable in isolation):

1. **Symmetry engine** — represents groups and their generators; given a base motif
   + group, produces the orbit (all instances with correct per-element transforms);
   verifies whether an instance matches its orbit's canonical state. Pure.
2. **Pattern generator** — from (seed, difficulty), chooses symmetry group(s),
   motif set, palette, and layout; produces the *solved* ground-truth pattern. Pure.
3. **Corruptor** — from (solved pattern, seed, difficulty), selects defects and
   perturbs attributes; records ground-truth corrections and the defect list. Pure.
4. **Renderer** — draws the pattern to canvas (outer view) and the zoomed defect
   (inner view); handles pan/zoom and the shine/pop completion animation.
5. **Interaction / game loop** — hit-testing taps, zoom-in/out transitions, routing
   control input to the active defect, detecting heal and puzzle-complete.
6. **Transform controls (inner puzzle)** — per-axis manipulation of a defect's
   attributes; surfaces closeness for the hill-climb feel; snaps on match.
7. **Progression** — maps difficulty level → generator/corruptor config; serves the
   endless stream; applies the soft auto-ease for new players.
8. **Persistence & settings** — current puzzle (seed + healed set), difficulty,
   remaining-count toggle. `localStorage`.
9. **Hint** — on user request, selects an unsolved defect and animates a soft glow
   toward its region.

**Data flow:** difficulty → generator → solved pattern → corruptor → puzzle
(instances + defect list + ground-truth corrections). Renderer draws it. Tap →
hit-test → if defect, zoom in → controls mutate attributes → on match, mark healed,
decrement count → when all healed, completion animation → next puzzle.

**Tech stack (match the jigsaw app):** TypeScript + Vite + PWA (offline-capable),
canvas rendering, `vitest`, vanilla TS (no framework). `lz-string` if compact state
encoding is wanted.

## Error handling & edge cases

- **Perceptual solvability:** the corruptor must perturb each defect *enough to be
  seen* yet keep the pattern in-band. Define per-axis perceptibility thresholds
  (minimum orientation/hue/scale/position deltas). Correctness checking is exact
  (attributes == canonical); this constraint is about *perception*, not validity.
- **No accidental ambiguity:** with layered symmetries, ensure a corrupted instance
  is unambiguously wrong relative to *its* orbit and doesn't accidentally read as
  valid under another symmetry present in the pattern.
- **"Last one I can't find":** covered by the user-triggered hint.
- **Tap on a non-defect:** gentle no-op; never a penalty.
- **Resume mid-puzzle:** restore from seed + healed set.

## Testing strategy

- **Symmetry engine:** property tests — orbits are closed under the group;
  verification correctly accepts canonical instances and rejects perturbed ones.
- **Corruptor:** a corrupted instance always differs from canonical; applying the
  recorded correction restores it exactly; defect count matches the list.
- **Generator:** produces valid solved patterns for each supported group; no
  degenerate (empty/one-member) orbits; deterministic for a given seed.
- **Interaction math:** hit-testing and zoom transforms tested in isolation.
- **Visual/feel:** manual, plus Playwright later for the completion animation and
  zoom transitions.

## v1 scope

**In:**
- Small set of symmetry groups (rotational anchor + at least one reflection layer,
  enough to demonstrate layered governance lightly).
- Geometric vector motifs with attributes: shape, color/hue, orientation, scale,
  position.
- Corruption of 1–few defects; orthogonal transform controls; single- and
  multi-axis defects.
- Remaining count (default on, toggleable); user-triggered soft-glow hint.
- Completion animation (shine → pop → zoom out and center).
- Endless seed-based stream; self-set difficulty + soft auto-ease for new players.
- Persistent state; PWA / offline.

**Out (growth path, not built now):**
- Coupled (non-orthogonal) controls in the inner puzzle.
- Fuller wallpaper-group coverage; more elaborate layered patterns.
- Representational / themed motif sets (flowers, animals, Morris-textile skins).
- Daily puzzle; shareable puzzle codes.
- Opt-in timed mode and opt-in timed hints (off by default).

## Open decisions deferred to implementation

- Exact initial set of symmetry groups for v1.
- Specific perceptibility thresholds per axis (tuned during build).
- Visual style specifics of motifs and palettes.
- Project name and final repo location (currently `/Users/bot/src/symmetry`).
