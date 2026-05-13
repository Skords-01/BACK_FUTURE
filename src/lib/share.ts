import type { CollectionEntry } from "astro:content";
import { SITE, SUBJECTS } from "../config/site";
import { eraById, eraForGraduationYear } from "./eras";
import { factsForYear, groupBySubject } from "./filterFacts";

export const SHARE_WIDTH = 1080;
export const SHARE_HEIGHT = 1920;

type FactEntry = CollectionEntry<"facts">;

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function pluralize(n: number, forms: [one: string, few: string, many: string]): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

/**
 * Pick a deterministic "top" fact for the poster: prefer high-impact facts
 * that carry a `quote` block; tie-break by id so the same year always yields
 * the same poster (important for cacheability + reproducible builds).
 */
export function pickPosterQuoteFact(facts: readonly FactEntry[]): FactEntry | null {
  const withQuote = facts.filter((f) => f.data.quote !== undefined);
  if (withQuote.length === 0) return null;
  const ranked = withQuote.slice().sort((a, b) => {
    const impactRank = { high: 0, medium: 1, low: 2 } as const;
    const ai = impactRank[a.data.impact ?? "medium"];
    const bi = impactRank[b.data.impact ?? "medium"];
    if (ai !== bi) return ai - bi;
    return a.id.localeCompare(b.id);
  });
  return ranked[0] ?? null;
}

/**
 * Naive word-wrap: split on whitespace, accumulate words while character width
 * stays under `maxChars`, push to new line when overflow. Returns at most
 * `maxLines` lines, appending an ellipsis to the last line if more remained.
 */
export function wrapText(text: string, maxChars: number, maxLines: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const w of words) {
    const candidate = current ? `${current} ${w}` : w;
    if (candidate.length <= maxChars) {
      current = candidate;
    } else {
      if (current) lines.push(current);
      current = w;
      if (lines.length >= maxLines) break;
    }
  }
  if (current && lines.length < maxLines) lines.push(current);
  if (lines.length === maxLines) {
    // Check if there's leftover text — append ellipsis to last line if so.
    const consumed = lines.join(" ").length;
    if (consumed < text.replace(/\s+/g, " ").trim().length) {
      const last = lines[lines.length - 1] ?? "";
      const trimmed = last.length > maxChars - 1 ? last.slice(0, maxChars - 1) : last;
      lines[lines.length - 1] = `${trimmed.replace(/[.,;:!?]+$/, "")}…`;
    }
  }
  return lines;
}

export interface SharePosterParts {
  year: number;
  totalCount: number;
  subjectsCount: number;
  eraLabel: string;
  quoteText: string | null;
  quoteAuthor: string | null;
}

/**
 * Compute the parts the SVG template needs from the raw facts collection.
 * Exposed for tests and for `share/[year].astro` (so the preview page shows
 * the same data as the rendered PNG).
 */
export function computeSharePosterParts(
  year: number,
  allFacts: readonly FactEntry[],
): SharePosterParts {
  const era = eraById(eraForGraduationYear(year));
  const matched = factsForYear(allFacts, year);
  const groups = groupBySubject(matched);
  const top = pickPosterQuoteFact(matched);
  return {
    year,
    totalCount: matched.length,
    subjectsCount: groups.length,
    eraLabel: era.label,
    quoteText: top?.data.quote?.text ?? null,
    quoteAuthor: top?.data.quote?.author ?? null,
  };
}

export function buildSharePosterSvg(year: number, allFacts: readonly FactEntry[]): string {
  const era = eraById(eraForGraduationYear(year));
  const matched = factsForYear(allFacts, year);
  const groups = groupBySubject(matched);
  const totalCount = matched.length;
  const subjectsCount = groups.length;
  const top = pickPosterQuoteFact(matched);

  const factsLabel = pluralize(totalCount, ["оновлення", "оновлення", "оновлень"]);
  const subjectsLabel = pluralize(subjectsCount, ["предмет", "предмети", "предметів"]);
  const yearText = escapeXml(String(year));
  const eraLabel = escapeXml(era.label);

  const headline =
    totalCount > 0
      ? escapeXml(`Ти пропустив ${totalCount} ${factsLabel}`)
      : escapeXml("Тут поки тихо. Ми поповнюємо.");
  const stats =
    totalCount > 0
      ? escapeXml(`${totalCount} ${factsLabel} · ${subjectsCount} ${subjectsLabel}`)
      : escapeXml("Сайт постійно поповнюється");

  // Quote block.
  let quoteBlock = "";
  if (top?.data.quote) {
    const lines = wrapText(top.data.quote.text, 32, 5);
    const lineHeight = 76;
    const startY = 1080;
    const quoteLines = lines
      .map(
        (line, i) =>
          `<text x="540" y="${startY + i * lineHeight}" fill="#16161a" font-family="Manrope, Inter, Arial, sans-serif" font-size="56" font-weight="700" text-anchor="middle">${escapeXml(line)}</text>`,
      )
      .join("");
    const authorY = startY + lines.length * lineHeight + 60;
    const author = escapeXml(`— ${top.data.quote.author}`);
    quoteBlock = `
  <text x="540" y="1000" fill="#1e3a8a" font-family="Manrope, Inter, Arial, sans-serif" font-size="120" font-weight="800" text-anchor="middle" opacity="0.18">"</text>
  ${quoteLines}
  <text x="540" y="${authorY}" fill="#3a3a35" font-family="Inter, Arial, sans-serif" font-size="32" font-weight="500" text-anchor="middle">${author}</text>`;
  } else if (totalCount === 0) {
    quoteBlock = `
  <text x="540" y="1140" fill="#3a3a35" font-family="Inter, Arial, sans-serif" font-size="38" font-weight="500" text-anchor="middle">Шкода, фактів для цього року поки немає.</text>
  <text x="540" y="1200" fill="#67675f" font-family="Inter, Arial, sans-serif" font-size="32" font-weight="400" text-anchor="middle">Загляни до сусідніх років — там є чим здивуватись.</text>`;
  }

  // Subject pills along the bottom. Use the typographic Cyrillic `mark`
  // (АСТ / БІО / …) instead of emoji — resvg + system fonts on CI cannot
  // shape colour-emoji glyphs reliably, so emoji would render as empty
  // squares. The mark is more legible at poster scale anyway.
  const pillCovered = SUBJECTS.map((s) => {
    const group = groups.find((g) => g.subject === s.id);
    return { ...s, count: group?.items.length ?? 0 };
  })
    .filter((p) => p.count > 0)
    .slice(0, 6);

  const pillStartX = 100;
  const pillY = 1620;
  const pillHeight = 72;
  const pillGap = 16;
  let cursor = pillStartX;
  const pills: string[] = [];
  for (const p of pillCovered) {
    const text = `${p.mark} ${p.count}`;
    const pillWidth = 28 + text.length * 18;
    if (cursor + pillWidth > SHARE_WIDTH - pillStartX) break;
    pills.push(
      `<g><rect x="${cursor}" y="${pillY}" width="${pillWidth}" height="${pillHeight}" rx="${pillHeight / 2}" fill="#eff4ff" stroke="#bfd1fe" stroke-width="2"/><text x="${cursor + pillWidth / 2}" y="${pillY + 48}" fill="#1e3a8a" font-family="Inter, Arial, sans-serif" font-size="32" font-weight="600" text-anchor="middle">${escapeXml(text)}</text></g>`,
    );
    cursor += pillWidth + pillGap;
  }
  const pillsSvg = pills.join("");

  const footerUrl = escapeXml(`back-future · /${year}`);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SHARE_WIDTH}" height="${SHARE_HEIGHT}" viewBox="0 0 ${SHARE_WIDTH} ${SHARE_HEIGHT}">
  <rect width="${SHARE_WIDTH}" height="${SHARE_HEIGHT}" fill="#f7f7f5"/>
  <path d="M0 160h1080M0 320h1080M0 480h1080M0 640h1080M0 800h1080M0 960h1080M0 1120h1080M0 1280h1080M0 1440h1080M0 1600h1080M0 1760h1080" stroke="#1e3a8a" stroke-opacity=".06" stroke-width="3"/>
  <rect x="60" y="60" width="${SHARE_WIDTH - 120}" height="${SHARE_HEIGHT - 120}" rx="48" fill="#ffffff" stroke="#d6d6d2" stroke-width="3"/>
  <text x="540" y="200" fill="#1e3a8a" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="700" letter-spacing="10" text-anchor="middle">BACK_FUTURE</text>
  <text x="540" y="280" fill="#67675f" font-family="Inter, Arial, sans-serif" font-size="32" font-weight="500" letter-spacing="4" text-anchor="middle">${escapeXml(SITE.tagline)}</text>
  <text x="540" y="620" fill="#16161a" font-family="Manrope, Inter, Arial, sans-serif" font-size="320" font-weight="800" text-anchor="middle">${yearText}</text>
  <text x="540" y="700" fill="#3a3a35" font-family="Inter, Arial, sans-serif" font-size="44" font-weight="600" text-anchor="middle">${eraLabel}</text>
  <text x="540" y="820" fill="#262624" font-family="Manrope, Inter, Arial, sans-serif" font-size="50" font-weight="700" text-anchor="middle">${headline}</text>
  <text x="540" y="880" fill="#67675f" font-family="Inter, Arial, sans-serif" font-size="32" font-weight="500" letter-spacing="3" text-anchor="middle">${stats}</text>
  ${quoteBlock}
  ${pillsSvg}
  <text x="540" y="1820" fill="#67675f" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="500" letter-spacing="5" text-anchor="middle">${footerUrl}</text>
</svg>`;
}
