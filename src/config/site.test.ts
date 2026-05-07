import { describe, expect, it } from "vitest";
import { SITE, SUBJECTS } from "./site";

describe("SUBJECTS", () => {
  it("has a Ukrainian abbreviation `mark` for every subject", () => {
    for (const s of SUBJECTS) {
      expect(s.mark, `subject ${s.id} is missing a mark`).toBeTruthy();
      // Marks are exactly 3 Ukrainian uppercase letters in the mockup.
      expect(s.mark, `subject ${s.id} mark must be 3 chars`).toHaveLength(3);
      expect(/^[А-ЯҐЄІЇ]{3}$/.test(s.mark)).toBe(true);
    }
  });

  it("has globally unique marks", () => {
    const marks = SUBJECTS.map((s) => s.mark);
    expect(new Set(marks).size).toBe(marks.length);
  });

  it("contains the eleven subjects required by the mockup", () => {
    const expected = ["АСТ", "БІО", "ГЕО", "ІСТ", "ФІЗ", "ТЕХ", "МЕД", "ЕКН", "КУЛ", "СПР", "ЕКЛ"];
    for (const mark of expected) {
      expect(SUBJECTS.some((s) => s.mark === mark)).toBe(true);
    }
  });
});

describe("SITE", () => {
  it("covers the timeline range used by the new <Timeline> component", () => {
    expect(SITE.yearMin).toBeLessThanOrEqual(1991);
    expect(SITE.yearMax).toBeGreaterThanOrEqual(SITE.yearMin);
  });
});
