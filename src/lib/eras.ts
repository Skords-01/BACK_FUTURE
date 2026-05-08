import erasJson from "../../content/eras.json" with { type: "json" };

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
