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
  defaultUrl: import.meta.env.PUBLIC_SITE_URL ?? "https://back-future.example.com",
  author: "BACK_FUTURE team",
  twitter: "",
  yearMin: 1991,
  yearMax: new Date().getFullYear(),
  monobankJarUrl: "",
  buyMeACoffeeUrl: "",
  repoUrl: "https://github.com/Skords-01/BACK_FUTURE",
} as const;

export const SUBJECTS = [
  { id: "astronomy", label: "Астрономія", emoji: "🪐" },
  { id: "biology", label: "Біологія", emoji: "🧬" },
  { id: "geography", label: "Географія", emoji: "🌍" },
  { id: "history", label: "Історія", emoji: "📜" },
  { id: "physics", label: "Фізика", emoji: "⚛️" },
  { id: "tech", label: "Технологія", emoji: "💻" },
  { id: "medicine", label: "Медицина", emoji: "🏥" },
  { id: "economy", label: "Економіка", emoji: "💰" },
  { id: "culture", label: "Культура", emoji: "🎭" },
  { id: "sport", label: "Спорт", emoji: "⚽" },
  { id: "ecology", label: "Екологія", emoji: "🌱" },
] as const;

export type SubjectId = (typeof SUBJECTS)[number]["id"];
