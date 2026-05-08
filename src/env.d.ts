/// <reference types="astro/client" />

interface ImportMetaEnv {
  // Analytics
  readonly PUBLIC_ANALYTICS_PROVIDER?: "plausible" | "umami" | "posthog";
  readonly PUBLIC_PLAUSIBLE_DOMAIN?: string;
  readonly PUBLIC_PLAUSIBLE_SCRIPT_URL?: string;
  readonly PUBLIC_UMAMI_WEBSITE_ID?: string;
  readonly PUBLIC_UMAMI_SCRIPT_URL?: string;
  readonly PUBLIC_POSTHOG_KEY?: string;
  readonly PUBLIC_POSTHOG_HOST?: string;
  // SEO verification
  readonly GOOGLE_SITE_VERIFICATION?: string;
  readonly BING_SITE_VERIFICATION?: string;
  // Site
  readonly PUBLIC_SITE_URL?: string;
  // Sentry
  readonly SENTRY_DSN?: string;
  readonly SENTRY_AUTH_TOKEN?: string;
  readonly SENTRY_PROJECT?: string;
  readonly SENTRY_ORG?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
