import { expect, test } from "@playwright/test";

// Mobile smoke pack: ловить найдратівніші регресії, які видно лише на вузькому
// екрані (горизонтальний скрол, обрізана навігація, зламаний `<input type="number">`).
// Запускається тільки в проєкті `mobile-chrome` через `testMatch` у
// `playwright.config.ts`.

const NARROW_VIEWPORT = { width: 375, height: 812 } as const;

const KEY_PAGES = ["/", "/2003/", "/metodologia/", "/about/"] as const;

test.describe("mobile @375px", () => {
  test.beforeEach(async ({ page }) => {
    // Pixel 7 (412px) — дефолт проєкту, але 375px (iPhone SE / 13 mini) — найвужчий
    // realistic-кейс, який ми гарантуємо. Один кадр налаштування на тест дешевший
    // за окремий `devices` запис.
    await page.setViewportSize(NARROW_VIEWPORT);
  });

  for (const path of KEY_PAGES) {
    test(`no horizontal scroll on ${path}`, async ({ page }) => {
      await page.goto(path);
      // `<html>` не скролиться вбік — тобто content не лізе за viewport.
      const overflow = await page.evaluate(() => {
        const doc = document.documentElement;
        return {
          scrollWidth: doc.scrollWidth,
          clientWidth: doc.clientWidth,
        };
      });
      expect(overflow.scrollWidth).toBeLessThanOrEqual(overflow.clientWidth + 1);
    });
  }

  test("year submit works with mobile-friendly numeric keyboard", async ({ page }) => {
    await page.goto("/");
    const input = page.getByLabel("Рік випуску");
    await expect(input).toHaveAttribute("inputmode", "numeric");
    await expect(input).toHaveAttribute("pattern", "[0-9]*");
    await input.fill("2010");
    await page.getByRole("button", { name: "Подивитись" }).click();
    await expect(page).toHaveURL(/\/2010\/?$/);
  });

  test("primary nav remains reachable on narrow viewport", async ({ page }) => {
    await page.goto("/");
    const nav = page.getByRole("navigation", { name: "Основна навігація" });
    // Якщо нав схований за burger-меню — відкриваємо його. Inline-нав на більших
    // макетах одразу видимий, тому toggle опціональний (не у всіх реалізаціях
    // він взагалі рендериться). Перевірка `aria-expanded` на toggle після
    // кліку гарантує, що бургер коректно зв'язаний з nav через `aria-controls`.
    const toggle = page
      .getByRole("button")
      .filter({ has: page.locator(`[aria-controls="${await nav.getAttribute("id")}"]`) });
    if (await toggle.count()) {
      await expect(toggle).toBeVisible();
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-expanded", "true");
    }
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link", { name: "Методологія" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Про проєкт" })).toBeVisible();
  });

  test("filters layout adapts on narrow viewport", async ({ page }) => {
    await page.goto("/2003/");
    const filtersForm = page.locator("[data-year-filters]");
    await expect(filtersForm).toBeVisible();
    // Селекти не повинні вилазити за viewport (типова регресія, коли
    // `min-width` десь забутий).
    const selectsBoxes = await filtersForm.locator("select").evaluateAll((nodes) =>
      nodes.map((n) => {
        const r = n.getBoundingClientRect();
        return { right: r.right, width: r.width };
      }),
    );
    for (const box of selectsBoxes) {
      expect(box.right).toBeLessThanOrEqual(NARROW_VIEWPORT.width + 1);
      expect(box.width).toBeGreaterThan(40);
    }
  });
});
