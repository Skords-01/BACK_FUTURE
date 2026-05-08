// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import sentry from "@sentry/astro";
import tailwindcss from "@tailwindcss/vite";

const site = process.env.PUBLIC_SITE_URL ?? "https://back-future.example.com";

// Опціональний Sentry: без DSN — інтеграція не підключається взагалі.
// Runtime SDK-опції (dsn, sampleRate тощо) винесено у `sentry.client.config.ts`
// та `sentry.server.config.ts` — це рекомендований шлях у @sentry/astro v10
// (передавати `dsn` напряму в інтеграцію deprecated).
const sentryDsn = process.env.PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN;
const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN;
const sentryProject = process.env.SENTRY_PROJECT ?? "back-future";
const sentryOrg = process.env.SENTRY_ORG;

const sentryIntegration = sentryDsn
  ? [
      sentry({
        // Source-maps upload (build-time) — тільки якщо є auth token + org.
        ...(sentryAuthToken && sentryOrg
          ? {
              org: sentryOrg,
              project: sentryProject,
              authToken: sentryAuthToken,
            }
          : {}),
        // Явний glob — Astro в static-only режимі не завжди коректно
        // підставляє дефолтну директорію для першого проходу плагіна.
        sourcemaps: {
          assets: ["./dist/**/*.js", "./dist/**/*.mjs"],
        },
      }),
    ]
  : [];

export default defineConfig({
  site,
  integrations: [sitemap(), ...sentryIntegration],
  output: "static",
  build: {
    inlineStylesheets: "auto",
    format: "directory",
  },
  trailingSlash: "ignore",
  vite: {
    plugins: [tailwindcss()],
  },
});
