# Requirements — Agent roster

Feature spec for **Phase 2** of [roadmap.md](../roadmap.md#phase-2--agent-roster).

## Why this phase exists

Phase 1 landed the whole product's schema and a clinic worth demoing, and put
almost none of it on screen — one ailment, on a page whose job was to prove the
data path still worked. Eight patients with names, model families, intake notes,
and diagnoses currently exist only in a seed file and a unit test.

This phase is the first one that shows the clinic to somebody. `/agents` is the
first route beyond `/`, the first list rendered from a relation, and the first
layout in this project that can genuinely break — a card grid is where
*fluid by default* stops being free, which is why the responsive-design
convention was made executable before this phase started rather than during it.

Three things are therefore true at once, and the spec is arranged around them:
the feature is small, the layout is the risk, and every boundary this phase
draws is a boundary against Phases 3, 7, and 8, which all want to add something
to this page.

## In scope

| Area | What lands |
| --- | --- |
| Route | `/agents` — a Server Component listing every patient on the books |
| Card | One card per agent: name, model family, presenting ailments (D2) |
| Layout | A grid that reflows from one column upward within the shared container (D4) |
| Empty states | Two of them: no patients at all, and a patient with no diagnosis (D5) |
| Loading state | `src/app/agents/loading.tsx` in clinic voice, with its observability stated rather than assumed (D6) |
| Primitive | `Badge` — the second shadcn primitive, and the only one this phase adds (D7) |
| Navigation | One header link, so the roster is reachable without typing a URL (D3) |
| Queries | None. `listAgents()` from Phase 1 already returns what the card needs (D1) |
| E2E | A roster spec, and the responsive sweep extended to cover `/agents` |
| Docs | `README.md` status line; `CHANGELOG.md` entry |

## Out of scope

Deferred to a named phase, so nobody has to re-argue it on the branch.

- **`/agents/[id]`, and roster cards that link to it — Phase 3.** The roadmap
  puts "roster cards link through" in Phase 3, not here. A card that links now
  points at a 404 (D3).
- **Severities on the roster — Phase 3.** "Full ailment list with severities" is
  the case file's job. The roster names the ailments; it does not grade them
  (D2).
- **Intake notes on the roster — Phase 3.** They are the profile, and the
  profile is the case file (D2).
- **`/ailments`, `/therapies` — Phases 4 and 5.** The ailment names on a card
  are text, not links, for the same reason cards are not links.
- **Anything on `/` — Phase 7.** No roster preview, no headline count, no
  "recent intakes". `/` is untouched by this phase apart from what the shared
  layout does to every route.
- **Design treatment — Phase 8.** Legible defaults only: no bespoke typography,
  no motion, no illustration, no social preview metadata.
- **Filtering, sorting controls, search.** Search is in the
  [roadmap backlog](../roadmap.md#backlog); sort controls are nowhere at all. The
  roster's order is fixed and stated (D1).

## Decisions

### D1 — The roster renders the query Phase 1 already wrote, and Phase 2 adds no data access

`/agents` calls `listAgents()` from `src/server/agents.ts` unchanged. No new
query module, no new `include`, no new argument, and nothing added to
`src/lib/`.

*Rationale:* this is the first test of whether Phase 1's D9 did its job. That
decision wrote "the reads the roadmap has already named — list, by id, and the
relations the later phase needs loaded", and `listAgents()` returns every agent
ordered by name with `diagnoses: { include: { ailment: true } }` — which is
precisely name, model family, and presenting ailments. If this phase needs to
change the query, that is a finding about Phase 1 worth recording, not a routine
edit.

*The order is alphabetical and stays that way.* It comes from the query, it
makes the Playwright assertions stable, and the interesting orderings —
most recently admitted, most severely afflicted — are triage questions that
belong to the dashboard in Phase 7. A roster with no stated order is a roster
whose order changes when Prisma changes.

*Boundary.* "No new data access" is a check, not an aspiration: if the card
turns out to want a field the query does not load, the answer is to re-read D2
before it is to widen the query.

*Source:* [roadmap.md](../roadmap.md#phase-2--agent-roster) — "lists agent
patients as cards: name, model family, presenting ailments" — and D9 in the
[Phase 1 requirements](../2026-08-17-the-four-nouns/requirements.md), which
wrote `listAgents()` for this phase by name.

### D2 — A roster card carries three fields and no fourth

Name, model family, and the names of the ailments the agent presents. Nothing
else: no severity, no intake notes, no admission date, no appointment count, no
avatar.

*Rationale:* the roadmap names three fields, and every candidate fourth field
belongs to a phase that has already claimed it. Severities are Phase 3's case
file. Counts are Phase 7's dashboard. That is not pedantry about scope — it is
what stops the roster from becoming the case file, at which point Phase 3 has
nothing left to build and the reader learns that phase boundaries are decorative.

*Rejected: intake notes on the card.* This is the tempting one, because the
intake notes are where the personality lives and a card without them reads
plainly. Three reasons it still loses. The notes run two to three sentences
each, so eight of them turn a roster into a wall — the thing a roster exists to
avoid. They are the first content that would break the grid at 320px, which is
the exact failure this phase is meant to prove it can avoid. And Phase 3 opens
each patient's file specifically to read them; spending them here leaves the
case file showing the same text a second time.

*Consequence accepted:* the roster is a directory, not a story. The satire on
this page arrives through the ailment names attached to the patients — `Nim`,
four thousand tickets a day, presenting with `Prompt Fatigue` — rather than
through prose. If that turns out to read as dry, the fix is a Phase 8 treatment
decision or a Phase 3 link, not a fourth field added quietly here.

*Source:* [roadmap.md](../roadmap.md#phase-2--agent-roster) — the three named
fields — with the exclusions traced to
[roadmap.md](../roadmap.md#phase-3--agent-case-file) ("full ailment list with
severities", "profile") and
[roadmap.md](../roadmap.md#phase-7--clinic-dashboard) ("headline counts").

### D3 — Cards do not link, and the header gains the project's first navigation

Roster cards are not links, and neither are the ailment names on them: every
target route arrives in a later phase. The clinic header gains one link —
**Patients**, pointing at `/agents` — so the roster is reachable by clicking
rather than by typing a URL.

*Rationale, in two halves.*

The **cards** are the easy half. Phase 0's D5 forbids a link to a route that
does not exist yet, checks C9 and C23 have enforced it in both closed phases,
and `/agents/[id]` is Phase 3 by name. A card that links today ships a 404.

The **header** is the half worth arguing, because it is the one place this phase
goes beyond the roadmap's bullet list. Three things point the same way. The
no-dead-links rule was never *no links* — it was no links to routes that do not
exist, and after this phase `/agents` exists. The header component says so in
its own docstring, written in Phase 0: *"The nav lands here when there is
somewhere to point it."* And a page reachable only by typing its URL fails the
booth-demo audience in [mission.md](../mission.md#target-audience), where
*"if a demo needs a caveat spoken aloud, that is a bug"* — "just type slash
agents" is that caveat.

*Rejected: waiting for Phase 7's quick links.* Phase 7 puts "quick links into
the roster, catalog, and booking" on the dashboard, which is content on `/`, on
one page, five phases away. Reading that as *the roster stays unreachable until
then* would leave every phase from 2 to 6 shipping pages that only the author
can find.

*Boundary, and it is narrow.* In the existing header div, in the existing type
scale. Not a nav bar, not a mobile menu, no active-state styling, no icon, no
logo lockup. Each later phase that adds a route adds its own link the same way,
and the day that list stops fitting in a header at 320px is the day it becomes a
design decision with a spec — which will be Phase 8's, with the whole site in
view. The footer stays link-free.

*Corrected during implementation, on 2026-08-20, and recorded here rather than
absorbed:* this decision was written as **one** link and shipped as **two**. The
masthead becomes the link home, beside the `Patients` link. Writing the first
version made the omission obvious — a header that can only send you to `/agents`
strands the visitor there, with the browser's back button as the only way to the
clinic's front page. That is a worse demo than no navigation at all, and it is
not what "one link" was protecting against; the boundary exists to keep a nav
*bar* out of Phase 2, not to make the site one-way. Both targets exist, so
Phase 0's D5 is satisfied either way. The owner approved *one* link on this
phase's Q2 and is getting the wordmark as well, which is why it is written down
in the decision and in the changelog rather than left for someone to find in a
diff.

*This is [Q2](#open-questions).* The recommendation above is to add the link.

*Source:* [roadmap.md](../roadmap.md#phase-3--agent-case-file) — "roster cards
link through", which places card links in Phase 3 — with the no-dead-links rule
from D5 in the
[Phase 0 requirements](../2026-08-16-walking-skeleton/requirements.md), and
[mission.md](../mission.md#target-audience) for the header half.

### D4 — The grid reflows inside the shared container; the container keeps the width Phase 0 gave it

The roster is a CSS grid using Tailwind's default breakpoints only — one column
on a phone, more above `sm:` — inside the `max-w-2xl` container that the root
layout gives every route. The layout is not widened.

*Rationale:* the responsive convention in
[tech-stack.md](../tech-stack.md#responsive-design) requires mobile-first
utilities, no bespoke breakpoint, and nothing overflowing at 320px. A grid of
fluid cards satisfies all three without any new width anywhere: the cards have
no width of their own, the column count is the only thing that changes, and the
existing container cap is what keeps the whole thing from stretching on a wide
screen.

*The alternative is real and is written down because a test demands it.*
`tests/responsive.spec.ts` asserts `<main>` caps at 672px on a wide screen, and
its own comment says a change to that "should fail here and be argued in a spec,
not discovered on a projector." This is that spec, and the argument is:

- **For widening** (to `max-w-4xl` or `max-w-5xl`, in the layout, so the header
  and footer stay aligned with it): a projector at 1920px shows a two-column
  strip down the middle. The booth audience is stated in mission.md, and
  "reflows from one column to *several*" reads more naturally as three than as
  two.
- **Against widening:** it changes `/`, a page that has shipped through two
  closed phases and whose prose was measured at 672px, and it does so in the
  phase least equipped to judge the result — Phase 8 owns treatment and will
  have every route in front of it. It also rewrites an assertion in a passing
  test on a branch whose actual subject is a grid.

The recommendation is to **keep the cap**, on the grounds that it is the
reversible choice: widening later is one utility class and one test constant,
while narrowing back after Phase 8 has designed against a wide page is not.

*Cost accepted, stated plainly:* at `max-w-2xl` the roster tops out at two
columns, and eight patients make four rows on a desktop. That is a real cost to
a stated audience, and it is the owner's to accept — [Q1](#open-questions).

*Boundary either way:* no bespoke breakpoint. If a column count needs a width
Tailwind does not have, that is a decision record with a source, per the
convention — not a class someone reaches for.

*Source:* [tech-stack.md](../tech-stack.md#responsive-design) — fluid by
default, mobile-first, Tailwind's default breakpoints only — and
[roadmap.md](../roadmap.md#phase-2--agent-roster), "reflows from one column to
several without a bespoke breakpoint". The container cap it leaves alone is D8
in the [Phase 0 requirements](../2026-08-16-walking-skeleton/requirements.md).

### D5 — Two empty states, not one

The roadmap asks for an empty state. There are two, and only one of them is
obvious:

- **No patients at all.** The roster renders an in-voice message where the grid
  would be. *"Nobody on the books. The waiting room has never been quieter, and
  the staff have never been more concerned."*
- **A patient with no diagnosis.** A card whose agent has no rows in `Diagnosis`
  renders a line in place of its badges — *"No diagnosis on file yet."* — rather
  than a blank gap where a list was.

*Rationale:* the seed gives every agent at least one diagnosis, so the second
case never appears in a demo and would ship untested and unnoticed. It is
reachable the moment anyone seeds a partial clinic, edits `seed-data.ts`, or —
in Phase 6 and later — the moment an agent is admitted before being diagnosed.
An empty region with no text is the one failure mode that reads as a bug rather
than as a clinic with nothing to report.

Both are in clinic voice and neither obstructs: *"Funny is a feature; confusing
is not"* ([mission.md](../mission.md#tone)).

*Boundary:* an empty state is a message, not a call to action. No "admit a
patient" button — nothing in this product writes an agent, in this phase or any
planned one.

*Source:* [roadmap.md](../roadmap.md#phase-2--agent-roster) — "Empty state and
loading state, both in clinic voice" — and
[mission.md](../mission.md#tone) for the register.

### D6 — The loading state is a `loading.tsx`, and how little it can be seen is stated rather than assumed

`src/app/agents/loading.tsx` supplies the roster's loading UI: a short in-voice
line and placeholder cards, in the same grid as the real roster so the page does
not jump when the content arrives.

*Rationale:* it is the App Router's own mechanism — a Suspense boundary around
the route segment, no client component, no state, no new dependency — and the
roadmap asks for the state by name.

*What it cannot honestly claim, which is the part worth writing down.* `/agents`
reads at build time and is statically prerendered, exactly as `/` is
([D12](../2026-08-17-the-four-nouns/requirements.md#d12--the-home-page-stays-statically-prerendered-and-phase-6-is-told-why)).
A prerendered segment has nothing to wait for, so in production this file
appears only in the window where a client-side navigation is fetching the
segment's payload and the router has not already prefetched it. On a fast
connection with a warm prefetch, that window is nil. Phase 6 is where the
rendering strategy changes and where this state starts earning its keep.

*Measured during implementation on 2026-08-20, and it is worse than predicted.*
The window is not small; it does not exist. A Playwright test was written to
create one — refuse the router's prefetch, hold the navigation's payload, click —
and it failed, twice, for two different reasons that turn out to be the same
reason. Held prefetch: the router waits and commits the navigation only when the
payload lands, with no intermediate render. Aborted prefetch: it falls back to a
document request the boundary has no part in. A prerendered segment is not
streamed — it is one static payload — so there is no partial state for a
Suspense fallback to fill. The probe is in the validation walk; the test was
deleted rather than left failing or weakened until it passed.

*What is checked instead, since "the file exists" is check C10 in a new
costume:* a unit test renders `loading.tsx` and asserts it is in voice and
carries the **same grid** as the roster, so the swap will not jump when Phase 6
starts making it. That is the whole of what is true today. Whether Next shows it
is a fact about the rendering strategy, and the phase that owns the rendering
strategy owns proving it — Phase 6, whose exit criterion already runs against a
production build.

*Rejected: an artificial delay in the page to make the state visible.* It would
make the check pass by making the product worse, on a page whose stated audience
is a demo.

*Rejected: skipping the loading state until Phase 6 makes it observable.* The
roadmap asks for it here, and the file is five lines. Deferring it means Phase 6
inherits a UI gap inside a phase already carrying the rendering-strategy change.

*Source:* [roadmap.md](../roadmap.md#phase-2--agent-roster) — "Empty state and
loading state, both in clinic voice" — with the prerendering behaviour from D12
in the [Phase 1 requirements](../2026-08-17-the-four-nouns/requirements.md), and
the executable-check rule from
[tech-stack.md](../tech-stack.md#judgement-checks).

### D7 — `Badge` is the second shadcn primitive, and the only one this phase adds

`npx shadcn add badge` puts `src/components/ui/badge.tsx` in the repo. Presenting
ailments render as badges. `src/components/ui/` afterwards contains exactly
`card.tsx` and `badge.tsx`.

*Rationale:* Phase 0's D2 capped the project at one primitive and named this
phase as the owner of the next, so pulling one in is authorised rather than
opportunistic. A short list of conditions attached to a patient is what a badge
is for, it distinguishes the ailments from the model family beside them without
inventing a type scale, and `class-variance-authority` — its only dependency —
is already installed for the existing primitive. No package.json change.

*Rejected: a comma-separated line of text.* It costs nothing and reads as a
sentence rather than as a list, which is wrong for a set of conditions and gets
worse as the set grows. It also leaves Steve's "attractive" bar being carried by
nothing on the first page anyone will actually look at.

*Rejected: adding `Separator`, `Avatar`, or a `Skeleton` for D6's placeholders
while the command is open.* The cap exists precisely because a primitive is one
command away. D6's placeholders are a `Card` with muted blocks in it; that is
sufficient and adds no file.

*Boundary:* badges carry the ailment name and nothing else. No severity colour —
severity is Phase 3 (D2), and a `variant` mapped to severity here would be Phase
3's work landing early under a styling label.

*Source:* [tech-stack.md](../tech-stack.md#locked-in), which picks shadcn/ui as
components owned in-repo, and D2 in the
[Phase 0 requirements](../2026-08-16-walking-skeleton/requirements.md) — one
primitive, with "Phase 2 owns the next" written into its own boundary.

## Constraints inherited

From [tech-stack.md](../tech-stack.md), all still binding:

- **Server-first.** Nothing in this phase needs `"use client"` — a grid, a card,
  a badge, and a link are all static markup.
- **Responsive design.** Fluid, mobile-first, Tailwind's default breakpoints,
  nothing overflowing at 320px, verified at both viewports in Playwright. This
  is the phase where that convention stops being free (D4).
- **Clinic vocabulary everywhere.** The route is `/agents` because the noun is
  `Agent`; the nav label is **Patients** because that is what the clinic calls
  them and [mission.md](../mission.md#who-it-serves) says so in its first table.
  Both are the same vocabulary rule pointing at two different readers, which is
  worth noticing rather than smoothing over.
- **No branch on deploy target, no runtime filesystem writes, no network after
  `npm install`.**
- **No new dependency.** D7's primitive is a file, not a package.
- **Rendering strategy unchanged.** `/agents` prerenders, per D12. Phase 6 owns
  the change, and this phase must not pre-empt it — see D6 for the one place
  that costs something.
- **Provenance.** Every decision above names its source, and
  `npm run check:provenance` fails if one stops doing so.
- **Changelog.** This branch touches `specs/` and `src/`, so it updates
  `CHANGELOG.md` before it merges.

## Open questions

None. Both were answered by the owner on 2026-08-20, before any code was
written.

**Q1 — Does the shared container stay at `max-w-2xl`?** **Yes, as
recommended.** The roster reflows one column to two inside the cap Phase 0's D8
put in the root layout, and `/` is not touched. D4 above stands exactly as
written, including its cost: a two-column strip on a wide screen, and eight
patients making four rows. The reversibility argument is what carried it —
widening after Phase 8 has designed against a narrow page is a utility class and
a test constant; narrowing after it has designed against a wide one is not.

No [mission.md](../mission.md#owner-decisions) entry, for the same reason Phase
1's Q2 needed none: the answer installs no requirement. It declines to change
one, and the clause it leaves standing — the container cap in D8 of the
[Phase 0 requirements](../2026-08-16-walking-skeleton/requirements.md) — already
carries its own source. Widening would have needed the entry; keeping does not.

**Q2 — Does the header gain its first link in this phase?** **Yes, one link.**
D3 above stands, including its boundary: one link, in the existing div and type
scale, no nav bar, no mobile menu, no active state, footer still link-free. This
one *is* a new requirement with no stakeholder behind it — the roadmap does not
ask for navigation until Phase 7 — so it is registered as a dated owner decision
in [mission.md](../mission.md#owner-decisions), which is the path the responsive
requirement had to be walked back through on 2026-08-19.

Ambiguity found during implementation goes to the backlog or reopens this file,
not into the code.
