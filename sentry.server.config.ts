import * as Sentry from "@sentry/astro";

// На сервері (білд / SSR) `process.env` доступний — читаємо обидва імені
// для зворотної сумісності.
const dsn = process.env.SENTRY_DSN ?? process.env.PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0.1,
  });
}
