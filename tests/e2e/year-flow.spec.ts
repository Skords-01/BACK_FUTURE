import { expect, test } from "@playwright/test";

test("shows matching updates for a valid graduation year", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Рік випуску").fill("2003");
  await page.getByRole("button", { name: "Подивитись" }).click();

  await expect(page).toHaveURL(/\/2003\/?$/);
  await expect(page.getByRole("heading", { name: /Випуск 2003/ })).toBeVisible();
  await expect(page.getByText(/Ти пропустив \d+ оновлен/)).toBeVisible();
  await expect(page.getByRole("link", { name: /Перші стандарти/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "На головну" })).toBeVisible();
});

test("validates graduation year range on the landing page", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Рік випуску").evaluate((input) => {
    if (!(input instanceof HTMLInputElement)) {
      throw new Error("Expected a year input");
    }
    input.value = "1980";
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.dispatchEvent(new Event("change", { bubbles: true }));
  });
  await page.getByRole("button", { name: "Подивитись" }).click();

  await expect(page.getByLabel("Рік випуску")).toHaveAttribute("aria-invalid", "true");
  await expect(page).toHaveURL("/");
});

test("renders methodology page", async ({ page }) => {
  await page.goto("/metodologia/");

  await expect(page.getByRole("heading", { name: "Методологія" })).toBeVisible();
  await expect(page.getByText("Ери шкільних програм")).toBeVisible();
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
  await expect(mainNav.getByRole("link", { name: "Методологія" })).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(mainNav.getByRole("link", { name: "Про проєкт" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/about\/?$/);
});
