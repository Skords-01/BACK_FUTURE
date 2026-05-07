import path from "node:path";
import process from "node:process";

import { eras, loadFacts, subjects } from "./content-utils";

const minFactsPerSubject = 1;
const minFactsPerEra = 5;
const bannedTerms = [
  "спецоперац",
  "конфлікт в україні",
  "війна почалась у 2022",
  "війна 2022 року",
  "kiev",
  "odessa",
  "chernobyl",
  "lvov",
];

const errors: string[] = [];
const warnings: string[] = [];

const facts = await loadFacts();
const bySubject = new Map(subjects.map((subject) => [subject, 0]));
const byEra = new Map(eras.map((era) => [era.id, 0]));
const sourceUrls = new Map<string, string>();

for (const fact of facts) {
  const relativePath = path.relative(process.cwd(), fact.filePath);
  bySubject.set(fact.subject, (bySubject.get(fact.subject) ?? 0) + 1);

  if (fact.title.length > 80) {
    warnings.push(
      `${relativePath}: title is ${fact.title.length} chars; content guide recommends ≤80`,
    );
  }
  if (/[.!?…]$/.test(fact.title)) {
    errors.push(`${relativePath}: title should not end with punctuation`);
  }

  if (fact.body.trim().length < 300) {
    warnings.push(`${relativePath}: body is short; content guide expects 3–5 paragraphs`);
  }

  if (fact.draft) {
    errors.push(`${relativePath}: draft content cannot ship to production`);
  }

  for (const eraId of fact.relevantForEras) {
    byEra.set(eraId, (byEra.get(eraId) ?? 0) + 1);
  }

  for (const source of fact.sources) {
    const seenAt = sourceUrls.get(source.url);
    if (seenAt && seenAt !== relativePath) {
      warnings.push(`${relativePath}: source URL also appears in ${seenAt}`);
    }
    sourceUrls.set(source.url, relativePath);
  }

  const normalizedText = `${fact.title}\n${fact.short}\n${fact.body}`.toLowerCase();
  for (const term of bannedTerms) {
    if (normalizedText.includes(term)) {
      errors.push(`${relativePath}: avoid sensitive or non-Ukrainian framing "${term}"`);
    }
  }
}

for (const [subject, count] of bySubject) {
  if (count < minFactsPerSubject) {
    errors.push(`content/facts/${subject}: expected at least ${minFactsPerSubject} fact`);
  }
}

for (const [eraId, count] of byEra) {
  if (count < minFactsPerEra) {
    warnings.push(
      `era ${eraId}: only ${count} matching facts; target is at least ${minFactsPerEra}`,
    );
  }
}

for (const warning of warnings) {
  console.warn(`warning: ${warning}`);
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`error: ${error}`);
  }
  process.exit(1);
}

console.log(`Validated ${facts.length} content facts across ${subjects.length} subjects.`);
