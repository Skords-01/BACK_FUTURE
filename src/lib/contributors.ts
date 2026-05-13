import type { Fact } from "./filterFacts";
import { factSlug } from "./url";

/**
 * Single author entry as declared in a fact frontmatter `authors` array.
 * Mirrors the Zod schema in `src/content.config.ts`.
 */
export interface AuthorRef {
  name: string;
  url?: string;
}

/**
 * One contributor on the `/contributors` page — author plus the list of facts
 * they're credited on, sorted newest-first by `yearOfEvent` (id ascending as
 * a deterministic tie-break, mirroring the rest of the lib).
 */
export interface ContributorEntry {
  name: string;
  url?: string;
  facts: Array<{ slug: string; title: string; subject: Fact["data"]["subject"] }>;
  count: number;
}

/**
 * Normalize an author name for grouping — trim outer whitespace, collapse
 * runs of internal whitespace, and case-fold. Display name preserves the
 * first observed casing/spacing.
 */
function normalizeAuthorKey(name: string): string {
  return name.trim().replace(/\s+/g, " ").toLocaleLowerCase("uk");
}

/**
 * Group non-draft facts by author. Each entry in a fact's `authors[]` array
 * contributes one fact to that author's bucket.
 *
 * Sorting:
 *   1. facts count descending,
 *   2. alphabetical fallback (Ukrainian locale, case-insensitive).
 *
 * If a fact lists the same author twice (e.g. via different casing), it's
 * still counted once for that author — names are normalized via
 * `normalizeAuthorKey`.
 *
 * If an author appears with different `url` values across facts, the first
 * non-empty URL wins (deterministic for a sorted input).
 */
export function groupFactsByAuthor(facts: readonly Fact[]): ContributorEntry[] {
  const byKey = new Map<
    string,
    {
      name: string;
      url?: string;
      facts: ContributorEntry["facts"];
      seenFactIds: Set<string>;
    }
  >();

  for (const fact of facts) {
    if (fact.data.draft) continue;
    const authors = fact.data.authors;
    if (!authors || authors.length === 0) continue;

    for (const author of authors) {
      const key = normalizeAuthorKey(author.name);
      if (!key) continue;
      const entry = byKey.get(key);
      const factRef = {
        slug: factSlug(fact.id),
        title: fact.data.title,
        subject: fact.data.subject,
      };
      if (!entry) {
        byKey.set(key, {
          name: author.name.trim().replace(/\s+/g, " "),
          url: author.url,
          facts: [factRef],
          seenFactIds: new Set([fact.id]),
        });
      } else {
        if (!entry.seenFactIds.has(fact.id)) {
          entry.facts.push(factRef);
          entry.seenFactIds.add(fact.id);
        }
        if (!entry.url && author.url) entry.url = author.url;
      }
    }
  }

  // Build sorted facts list per author and the final array, both with
  // deterministic ordering so the static build is reproducible.
  const entries: ContributorEntry[] = Array.from(byKey.values()).map((e) => {
    const sortedFacts = e.facts.slice().sort((a, b) => {
      // We don't carry yearOfEvent in the FactRef (keeps the helper light),
      // so fall back to title for a stable order — `/contributors` shows a
      // bullet-list per author, not a timeline.
      return a.title.localeCompare(b.title, "uk");
    });
    return {
      name: e.name,
      url: e.url,
      facts: sortedFacts,
      count: sortedFacts.length,
    };
  });

  entries.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.name.localeCompare(b.name, "uk", { sensitivity: "base" });
  });

  return entries;
}

/**
 * Avatar fallback: take the first grapheme of the first whitespace-separated
 * token and uppercase it. Returns "?" for the (defensively-handled) empty case.
 *
 * Works for Cyrillic, Latin, and multi-byte characters — uses `Intl.Segmenter`
 * when available, otherwise falls back to the first code-point via `Array.from`
 * (the spread iterates UTF-16 surrogate pairs as single units).
 */
export function avatarLetter(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return "?";
  const token = trimmed.split(/\s+/)[0] ?? trimmed;
  // Prefer the grapheme segmenter so combining marks attach to the base char.
  if (typeof Intl !== "undefined" && typeof Intl.Segmenter === "function") {
    const seg = new Intl.Segmenter("uk", { granularity: "grapheme" });
    const first = seg.segment(token)[Symbol.iterator]().next();
    if (!first.done && first.value) {
      return first.value.segment.toLocaleUpperCase("uk");
    }
  }
  const codepoint = Array.from(token)[0] ?? "?";
  return codepoint.toLocaleUpperCase("uk");
}

/**
 * Deterministic, lightweight string hash for picking an avatar colour from a
 * small palette. Not cryptographic. Same input → same bucket across builds.
 */
function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * One of six accent-tinted background tokens — keeps the avatar fallback
 * visually distinct per author without leaking out of the design system.
 *
 * Тримаємо CSS-классы Tailwind-style (через CSS-змінні з токенів), щоб
 * tailwind compiler не вимагав їх «бачити» у JSX напряму.
 */
export function avatarPaletteIndex(name: string): number {
  return hashString(name.trim().toLocaleLowerCase("uk")) % 6;
}
