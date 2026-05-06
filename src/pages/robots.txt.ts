import type { APIContext } from "astro";
import { SITE } from "../config/site";

export function GET(context: APIContext) {
  const site = context.site ?? new URL(SITE.defaultUrl);
  const sitemapUrl = new URL("/sitemap-index.xml", site).toString();

  return new Response(`User-agent: *\nAllow: /\n\nSitemap: ${sitemapUrl}\n`, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
