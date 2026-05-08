// Year Machine — singleton state for the interactive year picker on the homepage.
// Uses CustomEvent('year:change') to notify all components when the year changes.
// SSR renders with DEFAULT_YEAR; JS hydrates from ?y= param or sessionStorage.

const YEAR_MIN = 1991;
const STORAGE_KEY = "back-future:year";

let _year = 2012;
let _yearMax = 2026;
let _initialized = false;

function clamp(n: number): number {
  return Math.max(YEAR_MIN, Math.min(_yearMax, n));
}

function dispatch(year: number): void {
  document.dispatchEvent(new CustomEvent("year:change", { detail: { year } }));
}

/** Call once from YearOdometer — initializes state and fires initial year:change. */
export function initYearMachine(yearMax: number = 2026): void {
  if (_initialized) return;
  _initialized = true;
  _yearMax = yearMax;

  // Read initial year from ?y= param or sessionStorage
  try {
    const param = new URLSearchParams(window.location.search).get("y");
    if (param) {
      const n = parseInt(param, 10);
      if (!isNaN(n)) {
        _year = clamp(n);
        sessionStorage.setItem(STORAGE_KEY, String(_year));
      }
    } else {
      const stored = sessionStorage.getItem(STORAGE_KEY);
      if (stored) {
        const n = parseInt(stored, 10);
        if (!isNaN(n)) _year = clamp(n);
      }
    }
  } catch {
    // sessionStorage may throw in some private browsing contexts
  }

  // Always dispatch so all components sync to the initial year
  requestAnimationFrame(() => dispatch(_year));
}

export function setYear(year: number): void {
  _year = clamp(year);
  try {
    sessionStorage.setItem(STORAGE_KEY, String(_year));
  } catch {
    // ignore
  }
  dispatch(_year);
}

export function getYear(): number {
  return _year;
}

export function step(delta: number): void {
  setYear(_year + delta);
}

export function randomYear(): void {
  setYear(YEAR_MIN + Math.floor(Math.random() * (_yearMax - YEAR_MIN + 1)));
}

export { YEAR_MIN };
