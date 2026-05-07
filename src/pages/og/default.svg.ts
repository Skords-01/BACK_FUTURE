import { buildDefaultOgSvg } from "../../lib/og";

export function GET() {
  const svg = buildDefaultOgSvg();

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml; charset=utf-8",
    },
  });
}
