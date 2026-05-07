/**
 * Build an internal page URL.
 *
 * Astro is configured with `build.format: "directory"`, so each page resolves
 * to `slug/index.html`. We emit clean URLs with a trailing slash; static hosts
 * (Vercel / Netlify / Cloudflare Pages / S3+CloudFront) all serve those
 * directory paths correctly without an extension.
 */
export function pageUrl(slug: string): string {
  if (slug === "" || slug === "/") return "/";
  const trimmed = slug.replace(/^\/+|\/+$/g, "");
  return `/${trimmed}/`;
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
