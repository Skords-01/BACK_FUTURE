import { describe, expect, it } from "vitest";
import {
  COUNTRY_REGIONS,
  REGIONS,
  formatRegion,
  getFlag,
  getRegionLabel,
  isKnownRegionCode,
  parseRegion,
} from "./regions";

describe("parseRegion", () => {
  it("treats undefined / empty as world (legacy default)", () => {
    expect(parseRegion(undefined)).toEqual({ kind: "world" });
    expect(parseRegion(null)).toEqual({ kind: "world" });
    expect(parseRegion("")).toEqual({ kind: "world" });
  });

  it("parses the legacy literals", () => {
    expect(parseRegion("world")).toEqual({ kind: "world" });
    expect(parseRegion("ukraine")).toEqual({ kind: "ukraine" });
  });

  it("parses country:<iso2> and lowercases the code", () => {
    expect(parseRegion("country:cz")).toEqual({ kind: "country", code: "cz" });
    expect(parseRegion("country:DE")).toEqual({ kind: "country", code: "de" });
  });

  it("falls back to world for malformed input", () => {
    expect(parseRegion("country:")).toEqual({ kind: "world" });
    expect(parseRegion("country:abc")).toEqual({ kind: "world" });
    expect(parseRegion("country:1u")).toEqual({ kind: "world" });
    expect(parseRegion("nonsense")).toEqual({ kind: "world" });
  });
});

describe("formatRegion", () => {
  it("round-trips through parseRegion", () => {
    expect(formatRegion(parseRegion("world"))).toBe("world");
    expect(formatRegion(parseRegion("ukraine"))).toBe("ukraine");
    expect(formatRegion(parseRegion("country:pl"))).toBe("country:pl");
  });

  it("formats a country region from a parsed object", () => {
    expect(formatRegion({ kind: "country", code: "fr" })).toBe("country:fr");
  });
});

describe("getRegionLabel", () => {
  it("returns the Ukrainian label for a known code", () => {
    expect(getRegionLabel("cz")).toBe("Чехія");
    expect(getRegionLabel("pl")).toBe("Польща");
    expect(getRegionLabel("ua")).toBe("Україна");
  });

  it("is case-insensitive on the input code", () => {
    expect(getRegionLabel("CZ")).toBe("Чехія");
    expect(getRegionLabel("Pl")).toBe("Польща");
  });

  it("returns null for an unknown code", () => {
    expect(getRegionLabel("zz")).toBeNull();
    expect(getRegionLabel("xx")).toBeNull();
  });
});

describe("getFlag", () => {
  it("returns the right regional indicator symbol pair for a known code", () => {
    // 0x1F1E8 = REGIONAL INDICATOR SYMBOL LETTER C
    // 0x1F1FF = REGIONAL INDICATOR SYMBOL LETTER Z
    expect(getFlag("cz")).toBe("\u{1F1E8}\u{1F1FF}");
    expect(getFlag("ua")).toBe("\u{1F1FA}\u{1F1E6}");
  });

  it("is case-insensitive", () => {
    expect(getFlag("CZ")).toBe(getFlag("cz"));
  });

  it("returns the generic white flag for malformed input", () => {
    expect(getFlag("")).toBe("\u{1F3F3}\u{FE0F}");
    expect(getFlag("xyz")).toBe("\u{1F3F3}\u{FE0F}");
    expect(getFlag("1u")).toBe("\u{1F3F3}\u{FE0F}");
  });

  it("derives a flag glyph even for unknown 2-letter codes", () => {
    // 0x1F1FF = Z, 0x1F1FF = Z → still a valid (if unmapped) sequence
    expect(getFlag("zz")).toBe("\u{1F1FF}\u{1F1FF}");
  });
});

describe("isKnownRegionCode", () => {
  it("returns true for codes in REGIONS", () => {
    expect(isKnownRegionCode("cz")).toBe(true);
    expect(isKnownRegionCode("US")).toBe(true);
  });

  it("returns false for unknown codes", () => {
    expect(isKnownRegionCode("zz")).toBe(false);
    expect(isKnownRegionCode("xx")).toBe(false);
  });
});

describe("REGIONS map", () => {
  it("contains the expected core countries", () => {
    for (const code of ["ua", "us", "gb", "de", "fr", "cz", "pl"]) {
      expect(REGIONS.has(code)).toBe(true);
    }
  });

  it("only contains lowercase 2-letter codes", () => {
    for (const code of REGIONS.keys()) {
      expect(code).toMatch(/^[a-z]{2}$/);
    }
  });
});

describe("COUNTRY_REGIONS (dropdown list)", () => {
  it("excludes Ukraine (Україна has its own legacy region)", () => {
    expect(COUNTRY_REGIONS.find((c) => c.code === "ua")).toBeUndefined();
  });

  it("is sorted by Ukrainian label", () => {
    const labels = COUNTRY_REGIONS.map((c) => c.label);
    const sorted = labels.slice().sort((a, b) => a.localeCompare(b, "uk"));
    expect(labels).toEqual(sorted);
  });
});
