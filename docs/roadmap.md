# BACK_FUTURE — інженерна дорожня карта

> Робочий план PR-ів, доповнення до 24-пунктної дорожньої карти у [`project-memory.md`](./project-memory.md).
> Цей документ описує **технічні** PR-и (інфра, контент-схема, UX, фічі) — як їх логічно розбити, у якій послідовності й з якими залежностями.
> Список ідей-першоджерел: [`ideas.md`](./ideas.md).

Останнє оновлення: травень 2026 (після PR #97: `/timeline`, dark-mode contrast fixes, reading-progress + back-to-year pill на `/fact/[slug]`, глобальний `[data-reveal]`-observer).

---

## Поточний стан (травень 2026)

### Уже на місці

- **CI:** `.github/workflows/ci.yml` — install / lint / typecheck / validate-content / build / Playwright smoke / Lighthouse audit. Окремо `link-check.yml` і `deploy.yml`.
- **Контент-валідація:** `npm run validate:content` (tone, sources, draft guard); `npm run coverage:content` (звіт по предметах і ерах).
- **Дизайн:** «3+1» (Mineral + Schoolbook акценти), токени в `tailwind.config.mjs`, глобальний `Header`/`Footer`, `/themes.astro` як лабораторія тем.
- **SEO:** RSS (`src/pages/rss.xml.ts`), sitemap (`@astrojs/sitemap`), robots.txt, canonical/OG/Twitter мета у `Base.astro`.
- **Сторінки:** `/[year]` з фільтрами, `/subject/[id]`, `/era/[slug]`, `/fact/[slug]`, `/timeline`, `/about`, `/metodologia`, `/themes`.
- **OG-зображення:** SVG + PNG ендпоінти `/og/[year].{svg,png}` і `/og/default.{svg,png}` (PR #43; PNG через `@resvg/resvg-js`).
- **Аналітика:** опціональний Plausible / Umami через env-змінні (PR #44). За замовчуванням нічого не вантажиться.
- **GitHub-операційка:** `CODEOWNERS`, `dependabot.yml` (з груповими правилами після PR #41), шаблони issues, `PULL_REQUEST_TEMPLATE.md`.
- **Pre-commit:** Husky + lint-staged → Prettier + markdownlint (PR #42).
- **Шрифти:** self-hosted Geist + Fraunces + IBM Plex Mono + Lora (PR-и #85–#88), immutable cache на `/fonts/*` через `vercel.json`.
- **Mobile:** Playwright `mobile-chrome` projektt + 375px smoke pack (PR #82), справжнє burger-меню (PR #83), touch targets ≥44×44 (PR #84), sticky-header fix (PR #89).
- **`/fact/[slug]` UX:** reading progress bar (PR #94), floating «До YYYY» pill (PR #95).
- **Глобальний `[data-reveal]`-fade-in observer:** Base.astro (PR #96) — fade-in карток на всіх сторінках з опт-ін атрибутом.
- **Контент:** 11 предметів підтримуються в схемі/CMS/UI; **усі 11 заповнені — 175 фактів сумарно** (15–16 на предмет, ~30 з них високий impact — «★ Віха»).

### Лишилось зробити (узагальнено)

| Напрям     | Що бракує                                                                                                      |
| ---------- | -------------------------------------------------------------------------------------------------------------- |
| Сторінки   | `/compare?a=…&b=…`, `/quiz`.                                                                                   |
| Пошук      | Pagefind (build-time index, без беку).                                                                         |
| PWA / a11y | Manifest + сервіс-воркер (офлайн перегляд), audit через axe.                                                   |
| Спільнота  | Action: issue з шаблону «Запропонувати факт» → draft PR. Сторінки `/contributors`, `/support`. Email-дайджест. |
| i18n       | Routing (`/en/[year]`), ICU plurals у форматерах кількості.                                                    |

### Нещодавно виконано (фази 0–3)

| #                           | PR                                                                                                                                                                                                                                                                                                                                                   | Що                                                                                                       |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 0.1                         | [#26](https://github.com/Skords-01/BACK_FUTURE/pull/26)                                                                                                                                                                                                                                                                                              | Прибрано `docs/proposed-ci/`, фікс Prettier на `roadmap.md`.                                             |
| 0.2                         | [#27](https://github.com/Skords-01/BACK_FUTURE/pull/27)                                                                                                                                                                                                                                                                                              | Vitest + 25 юніт-тестів для `src/lib/`.                                                                  |
| 1.1                         | [#22](https://github.com/Skords-01/BACK_FUTURE/pull/22)                                                                                                                                                                                                                                                                                              | Header: лічильник «N фактів» + breadcrumb (разом із #1.5).                                               |
| 1.2                         | [#33](https://github.com/Skords-01/BACK_FUTURE/pull/33)                                                                                                                                                                                                                                                                                              | Темна тема (class-based, ThemeToggle, pre-paint script).                                                 |
| 1.4                         | [#31](https://github.com/Skords-01/BACK_FUTURE/pull/31)                                                                                                                                                                                                                                                                                              | JSON-LD `Article` + `BreadcrumbList` на `/[year]`.                                                       |
| 1.5                         | [#22](https://github.com/Skords-01/BACK_FUTURE/pull/22)                                                                                                                                                                                                                                                                                              | Хлібні крихти (об'єднано з #1.1).                                                                        |
| 1.6                         | [#32](https://github.com/Skords-01/BACK_FUTURE/pull/32)                                                                                                                                                                                                                                                                                              | Sticky-підсумок з якорями-чіпами на предмети.                                                            |
| 1.7                         | [#29](https://github.com/Skords-01/BACK_FUTURE/pull/29)                                                                                                                                                                                                                                                                                              | Кастомний 404.                                                                                           |
| 1.8                         | [#30](https://github.com/Skords-01/BACK_FUTURE/pull/30)                                                                                                                                                                                                                                                                                              | Кнопка «Сюрприз» (рандомний рік).                                                                        |
| 2.1                         | [#28](https://github.com/Skords-01/BACK_FUTURE/pull/28)                                                                                                                                                                                                                                                                                              | Поля `before` / `after` у схемі + рендер у FactCard.                                                     |
| 2.2                         | [#36](https://github.com/Skords-01/BACK_FUTURE/pull/36)                                                                                                                                                                                                                                                                                              | Поле `region` (world / ukraine) + бейдж 🇺🇦 на FactCard.                                                  |
| 2.3                         | [#37](https://github.com/Skords-01/BACK_FUTURE/pull/37)                                                                                                                                                                                                                                                                                              | Поле `updatedAt` (ISO дата) + підпис «оновл. DD.MM.YYYY» на FactCard.                                    |
| 2.4                         | [#38](https://github.com/Skords-01/BACK_FUTURE/pull/38)                                                                                                                                                                                                                                                                                              | Поле `impact` (low/medium/high) + бейдж «★ Віха» для high.                                               |
| 3.1                         | [#39](https://github.com/Skords-01/BACK_FUTURE/pull/39)                                                                                                                                                                                                                                                                                              | `/subject/[id]` — окрема стрічка по кожному предмету (5 сторінок).                                       |
| 3.3                         | [#35](https://github.com/Skords-01/BACK_FUTURE/pull/35)                                                                                                                                                                                                                                                                                              | Розширений fallback на `[year]` — теги фактів-«сусідів» з ери.                                           |
| 6.1                         | [#21](https://github.com/Skords-01/BACK_FUTURE/pull/21)                                                                                                                                                                                                                                                                                              | Шер-кнопки (Telegram, X, FB, copy, native share) — раніше за залежність 3.4.                             |
| 0.3                         | [#41](https://github.com/Skords-01/BACK_FUTURE/pull/41)                                                                                                                                                                                                                                                                                              | Розширене групування Dependabot (astro/tailwind/lint/test/types/utils).                                  |
| 0.4                         | [#42](https://github.com/Skords-01/BACK_FUTURE/pull/42)                                                                                                                                                                                                                                                                                              | Husky + lint-staged → Prettier + markdownlint на pre-commit.                                             |
| 1.3                         | [#43](https://github.com/Skords-01/BACK_FUTURE/pull/43)                                                                                                                                                                                                                                                                                              | OG як PNG (`/og/[year].png`, `/og/default.png`) через `@resvg/resvg-js`.                                 |
| 1.9                         | [#44](https://github.com/Skords-01/BACK_FUTURE/pull/44)                                                                                                                                                                                                                                                                                              | Plausible / Umami як опція через env (без cookies, без default).                                         |
| 2.6                         | [#49](https://github.com/Skords-01/BACK_FUTURE/pull/49)                                                                                                                                                                                                                                                                                              | `dump-source-urls.ts` для експорту `sources[].url` у markdown-файл.                                      |
| 2.7                         | [#50](https://github.com/Skords-01/BACK_FUTURE/pull/50)                                                                                                                                                                                                                                                                                              | Окремий markdownlint для `content/facts/`.                                                               |
| 2.5 / 2.6 / 3.2 / 3.4 / 4.2 | [#51](https://github.com/Skords-01/BACK_FUTURE/pull/51)                                                                                                                                                                                                                                                                                              | Перші 5 задач: 11 subjects, warning-only source URL check, `/era`, `/fact`, фільтри року.                |
| Контент 2.5                 | [#53](https://github.com/Skords-01/BACK_FUTURE/pull/53), [#54](https://github.com/Skords-01/BACK_FUTURE/pull/54), [#56](https://github.com/Skords-01/BACK_FUTURE/pull/56), [#72](https://github.com/Skords-01/BACK_FUTURE/pull/72), [#75](https://github.com/Skords-01/BACK_FUTURE/pull/75), [#76](https://github.com/Skords-01/BACK_FUTURE/pull/76) | По 15 фактів у `tech`, `culture`, `ecology`, `medicine`, `economy`, `sport`. Усі 11 предметів заповнені. |
| Контент 2.x                 | [#63](https://github.com/Skords-01/BACK_FUTURE/pull/63)                                                                                                                                                                                                                                                                                              | `quote` / `before` / `after` / `impact: high` для 32 ключових фактів.                                    |
| 5.2 (mobile)                | [#82](https://github.com/Skords-01/BACK_FUTURE/pull/82)                                                                                                                                                                                                                                                                                              | Playwright `mobile-chrome` проєкт + 375px smoke pack.                                                    |
| 1.1 (фактично)              | [#83](https://github.com/Skords-01/BACK_FUTURE/pull/83)                                                                                                                                                                                                                                                                                              | Справжнє burger-меню в `Header.astro` з a11y-зв'язкою.                                                   |
| 5.2 (touch)                 | [#84](https://github.com/Skords-01/BACK_FUTURE/pull/84)                                                                                                                                                                                                                                                                                              | Touch targets ≥44×44 на ключових елементах.                                                              |
| 8.2                         | [#85](https://github.com/Skords-01/BACK_FUTURE/pull/85), [#86](https://github.com/Skords-01/BACK_FUTURE/pull/86), [#87](https://github.com/Skords-01/BACK_FUTURE/pull/87), [#88](https://github.com/Skords-01/BACK_FUTURE/pull/88)                                                                                                                   | Self-hosted Geist + Fraunces + Lora + IBM Plex Mono Cyrillic 400/500/600, immutable cache.               |
| Mobile bugfix               | [#89](https://github.com/Skords-01/BACK_FUTURE/pull/89)                                                                                                                                                                                                                                                                                              | Sticky-header перестав прилипати на мобілі — прибрано `overflow-x` з body.                               |
| 6.2                         | [#93](https://github.com/Skords-01/BACK_FUTURE/pull/93), [#97](https://github.com/Skords-01/BACK_FUTURE/pull/97)                                                                                                                                                                                                                                     | `/timeline` (Variant A: вертикальна вісь, dot-on-axis, era jump-strip).                                  |
| i18n fix                    | [#91](https://github.com/Skords-01/BACK_FUTURE/pull/91)                                                                                                                                                                                                                                                                                              | Бейдж «Веха» → «Віха» (правильна укр. форма).                                                            |
| UX badge                    | [#92](https://github.com/Skords-01/BACK_FUTURE/pull/92)                                                                                                                                                                                                                                                                                              | Inline explainer + легенда позначок на `/timeline`.                                                      |
| `/fact` UX                  | [#94](https://github.com/Skords-01/BACK_FUTURE/pull/94), [#95](https://github.com/Skords-01/BACK_FUTURE/pull/95)                                                                                                                                                                                                                                     | Reading progress bar + floating-pill «До YYYY» на `/fact/[slug]`.                                        |
| Animation                   | [#96](https://github.com/Skords-01/BACK_FUTURE/pull/96)                                                                                                                                                                                                                                                                                              | Глобальний `[data-reveal]` observer у Base — fade-in на subject/era/timeline.                            |

---

## Принципи розбиття на PR-и

- **Малий фокус:** один PR — одна зміна, ≤ 400 рядків діффу де можливо.
- **Розмір:** S = годинна задача, M = пів-дня, L = ≥ день з тестами.
- **Залежності:** позначаю явно. PR без залежностей можна паралелити.
- **Без зміни поведінки в техборгу:** PR-и категорії «Фаза 0» не змінюють UX; вони тільки додають інструментарій / прибирають мертвий код.
- **Контент окремо від коду:** контент-PR-и не мішаються з UI/інфра.
- **Кожен новий PR оновлює `project-memory.md`,** якщо змінює архітектуру або скоупить етап.

---

## Фаза 0 — Інженерний фундамент ✅

Усі PR-и фази 0 закриті — див. таблицю «Нещодавно виконано» вище.

| #   | PR                                                           | Розмір | Залежить | Опис                                                                                                                                  |
| --- | ------------------------------------------------------------ | ------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| 0.1 | Прибрати `docs/proposed-ci/` (CI уже в `.github/workflows/`) | S      | —        | Видалити теку й оновити `project-memory.md` (пункт #21).                                                                              |
| 0.2 | Vitest + юніт-тести для `src/lib/`                           | M      | —        | `vitest.config.ts`, `npm run test:unit`, тести для `eras.ts`, `filterFacts.ts`, `url.ts`. Цільове покриття `src/lib/` ≥ 80%. CI крок. |
| 0.3 | Renovate / посилення Dependabot                              | S      | —        | Або перевести на Renovate, або згрупувати оновлення dev-deps у Dependabot.                                                            |
| 0.4 | pre-commit (Husky + lint-staged) для prettier/markdownlint   | S      | —        | Опційно. Локальна швидкість запобігання тривіальних red-CI.                                                                           |

## Фаза 1 — UX-швидкі перемоги ✅

Усі PR-и фази 1 закриті — див. таблицю «Нещодавно виконано» вище.

| #   | PR                                                | Розмір | Залежить | Опис                                                                                                                                                                               |
| --- | ------------------------------------------------- | ------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1 | Хедер: мобільне меню + лічильник «База: N фактів» | S      | —        | Done у [#22](https://github.com/Skords-01/BACK_FUTURE/pull/22) (лічильник + breadcrumb) і [#83](https://github.com/Skords-01/BACK_FUTURE/pull/83) (повноцінне burger-меню з a11y). |
| 1.2 | Темна тема (auto-prefers + перемикач)             | M      | —        | Tailwind `dark:` варіанти, токени в `tailwind.config.mjs`, persist у `localStorage`.                                                                                               |
| 1.3 | OG як PNG (рендер SVG → PNG)                      | S      | —        | Додати endpoint `/og/[year].png` через satori або `sharp` (поверх існуючих SVG). Оновити мета у `Base.astro`. (#1.)                                                                |
| 1.4 | JSON-LD: `Article`, `BreadcrumbList`              | S      | —        | На `/[year]` і деталях фактів (коли з'являться).                                                                                                                                   |
| 1.5 | Хлібні крихти                                     | S      | —        | Компонент `Breadcrumbs.astro`, інтеграція в `[year]`, майбутні `subject`/`era`.                                                                                                    |
| 1.6 | Sticky-підсумок з чіпами-якорями на предмети      | S      | 1.5      | На сторінці року. Покращує навігацію довгого списку.                                                                                                                               |
| 1.7 | Кастомний 404                                     | S      | —        | Дружній текст + поле року + посилання на головну.                                                                                                                                  |
| 1.8 | Кнопка «Сюрприз» (рандомний рік)                  | S      | —        | На лендингу. (Item #11 з memory споріднений — квіз окремо.)                                                                                                                        |
| 1.9 | Plausible / Umami аналітика                       | S      | —        | Self-hostable, без cookies. Опційно через env-var.                                                                                                                                 |

## Фаза 2 — Контент-схема (підсилює цінність)

| #   | PR                                                                      | Розмір | Залежить | Опис                                                                                                                                                                                        |
| --- | ----------------------------------------------------------------------- | ------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1 | Поля `before` / `after` у `content.config.ts` + рендер у FactCard       | M      | —        | Опційні; коли є — показуємо блок «Тоді / Зараз». (Item #12.)                                                                                                                                |
| 2.2 | Поле `region` (країна / світ / Україна)                                 | S      | —        | Для фільтра «тільки про Україну».                                                                                                                                                           |
| 2.3 | Поле `updatedAt` + бейдж «Оновлено YYYY»                                | S      | —        | Для трекінгу свіжості факту.                                                                                                                                                                |
| 2.4 | Поле `impact` (low / medium / high)                                     | S      | —        | Для сортування fallback, коли року не вистачає.                                                                                                                                             |
| 2.5 | Розширення `SUBJECTS`: tech, medicine, economy, culture, sport, ecology | M      | —        | Done у [#51](https://github.com/Skords-01/BACK_FUTURE/pull/51): схема, CMS, docs, subject routes, валідація й coverage підтримують 11 предметів; контент додається окремо.                  |
| 2.6 | CI-перевірка: `sources[].url` віддає 200 (link-check уже є — розширити) | S      | —        | Done у [#49](https://github.com/Skords-01/BACK_FUTURE/pull/49) + [#51](https://github.com/Skords-01/BACK_FUTURE/pull/51): dump source URLs і warning-only Lychee step для зовнішніх джерел. |
| 2.7 | Lint MD-фактів (markdownlint правила окремо для `content/facts/`)       | S      | —        | Done у [#50](https://github.com/Skords-01/BACK_FUTURE/pull/50): `content/facts/.markdownlint-cli2.jsonc` підхоплюється `npm run lint:md` через walk-up discovery.                           |

## Фаза 3 — Нові сторінки

| #   | PR                                    | Розмір | Залежить | Опис                                                                                                                                     |
| --- | ------------------------------------- | ------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 3.1 | `/subject/[id]` — стрічка по предмету | M      | —        | Усі факти предмета, сортовані по року події.                                                                                             |
| 3.2 | `/era/[slug]` — стрічка по ері        | M      | —        | Done у [#51](https://github.com/Skords-01/BACK_FUTURE/pull/51): усі факти, що `relevantForEras` містить ID ери, з групуванням і JSON-LD. |
| 3.3 | Fallback-блок для років без фактів    | S      | —        | На `[year].astro` («Тут поки тихо» уже є — розширити CTA).                                                                               |
| 3.4 | Сторінка одного факту `/fact/[slug]`  | M      | 1.4      | Done у [#51](https://github.com/Skords-01/BACK_FUTURE/pull/51): канонічний URL, джерела, breadcrumbs, JSON-LD `Article`, share/copy.     |

## Фаза 4 — Пошук і персоналізація

| #   | PR                                 | Розмір | Залежить | Опис                                                                                                                                 |
| --- | ---------------------------------- | ------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| 4.1 | Pagefind (build-time)              | M      | —        | Без серверної залежності, повнотекстовий пошук по фактах.                                                                            |
| 4.2 | Фільтри на сторінці року           | M      | 2.2, 2.4 | Done у [#51](https://github.com/Skords-01/BACK_FUTURE/pull/51): `subject`, `era`, `region`, `impact`, live counts і query-параметри. |
| 4.3 | «Мій рік» (persist у localStorage) | S      | —        | Кнопка швидкого повернення; запам'ятовуємо вибір з `YearInput`.                                                                      |
| 4.4 | Збережені факти (bookmark)         | M      | —        | LocalStorage; невелика сторінка `/saved`.                                                                                            |

## Фаза 5 — PWA / a11y / asset-pipeline

| #   | PR                                             | Розмір | Залежить | Опис                                                                 |
| --- | ---------------------------------------------- | ------ | -------- | -------------------------------------------------------------------- |
| 5.1 | PWA manifest + service-worker                  | M      | —        | Офлайн-перегляд закешованих сторінок.                                |
| 5.2 | axe-аудит у CI + фікси                         | M      | —        | `@axe-core/playwright` поверх існуючих smoke-тестів.                 |
| 5.3 | Перехід на `astro:assets` для зображень фактів | S      | 2.x      | Поки `image` поле опційне; коли заповниться — оптимізувати pipeline. |

## Фаза 6 — Залучення

| #   | PR                                       | Розмір | Залежить | Опис                                                                                                                                                                                                       |
| --- | ---------------------------------------- | ------ | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 6.1 | Шер-кнопки на `/[year]` і `/fact/[slug]` | S      | 3.4      | Telegram, X, копіювання посилання. (#2 у memory.)                                                                                                                                                          |
| 6.2 | `/timeline` — хронологія всіх фактів     | M      | —        | Done у [#93](https://github.com/Skords-01/BACK_FUTURE/pull/93) і [#97](https://github.com/Skords-01/BACK_FUTURE/pull/97) (Variant A: вертикальна вісь, era jump-strip, dark-mode contrast). (#9 у memory.) |
| 6.3 | `/compare?a=…&b=…` — два роки поруч      | M      | —        | (Близько до #12, але рівень метаданих, не індивід. фактів.)                                                                                                                                                |
| 6.4 | Квіз «вгадай рік відкриття»              | L      | —        | (#11 у memory.) Має оновлюваний пул із фактів.                                                                                                                                                             |
| 6.5 | `/share/[year]` — постер під шеринг      | M      | 1.3      | (#5 у memory.) PNG із OG-генератора + цитати.                                                                                                                                                              |

## Фаза 7 — Спільнота й контент-операційка

| #   | PR                                               | Розмір | Залежить | Опис                                                                       |
| --- | ------------------------------------------------ | ------ | -------- | -------------------------------------------------------------------------- |
| 7.1 | Action: issue (шаблон `new-fact.yml`) → draft PR | M      | —        | Авто-створення `.md`-факту з полями issue. (Сполучає #20 і #21 із memory.) |
| 7.2 | `/contributors` — всі автори фактів              | S      | —        | Парсимо commit history або frontmatter `authors`.                          |
| 7.3 | `/support` — як підтримати (Monobank, BMC)       | S      | —        | Підключити коли заповниться `monobankJarUrl` у `site.ts`.                  |
| 7.4 | Email-дайджест (Buttondown / опційно)            | M      | 4.1      | Раз на місяць — нові факти.                                                |

## Фаза 8 — Бренд і дизайн-система

| #   | PR                                                | Розмір | Залежить | Опис                                                                                                                                                                                                                                                                                                                                                                                    |
| --- | ------------------------------------------------- | ------ | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 8.1 | SVG-іконки предметів (замінити emoji)             | M      | —        | Done: реєстр гліфів `src/lib/subjectIcons.ts` + `<SubjectIcon>` компонент. Замінено emoji у `[year]`, `subject/[id]`, `era/[slug]`, `fact/[slug]` та `SubjectSection`. `emoji` у `SUBJECTS` лишається для OG (`src/lib/og.ts`).                                                                                                                                                         |
| 8.2 | Локальний шрифтовий пакет (без Google Fonts)      | S      | —        | Done у [#85](https://github.com/Skords-01/BACK_FUTURE/pull/85) (Geist + Fraunces + IBM Plex Mono Cyrillic 400), [#86](https://github.com/Skords-01/BACK_FUTURE/pull/86) (Lora як кир. fallback для Fraunces), [#87](https://github.com/Skords-01/BACK_FUTURE/pull/87) (mono Cyrillic 500/600), [#88](https://github.com/Skords-01/BACK_FUTURE/pull/88) (immutable cache на `/fonts/*`). |
| 8.3 | `/themes` як справжній перемикач (cookie-стійкий) | M      | 1.2      | Зробити Theme Laboratory повноцінним фронтенд-перемикачем.                                                                                                                                                                                                                                                                                                                              |

## Фаза 9 — i18n

| #   | PR                                  | Розмір | Залежить | Опис                                                       |
| --- | ----------------------------------- | ------ | -------- | ---------------------------------------------------------- |
| 9.1 | Astro i18n routing (`/uk/`, `/en/`) | L      | 3.x      | Без перекладів спочатку; готовність до англомовної версії. |
| 9.2 | ICU plurals у форматерах            | S      | —        | Замінити «1 оновлення / 2 оновлення / 5 оновлень» на ICU.  |
| 9.3 | Англомовний UI                      | L      | 9.1      | Тексти UI в `i18n/`, `/en/[year]` спочатку без контенту.   |

---

## Перші 5 задач виконано в PR #51

PR [#51](https://github.com/Skords-01/BACK_FUTURE/pull/51) закриває попередній top-5:

1. **#3.2** — `/era/[slug]` стрічка.
2. **#3.4** — `/fact/[slug]` канонічна сторінка факту.
3. **#4.2** — фільтри на сторінці року.
4. **#2.5** — розширення `SUBJECTS` до 11 предметів.
5. **#2.6** — workflow-патч для `sources[].url`.

Наступні найпрактичніші задачі: Pagefind-пошук, `/timeline`, `/quiz`, issue `new-fact.yml` → draft PR, `/contributors` + `/support`.

---

## Як пропонувати зміни плану

- Якщо хочеться нову фічу — створи issue за шаблоном `technical-task.yml` і додай у відповідну фазу цього файлу.
- Якщо хочеться змінити пріоритет — комент у issue + PR з оновленням `roadmap.md`.
- Якщо план розходиться з реальністю — оновлюй секцію «Поточний стан».
