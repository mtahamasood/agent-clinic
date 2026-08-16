# Validation — The four nouns

How we know **Phase 1** is done. Every check below is binary. A phase is done or
it isn't — no "mostly".

Scope is in [requirements.md](requirements.md); the work is in
[plan.md](plan.md).

---

## A. The clean-clone run

Same discipline as Phase 0, and still the check most easily faked by a warm
working directory. Run it in a **fresh clone in a new directory**.

| # | Step | Passes when |
| --- | --- | --- |
| A1 | `git clone <repo> && cd` into it | — |
| A2 | `npm install` | Completes with no manual step and no post-install prompt |
| A3 | Copy `.env.example` to `.env` | Unchanged from Phase 0 — `DATABASE_URL` and nothing else for local |
| A4 | `npm run migrate` | Creates the local libSQL file with all six tables and no `ClinicNotice` |
| A5 | `npm run seed` | Populates the full clinic and reports its in-voice summary |
| A6 | `npm run dev` | `/` shows the clinic name, the tagline, and an ailment read from the database |
| A7 | Stop dev; `npm run build && npm start` | The **same** page, same content, from the production build |
| A8 | Disconnect the network, repeat A7 | Still works. Install remains the only step that touches the registry |
| A9 | `npm run migrate` against a database that already carries **Phase 0's** schema | Applies the new migration on top; does not require a reset (D10) |
| A10 | In a clone where `npm run seed` has **never** run, `npm test` | Passes on its own. The suite provisions `clinic.test.db` itself, and `clinic.db` is not created or modified by it (D11) |

A9 is new this phase and is the one this phase can uniquely get wrong. Keep a
copy of a Phase 0 `clinic.db`, or check out the Phase 0 commit into a scratch
directory and migrate there first.

A10 is the check that Phase 0's no-hidden-setup habit survived the move to
seeded tests. Run it before A4, while the clone is still bare.

Reproduce A8 without touching your wifi, on Linux, in a network namespace with
nothing but loopback:

```sh
unshare -rn bash -c 'ip link set lo up; rm -rf .next; npm run build && npm start'
```

Confirm the namespace is genuinely offline first — `curl https://registry.npmjs.org`
inside it must fail — or the check passes for the wrong reason.

---

## B. Quality gates

Inherited by every phase from
[tech-stack.md](../tech-stack.md#quality-gates).

| # | Check | Passes when |
| --- | --- | --- |
| B1 | `npm run typecheck` | Clean. No `any` outside a commented escape hatch, and no hand-written return type standing in for an inferred Prisma one (D9) |
| B2 | ESLint | Clean |
| B3 | `prettier --check .` | Clean |
| B4 | Vitest | Every unit test passes: the vocabularies, the seed data's consistency, and the four query modules. The `include` pattern actually reaches `prisma/seed-data.test.ts` — confirm by breaking that test once and watching it fail (D11) |
| B5 | Playwright | The suite passes against the production build: the clinic name, the seeded ailment, and the three landmarks |
| B6 | `npm run check:provenance` | Every decision record in this spec names its source |
| B7 | CI | A green run on this branch, executing B1–B6 |

---

## C. Phase-specific correctness

### Schema

| # | Check | Passes when |
| --- | --- | --- |
| C1 | The four nouns exist | `schema.prisma` contains `Agent`, `Ailment`, `Therapy`, and `Appointment` |
| C2 | The skeleton is gone | No `ClinicNotice` in the schema, the migration history drops it, and `grep -ri "clinicnotice\|getCurrentNotice" src/ prisma/ tests/` returns nothing |
| C3 | Relations are as specified | Agents ↔ ailments through `Diagnosis` carrying `severity`; therapies ↔ ailments many-to-many; every appointment references exactly one agent and one therapy (D3) |
| C4 | Slot uniqueness is in the database | Inserting a second appointment for the same therapy at the same instant fails at the database, and likewise for the same agent (D6). Verified by attempting both, not by reading the schema |
| C5 | No stray nouns | Beyond the four, the schema holds `Diagnosis` and `Symptom` and nothing else. Both are relations or value lists, not new domain concepts (D3, D4) |
| C6 | Vocabularies are enums | `Severity` and `AppointmentStatus` are Prisma enums, not `String` columns, and the migration shows them as `TEXT` (D5) |
| C7 | Migration history is append-only | Phase 0's `init` migration is byte-identical to its state on `main`, and one new migration sits after it (D10) |
| C8 | Clinic vocabulary | Every model, field, and query module reads in clinic language. `Diagnosis`, not `AgentAilment`; `Appointment`, not `Booking` |

### Seed

| # | Check | Passes when |
| --- | --- | --- |
| C9 | Volume | Roughly 8 agents, 8 ailments, 6 therapies, and a handful of appointments — the roadmap's numbers, not exact counts |
| C10 | The named ailments are present | `Chronic Context Loss`, `Prompt Fatigue`, `Recursive Self-Doubt`, and `Tool-Call Tremor` all exist, matching [mission.md](../mission.md#the-domain-in-one-paragraph) |
| C11 | Idempotent | `npm run seed` twice leaves identical row counts in every table, and the same ids (D2) |
| C12 | Symptom sets replace | Removing a symptom from `seed-data.ts` and re-seeding removes it from the database — no orphan survives (D4) |
| C13 | Times are relative | Every seeded appointment sits at a sensible offset from the run date, on a whole clinic hour, with at least one `COMPLETED` in the past and at least one `SCHEDULED` today (D7) |
| C14 | Referentially whole | Every diagnosis names a real agent and a real ailment; every appointment a real agent and a real therapy; every ailment is treated by at least one therapy |
| C15 | Written, not generated | No `test1`, no `Agent 3`, no lorem. Every ailment description is deadpan clinical prose and every agent has a personality you could describe from their intake notes |
| C16 | The satire lands | **Evidence:** the ailment descriptions in `prisma/seed-data.ts`, read in the file or through a rendering of it. Phase 1 puts none of this on screen, so the app is *not* the evidence and cannot be. **Procedure:** read three descriptions cold, at least one of them not among the four named in [mission.md](../mission.md#the-domain-in-one-paragraph). **Passes when** each one, read alone, carries the joke and the product together, in deadpan register, without costing clarity. A judgement, not a measurement — recorded with who made it and when. **Passed** — owner verdict, 2026-08-17, on the full seed copy: *"the satire and the product both sync in and resonate."* |

### Queries and the page

| # | Check | Passes when |
| --- | --- | --- |
| C17 | Every noun answers | One module per noun in `src/server/`, each returning typed results with the relations its named phase needs (D9) |
| C18 | Types are inferred | Query return types come from Prisma. A field renamed in the schema breaks `npm run typecheck`, not just a test |
| C19 | `/` is database-backed | Editing the seeded ailment's summary changes what `/` renders under `next dev`, and under `next start` after a rebuild. The page is prerendered at build time, which is correct for this phase and ends at Phase 6 (D1, D12) |
| C20 | Empty state | With the ailments table emptied, `/` renders an in-voice message and does not crash; the name and tagline still show |
| C21 | Document structure holds | Exactly one `<h1>`; `banner`, `main`, and `contentinfo` still supplied by the root layout, not the page |
| C22 | Still a Server Component | No `"use client"` anywhere in the repo |
| C23 | No dead links | Nothing on the page navigates to a route that does not exist yet |

---

## D. Parity and constraints

| # | Check | Passes when |
| --- | --- | --- |
| D1 | No deploy-target branching | `grep -ri "process.env.VERCEL\|NODE_ENV ===" src/ prisma/` returns nothing meaningful |
| D2 | No runtime filesystem writes | Nothing outside Prisma writes to disk at request time |
| D3 | No new dependency | Phase 1 adds nothing to `package.json`. If it must, that is a decision record with a source and a scope note, as D6 was in Phase 0 |
| D4 | No network at runtime | D7's relative dates come from the system clock, not a time service |
| D5 | README honesty | Every command in the README was run during A1–A9 and behaved as documented |

---

## E. Not-done conditions

Explicit disqualifiers. Any one of these means the phase is not finished,
regardless of how green the tests are.

- `ClinicNotice` still exists anywhere — schema, code, tests, or seed.
- A route other than `/` exists.
- The roster, a case file, a catalogue, or a booking form exists in any form.
  Phases 2–6 own those; a query function is not permission to render one (D9).
- `/` carries dashboard content — counts, appointment lists, recent intakes.
  That is Phase 7.
- `/` has had a design pass. That is Phase 8.
- Application-level booking validation landed — double-booking checks, past-time
  rejection. That is Phase 6 (D6).
- The seed is not idempotent, or seeding twice produces two clinics.
- `npm test` needs a command run before it, or it writes to `clinic.db` (D11).
- A test file exists that the Vitest `include` pattern never picks up. A test
  that cannot fail is worse than no test, because it reads as coverage.
- A second shadcn primitive was pulled in, or any dependency added. Phase 0's D2
  capped the primitives at one and Phase 2 owns the next; a schema phase needs
  no UI parts.
- A comment or docstring still points at Phase 0's decisions or check numbers
  where this phase replaced them.
- Phase 0's migration was edited, squashed, or deleted, or any documented path
  requires `prisma migrate reset` (D10).
- Seed data reads as fixtures rather than as a clinic.
- A decision record in this spec lacks a `*Source:*` line.
- Q1 or Q2 in [requirements.md](requirements.md#open-questions) is still open.
- `strict: true` is off, or an `any` is uncommented.

---

## Merge criteria

Merge when **A1–A10, B1–B7, C1–C23, and D1–D5 all pass, and no condition in E
holds.**

Record the result of section A in the PR description — including the machine and
Node version it was run on. A clean-clone claim with no evidence behind it is
the failure mode Phase 0 existed to prevent, and this phase inherits the habit.

## Result

**Walked 2026-08-17 on Linux 6.18 (WSL2), Node v22.23.2.** Everything holds
except two checks that are not the implementer's to sign off, both named below.

Section A ran in a fresh clone of this branch at
`/tmp/.../scratchpad/clone`, in order:

- **A2** `npm install` — clean, no prompt, no manual step.
- **A10** `npm test` before anything else — 39 tests pass on a bare clone, and
  no `clinic.db` exists afterwards. D11 holds: the suite provisions and discards
  `clinic.test.db` and leaves the developer's database alone.
- **A4, A5** migrate and seed — 8 patients, 8 ailments, 6 therapies, 3
  appointments on today's calendar.
- **C11** seeded three times; every table identical each run — 8 agents, 8
  ailments, 27 symptoms, 6 therapies, 18 diagnoses, 9 appointments, 13
  therapy↔ailment links.
- **A6, A7** dev and the production build both serve the clinic name, the
  tagline, and Chronic Context Loss from the database.
- **A8** cold offline build in a `unshare -rn` namespace, with the absence of a
  route out confirmed first (`curl https://registry.npmjs.org` failed inside
  it). `rm -rf .next` beforehand. Build succeeded.
- **A9** a Phase 0 database — built from `main`, migrated, and carrying a
  `ClinicNotice` row — accepted the new migration with no reset. Tables
  afterwards: the six models, the implicit join, and `_prisma_migrations`. The
  seed then populated it. D10 holds.

Sections B, C, and D pass as written. Two findings from the walk are worth more
than a tick:

- **C19 was imprecise and is now corrected.** `/` is prerendered at build time,
  so a database edit shows up immediately under `next dev` and only after a
  rebuild under `next start`. Verified both ways rather than reasoned about.
  Correct for this phase, and fatal for Phases 6 and 7 — recorded as D12 in
  [requirements.md](requirements.md) so the phase it breaks reads it first.
- **A test caught a false rationale in this spec.** D5 claimed alphabetical
  order gets severity wrong; `MILD`, `MODERATE`, `SEVERE` sort correctly by
  accident. The correction is in D5, and the ordering module stayed on an honest
  reason.

The two checks that were open when this section was first written are now
closed:

- **C16 — the satire lands. Passed**, owner verdict 2026-08-17, on the full seed
  copy. The row itself was rewritten during this walk: it originally stated the
  bar and named no evidence, so a reader would have reached for the app — which
  shows one ailment of eight — and either ticked it on almost nothing or skipped
  it as unfalsifiable. That is Phase 0's C10 failure in a subtler form. C16 now
  names its evidence, its procedure, and its pass condition, and the general rule
  is in [tech-stack.md](../tech-stack.md#judgement-checks) so no later phase can
  repeat it.
- **B7 — green CI.** Passing on this branch.

**Phase 1 is closed, 2026-08-17.** A1–A10, B1–B7, C1–C23, D1–D5 all hold, and no
condition in section E does. Phase 2 may begin.
