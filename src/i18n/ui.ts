// Мінімальний словник UI-рядків для двох локалей (roadmap 9.1).
// Скаффолд — лише ключові навігаційні / hero / footer-рядки. Повний переклад
// UI заплановано як окрему фазу 9.3; контент-факти не локалізуються тут.
//
// Конвенція ключів: `domain.subkey` — `nav.home`, `hero.cta`, `footer.copy`.
// Додавай нові ключі парами (uk + en) одночасно — `typecheck` падатиме,
// якщо `en` не покриває весь `uk`.

export const DEFAULT_LOCALE = "uk" as const;
export const LOCALES = ["uk", "en"] as const;
export type Locale = (typeof LOCALES)[number];

export const LOCALE_LABELS: Record<Locale, string> = {
  uk: "UA",
  en: "EN",
};

// Розгорнуті назви для aria-label-ів language switcher-а.
export const LOCALE_FULL_LABELS: Record<Locale, string> = {
  uk: "Українська",
  en: "English",
};

// BCP-47-сумісні теги для `<html lang>` і `og:locale`.
export const LOCALE_HTML_LANG: Record<Locale, string> = {
  uk: "uk",
  en: "en",
};

export const LOCALE_OG_LOCALE: Record<Locale, string> = {
  uk: "uk_UA",
  en: "en_US",
};

// Українська — джерело правди (`getT` падає назад на UK при missing key).
export const UI = {
  uk: {
    "nav.home": "Головна",
    "nav.timeline": "Хронологія",
    "nav.all": "Усі факти",
    "nav.quiz": "Квіз",
    "nav.metodologia": "Методологія",
    "nav.about": "Про проєкт",

    "lang.switch": "Мова",
    "lang.uk": "Українська",
    "lang.en": "English",

    "footer.nav": "Навігація",
    "footer.about_section": "Про сайт",
    "footer.made_in_ua": "Зроблено в Україні",
    "footer.part_of": "частина",

    "hero.cta.go": "ПОЇХАЛИ",
    "hero.year_label": "Рік випуску",

    "site.tagline": "Що ти пропустив після випускного",
    "site.skip_link": "Перейти до контенту",

    "page.about.title": "Про проєкт",
    "page.metodologia.title": "Методологія",
    "page.quiz.title": "Квіз: вгадай рік",
    "page.timeline.title": "Хронологія",
    "page.year.title_prefix": "Випуск",
    "page.404.title": "404 — нічого тут немає",
    "page.404.heading": "Тут поки нічого немає.",
    "page.404.body":
      "Можливо, посилання застаріле, або ти набрав адресу руками. Спробуй з року випуску — це головний шлях.",
    "page.404.back_home": "На головну",
    "page.404.popular": "Або вибери популярний рік",

    "scaffold.banner.title": "English UI is a scaffold",
    "scaffold.banner.body":
      "Інтерфейс має базовий каркас англійською; самі факти лишаються українською до окремої фази перекладу (roadmap 9.3).",
  },
  en: {
    "nav.home": "Home",
    "nav.timeline": "Timeline",
    "nav.all": "All facts",
    "nav.quiz": "Quiz",
    "nav.metodologia": "Methodology",
    "nav.about": "About",

    "lang.switch": "Language",
    "lang.uk": "Українська",
    "lang.en": "English",

    "footer.nav": "Navigation",
    "footer.about_section": "About",
    "footer.made_in_ua": "Made in Ukraine",
    "footer.part_of": "part of",

    "hero.cta.go": "GO",
    "hero.year_label": "Graduation year",

    "site.tagline": "What you missed after graduation",
    "site.skip_link": "Skip to content",

    "page.about.title": "About the project",
    "page.metodologia.title": "Methodology",
    "page.quiz.title": "Quiz: guess the year",
    "page.timeline.title": "Timeline",
    "page.year.title_prefix": "Class of",
    "page.404.title": "404 — nothing to see here",
    "page.404.heading": "Nothing here yet.",
    "page.404.body":
      "The link might be stale or mistyped. Start from a graduation year — that's the main path.",
    "page.404.back_home": "Back to home",
    "page.404.popular": "Or pick a popular year",

    "scaffold.banner.title": "English UI is a scaffold",
    "scaffold.banner.body":
      "The interface has a minimal English shell; the facts themselves remain in Ukrainian until a dedicated translation phase (roadmap 9.3).",
  },
} as const satisfies Record<Locale, Record<string, string>>;

// Усі допустимі ключі словника (виведено з UK як з джерела правди).
export type UIKey = keyof (typeof UI)["uk"];
