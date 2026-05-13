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
- `plurals.ts` — ICU plurals через `Intl.PluralRules` із кешуванням на locale; generic `plural(n, locale, forms)` + helpers `factsCount` / `factsWord` / `updatesCount` / `yearsAgo` / `yearsWord` / `subjectsCount`. Підтримує uk/en (та будь-який CLDR-locale), форми як рядок або callback `(n) => string` для richer markup. Edge: `0` → природна форма («жодного факту» / «no facts»), negatives через `Math.abs`, floats — CLDR-default. Усі UI-місця, де раніше були ручні `m10===1 && m100!==11` тощо, переведені на ці helpers.

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

## SEO та structured data

- **Один шар-source-of-truth для мета-тегів — `src/layouts/Base.astro`:** `<title>`, `<meta name="description">`, `<link rel="canonical">` (абсолютний URL), `<link rel="sitemap">`, OG (`og:title`, `og:description`, `og:image`, `og:url`, `og:locale`, `og:type`), Twitter (`twitter:card="summary_large_image"`). Сторінки передають у layout `title`, `description`, `ogImage`, `ogType` (`"website"` за замовчуванням, `"article"` для `/era/<slug>/` і `/fact/<slug>/`) і JSON-LD.
- **JSON-LD рендериться інлайн** через проп `jsonLd` (object | array). Layout сам екранує `<` всередині строкових значень, щоб не зламати `</script>`.
- **Поточний JSON-LD-набір:** `Article` + `BreadcrumbList` на `/fact/[slug]`, `CollectionPage` + `BreadcrumbList` на `/era/[slug]`, `ItemList` на `/timeline`, `FAQPage` на `/about` (через `src/lib/faq.ts` — той самий список рендериться і у видимий `<details>`-блок, і в JSON-LD).
- **OG-зображення:** `/og/[year].{svg,png}` (year-specific), `/og/era-[slug].{svg,png}` (era-specific), `/og/default.{svg,png}` як fallback. PNG-конвертація — через `@resvg/resvg-js`. Білдер у `src/lib/og.ts`, юніт-тести покривають `buildYearOgSvg` / `buildEraOgSvg` / `buildDefaultOgSvg`.
- **Sitemap:** `@astrojs/sitemap` інтеграція в `astro.config.mjs` генерує `sitemap-index.xml`; `robots.txt` (`src/pages/robots.txt.ts`) лінкує на нього.
- **Перевірка:** Playwright smoke у `tests/e2e/seo.spec.ts` перевіряє `FAQPage` JSON-LD на `/about/` і абсолютний canonical + `og:type=article` на `/fact/<slug>/` і `/era/<slug>/`.

## Подальші кроки

- Pagefind-пошук по фактах без бекенду.
- `/timeline` — хронологія всіх фактів.
- Опційний квіз («вгадай рік відкриття»).
- Спільнотний workflow: issue `new-fact.yml` → draft PR.
- `/contributors` і `/support` після стабілізації контенту.
