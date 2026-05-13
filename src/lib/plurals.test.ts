import { describe, expect, it } from "vitest";

import {
  factsCount,
  factsWord,
  plural,
  subjectsCount,
  updatesCount,
  yearsAgo,
  yearsWord,
} from "./plurals";

describe("plural (uk)", () => {
  const ukForms = {
    one: "факт",
    few: "факти",
    many: "фактів",
    other: "фактів",
  };

  it.each([
    [1, "факт"],
    [21, "факт"],
    [31, "факт"],
    [101, "факт"],
    [1001, "факт"],
  ])("selects 'one' for %d", (n, expected) => {
    expect(plural(n, "uk", ukForms)).toBe(expected);
  });

  it.each([
    [2, "факти"],
    [3, "факти"],
    [4, "факти"],
    [22, "факти"],
    [23, "факти"],
    [24, "факти"],
    [102, "факти"],
    [1003, "факти"],
  ])("selects 'few' for %d", (n, expected) => {
    expect(plural(n, "uk", ukForms)).toBe(expected);
  });

  it.each([
    [0, "фактів"],
    [5, "фактів"],
    [6, "фактів"],
    [10, "фактів"],
    [11, "фактів"], // teen exception: 11/12/13/14 → many
    [12, "фактів"],
    [13, "фактів"],
    [14, "фактів"],
    [15, "фактів"],
    [20, "фактів"],
    [25, "фактів"],
    [100, "фактів"],
    [111, "фактів"],
    [1000, "фактів"],
  ])("selects 'many' for %d", (n, expected) => {
    expect(plural(n, "uk", ukForms)).toBe(expected);
  });

  it("defaults locale to 'uk'", () => {
    expect(plural(5, undefined, ukForms)).toBe("фактів");
  });
});

describe("plural (en)", () => {
  const enForms = {
    one: "fact",
    other: "facts",
  };

  it("selects 'one' for 1", () => {
    expect(plural(1, "en", enForms)).toBe("fact");
  });

  it.each([
    [0, "facts"],
    [2, "facts"],
    [21, "facts"], // 'other' in en
    [100, "facts"],
  ])("selects 'other' for %d", (n, expected) => {
    expect(plural(n, "en", enForms)).toBe(expected);
  });

  it("falls back to 'other' when a needed form is missing", () => {
    // en has only 'one' and 'other'; supplying just 'other' must still work
    // for n=1 because the helper falls through.
    expect(plural(1, "en", { other: "facts" })).toBe("facts");
  });
});

describe("plural callbacks (richer markup)", () => {
  it("invokes the callback form with the original n", () => {
    const result = plural(5, "uk", {
      one: (n) => `<b>${n}</b> факт`,
      few: (n) => `<b>${n}</b> факти`,
      many: (n) => `<b>${n}</b> фактів`,
      other: (n) => `<b>${n}</b> фактів`,
    });
    expect(result).toBe("<b>5</b> фактів");
  });

  it("preserves the original sign on negatives even though category uses |n|", () => {
    const result = plural(-3, "uk", {
      one: "факт",
      few: (n) => `${n} факти`, // n stays -3
      many: "фактів",
      other: "фактів",
    });
    expect(result).toBe("-3 факти");
  });
});

describe("plural edge cases", () => {
  it("handles negative numbers (selects by absolute value in uk)", () => {
    const forms = { one: "факт", few: "факти", many: "фактів", other: "фактів" };
    expect(plural(-1, "uk", forms)).toBe("факт");
    expect(plural(-3, "uk", forms)).toBe("факти");
    expect(plural(-5, "uk", forms)).toBe("фактів");
    expect(plural(-11, "uk", forms)).toBe("фактів");
  });

  it("handles floats (CLDR selects 'other' for fractions in uk)", () => {
    const forms = { one: "факт", few: "факти", many: "фактів", other: "FRACTION" };
    expect(plural(1.5, "uk", forms)).toBe("FRACTION");
  });

  it("falls back to 'other' when matched category is undefined", () => {
    expect(plural(2, "uk", { other: "always" })).toBe("always");
  });

  it("caches Intl.PluralRules per locale (different locales produce different results)", () => {
    // Calling repeatedly should be consistent; this also exercises the cache
    // path on the second call.
    const enForms = { one: "fact", other: "facts" };
    const ukForms = { one: "факт", few: "факти", many: "фактів", other: "фактів" };
    expect(plural(2, "en", enForms)).toBe("facts");
    expect(plural(2, "en", enForms)).toBe("facts"); // cached
    expect(plural(2, "uk", ukForms)).toBe("факти");
    expect(plural(2, "uk", ukForms)).toBe("факти"); // cached
  });
});

describe("factsCount", () => {
  it.each([
    [1, "1 факт"],
    [2, "2 факти"],
    [3, "3 факти"],
    [4, "4 факти"],
    [5, "5 фактів"],
    [11, "11 фактів"],
    [21, "21 факт"],
    [22, "22 факти"],
    [25, "25 фактів"],
    [101, "101 факт"],
    [1000, "1000 фактів"],
  ])("uk: %d → %s", (n, expected) => {
    expect(factsCount(n, "uk")).toBe(expected);
  });

  it.each([
    [1, "1 fact"],
    [2, "2 facts"],
    [21, "21 facts"],
    [100, "100 facts"],
  ])("en: %d → %s", (n, expected) => {
    expect(factsCount(n, "en")).toBe(expected);
  });

  it("handles 0 with a natural-language phrase per locale", () => {
    expect(factsCount(0, "uk")).toBe("жодного факту");
    expect(factsCount(0, "en")).toBe("no facts");
  });

  it("defaults locale to 'uk'", () => {
    expect(factsCount(5)).toBe("5 фактів");
  });
});

describe("factsWord", () => {
  it.each([
    [1, "факт"],
    [2, "факти"],
    [5, "фактів"],
    [11, "фактів"],
    [21, "факт"],
  ])("uk: %d → %s", (n, expected) => {
    expect(factsWord(n, "uk")).toBe(expected);
  });

  it.each([
    [1, "fact"],
    [2, "facts"],
    [0, "facts"],
  ])("en: %d → %s", (n, expected) => {
    expect(factsWord(n, "en")).toBe(expected);
  });
});

describe("updatesCount", () => {
  it.each([
    [1, "оновлення"],
    [2, "оновлення"],
    [3, "оновлення"],
    [4, "оновлення"],
    [5, "оновлень"],
    [11, "оновлень"],
    [21, "оновлення"],
  ])("uk: %d → %s", (n, expected) => {
    expect(updatesCount(n, "uk")).toBe(expected);
  });

  it.each([
    [1, "update"],
    [2, "updates"],
    [0, "updates"],
  ])("en: %d → %s", (n, expected) => {
    expect(updatesCount(n, "en")).toBe(expected);
  });
});

describe("yearsAgo", () => {
  it.each([
    [1, "рік тому"],
    [2, "роки тому"],
    [3, "роки тому"],
    [5, "років тому"],
    [11, "років тому"],
    [21, "рік тому"],
    [25, "років тому"],
  ])("uk: %d → %s", (n, expected) => {
    expect(yearsAgo(n, "uk")).toBe(expected);
  });

  it.each([
    [1, "year ago"],
    [2, "years ago"],
    [21, "years ago"],
  ])("en: %d → %s", (n, expected) => {
    expect(yearsAgo(n, "en")).toBe(expected);
  });

  it("0 → present-tense phrase", () => {
    expect(yearsAgo(0, "uk")).toBe("цьогоріч");
    expect(yearsAgo(0, "en")).toBe("this year");
  });
});

describe("yearsWord", () => {
  it.each([
    [1, "рік"],
    [2, "роки"],
    [3, "роки"],
    [4, "роки"],
    [5, "років"],
    [11, "років"],
    [21, "рік"],
  ])("uk: %d → %s", (n, expected) => {
    expect(yearsWord(n, "uk")).toBe(expected);
  });

  it.each([
    [1, "year"],
    [2, "years"],
  ])("en: %d → %s", (n, expected) => {
    expect(yearsWord(n, "en")).toBe(expected);
  });
});

describe("subjectsCount", () => {
  it.each([
    [1, "предмет"],
    [2, "предмети"],
    [5, "предметів"],
    [11, "предметів"],
    [21, "предмет"],
  ])("uk: %d → %s", (n, expected) => {
    expect(subjectsCount(n, "uk")).toBe(expected);
  });

  it("en: 1 → subject, 5 → subjects", () => {
    expect(subjectsCount(1, "en")).toBe("subject");
    expect(subjectsCount(5, "en")).toBe("subjects");
  });
});
