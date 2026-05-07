import type { SubjectId } from "../config/site";

/**
 * SVG inner markup (paths/circles/ellipses) for each of the 11 subject icons.
 *
 * Wrapped at render time by `<SubjectIcon>` into an `<svg viewBox="0 0 24 24"
 * fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round"
 * stroke-linejoin="round">` element. Each glyph uses `currentColor` so it
 * inherits the surrounding text colour (accent у пігулках, ink у списках).
 *
 * Зберігаємо рядки замість JSX, щоб реєстр можна було юніт-тестувати без
 * Astro runtime — а заодно простіше форкнути проєкт під інший набір
 * предметів: міняєш `SUBJECTS` у site.ts і ось цей файл.
 */
export const SUBJECT_ICON_PATHS: Readonly<Record<SubjectId, string>> = {
  // Saturn-like planet with a tilted ring.
  astronomy: `
    <ellipse cx="12" cy="12" rx="9.2" ry="3.2" transform="rotate(-22 12 12)" />
    <circle cx="12" cy="12" r="3.6" fill="currentColor" stroke="none" />
  `,
  // DNA double helix: two crossing curves with rungs between.
  biology: `
    <path d="M7 3c0 4 10 5 10 9s-10 5-10 9" />
    <path d="M17 3c0 4-10 5-10 9s10 5 10 9" />
    <path d="M8.5 7h7" />
    <path d="M9.5 12h5" />
    <path d="M8.5 17h7" />
  `,
  // Globe with equator and a meridian arc.
  geography: `
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18" />
    <path d="M12 3a13 13 0 010 18" />
    <path d="M12 3a13 13 0 000 18" />
  `,
  // Rolled scroll.
  history: `
    <path d="M19 21H8a3 3 0 01-3-3V6a3 3 0 013-3h11" />
    <path d="M5 18a3 3 0 013-3h11v6" />
    <path d="M9 7h6" />
    <path d="M9 11h4" />
  `,
  // Atom: nucleus + 3 orbital ellipses at 0°/60°/120°.
  physics: `
    <circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none" />
    <ellipse cx="12" cy="12" rx="9" ry="3.5" />
    <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(60 12 12)" />
    <ellipse cx="12" cy="12" rx="9" ry="3.5" transform="rotate(-60 12 12)" />
  `,
  // Microchip with leg pins on all four sides + inner core.
  tech: `
    <rect x="6" y="6" width="12" height="12" rx="1.5" />
    <rect x="9" y="9" width="6" height="6" rx="0.5" />
    <path d="M9 6V3M12 6V3M15 6V3" />
    <path d="M9 21v-3M12 21v-3M15 21v-3" />
    <path d="M6 9H3M6 12H3M6 15H3" />
    <path d="M21 9h-3M21 12h-3M21 15h-3" />
  `,
  // Heart-rate trace with a small uptick.
  medicine: `
    <path d="M3 12h4l2-5 4 10 2-5h6" />
  `,
  // Bar chart: three rising bars on a baseline.
  economy: `
    <path d="M3 21h18" />
    <rect x="5" y="14" width="3" height="6" />
    <rect x="10.5" y="9" width="3" height="11" />
    <rect x="16" y="4" width="3" height="16" />
  `,
  // Open book / spread codex.
  culture: `
    <path d="M4 6a2 2 0 012-2h6v15H6a2 2 0 01-2-2V6z" />
    <path d="M20 6a2 2 0 00-2-2h-6v15h6a2 2 0 002-2V6z" />
    <path d="M12 4v15" />
    <path d="M7 8h3M7 11h3M14 8h3M14 11h3" />
  `,
  // Trophy with handles, base and stem.
  sport: `
    <path d="M8 4h8v5a4 4 0 11-8 0V4z" />
    <path d="M8 6H5a2 2 0 002 4" />
    <path d="M16 6h3a2 2 0 01-2 4" />
    <path d="M12 13v3" />
    <path d="M9 20h6" />
    <path d="M10 16h4" />
  `,
  // Leaf: round outer profile with central vein.
  ecology: `
    <path d="M11 20A8 8 0 0119 12V4h-8a8 8 0 00-8 8v8h8z" />
    <path d="M11 20l8-8" />
  `,
};

export function subjectIconPaths(subject: SubjectId): string {
  return SUBJECT_ICON_PATHS[subject];
}
