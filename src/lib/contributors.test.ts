import { describe, expect, it } from "vitest";
import type { SubjectId } from "../config/site";
import type { Fact } from "./filterFacts";
import { avatarLetter, avatarPaletteIndex, groupFactsByAuthor } from "./contributors";

interface FactStub {
  id: string;
  subject?: SubjectId;
  title?: string;
  yearOfEvent?: number;
  relevantForEras?: ReadonlyArray<1 | 2 | 3 | 4 | 5>;
  authors?: ReadonlyArray<{ name: string; url?: string }>;
  draft?: boolean;
}

function makeFact(stub: FactStub): Fact {
  return {
    id: stub.id,
    data: {
      title: stub.title ?? `Title ${stub.id}`,
      subject: stub.subject ?? "physics",
      short: "x".repeat(40),
      yearOfEvent: stub.yearOfEvent ?? 2010,
      relevantForEras: stub.relevantForEras ? [...stub.relevantForEras] : [1, 2, 3, 4, 5],
      sources: [{ title: "src", url: "https://example.com" }],
      tags: [],
      authors: stub.authors ? stub.authors.map((a) => ({ ...a })) : undefined,
      draft: stub.draft ?? false,
    },
  } as unknown as Fact;
}

describe("groupFactsByAuthor", () => {
  it("groups facts by author and counts them", () => {
    const facts = [
      makeFact({ id: "a", title: "Alpha", authors: [{ name: "Olena K." }] }),
      makeFact({ id: "b", title: "Bravo", authors: [{ name: "Olena K." }, { name: "Petro P." }] }),
      makeFact({ id: "c", title: "Charlie", authors: [{ name: "Petro P." }] }),
    ];

    const result = groupFactsByAuthor(facts);

    expect(result).toHaveLength(2);
    const olena = result.find((c) => c.name === "Olena K.");
    const petro = result.find((c) => c.name === "Petro P.");
    expect(olena?.count).toBe(2);
    expect(petro?.count).toBe(2);
    // Both have count 2 — order falls back to alphabetical (Olena < Petro).
    expect(result.map((c) => c.name)).toEqual(["Olena K.", "Petro P."]);
  });

  it("sorts by fact count desc, alphabetical fallback (Ukrainian locale)", () => {
    const facts = [
      makeFact({ id: "x1", authors: [{ name: "Богдан" }] }),
      makeFact({ id: "x2", authors: [{ name: "Богдан" }] }),
      makeFact({ id: "x3", authors: [{ name: "Богдан" }] }),
      makeFact({ id: "y1", authors: [{ name: "Анна" }] }),
      makeFact({ id: "y2", authors: [{ name: "Анна" }] }),
      makeFact({ id: "z1", authors: [{ name: "Віталій" }] }),
      makeFact({ id: "z2", authors: [{ name: "Анастасія" }] }),
    ];

    expect(groupFactsByAuthor(facts).map((c) => c.name)).toEqual([
      "Богдан", // 3
      "Анна", // 2
      "Анастасія", // 1
      "Віталій", // 1
    ]);
  });

  it("excludes draft facts entirely", () => {
    const facts = [
      makeFact({ id: "a", authors: [{ name: "Author A" }] }),
      makeFact({ id: "b", authors: [{ name: "Author A" }], draft: true }),
    ];
    const result = groupFactsByAuthor(facts);
    expect(result).toHaveLength(1);
    expect(result[0]?.count).toBe(1);
    expect(result[0]?.facts.map((f) => f.slug)).toEqual(["a"]);
  });

  it("ignores facts without authors", () => {
    const facts = [
      makeFact({ id: "a", authors: [{ name: "Author A" }] }),
      makeFact({ id: "b" }),
      makeFact({ id: "c", authors: [] }),
    ];
    expect(groupFactsByAuthor(facts)).toEqual([
      {
        name: "Author A",
        url: undefined,
        count: 1,
        facts: [{ slug: "a", title: "Title a", subject: "physics" }],
      },
    ]);
  });

  it("normalizes author names across casing and whitespace", () => {
    const facts = [
      makeFact({ id: "a", authors: [{ name: "Олена Кравченко" }] }),
      makeFact({ id: "b", authors: [{ name: "  олена   кравченко  " }] }),
    ];
    const result = groupFactsByAuthor(facts);
    expect(result).toHaveLength(1);
    expect(result[0]?.count).toBe(2);
    // First-seen display name wins.
    expect(result[0]?.name).toBe("Олена Кравченко");
  });

  it("deduplicates the same author listed twice in one fact", () => {
    const facts = [
      makeFact({
        id: "a",
        authors: [{ name: "Same Person" }, { name: "same person" }],
      }),
    ];
    const result = groupFactsByAuthor(facts);
    expect(result).toHaveLength(1);
    expect(result[0]?.count).toBe(1);
    expect(result[0]?.facts.map((f) => f.slug)).toEqual(["a"]);
  });

  it("keeps the first non-empty url when an author appears with and without one", () => {
    const facts = [
      makeFact({ id: "a", authors: [{ name: "Author A", url: "https://example.com/a" }] }),
      makeFact({ id: "b", authors: [{ name: "Author A" }] }),
    ];
    const result = groupFactsByAuthor(facts);
    expect(result[0]?.url).toBe("https://example.com/a");
  });

  it("returns the fact slug derived via factSlug() (last path segment of id)", () => {
    const facts = [
      makeFact({ id: "physics/gravitational-waves", title: "GW", authors: [{ name: "A" }] }),
    ];
    expect(groupFactsByAuthor(facts)[0]?.facts).toEqual([
      { slug: "gravitational-waves", title: "GW", subject: "physics" },
    ]);
  });

  it("returns an empty array when no facts have authors", () => {
    expect(groupFactsByAuthor([makeFact({ id: "a" })])).toEqual([]);
  });
});

describe("avatarLetter", () => {
  it("returns the uppercase first letter of the first token", () => {
    expect(avatarLetter("Олена Кравченко")).toBe("О");
    expect(avatarLetter("john doe")).toBe("J");
  });

  it("trims surrounding whitespace", () => {
    expect(avatarLetter("  Петро ")).toBe("П");
  });

  it("returns '?' for an empty / whitespace-only name", () => {
    expect(avatarLetter("")).toBe("?");
    expect(avatarLetter("   ")).toBe("?");
  });
});

describe("avatarPaletteIndex", () => {
  it("returns a stable bucket in [0, 5]", () => {
    const idx = avatarPaletteIndex("Олена Кравченко");
    expect(idx).toBeGreaterThanOrEqual(0);
    expect(idx).toBeLessThanOrEqual(5);
    expect(idx).toBe(avatarPaletteIndex("Олена Кравченко"));
  });

  it("treats case and surrounding whitespace as equivalent", () => {
    expect(avatarPaletteIndex(" Author ")).toBe(avatarPaletteIndex("author"));
  });
});
