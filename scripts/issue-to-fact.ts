#!/usr/bin/env tsx
/**
 * CLI that reads a GitHub Issue body (produced by `.github/ISSUE_TEMPLATE/new-fact.yml`)
 * and writes a Zod-validated `content/facts/<subject>/<slug>.md` file.
 *
 * Inputs (environment):
 * - `ISSUE_BODY`   — raw issue body (preferred when called from Actions).
 * - `ISSUE_BODY_FILE` — path to a file with the body (fallback for long bodies).
 * - `ISSUE_NUMBER` — issue number (used to set the `branch` output).
 * - `GITHUB_OUTPUT` — when set, the script writes `slug`, `path`, `branch`,
 *   `subject`, `era_labels`, `title` outputs for downstream Action steps.
 *
 * Outputs:
 * - Writes the generated `.md` to disk (relative to `process.cwd()`).
 * - Prints a one-line summary to stdout.
 * - Exits with code 1 (and a JSON-friendly error block) on validation failure.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

import {
  factFilePath,
  parseIssueForm,
  renderFactMarkdown,
  validateRawIssue,
} from "../src/lib/issueToFact";

function readIssueBody(): string {
  const inline = process.env.ISSUE_BODY;
  if (inline && inline.length > 0) return inline;
  const file = process.env.ISSUE_BODY_FILE;
  if (file && existsSync(file)) return readFileSync(file, "utf8");
  console.error("error: ISSUE_BODY or ISSUE_BODY_FILE must be set");
  process.exit(1);
}

function writeGithubOutput(entries: Record<string, string>): void {
  const target = process.env.GITHUB_OUTPUT;
  if (!target) return;
  const out = Object.entries(entries)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  writeFileSync(target, `${out}\n`, { flag: "a" });
}

const issueBody = readIssueBody();
const issueNumber = (process.env.ISSUE_NUMBER ?? "").trim();

const raw = parseIssueForm(issueBody);
const result = validateRawIssue(raw);

if (!result.ok) {
  console.error("Validation failed:");
  for (const err of result.errors) console.error(` - ${err}`);
  writeGithubOutput({
    ok: "false",
    errors: result.errors.join("; "),
  });
  process.exit(1);
}

const fact = result.data;
const relativePath = factFilePath(fact);
const absolutePath = path.resolve(process.cwd(), relativePath);
mkdirSync(path.dirname(absolutePath), { recursive: true });
writeFileSync(absolutePath, renderFactMarkdown(fact), "utf8");

const slug = path.basename(relativePath).replace(/\.md$/, "");
const branch = issueNumber ? `new-fact/${issueNumber}-${slug}` : `new-fact/${slug}`;
const eraLabels = fact.relevantForEras.map((id) => `era:${id}`).join(",");

writeGithubOutput({
  ok: "true",
  path: relativePath,
  slug,
  branch,
  subject: fact.subject,
  era_labels: eraLabels,
  title: fact.title,
});

console.log(`Wrote ${relativePath} (branch: ${branch}).`);
