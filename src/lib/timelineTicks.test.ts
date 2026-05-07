import { describe, expect, it } from "vitest";
import { planMajorTicks } from "./timelineTicks";

describe("planMajorTicks", () => {
  it("places ticks at endpoints and every 5y multiple", () => {
    const { ticks } = planMajorTicks(1991, 2026);
    expect(ticks).toEqual([1991, 1995, 2000, 2005, 2010, 2015, 2020, 2025, 2026]);
  });

  it("hides the 5y label that collides with yearMax (2025 next to 2026)", () => {
    const { labeled } = planMajorTicks(1991, 2026);
    expect(labeled.has(2026)).toBe(true);
    expect(labeled.has(2025)).toBe(false);
    expect(labeled.has(1991)).toBe(true);
    // 1995 is 4 years away from 1991, well outside the gap.
    expect(labeled.has(1995)).toBe(true);
  });

  it("hides the 5y label that collides with yearMin (1992 → 1995 stays, 1991 endpoint)", () => {
    // yearMin=1992 puts 1995 only 3 years away — outside default gap=2, label kept.
    const { labeled } = planMajorTicks(1992, 2026);
    expect(labeled.has(1995)).toBe(true);
  });

  it("respects a custom gap", () => {
    const { labeled } = planMajorTicks(1991, 2026, 5);
    // gap=5 → 1995 (4 away from 1991) and 2025 (1 away from 2026) both hidden.
    expect(labeled.has(1995)).toBe(false);
    expect(labeled.has(2025)).toBe(false);
    expect(labeled.has(2000)).toBe(true);
    expect(labeled.has(2020)).toBe(true);
  });

  it("always labels the endpoints, even when range is tiny", () => {
    const { ticks, labeled } = planMajorTicks(2024, 2026);
    expect(ticks).toEqual([2024, 2025, 2026]);
    // Endpoints are always labeled; 2025 is within gap=2 of both, so unlabeled.
    expect([...labeled].sort()).toEqual([2024, 2026]);
  });

  it("returns empty plan for inverted ranges", () => {
    const { ticks, labeled } = planMajorTicks(2026, 1991);
    expect(ticks).toEqual([]);
    expect(labeled.size).toBe(0);
  });

  it("collapses to one tick for a single-year range", () => {
    const { ticks, labeled } = planMajorTicks(2000, 2000);
    expect(ticks).toEqual([2000]);
    expect([...labeled]).toEqual([2000]);
  });
});
