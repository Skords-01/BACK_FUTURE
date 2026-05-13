const KEY = "bf_user_state";

const MIN_YEAR = 1991;
const MAX_YEAR = new Date().getFullYear();

/**
 * Custom event name emitted on every saved-facts mutation. Consumers
 * (bookmark buttons, header counter, /saved page) listen on `window` and
 * re-read state to stay in sync across tabs / cards / nav.
 */
export const SAVED_CHANGED_EVENT = "bf_saved_changed";

export interface SavedChangedDetail {
  /** New list of saved slugs after the mutation. */
  savedSlugs: string[];
  /** Slug that was added / removed; `null` for bulk operations (clear / set). */
  slug: string | null;
  /** Action that produced the change. */
  action: "add" | "remove" | "clear" | "set";
}

export interface UserState {
  lastYear: number | null;
  readFacts: string[];
  savedFacts: string[];
}

function makeDefaultState(): UserState {
  return {
    lastYear: null,
    readFacts: [],
    savedFacts: [],
  };
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((item) => typeof item === "string");
}

function isValidYear(v: unknown): v is number {
  return typeof v === "number" && Number.isInteger(v) && v >= MIN_YEAR && v <= MAX_YEAR;
}

function hasLocalStorage(): boolean {
  return typeof globalThis !== "undefined" && typeof globalThis.localStorage !== "undefined";
}

function load(): UserState {
  if (!hasLocalStorage()) return makeDefaultState();
  try {
    const raw = globalThis.localStorage.getItem(KEY);
    if (!raw) return makeDefaultState();
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return makeDefaultState();
    const p = parsed as Record<string, unknown>;
    return {
      lastYear: isValidYear(p.lastYear) ? p.lastYear : null,
      readFacts: isStringArray(p.readFacts) ? p.readFacts : [],
      savedFacts: isStringArray(p.savedFacts) ? p.savedFacts : [],
    };
  } catch (err) {
    if (import.meta.env.DEV) console.warn("[userState] Failed to load state:", err);
    return makeDefaultState();
  }
}

function save(state: UserState): void {
  if (!hasLocalStorage()) return;
  try {
    globalThis.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable (private mode, quota exceeded) — fail silently
  }
}

function dispatchSavedChanged(detail: SavedChangedDetail): void {
  if (typeof window === "undefined" || typeof CustomEvent === "undefined") return;
  try {
    window.dispatchEvent(new CustomEvent<SavedChangedDetail>(SAVED_CHANGED_EVENT, { detail }));
  } catch {
    // Some test environments lack full DOM — fail silently.
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

export function isRead(slug: string): boolean {
  return load().readFacts.includes(slug);
}

/**
 * Add a fact slug to saved set. No-op if already saved. Returns `true` if
 * the slug was actually added (i.e. wasn't already present).
 */
export function addSaved(slug: string): boolean {
  if (!slug) return false;
  const s = load();
  if (s.savedFacts.includes(slug)) return false;
  s.savedFacts.push(slug);
  save(s);
  dispatchSavedChanged({ savedSlugs: [...s.savedFacts], slug, action: "add" });
  return true;
}

/**
 * Remove a fact slug from saved set. No-op if not present. Returns `true`
 * if the slug was actually removed.
 */
export function removeSaved(slug: string): boolean {
  if (!slug) return false;
  const s = load();
  const idx = s.savedFacts.indexOf(slug);
  if (idx === -1) return false;
  s.savedFacts.splice(idx, 1);
  save(s);
  dispatchSavedChanged({ savedSlugs: [...s.savedFacts], slug, action: "remove" });
  return true;
}

/**
 * Toggle saved state for a slug. Returns the new state: `true` if now
 * saved, `false` if now unsaved.
 */
export function toggleSaved(slug: string): boolean {
  if (isSaved(slug)) {
    removeSaved(slug);
    return false;
  }
  addSaved(slug);
  return true;
}

export function isSaved(slug: string): boolean {
  if (!slug) return false;
  return load().savedFacts.includes(slug);
}

export function getSavedSlugs(): string[] {
  return [...load().savedFacts];
}

/**
 * Replace the entire saved-set. Used by import-JSON and URL-hash-sync.
 * Silently filters out non-string entries and de-duplicates. Returns the
 * final list of slugs that were stored.
 */
export function setSavedSlugs(slugs: readonly unknown[]): string[] {
  const clean = Array.from(
    new Set(
      slugs.filter((v): v is string => typeof v === "string" && v.length > 0 && v.length <= 256),
    ),
  );
  const s = load();
  s.savedFacts = clean;
  save(s);
  dispatchSavedChanged({ savedSlugs: [...clean], slug: null, action: "set" });
  return clean;
}

/** Remove all saved slugs. */
export function clearSaved(): void {
  const s = load();
  if (s.savedFacts.length === 0) return;
  s.savedFacts = [];
  save(s);
  dispatchSavedChanged({ savedSlugs: [], slug: null, action: "clear" });
}
