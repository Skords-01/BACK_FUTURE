/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        display: ["Manrope", "Inter", "system-ui", "sans-serif"],
        serif: ["'Source Serif Pro'", "Georgia", "serif"],
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
        accent: {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#fb923c",
          500: "#f97316",
          600: "#ea580c",
          700: "#c2410c",
          800: "#9a3412",
          900: "#7c2d12",
        },
      },
      maxWidth: {
        prose: "68ch",
      },
      typography: {
        DEFAULT: {
          css: {
            color: "#262624",
            a: { color: "#c2410c", textDecorationThickness: "2px" },
          },
        },
      },
    },
  },
  plugins: [],
};
