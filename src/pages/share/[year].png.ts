import type { APIContext, GetStaticPaths } from "astro";
import { getCollection } from "astro:content";
import { SITE } from "../../config/site";
import { svgToPng } from "../../lib/og";
import { SHARE_WIDTH, buildSharePosterSvg } from "../../lib/share";

export const getStaticPaths: GetStaticPaths = () => {
  const paths: { params: { year: string } }[] = [];
  for (let year = SITE.yearMin; year <= SITE.yearMax; year++) {
    paths.push({ params: { year: String(year) } });
  }
  return paths;
};

export async function GET({ params }: APIContext) {
  const year = Number(params.year);
  const allFacts = await getCollection("facts");
  const svg = buildSharePosterSvg(year, allFacts);
  const png = await svgToPng(svg, { width: SHARE_WIDTH, defaultFontFamily: "DejaVu Sans" });

  return new Response(png, {
    headers: {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
