import type { APIContext, GetStaticPaths } from "astro";
import { getCollection } from "astro:content";
import { SITE, SUBJECTS } from "../../config/site";
import { eraById, eraForGraduationYear } from "../../lib/eras";
import { factsForYear, groupBySubject } from "../../lib/filterFacts";

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

function pluralize(n: number, forms: [one: string, few: string, many: string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

export async function GET({ params }: APIContext) {
  const year = Number(params.year);
  const era = eraById(eraForGraduationYear(year));

  const allFacts = await getCollection("facts");
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

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#f7f7f5"/>
  <path d="M0 96h1200M0 192h1200M0 288h1200M0 384h1200M0 480h1200M0 576h1200" stroke="#1e3a8a" stroke-opacity=".08" stroke-width="3"/>
  <rect x="72" y="72" width="1056" height="486" rx="40" fill="#ffffff" stroke="#d6d6d2" stroke-width="2"/>
  <text x="120" y="160" fill="#1e3a8a" font-family="Inter, Arial, sans-serif" font-size="26" font-weight="700" letter-spacing="6">BACK_FUTURE</text>
  <text x="120" y="270" fill="#16161a" font-family="Manrope, Inter, Arial, sans-serif" font-size="80" font-weight="800">${title}</text>
  <text x="120" y="325" fill="#3a3a35" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="600">${subtitle}</text>
  <text x="120" y="405" fill="#262624" font-family="Manrope, Inter, Arial, sans-serif" font-size="40" font-weight="700">${headline}</text>
  <text x="120" y="450" fill="#67675f" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="500" letter-spacing="2">${stats}</text>
  ${pillsSvg}
</svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
    },
  });
}
