import { expect, test } from "@playwright/test";

// i18n smoke tests cover the `/en/` mirror scaffold (roadmap 9.1):
//   • Each English page sets `<html lang="en">` and renders the English shell.
//   • The hreflang relation between UK and EN is reciprocal.
//   • The language switcher links to the equivalent path in the other locale.
//   • The Ukrainian default route is unaffected (`<html lang="uk">`).

test("EN homepage renders with html lang=en and English copy", async ({ page }) => {
  await page.goto("/en/");

  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(
    page.getByRole("heading", { name: /What you missed after graduation/ }),
  ).toBeVisible();
});

test("EN year mirror exists for /en/2000/ with hreflang reciprocity", async ({ page }) => {
  await page.goto("/en/2000/");

  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { name: /Class of 2000/ })).toBeVisible();

  // hreflang alternates are absolute URLs; we assert path-suffix to stay
  // env-agnostic (the canonical host is set via PUBLIC_SITE_URL).
  const ukAlt = page.locator('link[rel="alternate"][hreflang="uk"]');
  const enAlt = page.locator('link[rel="alternate"][hreflang="en"]');
  await expect(ukAlt).toHaveAttribute("href", /\/2000\/$/);
  await expect(enAlt).toHaveAttribute("href", /\/en\/2000\/$/);
});

test("EN about page sets lang=en and shows scaffold banner", async ({ page }) => {
  await page.goto("/en/about/");

  await expect(page.locator("html")).toHaveAttribute("lang", "en");
  await expect(page.getByRole("heading", { name: /About the project/ })).toBeVisible();
});

test("Language switcher links to the equivalent path", async ({ page }) => {
  await page.goto("/about/");
  await expect(page.locator("html")).toHaveAttribute("lang", "uk");

  // Header switcher: there's a `header` LangSwitcher + a `footer` one. We
  // target the header one (first in the DOM) by scoping to <header>.
  const header = page.locator("header");
  const enLink = header.locator('a[data-lang-choice="en"]');
  await expect(enLink).toHaveAttribute("href", "/en/about/");

  await enLink.click();
  await expect(page).toHaveURL(/\/en\/about\/?$/);
  await expect(page.locator("html")).toHaveAttribute("lang", "en");
});

test("UK default route stays at html lang=uk", async ({ page }) => {
  await page.goto("/");

  await expect(page.locator("html")).toHaveAttribute("lang", "uk");
  await expect(page.locator('meta[property="og:locale"][content="uk_UA"]')).toHaveCount(1);
  await expect(page.locator('meta[property="og:locale:alternate"][content="en"]')).toHaveCount(1);
});
