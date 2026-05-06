import type { CollectionEntry } from "astro:content";
import { eraForGraduationYear, type EraId } from "./eras";
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
