/**
 * Build-time generator for PWA icons.
 *
 * Renders three brand-glyph PNGs into `public/icons/`:
 *   - icon-192.png         (any purpose, 192×192)
 *   - icon-512.png         (any purpose, 512×512)
 *   - icon-512-maskable.png (maskable purpose with ~40% safe-zone padding)
 *
 * These are committed to the repo (placeholder set; swap freely with brand
 * artwork). The script is idempotent — running it again produces identical
 * bytes for the same source SVG. Invoke via:
 *
 *   npx tsx scripts/generate-pwa-icons.ts
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, "..");
const ICONS_DIR = join(REPO_ROOT, "public", "icons");

const ACCENT = "#b9381a";
const PAPER = "#f3ecdc";
const INK = "#1a1813";

/**
 * Generic brand-glyph SVG. `padding` is the inner safe-zone (used for
 * maskable variant — 0.4 ≈ 40% margin per Web App Manifest spec).
 */
function buildIconSvg(size: number, padding = 0): string {
  const inset = Math.round(size * padding);
  const cardSize = size - 2 * inset;
  const radius = Math.round(cardSize * 0.18);
  const fontSize = Math.round(cardSize * 0.42);
  const center = inset + cardSize / 2;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <rect width="${size}" height="${size}" fill="${PAPER}"/>
  <rect x="${inset}" y="${inset}" width="${cardSize}" height="${cardSize}" rx="${radius}" fill="${ACCENT}"/>
  <text x="${center}" y="${center}"
        text-anchor="middle" dominant-baseline="central"
        font-family="Manrope, Inter, system-ui, sans-serif"
        font-size="${fontSize}" font-weight="800" fill="${PAPER}">B/F</text>
  <text x="${center}" y="${center + Math.round(cardSize * 0.28)}"
        text-anchor="middle" dominant-baseline="central"
        font-family="Inter, system-ui, sans-serif"
        font-size="${Math.round(cardSize * 0.06)}" font-weight="600"
        letter-spacing="${Math.max(1, Math.round(cardSize * 0.012))}" fill="${INK}" fill-opacity="0.55">BACK_FUTURE</text>
</svg>`;
}

function renderPng(svg: string, width: number): Buffer {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: width },
    background: PAPER,
    font: { loadSystemFonts: true, defaultFontFamily: "Inter" },
  });
  return Buffer.from(resvg.render().asPng());
}

function write(name: string, bytes: Buffer): void {
  const target = join(ICONS_DIR, name);
  writeFileSync(target, bytes);
  console.log(`wrote ${target} (${bytes.byteLength} bytes)`);
}

function main(): void {
  mkdirSync(ICONS_DIR, { recursive: true });
  write("icon-192.png", renderPng(buildIconSvg(192), 192));
  write("icon-512.png", renderPng(buildIconSvg(512), 512));
  write("icon-512-maskable.png", renderPng(buildIconSvg(512, 0.12), 512));
}

main();
