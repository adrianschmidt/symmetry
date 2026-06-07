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
