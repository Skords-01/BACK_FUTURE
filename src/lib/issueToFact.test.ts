import { describe, expect, it } from "vitest";

import {
  cyrillicSlugify,
  factFilePath,
  parseIssueForm,
  renderFactMarkdown,
  validateRawIssue,
} from "./issueToFact";

describe("cyrillicSlugify", () => {
  it("returns empty string for empty input", () => {
    expect(cyrillicSlugify("")).toBe("");
  });

  it("transliterates a Ukrainian phrase to ASCII", () => {
    expect(cyrillicSlugify("Антиводень уперше втримали в пастці")).toBe(
      "antyvoden-upershe-vtrymaly-v-pasttsi",
    );
  });

  it("drops the Ukrainian apostrophe rather than turning it into a hyphen", () => {
    expect(cyrillicSlugify("П'ять років")).toBe("piat-rokiv");
    expect(cyrillicSlugify("П’ять років")).toBe("piat-rokiv");
  });

  it("collapses punctuation and whitespace to single hyphens", () => {
    expect(cyrillicSlugify("Голод 1932—1933: трагедія")).toBe("holod-1932-1933-trahediia");
  });

  it("keeps existing ASCII letters and digits", () => {
    expect(cyrillicSlugify("CERN-2010 antymateriia")).toBe("cern-2010-antymateriia");
  });

  it("strips leading and trailing hyphens", () => {
    expect(cyrillicSlugify("  Київ  ")).toBe("kyiv");
  });
});

describe("parseIssueForm", () => {
  const SAMPLE = [
    "### Заголовок (title)",
    "",
    "Антиводень уперше втримали в пастці",
    "",
    "### Предмет (subject)",
    "",
    "physics",
    "",
    "### Коротке резюме (short)",
    "",
    "У 2010 році експеримент ALPHA в CERN уперше втримав холодні атоми антиводню.",
    "",
    "### Рік події (yearOfEvent)",
    "",
    "2010",
    "",
    "### Для яких ер (relevantForEras)",
    "",
    "- [X] 1 — 1991–1998 (рання незалежність)",
    "- [ ] 2 — 1999–2005 (стабілізація)",
    "- [x] 3 — 2006–2013 (євроінтеграційний поворот)",
    "- [ ] 4 — 2014–2021 (після Майдану)",
    "- [ ] 5 — 2022–сьогодні (повномасштабна війна)",
    "",
    "### Регіон (region)",
    "",
    "world",
    "",
    "### Вплив (impact)",
    "",
    "high",
    "",
    "### Джерела (sources)",
    "",
    "- CERN: Antimatter atoms produced and trapped|https://home.cern/news/cern",
    "- [Nature 468](https://www.nature.com/articles/nature09610)",
    "",
    "### Тіло факту (body, markdown)",
    "",
    "_No response_",
    "",
    "### Теги (tags)",
    "",
    "антиматерія, CERN, частинки",
  ].join("\n");

  it("extracts all known fields keyed by trailing `(fieldId)`", () => {
    const raw = parseIssueForm(SAMPLE);
    expect(raw.title).toBe("Антиводень уперше втримали в пастці");
    expect(raw.subject).toBe("physics");
    expect(raw.short).toMatch(/ALPHA в CERN/);
    expect(raw.yearOfEvent).toBe("2010");
    expect(raw.relevantForEras).toEqual([1, 3]);
    expect(raw.region).toBe("world");
    expect(raw.impact).toBe("high");
    expect(raw.sources).toEqual([
      { title: "CERN: Antimatter atoms produced and trapped", url: "https://home.cern/news/cern" },
      { title: "Nature 468", url: "https://www.nature.com/articles/nature09610" },
    ]);
    expect(raw.body).toBe("");
    expect(raw.tags).toEqual(["антиматерія", "CERN", "частинки"]);
  });

  it("treats `_No response_` as an empty value (case-insensitive)", () => {
    const raw = parseIssueForm("### Тіло факту (body, markdown)\n\n_no response_\n");
    expect(raw.body).toBe("");
  });

  it("returns undefined for sections that aren't present at all", () => {
    const raw = parseIssueForm("### Заголовок (title)\n\nfoo\n");
    expect(raw.title).toBe("foo");
    expect(raw.body).toBeUndefined();
    expect(raw.tags).toBeUndefined();
  });

  it("normalises Windows-style line endings", () => {
    const raw = parseIssueForm("### Заголовок (title)\r\n\r\nfoo\r\n");
    expect(raw.title).toBe("foo");
  });
});

describe("validateRawIssue", () => {
  const validRaw = {
    title: "Антиводень уперше втримали в пастці",
    subject: "physics",
    short: "У 2010 році експеримент ALPHA в CERN уперше втримав холодні атоми антиводню.",
    yearOfEvent: "2010",
    relevantForEras: [1, 2, 3],
    region: "world",
    impact: "high",
    sources: [{ title: "CERN", url: "https://home.cern/news/cern" }],
    body: "контекст\n\nподія\n\nдеталі",
    tags: ["антиматерія"],
  };

  it("accepts a well-formed payload and coerces yearOfEvent to a number", () => {
    const result = validateRawIssue(validRaw);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.yearOfEvent).toBe(2010);
      expect(result.data.subject).toBe("physics");
    }
  });

  it("collects all errors for a missing-everything payload", () => {
    const result = validateRawIssue({});
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors).toEqual(
        expect.arrayContaining([
          "title is required",
          "subject is required",
          "short is required",
          "yearOfEvent is required",
        ]),
      );
    }
  });

  it("rejects a bad yearOfEvent (1980 — pre-1990)", () => {
    const result = validateRawIssue({ ...validRaw, yearOfEvent: "1980" });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((e) => e.includes("199x or 20xx"))).toBe(true);
    }
  });

  it("rejects an unknown subject", () => {
    const result = validateRawIssue({ ...validRaw, subject: "art" });
    expect(result.ok).toBe(false);
  });

  it("rejects a non-URL source", () => {
    const result = validateRawIssue({
      ...validRaw,
      sources: [{ title: "Bad", url: "not-a-url" }],
    });
    expect(result.ok).toBe(false);
  });

  it("rejects a too-short `short` value", () => {
    const result = validateRawIssue({ ...validRaw, short: "коротко" });
    expect(result.ok).toBe(false);
  });
});

describe("renderFactMarkdown", () => {
  const fact = {
    title: "Антиводень уперше втримали в пастці",
    subject: "physics" as const,
    short: "У 2010 році експеримент ALPHA в CERN уперше втримав холодні атоми антиводню.",
    yearOfEvent: 2010,
    relevantForEras: [1, 2, 3] as (1 | 2 | 3 | 4 | 5)[],
    region: "world" as const,
    impact: "high" as const,
    sources: [{ title: "CERN", url: "https://home.cern/news/cern" }],
    body: "контекст\n\nподія\n\nдеталі",
    tags: ["антиматерія", "CERN"],
  };

  it("produces a frontmatter block followed by the body", () => {
    const md = renderFactMarkdown(fact);
    expect(md).toMatch(/^---\n/);
    expect(md).toContain('title: "Антиводень уперше втримали в пастці"');
    expect(md).toContain('subject: "physics"');
    expect(md).toContain("yearOfEvent: 2010");
    expect(md).toContain("relevantForEras: [1, 2, 3]");
    expect(md).toContain('region: "world"');
    expect(md).toContain('impact: "high"');
    expect(md).toContain('  - title: "CERN"');
    expect(md).toContain('    url: "https://home.cern/news/cern"');
    expect(md).toContain('tags: ["антиматерія", "CERN"]');
    expect(md).toContain("draft: false");
    expect(md).toMatch(/---\n\nконтекст\n\nподія\n\nдеталі\n$/);
  });

  it("omits optional `region` / `impact` / `tags` when not present", () => {
    const md = renderFactMarkdown({ ...fact, region: undefined, impact: undefined, tags: [] });
    expect(md).not.toContain("region:");
    expect(md).not.toContain("impact:");
    expect(md).not.toContain("tags:");
  });

  it("inserts a TODO placeholder when body is empty", () => {
    const md = renderFactMarkdown({ ...fact, body: "" });
    expect(md).toMatch(/TODO \(review\)/);
  });

  it("escapes embedded double-quotes in YAML strings", () => {
    const md = renderFactMarkdown({ ...fact, title: 'foo "bar" baz' });
    expect(md).toContain('title: "foo \\"bar\\" baz"');
  });
});

describe("factFilePath", () => {
  it("places facts under content/facts/<subject>/<cyrillic-slug>.md", () => {
    const path = factFilePath({
      title: "Антиводень уперше втримали в пастці",
      subject: "physics",
      short: "...".repeat(10),
      yearOfEvent: 2010,
      relevantForEras: [1],
      sources: [{ title: "x", url: "https://x.com" }],
      body: "",
      tags: [],
    });
    expect(path).toBe("content/facts/physics/antyvoden-upershe-vtrymaly-v-pasttsi.md");
  });
});
