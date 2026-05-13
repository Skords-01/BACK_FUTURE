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

## PWA (manifest + service-worker)

Сайт встановлюваний як PWA (roadmap 5.1): фактично-офлайнова стрічка фактів,
встановлення на хоумскрін на Android/Chrome OS, кастомний `theme_color` під
Mineral-палітру.

- **Manifest:** `public/manifest.webmanifest` — `name`/`short_name`/`description`
  з `src/config/site.ts`, `theme_color` `#b9381a` (accent-500),
  `background_color` `#f3ecdc` (paper-50), іконки 192/512/maskable у
  `public/icons/` (рендеряться скриптом `scripts/generate-pwa-icons.ts` через
  вже наявний `@resvg/resvg-js`; PNG-набір — placeholder, можна вільно
  замінити на фінальний бренд-арт).
- **Service-worker:** `scripts/generate-sw.ts` запускається після
  `astro build` + `pagefind` (див. `npm run build`), сканує `dist/`,
  розкладає файли в дві поличку через `src/lib/swUtils.ts` і пише
  `dist/sw.js`. Стратегії:
  - precache (cache-first) — хешовані `_astro/*` JS/CSS, шрифти, іконки,
    OG-картинки, `favicon.svg`, offline-сторінка;
  - runtime (network-first з 4-секундним fallback-таймаутом) — будь-який
    HTML; в офлайні віддаємо кешований варіант, інакше — `/offline/`;
  - exclude — `/pagefind/*` (lazy-loaded динамічний індекс пошуку), `sw.js`
    і `manifest.webmanifest` (мають оновлюватися без кешу), `*.xml`,
    `robots.txt`, source-maps.
- **Cache versioning:** `computeCacheVersion` бере відсортований список
  `(URL, sha256-12)` precache-файлів і виводить короткий djb2-хеш. Білд
  байт-у-байт ідентичний — версія та сама. Будь-яка зміна вмісту → нова
  версія → `activate`-listener видаляє старі кеші.
- **Реєстрація:** інлайновий скрипт у `src/layouts/Base.astro` під
  `import.meta.env.PROD`-гейтом — у dev SW не реєструється (HMR Vite не
  страждає). Без `navigator.serviceWorker` тиха деградація.
- **Offline-сторінка:** `src/pages/offline.astro` — брендована, з
  «Спробувати ще раз» (reload) і «На головну». Використовує загальний
  `Base.astro`, `noindex`.
- **Install prompt:** `src/components/InstallPwaButton.astro` —
  невелика плаваюча кнопка, лише на головній. Слухає `beforeinstallprompt`,
  поважає `prefers-reduced-motion`, прикритий стан зберігається в
  `localStorage` під ключем `bf_install_dismissed`.
- **Тести:** `src/lib/swUtils.test.ts` (asset categorization,
  `toUrlPath`, cache version).

## Подальші кроки

- Pagefind-пошук по фактах без бекенду.
- `/timeline` — хронологія всіх фактів.
- Опційний квіз («вгадай рік відкриття»).
- Спільнотний workflow: issue `new-fact.yml` → draft PR.
- `/contributors` і `/support` після стабілізації контенту.
