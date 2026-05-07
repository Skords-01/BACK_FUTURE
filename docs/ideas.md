# Ідеї та покращення

> Список можливих покращень для BACK_FUTURE. Це **сирі ідеї** — частина з них ще не пройшла через спільне обговорення. Робочий план PR-ів — у [`roadmap.md`](./roadmap.md).
> 24 пункти, погоджені з власником, — у `project-memory.md`, секція 6.
> Останнє оновлення: травень 2026 (після PR #51). Ідеї, які вже зроблено, перенесено в розділ «Зроблено» внизу — щоб новий контриб'ютор бачив, що залишилось, але міг звіритися з історією.

---

## Що ще можна зробити

### Контент: збагатити модель факту

- **`authors`** — frontmatter список авторів (для `/contributors`).
- **`region: country:<iso2>`** — наразі є тільки `world` / `ukraine`; для майбутнього розширення фільтрів за країнами (роздільно від «світу» загалом).
- **Міграція `image` на `astro:assets`** — поки `image` поле опційне; коли заповниться — оптимізувати pipeline (5.3 у roadmap).

### UX і навігація

- **«Мій рік»** — швидке повернення, persist у `localStorage` (4.3 у roadmap).
- **Збережені факти** (bookmark) — невелика сторінка `/saved` (4.4).
- **Анімовані тізери** на лендингу (#4 у memory).

### Нові сторінки

- **`/timeline`** — лінія часу всіх фактів (#9 у memory; 6.2 у roadmap).
- **`/compare?a=1998&b=2010`** — два роки поруч (6.3 у roadmap).
- **`/quiz`** — «вгадай рік відкриття» (#11 у memory; 6.4 у roadmap).
- **`/share/[year]`** — рендер постера PNG для соцмереж (#5 у memory; 6.5 у roadmap).

### SEO і шеринг

- **JSON-LD `FAQPage`** — для секції FAQ на about (`Article` + `BreadcrumbList` уже є після PR #31).
- **Перевірка мета-тегів** для `/era/[slug]` і `/fact/[slug]` після PR #51 — впевнитися, що OG/Twitter картки коректно резолвляться у популярних соцмережах.

### Пошук і персоналізація

- **Pagefind** — build-time повнотекстовий пошук, без беку (4.1 у roadmap).

### PWA / a11y

- **Manifest + service-worker** для офлайн-перегляду (5.1 у roadmap).
- **axe-аудит** у CI поверх Playwright (5.2 у roadmap).

### Залучення / community

- **GitHub Action**: issue зі шаблону `new-fact.yml` → draft PR з готовим `.md`-фактом (7.1 у roadmap).
- **`/contributors`** — список авторів фактів (потребує `authors` поля у frontmatter; 7.2 у roadmap).
- **`/support`** — Monobank / Buy Me a Coffee, коли URL заповняться у `site.ts` (7.3 у roadmap).
- **Email-дайджест** — раз на місяць нові факти, Buttondown або self-hosted (7.4 у roadmap).

### Бренд і дизайн-система

- **SVG-іконки** для предметів замість emoji — зберегти emoji як fallback (8.1 у roadmap).
- **Локальний шрифтовий пакет** замість Google Fonts — швидше + privacy (8.2 у roadmap).
- **Theme Laboratory як справжній перемикач** теми, cookie-стійкий (8.3 у roadmap).

### i18n

- **Astro routing**: `/uk/`, `/en/` — структурно, без перекладів спочатку (9.1 у roadmap).
- **ICU plurals** у форматерах кількості (9.2 у roadmap).
- **Англомовний UI** — діаспора + органіка (9.3 у roadmap).

### Інфра / тех-борг

- **Реальний домен + Vercel/Cloudflare** (#18 у memory) — pending після контенту.
- **Sveltia / Decap CMS production auth** (#20 у memory) — конфіг є, налаштування авторизації для прода — pending.
- **Renovate замість/поверх Dependabot** — кращий контроль над групуваннями оновлень (поки Dependabot з груповими правилами достатній).

---

## Зроблено

> Перенесено сюди з основного списку ідей — лишаємо як референс, що було колись «ідеєю», а тепер уже у проді. Деталі — в `project-memory.md` (секція 7) і `roadmap.md` (таблиця «Нещодавно виконано»).

### Контент-схема (зроблено)

- **`before` / `after`** — Done у [#28](https://github.com/Skords-01/BACK_FUTURE/pull/28).
- **`region` (`world` / `ukraine`)** — Done у [#36](https://github.com/Skords-01/BACK_FUTURE/pull/36).
- **`updatedAt`** — Done у [#37](https://github.com/Skords-01/BACK_FUTURE/pull/37).
- **`impact` (low / medium / high)** — Done у [#38](https://github.com/Skords-01/BACK_FUTURE/pull/38).
- **Розширити `SUBJECTS`** (tech, medicine, economy, culture, sport, ecology) — Done у [#51](https://github.com/Skords-01/BACK_FUTURE/pull/51) (схема/CMS/UI; контент додається окремо).
- **CI-перевірка для `sources[].url`** — Done у [#49](https://github.com/Skords-01/BACK_FUTURE/pull/49) + [#51](https://github.com/Skords-01/BACK_FUTURE/pull/51) (warning-only Lychee).

### UX і навігація (зроблено)

- **Глобальний хедер з лічильником «N фактів»** — Done у [#22](https://github.com/Skords-01/BACK_FUTURE/pull/22).
- **Мобільне меню в `Header.astro`** — Done у [#22](https://github.com/Skords-01/BACK_FUTURE/pull/22).
- **Хлібні крихти** — Done у [#22](https://github.com/Skords-01/BACK_FUTURE/pull/22).
- **Sticky-summary з якорями-чіпами на предмети** — Done у [#32](https://github.com/Skords-01/BACK_FUTURE/pull/32).
- **Кастомний 404** — Done у [#29](https://github.com/Skords-01/BACK_FUTURE/pull/29).
- **Темна тема (auto-prefers + перемикач)** — Done у [#33](https://github.com/Skords-01/BACK_FUTURE/pull/33).
- **Кнопка «Сюрприз» (рандомний рік)** — Done у [#30](https://github.com/Skords-01/BACK_FUTURE/pull/30).

### Нові сторінки (частково)

- **`/subject/[id]` — стрічка по предмету** — Done у [#39](https://github.com/Skords-01/BACK_FUTURE/pull/39).
- **`/era/[slug]` — стрічка по ері** — Done у [#51](https://github.com/Skords-01/BACK_FUTURE/pull/51).
- **`/fact/[slug]` — окрема сторінка факту** — Done у [#51](https://github.com/Skords-01/BACK_FUTURE/pull/51).

### SEO і шеринг (зроблено)

- **OG як PNG** — Done у [#43](https://github.com/Skords-01/BACK_FUTURE/pull/43) (через `@resvg/resvg-js`).
- **JSON-LD `Article` + `BreadcrumbList`** — Done у [#31](https://github.com/Skords-01/BACK_FUTURE/pull/31).
- **Шер-кнопки (Telegram, X, copy, native share)** — Done у [#21](https://github.com/Skords-01/BACK_FUTURE/pull/21).

### Пошук і персоналізація (зроблено)

- **Фільтри на сторінці року** (subject / era / region / impact) — Done у [#51](https://github.com/Skords-01/BACK_FUTURE/pull/51).

### Тех-борг (зроблено)

- **Юніт-тести для `src/lib/`** — Done у [#27](https://github.com/Skords-01/BACK_FUTURE/pull/27) (Vitest, покриття `src/lib/` ≥ 80%).
- **`docs/proposed-ci/` видалено** — Done у [#26](https://github.com/Skords-01/BACK_FUTURE/pull/26).
- **pre-commit (Husky + lint-staged)** — Done у [#42](https://github.com/Skords-01/BACK_FUTURE/pull/42).
- **Розширене групування Dependabot** — Done у [#41](https://github.com/Skords-01/BACK_FUTURE/pull/41).
- **Аналітика (Plausible / Umami як опція через env)** — Done у [#44](https://github.com/Skords-01/BACK_FUTURE/pull/44).
- **Окремий markdownlint для `content/facts/`** — Done у [#50](https://github.com/Skords-01/BACK_FUTURE/pull/50).

---

## Принципи добору ідей

- **Український акцент** — кожна нова фіча має або підсилювати український контент, або бути нейтральною.
- **Static-first** — ніяких раннтайм-беків без явної потреби.
- **Контент окремо від коду** — нові фічі не зливаються з контентом.
- **Template-readiness** — будь-яка зміна повинна залишатися форкабельною (single-source-of-truth у `site.ts` + `tailwind.config.mjs` + `content/`).
