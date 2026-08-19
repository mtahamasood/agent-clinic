# Requirements — Ailment directory & therapy catalog

Feature spec for **Phase 4+5** of
[roadmap.md](../roadmap.md#phase-45--ailment-directory--therapy-catalog) — the
first merged phase of the MVP compression (owner-registered stakeholder ask,
2026-08-20, in [mission.md](../mission.md#owner-decisions)).

## Why this phase exists

The clinic can show you a patient and everything wrong with them, and then
strands you: every ailment on a case file is dead text, and the therapies the
clinic keeps talking about have no pages at all. Phase 3's Q2 accepted that
cost by name — *"until Phase 4, a reader who does not know what `Sycophantic
Drift` means has nowhere on this page to find out"* — for exactly one phase.
This is that phase.

It is deliberately the least inventive phase in the roadmap, and the spec is
arranged around why:

- **The queries already exist.** Phase 1's D9 wrote `listAilments()`,
  `getAilment()`, `listTherapies()`, `getTherapy()`, and
  `listTherapiesForAilment()` for these pages by name, and the MVP compression
  entry stakes its "safe to merge" claim on that. So, as in Phases 2 and 3,
  `src/server/` does not change — and this time across five routes rather than
  one (D1).
- **The patterns already exist.** Dynamic segments that stay prerendered,
  in-voice 404s, empty states rendered by tests, titles that name the page —
  each was settled in Phase 3 and is applied here rather than re-decided
  (D6, D7, D8, D11).
- **What is genuinely new is the linking.** This phase roughly quadruples the
  routes and wires the four nouns into a web: agent → ailment → other affected
  agents, ailment ↔ therapy, both directions (D5). The exit criterion is
  navigation, not content.

## In scope

| Area | What lands |
| --- | --- |
| Routes | `/ailments`, `/ailments/[id]`, `/therapies`, `/therapies/[id]`, `/therapies/for/[ailment]` — all Server Components, all prerendered (D6) |
| Directory | Every ailment: name and one-line summary, linking to its entry (D2) |
| Ailment entry | Name, summary, clinical description, symptoms in order, who presents with it and how badly, what treats it (D2) |
| Catalog | Every therapy: name, summary, duration — plus the filter (D3, D4) |
| Therapy entry | Name, summary, what the session involves, duration, what it treats (D3) |
| Filter | The catalog filtered to one ailment, as a prerendered route per ailment (D4) |
| Cross-links | Case-file ailments and therapies, roster badges, and every noun name on the new pages become links (D5) |
| Not found | In-voice 404s for an unknown ailment and an unknown therapy (D7) |
| Empty states | Six, none reachable from the seed, each a component a test can render (D8) |
| Header | Two nav links join **Patients**, and the nav learns to wrap (D9) |
| Queries | None. Phase 1 wrote all five, including the one that has waited three phases to be called (D1) |
| E2E | Ailment and therapy specs, the roster's badge test rewritten, the responsive sweep extended to every new route |
| Docs | `README.md` status line; `CHANGELOG.md` entry |

## Out of scope

Deferred to a named phase, so nobody has to re-argue it on the branch.

- **Booking anything — Phase 6+7.** A therapy page is where the "pick an agent,
  pick a slot" flow will start, and it starts there next phase. No button, no
  form, no Server Action, nothing writes.
- **Anything on `/` — Phase 6+7.** The dashboard is the other half of the
  booking phase. The home page is untouched.
- **A search box.** "Search across agents, ailments, and therapies" is in the
  [roadmap backlog](../roadmap.md#backlog), unpromised. The filter in D4 is
  links, not input.
- **A site-wide 404, and the status-code settlement — Phase 8.** This phase
  404s an unknown ailment and an unknown therapy the way Phase 3 404'd an
  unknown patient, and inherits the measured HTTP 200 with the same trade
  (D7). The whole-site question stays where D4 of the
  [Phase 3 spec](../2026-08-20-agent-case-file/requirements.md) put it.
- **Design treatment — Phase 8.** Legible defaults only. No bespoke
  typography, no motion, no illustration, no social-preview metadata, and no
  redesign of the header when its nav wraps (D9 keeps the existing scale).
- **Symptom pages.** A symptom is a value list, not a noun — Phase 1's D4 —
  and it stays one. Symptoms render as text on their ailment's page.
- **Appointment counts, popularity, "most common" anything.** Aggregation is
  the dashboard's, next phase.

## Decisions

### D1 — Five routes render the five queries Phase 1 already wrote, and `src/server/` does not change

`/ailments` calls `listAilments()`; `/ailments/[id]` calls `getAilment(id)`;
`/therapies` calls `listTherapies()`; `/therapies/[id]` calls `getTherapy(id)`;
`/therapies/for/[ailment]` calls `listTherapiesForAilment(ailmentId)`. Each
`generateStaticParams()` reuses the matching list query. No new query, no new
`include`, no new argument, and `git diff main -- src/server/` is empty at the
end of this phase.

*Rationale:* the MVP compression entry in
[mission.md](../mission.md#owner-decisions) justified merging Phases 4 and 5 on
the claim that both halves sit "over queries `src/server/ailments.ts` and
`src/server/therapies.ts` have carried since Phase 1". This phase is where that
claim is tested. Each query's own docstring names the page it was written for —
`getAilment()` loads "symptoms in presentation order, the agents who present
with it, and the therapies that treat it", which is D2's field list before D2
was written.

*`listTherapiesForAilment()` is called for the first time, three phases after
it was written.* Its docstring — *"An agent who knows what ails them arrives
here; Phase 5 stakes its exit criterion on this returning everything"* — has
been a promise since Phase 1, and Phase 1's D9 permits no query "that no named
later phase asked for". The filter route in D4 is the page it was asking for.

*The same boundary Phases 2 and 3 used, for the same reason.* If a page turns
out to want a field the query does not load, the answer is to re-read D2 and D3
before it is to widen the query — and if a query genuinely is short, that is a
finding about Phase 1 worth writing down, not a routine edit.

*Source:* [roadmap.md](../roadmap.md#phase-45--ailment-directory--therapy-catalog)
— the route list — and D9 in the
[Phase 1 requirements](../2026-08-17-the-four-nouns/requirements.md), which
wrote every one of these queries for this phase by name, with the merge
rationale in the 2026-08-20 MVP entry in
[mission.md](../mission.md#owner-decisions).

### D2 — What the directory and an ailment's entry carry

`/ailments` is a list, one entry per ailment in alphabetical order: the name,
linking to the entry, and the one-line `summary`. **A list, not a card grid** —
see the joint layout note under D3.

`/ailments/[id]` is one condition, top to bottom:

- **The write-up.** The `<h1>` is the ailment's name; beneath it the summary,
  then the clinical `description` in full.
- **Presenting symptoms.** The `Symptom` rows in `position` order, as a plain
  list.
- **Patients presenting.** One entry per `Diagnosis`: the patient's name
  linking to their case file, and the severity of *their* case as a word with
  the badge variant Phase 3 mapped. Alphabetical by patient name.
- **Treated by.** One entry per linked `Therapy`: the name linking to its
  catalog page, its summary, and its duration. Alphabetical.

*Rationale:* the roadmap names the fields — "deadpan clinical description,
symptoms, which agents present with it, which therapies treat it" — and this is
those, with nothing invented. Every field exists in the schema and is loaded by
`getAilment()` already.

*The severity beside each patient is the same fact the case file shows,
rendered from the other end.* The roadmap's exit criterion sends a reader here
to find "other affected agents"; a bare list of names answers *who* and
withholds *how badly*, which is the half a clinic would lead with. It reuses
`severityLabel()` and Phase 3's badge-variant mapping unchanged — no new
colour, no new scale (D2 of the
[Phase 3 spec](../2026-08-20-agent-case-file/requirements.md) still binds).

*Alphabetical, not worst-first, and the difference is deliberate.* Q1 of the
Phase 3 spec settled worst-first for one list on one page and its record says
so — "the answer installs no requirement on the product". The precedent that
does carry here is the roster's: a list of *patients* reads alphabetically
(Phase 2's D2), and this is a list of patients. A general rule about severity
ordering would need the owner; none is asserted.

*Rejected: a diagnosis count, a "most affected" line, or any aggregate.* The
dashboard is next phase, and Phase 3's D2 already refused the same temptation
on the case file.

*Source:* [roadmap.md](../roadmap.md#phase-45--ailment-directory--therapy-catalog)
— the field list — with the severity rendering resting on D2 in the
[Phase 3 requirements](../2026-08-20-agent-case-file/requirements.md), the
alphabetical order on D2 in the
[Phase 2 requirements](../2026-08-20-agent-roster/requirements.md), and symptom
order on D4 in the
[Phase 1 requirements](../2026-08-17-the-four-nouns/requirements.md), which made
`position` data precisely so a page would not invent an order.

### D3 — What the catalog and a therapy's entry carry

`/therapies` is a list, one entry per therapy in alphabetical order: the name,
linking to the entry, the one-line `summary`, and the duration written as
"{n} minutes". Above the list sits the filter (D4).

`/therapies/[id]` is one treatment, top to bottom:

- **The write-up.** The `<h1>` is the therapy's name; beneath it the summary,
  the duration, then the `description` — what the session involves — in full.
- **Treats.** One entry per linked `Ailment`: the name linking to its
  directory entry, and its one-line summary. Alphabetical.

*Rationale:* the roadmap again names the fields — "what it involves, duration,
which ailments it treats" — and again every one is in the schema and loaded.

*Both indexes are lists, not card grids, and the reason is stated because the
roster looks different.* The roster is a waiting room — eight peers, three
fields each, scanned side by side — and Phase 2 built it as the grid that
justified this project's first multi-column layout. The directory and catalog
are reference material: a reader arrives from a cross-link looking one entry
up, and a single column in reading order serves that without a grid's
geometry. It is also the cheaper layout to verify — the sweep in
[tech-stack.md](../tech-stack.md#responsive-design) covers a single column with
no column-count assertions — and a phase compressed for an MVP push spends its
verification where the risk is: the linking, not a second grid. Card treatment
for these pages, if anyone wants it, is Phase 8's design pass.

*Duration is prose, not a badge.* "45 minutes" next to the summary. A unit the
schema stores as an integer is rendered with its unit written out; no
formatting module is added for one multiplication-free string.

*Source:* [roadmap.md](../roadmap.md#phase-45--ailment-directory--therapy-catalog)
— the field list — with the single-column choice resting on the
responsive-design convention in
[tech-stack.md](../tech-stack.md#responsive-design) (the grid was Phase 2's
named risk, not a default this phase inherits) and the no-treatment boundary on
[roadmap.md](../roadmap.md#phase-8--polish-and-ship).

### D4 — The filter is eight prerendered routes, not a query string

`/therapies/for/[ailment]` renders "Therapies for {ailment}": every therapy
that treats the named ailment, via `listTherapiesForAilment()`, in the same
entry shape as the catalog. `generateStaticParams()` over `listAilments()`
builds one page per ailment. On `/therapies`, the filter is a labelled row of
links — one per ailment, each to its filtered page. The filtered page links
back to the full catalog and to the ailment's own entry.

*Rationale:* the roadmap asks to "filter the catalog by ailment", and the
obvious implementation — `/therapies?ailment=x` read from `searchParams` — is
the one thing this phase must not do. Reading `searchParams` opts a page into
request-time rendering, and the rendering strategy is pinned until Phase 6+7
decides otherwise:
[D12](../2026-08-17-the-four-nouns/requirements.md#d12--the-home-page-stays-statically-prerendered-and-phase-6-is-told-why)
assigned that decision, the MVP compression re-assigned it to the merged phase
by name, and D5 of the [Phase 2 validation](../2026-08-20-agent-roster/validation.md)
forbids the whole family of escape hatches. A filter whose every value is known
at build time — ailments are seed data — does not need a query string: eight
static pages are the same feature with the rendering strategy intact.

*This is also the page `listTherapiesForAilment()` was written for.* Phase 1
put the filtered read in `src/server/therapies.ts` with a docstring staking
"Phase 5's exit criterion" on it. The alternative — pointing the filter links
at each ailment's entry, whose "Treated by" section lists the same therapies —
was considered and rejected: it satisfies the exit criterion but not the
bullet, since an ailment's entry is the directory's page, not the catalog
filtered; and it would leave a query that Phase 1's own rule ("no query no
named later phase asked for") justified by this feature permanently uncalled —
a contradiction between two written sources, resolved by building the page
rather than by explaining it away.

*Boundary:* links, not controls. No `<select>`, no client state, no
`"use client"`. The "filter" is the reader clicking an ailment, which is what a
filter is when every value is enumerable and the page is static.

*Source:* [roadmap.md](../roadmap.md#phase-45--ailment-directory--therapy-catalog)
— "Filter the catalog by ailment" — with the mechanism forced by
[D12](../2026-08-17-the-four-nouns/requirements.md#d12--the-home-page-stays-statically-prerendered-and-phase-6-is-told-why)
and D5 of the [Phase 2 validation](../2026-08-20-agent-roster/validation.md),
and the query provenance in D9 of the
[Phase 1 requirements](../2026-08-17-the-four-nouns/requirements.md).

### D5 — Every rendering of a noun's name becomes a link, including the two that have been waiting

The cross-link wiring, in full:

- **Case file → directory.** The ailment name on each diagnosis row links to
  `/ailments/[id]`.
- **Case file → catalog.** The therapy name on each appointment row links to
  `/therapies/[id]`.
- **Roster → directory.** Each ailment badge on a roster card links to its
  ailment's entry.
- **Directory → case files and catalog.** D2's patient and therapy entries.
- **Catalog → directory.** D3's treats entries, and D4's filter links.

After this phase, every place the product writes an agent's, ailment's, or
therapy's name, the name is a link to that thing's page — with two deliberate
exceptions: a page does not link to itself, and the home page's notice board
stays linkless because `/` belongs to Phase 6+7.

*Rationale:* the roadmap's own words — "Cross-links wired both ways with Phase
3, and both ways between the two halves of this phase" — and its exit
criterion is nothing but navigation. The roster badges are the case that needs
saying: the roster is Phase 2's page and the roadmap does not name it. But the
badge is the same fact as the case file's diagnosis row — this agent presents
this ailment — and Phase 3's D5 explicitly kept the "badges link nowhere" rule
alive *"until Phase 4"*, its consequence paragraph scheduling the question
here. Leaving the roster the one page whose ailment names are dead text would
be an inconsistency each later reader has to be told is deliberate, and nobody
decided it.

*The badge stays a badge.* `Badge` already ships `asChild`, so the link takes
the badge's shape without a new primitive or a new class. The hover treatment
is whatever the vendored variant already does for links — the primitive's
authors got there first (`[a]:hover:` rules are in the shipped CSS).

*Consequence: two Phase 2/3 tests are rewritten, not deleted.* The roster spec
asserts eight links in `<main>` and "the badges link nowhere"; both halves of
that were correct while `/ailments/[id]` did not exist and are now wrong. The
assertion becomes: every badge links to its own ailment's entry, every card
title to its patient, and nothing else links. The docstrings in `AgentCard`,
`DiagnosisList`, and `AppointmentList` that cite "Phase 4" or "Phase 5" as the
reason a name is not a link are updated in the same commits — a stale
docstring in a teaching repo sends the next reader to the wrong spec, and the
Phase 2 and 3 walks each had to fix one.

*Boundary:* names link; prose does not. No links inside descriptions, intake
notes, or clinical asides, no "see also", and no link the reader cannot
predict the destination of from the text alone.

*Source:* [roadmap.md](../roadmap.md#phase-45--ailment-directory--therapy-catalog)
— the cross-link bullet and the exit criterion — with the roster-badge half
resting on D5 in the
[Phase 3 requirements](../2026-08-20-agent-case-file/requirements.md), whose
consequence paragraph kept the badge rule live "until Phase 4" by name, and
Phase 0's no-dead-links rule (D5 in the
[Phase 0 requirements](../2026-08-16-walking-skeleton/requirements.md)) now
satisfied in every direction it points.

### D6 — All five routes are prerendered, which on the three dynamic segments is work

`/ailments` and `/therapies` prerender the way every static route here does.
`/ailments/[id]`, `/therapies/[id]`, and `/therapies/for/[ailment]` each export
`generateStaticParams()` — over the ailments, the therapies, and the ailments
again respectively — and leave `dynamicParams` at its default, exactly as
Phase 3's D3 settled for `/agents/[id]` and for the same reasons: without the
export the segment renders on demand (a rendering-strategy change one phase
before the phase that owns the decision), and with `dynamicParams = false` the
in-voice 404 never renders (measured in Phase 3, not predicted).

*Verified, not assumed:* the build output must list all three segments as
prerendered — eight, six, and eight paths — and the validation walk reads that
line (C3). Phase 3's A8 note stands: a dynamic segment that loses its
`generateStaticParams()` does not fail, it silently changes strategy, and the
build table is the only place that shows it.

*Consequence, inherited rather than new:* a condition or therapy added after
the build renders on demand while every list that should name it is stale.
That is D12's incoherence, unchanged, and Phase 6+7's rendering decision now
has five more routes in view when it settles.

*Source:* the rendering-strategy pin restated in [roadmap.md](../roadmap.md#phase-67--booking--clinic-dashboard)
— the decision belongs to Phase 6+7, per
[D12](../2026-08-17-the-four-nouns/requirements.md#d12--the-home-page-stays-statically-prerendered-and-phase-6-is-told-why)
— applied through the settled pattern, measurement included, of D3 in the
[Phase 3 requirements](../2026-08-20-agent-case-file/requirements.md).

### D7 — An unknown ailment and an unknown therapy get the clinic's own 404

`getAilment()` null → `notFound()` → `src/app/ailments/[id]/not-found.tsx`:
*"No such ailment. The clinic has consulted its own literature, which it also
wrote, and found nothing by that name."* `getTherapy()` null → the same
mechanism → *"No such therapy. Whatever it involves, the clinic does not offer
it. The waiting list is therefore short."* The filter route's miss is an
unknown *ailment*, so `/therapies/for/[ailment]/not-found.tsx` re-exports the
ailment one rather than inventing a third voice for the same fact. All three
render inside the root layout — masthead, footer, nav intact.

*Rationale:* the roadmap asked for an in-voice 404 only in Phase 3, but the
requirement here does not rest on stretching that clause: the mission's tone
section is constitutional — "Error messages and empty states are in-world" —
and a 404 is the error message these routes have. Next's default page on an
unknown ailment, one segment away from a clinic that answers an unknown
patient in voice, would be the coat of paint failing exactly where
[mission.md](../mission.md#premise) says the framing must not.

*The status code is inherited as measured, not re-litigated.* Phase 3
measured HTTP 200 on a segment-level not-found under this exact configuration,
the owner accepted it, and Phase 8 owns the settlement. These routes add
themselves to what Phase 8 inherits; the walk re-measures one of them (A9) so
the record covers the new segments, and a *different* number would be a
finding, not a pass.

*Boundary:* a message, not a search. No "did you mean", no directory embedded
in the 404. The header now carries three ways onward.

*Source:* [mission.md](../mission.md#tone) — "Error messages and empty states
are in-world" — with the mechanism and the status-code trade from D4 in the
[Phase 3 requirements](../2026-08-20-agent-case-file/requirements.md).

### D8 — Six empty states, none reachable from the seed, each rendered by a test

| Where | When | Copy |
| --- | --- | --- |
| `/ailments` | no ailments at all | "No conditions on the books. The agents are all fine, which nobody who works here believes." |
| `/therapies` | no therapies at all | "Nothing on offer yet. The clinic is, for the moment, purely diagnostic." |
| Ailment entry | no symptoms | "No symptoms on record. It presents quietly, or not at all." |
| Ailment entry | nobody presents with it | "Nobody on the books presents with this. The clinic keeps the file open anyway." |
| Ailment entry / filtered catalog | no therapy treats it | "No known therapy. The clinic offers sympathy, and a chair in the quiet room." |
| Therapy entry | treats no recognised ailment | "Treats nothing the clinic currently recognises. It remains popular." |

*Rationale:* Phase 2's D5 and Phase 3's D9, applied to the new pages. The seed
diagnoses every ailment, treats every ailment, gives every ailment symptoms,
and points every therapy at at least one ailment — so none of these six
renders in a demo, a screenshot, or the Playwright run, which is exactly how
an empty state ships broken. Each list is a component with a prop rather than
a branch in a page, and each empty branch has a unit test that renders it —
Phase 2's C9 standard: ticking an empty state by reading the JSX does not
count.

*The fifth row is one string on purpose.* The ailment entry's "Treated by"
section and the filtered catalog state the same fact — nothing treats this —
and two phrasings of one fact would drift. One component renders both (plan,
group 3).

*Boundary:* messages, not calls to action. Nothing here admits, diagnoses, or
books.

*Source:* [mission.md](../mission.md#tone) for the register, with the
pattern and the evidence standard from D9 in the
[Phase 3 requirements](../2026-08-20-agent-case-file/requirements.md) and D5
in the [Phase 2 requirements](../2026-08-20-agent-roster/requirements.md).

### D9 — The header gains two links, and this is the day the nav learns to wrap

**Ailments** and **Therapies** join **Patients** in the header nav, same type
scale, in that order after the masthead. The header's row becomes
wrap-tolerant: `flex-wrap` on the nav (and on the row that holds it), so that
at widths where four words no longer share a line, the nav takes a second
line. Nothing else changes — no nav bar treatment, no mobile menu, no
active-state styling, no icon.

*Measured on 2026-08-20, and the first draft of this decision was wrong about
the failure mode.* The masthead and three labels need ~338px of row where
320px exists, so the wrap engages and the nav sits on its own line at phone
width — that much held. But the draft claimed the wrap prevented "a sideways
scroll", and removing `flex-wrap` was measured to leave the overflow sweep
**green**: the unwrapped nav shrinks into the right gutter (the last label
runs to 314px against a 296px gutter line) and never reaches the viewport
edge, so the document never scrolls. What the wrap actually buys is the
gutter — banner links held to the same `px-6` the body content respects — and
since the sweep cannot fail on that, the suite carries a dedicated check that
was itself verified by the same mutation: red with the wrap removed, green
with it back (C23).

*Rationale:* the 2026-08-20 header decision in
[mission.md](../mission.md#owner-decisions) is explicit twice over: "each later
phase adds its own link the same way", which is the two links; and "the day
the list stops fitting at 320px it becomes a design decision with a spec
behind it", which is the wrap. This is that day — four labels in the existing
scale exceed 320 minus the gutters — and this spec is the spec. Wrapping is
the smallest decision that keeps the register entry's own constraints: the
existing type scale, no menu, and a layout the sweep can verify. A hamburger,
a smaller font, or abbreviated labels would each be a design treatment, and
treatment is Phase 8's.

*Labels are clinic vocabulary, and this pair needs no translation.* "Patients"
translated `/agents` into the receptionist's word; **Ailments** and
**Therapies** already are the receptionist's words — the naming rule made the
domain language the schema, so route, model, and label agree.

*The case-file rule still holds.* Phase 3 added no link because a case file is
somewhere you arrive, not somewhere you navigate to; the directory and catalog
are destinations in exactly the way the roster is. Same rule, different
answer, third phase running.

*Source:* owner decision, 2026-08-20 ("The clinic header carries navigation…"),
registered in [mission.md](../mission.md#owner-decisions) — both the
each-phase-adds-its-link clause and the stops-fitting-at-320px clause — with
the wrap verified under the responsive convention in
[tech-stack.md](../tech-stack.md#responsive-design).

### D10 — Titles name the pages, per the register

- `/ailments` → "Ailments — AgentClinic"; `/therapies` → "Therapies —
  AgentClinic".
- An ailment's entry → "{name} — AgentClinic"; a therapy's → the same; the
  filtered catalog → "Therapies for {name} — AgentClinic".
- The misses → "No such ailment — AgentClinic" and "No such therapy —
  AgentClinic".

*Rationale:* the 2026-08-20 owner decision — "a page's title names the page" —
binds every route after `/agents` explicitly. Dynamic segments use
`generateMetadata()` with the same `cache()`-wrapped read as the page, the
pattern Phase 3 set so the build does not query twice.

*Boundary:* a title and nothing else. The full metadata pass is Phase 8's.

*Source:* owner decision, 2026-08-20 ("A page's title names the page…"),
registered in [mission.md](../mission.md#owner-decisions), with the mechanism
from D12 in the
[Phase 3 requirements](../2026-08-20-agent-case-file/requirements.md).

### D11 — The severity badge moves to one component, because two pages now render it

`src/components/severity-badge.tsx` renders a severity as its word inside the
badge variant Phase 3 mapped (`MILD` → `outline`, `MODERATE` → `secondary`,
`SEVERE` → `destructive`). `DiagnosisList` and the ailment entry's patient list
both use it; the mapping stops being a private constant of one list.

*Rationale:* D2 puts the severity word-plus-variant on a second page. Copying
the mapping would be two places for one rule — the drift this project keeps
paying for — and importing one list's constant from another list couples two
components that share nothing else. A ten-line component is the boundary that
says the mapping is the product's, not the page's.

*Boundary:* the mapping itself is unchanged, word first and colour reinforcing,
and it still uses only variants the vendored primitive ships (Phase 3's D2
boundary carries over verbatim).

*Source:* the directory layout in [tech-stack.md](../tech-stack.md#conventions)
— `components/` holds shared UI — with the mapping itself owned by D2 in the
[Phase 3 requirements](../2026-08-20-agent-case-file/requirements.md).

### D12 — Nothing else is added

- **No third shadcn primitive.** `src/components/ui/` still holds exactly
  `card.tsx` and `badge.tsx`. The new pages are headings, prose, lists, and
  links; the badge's `asChild` covers the linked badges without a new file.
- **No `loading.tsx`.** Phase 2 measured what one is worth on a prerendered
  segment: no window in which it renders. Five more prerendered routes do not
  change the arithmetic.
- **No new formatter.** The duration renders as "{n} minutes" inline (D3);
  `clinic-date.ts` gains nothing because no new page shows a date.
- **No footer links.** The footer's docstring reasoning — a footer is where
  links collect — predates three phases of navigation and still holds; the
  header is the nav, per the register entry D9 extends.

*Rationale:* each is individually defensible and none was asked for, which is
the definition the provenance rule uses. Writing them down as declined is
cheaper than arguing them in review.

*Source:* [tech-stack.md](../tech-stack.md#requirement-provenance) — nothing
enters without a source — with D2 in the
[Phase 0 requirements](../2026-08-16-walking-skeleton/requirements.md) (the
primitive cap) and D6 in the
[Phase 2 requirements](../2026-08-20-agent-roster/requirements.md) (the
loading-state finding).

## Constraints inherited

From [tech-stack.md](../tech-stack.md), all still binding:

- **Server-first.** Nothing here needs `"use client"`. A filter made of links
  has no state.
- **Responsive design.** Fluid, mobile-first, Tailwind's default breakpoints,
  nothing overflowing at 320px, verified at both viewports. The new risks are
  the four-item header row (D9) and long clinical prose on the entry pages.
- **Clinic vocabulary everywhere.** `Ailment`, not "tag"; "Treated by", not
  "related items"; the section headings are what a receptionist would call
  them.
- **No branch on deploy target, no runtime filesystem writes, no network after
  `npm install`.**
- **No new dependency.** `dependencies`, `devDependencies`, and
  `package-lock.json` are unchanged.
- **No schema change.** `prisma/schema.prisma` and `prisma/migrations/` are
  byte-identical to `main`. The schema is closed until Phase 6+7's booking
  work says otherwise.
- **Rendering strategy unchanged.** Every route prerenders; on the three new
  dynamic segments that is D6's work.
- **Provenance.** Every decision above names its source, and
  `npm run check:provenance` fails if one stops doing so.
- **Changelog.** This branch touches `specs/` and `src/`, so it updates
  `CHANGELOG.md` before it merges.

## Open questions

None open at implementation time. Two calls in this spec are the kind earlier
phases put to the owner before writing code, and the manner of their settling
is recorded plainly rather than smoothed over: the owner's standing instruction
for this phase was to proceed, the questions were settled here by the written
sources each decision cites — the roster badges by Phase 3's D5 keeping the
badge rule alive "until Phase 4" by name (D5), the filter's shape by the
rendering-strategy pin plus the Phase 1 query docstring (D4) — and both are
flagged in the pull request for the owner to overrule before merge. Neither
installs a requirement on the product beyond this phase's pages, which is the
test Phase 2's Q1 and Phase 3's Q1 used for whether a register entry is
needed; if the owner's review turns either answer over, the correction lands
in this file the way Phase 3's review corrections did.

Ambiguity found during implementation goes to the backlog or reopens this
file, not into the code.
