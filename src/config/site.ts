/**
 * Site-level configuration. Single source of truth for branding/strings —
 * to fork this template into a new content site, this file (plus content/)
 * is the main thing you change.
 */

export const SITE = {
  name: "BACK_FUTURE",
  tagline: "Що ти пропустив після випускного",
  description:
    "Введи рік випуску й дізнайся, що змінилось у науці, історії й світі від тих часів — українською мовою.",
  locale: "uk-UA",
  // `import.meta.env.SITE` is injected by Astro from the `site:` config in
  // `astro.config.mjs` (which already applies the PUBLIC_SITE_URL fallback
  // chain). Single source of truth — do NOT duplicate the placeholder here.
  defaultUrl: import.meta.env.SITE,
  author: "BACK_FUTURE team",
  twitter: "",
  yearMin: 1991,
  yearMax: new Date().getFullYear(),
  monobankJarUrl: "",
  buyMeACoffeeUrl: "",
  repoUrl: "https://github.com/Skords-01/BACK_FUTURE",
} as const;

export const SUBJECTS = [
  { id: "astronomy", label: "Астрономія", emoji: "🪐", mark: "АСТ" },
  { id: "biology", label: "Біологія", emoji: "🧬", mark: "БІО" },
  { id: "geography", label: "Географія", emoji: "🌍", mark: "ГЕО" },
  { id: "history", label: "Історія", emoji: "📜", mark: "ІСТ" },
  { id: "physics", label: "Фізика", emoji: "⚛️", mark: "ФІЗ" },
  { id: "tech", label: "Технологія", emoji: "💻", mark: "ТЕХ" },
  { id: "medicine", label: "Медицина", emoji: "🏥", mark: "МЕД" },
  { id: "economy", label: "Економіка", emoji: "💰", mark: "ЕКН" },
  { id: "culture", label: "Культура", emoji: "🎭", mark: "КУЛ" },
  { id: "sport", label: "Спорт", emoji: "⚽", mark: "СПР" },
  { id: "ecology", label: "Екологія", emoji: "🌱", mark: "ЕКЛ" },
] as const;

export type SubjectId = (typeof SUBJECTS)[number]["id"];
