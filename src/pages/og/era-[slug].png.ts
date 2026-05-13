import type { APIContext, GetStaticPaths } from "astro";
import { getCollection } from "astro:content";
import { ERAS } from "../../lib/eras";
import { buildEraOgSvg, svgToPng } from "../../lib/og";

export const getStaticPaths: GetStaticPaths = () =>
  ERAS.map((era) => ({ params: { slug: era.slug } }));

export async function GET({ params }: APIContext) {
  const era = ERAS.find((e) => e.slug === params.slug);
  if (!era) return new Response("Not found", { status: 404 });
  const allFacts = await getCollection("facts");
  const svg = buildEraOgSvg(era, allFacts);
  const png = await svgToPng(svg);
  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
