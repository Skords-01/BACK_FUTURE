// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

const site = process.env.PUBLIC_SITE_URL ?? "https://back-future.example.com";

export default defineConfig({
  site,
  integrations: [sitemap()],
  output: "static",
  build: {
    inlineStylesheets: "auto",
    format: "file",
  },
  trailingSlash: "never",
  vite: {
    plugins: [tailwindcss()],
  },
});
