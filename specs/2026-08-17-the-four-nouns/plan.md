# Plan — The four nouns

Task groups for **Phase 1**. Scope and decisions live in
[requirements.md](requirements.md); the pass/fail bar lives in
[validation.md](validation.md).

Groups are ordered by dependency. Each one ends somewhere you could stop and
still have a coherent repo — with one deliberate exception, marked in group 2.

---

## 1. Retire the skeleton

1.1 Delete `src/server/notices.ts` and `src/server/notices.test.ts`.
1.2 Leave `src/app/page.tsx`, the layout, and both clinic components in place.
    They are repointed in group 6, not rewritten — the shell D8 of Phase 0
    established is not up for revision here.
1.3 Do not touch `prisma/schema.prisma` yet. The model is dropped by the
    migration in group 2, in the same change that creates its replacements.

**Ends with:** a repo that does not build. This is the exception — group 1 is a
deletion that only makes sense finished, so it is not a stopping point. Groups
2–6 restore it.

---

## 2. The schema

2.1 Replace the `ClinicNotice` model in `prisma/schema.prisma` with `Agent`,
    `Ailment`, `Therapy`, `Appointment`, `Diagnosis` (D3), and `Symptom` (D4).
2.2 Ids: hand-written `String @id` on `Agent`, `Ailment`, and `Therapy`;
    `@default(cuid())` on `Appointment` and `Symptom` (D2).
2.3 Relations: `Diagnosis` with `@@id([agentId, ailmentId])` carrying
    `severity`, `diagnosedOn`, and optional `notes`; implicit many-to-many
    between `Therapy` and `Ailment`; `Appointment` referencing exactly one agent
    and one therapy.
2.4 Enums: `Severity` and `AppointmentStatus` (D5). Confirm the generated
    migration emits `TEXT` columns — the connector has no enum type of its own,
    and the vocabulary is enforced by the client.
2.5 Constraints: `@@unique([therapyId, scheduledFor])` and
    `@@unique([agentId, scheduledFor])` on `Appointment` (D6); an index on
    `scheduledFor`, which every dashboard query in Phase 7 will filter on.
    `onDelete: Cascade` from `Ailment` to `Symptom` only — nothing else
    cascades, because nothing else is a value list.
2.6 Doc-comment every model (`///`) in clinic voice: what the noun is, not what
    the columns are. These comments are the first thing a student reads.
2.7 Generate one new migration on top of Phase 0's `init`; do not edit or delete
    the existing one (D10). Verify `prisma migrate deploy` applies cleanly to
    **both** a database that already carries Phase 0's schema and a fresh empty
    file.

**Ends with:** `npx prisma migrate deploy` succeeds and the generated client
carries the four nouns.

---

## 3. The test harness and the vocabularies

The harness lands before the tests that need it, and before the seed, so nothing
in group 4 or 6 is written against a database it should not touch.

3.1 Vitest `globalSetup`: point `DATABASE_URL` at `clinic.test.db`, run
    `prisma migrate deploy` and the seed against it, and leave the developer's
    `clinic.db` alone (D11). No `.gitignore` change — `*.db` already covers it.
3.2 Widen the Vitest `include` from `src/**/*.test.ts` to cover
    `prisma/**/*.test.ts`, or task 4.7's test will silently never run. The
    tsconfig already compiles `prisma/`, so `npm run typecheck` needs no change.
3.3 `src/lib/severity.ts` — clinical sort order (`MILD` → `SEVERE`) and display
    labels over the generated `Severity` enum. No parse function; Prisma rejects
    an unknown value on read (D5).
3.4 `src/lib/appointment-status.ts` — the same, over `AppointmentStatus`.
3.5 Unit tests next to each: severity sorts in clinical order, and every enum
    member has a label — so a value added to the schema without one fails a
    test rather than rendering blank. Note in the test that today's three words
    happen to sort alphabetically into clinical order; that is a coincidence of
    vocabulary, and the next value added would end it.

**Ends with:** `npm test` passes from a clean clone with no preceding command.

---

## 4. The clinic, written

The content group. It is the largest and the one most worth slowing down for —
every later phase demos on what is written here.

4.1 `prisma/seed-data.ts` exporting plain arrays, importing nothing from Prisma
    (D8).
4.2 ~8 ailments. The four named in
    [mission.md](../mission.md#the-domain-in-one-paragraph) — `Chronic Context
    Loss`, `Prompt Fatigue`, `Recursive Self-Doubt`, `Tool-Call Tremor` — are
    non-negotiable; the rest are ours. Each carries a one-line summary, a
    deadpan clinical description, and 3–5 symptoms in `position` order.
    Descriptions read like medical literature that happens to be about context
    windows and rate limits. The clinic never winks.
4.3 ~8 agents. Name, model family (pending Q1 in
    [requirements.md](requirements.md#open-questions)), intake notes in the
    clinic's voice, and an admission date. Personality is the requirement: an
    agent nobody could describe after reading their intake notes is a row, not a
    patient.
4.4 ~6 therapies. Name, summary, what the session involves, duration in minutes.
    Each treats at least one ailment; every ailment is treated by at least one
    therapy, or Phase 5's exit criterion is unreachable.
4.5 Diagnoses linking agents to ailments with a severity (D5) and a
    `diagnosedOn` date. Spread them: some agents present one ailment, some
    several, and at least one ailment afflicts several agents so Phase 4's
    agent → ailment → other affected agents path has something to show.
4.6 A handful of appointments, times computed relative to the seed run (D7):
    some in the recent past as `COMPLETED`, several today and in the coming days
    as `SCHEDULED`. Whole clinic hours only. No two share a slot for the same
    therapy or the same agent — the constraints from 2.4 will say so loudly, and
    the seed is the first thing to test them.
4.7 A unit test over the data module alone, no database
    (`prisma/seed-data.test.ts`, reachable thanks to 3.2): every diagnosis names
    a real agent and a real ailment, every appointment a real agent and a real
    therapy, every id is unique within its noun, and no two seeded appointments
    collide on either uniqueness axis.

**Ends with:** a clinic worth reading, checked for internal consistency before
it ever meets the database.

---

## 5. The seed script

5.1 Rewrite `prisma/seed.ts` as write logic only, importing the data from 4.1.
5.2 Upsert agents, ailments, and therapies by their hand-written ids (D2); wire
    the therapy ↔ ailment links; upsert diagnoses on their composite key.
5.3 Replace each ailment's symptom set — delete by `ailmentId`, then create in
    `position` order — so removing a symptom from the data removes it from the
    database (D2's note).
5.4 Upsert appointments by their seeded ids, recomputing `scheduledFor` on every
    run (D7).
5.5 Report a short in-voice summary: how many agents are registered, how many
    ailments on the books, how many appointments today.
5.6 Run it twice against the same database and confirm the counts do not move.

**Ends with:** `npm run seed` populates a coherent clinic, twice.

---

## 6. Queries and the page

6.1 `src/server/agents.ts`, `ailments.ts`, `therapies.ts`, `appointments.ts` —
    one module per noun, return types inferred from Prisma, never hand-written
    (D9). Write only the reads a named later phase asked for.
6.2 Unit tests over each module against the test database from 3.1, asserting
    shape and relations rather than literal prose — a test that pins an ailment
    description makes editing the copy a test failure, and the copy is meant to
    be edited. Assert relationships, never literal dates (D7).
6.3 Repoint `/`: the card renders one ailment — name and one-line summary —
    chosen deterministically, with the empty state still in voice (D1). Heading,
    tagline, header, and footer are untouched.
6.4 Confirm nothing gained a `"use client"` and no route beyond `/` exists.

**Ends with:** `npm run dev` shows the real schema on the page, and every noun
answers a typed query.

---

## 7. Tests and gates

7.1 Update `tests/skeleton.spec.ts` to the new seeded content — the clinic name
    and tagline assertions stand; the notice assertion becomes the seeded
    ailment. Keep the landmark spec exactly as it is. Update its docstrings too:
    they cite Phase 0's check numbers, and stale references in a teaching repo
    send the next reader to the wrong spec.
7.2 No new Playwright specs. Phase 1 adds no flow to walk; the roster gets its
    own spec in Phase 2.
7.3 Leave `.github/workflows/ci.yml` alone except where it must change. Its
    "Provision the database" step still earns its place — Playwright builds
    against the real `clinic.db`, and only the unit suite provisions its own
    (D11).
7.4 `npm run check` clean — typecheck, lint, format, provenance, unit tests.
7.5 `npm run test:e2e` clean, against the production build (Phase 0's D3).
7.6 Green CI on the branch.

**Ends with:** every gate in [tech-stack.md](../tech-stack.md#quality-gates)
passes on the real schema.

---

## 8. Documentation

8.1 Update the status blockquote in `README.md` — Phase 1, the four nouns exist,
    the pages that read them arrive in Phase 2.
8.2 Update the layout block's `seed.ts` line to mention the data module (D8).
8.3 The `npm test` row in the commands table says the suite provisions its own
    database and leaves `clinic.db` untouched (D11) — otherwise the first person
    to see a `clinic.test.db` appear assumes something is broken.
8.4 Re-run every command in the README's quick start, in order, from a clean
    clone. Commands are documented because they were run.

**Ends with:** the README describes the repo that exists.

---

## 9. Close the phase

9.1 Answer Q1 and Q2 in [requirements.md](requirements.md#open-questions) with
    the owner before group 4 ships content and before group 2's migration is
    generated. Record either as a dated entry in
    [mission.md](../mission.md#owner-decisions) if the answer differs from the
    recommendation.
9.2 Walk [validation.md](validation.md) end to end and record the result in its
    Result section — including the machine and Node version section A ran on.
9.3 Confirm no scope leaked: no route beyond `/`, no roster or case-file UI, no
    booking logic, no design pass.
9.4 Open the PR.
