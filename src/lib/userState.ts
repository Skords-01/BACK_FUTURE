const KEY = "bf_user_state";

const MIN_YEAR = 1991;
const MAX_YEAR = new Date().getFullYear();

export interface UserState {
  lastYear: number | null;
  readFacts: string[];
  savedFacts: string[];
}

const DEFAULT_STATE: UserState = {
  lastYear: null,
  readFacts: [],
  savedFacts: [],
};

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((item) => typeof item === "string");
}

function isValidYear(v: unknown): v is number {
  return typeof v === "number" && Number.isInteger(v) && v >= MIN_YEAR && v <= MAX_YEAR;
}

function load(): UserState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return { ...DEFAULT_STATE };
    const p = parsed as Record<string, unknown>;
    return {
      lastYear: isValidYear(p.lastYear) ? p.lastYear : null,
      readFacts: isStringArray(p.readFacts) ? p.readFacts : [],
      savedFacts: isStringArray(p.savedFacts) ? p.savedFacts : [],
    };
  } catch (err) {
    if (import.meta.env.DEV) console.warn("[userState] Failed to load state:", err);
    return { ...DEFAULT_STATE };
  }
}

function save(state: UserState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable (private mode, quota exceeded) — fail silently
  }
}

export function getState(): UserState {
  return load();
}

export function setLastYear(year: number): void {
  const s = load();
  s.lastYear = year;
  save(s);
}

export function markRead(slug: string): void {
  const s = load();
  if (!s.readFacts.includes(slug)) {
    s.readFacts.push(slug);
    save(s);
  }
}

export function toggleSaved(slug: string): boolean {
  const s = load();
  const idx = s.savedFacts.indexOf(slug);
  if (idx === -1) {
    s.savedFacts.push(slug);
  } else {
    s.savedFacts.splice(idx, 1);
  }
  save(s);
  return idx === -1;
}

export function isRead(slug: string): boolean {
  return load().readFacts.includes(slug);
}

export function isSaved(slug: string): boolean {
  return load().savedFacts.includes(slug);
}
