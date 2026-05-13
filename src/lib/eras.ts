import erasJson from "../../content/eras.json" with { type: "json" };
import { SITE } from "../config/site";

export type EraId = 1 | 2 | 3 | 4 | 5;

export interface Era {
  id: EraId;
  slug: string;
  label: string;
  name: string;
  short: string;
  color: string;
  tone: string;
  yearStart: number;
  yearEnd: number;
  summary: string;
}

export const ERAS: Era[] = erasJson as Era[];

/** Resolve a graduation year to its program era id. */
export function eraForGraduationYear(year: number): EraId {
  for (const era of ERAS) {
    if (year >= era.yearStart && year <= era.yearEnd) return era.id;
  }
  // Fallback to last era for years beyond the range.
  return ERAS[ERAS.length - 1]!.id;
}

export function eraById(id: EraId): Era {
  const era = ERAS.find((e) => e.id === id);
  if (!era) throw new Error(`Unknown era id: ${id}`);
  return era;
}

/** Shorthand alias — returns the full Era object for a graduation year. */
export function eraOf(year: number): Era {
  return eraById(eraForGraduationYear(year));
}

/**
 * Parse a value as a graduation year inside the supported `[yearMin, yearMax]`
 * window. Accepts strings (e.g. URL search params) and numbers; trims, coerces,
 * and rejects non-integers, NaN, and out-of-range values. Returns `null` on
 * invalid input — callers decide how to surface the error.
 *
 * Used by `/compare?a=…&b=…` to validate query params before rendering the
 * side-by-side view; lives in `eras.ts` because the supported window is
 * tightly coupled to which eras exist.
 */
export function parseYear(raw: string | number | null | undefined): number | null {
  if (raw === null || raw === undefined) return null;
  const trimmed = typeof raw === "string" ? raw.trim() : raw;
  if (trimmed === "") return null;
  const n = Number(trimmed);
  if (!Number.isInteger(n)) return null;
  if (n < SITE.yearMin || n > SITE.yearMax) return null;
  return n;
}
