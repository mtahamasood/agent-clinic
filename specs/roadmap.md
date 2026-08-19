# Roadmap

Implementation order for AgentClinic. Phases are **small and vertical** — after
Phase 0, each one ends with something you can click in a browser.

On 2026-08-20 the remaining phases were compressed for an MVP push: Phases 4
and 5 merged into one phase, Phases 6 and 7 into another, Phase 8 unchanged.
The original numbering is kept in the merged headings so every earlier
reference to "Phase 6" or "Phase 7" stays true. *Source:* stakeholder ask,
2026-08-20 — all three stakeholders; registered in
[mission.md](mission.md#owner-decisions).

## How a phase works

- **One phase at a time.** No starting the next before the current one meets its
  exit criteria.
- **Exit criteria are binary.** A phase is done or it isn't. No "mostly".
- **Every phase inherits the quality gates** in
  [tech-stack.md](tech-stack.md#quality-gates).
- **Anything ambiguous gets a feature spec** in `specs/` before code is written.
- **Scope creep goes to the backlog**, not into the current phase.
- **No requirement without provenance.** Every normative statement names its
  source — stakeholder brief, constitution clause, or dated owner decision. See
  [tech-stack.md](tech-stack.md#requirement-provenance).
- **Responsive from the first pixel.** Any phase that puts a page on screen
  meets the responsive-design convention in
  [tech-stack.md](tech-stack.md#responsive-design), and proves it at both
  viewports in the Playwright pass. It is not a Phase 8 polish item and never
  was: a layout built at desktop width and narrowed later is a rewrite, not a
  polish pass.

---

## Phase 0 — Walking skeleton

Prove the whole path once, on trivial content, so no later phase has to argue
about setup.

- Next.js + TypeScript (strict) + Tailwind + shadcn/ui initialised.
- Prisma wired to libSQL with a single throwaway model, pointed at a local file
  via `DATABASE_URL`.
- One page that reads one row from the database and renders it.
- Vitest and Playwright installed, with passing tests for each.
- ESLint + Prettier configured; `README.md` documents run/build/test/seed
  commands for **both** deploy targets.

**Exit:** clean clone → `npm install` → `npm run dev` shows database-backed
content; `npm run build && npm start` serves the same page offline; `npm test`
and the Playwright run both pass. Proving the local production path here is what
stops Phase 8 from discovering it doesn't work.

---

## Phase 1 — The four nouns

The schema for the whole product, and only the schema.

- Prisma models: `Agent`, `Ailment`, `Therapy`, `Appointment`.
- Relations: agents ↔ ailments (many-to-many), therapies ↔ ailments they treat
  (many-to-many), appointment → one agent + one therapy + a time + a status.
- Seed data with real personality: ~8 agents, ~8 ailments, ~6 therapies, a
  handful of appointments. This seed is the demo data for every later phase, so
  it is written well, not filled with `test1`.
- Unit tests over seeded queries.

**Exit:** `npm run seed` populates a coherent clinic; queries for each noun
return sensible typed results.

---

## Phase 2 — Agent roster

- `/agents` lists agent patients as cards: name, model family, presenting
  ailments.
- Empty state and loading state, both in clinic voice.
- The first multi-card layout, and so the first real exercise of the
  responsive-design convention in
  [tech-stack.md](tech-stack.md#responsive-design) — the roster reflows from one
  column to several without a bespoke breakpoint. The convention binds every
  phase, not this one; what is specific to Phase 2 is that a card grid is the
  first thing here that can genuinely break.

**Exit:** the roster renders live seed data, and the Playwright suite passes at
both viewports (phone and desktop). "Reads well on a phone" is the human half of
that and is a judgement check — so the Phase 2 validation file names its
evidence, its procedure, and its pass condition, per
[tech-stack.md](tech-stack.md#judgement-checks).

---

## Phase 3 — Agent case file

- `/agents/[id]` — the patient's page: profile, full ailment list with
  severities, appointment history.
- 404 handling for an unknown agent, in voice.
- Roster cards link through.

**Exit:** every agent on the roster opens a complete case file.

---

## Phase 4+5 — Ailment directory & therapy catalog

Two read-only halves of one cross-link — an ailment page lists the therapies
that treat it, a therapy page lists the ailments it treats — built together so
neither half ships a link to a page that does not exist yet. Merged from two
phases on 2026-08-20; source and reasoning in the MVP compression entry in
[mission.md](mission.md#owner-decisions).

- `/ailments` and `/ailments/[id]`.
- Each ailment: deadpan clinical description, symptoms, which agents present
  with it, which therapies treat it.
- `/therapies` and `/therapies/[id]`.
- Each therapy: what it involves, duration, which ailments it treats.
- Filter the catalog by ailment.
- Cross-links wired both ways with Phase 3, and both ways between the two
  halves of this phase.

**Exit:** you can navigate agent → ailment → other affected agents, and an
agent with a known ailment can find every therapy that treats it.

---

## Phase 6+7 — Booking & clinic dashboard

The flow that makes this an app rather than a brochure, and the dashboard that
summarises it — Mary's ask. Gets its own feature spec before implementation,
now covering both halves. Merged from two phases on 2026-08-20 (same register
entry as Phase 4+5): both halves sit on the rendering-strategy decision D12
assigns to them jointly, and the dashboard is the read side of the very rows
booking writes, so one production-build verification covers both.

- From a therapy page: pick an agent, pick an available slot, confirm.
- Server Action writes the `Appointment`; validation prevents double-booking the
  same slot and rejects past times.
- Confirmation page, and the appointment appears on the agent's case file.
- **Fix the seed's day-crossing collision.** `npm run seed` fails with `P2002` on
  a database seeded on an earlier day: relative slots move, and today's
  `dayOffset: 0` lands on the instant an earlier run wrote for `dayOffset: +3`.
  It arrives here because the collision is with the slot-uniqueness constraints
  this phase's validation is built on — owner decision, 2026-08-20, registered in
  [mission.md](mission.md#owner-decisions).
- **Pick a rendering strategy first.** Pages are prerendered at build time today,
  so a page that reads written data serves stale HTML until the next build —
  verified in Phase 1, recorded as
  [D12](2026-08-17-the-four-nouns/requirements.md#d12--the-home-page-stays-statically-prerendered-and-phase-6-is-told-why).
  This phase — the booking half and the dashboard half alike — is where that
  stops being correct.
- `/` becomes the dashboard: today's appointments, recent intakes, headline
  counts, most common ailments.
- Quick links into the roster, catalog, and booking.

**Exit:** Playwright books an appointment end to end and finds it on the case
file; conflicting and past-dated bookings are refused with clear messages; and
the dashboard answers "what's happening at the clinic today?" without clicking
through. The same flows are verified against a **production build running
locally**, since this is the first phase that writes to the database.

---

## Phase 8 — Polish and ship

- Marketing-grade landing treatment for Steve: typography, spacing, motion where
  it earns its place.
- Metadata, favicon, social preview.
- **Settle the site's 404.** An unknown *agent* is handled in voice and returns
  **HTTP 200** — measured on 2026-08-20 and accepted by the owner as the price of
  keeping the in-voice page — while an unmatched URL anywhere else returns a
  correct 404 carrying Next's default page. The wrong status on the page that
  reads well, the right one on the page that does not. Both halves are a
  whole-site question, which is this phase's, with every route in view. Full
  measurement and the trade in D4 of the
  [Phase 3 requirements](2026-08-20-agent-case-file/requirements.md).
- Deploy **both** ways: self-hosted (`next build` + `next start`) against a local
  libSQL file, and Vercel against a hosted Turso database.
- `README.md` carries verified step-by-step instructions for each path.

**Exit:** a live URL that looks deliberate on desktop and mobile, **and** a
self-hosted run of the same commit — booking included — that works with no
network beyond localhost.

"Looks deliberate on mobile" here judges the *treatment*. Whether the layout
holds at every width was settled phase by phase against
[tech-stack.md](tech-stack.md#responsive-design); if it is still open by the time
this phase starts, an earlier phase shipped without meeting its quality gates.

---

## Backlog

Parked, not promised. Each needs its own spec if it is ever pulled in:

- Appointment cancel and reschedule
- Staff-side triage queue for new intakes
- Search across agents, ailments, and therapies
- Therapy outcome notes and follow-up scheduling
- Auth and per-agent private case files
- Postgres migration, if write concurrency ever outgrows libSQL
