import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  addSaved,
  clearSaved,
  getSavedSlugs,
  getState,
  isRead,
  isSaved,
  markRead,
  removeSaved,
  SAVED_CHANGED_EVENT,
  setLastYear,
  setSavedSlugs,
  toggleSaved,
  type SavedChangedDetail,
} from "./userState";

const KEY = "bf_user_state";

class MockStorage implements Storage {
  private store = new Map<string, string>();
  get length(): number {
    return this.store.size;
  }
  clear(): void {
    this.store.clear();
  }
  getItem(key: string): string | null {
    return this.store.get(key) ?? null;
  }
  key(index: number): string | null {
    return Array.from(this.store.keys())[index] ?? null;
  }
  removeItem(key: string): void {
    this.store.delete(key);
  }
  setItem(key: string, value: string): void {
    this.store.set(key, value);
  }
}

class MockEventTarget {
  private listeners = new Map<string, Set<(e: unknown) => void>>();
  addEventListener(type: string, listener: (e: unknown) => void): void {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    this.listeners.get(type)?.add(listener);
  }
  removeEventListener(type: string, listener: (e: unknown) => void): void {
    this.listeners.get(type)?.delete(listener);
  }
  dispatchEvent(event: { type: string }): boolean {
    const list = this.listeners.get(event.type);
    if (!list) return true;
    list.forEach((l) => l(event));
    return true;
  }
}

const originalLocalStorage = (globalThis as { localStorage?: Storage }).localStorage;
const originalWindow = (globalThis as { window?: unknown }).window;

let storage: MockStorage;
let target: MockEventTarget;

beforeEach(() => {
  storage = new MockStorage();
  target = new MockEventTarget();
  Object.defineProperty(globalThis, "localStorage", {
    value: storage,
    configurable: true,
    writable: true,
  });
  // Stub a minimal window.dispatchEvent — the source uses `window.dispatchEvent`
  // gated by `typeof window !== "undefined"`.
  Object.defineProperty(globalThis, "window", {
    value: target,
    configurable: true,
    writable: true,
  });
});

afterEach(() => {
  if (originalLocalStorage === undefined) {
    delete (globalThis as { localStorage?: Storage }).localStorage;
  } else {
    Object.defineProperty(globalThis, "localStorage", {
      value: originalLocalStorage,
      configurable: true,
      writable: true,
    });
  }
  if (originalWindow === undefined) {
    delete (globalThis as { window?: unknown }).window;
  } else {
    Object.defineProperty(globalThis, "window", {
      value: originalWindow,
      configurable: true,
      writable: true,
    });
  }
});

describe("getState", () => {
  it("returns defaults when localStorage is empty", () => {
    expect(getState()).toEqual({ lastYear: null, readFacts: [], savedFacts: [] });
  });

  it("ignores malformed JSON without throwing", () => {
    storage.setItem(KEY, "{not json");
    expect(getState()).toEqual({ lastYear: null, readFacts: [], savedFacts: [] });
  });

  it("ignores non-object payloads", () => {
    storage.setItem(KEY, JSON.stringify("not an object"));
    expect(getState()).toEqual({ lastYear: null, readFacts: [], savedFacts: [] });
  });

  it("ignores invalid field shapes", () => {
    storage.setItem(
      KEY,
      JSON.stringify({ lastYear: "1999", readFacts: [42], savedFacts: { foo: 1 } }),
    );
    expect(getState()).toEqual({ lastYear: null, readFacts: [], savedFacts: [] });
  });

  it("preserves valid state across reads", () => {
    storage.setItem(
      KEY,
      JSON.stringify({ lastYear: 2010, readFacts: ["a"], savedFacts: ["b", "c"] }),
    );
    expect(getState()).toEqual({ lastYear: 2010, readFacts: ["a"], savedFacts: ["b", "c"] });
  });
});

describe("setLastYear / markRead / isRead", () => {
  it("persists last year", () => {
    setLastYear(2005);
    expect(getState().lastYear).toBe(2005);
  });

  it("rejects out-of-range years on next load", () => {
    setLastYear(1500);
    expect(getState().lastYear).toBeNull();
  });

  it("markRead is idempotent", () => {
    markRead("foo");
    markRead("foo");
    expect(getState().readFacts).toEqual(["foo"]);
    expect(isRead("foo")).toBe(true);
    expect(isRead("bar")).toBe(false);
  });
});

describe("saved facts API", () => {
  it("addSaved adds a slug and returns true; second call returns false", () => {
    expect(addSaved("a")).toBe(true);
    expect(addSaved("a")).toBe(false);
    expect(getSavedSlugs()).toEqual(["a"]);
  });

  it("addSaved rejects empty slug", () => {
    expect(addSaved("")).toBe(false);
    expect(getSavedSlugs()).toEqual([]);
  });

  it("removeSaved removes a slug and returns true; missing returns false", () => {
    addSaved("a");
    addSaved("b");
    expect(removeSaved("a")).toBe(true);
    expect(removeSaved("missing")).toBe(false);
    expect(getSavedSlugs()).toEqual(["b"]);
  });

  it("isSaved reflects current state", () => {
    expect(isSaved("a")).toBe(false);
    addSaved("a");
    expect(isSaved("a")).toBe(true);
    expect(isSaved("")).toBe(false);
  });

  it("toggleSaved flips state and returns new state", () => {
    expect(toggleSaved("x")).toBe(true);
    expect(isSaved("x")).toBe(true);
    expect(toggleSaved("x")).toBe(false);
    expect(isSaved("x")).toBe(false);
  });

  it("getSavedSlugs returns a copy (mutating doesn't affect storage)", () => {
    addSaved("a");
    const slugs = getSavedSlugs();
    slugs.push("hacker");
    expect(getSavedSlugs()).toEqual(["a"]);
  });

  it("setSavedSlugs replaces, de-dupes, and filters invalid entries", () => {
    addSaved("a");
    const stored = setSavedSlugs(["b", "b", "c", 123 as unknown as string, "", "d"]);
    expect(stored).toEqual(["b", "c", "d"]);
    expect(getSavedSlugs()).toEqual(["b", "c", "d"]);
  });

  it("clearSaved removes all", () => {
    addSaved("a");
    addSaved("b");
    clearSaved();
    expect(getSavedSlugs()).toEqual([]);
  });

  it("clearSaved is a no-op when already empty", () => {
    clearSaved();
    expect(getSavedSlugs()).toEqual([]);
  });

  it("emits bf_saved_changed on add/remove/clear/set", () => {
    const events: SavedChangedDetail[] = [];
    target.addEventListener(SAVED_CHANGED_EVENT, (e) => {
      events.push((e as { detail: SavedChangedDetail }).detail);
    });
    addSaved("a");
    addSaved("b");
    removeSaved("a");
    setSavedSlugs(["x", "y"]);
    clearSaved();
    expect(events.map((e) => e.action)).toEqual(["add", "add", "remove", "set", "clear"]);
    expect(events[0].slug).toBe("a");
    expect(events[3].slug).toBeNull();
    expect(events[4].savedSlugs).toEqual([]);
  });

  it("does NOT emit events for no-op mutations", () => {
    const events: SavedChangedDetail[] = [];
    target.addEventListener(SAVED_CHANGED_EVENT, (e) => {
      events.push((e as { detail: SavedChangedDetail }).detail);
    });
    addSaved("a");
    addSaved("a"); // duplicate
    removeSaved("missing"); // not present
    expect(events.length).toBe(1);
  });
});

describe("storage failures", () => {
  it("survives setItem throwing (quota exceeded)", () => {
    const setSpy = vi.spyOn(storage, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceeded");
    });
    expect(() => addSaved("a")).not.toThrow();
    setSpy.mockRestore();
  });

  it("survives getItem throwing (private mode)", () => {
    vi.spyOn(storage, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    expect(getSavedSlugs()).toEqual([]);
    expect(isSaved("a")).toBe(false);
  });
});
