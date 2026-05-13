import { describe, expect, it } from "vitest";
import { categorizeAsset, computeCacheVersion, toUrlPath } from "./swUtils";

describe("categorizeAsset", () => {
  it("treats trailing-slash directory URLs and explicit .html as runtime (network-first)", () => {
    expect(categorizeAsset("/")).toBe("runtime");
    expect(categorizeAsset("/2024/")).toBe("runtime");
    expect(categorizeAsset("/fact/some-slug/")).toBe("runtime");
    expect(categorizeAsset("/2024/index.html")).toBe("runtime");
  });

  it("precaches fonts, hashed JS/CSS, icons and other static binary assets", () => {
    expect(categorizeAsset("/fonts/geist-latin-wght-normal.woff2")).toBe("precache");
    expect(categorizeAsset("/_astro/page.DEADBEEF.js")).toBe("precache");
    expect(categorizeAsset("/_astro/styles.DEADBEEF.css")).toBe("precache");
    expect(categorizeAsset("/icons/icon-512.png")).toBe("precache");
    expect(categorizeAsset("/favicon.svg")).toBe("precache");
    expect(categorizeAsset("/og/default.png")).toBe("precache");
  });

  it("excludes pagefind, sourcemaps, SEO infra and SW/manifest itself", () => {
    expect(categorizeAsset("/pagefind/pagefind.js")).toBe("exclude");
    expect(categorizeAsset("/pagefind/fragment/en_default.pf_fragment")).toBe("exclude");
    expect(categorizeAsset("/sw.js")).toBe("exclude");
    expect(categorizeAsset("/manifest.webmanifest")).toBe("exclude");
    expect(categorizeAsset("/sitemap.xml")).toBe("exclude");
    expect(categorizeAsset("/sitemap-index.xml")).toBe("exclude");
    expect(categorizeAsset("/rss.xml")).toBe("exclude");
    expect(categorizeAsset("/robots.txt")).toBe("exclude");
    expect(categorizeAsset("/_astro/page.DEADBEEF.js.map")).toBe("exclude");
  });

  it("rejects paths that aren't site-rooted", () => {
    expect(categorizeAsset("relative/foo.css")).toBe("exclude");
    expect(categorizeAsset("https://cdn.example.com/foo.js")).toBe("exclude");
  });
});

describe("toUrlPath", () => {
  it("maps dist-relative paths to public URLs (directory format)", () => {
    expect(toUrlPath("index.html")).toBe("/");
    expect(toUrlPath("2024/index.html")).toBe("/2024/");
    expect(toUrlPath("fact/some-slug/index.html")).toBe("/fact/some-slug/");
    expect(toUrlPath("og/default.png")).toBe("/og/default.png");
    expect(toUrlPath("_astro/page.DEADBEEF.js")).toBe("/_astro/page.DEADBEEF.js");
  });

  it("normalises Windows-style separators and leading slashes", () => {
    expect(toUrlPath("\\fonts\\geist.woff2")).toBe("/fonts/geist.woff2");
    expect(toUrlPath("/og/2024.png")).toBe("/og/2024.png");
  });
});

describe("computeCacheVersion", () => {
  it("is deterministic regardless of input order", () => {
    const a = computeCacheVersion([
      { url: "/_astro/a.js", hash: "1" },
      { url: "/_astro/b.css", hash: "2" },
      { url: "/", hash: "3" },
    ]);
    const b = computeCacheVersion([
      { url: "/", hash: "3" },
      { url: "/_astro/b.css", hash: "2" },
      { url: "/_astro/a.js", hash: "1" },
    ]);
    expect(a).toBe(b);
  });

  it("changes when any precache entry's hash or URL changes", () => {
    const base = [
      { url: "/_astro/a.js", hash: "1" },
      { url: "/_astro/b.css", hash: "2" },
    ];
    const baseline = computeCacheVersion(base);
    const hashChanged = computeCacheVersion([
      { url: "/_astro/a.js", hash: "1" },
      { url: "/_astro/b.css", hash: "2-changed" },
    ]);
    const urlChanged = computeCacheVersion([
      { url: "/_astro/a.js", hash: "1" },
      { url: "/_astro/c.css", hash: "2" },
    ]);
    expect(hashChanged).not.toBe(baseline);
    expect(urlChanged).not.toBe(baseline);
  });

  it("emits a short, URL-safe hex token", () => {
    const v = computeCacheVersion([{ url: "/", hash: "x" }]);
    expect(v).toMatch(/^[0-9a-f]{8}$/);
  });
});
