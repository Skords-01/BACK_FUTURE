import { SITE } from "../../config/site";

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

export function GET() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#f7f7f5"/>
  <path d="M0 96h1200M0 192h1200M0 288h1200M0 384h1200M0 480h1200M0 576h1200" stroke="#1e3a8a" stroke-opacity=".08" stroke-width="3"/>
  <rect x="72" y="72" width="1056" height="486" rx="40" fill="#ffffff" stroke="#d6d6d2" stroke-width="2"/>
  <text x="120" y="180" fill="#1e3a8a" font-family="Inter, Arial, sans-serif" font-size="28" font-weight="700" letter-spacing="6">${escapeXml(SITE.name)}</text>
  <text x="120" y="320" fill="#16161a" font-family="Manrope, Inter, Arial, sans-serif" font-size="64" font-weight="800">${escapeXml(SITE.tagline)}</text>
  <text x="120" y="410" fill="#3a3a35" font-family="Inter, Arial, sans-serif" font-size="34">${escapeXml(SITE.description)}</text>
</svg>`;

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
    },
  });
}
