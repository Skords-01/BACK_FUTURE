# BACK_FUTURE — handoff для Claude Code

Ціль: перенести редизайн (`BACK_FUTURE Redesign.html` + `app.jsx` + `styles.css` як референс) у реальний репо `Skords-01/BACK_FUTURE` (Astro 6 + Tailwind 4 + content collections).

## Як працювати з агентом

1. У Claude Code відкрий клон репо локально.
2. Поклади поруч цей `HANDOFF.md` і три файли прототипу як референс (без коміту в main).
3. Виконуй **по одному PR** на епік. Не змішуй епіки.

---

## Загальні правила (постав у систему агента)

```
Ти — старший фронтенд-інженер у проєкті BACK_FUTURE (Astro 6, Tailwind 4, TypeScript strict).
Стек і конвенції — фіксовані. Дизайн-токени живуть у src/styles/global.css (CSS vars), Tailwind 4 читає їх через @theme.
Шрифти — self-hosted у public/fonts; додавання нового шрифту = додавання @font-face + unicode-range у global.css.
Не додавай нових залежностей без явної згоди. Не вмикай Tailwind v3-стилю темнового режиму — він уже class-based через `@variant dark`.
Не міняй контент-схему (src/content.config.ts) без узгодження.
Кожен компонент — .astro, props типізовані, з коментарем-шапкою «що, чому, обмеження».
Перед PR прогани: npm run lint && npm run test && npm run build && npm run validate:content.
Усі тексти UI — українською. Mono для дат/штампів/метаданих, display для заголовків, body для прози.
Референс: див. HANDOFF.md та файли BACK_FUTURE Redesign.html / app.jsx / styles.css.
```

---

## Епік 0 — Шрифти й токени (підмурок, без UI-змін)

**Промпт:**
```
Ціль: замінити display-шрифт на той, що має повну рідну кирилицю.
Зараз: Fraunces (без UA) → Lora fallback. Україномовний користувач ніколи не бачить display-шрифт.

Зроби:
1. Завантаж Unbounded VF (Cyrillic + Latin subsets) у public/fonts. Джерело — fontsource-variable/unbounded.
2. У src/styles/global.css заміни @font-face блоки Fraunces+Lora на Unbounded (cyrillic + latin-ext + latin), з відповідними unicode-range. Збережи font-display: swap.
3. Онови --font-display у @theme: "Unbounded", "Geist", system-ui, sans-serif.
4. У tailwind.config.mjs синхронізуй fontFamily.display.
5. Ера-кольори додай як токени:
   --era-1: #3b6e8f; --era-2: #c89034; --era-3: #7a8b3a; --era-4: #a02f15; --era-5: #5e3a7a;
   (плюс @theme alias --color-era-1..5).
6. Subject-кольори (АСТ/БІО/ГЕО/ІСТ/ФІЗ/ТЕХ/МЕД/КУЛ/ЕКЛ/СПР/ЕКН) — теж токенами.
7. Прогани lint+build, переконайся що візуально нічого не зламалось окрім самого шрифту заголовків.
```

**Файли:** `public/fonts/`, `src/styles/global.css`, `tailwind.config.mjs`.
**Acceptance:** `<h1>` на `/` рендериться Unbounded’ом, у DevTools → Network немає 404 на шрифти.

---

## Епік 1 — Назви ер + еpoch-якорі контенту

**Промпт:**
```
Ціль: ери мають людські назви, кольори, тон, і список «епіграфів епохи» (контекст «що було тоді»).
Зараз: content/eras.json має тільки числа.

Зроби:
1. Розширити src/content.config.ts (zod-схема eras): додати поля
   name (string), short (string, формат "1991–1999"), color (hex), tone (string ≤200 chars),
   epoch (масив {k: string, v: string}, 6–10 елементів — президент, курс, хіт, кіно, гаджет, соцмережа тощо).
2. Заповни 5 ер у content/eras.json (значення див. app.jsx, ERAS).
3. Створи content/epoch/<year>.json — окрема колекція "epoch" зі схемою {year: number, items: [{k,v}]}.
   Заповни мінімум для років 1995, 2000, 2005, 2010, 2012, 2015, 2020, 2024 (8 файлів).
   Епіграфи — короткі, фактичні, з можливістю розширення.
4. Onovi src/lib/eras.ts — функція eraOf(year) повертає повну сутність із name/color/tone.
5. Тести (vitest) для нових полів і lookup.
```

**Файли:** `src/content.config.ts`, `content/eras.json`, `content/epoch/*.json` (нова), `src/lib/eras.ts`, `src/lib/eras.test.ts`.
**Acceptance:** `npm run test` зелений; `npm run validate:content` — теж.

---

## Епік 2 — Hero з одометром і пресетами

**Промпт:**
```
Ціль: переробити головну (src/pages/index.astro) — hero з плакатним заголовком, одометром-роком, лічильником пропущеного, пресетами.

Референс: BACK_FUTURE Redesign.html, секція .hero + .machine + .counter + .quick + .presets.

Компоненти створити в src/components/:
- Hero.astro — обгортка hero з ruled-paper bg, kicker, h1, lede.
- YearMachine.astro — обгортка машини часу. Включає:
    - YearOdometer.astro (4 цифрові колонки, transform: translateY).
      Скрипт inline (без React) — мінімальний vanilla JS. Слухай change з YearStepper.
    - YearStepper.astro — −/+ кнопки 44×44, ARIA-attrs.
    - GoButton.astro — `<a href={`/${year}/`}>` із текстом і моно-під-лейблом.
- MissedCounter.astro — реактивно показує (2026 − year)*~3.2 фактів і «епоха X». Перерахунок на year change.
- QuickPicks.astro — лейбл + 4 кнопки декад + випадковий рік. Випадковий — JS, prefers-reduced-motion поважати (без анімації плавки одометра).
- Presets.astro — 3 картки-сценарії (2005/2012/2024). Має data-кутик «загнутого аркуша» (CSS).

Стан року тримай у єдиному src/scripts/year-machine.ts (vanilla, без React/Alpine).
CustomEvent('year:change', { detail: {year} }) bubble — підписник MissedCounter, GoButton.

Стилі — Tailwind utility-first + кілька компонентних класів у global.css під @layer components (.odo, .odo__col, .odo__strip, .machine, .counter, .stamp).

Не ламай SSR: одометр рендериться з year=2012 за замовчанням, JS гідрує до значення з URL ?y= або last-used (sessionStorage).
```

**Файли:** `src/pages/index.astro`, `src/components/Hero.astro`, `src/components/YearMachine.astro`, `src/components/YearOdometer.astro`, `src/components/YearStepper.astro`, `src/components/GoButton.astro`, `src/components/MissedCounter.astro`, `src/components/QuickPicks.astro`, `src/components/Presets.astro`, `src/scripts/year-machine.ts`.
**Acceptance:** Lighthouse perf ≥ 95 (без layout shift); Playwright e2e: ввести 2015 → клік go → редирект на `/2015/`.

---

## Епік 3 — Ери з обличчям + шкала густини

**Промпт:**
```
Ціль: «Ера 1…5» → іменовані карти; додати DensityStrip 1991→2026.

Компоненти:
- EraGrid.astro — 5 карток (десктоп grid-cols-5, моб stack). Активна = бекграунд кольору ери.
  Props: {activeEraId: number}. Дані з content collection eras.
  Клік по карті — навігація на `/era/<slug>/` (вже існує).
- DensityStrip.astro — горизонтальна гістограма по роках. Висота смужки = к-сть фактів того року
  (читай з усіх .md фактів через Astro getCollection('facts'), агрегуй yearOfEvent → counts[year]).
  Колір смужки = колір ери, до якої належить рік.
  Клік по смужці — навігація на `/<year>/`.
  ARIA: role="list", кожна смужка <a> з aria-label="2012 рік, 8 фактів".
  Tooltip-on-hover (data-attr + CSS only).

На головній — секції під hero:
  <EraGrid />
  <DensityStrip />
  <SubjectChips counts={…} />
```

**Файли:** `src/components/EraGrid.astro`, `src/components/DensityStrip.astro`, `src/components/SubjectChips.astro`, оновлення `src/pages/index.astro`.
**Acceptance:** Шкала рендериться SSR’ом (без JS висоти стрибають), клік на 2014 → `/2014/`.

---

## Епік 4 — Сторінка року: «Тоді…» + вертикальна стрічка

**Промпт:**
```
Ціль: переробити src/pages/[year].astro.

Структура:
1. <YearHero year={year}/>  — back-to-home, kicker "випуск №N", великий рік (clamp 160-360px),
   <Stamp> "САМЕ ТУТ", речення "Минуло N років. Епоха «...»".
2. <ThenAside year={year} epoch={epochData}/>  — паперова панель з grid 4×2 «контекст епохи».
   Дані з content/epoch/<year>.json. Якщо файлу нема — fallback на найближчий.
3. <SubjectFilters facts={facts}/>  — sticky бар (top: header-height). State у URL hash (#fiz),
   щоб share-link працював. Чипси кольору рубрики.
4. <FactTimeline facts={filtered} fromYear={year}/>  — вертикальна шкала.
   Зліва (180px) — рік + delta «+N р.» + кольорова точка; центральна лінія 1px.
   Справа — <FactCard> із {chip, title, lede, source, more, share}.
   <details> для розгортання тіла, smooth via CSS grid trick (вже є у global.css).
5. <YearNav year prev next/>  — ±1 рік + центральна «змінити рік» (→ /).

Інші правки:
- Прибрати поточний JS-фільтр, перенести логіку у lib/filterFacts.ts (вже є — дописати тестами).
- Reading-progress і back-to-year залишити для /fact/[slug], не на /[year]/.
```

**Файли:** `src/pages/[year].astro`, `src/components/YearHero.astro`, `src/components/ThenAside.astro`, `src/components/SubjectFilters.astro`, `src/components/FactTimeline.astro`, `src/components/FactCard.astro`, `src/components/YearNav.astro`, `src/components/Stamp.astro`.
**Acceptance:** `/2012/` показує блок «Тоді…», фільтр БІО лишає тільки біо-факти, refresh зберігає фільтр через hash.

---

## Епік 5 — Прибрати «стіну з 120 посилань» + чистка головної

**Промпт:**
```
На головній зараз вивалюється список усіх 120 фактів. Це шум.
- Прибрати з src/pages/index.astro блок з усіма факт-посиланнями.
- Створити src/pages/all/index.astro — окрему сторінку «Усі факти» з фільтрами по року/предмету/ері.
- На головній лишити тільки <Presets/> (3 пресети) + посилання "Усі факти →" дрібно.
```

**Acceptance:** `view-source:/` не містить 120 anchor-тегів; `/all/` працює і фільтрує.

---

## Епік 6 — Темна тема: підкрутити теплі коричневі

**Промпт:**
```
Зараз html.dark має --paper #2a2218 і --card #342a1c — різниця у L* всього 7, картки зливаються.

- Знизь --paper до #1c1812 (темніший фон), залиш --card #2c2418 → різниця ~10.
- Додай у global.css фоновий радіальний градієнт від (50% 0%) теплий тон (rgba(217,119,6,.05) → transparent 60%) лише на html.dark body — ефект «настільної лампи».
- --accent у dark знизь насиченість на 5% (#cc5230).
- Перевір контрасти WCAG AA: всі text/bg пари ≥ 4.5:1 для прози, ≥ 3:1 для display.
```

---

## Епік 7 — Footer + monobank банка + RSS + email-підписка

**Промпт:**
```
- Footer redesign: 3 колонки (бренд / проєкт / підтримати). Дані з src/config/site.ts.
- monobank банка: великим CTA «monobank · банка →», дані з site.ts (поле `monobank`).
- Додай дрібну форму email-підписки (Buttondown або Listmonk endpoint як env var). Без cookies.
- RSS-іконка лінком на /rss.xml (вже існує).
```

---

## Послідовність роботи

1. Епік 0 — підмурок (1–2 год).
2. Епік 1 — контент (2–3 год).
3. Епік 2 — hero (1 день).
4. Епік 3 — ери+густина (півдня).
5. Епік 4 — сторінка року (1–1.5 дні).
6. Епік 5 — чистка (година).
7. Епіки 6–7 — поліровка (півдня).

**Усього ≈ 4 робочі дні з тестами.**

---

## Що НЕ робимо у цьому циклі

- Email-капчу, server-side форми (статика → краще зовнішній сервіс).
- A/B-тести.
- Reading-time-estimate (не критично).
- Icon set — навмисно без іконок, рубрики — двобуквені моно-коди.
- Анімації scroll-driven CSS (`animation-timeline: view()`) — поки що поза планом.

---

## Файли-референси у цьому репо

- `BACK_FUTURE Redesign.html` — повний прототип, відкривати в браузері.
- `app.jsx` — компонентна логіка, дані ER/SUBJECTS/EPOCH, формули MissedCounter/DensityStrip — копіювати числа звідси.
- `styles.css` — повний CSS, з якого беремо токени, утиліти, key-frame-и одометра.
