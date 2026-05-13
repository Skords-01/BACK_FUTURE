/**
 * Parse, validate, and render data submitted via the «Запропонувати факт»
 * Issue Form into a content file under `content/facts/<subject>/<slug>.md`.
 *
 * Designed for two callers:
 * - `scripts/issue-to-fact.ts` (Node CLI used by the GitHub Action).
 * - Vitest tests (`src/lib/issueToFact.test.ts`).
 *
 * The Zod-shape mirrors `src/content.config.ts`. We can't import the canonical
 * collection schema directly because it pulls in `astro:content` virtual
 * modules that are only resolvable inside `astro build`.
 */

import { z } from "zod";

export const SUBJECT_IDS = [
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
] as const;

export type SubjectId = (typeof SUBJECT_IDS)[number];

export const ERA_IDS = [1, 2, 3, 4, 5] as const;
export type EraId = (typeof ERA_IDS)[number];

export const REGION_IDS = ["world", "ukraine"] as const;
export type RegionId = (typeof REGION_IDS)[number];

export const IMPACT_IDS = ["low", "medium", "high"] as const;
export type ImpactId = (typeof IMPACT_IDS)[number];

/** Shape returned by `parseIssueForm`; pre-validation. */
export interface RawIssueForm {
  title?: string;
  subject?: string;
  short?: string;
  yearOfEvent?: string;
  relevantForEras?: number[];
  region?: string;
  impact?: string;
  sources?: { title: string; url: string }[];
  body?: string;
  tags?: string[];
}

/** Validated fact ready for rendering. */
export interface FactData {
  title: string;
  subject: SubjectId;
  short: string;
  yearOfEvent: number;
  relevantForEras: EraId[];
  region?: RegionId;
  impact?: ImpactId;
  sources: { title: string; url: string }[];
  body: string;
  tags: string[];
}

const SOURCE_URL = z.string().refine((value) => URL.canParse(value), {
  message: "must be a valid absolute URL",
});

export const factSchema = z.object({
  title: z.string().min(3).max(140),
  subject: z.enum(SUBJECT_IDS),
  short: z.string().min(20).max(280),
  yearOfEvent: z
    .number()
    .int()
    .min(1990)
    .max(new Date().getFullYear() + 1),
  relevantForEras: z
    .array(z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]))
    .min(1),
  region: z.enum(REGION_IDS).optional(),
  impact: z.enum(IMPACT_IDS).optional(),
  sources: z
    .array(
      z.object({
        title: z.string().min(3).max(160),
        url: SOURCE_URL,
      }),
    )
    .min(1),
  body: z.string(),
  tags: z.array(z.string().min(1).max(40)),
});

/* ------------------------------------------------------------------------- */
/* Cyrillic-aware slugify                                                     */
/* ------------------------------------------------------------------------- */

/**
 * Transliterate Ukrainian Cyrillic to ASCII per the 2010 official scheme
 * (simplified — we don't reproduce positional `ye` / `yi` exceptions because
 * search slugs don't need to round-trip).
 */
const TRANSLIT: Record<string, string> = {
  а: "a",
  б: "b",
  в: "v",
  г: "h",
  ґ: "g",
  д: "d",
  е: "e",
  є: "ie",
  ж: "zh",
  з: "z",
  и: "y",
  і: "i",
  ї: "i",
  й: "i",
  к: "k",
  л: "l",
  м: "m",
  н: "n",
  о: "o",
  п: "p",
  р: "r",
  с: "s",
  т: "t",
  у: "u",
  ф: "f",
  х: "kh",
  ц: "ts",
  ч: "ch",
  ш: "sh",
  щ: "shch",
  ь: "",
  ю: "iu",
  я: "ia",
  // Russian-only glyphs we still want to gracefully degrade rather than drop.
  ё: "e",
  ы: "y",
  э: "e",
  ъ: "",
};

export function cyrillicSlugify(input: string): string {
  if (!input) return "";
  const lowered = input.toLowerCase();
  let out = "";
  for (const ch of lowered) {
    if (TRANSLIT[ch] !== undefined) {
      out += TRANSLIT[ch];
    } else if (/[a-z0-9]/.test(ch)) {
      out += ch;
    } else if (ch === "'" || ch === "’" || ch === "ʼ") {
      // Ukrainian apostrophe — drop, don't replace with hyphen.
      continue;
    } else {
      out += "-";
    }
  }
  return out.replace(/-+/g, "-").replace(/^-+|-+$/g, "");
}

/* ------------------------------------------------------------------------- */
/* Issue Form body parser                                                     */
/* ------------------------------------------------------------------------- */

const FIELD_ID_RE = /\(([a-zA-Z][a-zA-Z0-9]*)(?:[\s,].*)?\)\s*$/;
const NO_RESPONSE_RE = /^_no response_$/i;

/**
 * GitHub Issue Forms render each field as `### <Label> (<fieldId>)` followed
 * by either a blank line and the value, or `_No response_` for empty optional
 * fields. We extract sections by leading `### `, then key them by the trailing
 * `(fieldId)` we put in every label so a label-rename can't silently break
 * parsing.
 */
export function parseIssueForm(body: string): RawIssueForm {
  const normalized = body.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const sections = new Map<string, string>();

  let currentKey: string | null = null;
  let currentBuf: string[] = [];

  const flush = () => {
    if (currentKey !== null) {
      const value = currentBuf.join("\n").trim();
      if (NO_RESPONSE_RE.test(value)) {
        sections.set(currentKey, "");
      } else {
        sections.set(currentKey, value);
      }
    }
    currentBuf = [];
  };

  for (const line of lines) {
    if (line.startsWith("### ")) {
      flush();
      const heading = line.slice(4).trim();
      const match = FIELD_ID_RE.exec(heading);
      currentKey = match ? match[1]! : null;
    } else if (currentKey !== null) {
      currentBuf.push(line);
    }
  }
  flush();

  const raw: RawIssueForm = {};

  if (sections.has("title")) raw.title = sections.get("title") ?? "";
  if (sections.has("subject")) raw.subject = (sections.get("subject") ?? "").toLowerCase();
  if (sections.has("short")) raw.short = sections.get("short") ?? "";
  if (sections.has("yearOfEvent")) raw.yearOfEvent = sections.get("yearOfEvent") ?? "";
  if (sections.has("relevantForEras")) {
    raw.relevantForEras = parseEraCheckboxes(sections.get("relevantForEras") ?? "");
  }
  if (sections.has("region")) {
    const v = (sections.get("region") ?? "").toLowerCase();
    if (v) raw.region = v;
  }
  if (sections.has("impact")) {
    const v = (sections.get("impact") ?? "").toLowerCase();
    if (v) raw.impact = v;
  }
  if (sections.has("sources")) raw.sources = parseSources(sections.get("sources") ?? "");
  if (sections.has("body")) raw.body = sections.get("body") ?? "";
  if (sections.has("tags")) raw.tags = parseTags(sections.get("tags") ?? "");

  return raw;
}

function parseEraCheckboxes(text: string): number[] {
  const out: number[] = [];
  for (const line of text.split("\n")) {
    const checked = /^- \[[xX]\]\s+(\d)/.exec(line.trim());
    if (checked) {
      const id = Number.parseInt(checked[1]!, 10);
      if (Number.isFinite(id)) out.push(id);
    }
  }
  return out;
}

function parseSources(text: string): { title: string; url: string }[] {
  const out: { title: string; url: string }[] = [];
  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim().replace(/^- /, "").trim();
    if (!line) continue;
    // Markdown-link form: [title](https://...)
    const md = /^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)\s*$/.exec(line);
    if (md) {
      out.push({ title: md[1]!.trim(), url: md[2]!.trim() });
      continue;
    }
    // Pipe form: title|https://...
    const pipe = line.indexOf("|");
    if (pipe > 0) {
      const titleText = line.slice(0, pipe).trim();
      const url = line.slice(pipe + 1).trim();
      if (titleText && url) {
        out.push({ title: titleText, url });
        continue;
      }
    }
    // Bare URL — fall back to URL host as title so the file still validates.
    if (/^https?:\/\//.test(line)) {
      try {
        const hostname = new URL(line).hostname;
        out.push({ title: hostname, url: line });
      } catch {
        // ignore unparseable URLs; Zod will reject the empty list later.
      }
    }
  }
  return out;
}

function parseTags(text: string): string[] {
  return text
    .split(/[,\n]/)
    .map((t) => t.trim().replace(/^#/, ""))
    .filter((t) => t.length > 0);
}

/* ------------------------------------------------------------------------- */
/* Validation                                                                 */
/* ------------------------------------------------------------------------- */

const YEAR_RE = /^(199\d|20\d\d)$/;

export interface ValidationFailure {
  ok: false;
  errors: string[];
}

export interface ValidationSuccess {
  ok: true;
  data: FactData;
}

export type ValidationResult = ValidationSuccess | ValidationFailure;

export function validateRawIssue(raw: RawIssueForm): ValidationResult {
  const errors: string[] = [];

  if (!raw.title || raw.title.trim().length === 0) {
    errors.push("title is required");
  }
  if (!raw.subject) errors.push("subject is required");
  if (!raw.short) errors.push("short is required");
  if (!raw.yearOfEvent) errors.push("yearOfEvent is required");
  if (!raw.yearOfEvent || !YEAR_RE.test(raw.yearOfEvent.trim())) {
    errors.push("yearOfEvent must match 199x or 20xx");
  }
  if (!raw.relevantForEras || raw.relevantForEras.length === 0) {
    errors.push("relevantForEras must contain at least one era");
  }
  if (!raw.sources || raw.sources.length === 0) {
    errors.push("sources must contain at least one `- title|url` line");
  }

  if (errors.length > 0) return { ok: false, errors };

  const candidate = {
    title: raw.title!.trim(),
    subject: raw.subject!,
    short: raw.short!.trim(),
    yearOfEvent: Number.parseInt(raw.yearOfEvent!.trim(), 10),
    relevantForEras: raw.relevantForEras!,
    region: raw.region,
    impact: raw.impact,
    sources: raw.sources!,
    body: (raw.body ?? "").trim(),
    tags: raw.tags ?? [],
  };

  const parsed = factSchema.safeParse(candidate);
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((issue) => {
        const path = issue.path.length > 0 ? issue.path.join(".") : "<root>";
        return `${path}: ${issue.message}`;
      }),
    };
  }

  return { ok: true, data: parsed.data };
}

/* ------------------------------------------------------------------------- */
/* Markdown renderer                                                          */
/* ------------------------------------------------------------------------- */

function yamlString(value: string): string {
  const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return `"${escaped}"`;
}

const TODO_BODY = `> **TODO (review):** цей факт згенеровано з GitHub Issue автоматично.\n> Перед merge: відредагуй тіло у науково-популярному стилі (3–5 абзаців),\n> перевір тон і чутливі формулювання у [\`docs/content-guidelines.md\`](../../../docs/content-guidelines.md).\n\n_Тіло не надане в issue — заповни перед merge._\n`;

/**
 * Render a fact `.md` document. We hand-write the YAML to match the existing
 * style under `content/facts/**` byte-for-byte (Prettier is then a no-op).
 */
export function renderFactMarkdown(fact: FactData): string {
  const lines: string[] = [];
  lines.push("---");
  lines.push(`title: ${yamlString(fact.title)}`);
  lines.push(`subject: ${yamlString(fact.subject)}`);
  lines.push(`short: ${yamlString(fact.short)}`);
  lines.push(`yearOfEvent: ${fact.yearOfEvent}`);
  lines.push(`relevantForEras: [${fact.relevantForEras.join(", ")}]`);
  if (fact.region) lines.push(`region: ${yamlString(fact.region)}`);
  if (fact.impact) lines.push(`impact: ${yamlString(fact.impact)}`);
  lines.push("sources:");
  for (const source of fact.sources) {
    lines.push(`  - title: ${yamlString(source.title)}`);
    lines.push(`    url: ${yamlString(source.url)}`);
  }
  if (fact.tags.length > 0) {
    const tagYaml = fact.tags.map((tag) => yamlString(tag)).join(", ");
    lines.push(`tags: [${tagYaml}]`);
  }
  lines.push("draft: false");
  lines.push("---");
  lines.push("");
  lines.push(fact.body.length > 0 ? fact.body : TODO_BODY);
  lines.push("");
  return lines.join("\n");
}

export function factFilePath(fact: FactData): string {
  return `content/facts/${fact.subject}/${cyrillicSlugify(fact.title)}.md`;
}
