import { describe, expect, it } from "vitest";
import { FAQ_ITEMS, buildFaqJsonLd, type FaqItem } from "./faq";

describe("FAQ_ITEMS", () => {
  it("contains 5–8 questions per the SEO brief", () => {
    expect(FAQ_ITEMS.length).toBeGreaterThanOrEqual(5);
    expect(FAQ_ITEMS.length).toBeLessThanOrEqual(8);
  });

  it("has non-empty plain-text q/a pairs", () => {
    for (const item of FAQ_ITEMS) {
      expect(item.q.length).toBeGreaterThan(0);
      expect(item.a.length).toBeGreaterThan(0);
      // Answers/questions must be plain text for schema.org/FAQPage
      // (Google rejects HTML markup in answer text).
      expect(item.q).not.toMatch(/<[^>]+>/);
      expect(item.a).not.toMatch(/<[^>]+>/);
    }
  });

  it("uses unique questions", () => {
    const seen = new Set<string>();
    for (const item of FAQ_ITEMS) {
      expect(seen.has(item.q)).toBe(false);
      seen.add(item.q);
    }
  });
});

describe("buildFaqJsonLd", () => {
  it("produces a valid schema.org FAQPage skeleton", () => {
    const ld = buildFaqJsonLd();
    expect(ld["@context"]).toBe("https://schema.org");
    expect(ld["@type"]).toBe("FAQPage");
    expect(ld.inLanguage).toBe("uk");
    expect(Array.isArray(ld.mainEntity)).toBe(true);
  });

  it("emits one Question per item with an accepted Answer", () => {
    const items: FaqItem[] = [
      { q: "Q1", a: "A1" },
      { q: "Q2", a: "A2" },
    ];
    const ld = buildFaqJsonLd(items);
    const entities = ld.mainEntity as Array<{
      "@type": string;
      name: string;
      acceptedAnswer: { "@type": string; text: string };
    }>;
    expect(entities).toHaveLength(2);
    expect(entities[0]?.["@type"]).toBe("Question");
    expect(entities[0]?.name).toBe("Q1");
    expect(entities[0]?.acceptedAnswer["@type"]).toBe("Answer");
    expect(entities[0]?.acceptedAnswer.text).toBe("A1");
    expect(entities[1]?.name).toBe("Q2");
  });

  it("serializes to valid JSON (no functions/undefined)", () => {
    const ld = buildFaqJsonLd();
    const serialized = JSON.stringify(ld);
    expect(() => JSON.parse(serialized)).not.toThrow();
    const reparsed = JSON.parse(serialized);
    expect(reparsed["@type"]).toBe("FAQPage");
    expect(reparsed.mainEntity).toHaveLength(FAQ_ITEMS.length);
  });
});
