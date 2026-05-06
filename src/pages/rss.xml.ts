import rss from "@astrojs/rss";
import { getCollection } from "astro:content";
import type { APIContext } from "astro";
import { SITE } from "../config/site";
import { ERAS, type EraId } from "../lib/eras";

function yearForFact(relevantForEras: EraId[]): number {
  const firstEraId = Math.min(...relevantForEras) as EraId;
  return ERAS.find((era) => era.id === firstEraId)?.yearStart ?? SITE.yearMin;
}

export async function GET(context: APIContext) {
  const facts = await getCollection("facts", ({ data }) => !data.draft);

  return rss({
    title: SITE.name,
    description: SITE.description,
    site: context.site ?? SITE.defaultUrl,
    customData: `<language>uk-UA</language>`,
    items: facts
      .sort((a, b) => b.data.yearOfEvent - a.data.yearOfEvent)
      .map((fact) => {
        const year = yearForFact(fact.data.relevantForEras);
        return {
          title: fact.data.title,
          description: fact.data.short,
          link: `/${year}.html#${fact.id}`,
          pubDate: new Date(fact.data.yearOfEvent, 0, 1),
        };
      }),
  });
}
