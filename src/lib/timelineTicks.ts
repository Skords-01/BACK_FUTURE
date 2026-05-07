/**
 * Helpers for `<Timeline>` axis ticks.
 *
 * Винесено з компоненту, бо логіка «що показуємо як major» уже не вкладається в
 * один inline-вираз: треба й 5-річні позначки, і обов'язкові кінці шкали, і не
 * зливати їхні підписи коли yearMax (2026) приходиться на не-кратний 5 рік.
 */

export interface TickPlan {
  /** Years that get a long major tick (label rendering is decided separately). */
  ticks: readonly number[];
  /** Subset of `ticks` whose label should actually render. */
  labeled: ReadonlySet<number>;
}

/**
 * Build the major-tick plan for a year range.
 *
 * Major ticks are placed at the endpoints (yearMin, yearMax) and at every
 * 5-year multiple in between. Labels are hidden when a 5-year mark sits within
 * `gapYears` of an endpoint, so we don't get the "2025026" collision when the
 * timeline ends at 2026 (one year past the 2025 mark).
 */
export function planMajorTicks(yearMin: number, yearMax: number, gapYears = 2): TickPlan {
  if (yearMax < yearMin) {
    return { ticks: [], labeled: new Set() };
  }
  const ticks: number[] = [];
  for (let y = yearMin; y <= yearMax; y++) {
    if (y === yearMin || y === yearMax || y % 5 === 0) ticks.push(y);
  }
  const labeled = new Set<number>([yearMin, yearMax]);
  for (const y of ticks) {
    if (y === yearMin || y === yearMax) continue;
    if (y - yearMin < gapYears) continue;
    if (yearMax - y < gapYears) continue;
    labeled.add(y);
  }
  return { ticks, labeled };
}
