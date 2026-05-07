import type { CollectionEntry } from "astro:content";
import { SITE, SUBJECTS } from "../config/site";
import { eraById, eraForGraduationYear } from "./eras";
import { factsForYear, groupBySubject } from "./filterFacts";

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function pluralize(n: number, forms: [one: string, few: string, many: string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

export function buildYearOgSvg(year: number, allFacts: CollectionEntry<"facts">[]): string {
  const era = eraById(eraForGraduationYear(year));
  const matched = factsForYear(allFacts, year);
  const groups = groupBySubject(matched);
  const totalCount = matched.length;
  const subjectsCount = groups.length;

  const title = escapeXml(`Випуск ${year}`);
  const subtitle = escapeXml(era.label);
  const factsLabel = pluralize(totalCount, ["оновлення", "оновлення", "оновлень"]);
  const subjectsLabel = pluralize(subjectsCount, ["предмет", "предмети", "предметів"]);

  const headline =
    totalCount > 0
      ? escapeXml(`Ти пропустив ${totalCount} ${factsLabel}`)
      : escapeXml("Тут поки тихо. Ми поповнюємо.");

  const pillCovered = SUBJECTS.map((s) => {
    const group = groups.find((g) => g.subject === s.id);
    return { ...s, count: group?.items.length ?? 0 };
  }).filter((p) => p.count > 0);

  const pillStartX = 120;
  const pillY = 480;
  const pillHeight = 56;
  const pillGap = 14;
  let cursor = pillStartX;
  const pills: string[] = [];
  for (const p of pillCovered) {
    const text = `${p.emoji} ${p.count}`;
    const charCount = String(p.count).length;
    const pillWidth = 76 + charCount * 14;
    pills.push(
      `<g><rect x="${cursor}" y="${pillY}" width="${pillWidth}" height="${pillHeight}" rx="${pillHeight / 2}" fill="#eff4ff" stroke="#bfd1fe" stroke-width="1.5"/><text x="${cursor + pillWidth / 2}" y="${pillY + 38}" fill="#1e3a8a" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="600" text-anchor="middle">${escapeXml(text)}</text></g>`,
    );
    cursor += pillWidth + pillGap;
    if (cursor > 1080) break;
  }
  const pillsSvg = pills.join("");

  const stats =
    totalCount > 0
      ? escapeXml(`${totalCount} ${factsLabel} · ${subjectsCount} ${subjectsLabel}`)
      : escapeXml("Сайт постійно поповнюється");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}">
  <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="#f7f7f5"/>
  <path d="M0 96h1200M0 192h1200M0 288h1200M0 384h1200M0 480h1200M0 576h1200" stroke="#1e3a8a" stroke-opacity=".08" stroke-width="3"/>
  <rect x="72" y="72" width="1056" height="486" rx="40" fill="#ffffff" stroke="#d6d6d2" stroke-width="2"/>
  <text x="120" y="160" fill="#1e3a8a" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="700" letter-spacing="6">BACK_FUTURE</text>
  <text x="120" y="270" fill="#16161a" font-family="Manrope, Inter, Arial, sans-serif" font-size="80" font-weight="800">${title}</text>
  <text x="120" y="325" fill="#3a3a35" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="600">${subtitle}</text>
  <text x="120" y="405" fill="#262624" font-family="Manrope, Inter, Arial, sans-serif" font-size="40" font-weight="700">${headline}</text>
  <text x="120" y="450" fill="#67675f" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="500" letter-spacing="2">${stats}</text>
  ${pillsSvg}
</svg>`;
}

export function buildDefaultOgSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${OG_WIDTH}" height="${OG_HEIGHT}" viewBox="0 0 ${OG_WIDTH} ${OG_HEIGHT}">
  <rect width="${OG_WIDTH}" height="${OG_HEIGHT}" fill="#f7f7f5"/>
  <path d="M0 96h1200M0 192h1200M0 288h1200M0 384h1200M0 480h1200M0 576h1200" stroke="#1e3a8a" stroke-opacity=".08" stroke-width="3"/>
  <rect x="72" y="72" width="1056" height="486" rx="40" fill="#ffffff" stroke="#d6d6d2" stroke-width="2"/>
  <text x="120" y="180" fill="#1e3a8a" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="700" letter-spacing="6">${escapeXml(SITE.name)}</text>
  <text x="120" y="320" fill="#16161a" font-family="Manrope, Inter, Arial, sans-serif" font-size="64" font-weight="800">${escapeXml(SITE.tagline)}</text>
  <text x="120" y="410" fill="#3a3a35" font-family="Inter, Arial, sans-serif" font-size="34">${escapeXml(SITE.description)}</text>
</svg>`;
}

/**
 * Конвертує SVG (як рядок) у PNG-буфер. Викликається тільки під час build-у
 * (для статичних `.png.ts` ендпоінтів), тому динамічний `import()` мінімізує
 * враження на dev-server / SSR — resvg підтягується тільки коли потрібно.
 *
 * `font.loadSystemFonts: true` змушує resvg сканити локальні шрифти. На
 * GitHub Actions це шрифти Ubuntu (DejaVu / Noto) — вони покривають кирилицю.
 */
export async function svgToPng(svg: string): Promise<Uint8Array> {
  const { Resvg } = await import("@resvg/resvg-js");
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: OG_WIDTH },
    background: "#f7f7f5",
    font: {
      loadSystemFonts: true,
      defaultFontFamily: "Inter",
    },
  });
  return resvg.render().asPng();
}
