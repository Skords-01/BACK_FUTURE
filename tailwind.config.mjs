/** @type {import('tailwindcss').Config} */
// Colour scales (`ink`, `accent`, `paper`) live in `src/styles/global.css`
// as `@theme` `--color-*` tokens — Tailwind 4 picks them up automatically
// and they swap on `:root` / `html.dark`. Anything that *isn't* tokenised
// in CSS yet (`fontFamily`, `boxShadow`, `backgroundImage`, `maxWidth`,
// `typography`) stays here.
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      fontFamily: {
        // Body — Geist for clean modern reading; Inter as broad fallback.
        sans: ["Geist", "Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        // Display — Unbounded for "modern, sans, present" headings.
        display: ["Unbounded", "Geist", "Inter", "system-ui", "sans-serif"],
        serif: ["'Source Serif Pro'", "Georgia", "serif"],
        // Mono — JetBrains Mono for serial numbers, year stamps, marks.
        mono: ["'JetBrains Mono'", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      maxWidth: {
        prose: "68ch",
      },
      typography: {
        DEFAULT: {
          css: {
            color: "var(--ink-2, #2a261d)",
            a: { color: "var(--accent, #b9381a)", textDecorationThickness: "2px" },
          },
        },
      },
      backgroundImage: {
        // Subtle ruled-paper line — токенізовано через --rule (зміна в темній темі).
        "rule-paper":
          "linear-gradient(to bottom, transparent calc(2rem - 1px), var(--rule, rgba(26, 24, 19, 0.1)) 2rem)",
      },
      boxShadow: {
        // Slightly lifted index-card shadow — токенізовано.
        card: "var(--shadow, 0 1px 0 rgba(26, 24, 19, 0.05), 0 14px 28px -16px rgba(26, 24, 19, 0.22))",
        "card-hover":
          "var(--shadow-hi, 0 1px 0 rgba(26, 24, 19, 0.05), 0 22px 40px -18px rgba(26, 24, 19, 0.32))",
      },
    },
  },
  plugins: [],
};
