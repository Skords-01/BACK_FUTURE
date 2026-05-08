const KEY = "bf_user_state";

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

function load(): UserState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...DEFAULT_STATE };
    const parsed = JSON.parse(raw) as Partial<UserState>;
    return {
      lastYear: typeof parsed.lastYear === "number" ? parsed.lastYear : null,
      readFacts: Array.isArray(parsed.readFacts) ? parsed.readFacts : [],
      savedFacts: Array.isArray(parsed.savedFacts) ? parsed.savedFacts : [],
    };
  } catch {
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
