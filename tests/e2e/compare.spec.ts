import { expect, test } from "@playwright/test";

// `/compare` smoke pack. The page is fully static (Astro `output: "static"`),
// so the comparison view is hydrated entirely from query params client-side.
// Tests assert:
//   - landing page renders the picker form
//   - `?a=…&b=…` renders the side-by-side view with both year headings
//   - `?a=…&b=…` with `a === b` falls back to the form with a friendly error
//   - swap button switches the two year columns

test("renders the picker form when no params are present", async ({ page }) => {
  await page.goto("/compare/");

  await expect(page.getByRole("heading", { name: /Порівняти роки/ })).toBeVisible();
  // Form is in "form" mode → submit button "Порівняти" must be reachable.
  await expect(page.getByRole("button", { name: /Порівняти/, exact: false })).toBeVisible();
  await expect(page.getByRole("button", { name: /Випадкова пара/ }).first()).toBeVisible();
  // Compare view is hidden in form mode.
  await expect(page.locator("#compare-view")).toBeHidden();
});

test("renders side-by-side view for /compare?a=2000&b=2015", async ({ page }) => {
  await page.goto("/compare/?a=2000&b=2015");

  await expect(page.locator("#compare-view")).toBeVisible();
  await expect(page.locator("#compare-form")).toBeHidden();

  // Two year columns must display their year numbers.
  await expect(page.locator('.compare-col[data-side="a"] [data-bind="year-display"]')).toHaveText(
    "2000",
  );
  await expect(page.locator('.compare-col[data-side="b"] [data-bind="year-display"]')).toHaveText(
    "2015",
  );

  // H1 should reflect the active pair.
  await expect(page.getByRole("heading", { name: /2000 vs 2015/, level: 1 })).toBeVisible();

  // Each column should have a clickable "open full year" link.
  await expect(page.locator('.compare-col[data-side="a"] [data-bind="year-link"]')).toHaveAttribute(
    "href",
    "/2000/",
  );
  await expect(page.locator('.compare-col[data-side="b"] [data-bind="year-link"]')).toHaveAttribute(
    "href",
    "/2015/",
  );
});

test("rejects a === b with a friendly inline error", async ({ page }) => {
  await page.goto("/compare/?a=2010&b=2010");

  await expect(page.locator("#compare-form")).toBeVisible();
  await expect(page.locator("#compare-view")).toBeHidden();
  await expect(page.locator("#compare-error")).toBeVisible();
  await expect(page.locator("#compare-error")).toContainText(/різні роки/);
});

test("swap button mirrors the two year columns", async ({ page }) => {
  await page.goto("/compare/?a=1998&b=2010");

  const aYear = page.locator('.compare-col[data-side="a"] [data-bind="year-display"]');
  const bYear = page.locator('.compare-col[data-side="b"] [data-bind="year-display"]');
  await expect(aYear).toHaveText("1998");
  await expect(bYear).toHaveText("2010");

  await page.getByRole("button", { name: /Поміняти місцями/ }).click();

  await expect(aYear).toHaveText("2010");
  await expect(bYear).toHaveText("1998");
  await expect(page).toHaveURL(/[?&]a=2010(&|$)/);
  await expect(page).toHaveURL(/[?&]b=1998(&|$)/);
});
