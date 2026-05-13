import { describe, expect, it } from "vitest";
import type { SubjectId } from "../config/site";
import type { Fact } from "./filterFacts";
import {
  eraCountsForSubject,
  factsForSubject,
  factsForYear,
  groupBySubject,
  pickFallbackYears,
  sampleFacts,
} from "./filterFacts";

interface FactStub {
  id: string;
  subject: SubjectId;
  yearOfEvent: number;
  relevantForEras: ReadonlyArray<1 | 2 | 3 | 4 | 5>;
  draft?: boolean;
  region?: string;
}

/**
 * Build a structurally compatible Fact for tests. We only populate the fields
 * the lib functions actually read — the rest of `CollectionEntry<"facts">` is
 * irrelevant here, so we cast to the public Fact type.
 */
function makeFact(stub: FactStub): Fact {
  return {
    id: stub.id,
    data: {
      title: `Title ${stub.id}`,
      subject: stub.subject,
      short: "x".repeat(40),
      yearOfEvent: stub.yearOfEvent,
      relevantForEras: [...stub.relevantForEras],
      sources: [{ title: "src", url: "https://example.com" }],
      tags: [],
      draft: stub.draft ?? false,
      region: stub.region,
    },
  } as unknown as Fact;
}

describe("factsForYear", () => {
  it("returns post-graduation facts whose relevantForEras contains the user's era", () => {
    const facts = [
      makeFact({ id: "a", subject: "physics", yearOfEvent: 2010, relevantForEras: [1, 2] }),
      makeFact({ id: "before", subject: "physics", yearOfEvent: 2001, relevantForEras: [1, 2] }),
      makeFact({ id: "b", subject: "physics", yearOfEvent: 2015, relevantForEras: [3, 4, 5] }),
      makeFact({ id: "c", subject: "biology", yearOfEvent: 2020, relevantForEras: [5] }),
    ];

    // 2003 → era 2
    const result = factsForYear(facts, 2003);
    expect(result.map((f) => f.id)).toEqual(["a"]);
  });

  it("excludes drafts even if their era matches", () => {
    const facts = [
      makeFact({
        id: "draft",
        subject: "physics",
        yearOfEvent: 2020,
        relevantForEras: [2],
        draft: true,
      }),
      makeFact({ id: "live", subject: "physics", yearOfEvent: 2020, relevantForEras: [2] }),
    ];

    const result = factsForYear(facts, 2003);
    expect(result.map((f) => f.id)).toEqual(["live"]);
  });

  it("sorts results by yearOfEvent ascending (oldest first from graduation year)", () => {
    const facts = [
      makeFact({ id: "old", subject: "physics", yearOfEvent: 2004, relevantForEras: [1, 2] }),
      makeFact({ id: "new", subject: "physics", yearOfEvent: 2024, relevantForEras: [1, 2] }),
      makeFact({ id: "mid", subject: "physics", yearOfEvent: 2012, relevantForEras: [1, 2] }),
    ];

    expect(factsForYear(facts, 2003).map((f) => f.id)).toEqual(["old", "mid", "new"]);
  });

  it("returns an empty array if nothing matches", () => {
    const facts = [
      makeFact({ id: "x", subject: "physics", yearOfEvent: 2020, relevantForEras: [5] }),
    ];
    // 1991 → era 1
    expect(factsForYear(facts, 1991)).toEqual([]);
  });
});

describe("groupBySubject", () => {
  it("groups facts and preserves SUBJECTS order", () => {
    const facts = [
      makeFact({ id: "h1", subject: "history", yearOfEvent: 2010, relevantForEras: [3] }),
      makeFact({ id: "a1", subject: "astronomy", yearOfEvent: 2010, relevantForEras: [3] }),
      makeFact({ id: "p1", subject: "physics", yearOfEvent: 2010, relevantForEras: [3] }),
      makeFact({ id: "a2", subject: "astronomy", yearOfEvent: 2011, relevantForEras: [3] }),
    ];

    const groups = groupBySubject(facts);
    expect(groups.map((g) => g.subject)).toEqual(["astronomy", "history", "physics"]);

    const astronomy = groups.find((g) => g.subject === "astronomy");
    expect(astronomy?.items.map((f) => f.id)).toEqual(["a1", "a2"]);
    expect(astronomy?.label).toBe("Астрономія");
    expect(astronomy?.emoji).toBe("🪐");
  });

  it("threads the typographic mark through every group", () => {
    // The new templates render the 3-letter Cyrillic abbreviation instead of
    // the emoji. We assert the mark is present and matches SUBJECTS so the
    // template doesn't have to reach back into the SUBJECTS table.
    const facts = [
      makeFact({ id: "a1", subject: "astronomy", yearOfEvent: 2010, relevantForEras: [3] }),
      makeFact({ id: "p1", subject: "physics", yearOfEvent: 2010, relevantForEras: [3] }),
      makeFact({ id: "h1", subject: "history", yearOfEvent: 2010, relevantForEras: [3] }),
    ];

    const groups = groupBySubject(facts);
    const marks = Object.fromEntries(groups.map((g) => [g.subject, g.mark]));
    expect(marks).toEqual({ astronomy: "АСТ", history: "ІСТ", physics: "ФІЗ" });
    for (const g of groups) {
      expect(g.mark, `group ${g.subject} is missing a mark`).toBeTruthy();
      expect(/^[А-ЯҐЄІЇ]{3}$/.test(g.mark)).toBe(true);
    }
  });

  it("filters out subjects with no items", () => {
    const facts = [
      makeFact({ id: "b1", subject: "biology", yearOfEvent: 2020, relevantForEras: [5] }),
    ];
    const groups = groupBySubject(facts);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.subject).toBe("biology");
    expect(groups[0]!.mark).toBe("БІО");
  });

  it("returns an empty array for no input", () => {
    expect(groupBySubject([])).toEqual([]);
  });
});

describe("pickFallbackYears", () => {
  it("returns one entry per era that has facts, ordered by closeness", () => {
    const facts = [
      makeFact({ id: "e1", subject: "physics", yearOfEvent: 1995, relevantForEras: [1] }),
      makeFact({ id: "e2", subject: "physics", yearOfEvent: 2005, relevantForEras: [2] }),
      makeFact({ id: "e3a", subject: "physics", yearOfEvent: 2012, relevantForEras: [3] }),
      makeFact({ id: "e3b", subject: "physics", yearOfEvent: 2013, relevantForEras: [3] }),
      makeFact({ id: "e5", subject: "physics", yearOfEvent: 2024, relevantForEras: [5] }),
    ];

    const result = pickFallbackYears(2010, facts);
    expect(result).toHaveLength(4);
    expect(result.every((f) => f.count > 0)).toBe(true);

    const distances = result.map((f) => Math.abs(f.year - 2010));
    expect(distances).toEqual([...distances].sort((a, b) => a - b));
  });

  it("excludes drafts from era counts", () => {
    const facts = [
      makeFact({
        id: "draft",
        subject: "physics",
        yearOfEvent: 2020,
        relevantForEras: [5],
        draft: true,
      }),
      makeFact({ id: "live", subject: "physics", yearOfEvent: 2020, relevantForEras: [4] }),
    ];

    const result = pickFallbackYears(2003, facts);
    expect(result.map((f) => f.eraId)).toEqual([4]);
  });

  it("counts a fact once per era it lists in relevantForEras", () => {
    const facts = [
      makeFact({ id: "x", subject: "physics", yearOfEvent: 2010, relevantForEras: [3, 4, 5] }),
    ];

    const result = pickFallbackYears(1991, facts);
    expect(result.map((f) => f.eraId)).toEqual([3, 4, 5]);
    expect(result.every((f) => f.count === 1)).toBe(true);
  });

  it("returns an empty array if no era has any facts", () => {
    expect(pickFallbackYears(2010, [])).toEqual([]);
  });

  it("avoids picking the same year as `forYear` when era middle equals it", () => {
    const facts = [
      makeFact({ id: "a", subject: "physics", yearOfEvent: 2005, relevantForEras: [2] }),
    ];

    // Era 2 spans 1999-2007 so middle is 2003. If user is on 2003,
    // representative year should fall back to era yearEnd (2007), not 2003.
    const result = pickFallbackYears(2003, facts);
    expect(result).toHaveLength(1);
    expect(result[0]!.year).not.toBe(2003);
  });
});

describe("factsForSubject", () => {
  it("returns only non-draft facts of the requested subject, sorted by year desc / id asc", () => {
    const facts = [
      makeFact({ id: "p-old", subject: "physics", yearOfEvent: 2001, relevantForEras: [1] }),
      makeFact({ id: "b1", subject: "biology", yearOfEvent: 2024, relevantForEras: [5] }),
      makeFact({ id: "p-2024-b", subject: "physics", yearOfEvent: 2024, relevantForEras: [5] }),
      makeFact({ id: "p-2024-a", subject: "physics", yearOfEvent: 2024, relevantForEras: [5] }),
    ];

    expect(factsForSubject(facts, "physics").map((f) => f.id)).toEqual([
      "p-2024-a",
      "p-2024-b",
      "p-old",
    ]);
  });

  it("excludes drafts", () => {
    const facts = [
      makeFact({
        id: "p-draft",
        subject: "physics",
        yearOfEvent: 2024,
        relevantForEras: [5],
        draft: true,
      }),
      makeFact({ id: "p-live", subject: "physics", yearOfEvent: 2010, relevantForEras: [3] }),
    ];
    expect(factsForSubject(facts, "physics").map((f) => f.id)).toEqual(["p-live"]);
  });

  it("returns empty when no fact matches the subject", () => {
    const facts = [
      makeFact({ id: "h1", subject: "history", yearOfEvent: 2024, relevantForEras: [5] }),
    ];
    expect(factsForSubject(facts, "physics")).toEqual([]);
  });
});

describe("eraCountsForSubject", () => {
  it("counts a non-draft fact once per era listed in relevantForEras", () => {
    const facts = [
      makeFact({ id: "a", subject: "physics", yearOfEvent: 2010, relevantForEras: [3, 4, 5] }),
      makeFact({ id: "b", subject: "physics", yearOfEvent: 2020, relevantForEras: [5] }),
      makeFact({ id: "h", subject: "history", yearOfEvent: 2014, relevantForEras: [4, 5] }),
    ];

    const counts = eraCountsForSubject(facts, "physics");
    expect(counts.get(3)).toBe(1);
    expect(counts.get(4)).toBe(1);
    expect(counts.get(5)).toBe(2);
    expect(counts.has(1)).toBe(false);
    expect(counts.has(2)).toBe(false);
  });

  it("excludes drafts", () => {
    const facts = [
      makeFact({
        id: "draft",
        subject: "physics",
        yearOfEvent: 2010,
        relevantForEras: [3],
        draft: true,
      }),
    ];

    expect(eraCountsForSubject(facts, "physics").size).toBe(0);
  });
});

describe("sampleFacts", () => {
  it("returns at most n facts ordered by yearOfEvent desc, id asc as tie-break", () => {
    const facts = [
      makeFact({ id: "a", subject: "physics", yearOfEvent: 2010, relevantForEras: [3] }),
      makeFact({ id: "b", subject: "physics", yearOfEvent: 2024, relevantForEras: [5] }),
      makeFact({ id: "c", subject: "physics", yearOfEvent: 2024, relevantForEras: [5] }),
      makeFact({ id: "d", subject: "physics", yearOfEvent: 1995, relevantForEras: [1] }),
    ];

    expect(sampleFacts(facts, 3).map((f) => f.id)).toEqual(["b", "c", "a"]);
  });

  it("excludes drafts", () => {
    const facts = [
      makeFact({
        id: "draft",
        subject: "physics",
        yearOfEvent: 2024,
        relevantForEras: [5],
        draft: true,
      }),
      makeFact({ id: "live", subject: "physics", yearOfEvent: 2010, relevantForEras: [3] }),
    ];

    expect(sampleFacts(facts, 5).map((f) => f.id)).toEqual(["live"]);
  });

  it("treats negative or zero n as empty", () => {
    const facts = [
      makeFact({ id: "a", subject: "physics", yearOfEvent: 2010, relevantForEras: [3] }),
    ];
    expect(sampleFacts(facts, 0)).toEqual([]);
    expect(sampleFacts(facts, -3)).toEqual([]);
  });
});

describe("factsForYear region filter", () => {
  const facts = [
    makeFact({
      id: "w",
      subject: "physics",
      yearOfEvent: 2010,
      relevantForEras: [3, 4, 5],
      region: "world",
    }),
    makeFact({
      id: "ua",
      subject: "physics",
      yearOfEvent: 2011,
      relevantForEras: [3, 4, 5],
      region: "ukraine",
    }),
    makeFact({
      id: "cz",
      subject: "physics",
      yearOfEvent: 2012,
      relevantForEras: [3, 4, 5],
      region: "country:cz",
    }),
    makeFact({
      id: "pl",
      subject: "physics",
      yearOfEvent: 2013,
      relevantForEras: [3, 4, 5],
      region: "country:pl",
    }),
  ];

  // 2005 → era 3 (2004-2010); we filter for facts with year >= 2005, all qualify.
  it("filters by world / ukraine literal", () => {
    expect(factsForYear(facts, 2005, { region: "world" }).map((f) => f.id)).toEqual(["w"]);
    expect(factsForYear(facts, 2005, { region: "ukraine" }).map((f) => f.id)).toEqual(["ua"]);
  });

  it("filters by single country", () => {
    expect(factsForYear(facts, 2005, { region: { country: "cz" } }).map((f) => f.id)).toEqual([
      "cz",
    ]);
  });

  it("filters by multiple countries (multi-country URL form)", () => {
    expect(
      factsForYear(facts, 2005, { region: { countries: ["cz", "pl"] } }).map((f) => f.id),
    ).toEqual(["cz", "pl"]);
  });

  it("country filter is case-insensitive", () => {
    expect(factsForYear(facts, 2005, { region: { country: "CZ" } }).map((f) => f.id)).toEqual([
      "cz",
    ]);
  });

  it("treats undefined region on a fact as 'world'", () => {
    const withMissing = [
      makeFact({
        id: "noregion",
        subject: "physics",
        yearOfEvent: 2010,
        relevantForEras: [3, 4, 5],
      }),
    ];
    expect(factsForYear(withMissing, 2005, { region: "world" }).map((f) => f.id)).toEqual([
      "noregion",
    ]);
  });
});
