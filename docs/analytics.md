# Analytics & PostHog

Privacy-friendly аналітика. Без cookies, без PII. Опціональна — якщо env-змінні
не задані, ніяких трекерів не підвантажується (нульовий runtime).

Підтримуються три провайдери: **PostHog** (рекомендований — фунели + heatmaps),
Plausible, Umami. Ця сторінка фокусується на PostHog, бо для нього вже
зінструментовано всі ключові події.

## Налаштування

### 1. Підключення (build-time env)

Додай у `.env` (або у Vercel/Netlify env):

```bash
PUBLIC_ANALYTICS_PROVIDER=posthog
PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com   # або https://us.i.posthog.com
```

Префікс `PUBLIC_` обов'язковий — Astro прокидає такі змінні у клієнтський bundle.
Public key (`phc_...`) видно у браузері, він НЕ sensitive.

### 2. Перевірка локально

```bash
npm run dev
```

Відкрий DevTools → Network. На кожній сторінці має бути запит до
`*-assets.i.posthog.com/static/array.js` і POST у `eu.i.posthog.com/i/v0/e/`
(або `us...`).

Якщо запитів немає — перевір що ENV видно у dev-консолі:

```js
console.log(import.meta.env.PUBLIC_POSTHOG_KEY);
```

### 3. Створення фунелів і дешборду (як код)

`scripts/posthog-setup.ts` ідемпотентно створює дешборд **BACK_FUTURE — Core
Metrics** з 4 фунелами і 7 інсайтами через PostHog API.

```bash
POSTHOG_PERSONAL_API_KEY=phx_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx \
POSTHOG_PROJECT_ID=12345 \
POSTHOG_HOST=https://eu.posthog.com \
npm run posthog:setup
```

- **Personal API key** (`phx_...`) — НЕ public. Створи у Settings → User → Personal
  API keys зі скоупом `insight:write` + `dashboard:write` (або `*`).
- **Project ID** — числовий ID проекту, видно у URL дешборда або у Settings →
  Project Details.
- `POSTHOG_HOST` для API — це `eu.posthog.com` / `us.posthog.com` (без `i.`),
  на відміну від ingestion host `eu.i.posthog.com`.

Скрипт можна запускати скільки завгодно разів — він знаходить існуючі фунели
за `name` і апдейтить, не дублюючи. Якщо хочеш скинути все — видали дешборд
вручну в UI і перезапусти скрипт.

## Таксономія подій

Усі події надсилаються через `track(EVENTS.*, props)` з `src/lib/analytics.ts`.
Hе використовуй стрінгові літерали — імпортуй константи, щоб імена не
розходились.

| Подія                    | Тригер                                    | Пропси                                                                |
| ------------------------ | ----------------------------------------- | --------------------------------------------------------------------- |
| `$pageview`              | автоматично PostHog                       | `$pathname`, `$current_url`                                           |
| `$pageleave`             | автоматично PostHog                       | `$pathname`                                                           |
| `$web_vitals`            | автоматично (Core Web Vitals)             | `$web_vitals_LCP_value`, `$web_vitals_CLS_value` …                    |
| `$autocapture`           | автоматично — клік на будь-який елемент   | селектор, текст                                                       |
| `$rageclick`             | автоматично — швидкі повторні кліки       | селектор                                                              |
| `year_submitted`         | submit `<YearInput>` або клік `<Presets>` | `year`, `source: "manual" \| "preset"`                                |
| `year_validation_failed` | невалідний рік у `<YearInput>`            | `reason: "empty" \| "not_integer" \| "out_of_range"`, `min`, `max`    |
| `quick_pick_clicked`     | клік на decade-чіп                        | `year`, `label`                                                       |
| `random_year_picked`     | клік на «※ випадковий»                    | `year`                                                                |
| `preset_clicked`         | клік на preset-картку                     | `year`, `index`                                                       |
| `era_clicked`            | клік на ера-картку                        | `era_id`, `era_slug`                                                  |
| `subject_filter_changed` | фільтр предмета на /<year>/               | `subject_id`, `action: "add" \| "remove" \| "all"`                    |
| `fact_card_clicked`      | клік «Докладніше →» на FactCard           | `fact_id`, `subject`, `year_of_event`                                 |
| `fact_source_clicked`    | клік на outbound-лінку всередині FactCard | `host`, `path`, `fact_id`                                             |
| `share_clicked`          | клік на share-кнопку                      | `target: "telegram" \| "twitter" \| "facebook" \| "copy" \| "native"` |
| `share_succeeded`        | копія/native share успішно                | `target`                                                              |
| `support_clicked`        | клік на «Banka Monobank» / BMC            | `provider: "monobank" \| "buymeacoffee"`                              |
| `fact_saved`             | bookmark-кнопка → save                    | `fact_slug`, `source: "button" \| "shortcut"`                         |
| `fact_unsaved`           | bookmark-кнопка → unsave                  | `fact_slug`, `source: "button" \| "shortcut"`                         |
| `saved_page_view`        | відкрита сторінка `/saved/`               | `count`                                                               |
| `saved_exported`         | клік «Експорт JSON» на `/saved/`          | `count`                                                               |
| `saved_imported`         | імпорт JSON-файлу на `/saved/`            | `count`                                                               |
| `saved_cleared`          | клік «Очистити все» на `/saved/`          | `count`                                                               |
| `quiz_started`           | старт квізу                               | —                                                                     |
| `quiz_question_answered` | відповідь на питання                      | `question_index`, `correct`, `year`, `guessed_year`, `delta`          |
| `quiz_finished`          | фінальний скор                            | `score`, `total`                                                      |
| `quiz_restarted`         | клік «Спробувати знов»                    | —                                                                     |
| `search_opened`          | відкритий пошук-діалог                    | `source: "button" \| "shortcut"`                                      |
| `search_query`           | юзер набрав ≥2 символи (700ms throttle)   | `length` (тільки довжина, без вмісту)                                 |
| `search_result_clicked`  | клік на результат пошуку                  | `result_index`                                                        |
| `theme_toggled`          | світла/темна                              | `mode: "light" \| "dark"`                                             |
| `back_to_top_clicked`    | флоат-кнопка «↑»                          | `scroll_y`                                                            |
| `outbound_link_clicked`  | будь-який зовнішній лінк (не fact source) | `host`, `path`                                                        |

### Super-properties

- `year_filter` — встановлюється через `posthog.register()` після того як юзер
  обрав рік. Прикріплюється до КОЖНОГО подальшого івенту в сесії, що дозволяє
  робити кросс-фільтр в інсайтах.

## Privacy

- `persistence: "localStorage"` — без cookies. distinct_id зберігається в
  localStorage браузера; перехід між сайтами не можливий.
- `respect_dnt: true` — юзери з Do-Not-Track не трекаються взагалі.
- `person_profiles: "identified_only"` — анонімні юзери НЕ створюють "person"
  profile в PostHog. Funnels й insights усе одно працюють (групування по
  distinct_id).
- `disable_session_recording: true` — записів сесій НЕМАЄ. Це навмисне рішення
  для privacy.
- Жоден івент не містить PII (email, IP, повний пошуковий запит, content).
  Виключно структурні пропси.

## Як додати нову подію

1. Додай ім'я у `EVENTS` constant в `src/lib/analytics.ts`.
2. Викликай `track(EVENTS.myEvent, { my_prop: value })` у відповідному компоненті.
   - Для `is:inline` скриптів використовуй inline-stub (див. приклад у
     `quiz.astro` чи `YearInput.astro`).
3. Опиши подію у таблиці вище.
4. Якщо подія має бути в дешборді — додай інсайт у `scripts/posthog-setup.ts` і
   перезапусти `npm run posthog:setup`.

## Дебаг

```js
// В консолі браузера
window.posthog.debug(); // лог усіх captured events
window.posthog.capture("test", { hello: "world" });
window.posthog.opt_out_capturing(); // тимчасово вимкнути для себе
window.posthog.opt_in_capturing();
```
