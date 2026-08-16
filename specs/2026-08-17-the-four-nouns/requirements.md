# Requirements — The four nouns

Feature spec for **Phase 1** of [roadmap.md](../roadmap.md#phase-1--the-four-nouns).

## Why this phase exists

Phase 0 proved the path — clone, install, migrate, seed, render, build, serve,
test — on a model everyone agreed to throw away. This phase replaces that model
with the real one: `Agent`, `Ailment`, `Therapy`, `Appointment`, and the
relations between them.

It lands the schema for the **whole product**, not the schema Phase 2 happens to
need. Every later phase reads from what this phase writes, and a schema mistake
found in Phase 6 costs a migration plus every page built on top of it. The seed
written here is the demo data for every screenshot, test, and booth demo the
project will ever give.

This phase deliberately ships almost no UI. That is not an oversight — see D1
and D9 for the single exception and its boundary.

## In scope

| Area | What lands |
| --- | --- |
| Schema | `Agent`, `Ailment`, `Therapy`, `Appointment`, plus `Diagnosis` (D3) and `Symptom` (D4) |
| Relations | Agents ↔ ailments through `Diagnosis` carrying severity; therapies ↔ ailments many-to-many; appointment → one agent + one therapy + a time + a status |
| Constraints | Slot uniqueness per therapy and per agent, in the database (D6) |
| Vocabulary | `Severity` and `AppointmentStatus` as Prisma enums, with order and labels in `src/lib/` (D5) |
| Migration | One new migration, appended to Phase 0's history, that drops `ClinicNotice` and creates the rest (D10) |
| Seed | ~8 agents, ~8 ailments, ~6 therapies, a handful of appointments — written as demo data, not as fixtures (D7, D8) |
| Queries | One data-access module per noun in `src/server/`, returning typed results (D9) |
| Unit tests | Vitest over the query modules, the vocabulary helpers, and the seed data's internal consistency, against a test database the suite provisions itself (D11) |
| Page | `/` keeps its shape; the notice board becomes one ailment read from the real schema (D1) |
| E2E | The existing Playwright spec updated to the new seeded content — no new specs |
| Docs | `README.md` status line and layout block reflect the real schema |

## Out of scope

Deferred to a named phase, so nobody has to re-argue it.

- The `/agents` roster, cards, empty and loading states — **Phase 2**.
- `/agents/[id]` case files and 404 handling — **Phase 3**.
- `/ailments`, `/therapies`, and their detail pages — **Phases 4 and 5**.
- Writing appointments from the UI, double-booking *validation logic*, and past
  time rejection — **Phase 6**. This phase lands the database constraint those
  rules will lean on (D6), and no application code that enforces anything.
- Dashboard content on `/` — today's appointments, recent intakes, headline
  counts — **Phase 7**.
- Design beyond legible defaults — **Phase 8**.
- Appointment cancellation and rescheduling — **backlog**. This bounds the
  status vocabulary in D5; it is the reason `CANCELLED` is not in it.

## Decisions

### D1 — `ClinicNotice` is deleted, and `/` is repointed rather than left broken

The throwaway model goes, with `src/server/notices.ts`, its unit test, and the
seed content behind it. `/` keeps its heading, tagline, and card, and the card
now renders **one ailment** — name and one-line summary — read from the real
schema.

*Rationale:* the deletion is not optional; Phase 0's own D1 committed to it, and
a model everybody agreed to delete is the one thing this phase cannot inherit.
What is a decision is what happens to `/` afterwards. Deleting the model without
repointing the page breaks the build, the Playwright suite, and the clean-clone
run — three quality gates that every phase inherits and that do not pause for a
schema-only phase.

*Rejected:* making `/` static for one phase. It would keep the tests green while
quietly retiring the only proof the data path works, and check C2 has guarded
exactly that property since Phase 0. A statically rendered clinic is the failure
this project checks for, not a resting state.

*Rejected:* keeping `ClinicNotice` alongside the four nouns until Phase 2 gives
`/` something better to show. It reads as caution and behaves as debt: a
"temporary" model that survives one phase survives all of them, and Phase 7
would inherit a notice board nobody specified.

*Boundary.* One ailment, chosen deterministically so the E2E assertion is
stable. Not a list, not a count, not a link, no navigation. If a change to `/`
in this phase cannot be justified by *"the page still reads from the database"*,
it belongs to Phase 2, 7, or 8 — the same test D5 in the Phase 0 spec applied.

*Source:* [tech-stack.md](../tech-stack.md#quality-gates) — the app builds and
runs from a clean clone, and the phase's Playwright happy path passes — plus the
Phase 0 exit criterion in
[roadmap.md](../roadmap.md#phase-0--walking-skeleton) requiring
database-backed content on `/`.

### D2 — Rows the clinic names carry hand-written ids

`Agent`, `Ailment`, and `Therapy` ids are hand-written kebab-case strings —
`atlas`, `chronic-context-loss`, `context-window-hygiene` — not generated cuids.
Seeded appointments carry hand-written ids too; appointments created at runtime
keep `@default(cuid())`.

*Rationale:* two properties fall out of one choice.

- **Idempotent seeding.** Phase 0's seed is idempotent because its id is fixed
  (plan 3.6, check C5). Generated ids would make re-seeding produce a second
  clinic, and the seed re-runs on every clean clone and every CI job.
- **Readable URLs.** The roadmap routes are `/agents/[id]` and `/ailments/[id]`.
  With this decision they read `/ailments/chronic-context-loss` with no second
  unique column, no slug generation, and no lookup that can disagree with the
  primary key.

*Rejected:* a cuid primary key plus a `slug` column. It is the conventional
answer and it costs a column, a unique index, and a standing question about
which of the two identifies a row. Nothing here needs opaque ids: there is no
auth, no enumeration concern, and no user-supplied content.

*Cost accepted:* renaming a seeded row changes its URL. That is the same cost
slugs carry, and at eight agents it is a text edit.

*Note:* `Symptom` rows are the exception — they are a value list rather than
something the clinic names (D4), so the seed replaces each ailment's set
wholesale rather than upserting row by row, and their ids stay generated.

*Source:* [roadmap.md](../roadmap.md#phase-3--agent-case-file) and
[roadmap.md](../roadmap.md#phase-4--ailment-directory) — the `[id]` route
segments — plus the idempotency requirement inherited from
[plan.md](../2026-08-16-walking-skeleton/plan.md) 3.6, recorded as check C5 in
Phase 0's [validation.md](../2026-08-16-walking-skeleton/validation.md).

### D3 — The two many-to-many relations are modelled differently

Two many-to-many relations, modelled two different ways:

```prisma
model Diagnosis {
  agentId    String
  ailmentId  String
  severity   String   // D5
  diagnosedOn DateTime
  notes      String?
  @@id([agentId, ailmentId])
}
```

Therapies and ailments use Prisma's implicit relation — `ailments Ailment[]` on
one side, `therapies Therapy[]` on the other, no join model in the schema file.

*Rationale:* the payload decides. Phase 3 requires "full ailment list with
**severities**", so the agent↔ailment link carries data and must be a model we
can name and query. Nothing anywhere asks what a therapy↔ailment link *is*; it
either treats it or it does not. Writing a join model for it would be ceremony
that has to be maintained and joined through for no attribute.

The composite primary key is doing work: an agent presents a given ailment once,
enforced by the database rather than by seed discipline, and it gives the seed a
natural upsert key (D2).

*Rejected:* explicit join models on both sides for symmetry. Symmetry is not a
requirement; two shapes that differ *because the data differs* teach more than
two identical shapes, and this is a codebase people read to learn from.

*Named in clinic vocabulary:* `Diagnosis`, not `AgentAilment`. The naming rule
is not optional for join models.

*Source:* [roadmap.md](../roadmap.md#phase-1--the-four-nouns) — "agents ↔
ailments (many-to-many), therapies ↔ ailments they treat (many-to-many)" — with
severity required by [roadmap.md](../roadmap.md#phase-3--agent-case-file), and
the naming rule from [tech-stack.md](../tech-stack.md#conventions).

### D4 — Symptoms are rows, not an array and not a JSON blob

```prisma
model Symptom {
  id        String  @id @default(cuid())
  ailmentId String
  ailment   Ailment @relation(fields: [ailmentId], references: [id],
                                onDelete: Cascade)
  text      String
  position  Int
}
```

*Rationale:* Phase 4 requires symptoms on every ailment, and libSQL has no array
type. Verified against the installed Prisma rather than assumed —
`prisma validate` on a schema with `symptoms String[]`:

```
error: Field "symptoms" in model "Ailment" can't be a list. The current
connector does not support lists of primitive types.
```

So the choice is between rows, a delimited string, and a JSON column.

Rows win on the two things this project has already committed to. `position`
makes display order data rather than an accident of insertion, and the values
stay queryable — Phase 4 or a backlog search feature can filter on them without
parsing. A delimited string needs a parser and a test for the parser; a JSON
column is unstructured at the type level, which is the opposite of the
"typed queries end to end" the ORM was chosen for.

*This is not a fifth noun.* `Symptom` has no page, no route, and no independent
existence — it is a value list owned by an ailment, deleted with it via cascade.
The mission's four-noun scope rule is about features, and this feature is
"ailments have symptoms", which Phase 4 asks for in writing.

*Source:* [roadmap.md](../roadmap.md#phase-4--ailment-directory) — "Each
ailment: deadpan clinical description, symptoms" — and
[tech-stack.md](../tech-stack.md#locked-in), which picks Prisma for "typed
queries end to end".

### D5 — Severity and status are Prisma enums, not strings

```prisma
enum Severity          { MILD MODERATE SEVERE }
enum AppointmentStatus { SCHEDULED COMPLETED }
```

`src/lib/severity.ts` and `src/lib/appointment-status.ts` hold what an enum
cannot: clinical sort order and display labels. Neither holds a parse function.

*A correction, kept because it was load-bearing while it lasted.* An earlier
draft justified the ordering module by claiming alphabetical order gets severity
wrong. It does not — `MILD`, `MODERATE`, `SEVERE` sort correctly by accident,
which a test written to prove the opposite discovered. The module stays, on the
honest reason: clinical order is not a property of the spelling, and the
coincidence ends the moment anyone adds `ACUTE`.

*Rationale, and it corrects a wrong premise this spec was first drafted on.* The
draft asserted that enums are unavailable on SQLite — historically true, and
false for the Prisma version this repo pins. Checked rather than believed:

```sh
prisma validate                                    # "The schema is valid 🚀"
prisma migrate diff --from-empty --to-schema ...   # "severity" TEXT NOT NULL
```

Prisma stores the enum as `TEXT` and enforces the vocabulary in the client. That
gives a generated union type the whole codebase shares, and a loud failure on an
unknown value at read time, for no code of ours at all — which is exactly what
the hand-written parse guard was going to buy.

*Cost accepted:* SQLite does not constrain the column, so a value hand-edited in
a database browser is invalid data that only Prisma will complain about. The
same was true of the string-plus-guard version, one layer further out.

*The status vocabulary is deliberately two values.* Phase 6 writes `SCHEDULED`;
Phase 3's appointment history needs past sessions to read as `COMPLETED`. That
is everything the roadmap forces.

*Rejected:* `CANCELLED` and `NO_SHOW`. Cancel and reschedule sit in the
[roadmap backlog](../roadmap.md#backlog), unpromised. Adding the value now means
guessing how it interacts with D6's uniqueness — does a cancelled appointment
free its slot? — with nothing to check the guess against. When cancellation
arrives it brings a spec, and that spec settles both the value and the
constraint together.

*Rejected:* an integer severity scale with a label map. It sorts for free and
reads as nothing at all in a database browser, on a teaching repo where reading
the data is part of the point. Ordering is nine lines in `severity.ts`.

*Source:* [roadmap.md](../roadmap.md#phase-1--the-four-nouns) — "a time and a
status" — with severity from
[roadmap.md](../roadmap.md#phase-3--agent-case-file), and the connector
behaviour verified against the Prisma version pinned in
[tech-stack.md](../tech-stack.md#locked-in).

### D6 — Slot uniqueness is enforced in the database, on two axes

```prisma
@@unique([therapyId, scheduledFor])
@@unique([agentId, scheduledFor])
```

*Rationale:* Phase 6 must refuse a double-booking. Its exit criterion is an
application-level message the user reads, which is Phase 6's work — but a rule
enforced only in application code is one race, one seed script, or one direct
write away from being violated, and the constraint costs two lines while the
table is empty. Adding it in Phase 6, against live rows, means a migration that
can fail on data.

Two axes because there are two ways to double-book: a therapy running two
sessions in the same slot, and an agent attending two therapies at once. The
second is the one an application check is likelier to forget.

*Boundary.* No validation logic lands here — no Server Action, no error
message, no past-time check. `scheduledFor` timestamps are exact, so this
constrains identical instants rather than overlapping durations. If Phase 6
wants slots to have width, that is Phase 6's spec, and this constraint does not
prejudge it.

*Source:* [roadmap.md](../roadmap.md#phase-6--booking) — "validation prevents
double-booking the same slot".

### D7 — Seeded appointment times are computed relative to the seed run

The seed anchors to the date it runs — a few appointments in the recent past
marked `COMPLETED`, several today and over the following days marked
`SCHEDULED` — rather than hardcoding calendar dates.

*Rationale:* Phase 7's dashboard answers "what's happening at the clinic
today?". Hardcoded dates make that answer "nothing" for every clone after the
first fortnight, and the audience that suffers is the one demoing at a booth,
where an empty dashboard cannot be explained away. *"If a demo needs a caveat
spoken aloud, that is a bug."*

*Cost accepted:* re-seeding shifts appointment times, so the seed is idempotent
in row count and identity (D2's fixed ids) but not in timestamps. Tests
therefore assert on relationships — this one is in the past, that one is today —
never on literal dates. Times are normalised to whole clinic hours so seeded
data does not read as though the clinic books at 14:37.

*Source:* [mission.md](../mission.md#target-audience) — booth demos and "if a
demo needs a caveat spoken aloud, that is a bug" — and
[roadmap.md](../roadmap.md#phase-7--clinic-dashboard), "today's appointments".

### D8 — Seed data is data, in its own module

`prisma/seed-data.ts` holds the clinic as plain exported arrays, importing
nothing from Prisma. `prisma/seed.ts` stays the entry point `npm run seed` runs
and holds only the write logic: upsert the named rows (D2), replace each
ailment's symptom set (D4), report what it did.

*Rationale:* the content is the bulk of this phase and the part most likely to
be edited by someone who is not thinking about upserts. Separating it means a
prose edit cannot break the write path, and it makes the data testable without a
database — the seed's internal consistency (every diagnosis names a real agent
and a real ailment, every appointment a real therapy) becomes a plain unit test
rather than something discovered by a failing seed run.

*Scope note:* the layout block in [tech-stack.md](../tech-stack.md#conventions)
names `prisma/seed.ts`, and that file keeps its name and its job. A sibling data
module is not a layout change, so the constitution needs no edit.

*Source:* [roadmap.md](../roadmap.md#phase-1--the-four-nouns) — "This seed is
the demo data for every later phase, so it is written well, not filled with
`test1`" — plus the layout block in
[tech-stack.md](../tech-stack.md#conventions).

### D9 — One query module per noun, and no UI beyond D1's single row

`src/server/agents.ts`, `ailments.ts`, `therapies.ts`, `appointments.ts`. Each
exports the reads the roadmap has already named — list, by id, and the relations
the later phase needs loaded — with return types inferred from Prisma, never
hand-written.

*Rationale:* the phase's exit criterion is "queries for each noun return
sensible typed results", which cannot be demonstrated by a schema file. These
are also where the schema gets its first real use, and a relation that is
awkward to query is a schema problem best found now — while the fix is a
migration nobody has built on.

*Boundary, and this is the one most at risk in this phase.* Query functions are
not pages. No route beyond `/` is created, no component beyond D1's card change
is touched, and no query is written that no named later phase asked for. A
function existing here does not license rendering it.

*Source:* [roadmap.md](../roadmap.md#phase-1--the-four-nouns) — the exit
criterion, "queries for each noun return sensible typed results" — and the
data-access convention in [tech-stack.md](../tech-stack.md#conventions),
"Server Components read from Prisma directly".

### D10 — The migration history is append-only

Phase 1 adds one migration on top of Phase 0's `init`. The existing migration is
not edited, squashed, or deleted, and `prisma migrate reset` is not part of any
documented path.

*Rationale:* `prisma migrate deploy` is the documented command on **both**
deploy targets, and deploy replays history against a database that already
exists. A rewritten history means a Turso database migrated at Phase 0 can never
be migrated again — it would need dropping, which is the one operation the
self-hosted story ("a file, nobody needs Docker") makes look harmless and the
hosted one does not.

The cost is one migration that drops a table the same commit stops using. That
is what a migration history is for.

*Source:* [tech-stack.md](../tech-stack.md#deployment) — `prisma migrate deploy`
against the local file and against Turso, and the parity rule that the only
difference between targets is `DATABASE_URL`.

### D11 — The unit suite provisions its own database

Vitest gains a `globalSetup` that migrates and seeds a dedicated
`clinic.test.db`, with `DATABASE_URL` pointed at it for the run. `npm test`
stays a single command with no preceding step, and it never touches the
developer's `clinic.db`. The Vitest `include` widens to pick up tests beside
`prisma/seed-data.ts` as well as under `src/`.

*Rationale:* the phase's exit criterion is unit tests over **seeded** queries,
which is a different shape of test from Phase 0's. Phase 0's single test creates
and deletes its own row precisely so that `npm test` has no hidden setup — a
property worth keeping, but reproducing it here means hand-building six tables
of fixtures and testing Prisma instead of the clinic. The seed *is* the
deliverable; the tests should run against it.

*Rejected:* seeding the developer's `clinic.db` from a `pretest` script. It is
two lines, and it rewrites the database someone has `npm run dev` open against —
D7's relative timestamps mean the visible appointment times move under them.
Test runs do not get to disturb the demo.

*Rejected:* documenting `npm run seed` as a precondition of `npm test`. The
README would then carry a command someone has to remember, CI would carry an
ordering nobody can see, and a fresh clone's first `npm test` would fail on
nothing. *"If a demo needs a caveat spoken aloud, that is a bug"* applies to the
test suite too.

*Consequences to check, both easy to miss:* `*.db` is already gitignored, so the
test database needs no `.gitignore` change; and the CI workflow's "Provision the
database" step stays, because the Playwright build still needs the real
`clinic.db`.

*Source:* [roadmap.md](../roadmap.md#phase-1--the-four-nouns) — "Unit tests over
seeded queries" — with the no-hidden-setup habit inherited from Phase 0's
[plan.md](../2026-08-16-walking-skeleton/plan.md) 6.1 and the clean-clone run in
its [validation.md](../2026-08-16-walking-skeleton/validation.md), section A.

### D12 — `/` stays statically prerendered, and Phase 6 is told why that ends

`next build` prerenders `/` at build time, so the production server hands out a
page whose ailment was read during the build. Phase 1 leaves it that way and
changes no rendering strategy.

*Verified, not inferred.* With the production build already made, the seeded
summary was edited in the database and both servers were asked for the page:
`next dev` returned the new text immediately; `next start` returned the text
from build time.

*Rationale for leaving it:* nothing in this phase writes at runtime. Ailments
change when someone edits the seed and redeploys, which is exactly the lifecycle
static prerendering assumes, and it is the faster and cheaper answer for a booth
demo. Forcing dynamic rendering now would be an engineering default with no
source behind it — the thing this project's provenance rule exists to stop.

*Where it stops being correct, which is the point of writing it down:*

- **Phase 6** writes an `Appointment` and then shows it on the agent's case
  file. A prerendered case file will not contain it. The booking flow's spec has
  to choose a strategy — dynamic rendering, or revalidating the affected paths —
  and its exit criterion is already written to catch this, since it verifies the
  flow "against a production build running locally".
- **Phase 7**'s dashboard answers "what's happening today?". Prerendered, it
  answers "what was happening on the day this was built" — and D7's relative
  seeding makes that failure look plausible rather than obviously broken, which
  is worse.

Neither is Phase 1's to fix. Both are now a paragraph in the spec their phase
will read rather than a surprise at the end of an implementation.

*Source:* [roadmap.md](../roadmap.md#phase-6--booking) — the booked appointment
must appear on the case file, verified against a production build — and
[roadmap.md](../roadmap.md#phase-7--clinic-dashboard), "today's appointments".

## Constraints inherited

From [tech-stack.md](../tech-stack.md), still binding and now with more surface
to break them on:

- **No branch on deploy target.** `DATABASE_URL` is the whole difference.
- **No runtime filesystem writes.** All persistence goes through the database.
- **No network after `npm install`.** D7's relative dates use the system clock,
  not a time service.
- **Clinic vocabulary everywhere** — including join models (D3).
- **Server-first.** Nothing in this phase needs `"use client"`.
- **Provenance.** Every decision above names its source, and
  `npm run check:provenance` fails if one stops doing so.

## Open questions

None. Both questions this spec opened were answered by the owner on 2026-08-17,
before any code was written.

**Q1 — Do agents carry invented model families, or real ones?** **Invented.**
`Meridian-4`, `Halcyon Mini`, and their siblings are ours. No real vendor's
model is named anywhere in the seed: the satire is aimed at the human-agent
relationship, which is where [mission.md](../mission.md#premise) points it, and
an invented family does not retire. This binds every later seed edit, so it is
registered as a dated owner decision in
[mission.md](../mission.md#owner-decisions).

**Q2 — Confirm D2's hand-written ids before the migration lands.** **Confirmed
as written.** No mission.md entry: D2 already traces to the `[id]` route
segments in the roadmap and the idempotency requirement inherited from Phase 0,
so the answer changed nothing that needed a source.

Ambiguity found during implementation goes to the backlog or reopens this file,
not into the code.
