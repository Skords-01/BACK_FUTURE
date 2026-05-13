import { describe, expect, it } from "vitest";
import type { SubjectId } from "../config/site";
import type { Fact } from "./filterFacts";
import {
  SHARE_HEIGHT,
  SHARE_WIDTH,
  buildSharePosterSvg,
  computeSharePosterParts,
  pickPosterQuoteFact,
  wrapText,
} from "./share";

interface FactStub {
  id: string;
  subject: SubjectId;
  yearOfEvent: number;
  relevantForEras: ReadonlyArray<1 | 2 | 3 | 4 | 5>;
  impact?: "low" | "medium" | "high";
  quote?: { text: string; author: string };
}

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
      draft: false,
      impact: stub.impact,
      quote: stub.quote,
    },
  } as unknown as Fact;
}

describe("wrapText", () => {
  it("returns at most maxLines lines", () => {
    const lines = wrapText("слово ".repeat(40).trim(), 20, 3);
    expect(lines.length).toBeLessThanOrEqual(3);
  });

  it("does not split inside words", () => {
    const lines = wrapText("дуже-довге-слово коротке", 5, 2);
    expect(lines[0]).toBe("дуже-довге-слово");
  });

  it("appends ellipsis when text overflows maxLines", () => {
    const lines = wrapText("один два три чотири пʼять шість сім вісім", 6, 2);
    expect(lines.length).toBe(2);
    expect(lines[lines.length - 1]?.endsWith("…")).toBe(true);
  });

  it("returns a single line if the text fits", () => {
    expect(wrapText("hi there", 80, 4)).toEqual(["hi there"]);
  });
});

describe("pickPosterQuoteFact", () => {
  it("returns null when no fact has a quote", () => {
    const facts = [
      makeFact({ id: "a", subject: "physics", yearOfEvent: 2010, relevantForEras: [3] }),
    ];
    expect(pickPosterQuoteFact(facts)).toBeNull();
  });

  it("prefers high-impact facts with a quote", () => {
    const facts = [
      makeFact({
        id: "low",
        subject: "physics",
        yearOfEvent: 2010,
        relevantForEras: [3],
        impact: "low",
        quote: { text: "low", author: "L" },
      }),
      makeFact({
        id: "high",
        subject: "biology",
        yearOfEvent: 2011,
        relevantForEras: [3],
        impact: "high",
        quote: { text: "high", author: "H" },
      }),
    ];
    expect(pickPosterQuoteFact(facts)?.id).toBe("high");
  });

  it("is deterministic via id tie-break when impacts match", () => {
    const facts = [
      makeFact({
        id: "zzz",
        subject: "physics",
        yearOfEvent: 2010,
        relevantForEras: [3],
        impact: "high",
        quote: { text: "z", author: "Z" },
      }),
      makeFact({
        id: "aaa",
        subject: "biology",
        yearOfEvent: 2011,
        relevantForEras: [3],
        impact: "high",
        quote: { text: "a", author: "A" },
      }),
    ];
    expect(pickPosterQuoteFact(facts)?.id).toBe("aaa");
  });
});

describe("computeSharePosterParts", () => {
  it("counts matched facts and resolves the era label", () => {
    const facts = [
      makeFact({ id: "a", subject: "physics", yearOfEvent: 2012, relevantForEras: [3, 4, 5] }),
      makeFact({ id: "b", subject: "biology", yearOfEvent: 2020, relevantForEras: [5] }),
    ];
    const parts = computeSharePosterParts(2010, facts);
    expect(parts.totalCount).toBeGreaterThan(0);
    expect(parts.eraLabel).toBeTruthy();
    expect(parts.year).toBe(2010);
  });

  it("returns null quote when no candidate facts have a quote", () => {
    const facts = [
      makeFact({ id: "a", subject: "physics", yearOfEvent: 2012, relevantForEras: [3, 4, 5] }),
    ];
    const parts = computeSharePosterParts(2010, facts);
    expect(parts.quoteText).toBeNull();
    expect(parts.quoteAuthor).toBeNull();
  });

  it("surfaces the picked quote for the year", () => {
    const facts = [
      makeFact({
        id: "with-quote",
        subject: "physics",
        yearOfEvent: 2012,
        relevantForEras: [3, 4, 5],
        impact: "high",
        quote: { text: "Прорив у нас", author: "Лектор" },
      }),
    ];
    const parts = computeSharePosterParts(2010, facts);
    expect(parts.quoteText).toBe("Прорив у нас");
    expect(parts.quoteAuthor).toBe("Лектор");
  });
});

describe("buildSharePosterSvg", () => {
  const sampleFacts = [
    makeFact({
      id: "phys-1",
      subject: "physics",
      yearOfEvent: 2012,
      relevantForEras: [3, 4, 5],
      impact: "high",
      quote: { text: "Хіггс знайдено", author: "CERN" },
    }),
    makeFact({
      id: "bio-1",
      subject: "biology",
      yearOfEvent: 2020,
      relevantForEras: [4, 5],
    }),
  ];

  it("returns a string starting with an <svg> root", () => {
    const svg = buildSharePosterSvg(2010, sampleFacts);
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg.endsWith("</svg>")).toBe(true);
  });

  it("declares the 1080×1920 story format", () => {
    const svg = buildSharePosterSvg(2010, sampleFacts);
    expect(svg).toContain(`width="${SHARE_WIDTH}"`);
    expect(svg).toContain(`height="${SHARE_HEIGHT}"`);
    expect(svg).toContain(`viewBox="0 0 ${SHARE_WIDTH} ${SHARE_HEIGHT}"`);
  });

  it("renders the year text and BACK_FUTURE wordmark", () => {
    const svg = buildSharePosterSvg(2007, sampleFacts);
    expect(svg).toContain(">2007<");
    expect(svg).toContain("BACK_FUTURE");
  });

  it("falls back gracefully for years with zero facts", () => {
    const svg = buildSharePosterSvg(2025, []);
    expect(svg.startsWith("<svg")).toBe(true);
    expect(svg).toContain("Тут поки тихо");
  });

  it("escapes XML-sensitive characters in quote text", () => {
    const facts = [
      makeFact({
        id: "tricky",
        subject: "physics",
        yearOfEvent: 2012,
        relevantForEras: [3, 4, 5],
        impact: "high",
        quote: { text: "<script> & break", author: "Auth&or" },
      }),
    ];
    const svg = buildSharePosterSvg(2010, facts);
    expect(svg).not.toContain("<script>");
    expect(svg).toContain("&amp;");
  });

  it("renders the same SVG for the same inputs (deterministic)", () => {
    const a = buildSharePosterSvg(2010, sampleFacts);
    const b = buildSharePosterSvg(2010, sampleFacts);
    expect(a).toBe(b);
  });
});
