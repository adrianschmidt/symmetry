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
