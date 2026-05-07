import type { CollectionEntry } from "astro:content";
import { ERAS, eraForGraduationYear, type EraId } from "./eras";
import { SUBJECTS, type SubjectId } from "../config/site";

export type Fact = CollectionEntry<"facts">;

/**
 * Returns facts that are "new" for someone who graduated in `year`.
 * A fact is shown if its `relevantForEras` contains the user's era id.
 */
export function factsForYear(facts: readonly Fact[], year: number): Fact[] {
  const era: EraId = eraForGraduationYear(year);
  return facts
    .filter((f) => !f.data.draft)
    .filter((f) => f.data.relevantForEras.includes(era))
    .sort((a, b) => b.data.yearOfEvent - a.data.yearOfEvent);
}

/** Group facts by subject in the canonical SUBJECTS order. */
export function groupBySubject(facts: readonly Fact[]): Array<{
  subject: SubjectId;
  label: string;
  emoji: string;
  items: Fact[];
}> {
  const bySubject = new Map<SubjectId, Fact[]>();
  for (const f of facts) {
    const arr = bySubject.get(f.data.subject) ?? [];
    arr.push(f);
    bySubject.set(f.data.subject, arr);
  }
  return SUBJECTS.map((s) => ({
    subject: s.id,
    label: s.label,
    emoji: s.emoji,
    items: bySubject.get(s.id) ?? [],
  })).filter((g) => g.items.length > 0);
}

export interface FallbackYear {
  year: number;
  eraId: EraId;
  eraLabel: string;
  count: number;
}

/**
 * For a year that has no matching facts, build a list of representative years
 * the visitor can try instead — one per era that actually contains facts.
 * The representative year is the era's middle (or `yearEnd` if `forYear`
 * happens to land on the middle), and the list is ordered by closeness to
 * `forYear`, then by fact count descending.
 */
export function pickFallbackYears(forYear: number, facts: readonly Fact[]): FallbackYear[] {
  const countByEra = new Map<EraId, number>();
  for (const f of facts) {
    if (f.data.draft) continue;
    for (const eraId of f.data.relevantForEras) {
      countByEra.set(eraId, (countByEra.get(eraId) ?? 0) + 1);
    }
  }

  return ERAS.filter((era) => (countByEra.get(era.id) ?? 0) > 0)
    .map((era) => {
      const middle = Math.round((era.yearStart + era.yearEnd) / 2);
      const yearInEra = middle === forYear ? era.yearEnd : middle;
      return {
        year: yearInEra,
        eraId: era.id,
        eraLabel: era.label,
        count: countByEra.get(era.id) ?? 0,
      };
    })
    .sort((a, b) => {
      const da = Math.abs(a.year - forYear);
      const db = Math.abs(b.year - forYear);
      if (da !== db) return da - db;
      return b.count - a.count;
    });
}

/**
 * Pick up to `n` sample facts to show as a teaser on an empty-year page.
 * Bias toward more recent events; deterministic order so build output is stable.
 */
export function sampleFacts(facts: readonly Fact[], n: number): Fact[] {
  return facts
    .filter((f) => !f.data.draft)
    .slice()
    .sort((a, b) => {
      if (b.data.yearOfEvent !== a.data.yearOfEvent) {
        return b.data.yearOfEvent - a.data.yearOfEvent;
      }
      return a.id.localeCompare(b.id);
    })
    .slice(0, Math.max(0, n));
}
