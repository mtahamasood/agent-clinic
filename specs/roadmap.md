# Roadmap

Implementation order for AgentClinic. Phases are **small and vertical** — after
Phase 0, each one ends with something you can click in a browser.

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
- Responsive down to mobile.

**Exit:** the roster renders live seed data and reads well on a phone.

---

## Phase 3 — Agent case file

- `/agents/[id]` — the patient's page: profile, full ailment list with
  severities, appointment history.
- 404 handling for an unknown agent, in voice.
- Roster cards link through.

**Exit:** every agent on the roster opens a complete case file.

---

## Phase 4 — Ailment directory

- `/ailments` and `/ailments/[id]`.
- Each ailment: deadpan clinical description, symptoms, which agents present
  with it, which therapies treat it.
- Cross-links wired both ways with Phase 3.

**Exit:** you can navigate agent → ailment → other affected agents.

---

## Phase 5 — Therapy catalog

- `/therapies` and `/therapies/[id]`.
- Each therapy: what it involves, duration, which ailments it treats.
- Filter the catalog by ailment.

**Exit:** an agent with a known ailment can find every therapy that treats it.

---

## Phase 6 — Booking

The flow that makes this an app rather than a brochure. Gets its own feature
spec before implementation.

- From a therapy page: pick an agent, pick an available slot, confirm.
- Server Action writes the `Appointment`; validation prevents double-booking the
  same slot and rejects past times.
- Confirmation page, and the appointment appears on the agent's case file.
- **Pick a rendering strategy first.** Pages are prerendered at build time today,
  so a page that reads written data serves stale HTML until the next build —
  verified in Phase 1, recorded as
  [D12](2026-08-17-the-four-nouns/requirements.md#d12--the-home-page-stays-statically-prerendered-and-phase-6-is-told-why).
  This phase and Phase 7 are where that stops being correct.

**Exit:** Playwright books an appointment end to end and finds it on the case
file; conflicting and past-dated bookings are refused with clear messages. The
same flow is verified against a **production build running locally**, since this
is the first phase that writes to the database.

---

## Phase 7 — Clinic dashboard

Mary's ask, deliberately last — it summarises everything the earlier phases
made real.

- `/` becomes the dashboard: today's appointments, recent intakes, headline
  counts, most common ailments.
- Quick links into the roster, catalog, and booking.

**Exit:** the dashboard answers "what's happening at the clinic today?" without
clicking through.

---

## Phase 8 — Polish and ship

- Marketing-grade landing treatment for Steve: typography, spacing, motion where
  it earns its place.
- Metadata, favicon, social preview.
- Deploy **both** ways: self-hosted (`next build` + `next start`) against a local
  libSQL file, and Vercel against a hosted Turso database.
- `README.md` carries verified step-by-step instructions for each path.

**Exit:** a live URL that looks deliberate on desktop and mobile, **and** a
self-hosted run of the same commit — booking included — that works with no
network beyond localhost.

---

## Backlog

Parked, not promised. Each needs its own spec if it is ever pulled in:

- Appointment cancel and reschedule
- Staff-side triage queue for new intakes
- Search across agents, ailments, and therapies
- Therapy outcome notes and follow-up scheduling
- Auth and per-agent private case files
- Postgres migration, if write concurrency ever outgrows libSQL
