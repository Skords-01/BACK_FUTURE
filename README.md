# BACK_FUTURE

> Що ти пропустив після випускного? Український просвітницький сайт: введи рік випуску — отримай стрічку оновлень у науці, історії й світі від тих часів.

## Стек

- [Astro](https://astro.build) 6 + TypeScript (strict)
- [Tailwind CSS](https://tailwindcss.com)
- Контент — Markdown з frontmatter, типобезпечно валідований через Zod
- Статичний білд → деплой на будь-який static host (Vercel/Netlify/Cloudflare Pages)

## Швидкий старт

```bash
nvm use            # Node 22.13+
npm install
npm run dev        # http://localhost:4321
npm run build      # проганяє astro check + білд
npm run preview    # переглянути білд локально
npm run test       # Playwright smoke tests
npm run lint       # ESLint + Prettier
npm run validate:content  # quality gate для facts/*.md
npm run coverage:content  # coverage report за предметами й ерами
npm run format     # Prettier --write
```

## Структура

```
.
├── astro.config.mjs       # конфіг Astro
├── tailwind.config.mjs    # дизайн-токени
├── tsconfig.json          # strict TS
├── content/               # увесь контент окремо від коду
│   ├── eras.json          # 5 ер шкільних програм 1991→сьогодні
│   └── facts/<subject>/*.md   # окремий .md на кожен факт
├── docs/                  # архітектура, content guidelines, ери
├── public/                # статика (favicon, og, шрифти)
├── src/
│   ├── components/        # FactCard, YearInput, ...
│   ├── config/site.ts     # назва, ЦА, домен, монобанка — single source of truth
│   ├── content.config.ts  # Zod-схеми колекцій
│   ├── layouts/           # Base, ...
│   ├── lib/               # eras.ts, filterFacts.ts
│   ├── pages/             # index, [year], about, metodologia
│   └── styles/global.css
└── ...
```

## Як додати факт

1. Створи `content/facts/<subject>/<slug>.md`.
2. Заповни frontmatter:

```yaml
---
title: "Заголовок факту"
subject: "physics" # astronomy | biology | geography | history | physics
short: "1–2 речення (20–280 символів)."
yearOfEvent: 2012
relevantForEras: [1, 2, 3, 4] # для яких ер це новина
sources:
  - title: "Першоджерело"
    url: "https://..."
tags: ["опціональні", "теги"]
draft: false
---
```

1. Тіло — науково-популярний текст (3–5 абзаців), markdown.
2. `npm run build` — schema-валідація автоматично перевірить frontmatter.
3. `npm run validate:content` — додаткові правила якості: джерела, чернетки, tone guardrails.

Детальніше в [`docs/content-guidelines.md`](docs/content-guidelines.md).

## Архітектура

Див. [`docs/architecture.md`](docs/architecture.md). Сайт спроєктований так, щоб його можна було форкати в template для подібних контент-сайтів — основні точки кастомізації: `src/config/site.ts` + `content/`.

## Пам'ять проєкту

Стан, рішення, дорожня карта, відкладені моменти — у [`docs/project-memory.md`](docs/project-memory.md). Цей документ оновлюється з кожним значущим етапом і є першим, що читає нова сесія Devin.

## Ліцензія

Код — MIT (див. `LICENSE`). Контент — CC BY-SA 4.0 (буде додано окремо).
