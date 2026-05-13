import { expect, test } from "@playwright/test";

// Smoke test for the saved-facts (bookmark) flow:
// 1. Visit /all/ to pick a fact card, save it via the bookmark button.
// 2. Verify the header counter appears with K=1.
// 3. Visit /saved/ — the saved fact should be the only visible card.
// 4. Unsave it; verify the empty state returns.

test("save, view on /saved, then unsave", async ({ page }) => {
  await page.goto("/all/");

  // Pick the first FactCard's bookmark button.
  const firstBookmark = page.locator("button[data-bookmark-btn]").first();
  await expect(firstBookmark).toBeVisible();
  const slug = await firstBookmark.getAttribute("data-slug");
  expect(slug).toBeTruthy();

  // Precondition: not saved yet.
  await expect(firstBookmark).toHaveAttribute("aria-pressed", "false");

  // Save.
  await firstBookmark.click();
  await expect(firstBookmark).toHaveAttribute("aria-pressed", "true");

  // Header counter unhides with "1".
  const counter = page.locator("#bf-saved-badge");
  await expect(counter).toBeVisible();
  await expect(counter.locator("[data-saved-count]")).toHaveText("1");

  // Navigate to /saved/ via the badge.
  await counter.click();
  await expect(page).toHaveURL(/\/saved\/?$/);
  await expect(page.getByRole("heading", { name: "Збережені факти" })).toBeVisible();

  // The saved card is visible; the empty state is hidden.
  const visibleCards = page.locator("#saved-grid [data-saved-item]:not(.hidden)");
  await expect(visibleCards).toHaveCount(1);
  await expect(page.locator("#saved-empty")).toBeHidden();
  await expect(page.locator("#saved-count")).toContainText(/1\s+(факт|факти|фактів)/);

  // Unsave from /saved/ — the corresponding card has its own bookmark button.
  const savedBookmark = page.locator(
    `#saved-grid [data-saved-item][data-slug="${slug}"] button[data-bookmark-btn]`,
  );
  await expect(savedBookmark).toHaveAttribute("aria-pressed", "true");
  await savedBookmark.click();

  // Empty state returns; header counter hides.
  await expect(page.locator("#saved-empty")).toBeVisible();
  await expect(visibleCards).toHaveCount(0);
  await expect(counter).toBeHidden();
});

test("/saved/ empty state shows guidance", async ({ page }) => {
  await page.goto("/saved/");
  await expect(page.locator("#saved-empty")).toBeVisible();
  await expect(page.locator("#saved-empty")).toContainText("Ще нічого не збережено");
});
