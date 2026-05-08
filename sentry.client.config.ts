import * as Sentry from "@sentry/astro";

// Без DSN — нічого не ініціалізується (нульовий runtime).
// DSN — публічний (видно у браузері), тому використовуємо `PUBLIC_*` префікс,
// щоб Astro/Vite пробросили його у клієнтський бандл.
const dsn = import.meta.env.PUBLIC_SENTRY_DSN;

if (dsn) {
  Sentry.init({
    dsn,
    // Низький sampleRate щоб не з'їсти free-tier traces.
    tracesSampleRate: 0.1,
  });
}
