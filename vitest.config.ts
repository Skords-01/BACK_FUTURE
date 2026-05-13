import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      // Coverage gate scope is intentionally limited to `src/lib/**` —
      // тільки чистий TS (форматери, фільтри, og-генератор тощо). Astro
      // компоненти й сторінки не покриваються vitest-ом за дизайном:
      // - `.astro` файли потребують Astro renderer, що не запускається в
      //   нашому unit-середовищі;
      // - їхній behavioral-shell перевіряється Playwright e2e + axe-аудитом
      //   у `tests/e2e/` (див. CI verify stage).
      // Не ставити сюди `src/components/**` — це навмисний design choice,
      // не недогляд.
      include: ["src/lib/**/*.ts"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
});
