import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import { eras, loadFacts, repoPath, subjects } from "./content-utils";

const facts = await loadFacts();
const rows = eras.map((era) => {
  const matchingFacts = facts.filter(
    (fact) => !fact.draft && fact.relevantForEras.includes(era.id),
  );
  const subjectCounts = subjects.map((subject) => ({
    subject,
    count: matchingFacts.filter((fact) => fact.subject === subject).length,
  }));
  return { era, total: matchingFacts.length, subjectCounts };
});

const weakSubjectRows = rows.flatMap((row) =>
  row.subjectCounts
    .filter(({ count }) => count === 0)
    .map(({ subject }) => `- ${row.era.label}: missing ${subject}`),
);

const report = [
  "# Content coverage report",
  "",
  `Generated for ${facts.length} facts.`,
  "",
  "| Era | Years | Total | Astronomy | Biology | Geography | History | Physics |",
  "| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |",
  ...rows.map((row) => {
    const counts = Object.fromEntries(
      row.subjectCounts.map(({ subject, count }) => [subject, count]),
    );
    return `| ${row.era.label} | ${row.era.yearStart}–${row.era.yearEnd} | ${row.total} | ${counts.astronomy} | ${counts.biology} | ${counts.geography} | ${counts.history} | ${counts.physics} |`;
  }),
  "",
  "## Gaps",
  "",
  weakSubjectRows.length > 0 ? weakSubjectRows.join("\n") : "No empty subject/era intersections.",
  "",
].join("\n");

const outDir = repoPath("reports");
await mkdir(outDir, { recursive: true });
await writeFile(path.join(outDir, "content-coverage.md"), report);

console.log(report);
