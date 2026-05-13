// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import sentry from "@sentry/astro";
import tailwindcss from "@tailwindcss/vite";

// Source of truth for the canonical production URL. `site.ts`
// re-uses this via Astro's injected `import.meta.env.SITE` —
// keep that chain in mind before adding another fallback.
// Override per deploy by setting the `PUBLIC_SITE_URL` env var.
const PLACEHOLDER_SITE_URL = "https://back-future.example.com";
const site = process.env.PUBLIC_SITE_URL ?? PLACEHOLDER_SITE_URL;

if (site === PLACEHOLDER_SITE_URL && process.env.NODE_ENV === "production") {
  // Loud-but-non-fatal warning: production canonical / og:url / sitemap
  // will all bake in the placeholder unless the env var is set.
  // eslint-disable-next-line no-console
  console.warn(
    `[astro.config] PUBLIC_SITE_URL is not set; falling back to ${PLACEHOLDER_SITE_URL}. ` +
      `Production canonical URLs and sitemap will use the placeholder.`,
  );
}

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
  // i18n routing scaffold (roadmap 9.1): `uk` лишається без префіксу
  // (домашня локаль), `/en/` — англомовний дзеркальний скаффолд.
  // `redirectToDefaultLocale: false` гарантує, що корінь `/` обслуговує
  // українські сторінки без редиректів. Локалізація UI-словника живе в
  // `src/i18n/`, факти-контент поки залишається українським — переклад
  // контенту винесено у фазу 9.3.
  i18n: {
    defaultLocale: "uk",
    locales: ["uk", "en"],
    routing: {
      prefixDefaultLocale: false,
      redirectToDefaultLocale: false,
    },
  },
  integrations: [
    sitemap({
      // Обидві локалі видимі в sitemap; alternate-релейшени між версіями
      // даємо через `<link rel="alternate" hreflang>` у `Base.astro`.
      i18n: {
        defaultLocale: "uk",
        locales: {
          uk: "uk-UA",
          en: "en",
        },
      },
    }),
    ...sentryIntegration,
  ],
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
