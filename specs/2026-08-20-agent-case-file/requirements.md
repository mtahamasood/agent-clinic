# Requirements — Agent case file

Feature spec for **Phase 3** of
[roadmap.md](../roadmap.md#phase-3--agent-case-file).

## Why this phase exists

Phase 2 put eight patients on screen and deliberately told you almost nothing
about any of them. A roster card carries three fields; the seed carries intake
notes, severities, diagnosis dates, clinical asides, and nine appointments, and
every one of those is currently readable only in `prisma/seed-data.ts`. D2 of
the [Phase 2 spec](../2026-08-20-agent-roster/requirements.md) parked all of it
here by name.

So this phase is where the clinic stops being a directory and starts being a
records office. Three things make it different from Phase 2, and the spec is
arranged around them:

- **It is the first dynamic route.** `/agents/[id]` cannot be prerendered by
  existing, so keeping the rendering strategy that Phase 1's D12 and Phase 2's
  D5 both pin is now something this phase has to *do* rather than inherit (D3).
- **It is the first route that can be asked for something that does not exist.**
  A wrong id is a 404, and the roadmap wants that 404 in voice (D4).
- **It is the first link between two pages of our own.** Phase 0's D5 has been
  forbidding links to routes that do not exist since the first commit; this is
  the phase where the roster finally points somewhere (D5).

## In scope

| Area | What lands |
| --- | --- |
| Route | `/agents/[id]` — a Server Component rendering one patient's file (D1) |
| Profile | Name, model family, admission date, intake notes (D2) |
| Ailments | Every diagnosis: ailment name, severity in words, date, clinical aside (D2, D6) |
| Appointments | Every booking, upcoming and past, with therapy, time, status, notes (D2, D7) |
| Prerendering | `generateStaticParams()` over the roster, so the eight files build statically (D3) |
| Not found | `src/app/agents/[id]/not-found.tsx`, in clinic voice, with its status code measured rather than assumed (D4) |
| Roster | Each card's patient name becomes a link to their file (D5) |
| Formatting | One date module in `src/lib/`, with a fixed locale and unit tests (D8) |
| Empty states | Two more, neither reachable from the seed: no diagnoses, no appointments (D9) |
| Queries | None. `getAgent()` and `listAgents()` from Phase 1 already return all of it (D1) |
| E2E | A case-file spec, the roster's link test rewritten, and the responsive sweep extended |
| Docs | `README.md` status line; `CHANGELOG.md` entry |

## Out of scope

Deferred to a named phase, so nobody has to re-argue it on the branch.

- **`/ailments`, `/ailments/[id]` — Phase 4.** The ailment names on a case file
  are text, not links. Phase 4's own exit criterion is the cross-link
  ("navigate agent → ailment → other affected agents"), and it arrives with the
  route it points at.
- **`/therapies`, `/therapies/[id]` — Phase 5.** Same rule for the therapy name
  on an appointment.
- **Booking anything — Phase 6.** No "book a session" button, no form, no
  Server Action, and nothing on this page writes. The case file is where a
  booked appointment *appears*, which is Phase 6's exit criterion, not where it
  is made.
- **Cancel, reschedule, outcome notes.** [Roadmap backlog](../roadmap.md#backlog),
  unpromised, and each would have to settle how a freed slot interacts with the
  uniqueness constraints in Phase 1's D6 before it could be built.
- **Anything on `/` — Phase 7.** No counts, no "recent intakes", no link of its
  own. `/` is untouched by this phase.
- **A site-wide 404.** This phase 404s an unknown *agent* (D4). An unmatched URL
  anywhere else in the app still gets Next's default page, and changing that is
  a whole-site treatment question that belongs with the rest of them in Phase 8.
- **Design treatment — Phase 8.** Legible defaults only: no bespoke typography,
  no motion, no illustration, no social preview metadata.
- **A `loading.tsx` for this route.** Not asked for, and Phase 2 measured what
  one is worth on a prerendered segment (D10).

## Decisions

### D1 — The case file renders the query Phase 1 already wrote, and Phase 3 adds no data access

`/agents/[id]` calls `getAgent(id)` from `src/server/agents.ts`, unchanged.
`generateStaticParams()` calls `listAgents()`, unchanged. No new query module,
no new `include`, no new argument, and `git diff main -- src/server/` is empty
at the end of this phase.

*Rationale:* `getAgent()` was written in Phase 1 for this page and says so in
its own docstring — *"One patient's case file: profile, ailments with
severities, and every appointment they have on the books, most recent first"* —
with `diagnoses: { include: { ailment: true } }` and
`appointments: { include: { therapy: true } }` already loaded. Phase 2 proved
D9 had got `listAgents()` right; this is the second and larger test of the same
claim, on the query that carries three relations instead of one.

*The same boundary Phase 2 used, for the same reason.* If the page turns out to
want a field the query does not load, the answer is to re-read D2 before it is
to widen the query — and if the query genuinely is short, that is a finding
about Phase 1 worth writing down, not a routine edit.

*`generateStaticParams()` reusing `listAgents()` is deliberate.* It needs eight
ids and that query returns eight agents with their diagnoses attached, which is
more than it needs. A dedicated `listAgentIds()` would be tidier and would also
be a new query in `src/server/` on a branch whose whole claim is that it added
none. The waste is one build-time query over eight rows.

*Source:* [roadmap.md](../roadmap.md#phase-3--agent-case-file) — "the patient's
page: profile, full ailment list with severities, appointment history" — and D9
in the [Phase 1 requirements](../2026-08-17-the-four-nouns/requirements.md),
which wrote `getAgent()` for this phase by name.

### D2 — What a case file carries, in three sections

The page is one patient, top to bottom:

- **Profile.** The `<h1>` is the patient's name. Beneath it: model family,
  admission date, and the intake notes in full.
- **Presenting ailments.** One entry per `Diagnosis`: the ailment's name, its
  severity written as a word (`severityLabel()` from Phase 1), the date it was
  diagnosed, and the clinical aside in `Diagnosis.notes` when there is one.
- **Appointments.** One entry per `Appointment`: the therapy's name, when it is
  or was, its status in words (`appointmentStatusLabel()` from Phase 1), and the
  session note when there is one.

*Rationale:* the roadmap names three things — profile, full ailment list with
severities, appointment history — and this is those three with nothing invented.
Every field above already exists in the schema, is already loaded by `getAgent()`,
and was already excluded from the roster by Phase 2's D2 on the grounds that it
belonged here.

*Severity is written out, and the badge variant agrees with the word.* The
severity reads as `Mild`, `Moderate`, or `Severe` — text first, because a colour
alone is a claim only the author can read. The `Badge` primitive's existing
variants reinforce it: `outline`, `secondary`, `destructive` in that order.
Phase 2's D7 kept severity colour off the roster with the words *"a `variant`
mapped to severity here would be Phase 3's work landing early under a styling
label"*, which makes it this phase's to spend. **Boundary:** only variants the
vendored primitive already ships. No new colour, no new class, no severity
scale of our own — that would be a design decision with no source, in the phase
least equipped to make one.

*Rejected: an appointment count, a "most severe" summary line, or any other
derived statistic.* Headline counts are Phase 7's dashboard by name. A case file
lists; it does not aggregate.

*Rejected: a "book a session" call to action.* Phase 6 owns booking, and D5 of
the Phase 0 spec forbids a link to a route that does not exist. This is the page
where the button will eventually be obvious, and its absence is the phase
boundary doing its job.

*Source:* [roadmap.md](../roadmap.md#phase-3--agent-case-file) — the three named
sections — with the fields traced to the schema Phase 1's D5 and D6 built, and
the severity-variant clause to D7 in the
[Phase 2 requirements](../2026-08-20-agent-roster/requirements.md).

### D3 — The route is statically prerendered, which on a dynamic segment takes work

`src/app/agents/[id]/page.tsx` exports `generateStaticParams()` returning one
entry per agent. `dynamicParams` is left at its default and no route segment
config is added.

*Rationale:* `/` and `/agents` are prerendered at build time
([D12](../2026-08-17-the-four-nouns/requirements.md#d12--the-home-page-stays-statically-prerendered-and-phase-6-is-told-why),
and D5 of the Phase 2 validation), and Phase 6 owns the change. A dynamic
segment does not inherit that for free: without `generateStaticParams()` the
segment is rendered on demand, which would quietly move this project onto a
different rendering strategy in the phase before the one that owns the decision.
Next's own reference is explicit that the function exists to *"statically
generate routes at build time instead of on-demand at request time"*.

*Left at the default deliberately, and this is the arguable half.*
`export const dynamicParams = false` would make the eight built files the only
ones that exist and 404 everything else without touching the database, which is
tempting and is **rejected**: at `false`, an unbuilt param is refused at the
routing layer, so the segment — and therefore the segment's own
`not-found.tsx` — never renders, and the in-voice 404 the roadmap asks for in
D4 is the thing that would be lost. Keeping the default costs one on-demand
render per wrong URL, and buys the 404 the phase was asked for.

*Consequence, stated so Phase 6 does not have to rediscover it:* a patient
admitted after the build has a case file that renders on demand while the roster
that should link to it is still the prerendered eight. That incoherence is
D12's, not this phase's, and it is one more thing Phase 6's rendering decision
has to settle.

*Verified, not assumed:* the build output names the route and its prerendered
paths, and the validation walk reads it (C3). "It is probably static" is exactly
the shape of claim check C10 turned out to be.

*Source:* D5 in the [Phase 2 validation](../2026-08-20-agent-roster/validation.md)
and D12 in the
[Phase 1 requirements](../2026-08-17-the-four-nouns/requirements.md) — the
rendering strategy is unchanged until Phase 6 — with the mechanism from Next's
bundled `generateStaticParams` and `dynamicParams` reference, which ships in
`node_modules/next/dist/docs`.

### D4 — An unknown patient gets an in-voice 404, and its status code is measured rather than claimed

`getAgent()` returns null → the page calls `notFound()` →
`src/app/agents/[id]/not-found.tsx` renders the clinic saying so:
*"No such patient. The clinic has looked twice, which is once more than it
usually manages."* The header, the footer, and the container come from the root
layout, so a wrong URL still looks like the clinic rather than like a crash.

*Rationale:* the roadmap asks for "404 handling for an unknown agent, in voice",
and `not-found.tsx` is the App Router's own mechanism for it — no client
component, no error boundary of our own, no new dependency.

*The part that is not assumed.* Next's reference says a `not-found.js` response
carries **"a `200` HTTP status code for streamed responses, and `404` for
non-streamed responses"**. So the status code this route actually returns is a
measurement, not a fact anyone can read off the source. The validation walk
takes it and records what it saw (C6). If it comes back 200, that is a finding
about the framework's behaviour on this route, recorded in this file the way
Phase 2 recorded the loading state — **not** a reason to reach for a workaround
in the product, and **not** something to leave ticked on the strength of the
copy rendering.

*Rejected: a root `not-found.tsx` covering every unmatched URL.* It is four
lines and it is a whole-site question — what the clinic says when you ask for a
page it has never had — which is Phase 8's, with every route in view. This phase
404s the thing the roadmap named: an unknown agent.

*Boundary:* the 404 page is a message, not a search. No "did you mean", no
roster embedded in it. The header already carries a link back to the patients.

*Source:* [roadmap.md](../roadmap.md#phase-3--agent-case-file) — "404 handling
for an unknown agent, in voice" — with [mission.md](../mission.md#tone) for the
register and Next's bundled `not-found.js` reference for the status-code
behaviour.

### D5 — The roster links through by the patient's name

`AgentCard`'s title becomes a `next/link` to `/agents/{id}`. The card itself is
not a link, and the ailment badges are still not links.

*Rationale:* the roadmap puts "roster cards link through" in this phase, and
this is the phase where `/agents/[id]` exists, so Phase 0's D5 is finally
satisfied in the direction it was always pointing.

*Rejected: wrapping the whole card in the link.* It is the bigger target and it
loses on clarity: the link's text becomes every word on the card — the name, the
model family, and each ailment badge run together — so what the reader is told
they are clicking is a paragraph rather than a patient. A link whose text is the
patient's name says where it goes. *"Funny is a feature; confusing is not"*
([mission.md](../mission.md#tone)) covers plain reading as much as jokes. If a
card that feels clickable end to end turns out to matter, that is a treatment
decision with the whole site in view, which is Phase 8's.

*Not a reason, recorded so nobody mistakes it for one:* a card-wrapping link
would also change the DOM shape that four existing Playwright assertions select
on (`ul > li > [data-slot='card']`). Test churn is a cost, not an argument, and
if the whole-card link were right the tests would change.

*Consequence: a Phase 2 test is rewritten, not deleted.* `tests/roster.spec.ts`
asserts today that `/agents` contains **no** links in `<main>` — check C5 of the
Phase 2 spec. That assertion was correct when nothing existed to point at and is
now wrong. It becomes: every card links to its patient's file, and nothing else
on the page links at all. Deleting it would drop the badge half of the rule,
which is still live until Phase 4.

*Source:* [roadmap.md](../roadmap.md#phase-3--agent-case-file) — "Roster cards
link through" — with the no-dead-links rule from D5 in the
[Phase 0 requirements](../2026-08-16-walking-skeleton/requirements.md), which
this phase satisfies rather than breaks.

### D6 — Presenting ailments are ordered by severity, with a stated tiebreak

The list is sorted with `compareSeverity()` from `src/lib/severity.ts`, and
ailments of equal severity fall back to alphabetical order by name. The
direction — worst first or mildest first — is **[Q1](#open-questions)**.

*Rationale:* the query returns diagnoses ordered by `diagnosedOn` desc, which is
the order the clinic wrote them down in and not an order a reader of the file
wants. Sorting in the component rather than widening the query is the pattern
Phase 2 set in `AgentCard`, for the reason it gave: presentation order is a
presentation decision, and the alternative is a `getAgent()` that changes every
time a page changes its mind.

*The tiebreak is not decoration.* Two of the eight seeded patients have one:
Roux presents two `MODERATE` diagnoses and Nim presents two `MILD` ones. A sort
with no tiebreak leaves each of those pairs in whatever order the database
happened to return — which is a Playwright assertion that passes until it does
not. Phase 2 made the same call for the same reason and wrote it into
`AgentCard`.

*Why the direction was a question rather than a decision.* `src/lib/severity.ts`
already asserted an answer, in two doc comments written in Phase 1: *"Mildest
first. Reverse it for a triage list; a case file reads better this way"* and
*"Sorts a case file worst-last"*. That is a written source, and this spec
declines to overrule a written source by implementation. It went to the owner,
who reversed it — so both comments are corrected in the same commit as the sort.
A comment that names the wrong page is the stale-docstring fault the Phase 2
walk had to fix once already, and these two would be worse than stale: they
would describe the opposite of what the page does.

*Source:* [roadmap.md](../roadmap.md#phase-3--agent-case-file) — "full ailment
list with severities" — and D5 in the
[Phase 1 requirements](../2026-08-17-the-four-nouns/requirements.md), which put
clinical order in `src/lib/severity.ts` precisely so a page would not invent one.

### D7 — Appointments are split into upcoming and past, and the case file shows both

Two lists under one heading: what is still to come, soonest first, and what has
already happened, most recent first. Both are read from the same
`agent.appointments` array; the split is a comparison against the current time
in the component.

*Rationale, and the deciding half of it is Phase 6's.* The roadmap calls this
section "appointment history", which on its own would read as *past only* — and
Phase 6's exit criterion is that a **newly booked** appointment "appears on the
agent's case file". A newly booked appointment is in the future. A case file
that showed history alone would satisfy this phase's wording and fail the next
phase's exit criterion, so it shows both.

*Why split rather than one list.* `getAgent()` returns every appointment by
`scheduledFor` desc, which puts the furthest-future booking at the top and reads
as a history that starts three days from now. Atlas has one of each — a session
today and another in three days — so the confusion is in the seed, not
hypothetical. Two headed lists cost one comparison and a `filter`, and they say
which is which without the reader having to check a status badge to find out.

*Rejected: hiding future appointments to match the roadmap's word.* It would
make this page wrong for exactly one release, and Phase 6 would have to widen it
again while carrying the rendering-strategy change.

*Boundary:* the split is a read. Nothing here writes, reschedules, or cancels,
and "upcoming" is not a booking affordance — it is a list with no button next to
it.

*Source:* [roadmap.md](../roadmap.md#phase-3--agent-case-file) — "appointment
history" — with [roadmap.md](../roadmap.md#phase-6--booking) for the requirement
that a booked appointment appear here, and D5 in the
[Phase 1 requirements](../2026-08-17-the-four-nouns/requirements.md), which
wrote the two-value status vocabulary with this page in mind.

### D8 — Dates are formatted in one module, in a fixed locale

`src/lib/clinic-date.ts` exports `formatClinicDate()` for a day and
`formatClinicDateTime()` for a slot. Both build an `Intl.DateTimeFormat` with
the locale pinned to `en-GB` and **no** `timeZone` option. Unit tests cover both
against fixed instants.

*Rationale:* this is the first phase that puts a date on screen, and three of
them at once — admission, diagnosis, appointment. Left to
`toLocaleDateString()` with no arguments, the string depends on the machine's
locale, which makes a Playwright assertion machine-dependent and makes two
developers' screenshots disagree for no reason anybody can see. Pinning the
locale is what makes the output a fact about the code rather than about the
runner.

*No `timeZone`, deliberately.* The seed builds every instant from local midnight
plus a whole number of hours (Phase 1's D7), so the clinic's calendar is already
relative to whoever is running it. Forcing UTC would render a 09:00 appointment
at some other hour and make the seeded day boundaries wrong.

*It is `src/lib/`, which is where the layout map puts it* — domain logic and
formatters, alongside `severity.ts` and `appointment-status.ts`, both of which
exist for the same reason: the half of a value that the schema cannot carry.

*Consequence for the tests:* Playwright asserts on seeded relationships —
therapy names, status words, ailment names — and not on rendered date strings.
The format itself is a unit test with a fixed `Date`, which is where a
formatting change should fail. A suite that asserts today's date in prose is a
suite that fails at midnight.

*Source:* [tech-stack.md](../tech-stack.md#conventions) — the directory layout
and the data-access convention — with the quality gate that the Playwright suite
passes at both viewports
([tech-stack.md](../tech-stack.md#quality-gates)), since a machine-dependent
string is a gate that passes or fails by accident, and the seed's relative
calendar from D7 in the
[Phase 1 requirements](../2026-08-17-the-four-nouns/requirements.md).

### D9 — Two more empty states, neither of which a demo will ever reach

- **No diagnoses on file.** *"No diagnosis on file yet. The intake notes are all
  the clinic has to go on."*
- **No appointments.** *"Never been seen. Registered, diagnosed, and left in the
  waiting room."*

Both render where their list would be, in clinic voice, and both are verified by
a unit test that renders the component with an empty relation.

*Rationale:* this is Phase 2's D5 applied to a page with two lists instead of
one. The seed gives all eight patients both a diagnosis and an appointment, so
neither state appears in a demo, a screenshot, or the Playwright run — which is
exactly why they ship untested and unnoticed unless something renders them.
Every one becomes reachable the moment anyone seeds a partial clinic, and the
appointment one becomes reachable in the ordinary course of Phase 6, where a
patient exists before their first booking.

*Verified by rendering, not by reading.* Phase 2's C9 settled the standard:
ticking an empty state by reading the JSX does not count, so each list is a
component with a prop rather than a branch inside the page, and each has a test
that renders it empty.

*Boundary:* a message, not a call to action. Nothing in this product admits a
patient or books a session yet.

*Source:* [roadmap.md](../roadmap.md#phase-3--agent-case-file) — the case file
is "complete" for every agent on the roster, which includes the ones with
nothing in a list — with D5 in the
[Phase 2 requirements](../2026-08-20-agent-roster/requirements.md) for the
two-empty-states pattern and [mission.md](../mission.md#tone) for the register.

### D10 — Nothing else is added: no primitive, no nav link, no loading state

Three things this phase could reach for and does not.

- **No third shadcn primitive.** `src/components/ui/` still holds exactly
  `card.tsx` and `badge.tsx` at the end of this phase. A case file is headings,
  prose, two lists, and the badge that already exists; `Separator`, `Table`, and
  `Avatar` would each be a file added because the command is one line, which is
  the reason the cap exists.
- **No new header link.** D3 of the Phase 2 spec says each later phase adds its
  own link the same way — and a case file is not a destination anyone navigates
  to, it is one you arrive at from the roster. The header's **Patients** link
  already gets you back. Phases 4 and 5 add theirs; this phase adds none, which
  is the same rule producing a different answer.
- **No `loading.tsx` for this route.** The roadmap asks for a loading state in
  Phase 2 and does not ask again, and Phase 2 measured what one is worth on a
  prerendered segment: there is no window in which it renders. Adding a second
  one here would be a file with no source and no observable behaviour.

*Rationale:* each of these is individually defensible and none of them was
asked for, which is the definition the provenance rule uses. Writing them down
as declined is cheaper than arguing them in review.

*Source:* [tech-stack.md](../tech-stack.md#requirement-provenance) — nothing
enters without a source, and none of these three was asked for — with D2 in the
[Phase 0 requirements](../2026-08-16-walking-skeleton/requirements.md) (one
primitive, the next one per phase, by spec) and D3 and D6 in the
[Phase 2 requirements](../2026-08-20-agent-roster/requirements.md) (the
navigation rule and the loading-state finding).

## Constraints inherited

From [tech-stack.md](../tech-stack.md), all still binding:

- **Server-first.** Nothing here needs `"use client"`. The upcoming/past split
  is a comparison performed while the page renders, not interactivity.
- **Responsive design.** Fluid, mobile-first, Tailwind's default breakpoints,
  nothing overflowing at 320px, verified at both viewports. The new risk on this
  page is long prose — intake notes and clinical asides — rather than a grid.
- **Clinic vocabulary everywhere.** `Diagnosis`, not "tag". `Appointment`, not
  "booking". The section headings are what a receptionist would call them.
- **No branch on deploy target, no runtime filesystem writes, no network after
  `npm install`.**
- **No new dependency.** `package.json` and `package-lock.json` are unchanged.
- **No schema change.** `prisma/schema.prisma` and `prisma/migrations/` are
  byte-identical to `main`. The schema is closed until Phase 6 says otherwise.
- **Rendering strategy unchanged.** Every route prerenders, which on this route
  is D3's work rather than a default.
- **Provenance.** Every decision above names its source, and
  `npm run check:provenance` fails if one stops doing so.
- **Changelog.** This branch touches `specs/` and `src/`, so it updates
  `CHANGELOG.md` before it merges.

## Open questions

None. Both were answered by the owner on 2026-08-20, before any code was
written.

**Q1 — Do presenting ailments read worst first, or mildest first?** **Worst
first, as recommended.** `SEVERE` at the top, `MILD` at the bottom, ties broken
alphabetically. D6 above stands as written.

This one overturns a written source rather than merely settling an open point,
which is why it could not be decided on the branch. `src/lib/severity.ts` says
in two doc comments, written in Phase 1 before there was a page to look at,
*"Mildest first. Reverse it for a triage list; a case file reads better this
way"* and *"Sorts a case file worst-last"*. The argument that carried: a
patient's file exists to answer *what is wrong with this one*, and the answer is
the `SEVERE` row — mildest-first opens Bodhi's file on a mild diagnosis and
makes the reader scan for the problem. The counter-argument is real and is what
Phase 1 had in mind: a list that escalates ends on its worst line, which reads
better as prose. This is a page of records, and the reader is scanning.

`compareSeverity()` itself does not change — it is a comparator, and the call
site reverses it. Both comments do change, in the same commit as the sort
(plan 1.3): left alone they would describe the opposite of what the page does,
which is worse than a stale docstring.

No [mission.md](../mission.md#owner-decisions) entry, for the same reason Phase
2's Q1 needed none: the answer installs no requirement on the product. It picks
a direction for one list on one page, and the clause it corrects — clinical
order living in `src/lib/severity.ts` — already carries its own source in Phase
1's D5. A general rule attached to the answer ("the clinic always leads with the
worst") *would* have been an entry; one was not given and one is not invented
here.

**Q2 — Does an ailment entry carry the ailment's one-line summary?** **No, as
recommended.** An entry carries the ailment's name, the severity, the diagnosis
date, and `Diagnosis.notes` when there is one. D2 above stands as written and
needs no amendment.

The summary is the same sentence for every patient who presents with that
ailment — the only text on the page that is not about *this* patient — and it
competes with the clinical aside, which is. It is also the wall of text D2 kept
off the roster, moved one route along.

*Cost accepted, stated plainly:* until Phase 4, a reader who does not know what
`Sycophantic Drift` means has nowhere on this page to find out. That closes when
the ailment name becomes a link to `/ailments/[id]`, which is Phase 4's exit
criterion by name — not a gap this phase leaves permanently, a gap it leaves for
one phase.

No register entry: declining to add a field installs nothing.

Ambiguity found during implementation goes to the backlog or reopens this file,
not into the code.
