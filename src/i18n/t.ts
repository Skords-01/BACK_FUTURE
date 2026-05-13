// Тонкий i18n-хелпер: повертає функцію перекладу `(key) => string` з
// fallback на `uk` для пропущених ключів і невідомих локалей. Не вживає
// зовнішніх залежностей — увесь словник статичний і знається на компіляції.
//
// Чому fallback на uk, а не на сам ключ: у скаффолді ми поступово заповнюємо
// `en` — частково. Якщо ключ ще не перекладено, ми все одно отримуємо
// читабельний український рядок, а не `nav.home`. Це навмисний tradeoff:
// краще «м'який змішаний UI», аніж голі debug-рядки на проді.

import { DEFAULT_LOCALE, LOCALES, UI, type Locale, type UIKey } from "./ui";

export type TFn = (key: UIKey) => string;

/** Звужує довільний рядок до `Locale`, повертаючи `DEFAULT_LOCALE` для невідомих. */
export function toLocale(value: string | undefined | null): Locale {
  if (!value) return DEFAULT_LOCALE;
  const lower = value.toLowerCase();
  for (const locale of LOCALES) {
    if (lower === locale || lower.startsWith(`${locale}-`)) return locale;
  }
  return DEFAULT_LOCALE;
}

/**
 * Створює функцію перекладу для конкретної локалі.
 *
 * - Невідома локаль → еквівалент `getT('uk')`.
 * - Пропущений ключ → значення з `uk` (fallback).
 * - Пропущений ключ і в `uk` (теоретично — недосяжно завдяки `UIKey`),
 *   повертає сам ключ як останню межу безпеки.
 */
export function getT(locale: Locale | string | undefined | null): TFn {
  const resolved = toLocale(locale ?? DEFAULT_LOCALE);
  const dict = UI[resolved];
  const fallback = UI[DEFAULT_LOCALE];
  return (key) => dict[key] ?? fallback[key] ?? key;
}
