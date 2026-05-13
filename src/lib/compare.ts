/**
 * Pure helpers behind `/compare?a=…&b=…`. Build a deterministic per-year
 * stats payload that the page template can render in two columns without
 * pulling in `[year].astro` plumbing (YearHero, FactTimeline, etc.). Keeping
 * this here also makes the comparison behaviour unit-testable without an
 * Astro renderer.
 */
import type { SubjectId } from "../config/site";
import { eraOf, type Era } from "./eras";
import { factsForYear, type Fact } from "./filterFacts";

export interface CompareSubjectRef {
  subject: SubjectId;
  count: number;
}

export interface YearStats {
  year: number;
  era: Era;
  totalCount: number;
  topFacts: Fact[];
  subjects: CompareSubjectRef[];
}

/**
 * Pick the top-N facts a graduate of `year` missed, biased toward high-impact
 * news. Within an impact bucket we sort by `yearOfEvent` descending (newer
 * first) so the reader sees the freshest milestones; ties break on id for a
 * stable build. The result is a slice — never the live array.
 */
export function topImpactFacts(facts: readonly Fact[], year: number, n = 3): Fact[] {
  const impactRank = (f: Fact): number => {
    switch (f.data.impact ?? "medium") {
      case "high":
        return 3;
      case "medium":
        return 2;
      case "low":
        return 1;
    }
  };

  return factsForYear(facts, year)
    .slice()
    .sort((a, b) => {
      const ra = impactRank(a);
      const rb = impactRank(b);
      if (ra !== rb) return rb - ra;
      if (a.data.yearOfEvent !== b.data.yearOfEvent) {
        return b.data.yearOfEvent - a.data.yearOfEvent;
      }
      return a.id.localeCompare(b.id);
    })
    .slice(0, Math.max(0, n));
}

/**
 * Group `facts` (already filtered for a given year via `factsForYear`) by
 * subject and return [{subject, count}], sorted by count descending then by
 * subject id ascending for determinism.
 */
export function subjectsForYear(facts: readonly Fact[]): CompareSubjectRef[] {
  const counts = new Map<SubjectId, number>();
  for (const f of facts) {
    counts.set(f.data.subject, (counts.get(f.data.subject) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([subject, count]) => ({ subject, count }))
    .sort((a, b) => {
      if (a.count !== b.count) return b.count - a.count;
      return a.subject.localeCompare(b.subject);
    });
}

/**
 * Collect everything `/compare` needs about a single year: matched fact count,
 * era metadata, top-impact picks, and subject breakdown. Returned shape is
 * intentionally small — anything heavier (FactCard renderer, FactTimeline)
 * stays in the page layer.
 */
export function collectYearStats(facts: readonly Fact[], year: number, topN = 3): YearStats {
  const matched = factsForYear(facts, year);
  return {
    year,
    era: eraOf(year),
    totalCount: matched.length,
    topFacts: topImpactFacts(facts, year, topN),
    subjects: subjectsForYear(matched),
  };
}

/**
 * Intersect the subject lists of two year-stats objects, preserving the order
 * of the first argument so the output is stable regardless of which year is on
 * the left.
 */
export function commonSubjects(a: YearStats, b: YearStats): SubjectId[] {
  const bSet = new Set(b.subjects.map((s) => s.subject));
  return a.subjects.map((s) => s.subject).filter((s) => bSet.has(s));
}

/**
 * Pick a deterministic random pair of years in `[yearMin, yearMax]`, with the
 * caveat that `a !== b`. `rand` is injectable so tests can pin output without
 * monkey-patching `Math.random`.
 */
export function randomYearPair(
  yearMin: number,
  yearMax: number,
  rand: () => number = Math.random,
): { a: number; b: number } {
  const span = yearMax - yearMin + 1;
  if (span < 2) {
    // Degenerate range — only one valid year. Return it twice; callers should
    // guard against `a === b` themselves.
    return { a: yearMin, b: yearMin };
  }
  const a = yearMin + Math.floor(rand() * span);
  // Pick `b` from the remaining span so it can never collide with `a`.
  let b = yearMin + Math.floor(rand() * (span - 1));
  if (b >= a) b += 1;
  return { a, b };
}
