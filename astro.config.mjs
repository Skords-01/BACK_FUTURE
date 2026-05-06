// @ts-check
import { defineConfig } from "astro/config";
import tailwind from "@astrojs/tailwind";
import sitemap from "@astrojs/sitemap";

export default defineConfig({
  site: "https://back-future.example.com",
  integrations: [tailwind({ applyBaseStyles: false }), sitemap()],
  output: "static",
  build: {
    inlineStylesheets: "auto",
    format: "file",
  },
  trailingSlash: "never",
});
