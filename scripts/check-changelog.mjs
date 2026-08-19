#!/usr/bin/env node
// Enforces the "Changelog" rule in specs/tech-stack.md: a branch that changes
// the product or the constitution also updates CHANGELOG.md.
//
// This exists for the reason check:provenance exists — a rule that lives only
// in prose is not a gate (the D4 lesson). The skill in .claude/skills/changelog
// is the procedure a human runs; this is the check that notices when nobody
// ran it.
//
// Zero dependencies, like its sibling. A gate must not smuggle in tooling the
// stack does not name.

import { execFileSync } from "node:child_process";

// Paths whose change is worth a changelog line. Deliberately narrow: a branch
// that only touches CI config, formatting, or the changelog itself is exempt,
// because padding the file with entries nobody wants is how a changelog stops
// being read.
const MATERIAL = [/^src\//, /^specs\//, /^prisma\//];
const CHANGELOG = "CHANGELOG.md";

const git = (...args) => execFileSync("git", args, { encoding: "utf8" }).trim();

// GITHUB_BASE_REF is set on pull_request events and names the target branch.
// Everywhere else — a local run, a push build — compare against main.
const baseRef = process.env.CHANGELOG_BASE_REF || process.env.GITHUB_BASE_REF;
const base = baseRef ? `origin/${baseRef}` : "origin/main";

let head;
try {
  head = git("rev-parse", "--abbrev-ref", "HEAD");
} catch {
  console.error("Changelog check: not a git repository.");
  process.exit(1);
}

// On the target branch itself there is nothing to compare — the merge already
// happened, and its changelog entry came in with it.
if (head === (baseRef || "main")) {
  console.log(`Changelog check skipped: on ${head}, nothing to compare.`);
  process.exit(0);
}

let mergeBase;
try {
  mergeBase = git("merge-base", base, "HEAD");
} catch {
  // Loud, never silent. A shallow clone cannot answer this question, and a
  // check that quietly passes when it cannot see the history is worse than no
  // check at all — that is precisely how C10 went unnoticed for a phase.
  console.error(
    `Changelog check could not find a merge base with ${base}.\n` +
      "If this is CI, the checkout needs `fetch-depth: 0`. If this is local,\n" +
      "run `git fetch origin` first. Failing rather than passing blind.",
  );
  process.exit(1);
}

const changed = git("diff", "--name-only", mergeBase, "HEAD")
  .split("\n")
  .filter(Boolean);

if (changed.length === 0) {
  console.log("Changelog check skipped: no commits on this branch yet.");
  process.exit(0);
}

const material = changed.filter((f) => MATERIAL.some((re) => re.test(f)));

if (material.length === 0) {
  console.log(
    "Changelog check passed: nothing material changed on this branch.",
  );
  process.exit(0);
}

if (changed.includes(CHANGELOG)) {
  console.log(
    `Changelog check passed: ${material.length} material file(s) changed, and ${CHANGELOG} was updated.`,
  );
  process.exit(0);
}

console.error(`Changelog check failed.\n`);
console.error(
  `This branch changes ${material.length} file(s) that a reader would want in the changelog:\n`,
);
for (const f of material.slice(0, 10)) console.error(`  ${f}`);
if (material.length > 10)
  console.error(`  ...and ${material.length - 10} more`);
console.error(
  `\n${CHANGELOG} was not touched. Run the changelog skill before merging, or\n` +
    'add the entry by hand. See specs/tech-stack.md, "Changelog".',
);
process.exit(1);
