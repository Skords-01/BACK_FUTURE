# Архітектура

## Принципи

1. **Контент окремо від коду.** Усі факти — у `content/facts/`, конфіг ер — у `content/eras.json`. Жоден текст для користувача не «зашитий» у компонентах — все у frontmatter або в `src/config/site.ts`.
2. **Single source of truth для бренду.** `src/config/site.ts` містить назву, опис, домен, посилання на банку, мінімальний/максимальний рік. Щоб перейменувати сайт — тут одна правка.
3. **Типобезпека на межі контенту.** Кожен `.md`-факт валідується Zod-схемою у `src/content/config.ts`. Кривий frontmatter → білд впаде.
4. **Static-first.** Усі сторінки пререндериться у статику. Без серверних залежностей. Будь-який static host годиться.

## Шар "доменна логіка"

`src/lib/` — чисті функції без зв'язку з UI:

- `eras.ts` — мапить рік випуску → ера програми (1..5).
- `filterFacts.ts` — фільтрує факти за роком, предметом, ерою, регіоном і impact; групує по предметах / ерах.
- `url.ts` — генерує стабільні URL для років, предметів, ер і сторінок фактів.

UI-компоненти (Astro) працюють з результатами цих функцій. Це ключ до того, щоб переписати сайт під іншу тему — змінити або замінити ці функції, лишивши UI.

## Сторінкова модель

- `/` — лендінг + ввод року.
- `/[year]` — стрічка оновлень для випускників цього року. Пререндериться по одному файлу на кожен рік від `SITE.yearMin` до `SITE.yearMax`; має клієнтські фільтри `subject`, `era`, `region`, `impact` із query-параметрами.
- `/subject/[id]` — стрічка всіх фактів одного предмета.
- `/era/[slug]` — стрічка фактів, релевантних конкретній ері шкільної програми.
- `/fact/[slug]` — канонічна сторінка одного факту з джерелами, JSON-LD і share/copy діями.
- `/about`, `/metodologia`, `/themes` — статичні сторінки.

## Як форкнути в новий сайт

Цей репо спроєктований як перший інстанс шаблону «контент-сайт із фільтрацією за параметром користувача». Щоб зробити подібний сайт на іншу тему:

1. Скопіюй репо.
2. Зміни `src/config/site.ts` (назва, опис, мінімальний/максимальний параметр, банка).
3. Зміни `src/content/config.ts` (схема факту під свій домен).
4. Перепиши `src/lib/eras.ts` під свій маппер «параметр користувача → категорія».
5. Заміни `content/`.
6. (Опц.) Перейменуй `[year].astro` на `[<твій-параметр>].astro`.

Усе інше — UI-компоненти, layout, стилі — лишається.

## i18n (locales `uk`, `en`)

Локалі сконфігуровані в `astro.config.mjs` секцією `i18n`:

- `defaultLocale: "uk"` — українська без префіксу (`/`, `/about/`, `/2003/`).
- `locales: ["uk", "en"]`.
- `routing.prefixDefaultLocale: false` — UK без префіксу, EN під `/en/`.
- `routing.redirectToDefaultLocale: false` — `/en/...` лишається префіксованим.
- `@astrojs/sitemap` бачить обидві локалі: для кожної UK-URL генерує
  `xhtml:link rel="alternate" hreflang="..."` пару.

Структура:

- `src/i18n/ui.ts` — словник `UI = { uk: {...}, en: {...} }`, експортує
  типи `Locale`, `UIKey`, мапи `LOCALE_HTML_LANG`, `LOCALE_OG_LOCALE`,
  `LOCALES`, `DEFAULT_LOCALE`. Тільки UI-рядки (nav, hero, footer, page
  titles, 404, scaffold-banner). Контент-факти не торкаємо.
- `src/i18n/t.ts` — `getT(locale)` повертає `(key) => string` з fallback
  на `uk`. `toLocale(value)` нормалізує довільні рядки до `Locale`.
- `src/components/LangSwitcher.astro` — лінки на еквівалентний шлях у
  іншій локалі (UK ↔ EN), `aria-current` на активному, пише в
  `localStorage["bf_lang"]` при кліку.
- Дзеркало під `/en/`: `src/pages/en/{index,[year],about,all,quiz,
metodologia,timeline}.astro`. Кожна сторінка — структурний scaffold з
  посиланням «→ Full UA version». Повний переклад UI — фаза 9.3.

`Base.astro`:

- Визначає локаль за `Astro.url.pathname` (надійніше за
  `Astro.currentLocale` на 404 та статичних редиректах).
- `<html lang>` reactive: `LOCALE_HTML_LANG[locale]` (`uk` / `en`).
- `<link rel="alternate" hreflang>` для `uk`, `en`, `x-default`.
- `<meta property="og:locale">` + `og:locale:alternate` пара.
- Inline-скрипт авто-редиректу: якщо немає `bf_lang` у `localStorage`,
  поточний шлях не починається з `/en` і `navigator.language` починається
  з `en` → один-разово редиректить на `/en/...`. Користувацький вибір
  через LangSwitcher завжди має пріоритет.

`404.astro` — UA-копія за замовчуванням; inline-скрипт перебудовує
видимі рядки в англійські, якщо `window.location.pathname` починається з
`/en` (Astro будує один статичний `404.html` для всіх).

## Подальші кроки

- Pagefind-пошук по фактах без бекенду.
- `/timeline` — хронологія всіх фактів.
- Опційний квіз («вгадай рік відкриття»).
- Спільнотний workflow: issue `new-fact.yml` → draft PR.
- `/contributors` і `/support` після стабілізації контенту.
