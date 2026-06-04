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
