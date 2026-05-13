import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

// Re-export the canonical region parser alongside the schema so the helper
// lives at the same import path as the field definition. The implementation
// (with the ISO-3166-1 code table) is in `src/lib/regions.ts`.
export { parseRegion, type ParsedRegion } from "./lib/regions";

const SUBJECT = z.enum([
  "astronomy",
  "biology",
  "geography",
  "history",
  "physics",
  "tech",
  "medicine",
  "economy",
  "culture",
  "sport",
  "ecology",
]);
const ERA = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]);
// `region` accepts the legacy `world` / `ukraine` literals plus the extended
// `country:<iso2>` form (lowercase 2-letter ISO-3166-1 alpha-2 code). The
// discriminated union lets Zod report a clear error for each branch; the
// runtime `parseRegion` helper in `src/lib/regions.ts` is the canonical way
// to consume the parsed value.
const REGION = z.union([
  z.literal("world"),
  z.literal("ukraine"),
  z.string().regex(/^country:[a-z]{2}$/, "expected 'country:<iso2 lowercase>' (e.g. country:cz)"),
]);
const IMPACT = z.enum(["low", "medium", "high"]);
const SOURCE_URL = z.string().refine((value) => URL.canParse(value), {
  message: "Invalid URL",
});

const facts = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./content/facts" }),
  schema: z.object({
    title: z.string().min(3).max(140),
    subject: SUBJECT,
    short: z.string().min(20).max(280),
    before: z.string().min(10).max(280).optional(),
    after: z.string().min(10).max(280).optional(),
    yearOfEvent: z
      .number()
      .int()
      .min(1900)
      .max(new Date().getFullYear() + 1),
    relevantForEras: z.array(ERA).min(1),
    region: REGION.optional(),
    impact: IMPACT.optional(),
    sources: z
      .array(
        z.object({
          title: z.string(),
          url: SOURCE_URL,
        }),
      )
      .min(1),
    quote: z
      .object({
        text: z.string().min(3).max(280),
        author: z.string().min(1).max(140),
      })
      .optional(),
    tags: z.array(z.string()).default([]),
    image: z
      .object({
        src: z.string(),
        alt: z.string(),
      })
      .optional(),
    draft: z.boolean().default(false),
    updatedAt: z.coerce
      .date()
      .refine((d) => d.getTime() <= Date.now(), {
        message: "updatedAt cannot be in the future",
      })
      .optional(),
  }),
});

const epoch = defineCollection({
  loader: glob({ pattern: "**/*.json", base: "./content/epoch" }),
  schema: z.object({
    year: z.number().int().min(1991).max(2026),
    items: z
      .array(
        z.object({
          k: z.string().min(1).max(40),
          v: z.string().min(1).max(80),
        }),
      )
      .min(4)
      .max(12),
  }),
});

export const collections = { facts, epoch };
