import { buildDefaultOgSvg, svgToPng } from "../../lib/og";

export async function GET() {
  const svg = buildDefaultOgSvg();
  const png = await svgToPng(svg);

  return new Response(new Blob([png], { type: "image/png" }), {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
