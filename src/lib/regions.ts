/**
 * ISO-3166-1 alpha-2 country codes used by the `region: country:<iso2>` form
 * of the fact `region` field. Stored as a static map of code → Ukrainian
 * label + flag emoji; we deliberately don't import a giant country dataset.
 * Pick the ~50 most likely to appear in BACK_FUTURE content (NATO/EU + key
 * partners + neighbours + a few popular non-European countries). Extend as
 * the content set grows.
 *
 * Flag emoji are derived from the ISO code via Regional Indicator Symbols
 * (`getFlag`) — keeping the table tighter and impossible to typo.
 */

export interface RegionEntry {
  /** ISO-3166-1 alpha-2 code, lowercase. */
  code: string;
  /** Ukrainian-language country name (nominative case). */
  label: string;
}

const REGIONS_LIST: readonly RegionEntry[] = [
  { code: "ua", label: "Україна" },
  { code: "us", label: "США" },
  { code: "gb", label: "Велика Британія" },
  { code: "de", label: "Німеччина" },
  { code: "fr", label: "Франція" },
  { code: "it", label: "Італія" },
  { code: "es", label: "Іспанія" },
  { code: "pt", label: "Португалія" },
  { code: "nl", label: "Нідерланди" },
  { code: "be", label: "Бельгія" },
  { code: "lu", label: "Люксембург" },
  { code: "ch", label: "Швейцарія" },
  { code: "at", label: "Австрія" },
  { code: "ie", label: "Ірландія" },
  { code: "se", label: "Швеція" },
  { code: "no", label: "Норвегія" },
  { code: "fi", label: "Фінляндія" },
  { code: "dk", label: "Данія" },
  { code: "is", label: "Ісландія" },
  { code: "pl", label: "Польща" },
  { code: "cz", label: "Чехія" },
  { code: "sk", label: "Словаччина" },
  { code: "hu", label: "Угорщина" },
  { code: "ro", label: "Румунія" },
  { code: "bg", label: "Болгарія" },
  { code: "gr", label: "Греція" },
  { code: "hr", label: "Хорватія" },
  { code: "si", label: "Словенія" },
  { code: "rs", label: "Сербія" },
  { code: "ba", label: "Боснія і Герцеговина" },
  { code: "me", label: "Чорногорія" },
  { code: "mk", label: "Північна Македонія" },
  { code: "al", label: "Албанія" },
  { code: "ee", label: "Естонія" },
  { code: "lv", label: "Латвія" },
  { code: "lt", label: "Литва" },
  { code: "md", label: "Молдова" },
  { code: "ge", label: "Грузія" },
  { code: "tr", label: "Туреччина" },
  { code: "il", label: "Ізраїль" },
  { code: "jp", label: "Японія" },
  { code: "kr", label: "Південна Корея" },
  { code: "cn", label: "Китай" },
  { code: "in", label: "Індія" },
  { code: "ca", label: "Канада" },
  { code: "mx", label: "Мексика" },
  { code: "br", label: "Бразилія" },
  { code: "ar", label: "Аргентина" },
  { code: "au", label: "Австралія" },
  { code: "nz", label: "Нова Зеландія" },
  { code: "za", label: "ПАР" },
  { code: "eg", label: "Єгипет" },
] as const;

/**
 * Map of ISO-3166-1 alpha-2 code → display entry. Lookups expect a lowercase
 * 2-letter code (matching the `country:<iso2>` schema regex in
 * `content.config.ts`).
 */
export const REGIONS: ReadonlyMap<string, RegionEntry> = new Map(
  REGIONS_LIST.map((entry) => [entry.code, entry]),
);

const ISO2_RE = /^[a-z]{2}$/;

/**
 * Convert a 2-letter ISO code into the corresponding flag emoji using
 * Regional Indicator Symbols. Returns the canonical "white flag" U+1F3F3
 * for invalid input — so callers can render unconditionally without an extra
 * `if`.
 *
 * Examples: getFlag("cz") → "🇨🇿"; getFlag("UA") → "🇺🇦"; getFlag("zz") → "🇿🇿"
 * (still renders as a generic 2-letter flag); getFlag("xyz") → "🏳️" fallback.
 */
export function getFlag(code: string): string {
  const lower = code.toLowerCase();
  if (!ISO2_RE.test(lower)) return "\u{1F3F3}\u{FE0F}";
  const base = 0x1f1e6 - "a".charCodeAt(0);
  const cps = [...lower].map((ch) => base + ch.charCodeAt(0));
  return String.fromCodePoint(...cps);
}

/**
 * Look up the Ukrainian display name for an ISO-3166-1 alpha-2 code. Returns
 * `null` if the code is unknown — UI code should fall back to the code itself
 * in uppercase (e.g. for `xx` → `XX`) and validation code should warn.
 */
export function getRegionLabel(code: string): string | null {
  const lower = code.toLowerCase();
  return REGIONS.get(lower)?.label ?? null;
}

/**
 * Return `true` if the ISO-3166-1 alpha-2 code is recognised by REGIONS.
 * Callers can use this to gate fallback behaviour (e.g. validation warnings,
 * or hiding a country from a UI filter dropdown).
 */
export function isKnownRegionCode(code: string): boolean {
  return REGIONS.has(code.toLowerCase());
}

export type ParsedRegion =
  | { kind: "world" }
  | { kind: "ukraine" }
  | { kind: "country"; code: string };

/**
 * Parse a raw `region` frontmatter value (already validated by the Zod schema
 * in `content.config.ts`) into a discriminated union. The `country` variant
 * always normalises the code to lowercase so downstream code can compare
 * against `REGIONS` keys directly.
 *
 * For unknown / malformed input falls back to `{ kind: "world" }` — same
 * default as the legacy schema's `.optional()` (no region ⇒ "world"). The
 * Zod refinement is the source of truth for rejecting bad values at build
 * time; this helper is a runtime convenience for templates.
 */
export function parseRegion(value: string | undefined | null): ParsedRegion {
  if (!value) return { kind: "world" };
  if (value === "world") return { kind: "world" };
  if (value === "ukraine") return { kind: "ukraine" };
  const match = /^country:([a-z]{2})$/i.exec(value);
  if (match) return { kind: "country", code: match[1]!.toLowerCase() };
  return { kind: "world" };
}

/**
 * Inverse of `parseRegion`: build the canonical frontmatter string from a
 * parsed value. Useful when writing the value back into URL params or
 * serialising filter state.
 */
export function formatRegion(region: ParsedRegion): string {
  if (region.kind === "world") return "world";
  if (region.kind === "ukraine") return "ukraine";
  return `country:${region.code}`;
}

/**
 * Sorted list of known country regions. Sorted by Ukrainian label using
 * the `uk` locale so the dropdown reads in alphabetical order to a Ukrainian
 * visitor. `Україна` is excluded from this list — Ukraine has its own legacy
 * `ukraine` region (which is also the implicit value for facts before the
 * country-region schema landed), and surfacing it twice would be confusing.
 */
export const COUNTRY_REGIONS: readonly RegionEntry[] = REGIONS_LIST.filter(
  (entry) => entry.code !== "ua",
)
  .slice()
  .sort((a, b) => a.label.localeCompare(b.label, "uk"));
