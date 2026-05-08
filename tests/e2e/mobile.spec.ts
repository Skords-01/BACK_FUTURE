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
    // Якщо є burger-toggle (button[aria-controls=...]) — відкриваємо панель.
    // Беремо CSS-locator, а не `getByRole("navigation")`, бо приховане display:none
    // меню випадає з accessibility tree, і `getByRole` зависає на `getAttribute`.
    // На десктопному inline-наві кнопка не рендериться — тоді просто проходимо далі.
    const toggle = page.locator("button[aria-controls]").first();
    if ((await toggle.count()) && (await toggle.isVisible())) {
      const navId = await toggle.getAttribute("aria-controls");
      expect(navId).toBeTruthy();
      await toggle.click();
      await expect(toggle).toHaveAttribute("aria-expanded", "true");
      // sanity: aria-controls справді посилається на «Основну навігацію».
      await expect(page.locator(`#${navId}`)).toHaveAttribute("aria-label", "Основна навігація");
    }
    const nav = page.getByRole("navigation", { name: "Основна навігація" });
    await expect(nav).toBeVisible();
    await expect(nav.getByRole("link", { name: "Методологія" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Про проєкт" })).toBeVisible();
  });

  test("sticky header keeps stuck to viewport top after scroll", async ({ page }) => {
    // Регресія: коли на <body> стояв `overflow-x: hidden` (через Tailwind-клас
    // у Base.astro) або `overflow-x: clip` у global.css, Chromium на mobile
    // робив body окремим scroll-container-ом, і `position: sticky` хедера
    // переставав прилипати — він просто скролився разом зі сторінкою.
    // Цей тест ловить регресію на найкритичнішому ширині.
    await page.goto("/2003/");
    const header = page.locator("header").first();
    await expect(header).toBeVisible();

    // До скролу — sticky-хедер вгорі (top ≈ 0).
    const topBefore = await header.evaluate((el) => el.getBoundingClientRect().top);
    expect(topBefore).toBeLessThanOrEqual(1);

    // Скролимо вниз достатньо, щоб виявити broken sticky.
    await page.evaluate(() => {
      const el = document.scrollingElement || document.documentElement;
      el.scrollTop = 800;
    });

    const topAfter = await header.evaluate((el) => el.getBoundingClientRect().top);
    expect(topAfter).toBeLessThanOrEqual(1);
    // Якщо sticky зламана, topAfter буде ≈ -800 (хедер виїхав з viewport-у).
    // Поріг 50px дає простір для round-up при rendering.
    expect(topAfter).toBeGreaterThan(-50);
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
