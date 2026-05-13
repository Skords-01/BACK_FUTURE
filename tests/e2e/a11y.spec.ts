import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Auto-catch a11y regressions on the most-visited pages. We scan with
// WCAG 2.0/2.1 A + AA rules and fail the run on any "critical" violation.
// Lower-impact violations are surfaced in stdout for triage but don't break
// CI yet — there is a known backlog of serious-level contrast / structure
// issues (e.g. .text-ink-400 on paper, stats <dl> in /timeline) that need
// a dedicated cleanup pass. Once that lands, raise the bar to "serious".

const PAGES = [
  { path: "/", label: "homepage" },
  { path: "/2003/", label: "year (filled)" },
  { path: "/metodologia/", label: "methodology" },
  { path: "/timeline/", label: "vertical timeline" },
  { path: "/about/", label: "about" },
  { path: "/all/", label: "all facts" },
  { path: "/quiz/", label: "quiz" },
  { path: "/fact/crispr-cas9/", label: "fact detail" },
  { path: "/era/1991-1995/", label: "era detail" },
  { path: "/subject/biology/", label: "subject detail" },
] as const;

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];
const BLOCKING_IMPACT = new Set(["critical"]);

for (const { path, label } of PAGES) {
  test(`a11y scan: ${label} (${path})`, async ({ page }) => {
    await page.goto(path);
    // Wait for the main landmark — guards against axe scanning a half-rendered
    // page that hasn't yet hydrated reveal-observers / theme toggle scripts.
    await expect(page.getByRole("main")).toBeVisible();

    const results = await new AxeBuilder({ page }).withTags(TAGS).analyze();

    const blocking = results.violations.filter((v) => BLOCKING_IMPACT.has(v.impact ?? ""));

    if (results.violations.length > 0) {
      // Surface every violation so triage is easy from the CI log, even when
      // only blocking ones fail the assertion.
      console.log(
        `axe violations on ${path}:`,
        results.violations
          .map(
            (v) =>
              `\n  [${v.impact}] ${v.id}: ${v.help} (${v.nodes.length} node${v.nodes.length === 1 ? "" : "s"})`,
          )
          .join(""),
      );
    }

    expect(
      blocking,
      `Blocking a11y violations on ${path}:\n${blocking
        .map((v) => `- ${v.id} (${v.impact}): ${v.help}\n  ${v.helpUrl}`)
        .join("\n")}`,
    ).toEqual([]);
  });
}
