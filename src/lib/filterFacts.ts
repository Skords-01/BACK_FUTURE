import type { CollectionEntry } from "astro:content";
import { ERAS, eraForGraduationYear, type EraId } from "./eras";
import { SITE, SUBJECTS, type SubjectId } from "../config/site";

export type Fact = CollectionEntry<"facts">;
export type Region = "world" | "ukraine";
export type Impact = "low" | "medium" | "high";

export interface FactFilters {
  region?: Region;
  era?: EraId;
  subject?: SubjectId;
  impact?: Impact;
}

function sortFacts(a: Fact, b: Fact): number {
  if (b.data.yearOfEvent !== a.data.yearOfEvent) {
    return b.data.yearOfEvent - a.data.yearOfEvent;
  }
  return a.id.localeCompare(b.id);
}

function sortFactsAsc(a: Fact, b: Fact): number {
  if (a.data.yearOfEvent !== b.data.yearOfEvent) {
    return a.data.yearOfEvent - b.data.yearOfEvent;
  }
  return a.id.localeCompare(b.id);
}

function matchesFilters(fact: Fact, filters: FactFilters): boolean {
  if (filters.region && (fact.data.region ?? "world") !== filters.region) return false;
  if (filters.era && !fact.data.relevantForEras.includes(filters.era)) return false;
  if (filters.subject && fact.data.subject !== filters.subject) return false;
  if (filters.impact && (fact.data.impact ?? "medium") !== filters.impact) return false;
  return true;
}

/**
 * Returns facts that are "new" for someone who graduated in `year`.
 * A fact is shown if it happened after graduation and is relevant to the user's era.
 */
export function factsForYear(
  facts: readonly Fact[],
  year: number,
  filters: FactFilters = {},
): Fact[] {
  if (year < SITE.yearMin || year > SITE.yearMax) return [];
  const era: EraId = eraForGraduationYear(year);
  return facts
    .filter((f) => !f.data.draft)
    .filter((f) => f.data.yearOfEvent >= year)
    .filter((f) => f.data.relevantForEras.includes(era))
    .filter((f) => matchesFilters(f, filters))
    .slice()
    .sort(sortFactsAsc);
}

export function factsForEra(facts: readonly Fact[], era: EraId, filters: FactFilters = {}): Fact[] {
  return facts
    .filter((f) => !f.data.draft)
    .filter((f) => f.data.relevantForEras.includes(era))
    .filter((f) => matchesFilters(f, filters))
    .slice()
    .sort(sortFacts);
}

/**
 * Returns all non-draft facts of a single subject, sorted by yearOfEvent
 * descending with id ascending as a deterministic tie-break.
 */
export function factsForSubject(facts: readonly Fact[], subject: SubjectId): Fact[] {
  return facts
    .filter((f) => !f.data.draft && f.data.subject === subject)
    .slice()
    .sort(sortFacts);
}

/**
 * Count non-draft facts per era for a single subject. Returns a map keyed by
 * era id; a fact contributes to every era listed in its `relevantForEras`.
 */
export function eraCountsForSubject(
  facts: readonly Fact[],
  subject: SubjectId,
): Map<EraId, number> {
  const counts = new Map<EraId, number>();
  for (const f of facts) {
    if (f.data.draft || f.data.subject !== subject) continue;
    for (const eraId of f.data.relevantForEras) {
      counts.set(eraId, (counts.get(eraId) ?? 0) + 1);
    }
  }
  return counts;
}

/**
 * Group facts by subject in the canonical SUBJECTS order. Both the typographic
 * `mark` (e.g. "АСТ") and `emoji` are exposed: new templates render the mark,
 * `emoji` stays around as a fallback for legacy spots like the dense teaser
 * subtitle on empty-year pages.
 */
export function groupBySubject(facts: readonly Fact[]): Array<{
  subject: SubjectId;
  label: string;
  mark: string;
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
    mark: s.mark,
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
    .sort(sortFacts)
    .slice(0, Math.max(0, n));
}
