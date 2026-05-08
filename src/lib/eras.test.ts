import { describe, expect, it } from "vitest";
import { ERAS, eraById, eraForGraduationYear, eraOf } from "./eras";

describe("ERAS data", () => {
  it("contains exactly five eras with monotonically increasing ranges", () => {
    expect(ERAS).toHaveLength(5);
    for (let i = 0; i < ERAS.length - 1; i++) {
      const current = ERAS[i]!;
      const next = ERAS[i + 1]!;
      expect(current.yearEnd).toBeLessThan(next.yearStart);
    }
  });

  it("uses ids 1..5", () => {
    expect(ERAS.map((e) => e.id)).toEqual([1, 2, 3, 4, 5]);
  });
});

describe("eraForGraduationYear", () => {
  it("maps yearStart to its own era", () => {
    expect(eraForGraduationYear(1991)).toBe(1);
    expect(eraForGraduationYear(1996)).toBe(2);
    expect(eraForGraduationYear(2004)).toBe(3);
    expect(eraForGraduationYear(2011)).toBe(4);
    expect(eraForGraduationYear(2018)).toBe(5);
  });

  it("maps yearEnd to its own era", () => {
    expect(eraForGraduationYear(1995)).toBe(1);
    expect(eraForGraduationYear(2003)).toBe(2);
    expect(eraForGraduationYear(2010)).toBe(3);
    expect(eraForGraduationYear(2017)).toBe(4);
  });

  it("maps mid-range years correctly", () => {
    expect(eraForGraduationYear(1993)).toBe(1);
    expect(eraForGraduationYear(2000)).toBe(2);
    expect(eraForGraduationYear(2007)).toBe(3);
    expect(eraForGraduationYear(2015)).toBe(4);
    expect(eraForGraduationYear(2025)).toBe(5);
  });

  it("falls back to the latest era for years beyond the last range", () => {
    expect(eraForGraduationYear(2200)).toBe(5);
  });

  it("falls back to the latest era for years before the first range", () => {
    // Defensive: input outside the supported window. We don't try to be smart,
    // we just return the most recent era id (current behavior).
    expect(eraForGraduationYear(1980)).toBe(5);
  });
});

describe("eraById", () => {
  it("returns the matching era object for each id", () => {
    for (const era of ERAS) {
      const found = eraById(era.id);
      expect(found).toBe(era);
    }
  });

  it("throws for an unknown id", () => {
    // @ts-expect-error — testing runtime guard with an out-of-domain value.
    expect(() => eraById(99)).toThrow(/Unknown era id/);
  });
});

describe("Era extended fields", () => {
  it("every era has a name, short, color, and tone", () => {
    for (const era of ERAS) {
      expect(era.name).toBeTruthy();
      expect(era.short).toBeTruthy();
      expect(era.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(era.tone).toBeTruthy();
    }
  });

  it("era colors are unique", () => {
    const colors = ERAS.map((e) => e.color);
    expect(new Set(colors).size).toBe(5);
  });
});

describe("eraOf", () => {
  it("returns the full Era object including name and color", () => {
    const era = eraOf(2012);
    expect(era.id).toBe(4);
    expect(era.name).toBeTruthy();
    expect(era.color).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it("is consistent with eraForGraduationYear", () => {
    for (const year of [1991, 1999, 2003, 2010, 2017, 2022]) {
      expect(eraOf(year).id).toBe(eraForGraduationYear(year));
    }
  });
});
