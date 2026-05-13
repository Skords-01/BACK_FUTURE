// Pure helpers shared by the service-worker generator (`scripts/generate-sw.ts`)
// and its unit tests. Keeping this logic in `src/lib/` lets vitest pick it up
// via the existing `src/**` test glob — and lets us cover precache rules
// without spawning the whole build.

/**
 * Where each asset under `dist/` should land in the SW caches.
 *
 *   - `precache`: cache-first on install (fonts, icons, hashed `_astro/*`,
 *     the offline fallback, favicon).
 *   - `runtime`: HTML — fetched with a network-first strategy at runtime so
 *     content stays fresh, with the SW cache as the offline fallback.
 *   - `exclude`: assets we intentionally skip (Pagefind index/runtime, the
 *     SW itself, source-maps, etc.).
 */
export type AssetCategory = "precache" | "runtime" | "exclude";

/**
 * Files that must never end up in the precache or runtime cache.
 *
 *   - `pagefind/` is a content-addressed, lazy-loaded search index — its
 *     fragments are pulled on demand by `pagefind-ui.js`, and aggressively
 *     caching them would balloon storage and risk version skew on rebuilds.
 *   - `sw.js`, `manifest.webmanifest`: SW + manifest must always go through
 *     the network so updates aren't held hostage by their own cache.
 *   - `sitemap*.xml`, `rss.xml`, `robots.txt`: cheap text files that should
 *     always reflect production state; SEO infrastructure, not user-facing.
 */
const EXCLUDED_PREFIXES = ["/pagefind/"] as const;
const EXCLUDED_EXACT = new Set([
  "/sw.js",
  "/manifest.webmanifest",
  "/robots.txt",
  "/rss.xml",
  "/sitemap.xml",
  "/sitemap-index.xml",
]);
const EXCLUDED_SUFFIXES = [".map"] as const;

/** File extensions that go into the install-time precache. */
const PRECACHE_EXTENSIONS = new Set([
  ".css",
  ".js",
  ".mjs",
  ".woff",
  ".woff2",
  ".ttf",
  ".otf",
  ".eot",
  ".svg",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".avif",
  ".ico",
  ".webmanifest",
]);

function extOf(pathname: string): string {
  const dot = pathname.lastIndexOf(".");
  const slash = pathname.lastIndexOf("/");
  if (dot <= slash) return "";
  return pathname.slice(dot).toLowerCase();
}

/**
 * Decide which cache bucket an asset under `dist/` belongs to. `urlPath`
 * is a site-relative URL (always starts with `/`, no query string).
 */
export function categorizeAsset(urlPath: string): AssetCategory {
  if (!urlPath.startsWith("/")) return "exclude";
  if (EXCLUDED_EXACT.has(urlPath)) return "exclude";
  for (const prefix of EXCLUDED_PREFIXES) {
    if (urlPath.startsWith(prefix)) return "exclude";
  }
  for (const suffix of EXCLUDED_SUFFIXES) {
    if (urlPath.endsWith(suffix)) return "exclude";
  }
  const ext = extOf(urlPath);
  if (ext === ".html" || urlPath.endsWith("/")) return "runtime";
  if (PRECACHE_EXTENSIONS.has(ext)) return "precache";
  return "exclude";
}

/**
 * Convert a path on disk (relative to the build output root) into the URL
 * the browser will request. `dist/index.html` → `/`, `dist/foo/index.html`
 * → `/foo/`, `dist/og/2024.png` → `/og/2024.png`. Always POSIX-style.
 */
export function toUrlPath(relPath: string): string {
  const normalized = relPath.replace(/\\/g, "/").replace(/^\/+/, "");
  if (normalized === "index.html") return "/";
  if (normalized.endsWith("/index.html")) {
    return "/" + normalized.slice(0, -"index.html".length);
  }
  return "/" + normalized;
}

/** djb2 — small, deterministic, non-cryptographic. Stable across Node + browser. */
function djb2(input: string): string {
  let hash = 5381;
  for (let i = 0; i < input.length; i += 1) {
    hash = ((hash << 5) + hash + input.charCodeAt(i)) | 0;
  }
  // Unsigned hex — 8 chars max, enough to invalidate the cache on real
  // content changes while staying short in `caches.keys()` debug output.
  return (hash >>> 0).toString(16).padStart(8, "0");
}

/**
 * Compute a short cache-version key from the precache list. We hash the
 * sorted list (URLs + content hashes when known) so byte-identical rebuilds
 * keep the same cache name, while any asset change invalidates everything.
 *
 * The input is intentionally `Array<{ url; hash? }>` rather than just paths:
 * static URLs alone don't differentiate two builds where `index.html` was
 * edited but its hashed `_astro/*` deps stayed the same, and rebuilding
 * always rewrites HTML even when nothing changed. Pass `hash` for files
 * whose contents can change without a name change — typically `.html` — and
 * the generator gets a proper content-addressed version.
 */
export function computeCacheVersion(
  entries: ReadonlyArray<{ url: string; hash?: string }>,
): string {
  const sorted = [...entries].sort((a, b) => a.url.localeCompare(b.url));
  const payload = sorted.map((e) => `${e.url}\u0000${e.hash ?? ""}`).join("\n");
  return djb2(payload);
}

export const __INTERNAL = { djb2, extOf };
