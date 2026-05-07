/** @type {import('tailwindcss').Config} */
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
        // Mono — DM Mono for serial numbers, year stamps, marks.
        mono: [
          "'DM Mono'",
          "'JetBrains Mono'",
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "monospace",
        ],
      },
      // Cream palette — utility scales reference CSS variables declared in
      // `src/styles/global.css` so that light/dark mode swaps tokens through
      // `:root` / `html.dark`. Hard-coded fallbacks kept for old browsers and
      // tooling that statically inspects classnames.
      colors: {
        ink: {
          50: "var(--ink-50, #f3ecdc)",
          100: "var(--ink-100, #d8d0b3)",
          200: "var(--ink-200, #c8bf9e)",
          300: "var(--ink-300, #a89e80)",
          400: "var(--ink-400, #7a7158)",
          500: "var(--ink-500, #5d553f)",
          600: "var(--ink-600, #4a4332)",
          700: "var(--ink-700, #3a3528)",
          800: "var(--ink-800, #2a261d)",
          900: "var(--ink-900, #1a1813)",
        },
        // Primary accent — помідорний/калиновий, без прапорового патріотизму.
        accent: {
          50: "var(--accent-50, #fdf2ed)",
          100: "var(--accent-100, #f7d8cc)",
          200: "var(--accent-200, #efb6a1)",
          300: "var(--accent-300, #e08566)",
          400: "var(--accent-400, #cc5b3a)",
          500: "var(--accent-500, #b9381a)",
          600: "var(--accent-600, #a02f15)",
          700: "var(--accent-700, #8f2a13)",
          800: "var(--accent-800, #76210f)",
          900: "var(--accent-900, #6b1f0e)",
        },
        // Secondary highlight — теплий бурштин для виносок.
        amber: {
          50: "#fefce8",
          100: "#fef9c3",
          200: "#fef08a",
          300: "#fde047",
          400: "#facc15",
          500: "#eab308",
          600: "#ca8a04",
          700: "#a16207",
        },
        // Cream paper — теплий папір замість синюшної білизни.
        paper: {
          50: "var(--paper, #f3ecdc)",
          100: "var(--paper-2, #ebe2cb)",
          200: "var(--paper-3, #ddd0b2)",
        },
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
          "linear-gradient(to bottom, transparent calc(2rem - 1px), var(--rule, rgba(26, 24, 19, 0.18)) 2rem)",
      },
      backgroundSize: {
        "rule-32": "100% 32px",
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
