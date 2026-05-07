import { describe, expect, it } from "vitest";
import type { Fact } from "./filterFacts";
import { factsForYear, groupBySubject } from "./filterFacts";

interface FactStub {
  id: string;
  subject: "astronomy" | "biology" | "geography" | "history" | "physics";
  yearOfEvent: number;
  relevantForEras: ReadonlyArray<1 | 2 | 3 | 4 | 5>;
  draft?: boolean;
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
    },
  } as unknown as Fact;
}

describe("factsForYear", () => {
  it("returns only facts whose relevantForEras contains the user's era", () => {
    const facts = [
      makeFact({ id: "a", subject: "physics", yearOfEvent: 2010, relevantForEras: [1, 2] }),
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

  it("sorts results by yearOfEvent descending (most recent first)", () => {
    const facts = [
      makeFact({ id: "old", subject: "physics", yearOfEvent: 2001, relevantForEras: [1, 2] }),
      makeFact({ id: "new", subject: "physics", yearOfEvent: 2024, relevantForEras: [1, 2] }),
      makeFact({ id: "mid", subject: "physics", yearOfEvent: 2012, relevantForEras: [1, 2] }),
    ];

    expect(factsForYear(facts, 2003).map((f) => f.id)).toEqual(["new", "mid", "old"]);
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

  it("filters out subjects with no items", () => {
    const facts = [
      makeFact({ id: "b1", subject: "biology", yearOfEvent: 2020, relevantForEras: [5] }),
    ];
    const groups = groupBySubject(facts);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.subject).toBe("biology");
  });

  it("returns an empty array for no input", () => {
    expect(groupBySubject([])).toEqual([]);
  });
});
