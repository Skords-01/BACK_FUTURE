import type { SubjectId } from "../config/site";

/**
 * School-program topic taxonomy. Each topic is a typical chapter / lesson
 * theme found in Ukrainian secondary-school programs (1991–today).
 *
 * Facts can opt into a topic via the `topic` frontmatter key (#7 on the roadmap).
 * Used by the topic index page (/temy) and the FactCard breadcrumb.
 */
export interface Topic {
  id: string;
  subject: SubjectId;
  label: string;
  short: string;
}

export const TOPICS: Topic[] = [
  // Astronomy
  {
    id: "solar-system",
    subject: "astronomy",
    label: "Сонячна система",
    short: "Будова, планети, малі тіла, історія класифікації.",
  },
  {
    id: "exoplanets",
    subject: "astronomy",
    label: "Екзопланети та інші зорі",
    short: "Пошук планет біля інших зір, типи екзопланет.",
  },
  {
    id: "cosmology",
    subject: "astronomy",
    label: "Будова Всесвіту",
    short: "Розширення, темна матерія, темна енергія, реліктове випромінювання.",
  },
  {
    id: "space-exploration",
    subject: "astronomy",
    label: "Освоєння космосу",
    short: "Пілотовані польоти, міжпланетні станції, телескопи.",
  },
  // Biology
  {
    id: "genetics",
    subject: "biology",
    label: "Генетика і ДНК",
    short: "Спадковість, геном людини, генна інженерія.",
  },
  {
    id: "evolution",
    subject: "biology",
    label: "Еволюція",
    short: "Походження видів, антропогенез, давня ДНК.",
  },
  {
    id: "ecology",
    subject: "biology",
    label: "Екологія та збереження природи",
    short: "Заповідники, втрата біорізноманіття, антропогенний вплив.",
  },
  {
    id: "biotech-medicine",
    subject: "biology",
    label: "Біотехнології й медицина",
    short: "Нові терапії, протезування, біотехнологічні інструменти.",
  },
  // Geography
  {
    id: "political-map",
    subject: "geography",
    label: "Політична мапа світу",
    short: "Нові й перейменовані держави, окупації, кордони.",
  },
  {
    id: "toponymy",
    subject: "geography",
    label: "Топоніміка",
    short: "Назви країн і міст, дерусифікація українських географічних назв.",
  },
  {
    id: "climate-environment",
    subject: "geography",
    label: "Клімат і довкілля",
    short: "Зміна клімату, водні катастрофи, охорона природи.",
  },
  {
    id: "ukraine-geography",
    subject: "geography",
    label: "Географія України",
    short: "Адміністративний устрій, природні зони, ресурси, окуповані території.",
  },
  // History
  {
    id: "ukraine-state-building",
    subject: "history",
    label: "Українське державотворення",
    short: "Незалежність, революції, реформи, інституції.",
  },
  {
    id: "crimes-and-memory",
    subject: "history",
    label: "Тоталітарні режими і пам'ять",
    short: "Голодомор як геноцид, репресії, відкриття архівів.",
  },
  {
    id: "russian-aggression",
    subject: "history",
    label: "Російська агресія проти України",
    short: "Війна з 2014, повномасштабне вторгнення з 2022, окупація Криму.",
  },
  {
    id: "world-history",
    subject: "history",
    label: "Світова історія",
    short: "МКС, генетична археологія, нові археологічні відкриття.",
  },
  {
    id: "culture-heritage",
    subject: "history",
    label: "Культура і спадщина",
    short: "ЮНЕСКО, церковна автокефалія, мовна політика.",
  },
  // Physics
  {
    id: "particle-physics",
    subject: "physics",
    label: "Фізика елементарних частинок",
    short: "Стандартна модель, бозон Хіггса, нейтринні осциляції.",
  },
  {
    id: "quantum-physics",
    subject: "physics",
    label: "Квантова фізика",
    short: "Заплутаність, бозе-ейнштейнівський конденсат, квантова інформатика.",
  },
  {
    id: "gravitation-cosmology",
    subject: "physics",
    label: "Гравітація і астрофізика",
    short: "Гравітаційні хвилі, гравітація антиматерії.",
  },
  {
    id: "matter-and-materials",
    subject: "physics",
    label: "Будова речовини й матеріали",
    short: "Графен, антиводень, нові форми матерії.",
  },
  {
    id: "metrology-and-energy",
    subject: "physics",
    label: "Метрологія й енергетика",
    short: "Перевизначення SI, термоядерне запалювання, нейтронні джерела.",
  },
];

const BY_ID = new Map(TOPICS.map((t) => [t.id, t]));

export function topicById(id: string): Topic | null {
  return BY_ID.get(id) ?? null;
}

export function topicsBySubject(subject: SubjectId): Topic[] {
  return TOPICS.filter((t) => t.subject === subject);
}
