/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        display: ["Manrope", "Inter", "system-ui", "sans-serif"],
        serif: ["'Source Serif Pro'", "Georgia", "serif"],
        mono: ["'JetBrains Mono'", "ui-monospace", "SFMono-Regular", "Menlo", "monospace"],
      },
      colors: {
        ink: {
          50: "#f7f7f5",
          100: "#ececea",
          200: "#d6d6d2",
          300: "#b3b3ad",
          400: "#8a8a82",
          500: "#67675f",
          600: "#4d4d47",
          700: "#3a3a35",
          800: "#262624",
          900: "#16161a",
        },
        // Primary accent — deep schoolbook ink-blue.
        accent: {
          50: "#eff4ff",
          100: "#dbe6fe",
          200: "#bfd1fe",
          300: "#93b4fd",
          400: "#608cf9",
          500: "#3b66f1",
          600: "#2547dc",
          700: "#1e3a8a",
          800: "#1c3270",
          900: "#1a2c5d",
        },
        // Secondary highlight — warm amber for callouts / тонкі акценти.
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
        // Light schoolbook-paper tint.
        paper: {
          50: "#fcfaf3",
          100: "#f7f3e6",
          200: "#ece4cf",
        },
      },
      maxWidth: {
        prose: "68ch",
      },
      typography: {
        DEFAULT: {
          css: {
            color: "#262624",
            a: { color: "#1e3a8a", textDecorationThickness: "2px" },
          },
        },
      },
      backgroundImage: {
        // Subtle ruled-paper line, every 32px. Used only in hero section.
        "rule-paper": "linear-gradient(to bottom, transparent 31px, rgba(30, 58, 138, 0.06) 32px)",
      },
      backgroundSize: {
        "rule-32": "100% 32px",
      },
      boxShadow: {
        // Slightly lifted index-card shadow.
        card: "0 1px 0 rgba(20, 20, 24, 0.04), 0 8px 16px -8px rgba(20, 20, 24, 0.08)",
        "card-hover": "0 1px 0 rgba(20, 20, 24, 0.04), 0 12px 24px -10px rgba(20, 20, 24, 0.14)",
      },
    },
  },
  plugins: [],
};
