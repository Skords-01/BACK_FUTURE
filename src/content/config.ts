import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const SUBJECT = z.enum(["astronomy", "biology", "geography", "history", "physics"]);
const ERA = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]);

const facts = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./content/facts" }),
  schema: z.object({
    title: z.string().min(3).max(140),
    subject: SUBJECT,
    short: z.string().min(20).max(280),
    yearOfEvent: z
      .number()
      .int()
      .min(1900)
      .max(new Date().getFullYear() + 1),
    relevantForEras: z.array(ERA).min(1),
    sources: z
      .array(
        z.object({
          title: z.string(),
          url: z.string().url(),
        }),
      )
      .min(1),
    tags: z.array(z.string()).default([]),
    image: z
      .object({
        src: z.string(),
        alt: z.string(),
      })
      .optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { facts };
