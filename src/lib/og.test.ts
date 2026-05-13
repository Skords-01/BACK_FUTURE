import { describe, expect, it } from "vitest";
import type { SubjectId } from "../config/site";
import { ERAS } from "./eras";
import type { Fact } from "./filterFacts";
import { OG_HEIGHT, OG_WIDTH, buildEraOgSvg, buildYearOgSvg, buildDefaultOgSvg } from "./og";

interface FactStub {
  id: string;
  subject: SubjectId;
  yearOfEvent: number;
  relevantForEras: ReadonlyArray<1 | 2 | 3 | 4 | 5>;
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
    },
  } as unknown as Fact;
}

describe("buildDefaultOgSvg", () => {
  it("emits a 1200x630 SVG with the brand", () => {
    const svg = buildDefaultOgSvg();
    expect(svg).toContain(`width="${OG_WIDTH}"`);
    expect(svg).toContain(`height="${OG_HEIGHT}"`);
    expect(svg).toContain("BACK_FUTURE");
  });
});

describe("buildYearOgSvg", () => {
  it("renders the year and era label even with zero facts", () => {
    const svg = buildYearOgSvg(2010, []);
    expect(svg).toContain("Випуск 2010");
    // 2010 belongs to era 3 (2004–2010).
    expect(svg).toContain(ERAS.find((e) => e.id === 3)!.label);
  });

  it("counts matched facts in the headline", () => {
    const facts = [
      makeFact({ id: "a", subject: "physics", yearOfEvent: 2010, relevantForEras: [3] }),
      makeFact({ id: "b", subject: "biology", yearOfEvent: 2010, relevantForEras: [3] }),
    ];
    const svg = buildYearOgSvg(2010, facts);
    expect(svg).toContain("Ти пропустив 2 оновлення");
  });
});

describe("buildEraOgSvg", () => {
  it("emits a 1200x630 SVG with the brand and era headline", () => {
    const era = ERAS.find((e) => e.id === 4)!;
    const svg = buildEraOgSvg(era, []);
    expect(svg).toContain(`width="${OG_WIDTH}"`);
    expect(svg).toContain(`height="${OG_HEIGHT}"`);
    expect(svg).toContain("BACK_FUTURE");
    expect(svg).toContain(`ЕРА ${era.id}`);
    expect(svg).toContain(era.label);
  });

  it("renders the era summary so the OG card is era-specific", () => {
    const era = ERAS.find((e) => e.id === 1)!;
    const svg = buildEraOgSvg(era, []);
    // Кілька перших слів summary мають бути присутні (точне розбиття на рядки
    // залежить від word-wrap — тому грепаємо лише початок).
    const firstWords = era.summary.split(/\s+/).slice(0, 3).join(" ");
    expect(svg).toContain(firstWords);
  });

  it("counts era-relevant facts in the stats line", () => {
    const era = ERAS.find((e) => e.id === 2)!;
    const facts = [
      makeFact({ id: "a", subject: "physics", yearOfEvent: 2000, relevantForEras: [2] }),
      makeFact({ id: "b", subject: "biology", yearOfEvent: 2000, relevantForEras: [2] }),
      makeFact({ id: "c", subject: "history", yearOfEvent: 2000, relevantForEras: [2] }),
    ];
    const svg = buildEraOgSvg(era, facts);
    expect(svg).toContain("3 факти");
  });

  it("uses 'сьогодні' as end year for the current era", () => {
    const era = ERAS.find((e) => e.yearEnd > 2050)!;
    const svg = buildEraOgSvg(era, []);
    expect(svg).toContain("сьогодні");
  });

  it("escapes HTML-special chars in era fields", () => {
    const era = { ...ERAS[0]!, label: 'Era <test> & quote"' };
    const svg = buildEraOgSvg(era, []);
    // The XML shouldn't contain raw `<test>` injected as a tag, but it may
    // appear as escaped entities in the text content.
    expect(svg).toContain("Era &lt;test&gt; &amp; quote&quot;");
    expect(svg).not.toContain("Era <test>");
  });
});
