import { expect, test } from "@playwright/test";

// Year-flow smoke tests target the home → /[year]/ → /metodologia/ flow plus
// landing-page keyboard navigation. The home picker is now a "Year Machine"
// (stepper + odometer + GoButton anchor + decade QuickPicks), not a free-form
// numeric input — see src/components/YearMachine.astro and src/scripts/year-machine.ts.

test("shows matching updates for a valid graduation year", async ({ page }) => {
  await page.goto("/");

  // QuickPicks "00-ті" → setYear(2003) → year:change → GoButton href = /2003/
  await page.getByRole("button", { name: /Вибрати 2003 рік/ }).click();
  // Wait for GoButton to receive the updated href before clicking it.
  await expect(page.locator("#go-button")).toHaveAttribute("href", "/2003/");
  await page.getByRole("link", { name: /ПОЇХАЛИ/ }).click();

  await expect(page).toHaveURL(/\/2003\/?$/);
  await expect(page.getByRole("heading", { name: /Випуск 2003/ })).toBeVisible();
  await expect(page.getByText(/Ти пропустив/)).toBeVisible();
  await expect(page.getByRole("link", { name: "На головну", exact: true })).toBeVisible();
});

test("clamps out-of-range graduation year on the landing page", async ({ page }) => {
  // The Year Machine clamps any incoming `?y=` query param to the supported
  // [yearMin, yearMax] window via year-machine.ts → clamp(). We assert that
  // 1980 (below YEAR_MIN=1991) lands the user on the minimum year, not on a
  // broken state. The odometer publishes the active year via aria-label.
  await page.goto("/?y=1980");

  const odometer = page.locator("#year-odometer");
  await expect(odometer).toHaveAttribute("aria-label", /^Рік: 1991$/, { timeout: 5_000 });
  await expect(page.locator("#go-button")).toHaveAttribute("href", "/1991/");
});

test("renders methodology page", async ({ page }) => {
  await page.goto("/metodologia/");

  await expect(page.getByRole("heading", { name: "Методологія" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /П'ять ер шкільних програм/ })).toBeVisible();
});

test("supports keyboard navigation and core landmarks", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();
  await expect(page.getByRole("navigation", { name: "Основна навігація" })).toBeVisible();

  const mainNav = page.getByRole("navigation", { name: "Основна навігація" });
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Перейти до контенту" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "BACK_FUTURE" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(mainNav.getByRole("link", { name: "Головна" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(mainNav.getByRole("link", { name: "Хронологія" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(mainNav.getByRole("link", { name: "Квіз" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(mainNav.getByRole("link", { name: "Методологія" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(mainNav.getByRole("link", { name: "Про проєкт" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/about\/?$/);
});
