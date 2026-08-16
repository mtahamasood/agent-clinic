#!/usr/bin/env node
// Enforces the "Requirement provenance" rule in specs/tech-stack.md: every
// decision record (### D1, ### D2, ...) in a feature spec's requirements.md
// must carry a `*Source:*` line naming where the requirement came from.
//
// This exists because a requirement once entered the project with no source at
// all — see the provenance section of tech-stack.md for the incident. A rule
// that lives only in prose is not a gate (the D4 lesson), so this script runs
// in CI, and branch protection makes CI binding: an unattributed decision
// record cannot reach main.
//
// Zero dependencies on purpose. The stack is fixed by tech-stack.md, and a
// provenance checker must not itself smuggle in unprovenanced tooling.

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const specsDir = join(import.meta.dirname, "..", "specs");

// A Source line is valid when it points at something someone can open: the
// stakeholder brief, a constitution document, the phase plan, or an explicit,
// dated owner decision. "Good practice" is not on this list by design.
const SOURCE_LINE = /^\*Source:\*\s+\S/;
const VALID_ANCHOR =
  /(README\.md|mission\.md|roadmap\.md|tech-stack\.md|plan\.md|validation\.md|owner)/;

const failures = [];

const specDirs = readdirSync(specsDir).filter((entry) => {
  try {
    return statSync(join(specsDir, entry)).isDirectory();
  } catch {
    return false;
  }
});

for (const dir of specDirs) {
  const file = join(specsDir, dir, "requirements.md");
  let text;
  try {
    text = readFileSync(file, "utf8");
  } catch {
    continue; // A feature folder without a requirements.md is someone else's problem.
  }

  const lines = text.split("\n");
  let block = null; // { heading, line, sourceLines: [] }

  const closeBlock = () => {
    if (!block) return;
    const sources = block.sourceLines;
    if (sources.length === 0) {
      failures.push(
        `${dir}/requirements.md:${block.line} — ${block.heading} has no *Source:* line`,
      );
    } else if (!sources.some((s) => VALID_ANCHOR.test(s))) {
      failures.push(
        `${dir}/requirements.md:${block.line} — ${block.heading} has a *Source:* line, but it names none of: the README brief, a constitution document, the phase plan, or an owner decision`,
      );
    }
    block = null;
  };

  lines.forEach((line, i) => {
    const decision = line.match(/^### (D\d+)\b/);
    if (decision) {
      closeBlock();
      block = { heading: decision[1], line: i + 1, sourceLines: [] };
      return;
    }
    if (/^##[^#]/.test(line) || /^### /.test(line)) {
      closeBlock();
      return;
    }
    if (block && SOURCE_LINE.test(line)) {
      block.sourceLines.push(line);
    }
  });
  closeBlock();
}

if (failures.length > 0) {
  console.error("Requirement provenance check failed:\n");
  for (const f of failures) console.error(`  ${f}`);
  console.error(
    "\nEvery decision record needs a *Source:* line. See specs/tech-stack.md,",
  );
  console.error(
    '"Requirement provenance". A requirement nobody asked for is not a',
  );
  console.error("requirement — attribute it or take it to the owner.");
  process.exit(1);
}

console.log("Provenance check passed: every decision record names its source.");
