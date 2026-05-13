import { expect, test } from "@playwright/test";

// Smoke tests for SEO meta + JSON-LD on key pages.
// Covers the FAQ JSON-LD on /about/ and core meta tags на /fact/<slug>/ + /era/<slug>/.

test("/about/ ships a schema.org FAQPage JSON-LD block", async ({ page }) => {
  await page.goto("/about/");

  // Visible FAQ section should be in the DOM.
  await expect(page.locator("#faq")).toBeVisible();

  // Collect all <script type="application/ld+json"> payloads and find the FAQPage.
  const ldJsonStrings = await page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((nodes) => nodes.map((n) => (n.textContent ?? "").trim()));
  expect(ldJsonStrings.length).toBeGreaterThan(0);

  const faqPayload = ldJsonStrings
    .map((raw) => {
      try {
        return JSON.parse(raw) as Record<string, unknown>;
      } catch {
        return null;
      }
    })
    .find((parsed): parsed is Record<string, unknown> => parsed?.["@type"] === "FAQPage");

  expect(faqPayload, "FAQPage JSON-LD payload missing on /about/").toBeTruthy();
  expect(faqPayload!["@context"]).toBe("https://schema.org");
  const mainEntity = faqPayload!.mainEntity as Array<{
    "@type": string;
    name: string;
    acceptedAnswer: { "@type": string; text: string };
  }>;
  expect(Array.isArray(mainEntity)).toBe(true);
  expect(mainEntity.length).toBeGreaterThanOrEqual(5);
  for (const entry of mainEntity) {
    expect(entry["@type"]).toBe("Question");
    expect(entry.name.length).toBeGreaterThan(0);
    expect(entry.acceptedAnswer["@type"]).toBe("Answer");
    expect(entry.acceptedAnswer.text.length).toBeGreaterThan(0);
  }
});

test("/fact/<slug>/ has absolute canonical + og:type=article", async ({ page }) => {
  // Stable slug — see content/facts/physics/antihydrogen-trapped-cern.md.
  await page.goto("/fact/antihydrogen-trapped-cern/");

  const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
  expect(canonical).toBeTruthy();
  expect(canonical!).toMatch(/^https?:\/\//);
  expect(canonical!).toMatch(/\/fact\/antihydrogen-trapped-cern\/?$/);

  const ogType = await page.locator('meta[property="og:type"]').getAttribute("content");
  expect(ogType).toBe("article");

  const twitterCard = await page.locator('meta[name="twitter:card"]').getAttribute("content");
  expect(twitterCard).toBe("summary_large_image");
});

test("/era/<slug>/ has og:type=article + BreadcrumbList JSON-LD", async ({ page }) => {
  await page.goto("/era/1991-1995/");

  const ogType = await page.locator('meta[property="og:type"]').getAttribute("content");
  expect(ogType).toBe("article");

  const ogImage = await page.locator('meta[property="og:image"]').getAttribute("content");
  expect(ogImage).toBeTruthy();
  expect(ogImage!).toMatch(/^https?:\/\//);
  expect(ogImage!).toMatch(/\/og\/era-1991-1995\.png$/);

  const ldJsonStrings = await page
    .locator('script[type="application/ld+json"]')
    .evaluateAll((nodes) => nodes.map((n) => (n.textContent ?? "").trim()));
  const breadcrumbs = ldJsonStrings
    .map((raw) => {
      try {
        return JSON.parse(raw) as Record<string, unknown>;
      } catch {
        return null;
      }
    })
    .find((parsed): parsed is Record<string, unknown> => parsed?.["@type"] === "BreadcrumbList");
  expect(breadcrumbs, "BreadcrumbList JSON-LD missing on /era/<slug>/").toBeTruthy();
});
