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
| C16 | The satire lands | Someone reading a single ailment description gets the joke and the product at the same time. A judgement, not a measurement — recorded with who made it and when, as C7 was in Phase 0 |

### Queries and the page

| # | Check | Passes when |
| --- | --- | --- |
| C17 | Every noun answers | One module per noun in `src/server/`, each returning typed results with the relations its named phase needs (D9) |
| C18 | Types are inferred | Query return types come from Prisma. A field renamed in the schema breaks `npm run typecheck`, not just a test |
| C19 | `/` is database-backed | Editing the seeded ailment's summary and re-seeding changes what `/` renders (D1) |
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

*Pending. Nothing has been implemented yet — this spec was written before any
code, per [roadmap.md](../roadmap.md#how-a-phase-works).*
