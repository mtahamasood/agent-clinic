# Changelog

What changed in AgentClinic, newest first, one heading per date.

Entries describe **units of work**, not commits: a phase or a pull request is one
bullet, with sub-bullets where the detail is worth keeping. The rule that
requires this file, and the gate that enforces it, are in
[specs/tech-stack.md](specs/tech-stack.md#changelog).

Dates are the date the work landed on `main`.

---

## 2026-08-19

- **Phase branches are kept; process branches are not** (#12). `phase-0-walking-skeleton`
  and `phase-1-four-nouns` stay on GitHub as end-of-phase checkouts for the
  owner's end-of-project review, and every later `phase-N-*` branch joins them.
  Process branches keep deleting themselves on merge. Recorded in
  `specs/tech-stack.md` before the habit of `--delete-branch` could reach
  Phase 2 and quietly destroy the collection. Nine stale remote-tracking refs —
  branches GitHub deleted that the local clone still listed — were pruned in the
  same sitting, with `fetch.prune` turned on so the drift cannot rebuild.
- **CI stopped running everything twice** (#11). Unqualified `push` plus
  `pull_request` triggers meant every commit on a branch with an open pull
  request built the whole suite twice — 16 of 42 runs were redundant, and the
  duplicate `verify` rows made "is CI done?" genuinely ambiguous. `push` is now
  scoped to `main`, which is the post-merge check; pull-request builds cover
  everything before it lands. A branch pushed with no pull request open now gets
  no CI — open it as a draft to get the signal back.
  - The changelog gate moved to the **end** of the job. It had been sitting
    ahead of `npm test` and Playwright, so a missing entry skipped every
    remaining step and cost all test signal on the branch until someone wrote
    it. The cheapest failure to fix should not mask the most expensive one.
- **A changelog, with a gate behind it** (#10). This file, generated from the
  history that preceded it. The requirement lives in `specs/tech-stack.md`;
  `npm run check:changelog` fails a pull request that touches `src/`, `specs/`,
  or `prisma/` without touching this file, and CI runs it inside `verify`.
  - Skills are admitted as an agent-facing surface for the first time, narrowly:
    they carry **procedure**, never rules. The 2026-08-17 ban on `AGENTS.md` and
    `CLAUDE.md` is otherwise untouched — `specs/` remains the only place a
    project rule may live.
  - **The directory maps were wrong and are now correct.** Neither
    `specs/tech-stack.md` nor `README.md` listed `scripts/`, which had held a
    CI-binding gate since 2026-08-16 — an enforcement directory invisible on the
    map for three days is how a reader concludes the gates are imaginary. Both
    maps now carry `scripts/` and `.claude/skills/`.
  - `README.md` claimed `npm run check` ran "typecheck, lint, format check, and
    unit tests". It has also run `check:provenance` since 2026-08-16. Corrected,
    and both gate commands added to the command table.
- **Responsive design became a sourced, executable requirement** (#9). It had
  been asserted in three places and measured in none.
  - The requirement now rests on a dated owner decision rather than an
    inference from Steve's brief, which says *modern browser*, not *phone*.
  - `specs/tech-stack.md` gained a Responsive design convention — fluid
    containers, mobile-first, no sideways overflow at 320px — and a quality gate
    every phase inherits.
  - Playwright runs every spec at two viewports, desktop and phone, and
    `tests/responsive.spec.ts` sweeps 320–1536px for overflow. Verified by
    breaking it: an injected fixed width failed 8 of 20 tests.
  - `<main>` spacing became `py-12 sm:py-16`; a constant `py-16` had been
    spending about a fifth of a phone viewport before any content.

## 2026-08-17

- **Phase 1 — the four nouns** (#8). The schema for the whole product:
  `Agent`, `Ailment`, `Therapy`, `Appointment`, plus `Diagnosis` and `Symptom`.
  Seed data for eight patients, per-noun query modules, and 39 unit tests
  against a database the suite provisions itself.
  - The validation walk found that `/` is prerendered at build time, so a
    database edit does not show under `next start` until a rebuild. Correct for
    Phase 1, fatal for Phases 6 and 7 — recorded as D12 and pointed at from the
    roadmap.
  - **Judgement checks became executable.** A check that asks a human to decide
    must name its evidence, its procedure, and its pass condition; stating the
    bar alone is not a check. Prompted by C16, which asserted "the satire lands"
    and named nothing to read it in.
  - **`kill` and `pkill` were banned.** A `next start` launched into a detached
    subshell survived `pkill -f "next start"` — Next renames the process to
    `next-server` — and went on serving stale HTML from a deleted directory.
    Servers are now stopped by the tool that started them.
- **Phase 0 closed** (#7), with the C7 verdict recorded: a first-time viewer can
  say what the product is.
- **The accessibility requirement was struck** (#6), with everything downstream:
  the tech-stack convention, the Phase 8 pass, check C10, decision D9, and
  `tests/contrast.spec.ts`. It traced to no stakeholder and no mission
  statement. Reintroduction needs a dated owner decision or a stakeholder ask.
  - `AGENTS.md` and `CLAUDE.md` were deleted in the same change and banned from
    carrying project content, with `agentRules: false` in `next.config.ts` to
    stop Next regenerating them.

## 2026-08-16

- **Phase 0 — the walking skeleton** (#1). The whole path proved once on
  throwaway content: Next.js App Router with `strict: true`, Tailwind and
  shadcn/ui, Prisma on libSQL against a local file, one page reading one row,
  Vitest and Playwright, ESLint and Prettier, and GitHub Actions running every
  gate.
  - Fonts moved from Google Fonts to the `geist` npm package (D6). A cold build
    with the network blocked had been failing outright, which breaks the offline
    build the clinic promises.
  - Playwright targets the production build rather than `next dev` (D3).
- **The requirement-provenance rule** (#5). No requirement enters the project
  without a written source — stakeholder brief, cited constitution clause, or
  dated owner decision. `npm run check:provenance` fails an unattributed
  decision record, CI runs it, and branch protection makes it binding.
- **A real contrast gate, and A8 verified** (#4, D9). Both checks had been
  resting on nothing: A8 (the offline build) had never been run, and C10 had no
  mechanism at all despite the constitution claiming Playwright enforced it.
  Both were closed here; C10 was struck the next day with the requirement behind
  it.
- **The root layout was composed** from `ClinicHeader`, a `<main>` landmark
  carrying the container width, and a link-free `ClinicFooter` (#3, D8). Pages
  supply content and nothing else.
- **Branch protection recorded** in `specs/tech-stack.md` (#2). The rule that
  makes `verify` binding lives in GitHub's settings and does not clone, so it is
  written down where a reader can find it.
- **The specs grew their first real teeth.** Deploy-target parity, the quality
  gates every phase inherits, and the target audience — course students and
  booth demos — that constrains everything downstream.

## 2026-08-15

- **The constitution.** `specs/mission.md`, `specs/roadmap.md`, and
  `specs/tech-stack.md`, alongside a `README.md` carrying the stakeholder brief
  from Mary, Susan, and Steve. No code.
