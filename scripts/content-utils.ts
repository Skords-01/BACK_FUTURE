import { readFileSync } from "node:fs";
import { readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

import { z } from "zod";

import erasJson from "../content/eras.json" with { type: "json" };

export const subjects = ["astronomy", "biology", "geography", "history", "physics"] as const;
export const eraIds = [1, 2, 3, 4, 5] as const;

export type SubjectId = (typeof subjects)[number];
export type EraId = (typeof eraIds)[number];

export interface Era {
  id: EraId;
  slug: string;
  label: string;
  yearStart: number;
  yearEnd: number;
  summary: string;
}

export interface FactSource {
  title: string;
  url: string;
}

export interface Fact {
  filePath: string;
  slug: string;
  title: string;
  subject: SubjectId;
  short: string;
  yearOfEvent: number;
  relevantForEras: EraId[];
  sources: FactSource[];
  tags: string[];
  draft: boolean;
  body: string;
}

const matterSchema = z.object({
  title: z.string().min(3).max(140),
  subject: z.enum(subjects),
  short: z.string().min(20).max(280),
  yearOfEvent: z
    .number()
    .int()
    .min(1900)
    .max(new Date().getFullYear() + 1),
  relevantForEras: z
    .array(
      z.union(
        eraIds.map((id) => z.literal(id)) as [
          z.ZodLiteral<1>,
          z.ZodLiteral<2>,
          z.ZodLiteral<3>,
          z.ZodLiteral<4>,
          z.ZodLiteral<5>,
        ],
      ),
    )
    .min(1),
  sources: z
    .array(
      z.object({
        title: z.string().min(3),
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
});

const erasSchema = z.array(
  z.object({
    id: z.union(
      eraIds.map((id) => z.literal(id)) as [
        z.ZodLiteral<1>,
        z.ZodLiteral<2>,
        z.ZodLiteral<3>,
        z.ZodLiteral<4>,
        z.ZodLiteral<5>,
      ],
    ),
    slug: z.string(),
    label: z.string(),
    yearStart: z.number().int(),
    yearEnd: z.number().int(),
    summary: z.string(),
  }),
);

export const eras: Era[] = erasSchema.parse(erasJson);

export function repoPath(...parts: string[]): string {
  return path.join(process.cwd(), ...parts);
}

export async function listMarkdownFiles(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) return listMarkdownFiles(fullPath);
      if (entry.isFile() && entry.name.endsWith(".md")) return [fullPath];
      return [];
    }),
  );
  return files.flat().sort((a, b) => a.localeCompare(b));
}

export function parseFrontmatter(filePath: string): { data: unknown; body: string } {
  const raw = readFileSync(filePath, "utf8");
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    throw new Error(`${filePath}: missing frontmatter block`);
  }
  return { data: parseYamlObject(match[1]!), body: match[2] ?? "" };
}

export async function loadFacts(): Promise<Fact[]> {
  const factsDir = repoPath("content", "facts");
  const filePaths = await listMarkdownFiles(factsDir);
  return filePaths.map((filePath) => {
    const { data, body } = parseFrontmatter(filePath);
    const parsed = matterSchema.parse(data);
    const relativePath = path.relative(factsDir, filePath);
    return {
      filePath,
      slug: relativePath.replace(/\.md$/, ""),
      ...parsed,
      body,
    };
  });
}

function parseYamlObject(input: string): unknown {
  const result: Record<string, unknown> = {};
  const lines = input.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index]!;
    if (!line.trim()) continue;
    const keyMatch = line.match(/^([A-Za-z][A-Za-z0-9]*):(?:\s*(.*))?$/);
    if (!keyMatch) continue;
    const key = keyMatch[1]!;
    const rawValue = keyMatch[2] ?? "";

    if (rawValue === "") {
      const { value, nextIndex } = parseBlock(lines, index + 1);
      result[key] = value;
      index = nextIndex - 1;
    } else {
      result[key] = parseScalar(rawValue);
    }
  }
  return result;
}

function parseBlock(lines: string[], startIndex: number): { value: unknown[]; nextIndex: number } {
  const items: unknown[] = [];
  let index = startIndex;
  while (index < lines.length) {
    const line = lines[index]!;
    if (!line.startsWith("  - ")) break;

    const itemFirstLine = line.slice(4);
    if (!itemFirstLine.includes(":")) {
      items.push(parseScalar(itemFirstLine));
      index += 1;
      continue;
    }

    const item: Record<string, unknown> = {};
    addKeyValue(item, itemFirstLine);
    index += 1;
    while (index < lines.length && lines[index]!.startsWith("    ")) {
      addKeyValue(item, lines[index]!.slice(4));
      index += 1;
    }
    items.push(item);
  }
  return { value: items, nextIndex: index };
}

function addKeyValue(target: Record<string, unknown>, line: string): void {
  const match = line.match(/^([A-Za-z][A-Za-z0-9]*):\s*(.*)$/);
  if (!match) return;
  target[match[1]!] = parseScalar(match[2] ?? "");
}

function parseScalar(value: string): unknown {
  const trimmed = value.trim();
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (/^-?\d+$/.test(trimmed)) return Number(trimmed);
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    const body = trimmed.slice(1, -1).trim();
    if (!body) return [];
    return body.split(",").map((part) => parseScalar(part.trim()));
  }
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  return trimmed;
}
