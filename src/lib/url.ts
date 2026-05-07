/**
 * Build an internal page URL.
 *
 * We currently include the `.html` extension because the preview host
 * (devinapps.com static buckets) doesn't auto-resolve extensionless paths.
 * Production hosts (Vercel / Netlify / Cloudflare Pages) auto-redirect
 * `/foo.html` → `/foo`, so this stays compatible there too.
 */
export function pageUrl(slug: string): string {
  if (slug === "" || slug === "/") return "/";
  const trimmed = slug.replace(/^\/+|\/+$/g, "");
  return `/${trimmed}.html`;
}

export function yearUrl(year: number): string {
  return pageUrl(String(year));
}

export function factSlug(id: string): string {
  return id.split("/").at(-1) ?? id;
}

export function factUrl(id: string): string {
  return pageUrl(`fact/${factSlug(id)}`);
}

export function eraUrl(slug: string): string {
  return pageUrl(`era/${slug}`);
}
