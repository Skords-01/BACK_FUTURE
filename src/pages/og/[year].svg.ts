import type { APIContext, GetStaticPaths } from "astro";
import { SITE } from "../../config/site";
import { eraById, eraForGraduationYear } from "../../lib/eras";

export const getStaticPaths: GetStaticPaths = () => {
  const paths: { params: { year: string } }[] = [];
  for (let year = SITE.yearMin; year <= SITE.yearMax; year++) {
    paths.push({ params: { year: String(year) } });
  }
  return paths;
};

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function GET({ params }: APIContext) {
  const year = Number(params.year);
  const era = eraById(eraForGraduationYear(year));
  const title = escapeXml(`Випуск ${year}`);
  const subtitle = escapeXml(era.label);

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#f7f7f5"/>
  <path d="M0 96h1200M0 192h1200M0 288h1200M0 384h1200M0 480h1200M0 576h1200" stroke="#1e3a8a" stroke-opacity=".08" stroke-width="3"/>
  <rect x="72" y="72" width="1056" height="486" rx="40" fill="#ffffff" stroke="#d6d6d2" stroke-width="2"/>
  <text x="120" y="175" fill="#1e3a8a" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="700" letter-spacing="6">BACK_FUTURE</text>
  <text x="120" y="315" fill="#16161a" font-family="Manrope, Inter, Arial, sans-serif" font-size="92" font-weight="800">${title}</text>
  <text x="120" y="398" fill="#3a3a35" font-family="Inter, Arial, sans-serif" font-size="38" font-weight="600">${subtitle}</text>
  <text x="120" y="480" fill="#67675f" font-family="Inter, Arial, sans-serif" font-size="30">${escapeXml(SITE.tagline)}</text>
</svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
    },
  });
}
