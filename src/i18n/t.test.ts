import { describe, expect, it } from "vitest";
import { getT, toLocale } from "./t";
import { DEFAULT_LOCALE, UI, type UIKey } from "./ui";

describe("toLocale", () => {
  it("returns default locale for empty / unknown input", () => {
    expect(toLocale(undefined)).toBe(DEFAULT_LOCALE);
    expect(toLocale(null)).toBe(DEFAULT_LOCALE);
    expect(toLocale("")).toBe(DEFAULT_LOCALE);
    expect(toLocale("ja-JP")).toBe(DEFAULT_LOCALE);
  });

  it("matches exact and prefix-tagged locales", () => {
    expect(toLocale("en")).toBe("en");
    expect(toLocale("EN")).toBe("en");
    expect(toLocale("en-US")).toBe("en");
    expect(toLocale("uk")).toBe("uk");
    expect(toLocale("uk-UA")).toBe("uk");
  });
});

describe("getT", () => {
  it("returns english string when EN locale and key exists", () => {
    const t = getT("en");
    expect(t("nav.home")).toBe("Home");
    expect(t("hero.cta.go")).toBe("GO");
  });

  it("returns ukrainian strings for default locale", () => {
    const t = getT("uk");
    expect(t("nav.home")).toBe("Головна");
    expect(t("hero.cta.go")).toBe("ПОЇХАЛИ");
  });

  it("falls back to ukrainian when EN dictionary is missing the key", () => {
    // Прокидаємо штучний пропуск у EN, не змінюючи реальний словник —
    // перевіряємо контракт fallback-механіки без хрупкої залежності від
    // конкретного ключа, який реально був би пропущений.
    const fakeKey = "test.fallback" as UIKey;
    const original = UI.en;
    // Реверс-індекс: симулюємо мутацію, але повертаємо в `finally`.
    try {
      (UI as Record<string, Record<string, string>>).uk[fakeKey] = "тест-укр-резерв";
      (UI as Record<string, Record<string, string>>).en[fakeKey] = "";
      // Спочатку перевіряємо звичайний шлях: ключ присутній у обох.
      expect(getT("en")("nav.home")).toBe("Home");
      // Тепер прибираємо EN-значення → fallback на UK.
      delete (UI as Record<string, Record<string, string>>).en[fakeKey];
      expect(getT("en")(fakeKey)).toBe("тест-укр-резерв");
    } finally {
      delete (UI as Record<string, Record<string, string>>).uk[fakeKey];
      // `Object.assign` тут не потрібен — ми лишали `UI.en` мутабельним.
      // Очищаємо те, що додавали.
      delete (UI as Record<string, Record<string, string>>).en[fakeKey];
      // Sanity-check: реальний словник лишається undisturbed.
      expect(UI.en).toBe(original);
    }
  });

  it("returns the key itself if it is missing in both dictionaries", () => {
    const ghostKey = "this.key.does.not.exist" as UIKey;
    expect(getT("en")(ghostKey)).toBe("this.key.does.not.exist");
    expect(getT("uk")(ghostKey)).toBe("this.key.does.not.exist");
  });

  it("treats unknown / undefined locale as default", () => {
    expect(getT("ja")("nav.home")).toBe("Головна");
    expect(getT(undefined)("nav.home")).toBe("Головна");
    expect(getT(null)("nav.home")).toBe("Головна");
  });

  it("EN dictionary covers every UK key (scaffold completeness)", () => {
    // Захист від додавання ключа лише в одну локаль. Якщо тест падає —
    // або додай переклад до EN, або поки лиши UK-значення (тоді цей
    // assertion треба явно пом'якшити з причиною в окремому PR).
    const ukKeys = Object.keys(UI.uk).sort();
    const enKeys = Object.keys(UI.en).sort();
    expect(enKeys).toEqual(ukKeys);
  });
});
