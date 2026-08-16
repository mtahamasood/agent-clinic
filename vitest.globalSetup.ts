import { execFileSync } from "node:child_process";
import { rmSync } from "node:fs";

/**
 * Provisions a database for the unit suite, then throws it away.
 *
 * `npm test` stays one command with nothing to run first, and it never touches
 * the `clinic.db` someone has `npm run dev` open against — seeded appointment
 * times are relative to the seed run (D7), so re-seeding the developer's
 * database would move the clinic's calendar under them.
 *
 * Decision D11 in specs/2026-08-17-the-four-nouns/requirements.md.
 */
const TEST_DATABASE_URL = "file:./clinic.test.db";

// Relative to the project root, which is where Vitest runs and where the
// `file:` URL above resolves from.
const FILES = [
  "clinic.test.db",
  "clinic.test.db-journal",
  "clinic.test.db-shm",
  "clinic.test.db-wal",
];

function run(command: string, args: string[]) {
  execFileSync(command, args, {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL },
    // npm and npx are batch files on Windows, which execFile cannot run
    // directly. The clinic is developed and demoed on all three platforms.
    shell: process.platform === "win32",
  });
}

function discard() {
  for (const file of FILES) rmSync(file, { force: true });
}

export default function setup() {
  // A leftover file from an interrupted run would be migrated and seeded on
  // top of, which is how a stale row survives to fail a later suite.
  discard();
  run("npx", ["prisma", "migrate", "deploy"]);
  run("npx", ["tsx", "prisma/seed.ts"]);

  return discard;
}
