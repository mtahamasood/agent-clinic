# Plan — Agent case file

Task groups for **Phase 3**. Scope and decisions live in
[requirements.md](requirements.md); the pass/fail bar lives in
[validation.md](validation.md).

Groups are ordered by dependency. Each one ends somewhere you could stop and
still have a coherent repo.

One group is gated on the owner's answers and is marked. Everything else can
proceed while those are outstanding — including the route itself, which needs
the two list components to exist but not to have settled their contents.

---

## 1. Settle the open questions

1.1 Put Q1 (the direction of the severity sort) and Q2 (the ailment summary)
    from [requirements.md](requirements.md#open-questions) to the owner, with
    the arguments as written. Both block group 3.
1.2 Neither answer installs a requirement on the product as a whole, so neither
    needs a [mission.md](../mission.md#owner-decisions) entry on its own — the
    same reasoning that kept Phase 2's Q1 out of the register. If the owner's
    answer arrives with a general rule attached ("the clinic always leads with
    the worst"), *that* is the entry, not the answer.
1.3 If Q1 comes back **worst first**, correct the two doc comments in
    `src/lib/severity.ts` in the same commit as the sort: "Mildest first.
    Reverse it for a triage list; a case file reads better this way" and
    "Sorts a case file worst-last" both name a page that now does the opposite.
    If it comes back **mildest first**, leave them and say in D6 that they were
    confirmed rather than untouched.
1.4 If Q2 comes back **yes**, amend D2 in place before the component is written,
    naming the field and where it sits in the entry.

**Ends with:** no decision left for the implementation to make by itself.

---

## 2. Dates

2.1 `src/lib/clinic-date.ts` — `formatClinicDate(date)` for a day and
    `formatClinicDateTime(date)` for a slot. `Intl.DateTimeFormat`, locale
    pinned to `en-GB`, no `timeZone` option (D8).
2.2 `src/lib/clinic-date.test.ts` — both functions against fixed instants
    constructed in local time, so the assertion does not move with the machine's
    zone. This is the file a format change should fail in.
2.3 Nothing else formats a date. If a component reaches for
    `toLocaleDateString()` directly, that is the module not being used.

**Ends with:** one place that decides how the clinic writes a date down.

---

## 3. The presenting-ailments list

**Gated on Q1 and Q2.**

3.1 `src/components/diagnosis-list.tsx` — a Server Component taking
    `getAgent()`'s `diagnoses` array. The prop type is derived from that return
    type, never re-declared: a field renamed in the schema must break
    `npm run typecheck` here (D1, and Phase 1's D9 on inferred types).
3.2 Sort with `compareSeverity()` in the direction Q1 settled, with an
    alphabetical tiebreak on the ailment name (D6). Sort a copy — the array
    comes from the query and mutating it in a component is the kind of bug that
    only shows up under concurrent rendering.
3.3 Each entry: ailment name, severity as a word via `severityLabel()`, the
    diagnosis date via `formatClinicDate()`, and `Diagnosis.notes` when present.
    The summary line only if Q2 said yes (D2).
3.4 The severity badge uses the vendored primitive's existing variants —
    `outline`, `secondary`, `destructive` — and adds no colour of its own (D2's
    boundary).
3.5 The empty branch renders "No diagnosis on file yet. The intake notes are all
    the clinic has to go on." in place of the list (D9).
3.6 No `<a>` and no `next/link`: `/ailments/[id]` is Phase 4 (out of scope).

**Ends with:** a list component that compiles and is used by nothing yet.

---

## 4. The appointments list

4.1 `src/components/appointment-list.tsx` — same shape, taking `getAgent()`'s
    `appointments` array, with the prop type derived the same way.
4.2 Split into upcoming and past against the current time, upcoming soonest
    first and past most recent first (D7). Take the current time once, at the
    top of the component, rather than calling `new Date()` inside a comparator.
4.3 Each entry: therapy name, the slot via `formatClinicDateTime()`, the status
    via `appointmentStatusLabel()`, and `Appointment.notes` when present.
4.4 Two sub-lists, two headings, one empty branch: when there are no
    appointments at all, "Never been seen. Registered, diagnosed, and left in
    the waiting room." A patient with only past appointments shows the past list
    alone, with no empty "Upcoming" heading over nothing (D9).
4.5 No `<a>` and no `next/link`: `/therapies/[id]` is Phase 5, and booking is
    Phase 6.

**Ends with:** both halves of the file's content exist as components with tests
still to come.

---

## 5. The route

5.1 `src/app/agents/[id]/page.tsx` — a Server Component awaiting `params`,
    calling `getAgent(id)` (D1). No `"use client"`, no new query.
5.2 `notFound()` when the query returns null (D4). This is the only branch in
    the page.
5.3 The profile: an `<h1>` carrying the patient's name — exactly one per page,
    as in all three closed phases — then model family, admission date via
    `formatClinicDate()`, and the intake notes in full (D2).
5.4 Two `<h2>` sections beneath it, rendering the components from groups 3 and
    4. The layout supplies `<main>` and the container, so this page supplies
    only its content and no width of its own.
5.5 `generateStaticParams()` returning `{ id }` per agent from `listAgents()`
    (D1, D3). No `dynamicParams` export and no route segment config of any kind.
5.6 `generateMetadata()` returning a title that names the patient — the same bar
    check C15 set for `/agents` in Phase 2. It calls `getAgent()` a second time
    at build time; that is accepted rather than fixed, because the fix is a
    change to `src/server/` on a branch whose claim is that it made none.
5.7 Read the build output: `/agents/[id]` must appear as prerendered with eight
    paths (D3). If it appears as dynamic, stop — that is the rendering-strategy
    change Phase 6 owns, arriving early.

**Ends with:** `npm run dev` opens a complete file for every seeded patient.

---

## 6. The 404

6.1 `src/app/agents/[id]/not-found.tsx` — the in-voice message from D4, inside
    the root layout so the header, footer, and container still frame it.
6.2 Confirm it renders for an id that does not exist, on the **production
    build** rather than `next dev`.
6.3 Measure the HTTP status the response actually carries and write the number
    into [validation.md](validation.md) (C6). Next's own reference says a
    `not-found.js` response is 200 when streamed and 404 when not; whichever it
    is here is a measurement. Do not assert a status the walk has not seen.

**Ends with:** a wrong URL reads like the clinic, and what it returns is known
rather than assumed.

---

## 7. The roster links through

7.1 `AgentCard`'s title becomes a `next/link` to `/agents/{agent.id}` (D5). The
    card is not wrapped; the badges are still not links.
7.2 Update the component's docstring. It currently says the card is "Not a link,
    deliberately" and cites Phase 0's D5 — a stale comment in a teaching repo
    sends the next reader to the wrong spec, and the Phase 2 walk already had to
    fix one of these.
7.3 Rewrite the "no card and no badge links anywhere" test in
    `tests/roster.spec.ts` rather than deleting it (D5): every card links to its
    own patient's file, and nothing else on the page links at all. The badge
    half of the rule is live until Phase 4.
7.4 Confirm the roster's grid geometry tests still select what they did —
    `ul > li > [data-slot='card']` is unchanged by a link inside the title, and
    if it is not, the DOM changed more than D5 authorised.

**Ends with:** roster → case file, by clicking, from a cold start.

---

## 8. Tests

8.1 `tests/case-file.spec.ts` — the happy path: from `/agents`, click a named
    seeded patient, land on their file, and find their model family, their
    intake notes, a diagnosis with its severity in words, and an appointment
    with its therapy and status. Assert on the seed's *relationships* and stable
    ids, not on prose that is meant to be edited, and not on a rendered date
    (D8).
8.2 The severity order (D6), asserted by reading the rendered order of a patient
    with three diagnoses at three severities — Bodhi — rather than by reading
    the sort function.
8.3 The upcoming/past split (D7), on a patient who has one of each. Atlas has a
    session today and another three days out; Roux and Percival have completed
    ones. Assert that a future booking appears under the upcoming heading and a
    completed one under the past heading, not that a particular date string
    renders.
8.4 The 404: `/agents/not-a-patient` renders the in-voice message inside the
    clinic's own header and footer. Assert the copy and the landmarks; the
    status code is group 6's measurement and belongs in validation, not in an
    assertion nobody has verified.
8.5 The landmarks on the new route: exactly one `<h1>`, and `banner` / `main` /
    `contentinfo` still supplied by the layout rather than the page.
8.6 Unit tests for both list components' empty branches (D9), rendered with
    `renderToStaticMarkup` against a real seeded agent with the relation
    emptied — the fixture pattern `agent-card.test.tsx` set in Phase 2.
8.7 Extend `tests/responsive.spec.ts` to sweep `/agents/atlas` as well as `/`
    and `/agents`. The route list is one constant; a phase that adds a route and
    not its entry there is a phase whose layout is unmeasured (Phase 2's C16).
8.8 Add the check the sweep cannot make on this page: at 320px, the intake
    notes, the clinical asides, and the appointment notes wrap rather than
    forcing the container wide. Long prose is this route's version of the risk
    the badge row was on the roster.
8.9 No new unit tests over `src/server/` — the queries are unchanged and Phase
    1's tests still cover them (D1). If one is needed here, that is a finding
    about Phase 1 worth writing down.

**Ends with:** the file, its ordering, its split, its 404, and its width are all
verified by something rather than asserted in prose.

---

## 9. Gates

9.1 `npm run check` clean — typecheck, lint, format, provenance, unit tests.
9.2 `npm run test:e2e` clean, against the production build, at both viewports.
9.3 Walk section A of [validation.md](validation.md) in a fresh clone, including
    the offline build. Use the tracked-task recipe in section A, not the
    foreground one, if an agent is running it — the Phase 2 walk stranded a
    server by taking the shortcut, and the recipe that does not is the one
    written down.
9.4 Green CI on the branch. Pushing alone produces no run; the pull request is
    what makes the check reachable.

**Ends with:** every gate in [tech-stack.md](../tech-stack.md#quality-gates)
passes with a third route on the map.

---

## 10. Documentation

10.1 Update the status blockquote in `README.md`: Phase 3, case files are open,
     the ailment directory is Phase 4.
10.2 The layout block in `README.md` and in
     [tech-stack.md](../tech-stack.md#conventions) is unchanged — `src/app/`
     already covers a nested route and no new directory appears. Confirm rather
     than assume; both maps were wrong once already.
10.3 `CHANGELOG.md` entry for the phase, per
     [tech-stack.md](../tech-stack.md#changelog). One bullet for the phase, with
     sub-bullets for the two owner answers, the 404's measured status code, and
     anything else the validation walk found.

**Ends with:** the README describes the repo that exists.

---

## 11. Close the phase

11.1 Walk [validation.md](validation.md) end to end and record the result in its
     Result section — the machine and Node version section A ran on, and the
     verdict, date, and author of the judgement check.
11.2 Confirm no scope leaked: no `/ailments`, no `/therapies`, no booking
     affordance, no site-wide 404, no third primitive, no design pass.
11.3 Open the PR. Record section A's result in the description.
11.4 Merge, and **keep the branch** — `phase-3-agent-case-file` joins the phase
     collection, per [tech-stack.md](../tech-stack.md#branch-retention). Do not
     pass `--delete-branch`.
