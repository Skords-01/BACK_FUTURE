# BACK_FUTURE — пам'ять проєкту

> Цей документ — «жива» довгострокова пам'ять проєкту. Тут зафіксовано все, що було спільно проговорено між власником і Devin: бачення, рішення, відкладені моменти, відкриті питання, поточний стан. Оновлюється з кожним значущим етапом. Усі майбутні сесії повинні почати читання саме з цього документа.

Останнє оновлення: травень 2026 року, після PR #133 + 9.2: 11 предметів заповнені (175 фактів), Pagefind-пошук (Cmd/Ctrl+K) і `/quiz`-сторінка, observability-стек (Sentry, PostHog з фунелами і dashboard-as-code, GSC-верифікація) — все env-gated, `userState.ts` (last-year + read-tracking у `localStorage`), 5 design-effects (staggered entrance, magnetic 3D tilt, slot-machine GO, glitch reveal, DensityStrip tooltip), `ScrollRestore` стійкий на iOS Safari + bfcache, прибрано dead code і застарілі шрифти (Fraunces/Lora/IBM Plex Mono), JetBrains Mono замінив IBM Plex Mono як основний моно-шрифт, ICU plurals через `src/lib/plurals.ts` (`Intl.PluralRules`) — `factsCount` / `updatesCount` / `yearsAgo` із locale-параметром і кешуванням.

---

## 1. Бачення і ціль

**Що це.** Український просвітницький сайт для дорослих 30+: вводиш рік випуску школи (1991–2026) — отримуєш персоналізовану стрічку «що змінилось у науці, історії, на політичній мапі з тих часів».

**Цільова аудиторія.** Українці, які закінчували школу 1991–2026 і хочуть швидко оновити картину світу. Тон — науково-популярний, дружній, без поблажливості.

**Вторинна ціль.** Бути прикладом-шаблоном для **серії схожих сайтів**: «що змінилось у [сфері] з [параметру користувача]» (наприклад: «що змінилось у IT з твого випуску», «що нового з твого року народження», тощо). BACK_FUTURE — перший інстанс паттерну, не унікум.

**Етос.**

- **Український** — у мові, культурі, перспективі.
- **Світський** — без релігійної тенденційності.
- **Проукраїнський** — в історичних фактах, термінології.
- **Етичний** — джерела, нейтральний тон, без особистих думок.
- **Націоналістичні теми не табу** — якщо вони академічно обґрунтовані, з джерелами.

---

## 2. Стек і ключові технічні рішення

| Компонент    | Версія                             | Причина вибору                                            |
| ------------ | ---------------------------------- | --------------------------------------------------------- |
| Astro        | 6.2.x                              | Static-first, 0 KB JS за замовчанням, content collections |
| TypeScript   | 5.7.2 (strict)                     | Безпека типів, краще DX                                   |
| Tailwind CSS | 4.2.x                              | Дизайн через утилітарні класи, токени в одному файлі      |
| Zod          | 4.4.x                              | Валідація frontmatter на білд-тайм                        |
| Node         | 22.13+ (фіксується через `.nvmrc`) | Підтримуваний runtime для Astro 6                         |

**Чому Astro:** статика → дешевий хостинг, висока швидкість, добра SEO, легко форкнути в template.

**Чому TypeScript strict:** на проєкті MVP-розміру ціна підтримки нульова, на template-розмірі заощаджує години.

**Чому frontmatter + Zod:** контент окремо від коду; помилка в .md обвалює білд → не пропустимо у прод.

**Чому Tailwind:** для template-сімейства потрібно 1 файл (`tailwind.config.mjs`) + 1 контент-теку — і новий сайт майже готовий. Інші CSS-підходи (CSS-in-JS, CSS modules) вимагали б більше переробки на форк.

---

## 3. Архітектура

### Принцип розділення

```
content/                        ← окремо від коду; те, що змінюється на форку
├── eras.json                   ← 5 ер шкільних програм 1991–2026
└── facts/<subject>/*.md        ← один .md = один факт

src/
├── config/site.ts              ← бренд, домен, CTA, monobank URL — single source of truth
├── components/                 ← generic-компоненти (FactCard, YearInput, ...)
├── content.config.ts           ← Zod-схеми колекцій
├── lib/                        ← доменна логіка (eras.ts, filterFacts.ts, url.ts)
├── layouts/                    ← Base layout
├── pages/                      ← index, [year], subject/[id], era/[slug], fact/[slug]
└── styles/global.css

tailwind.config.mjs             ← дизайн-токени (єдине джерело правди для дизайну)
```

### Як зробити форк під новий сайт серії

1. Клонуй репо.
2. Заміни `content/eras.json` на власний параметр (наприклад, «рік народження → покоління»).
3. Заміни `content/facts/` на свій тематичний контент (з frontmatter за схемою).
4. Онови `src/config/site.ts` (назва, домен, monobank, ЦА).
5. Онови `tailwind.config.mjs` (палітра, шрифти).
6. Заміни `src/lib/eras.ts` на свою mapper-функцію `параметр → бекет`.
7. `npm install && npm run build` — готово.

**Що НЕ треба чіпати** на форку: компоненти, layouts, маршрутизацію, CI, deploy.

---

## 4. Дизайн: «3+1» (гібрид)

**База:** Mineral (clean minimalism, кремовий фон, Unbounded+Geist).
**Акцент:** Schoolbook (моно для років, темно-синій, ледь помітна паперова фактура).

| Елемент | Рішення                                                                |
| ------- | ---------------------------------------------------------------------- |
| Палітра | Кремовий фон, темно-синій (#1e3a8a) як основний, бурштин — другорядний |
| Шрифти  | Unbounded (заголовки), Geist (текст), JetBrains Mono (числа/роки)      |
| Картки  | Білий фон, ледь піднята тінь, hover-анімація                           |
| Hero    | Дуже легка фактура «лінованого паперу» (8% opacity)                    |
| Роки    | Завжди моноширинно: і input, і пілюлі в картках, і «ВИПУСК YYYY»       |
| Тон UI  | Стриманий, не кітчевий, без ностальгійного штампу                      |

**Дизайн-лабораторія** (`/themes.html`) залишається на сайті як довідка з 4 початковими варіантами (Mineral, Editorial, Schoolbook, Ukrainian) — не видалятимемо без явного дозволу.

**Дизайн-токени.** Усі — в `tailwind.config.mjs`. Не хардкодимо кольори, шрифти, відступи в компонентах. Це гарантія того, що форк змінює тему через один файл.

---

## 5. Контент

### Цільовий обсяг

**11 предметів підтримуються у схемі/CMS/UI і всі заповнені — 175 фактів сумарно** (15–16 на предмет). Базовий пак 5 предметів у PR-ах #3, #4, #5, #16, #17 (astronomy, biology, geography, history, physics); нові 6 предметів — PR-и #53 (tech), #54 (culture), #56 (ecology), #72 (medicine), #75 (economy), #76 (sport). PR #63 додав `quote` / `before` / `after` / `impact: high` 32 ключовим фактам. PR #116 додав ще 10 фактів у різні предмети (165 → 175).

### Стан батчів

| Предмет   | Гілка                     | PR                                                      | Статус                                       |
| --------- | ------------------------- | ------------------------------------------------------- | -------------------------------------------- |
| Astronomy | `devin/content-astronomy` | [#3](https://github.com/Skords-01/BACK_FUTURE/pull/3)   | MERGED                                       |
| Biology   | `devin/content-biology`   | [#4](https://github.com/Skords-01/BACK_FUTURE/pull/4)   | MERGED (з виправленнями про війну 2014/2022) |
| Geography | `devin/content-geography` | [#5](https://github.com/Skords-01/BACK_FUTURE/pull/5)   | MERGED                                       |
| History   | `devin/content-history`   | [#16](https://github.com/Skords-01/BACK_FUTURE/pull/16) | MERGED                                       |
| Physics   | `devin/content-physics`   | [#17](https://github.com/Skords-01/BACK_FUTURE/pull/17) | MERGED                                       |
| Tech      | —                         | [#53](https://github.com/Skords-01/BACK_FUTURE/pull/53) | MERGED                                       |
| Culture   | —                         | [#54](https://github.com/Skords-01/BACK_FUTURE/pull/54) | MERGED                                       |
| Ecology   | —                         | [#56](https://github.com/Skords-01/BACK_FUTURE/pull/56) | MERGED                                       |
| Medicine  | —                         | [#72](https://github.com/Skords-01/BACK_FUTURE/pull/72) | MERGED                                       |
| Economy   | —                         | [#75](https://github.com/Skords-01/BACK_FUTURE/pull/75) | MERGED                                       |
| Sport     | —                         | [#76](https://github.com/Skords-01/BACK_FUTURE/pull/76) | MERGED                                       |

### Український внесок (ціль: 3+ фактів на предмет)

| Предмет   | Українські факти                                                                                                                                               |
| --------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Astronomy | Леонід Каденюк (1997), Клим Чурюмов / Розетта (2014), Січ-2-30 (2022)                                                                                          |
| Biology   | Кінь Пржевальського в Чорнобилі, Інститут рослинництва ім. Юр'єва (2022), Superhumans Center (2023)                                                            |
| Geography | Окупація Криму (2014), дерусифікація топонімів (2015+/2023), Каховська ГЕС (2023), Чорнобильський біосферний заповідник (2016)                                 |
| History   | Голодомор як геноцид, Революція Гідності, відкриття архівів КГБ, борці за незалежність, Томос ПЦУ, мовний закон, корінні народи Криму, борщ і писанка в ЮНЕСКО |
| Physics   | Україна в CERN, харківські сцинтилятори для CERN, харківське «Джерело нейтронів»                                                                               |
| Tech      | Український IT-сектор є серед лідерів експорту; Diia як експорт e-government; PE-спрощенка для IT (PR #53)                                                     |
| Medicine  | Реформа НСЗУ (2017), Helsi.me їк цифровий вхід, Програма медичних гарантій (PR #72)                                                                            |
| Economy   | ПриватБанк 2016/Центробанк НБУ, ProZorro, вихід з СНД, МВФ (PR #75)                                                                                            |
| Culture   | Борщ в ЮНЕСКО, Onuka, Pinchuk Art Centre / DAU, «Кіборги» (PR #54)                                                                                             |
| Sport     | Брати Клички, Андрій Шевченко, Saturn 2008, Державний фонд ОЛІМП-бази (PR #76)                                                                                 |
| Ecology   | Чорнобильський заповідник (2016), Каховська ГЕС (2023), воєнні викиди CO₂ в Україні (PR #56)                                                                   |

### Стиль і вимоги (повний гайд: `docs/content-guidelines.md`)

- **Тон:** науково-популярний, нейтральний, проукраїнський, без агітації.
- **Структура:** title ≤80 chars, short 20-280 chars (Zod-валідація!), body 3-5 абзаців.
- **Джерела:** мінімум 1 першоджерело (academic / official); уникати Wikipedia як єдиного.
- **«Чутливі формулювання» (нова секція в `docs/content-guidelines.md` після PR #4):**
  - **Війна:** «російсько-українська війна (з 20 лютого 2014)», «повномасштабне вторгнення (з 24 лютого 2022)». Ніколи не «війна 2022». Не «спецоперація» / «конфлікт».
  - **Голодомор:** завжди як «геноцид українського народу 1932–1933».
  - **Крим:** «окупація», не «анексія».
  - **Топоніми:** Kyiv (не Kiev), Odesa (не Odessa), Chornobyl (не Chernobyl), Kharkiv (не Kharkov).

---

## 6. Дорожня карта (24 пункти від користувача)

Всі пункти проговорені й погоджені. Статуси:

### 🔥 Швидкі вау-фішки

| #   | Пункт                                 | Згода | Статус                                                                                                                                                                                                                                                                                                        |
| --- | ------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Динамічна OG-картка по року           | ✓     | Done: SVG у [#20](https://github.com/Skords-01/BACK_FUTURE/pull/20), PNG у [#43](https://github.com/Skords-01/BACK_FUTURE/pull/43) (`@resvg/resvg-js`).                                                                                                                                                       |
| 2   | Шер-кнопки + копіювання посилання     | ✓     | Done у [#21](https://github.com/Skords-01/BACK_FUTURE/pull/21).                                                                                                                                                                                                                                               |
| 3   | Лічильник «База: N фактів» у хедері   | ✓     | Done у [#22](https://github.com/Skords-01/BACK_FUTURE/pull/22).                                                                                                                                                                                                                                               |
| 4   | Анімовані тізери на лендингу          | ✓     | Done у [#107](https://github.com/Skords-01/BACK_FUTURE/pull/107) і [#115](https://github.com/Skords-01/BACK_FUTURE/pull/115): staggered entrance для timeline rows, magnetic 3D tilt на fact cards, slot-machine GO, glitch reveal року, DensityStrip tooltip. Усі ефекти поважають `prefers-reduced-motion`. |
| 5   | Сторінка `/share/[year]` (PNG-постер) | ✓     | Pending (залежить від #1.3)                                                                                                                                                                                                                                                                                   |

### 🧠 Контент

| #   | Пункт                              | Згода      | Статус                                                                                                                                                                                      |
| --- | ---------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 6   | 75 фактів (15 на предмет)          | ✓ (більше) | Done. 11/11 батчів готові — 175 фактів сумарно (15–16 на предмет після +10 у [#116](https://github.com/Skords-01/BACK_FUTURE/pull/116)).                                                    |
| 7   | Прив'язка до тем шкільної програми | ✓          | Pending                                                                                                                                                                                     |
| 8   | Розділ «Підручники» з обкладинками | ⊘ (можемо) | Pending                                                                                                                                                                                     |
| 9   | `/timeline` — хронологія           | ✓          | Done у [#93](https://github.com/Skords-01/BACK_FUTURE/pull/93) і [#97](https://github.com/Skords-01/BACK_FUTURE/pull/97): Variant A (вертикальна вісь, era jump-strip, dark-mode contrast). |
| 10  | Українські теми як окремий бекет   | ✓ обов'яз. | Робиться по ходу через `region: "ukraine"` і українські добірки у фактах                                                                                                                    |

### 🎮 Інтерактив

| #   | Пункт                                | Згода       | Статус                                                                                                                                                                                                    |
| --- | ------------------------------------ | ----------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 11  | Квіз «вгадай рік відкриття»          | ✓           | Done у [#109](https://github.com/Skords-01/BACK_FUTURE/pull/109) (`/quiz`, 5 питань, вся логіка клієнтська) + [#111](https://github.com/Skords-01/BACK_FUTURE/pull/111) (фікс leak року у question card). |
| 12  | «Тоді vs зараз» (порівняльна картка) | ✓ обов'яз.  | Done у [#28](https://github.com/Skords-01/BACK_FUTURE/pull/28) — поля `before` / `after` у `content.config.ts` + рендер у FactCard.                                                                       |
| 13  | «Школа в режимі реального часу»      | ⊘ (можливо) | Pending — низький пріоритет                                                                                                                                                                               |

### 💰 Монетизація

| #   | Пункт                         | Згода         | Статус                      |
| --- | ----------------------------- | ------------- | --------------------------- |
| 14  | Партнерство з видавництвами   | ⊘ (розгляд)   | Pending — після запуску     |
| 15  | Реферал на Prometheus / EdEra | відкрите пит. | Не рухаємось до явної згоди |
| 16  | Замовний контент для бізнесу  | ⊘ (як план)   | Pending (post-launch)       |
| 17  | Подяки на about-сторінці      | ⊘ (можна)     | Pending                     |

> Monobank-банка наразі **не вказана** в `src/config/site.ts` — користувач створить пізніше і дасть URL.

### 🔧 Інфраструктура

| #   | Пункт                                 | Згода | Статус                                                                                                                                                                                                                                                                                                                                                                                                  |
| --- | ------------------------------------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 18  | Реальний домен + Vercel/Cloudflare    | ✓     | Pending — після контенту                                                                                                                                                                                                                                                                                                                                                                                |
| 19  | Plausible / simpleanalytics           | ✓     | Done у [#44](https://github.com/Skords-01/BACK_FUTURE/pull/44) (Plausible / Umami); розширено у [#117](https://github.com/Skords-01/BACK_FUTURE/pull/117) (PostHog + Sentry + GSC, env-gated), [#131](https://github.com/Skords-01/BACK_FUTURE/pull/131) (інструментація PostHog подій і фунелів) і [#132](https://github.com/Skords-01/BACK_FUTURE/pull/132) (modern query API для dashboard-as-code). |
| 20  | Decap / Sveltia CMS поверх `content/` | ✓     | Частково: Sveltia CMS config є, production auth ще потребує налаштування.                                                                                                                                                                                                                                                                                                                               |
| 21  | GitHub Actions: link checker і ширше  | ✓     | Done. CI у `.github/workflows/ci.yml` + `link-check.yml`; internal docs/build links блокують, зовнішні `sources[].url` — warning-only.                                                                                                                                                                                                                                                                  |
| 22  | i18n-ready (`content/uk/`)            | ✓     | Pending — структурно, без перекладів                                                                                                                                                                                                                                                                                                                                                                    |

### 🚀 Масштаб

| #   | Пункт                                    | Згода | Статус                       |
| --- | ---------------------------------------- | ----- | ---------------------------- |
| 23  | Винести в template-репо                  | ✓     | Pending — після стабілізації |
| 24  | Спільна дизайн-система (Tailwind preset) | ✓     | Pending — разом із #23       |

---

## 7. Хронологія прийнятих рішень

### Сесія 1 (PR #1) — MVP

- Поскрафлений каркас Astro+TS+Tailwind.
- 5 sample-фактів для перевірки логіки.
- 39 сторінок (1991–2026 + index, about, metodologia).
- **Багфікс:** на статичному хостингу devinapps (S3) роути `/2007/` не резолвились → перейшли на формат `.html` (`/2007.html`). На реальному прод-хосту (Vercel/Netlify/Cloudflare Pages) `.html` ховається в clean URL автоматично.
- CI workflow початково в `docs/proposed-ci/` (токен сесії не мав `workflow`-скоупу). Пізніше мігрований у `.github/workflows/ci.yml`.

### Сесія 2 (PR #2) — Дизайн

- Створено `/themes.html` — дизайн-лабораторія з 4 муудами.
- Користувач обрав **«3+1»**: Mineral база + Schoolbook акценти.
- Темно-синій акцент, моно для років, легка паперова фактура.

### Сесія 3 (PR #3) — Астрономія

- 14 нових фактів + Pluto (з MVP) = 15.
- 3 українські: Каденюк, Чурюмов, Січ-2-30.

### Сесія 4 (PR #4) — Біологія

- 14 нових + CRISPR (з MVP) = 15.
- 3 українські: коні Пржевальського, Юр'євський генбанк, Superhumans.
- **Виправлення термінології війни** (за фідбеком користувача): війна з 2014, повномасштабна фаза з 2022. Виправлено в 4 фактах + Голодомор. Доданий розділ «Чутливі формулювання» в `docs/content-guidelines.md`.

### Сесія 5 (PR #5) — Географія

- 14 нових + South Sudan (з MVP) = 15.
- 4 українські: Крим (2014), дерусифікація топонімів, Каховська ГЕС, Чорнобильський заповідник.
- Світ: Türkiye, Eswatini, North Macedonia, Czechia, East Timor, Bougainville, Hong Kong, Brexit, Aral, Greenland.

### Сесія 6 (PR #16) — Історія

- 14 нових + Голодомор (з MVP/попередніх правок) = 15.
- 9 українських: Помаранчева революція, Революція Гідності, відкриття архівів радянських репресивних органів, борці за незалежність, Томос ПЦУ, мовний закон, корінні народи Криму, борщ і писанка в ЮНЕСКО.
- Світ: Римський статут і МКС, Göbekli Tepe, Річард III через ДНК, ямна культура й давня ДНК, Нобель за палеогеноміку.

### Сесія 7 (PR #17) — Фізика

- 14 нових + бозон Хіггса (існуючий факт) = 15.
- 3 українські: Україна як асоційований член CERN, харківські сцинтилятори для CERN, харківське підкритичне «Джерело нейтронів».
- Світ: топ-кварк, бозе-ейнштейнівський конденсат, нейтринні осциляції, графен, антиводень у пастці, гравітаційні хвилі, перевизначення SI, термоядерне запалювання NIF, квантова заплутаність, атосекундні імпульси, гравітація антиматерії.

### Сесія 8 (PR #20–#23) — Швидкі вау-фішки

- [#20](https://github.com/Skords-01/BACK_FUTURE/pull/20) — динамічна SVG-OG картка по року (`/og/[year].svg`, `/og/default.svg`).
- [#21](https://github.com/Skords-01/BACK_FUTURE/pull/21) — шер-кнопки + native share (`navigator.share`) + копіювання посилання.
- [#22](https://github.com/Skords-01/BACK_FUTURE/pull/22) — глобальний `Header`/`Footer`, лічильник «N фактів», breadcrumb на `/[year]`. Закриває пункти #3 і #1.5 з roadmap.
- [#23](https://github.com/Skords-01/BACK_FUTURE/pull/23) — fallback для років без фактів (декадні чіпи з кращими навігаційними намісцями).

### Сесія 9 (PR #25–#28) — Фундамент і контент-схема

- [#25](https://github.com/Skords-01/BACK_FUTURE/pull/25) — додано `docs/roadmap.md` і `docs/ideas.md`. Розбиття на 9 фаз і ~40 PR-ів.
- [#26](https://github.com/Skords-01/BACK_FUTURE/pull/26) — фаза 0.1: видалено `docs/proposed-ci/`, фікс Prettier на `roadmap.md`, фікс e2e після #22 (новий aria-label у breadcrumb).
- [#27](https://github.com/Skords-01/BACK_FUTURE/pull/27) — фаза 0.2: Vitest + 25 юніт-тестів для `src/lib/` (`eras.ts`, `filterFacts.ts`, `url.ts`). Покриття `src/lib/` ≥ 80%. Додано `npm run test:unit` крок у CI.
- [#28](https://github.com/Skords-01/BACK_FUTURE/pull/28) — фаза 2.1: опційні поля `before` / `after` у `content.config.ts` + рендер блоку «Тоді / Зараз» у `FactCard`. Заповнено для трьох якірних фактів MVP (Pluto, CRISPR, Аральське море).

### Сесія 10 (PR #29–#33) — Фаза 1: UX-швидкі перемоги

- [#29](https://github.com/Skords-01/BACK_FUTURE/pull/29) — фаза 1.7: кастомний 404 з полем року й посиланням на головну.
- [#30](https://github.com/Skords-01/BACK_FUTURE/pull/30) — фаза 1.8: кнопка «Сюрприз» на лендингу (рандомний рік у діапазоні `SITE.yearMin..yearMax`).
- [#31](https://github.com/Skords-01/BACK_FUTURE/pull/31) — фаза 1.4: JSON-LD `Article` + `BreadcrumbList` на `/[year]`.
- [#32](https://github.com/Skords-01/BACK_FUTURE/pull/32) — фаза 1.6: sticky-підсумок з якорями-чіпами на предмети, з обробником прокрутки для активного chip'а.
- [#33](https://github.com/Skords-01/BACK_FUTURE/pull/33) — фаза 1.2: темна тема. Class-based (через `<html class="dark">`), pre-paint скрипт у `Base.astro` запобігає FOUC. `ThemeToggle` компонент: light → dark із 3-м станом «system» (відсутність ключа в `localStorage`). Усі компоненти й сторінки оновлені з `dark:` варіантами; `global.css` має `@variant dark` і CSS vars під темну тему.

### Сесія 11 (PR #35–#39) — Фаза 2 закрита, відкриваємо фазу 3

- [#35](https://github.com/Skords-01/BACK_FUTURE/pull/35) — фаза 3.3: розширений fallback на `[year].astro`. До декадних чіпів із #23 додали теги фактів-«сусідів» з тієї ж ери. `pickFallbackYears(forYear, facts)` + `sampleFacts(facts, n)` в `src/lib/filterFacts.ts`, обидві детерміністичні (юніт-покриття в `filterFacts.test.ts`).
- [#36](https://github.com/Skords-01/BACK_FUTURE/pull/36) — фаза 2.2: опц. поле `region: "world" | "ukraine"` у `content.config.ts`. На FactCard для `ukraine` малюється прапор і капс-підпис «УКРАЇНСЬКИЙ ВНЕСОК» (`title` для hover, `aria-label`); `world` — нічого не рендериться. Гайд по content `region` в `docs/content-guidelines.md`.
- [#37](https://github.com/Skords-01/BACK_FUTURE/pull/37) — фаза 2.3: опц. поле `updatedAt` (`z.coerce.date().refine(≤ now)`) + новий хелпер `src/lib/format.ts` (`formatUkDate`, `formatUkShortDate`, `isoDate`) з юніт-тестами. На картці поряд з роком події — «оновл. DD.MM.YYYY» (`<time datetime>` + svg-іконка таймера). У гайді прописано жорсткий правило: `updatedAt` виставляється тільки при зміні змісту, не косметиці.
- [#38](https://github.com/Skords-01/BACK_FUTURE/pull/38) — фаза 2.4: опц. поле `impact: "low" | "medium" | "high"`. Дефолт «undefined» ≡ medium. Для `"high"` на FactCard появляється бейдж «★ Віха» і м'яка акцентна рамка. Критерії прописані: high — «переломний» факт (~10–15% бібліотеки), якщо вагаєшся — medium.
- [#39](https://github.com/Skords-01/BACK_FUTURE/pull/39) — фаза 3.1: `/subject/[id]` (5 сторінок через `getStaticPaths`). Hero + breadcrumbs + sticky-навігація по ерах (лінки на репрезентативний рік) + грід FactCard´ів + footer з посиланнями на інші предмети. JSON-LD `CollectionPage` + `BreadcrumbList`. Нові хелпери `factsForSubject` і `eraCountsForSubject` у `src/lib/filterFacts.ts` (з юніт-тестами).

### Сесія 12 (PR #41–#51) — Інфра, Astro 6 і перші 5 backlog-задач

- [#41](https://github.com/Skords-01/BACK_FUTURE/pull/41) — розширене групування Dependabot.
- [#42](https://github.com/Skords-01/BACK_FUTURE/pull/42) — Husky + lint-staged pre-commit.
- [#43](https://github.com/Skords-01/BACK_FUTURE/pull/43) — OG PNG (`/og/[year].png`, `/og/default.png`) через `@resvg/resvg-js`.
- [#44](https://github.com/Skords-01/BACK_FUTURE/pull/44) — Plausible / Umami як опційна privacy-friendly аналітика.
- [#49](https://github.com/Skords-01/BACK_FUTURE/pull/49) — `npm run dump:source-urls` генерує markdown-список унікальних `sources[].url`.
- [#50](https://github.com/Skords-01/BACK_FUTURE/pull/50) — окремий markdownlint-конфіг для `content/facts/`.
- [#51](https://github.com/Skords-01/BACK_FUTURE/pull/51) — перші 5 задач: `/era/[slug]`, `/fact/[slug]`, фільтри року (`subject`, `era`, `region`, `impact`), розширення `SUBJECTS` до 11 і warning-only Lychee-крок для зовнішніх fact source URL.

### Сесія 13 — Фаза 8.1: SVG-іконки предметів

- Додано `src/lib/subjectIcons.ts` — реєстр з 11 inline-SVG path-сетами (24×24, stroke-only, `currentColor`). Гліфи: Saturn, ДНК-спіраль, глобус, скрол, атом, мікрочіп, ЕКГ-крива, барчарт, відкрита книга, кубок, лист.
- Додано `<SubjectIcon>` (`src/components/SubjectIcon.astro`) — обгортка над реєстром: робить `<svg viewBox="0 0 24 24">`, виставляє `aria-hidden` за замовчуванням і `role="img"` + `<title>` коли передано `label`. Розмір — `1em`, тож наслідує `text-*`.
- Замінено emoji-плейсхолдери на `<SubjectIcon>` у `src/pages/[year].astro` (тізери), `src/pages/subject/[id].astro` (хедер + «Інші предмети»), `src/pages/era/[slug].astro` (sticky-чіпи + sub-headers), `src/pages/fact/[slug].astro` (бейдж предмета) і `src/components/SubjectSection.astro` (хедер секції; пропс `emoji` прибрано — компонент тепер бере знак сам).
- `SUBJECTS[].emoji` лишається для `src/lib/og.ts` (resvg рендерить його зі системних шрифтів) і потенційного дегрейду; `groupBySubject` теж не чіпали — поле в публічному API.
- Юніт-тести: `src/lib/subjectIcons.test.ts` перевіряє, що 1) реєстр співпадає з `SUBJECTS` 1:1, 2) кожен запис містить хоча б одну SVG-фігуру, 3) ніхто не вкладає `<svg>` усередину, 4) `subjectIconPaths()` — тонка обгортка над реєстром.

### Сесія 14 (PR #53–#76) — Наповнення нових предметів і quote-upgrade

- [#53](https://github.com/Skords-01/BACK_FUTURE/pull/53) — 15 фактів у `tech` (12 world + 3 ukraine).
- [#54](https://github.com/Skords-01/BACK_FUTURE/pull/54) — 15 фактів у `culture`.
- [#56](https://github.com/Skords-01/BACK_FUTURE/pull/56) — 15 фактів у `ecology`.
- [#63](https://github.com/Skords-01/BACK_FUTURE/pull/63) — додано `quote` / `before` / `after` / `impact: high` для 32 ключових фактів з усіх предметів.
- [#72](https://github.com/Skords-01/BACK_FUTURE/pull/72) — 15 фактів у `medicine`.
- [#75](https://github.com/Skords-01/BACK_FUTURE/pull/75) — 15 фактів у `economy`.
- [#76](https://github.com/Skords-01/BACK_FUTURE/pull/76) — 15 фактів у `sport`. Після цих PR-ів усі 11 предметів мають 15 фактів, разом 165. PR [#116](https://github.com/Skords-01/BACK_FUTURE/pull/116) додав ще 10 фактів у різні предмети (165 → 175).

### Сесія 15 (PR #82–#97) — Мобільна оптимізація, фонти, badge, `/timeline`, `/fact` UX

- [#82](https://github.com/Skords-01/BACK_FUTURE/pull/82) — Playwright `mobile-chrome` проєкт (Pixel 7) + 375px smoke pack.
- [#83](https://github.com/Skords-01/BACK_FUTURE/pull/83) — справжнє burger-меню у `Header.astro` (закриває #1.1) з a11y-зв'язкою (`aria-controls`, `aria-expanded`, `Esc` для закриття).
- [#84](https://github.com/Skords-01/BACK_FUTURE/pull/84) — touch targets ≥44×44 на ключових елементах (частина #5.2).
- [#85](https://github.com/Skords-01/BACK_FUTURE/pull/85) — self-host Geist + Fraunces + IBM Plex Mono Cyrillic 400 з `/public/fonts/` (закриває #8.2).
- [#86](https://github.com/Skords-01/BACK_FUTURE/pull/86) — Lora як кириличний display-fallback для Fraunces (Fraunces не підтримує кирилицю).
- [#87](https://github.com/Skords-01/BACK_FUTURE/pull/87) — IBM Plex Mono Cyrillic 500 + 600 (раніше лише 400).
- [#88](https://github.com/Skords-01/BACK_FUTURE/pull/88) — `vercel.json` з `Cache-Control: public, max-age=31536000, immutable` на `/fonts/*`.
- [#89](https://github.com/Skords-01/BACK_FUTURE/pull/89) — виправлено баг: sticky-header не прилипав на мобільних через `overflow-x: clip` на body. Залишили властивість лише на `<html>`. + regression-тест у `tests/e2e/mobile.spec.ts`.
- [#90](https://github.com/Skords-01/BACK_FUTURE/pull/90) — `/timeline`: dark-mode contrast fixes на era jump-strip pills.
- [#91](https://github.com/Skords-01/BACK_FUTURE/pull/91) — бейдж «Веха» → «Віха» (правильна укр. форма).
- [#92](https://github.com/Skords-01/BACK_FUTURE/pull/92) — inline explainer «★ Віха — переломний факт» на `FeatureFactCard` + легенда позначок (★ Віха / UA) на `/timeline`.
- [#93](https://github.com/Skords-01/BACK_FUTURE/pull/93) — `/timeline` (Variant A): вертикальна вісь, dot-on-axis, era jump-strip, JSON-LD `ItemList`, фільтри за ery/region/impact/subject. Закриває #6.2.
- [#94](https://github.com/Skords-01/BACK_FUTURE/pull/94) — reading progress bar (3px, scaleX, requestAnimationFrame) на `/fact/[slug]`.
- [#95](https://github.com/Skords-01/BACK_FUTURE/pull/95) — floating pill «← До YYYY» (back-to-year) на `/fact/[slug]` з двома IntersectionObserver-ами (hero вийшов з viewport-у І support ще не увійшов).
- [#96](https://github.com/Skords-01/BACK_FUTURE/pull/96) — винесено `[data-reveal]`-observer у `RevealObserver.astro`, підключено у `Base.astro`, розширено на `/subject/[id]`, `/era/[slug]`, `/timeline`.
- [#97](https://github.com/Skords-01/BACK_FUTURE/pull/97) — dark-mode contrast: header bg, ThemeToggle (`aria-label`), `Footer`, `metodologia` cards.

### Сесія 16 (PR #99–#117) — Pagefind, `/quiz`, observability, Big Mac index, редизайн епох

- [#99](https://github.com/Skords-01/BACK_FUTURE/pull/99) — docs-drift refresh: roadmap і project-memory після PR-ів #82–#97.
- [#100](https://github.com/Skords-01/BACK_FUTURE/pull/100) — bulk replace `dark:bg-ink-{700,800,900}` → `--card` у 14 файлах (footer, year quick-pills, тематичні блоки, фільтри, ShareBlock, SupportBlock, FactCard/FeatureFactCard, btn-ghost, 404, metodologia, timeline). `dark:hover:text-ink-100` → `dark:hover:text-ink-900`.
- [#101](https://github.com/Skords-01/BACK_FUTURE/pull/101) — inline OG preview card у ShareBlock (Telegram/X-style: title + canonical + 1200×630 OG-зображення). Робить link також відкривачем у новій вкладці.
- [#102](https://github.com/Skords-01/BACK_FUTURE/pull/102) — exclude `d/` (handoff/reference: HANDOFF.md, app.jsx, styles.css, Redesign.html) з prettier і markdownlint.
- [#103](https://github.com/Skords-01/BACK_FUTURE/pull/103) — `factsForYear` тепер сортує **за зростанням** (oldest first); один тест `filterFacts.test.ts` оновлено.
- [#104](https://github.com/Skords-01/BACK_FUTURE/pull/104) — додано «Головна» як перший nav-link; e2e keyboard-nav тест оновлено.
- [#105](https://github.com/Skords-01/BACK_FUTURE/pull/105) — a11y-фікс: видимий «гігантський рік» **сам стає `h1`** (з `aria-label="Випуск {year}"`); раніше він був прихований через `clip:rect(0,0,0,0)` і Playwright `toBeVisible()` падав.
- [#106](https://github.com/Skords-01/BACK_FUTURE/pull/106) — заміна IBM Plex Mono → JetBrains Mono (cyrillic + latin, 400/500/600). Self-hosted .woff2 у `/public/fonts/`.
- [#107](https://github.com/Skords-01/BACK_FUTURE/pull/107) — 5 design-effects: staggered entrance (cascading delay 65ms на timeline rows), magnetic 3D tilt на fact cards (`perspective(1200px) rotateX/Y`, hover-only, touch-safe), slot-machine GO (odometer-цифри крутяться випадково перед навігацією), glitch reveal year-h1 (CRT-scramble на page load), DensityStrip rich tooltip (фіксована позиція, year + count + era stripe). Усі ефекти поважають `prefers-reduced-motion`.
- [#108](https://github.com/Skords-01/BACK_FUTURE/pull/108) — 5 mobile UX: Hero clamp-text + менший top-margin на mobile, MissedCounter `flex-col` на mobile, EraGrid 5-та картка `col-span-2` на mobile, DensityStrip horizontal touch-scroll (min-width 540px), SubjectFilters tracks `--header-h` через `ResizeObserver` у Header.
- [#109](https://github.com/Skords-01/BACK_FUTURE/pull/109) — **Pagefind search** (`pagefind ^1.3.0`, build script `pagefind --site dist`, `SearchDialog.astro` з lazy-load `/pagefind/pagefind-ui.{js,css}`, native `<dialog>`, Cmd/Ctrl+K), `data-pagefind-body` на `<main>` обмежує індекс. Search-кнопка у Header перед ThemeToggle. **`/quiz`-сторінка** + scroll-animations + about/metodologia редизайн. Закриває **#4.1 Pagefind** і **#6.4 квіз**.
- [#110](https://github.com/Skords-01/BACK_FUTURE/pull/110) — sync `package-lock.json` з pagefind (#109 змерджився без оновленого lock; npm ci падав на Vercel).
- [#111](https://github.com/Skords-01/BACK_FUTURE/pull/111) — quiz: маска 4-цифрових років у question card (щоб відповідь не прокидалася); `eras.json` short вирівняно з educational range; ThenAside показує рік сторінки як headline; about редагування «Що це не» → «Наші принципи»; Pagefind пошукові терміни обгорнуті в quotes (`"голка"` не матчить `гол`); SERGEANT_GROUP brand-блок у footer.
- [#112](https://github.com/Skords-01/BACK_FUTURE/pull/112) — прибрано парентезу «(найближчі дані — XXXX р.)» у ThenAside — створювала помилкове враження застарілості.
- [#113](https://github.com/Skords-01/BACK_FUTURE/pull/113) — «Борщовий набір» з реальними цінами по роках у `content/epoch/*.json`.
- [#114](https://github.com/Skords-01/BACK_FUTURE/pull/114) — користувач передумав: «Борщовий набір» → **«Біг Мак»** (Big Mac index від The Economist + OBOZ.UA archive). 1995 — «не існував» (McDonald's відкрився у Києві 24.05.1997).
- [#115](https://github.com/Skords-01/BACK_FUTURE/pull/115) — динамічні анімації + LED flicker + hover-effects + interactive timeline tooltips + global search.
- [#116](https://github.com/Skords-01/BACK_FUTURE/pull/116) — project evaluation recommendations: `/themes` redirect → 404 у production (dev-only лабораторія), `Analytics.astro` warns у dev коли provider не налаштований, NetlifyCMS admin files прибрано, **`src/lib/userState.ts`** (localStorage: last visited year + read-tracking через IntersectionObserver), lazy fade-in карток на `/all`, **+10 нових фактів** (165 → 175).
- [#117](https://github.com/Skords-01/BACK_FUTURE/pull/117) — **observability**: Sentry (error tracking з error/replay sample-rate), PostHog (privacy-friendly product analytics), Google Search Console verification meta tag. Усе env-gated: без DSN/KEY жоден SDK не вантажиться (нульовий runtime). PostHog розширено в [#131](https://github.com/Skords-01/BACK_FUTURE/pull/131) і [#132](https://github.com/Skords-01/BACK_FUTURE/pull/132).

### Сесія 17 (PR #118–#125) — Top-N quick wins, мобільні фікси, редизайн карток

- [#118](https://github.com/Skords-01/BACK_FUTURE/pull/118) — mobile UX: freeze 3D tilt коли `<details>` відкритий (щоб розгорнутий текст не качався); `min-h-[44px]` на «Постійна сторінка»; auto-scroll розгорнутих details у viewport на touch; джерела `block + py-1.5` для більших tap-areas.
- [#119](https://github.com/Skords-01/BACK_FUTURE/pull/119) — top-5 UX: thin reading-progress bar на year pages, BackToTop floating button (з'являється після 300px), Hero «Випадковий рік» + «Повернутись до N» pill з localStorage (закриває **#4.3 «Мій рік» persist**), keyboard nav `←`/`→` між роками на `[year]`, kbd-hint у YearNav.
- [#120](https://github.com/Skords-01/BACK_FUTURE/pull/120) — 3 UI-engagement improvements + trailing comma fix у IntersectionObserver call.
- [#121](https://github.com/Skords-01/BACK_FUTURE/pull/121) — top-3 quick wins: BackToTop fade fix (toggle `.is-visible` class замість `[hidden]` атрибуту, бо display:none ігнорує CSS-transitions), keyboard nav guard `dialog[open]` (щоб `←`/`→` не навігували коли SearchDialog відкритий), `npm run ci` script.
- [#122](https://github.com/Skords-01/BACK_FUTURE/pull/122) — Sentry: міграція на `@sentry/astro v10` config layout (`sentry.client.config.ts` + `sentry.server.config.ts`).
- [#123](https://github.com/Skords-01/BACK_FUTURE/pull/123) — `/timeline` mobile: cards collapsed by default; thin axis (28px замість 80px). Year + delta переїхали з лівого rail у FactCard meta row.
- [#124](https://github.com/Skords-01/BACK_FUTURE/pull/124) — e2e тести вирівняно з поточним UI: home-сторінка тепер `YearMachine` (stepper + odometer + GoButton anchor + decade QuickPicks), фільтри року перейшли з `<select>` → chip bar (`#subject-filter-bar`), Header має «Квіз»-link, methodology heading «П'ять ер шкільних програм».
- [#125](https://github.com/Skords-01/BACK_FUTURE/pull/125) — об'єднано «Постійна сторінка» + «Докладніше» у один CTA на картках; restore scroll on back navigation.

### Сесія 18 (PR #126–#133) — `ScrollRestore` стійкість, fact-page polish, PostHog інструментація, dead code cleanup

- [#126](https://github.com/Skords-01/BACK_FUTURE/pull/126) — `ScrollRestore` стійкий на iOS Safari та reflow-сценаріях (запис позиції на `scrollend` через debounce, retry на `pageshow`).
- [#127](https://github.com/Skords-01/BACK_FUTURE/pull/127) — `?debug=scroll` діагностичний overlay у `ScrollRestore` (показує state машину у фіксованому overlay).
- [#128](https://github.com/Skords-01/BACK_FUTURE/pull/128) — drop `history.scrollRestoration = "manual"`; restore через `pageshow` на bfcache (Safari/Firefox bfcache конфліктував з `manual`).
- [#129](https://github.com/Skords-01/BACK_FUTURE/pull/129) — `/fact/[slug]` hero cleanup: прибрано grid із трьох білих карток (Регіон/Вплив/Оновлено) і блок з посиланнями на `relevantForEras`. Метадані переїхали в компактний inline-рядок; «Оновлено» показується тільки коли є фактична `updatedAt`.
- [#130](https://github.com/Skords-01/BACK_FUTURE/pull/130) — `/fact/[slug]` mobile padding: `px-7 sm:px-6` на трьох container-prose блоках (28px на mobile, 24px на desktop).
- [#131](https://github.com/Skords-01/BACK_FUTURE/pull/131) — **PostHog інструментація**: `src/lib/analytics.ts` (typed wrapper з `EVENTS`-константами + тести), `Analytics.astro` (persistence=localStorage без cookies, respect_dnt, web_vitals, autocapture, rageclick, dns-prefetch, global outbound link handler `fact_source_clicked` / `outbound_link_clicked`). Інструментовано: `year_submitted` (manual/preset), quick/random pick, era click, subject filter, fact card click, share (target + succeeded), support, **quiz funnel** (start/answer/finish/restart), search (open/query length only/result), theme toggle, back-to-top.
- [#132](https://github.com/Skords-01/BACK_FUTURE/pull/132) — `scripts/posthog-setup.ts`: legacy `filters` API повертав 403 «Creating or updating insights with legacy filters is not available for this user» для нових PostHog акаунтів. Перехід на **modern query API** (`InsightVizNode + TrendsQuery/FunnelsQuery`). Перевірено на реальному B|F project (175241): dashboard + 4 funnels + 7 trends створено успішно.
- [#133](https://github.com/Skords-01/BACK_FUTURE/pull/133) — cleanup: видалено `d/` (дизайн-референс, 4 файли), 3 мертві компоненти (`FeatureFactCard`, `LowFactRow`, `SubjectSection`), Fraunces + Lora woff2 (5 файлів, ~256 KB), IBM Plex Mono woff2 (6 файлів, ~72 KB), `@fontsource/jetbrains-mono` і `@fontsource-variable/unbounded` з dependencies (шрифти self-hosted). У `tailwind.config.mjs` прибрано DM Mono (відсутній) з mono stack. Часткова синхронізація docs (165→175, Manrope/Inter→Unbounded/Geist).

---

## 8. Відкриті питання й відкладені рішення

| Питання                                   | Статус                                                               |
| ----------------------------------------- | -------------------------------------------------------------------- |
| Реферал на Prometheus / EdEra (#15)       | Відкрите. Не рухаємось без явної згоди.                              |
| Розділ «Підручники з обкладинками» (#8)   | «Можна спробувати» — низький пріоритет.                              |
| «Школа в режимі реального часу» (#13)     | «Можливо» — низький пріоритет.                                       |
| Партнерство з видавництвами (#14)         | «Можемо розглянути» — після запуску.                                 |
| Замовний контент для бізнесу (#16)        | «Як план» — після запуску.                                           |
| Реальний домен                            | Pending — користувач визначиться після запуску публічної версії.     |
| Monobank URL                              | Pending — користувач створить банку.                                 |
| Серія схожих сайтів (template extraction) | Далека перспектива; зараз закладена архітектура, екстракція пізніше. |
| Історичний батч                           | Завершено; PR #16 merged.                                            |

---

## 9. Принципи й заборонене

### Гарантовано робимо

- Кожен факт — frontmatter за Zod-схемою; build має пройти.
- Тон і термінологія — за `docs/content-guidelines.md`.
- Кожен PR — feature branch (`devin/content-<тема>` або інше), не push в main.
- Кожен PR — описує зміни в шаблоні `.github/PULL_REQUEST_TEMPLATE.md`.
- Перед PR — `npm run build && npm run lint`.

### Не робимо

- Не перезаписуємо існуючі sample-факти з MVP без явного дозволу.
- Не пишемо одразу всі 75 фактів в одному PR — батчимо по предметах.
- Не робимо Russia-centric framing (явна заборона користувача).
- Не використовуємо «війна 2022» — завжди уточнюємо «з 2014» + «повномасштабна з 24 лютого 2022».
- Не пушимо файли з секретами; не комітимо `.env`.
- Не обмежуємось вікі-джерелами; кожен факт — мінімум 1 першоджерело.
- Не хардкодимо дизайн-токени поза `tailwind.config.mjs`.

---

## 10. Інфраструктурні факти

### Прев'ю

- URL: https://dist-ddwneahj.devinapps.com
- Хостинг: devinapps.com (Devin static deploy)
- Формат файлів: `.html` (через специфіку S3-хосту)
- На реальному прод-домені (Vercel/Netlify/Cloudflare Pages) очікуємо clean URLs.

### Репозиторій

- URL: https://github.com/Skords-01/BACK_FUTURE
- Гілка `main` — релізна
- Гілки `devin/{timestamp}-{slug}` — дефолтна конвенція для Devin-сесій; `devin/content-<тема>` використовувалися раніше для контентних батчів (сесія 1–12).

### Workflow GitHub

- CI YAML у `.github/workflows/ci.yml` (lint, typecheck, validate-content, build, Playwright, Lighthouse).
- Окремий workflow для link-check (`.github/workflows/link-check.yml`): Markdown/docs/build links блокують CI; `dist/.fact-source-urls.md` перевіряється Lychee з `continue-on-error: true`.
- `docs/proposed-ci/` видалено після міграції.

### Token-handling

- Користувач час від часу передає короткоживучий GitHub PAT через secure channel — коли git-проксі / built-in інструменти не справляються (бачили 403 на git-manager.devin.ai, «Internal error» / «Bad credentials» від `git_create_pr` і `git_pr_checks`).
- PAT використовується тільки для git push і curl-викликів GitHub REST API; ніколи не зберігається в коді або історії commit-ів.
- Якщо `git_create_pr` фейлиться, fallback — `POST /repos/{owner}/{repo}/pulls` через curl. Аналогічно для CI-чеків — `GET /repos/{owner}/{repo}/commits/{sha}/check-runs`.
- Рекомендація: створювати PAT на 30 днів зі scope `repo` + `workflow` і відкликати після завершення сесії на https://github.com/settings/tokens.

---

## 11. Що треба знати майбутній сесії — короткий чекліст

1. Прочитати цей документ повністю.
2. Прочитати `docs/content-guidelines.md` (особливо секцію «Чутливі формулювання»).
3. Прочитати `docs/architecture.md` (для розуміння template-генерації).
4. Перевірити `git status` і відкриті PR-и: можливо, частина батчів вже змерджена.
5. Перевірити поточний `main` на стан контенту: `ls content/facts/<subject>/`.
6. Підтвердити з користувачем поточний пріоритет (після PR #133 найімовірніше: `/compare?a=…&b=…`, `/share/[year]` PNG-постер, `/saved` bookmark-факти, issue → draft PR action, `/contributors` (потребує `authors` поля) і `/support`-сторінка (потребує `monobankJarUrl` у `site.ts`), PWA manifest + service-worker, i18n routing `/uk/`/`/en/`).
7. Працювати на feature branch, не пушити в main.
8. Моноширинний шрифт для років, темно-синій для акцентів — НЕ змінювати без явної згоди.
