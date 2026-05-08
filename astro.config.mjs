// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import sentry from "@sentry/astro";
import tailwindcss from "@tailwindcss/vite";

const site = process.env.PUBLIC_SITE_URL ?? "https://back-future.example.com";

// Опціональний Sentry: без DSN — інтеграція не підключається взагалі.
const sentryDsn = process.env.SENTRY_DSN;
const sentryAuthToken = process.env.SENTRY_AUTH_TOKEN;
const sentryProject = process.env.SENTRY_PROJECT ?? "back-future";
const sentryOrg = process.env.SENTRY_ORG;

const sentryIntegration = sentryDsn
  ? [
      sentry({
        dsn: sentryDsn,
        sourceMapsUploadOptions:
          sentryAuthToken && sentryOrg
            ? { project: sentryProject, org: sentryOrg, authToken: sentryAuthToken }
            : undefined,
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
