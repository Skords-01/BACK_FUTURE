/**
 * ICU-aware plural helpers via {@link Intl.PluralRules}.
 *
 * Replaces hand-rolled `n % 10 === 1 && n % 100 !== 11 ...` ladders scattered
 * across the codebase. The category selection is delegated to the CLDR plural
 * tables shipped with the JS engine, so adding a new locale only requires
 * supplying the appropriate forms — no rule logic to maintain.
 *
 * Locale argument is required for forward-compatibility with the upcoming
 * `/uk/` and `/en/` i18n routing (roadmap 9.1); defaults to `"uk"`.
 *
 * @example uk
 * ```ts
 * factsCount(1, "uk");  // "1 факт"
 * factsCount(2, "uk");  // "2 факти"
 * factsCount(5, "uk");  // "5 фактів"
 * factsCount(0, "uk");  // "жодного факту"
 * ```
 *
 * @example en
 * ```ts
 * factsCount(1, "en");  // "1 fact"
 * factsCount(2, "en");  // "2 facts"
 * factsCount(0, "en");  // "no facts"
 * ```
 *
 * @example richer markup via callbacks
 * ```ts
 * plural(5, "uk", {
 *   one: (n) => `<b>${n}</b> факт`,
 *   few: (n) => `<b>${n}</b> факти`,
 *   many: (n) => `<b>${n}</b> фактів`,
 *   other: (n) => `<b>${n}</b> фактів`,
 * });
 * // → "<b>5</b> фактів"
 * ```
 */

/** A plural form: either a literal string or a callback that returns a string. */
export type PluralForm = string | ((n: number) => string);

/**
 * Forms keyed by {@link Intl.LDMLPluralRule} category. `other` is mandatory
 * because CLDR guarantees it as the universal fallback; the rest are optional
 * and fall through to `other` when the locale doesn't use them.
 */
export type PluralForms = {
  zero?: PluralForm;
  one?: PluralForm;
  two?: PluralForm;
  few?: PluralForm;
  many?: PluralForm;
  other: PluralForm;
};

const pluralRulesCache = new Map<string, Intl.PluralRules>();

/**
 * Returns a memoized {@link Intl.PluralRules} for the given locale.
 * Constructing PluralRules is non-trivial; caching avoids re-parsing the same
 * locale tag on every call (called once per fact card on a busy year page).
 */
function getPluralRules(locale: string): Intl.PluralRules {
  let rules = pluralRulesCache.get(locale);
  if (!rules) {
    rules = new Intl.PluralRules(locale);
    pluralRulesCache.set(locale, rules);
  }
  return rules;
}

/**
 * Resolves the locale-correct plural form for `n` from a {@link PluralForms} map.
 *
 * - Falls back to `other` when the matched category isn't supplied.
 * - Handles negatives gracefully by selecting on `Math.abs(n)`; the original
 *   value is still passed to callback forms so they can render the sign.
 * - Floats pass through unchanged (CLDR selects `other` for them in most
 *   locales).
 *
 * @param n      The count to pluralize.
 * @param locale BCP 47 locale tag. Defaults to `"uk"`.
 * @param forms  Plural form map (at minimum `other`).
 */
export function plural(n: number, locale: string = "uk", forms: PluralForms): string {
  const rules = getPluralRules(locale);
  // CLDR plural categories for "uk" are sign-agnostic; Intl matches that for
  // negatives, but we normalize defensively so a custom locale tag can't sneak
  // a surprise through.
  const category = rules.select(Number.isFinite(n) ? Math.abs(n) : n);
  const form = forms[category] ?? forms.other;
  return typeof form === "function" ? form(n) : form;
}

/**
 * `factsCount(5, "uk")` → `"5 фактів"`. Includes the number in the result.
 *
 * `0` short-circuits to a natural-language form ("жодного факту" / "no facts")
 * because the literal "0 фактів" reads awkwardly in UI.
 */
export function factsCount(n: number, locale: string = "uk"): string {
  if (n === 0) {
    return locale.startsWith("en") ? "no facts" : "жодного факту";
  }
  if (locale.startsWith("en")) {
    return plural(n, "en", {
      one: `${n} fact`,
      other: `${n} facts`,
    });
  }
  return plural(n, "uk", {
    one: `${n} факт`,
    few: `${n} факти`,
    many: `${n} фактів`,
    other: `${n} фактів`,
  });
}

/**
 * `factsWord(5, "uk")` → `"фактів"`. Returns the noun form only — useful when
 * the number is rendered with separate styling (e.g. a giant counter):
 * `<strong>${n}</strong> ${factsWord(n)}`.
 */
export function factsWord(n: number, locale: string = "uk"): string {
  if (locale.startsWith("en")) {
    return plural(n, "en", { one: "fact", other: "facts" });
  }
  return plural(n, "uk", {
    one: "факт",
    few: "факти",
    many: "фактів",
    other: "фактів",
  });
}

/**
 * `updatesCount(5, "uk")` → `"оновлень"`. Returns the noun form only, so
 * callers can render the count with their own markup:
 * `${n} ${updatesCount(n)}`.
 */
export function updatesCount(n: number, locale: string = "uk"): string {
  if (locale.startsWith("en")) {
    return plural(n, "en", { one: "update", other: "updates" });
  }
  return plural(n, "uk", {
    one: "оновлення",
    few: "оновлення",
    many: "оновлень",
    other: "оновлень",
  });
}

/**
 * `yearsAgo(5, "uk")` → `"років тому"`. Returns the relative-time phrase
 * without the number, so callers can render the count separately.
 *
 * `0` resolves to a present-tense phrase ("цьогоріч" / "this year") to avoid
 * the awkward "0 років тому".
 */
export function yearsAgo(n: number, locale: string = "uk"): string {
  if (n === 0) {
    return locale.startsWith("en") ? "this year" : "цьогоріч";
  }
  if (locale.startsWith("en")) {
    return plural(n, "en", { one: "year ago", other: "years ago" });
  }
  return plural(n, "uk", {
    one: "рік тому",
    few: "роки тому",
    many: "років тому",
    other: "років тому",
  });
}

/**
 * `yearsWord(5, "uk")` → `"років"`. Returns the noun form of "year" only —
 * useful for "minus 5 / years passed" style displays where "тому" doesn't fit.
 */
export function yearsWord(n: number, locale: string = "uk"): string {
  if (locale.startsWith("en")) {
    return plural(n, "en", { one: "year", other: "years" });
  }
  return plural(n, "uk", {
    one: "рік",
    few: "роки",
    many: "років",
    other: "років",
  });
}

/**
 * `subjectsCount(3, "uk")` → `"предмети"`. Just the noun, like
 * {@link updatesCount}. Used in OG-image stats labels.
 */
export function subjectsCount(n: number, locale: string = "uk"): string {
  if (locale.startsWith("en")) {
    return plural(n, "en", { one: "subject", other: "subjects" });
  }
  return plural(n, "uk", {
    one: "предмет",
    few: "предмети",
    many: "предметів",
    other: "предметів",
  });
}
