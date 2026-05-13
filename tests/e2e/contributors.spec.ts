import { expect, test } from "@playwright/test";

// Smoke test for /contributors/ — гарантуємо, що сторінка рендериться, має
// очікувані лендмарки, breadcrumb-посилання та CTA-блок «Стати контриб'ютором»
// (з лінком на issue-template `new-fact.yml`). На момент написання у репо є
// 2 демо-факти з `authors` полем, тому ми перевіряємо, що блок «Найбільший
// внесок» з'являється — але без хардкоду конкретних імен (контент може
// еволюціонувати, тест повинен лишатись стабільним).

test("renders /contributors/ with hero, top-3 section, and CTA", async ({ page }) => {
  await page.goto("/contributors/");

  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Контриб'ютори", level: 1 })).toBeVisible();

  // Breadcrumb «← Головна» веде на корінь.
  await expect(page.getByRole("link", { name: /← Головна/ })).toHaveAttribute("href", "/");

  // CTA-блок: «Запропонувати факт» лінкує на GitHub issue-template, «Як додати
  // факт» — на README (через repoUrl).
  const proposeLink = page.getByRole("link", { name: /Запропонувати факт/ });
  await expect(proposeLink).toHaveAttribute(
    "href",
    /github\.com\/Skords-01\/BACK_FUTURE\/issues\/new\?template=new-fact\.yml$/,
  );
  await expect(page.getByRole("link", { name: /Як додати факт/ })).toBeVisible();

  // Якщо є хоча б один контриб'ютор (а він є — 2 demo-факти у репо), має
  // відрендеритись секція «Найбільший внесок» з нумерацією №01..
  await expect(page.getByRole("heading", { name: "Найбільший внесок" })).toBeVisible();
  await expect(page.getByText(/№ 01/)).toBeVisible();
});

test("footer link points to /contributors/", async ({ page }) => {
  await page.goto("/");
  const footer = page.getByRole("contentinfo");
  await expect(footer.getByRole("link", { name: "Контриб'ютори" })).toHaveAttribute(
    "href",
    "/contributors/",
  );
});
