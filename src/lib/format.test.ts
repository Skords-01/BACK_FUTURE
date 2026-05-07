import { describe, expect, it } from "vitest";

import { formatUkDate, formatUkShortDate, isoDate } from "./format";

describe("formatUkDate", () => {
  it("renders Ukrainian long date with named month", () => {
    const result = formatUkDate(new Date(Date.UTC(2024, 2, 15)));
    expect(result).toMatch(/15/);
    expect(result).toMatch(/березн/);
    expect(result).toMatch(/2024/);
  });
});

describe("formatUkShortDate", () => {
  it("renders DD.MM.YYYY", () => {
    expect(formatUkShortDate(new Date(Date.UTC(2024, 2, 15)))).toBe("15.03.2024");
  });

  it("zero-pads single-digit days and months", () => {
    expect(formatUkShortDate(new Date(Date.UTC(2024, 0, 5)))).toBe("05.01.2024");
  });
});

describe("isoDate", () => {
  it("returns YYYY-MM-DD in UTC", () => {
    expect(isoDate(new Date("2024-03-15T12:34:56Z"))).toBe("2024-03-15");
  });

  it("zero-pads month and day", () => {
    expect(isoDate(new Date("2024-01-05T00:00:00Z"))).toBe("2024-01-05");
  });
});
