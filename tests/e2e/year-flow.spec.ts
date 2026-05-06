import { expect, test } from "@playwright/test";

test("shows matching updates for a valid graduation year", async ({ page }) => {
  await page.goto("/");

  await page.getByLabel("Рік випуску").fill("2003");
  await page.getByRole("button", { name: "Подивитись" }).click();

  await expect(page).toHaveURL(/\/2003\.html$/);
  await expect(page.getByRole("heading", { name: /Ти пропустив \d+ оновлень/ })).toBeVisible();
  await expect(page.getByText("Перші стандарти")).toBeVisible();
  await expect(page.getByRole("link", { name: "Назад на головну" })).toBeVisible();
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
  await page.goto("/metodologia.html");

  await expect(page.getByRole("heading", { name: "Методологія" })).toBeVisible();
  await expect(page.getByText("Ери шкільних програм")).toBeVisible();
});
