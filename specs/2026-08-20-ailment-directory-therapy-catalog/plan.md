# Plan — Ailment directory & therapy catalog

Task groups for **Phase 4+5**. Scope and decisions live in
[requirements.md](requirements.md); the pass/fail bar lives in
[validation.md](validation.md).

Groups are ordered by dependency. Each one ends somewhere you could stop and
still have a coherent repo — in particular, the two halves land as the roadmap
merged them: no group ships a link to a page a later group builds, because the
pages come first and the links come last.

---

## 1. The shared severity badge

1.1 `src/components/severity-badge.tsx` — the word via `severityLabel()`
    inside the variant mapping lifted from `DiagnosisList` (D11). Prop is the
    `Severity` enum value, nothing wider.
1.2 `DiagnosisList` uses it; its private `SEVERITY_VARIANT` constant is
    deleted. Rendered output is unchanged — the existing case-file tests are
    the check.

**Ends with:** one place that decides what a severity looks like.

---

## 2. The list components

Each is a Server Component with a prop typed from the query it renders (the
Phase 1 D9 inference rule: rename a column, break `npm run typecheck` here),
an empty branch carrying its D8 copy, and a unit test that renders both
branches — the `agent-card.test.tsx` fixture pattern, real seeded rows from
the suite's own database.

2.1 `src/components/symptom-list.tsx` — `getAilment()`'s `symptoms`, rendered
    in the `position` order the query already applies; the component does not
    re-sort what the schema made data (D2).
2.2 `src/components/presenting-patients.tsx` — `getAilment()`'s `diagnoses`
    with their agents. Alphabetical by patient name via `compareNames` —
    sorted on a copy, as everywhere. Each entry: the name as a link to
    `/agents/{id}`, and `SeverityBadge` beside it (D2).
2.3 `src/components/therapy-list.tsx` — an array of therapies (the shape
    `listTherapies()`, `listTherapiesForAilment()`, and `getAilment()`'s
    `therapies` all share): name linking to `/therapies/{id}`, summary,
    "{durationMinutes} minutes". Takes its empty-state copy as a prop, because
    D8 pins one string for the treats-nothing fact and the two catalog pages
    have their own (D3, D8).
2.4 `src/components/ailment-list.tsx` — an array of ailments: name linking to
    `/ailments/{id}`, summary. Same prop-for-copy shape (used by the directory
    index and the therapy entry's "Treats" section).

**Ends with:** every list the five pages need, compiling, used by nothing yet.

---

## 3. The directory

3.1 `src/app/ailments/page.tsx` — `listAilments()`, `<h1>` in voice, intro
    line, `AilmentList` with the directory's D8 empty copy. Title "Ailments —
    AgentClinic" (D10). The layout supplies `<main>` and the container.
3.2 `src/app/ailments/[id]/page.tsx` — `cache(getAilment)` shared by page and
    metadata (the Phase 3 dedup pattern), `generateStaticParams()` over
    `listAilments()`, `dynamicParams` untouched (D6). Sections in D2's order:
    write-up, symptoms, patients presenting, treated by.
3.3 `src/app/ailments/[id]/not-found.tsx` — D7's ailment copy, inside the
    root layout.

**Ends with:** `npm run dev` shows every seeded condition, and an unknown one
answers in voice.

---

## 4. The catalog

4.1 `src/app/therapies/page.tsx` — `listTherapies()`, the filter row (a
    labelled list of ailment links to `/therapies/for/{id}` — which needs
    `listAilments()`, a read the directory index already renders, not a new
    query), then `TherapyList` with the catalog's D8 empty copy (D3, D4).
4.2 `src/app/therapies/[id]/page.tsx` — `cache(getTherapy)`, params from
    `listTherapies()`, write-up then "Treats" via `AilmentList` (D3).
4.3 `src/app/therapies/[id]/not-found.tsx` — D7's therapy copy.
4.4 `src/app/therapies/for/[ailment]/page.tsx` — `cache(getAilment)` for the
    name and the miss, `listTherapiesForAilment()` for the rows, params from
    `listAilments()`. Intro links to the ailment's entry; a "Full catalog"
    link goes back to `/therapies` (D4).
4.5 `src/app/therapies/for/[ailment]/not-found.tsx` — re-exports the ailment
    not-found (D7): same miss, same sentence, one file that owns it.

**Ends with:** the catalog, its entries, and the filter, all static — check
the build table now rather than at the walk (D6).

---

## 5. The cross-links land

Deliberately after groups 3 and 4: every href below points at a page that now
exists, so Phase 0's D5 is never violated mid-branch.

5.1 `DiagnosisList`: the ailment name becomes a link to its entry. Docstring
    updated — it currently promises no links "until Phase 4" (D5).
5.2 `AppointmentList`: the therapy name becomes a link to its entry. Same
    docstring debt, same commit.
5.3 `AgentCard`: each badge becomes a link via `Badge asChild` + `next/link`
    (D5). The docstring paragraph explaining why badges are not links is
    replaced by one explaining where they go.
5.4 `ClinicHeader`: **Ailments** and **Therapies** after **Patients**;
    `flex-wrap` on the row and the nav so 320px wraps instead of scrolling
    (D9). The docstring's "deliberately one link" paragraph is rewritten —
    it describes two phases ago.

**Ends with:** the four nouns are a web; no name is dead text anywhere but
prose.

---

## 6. Tests

6.1 `tests/ailments.spec.ts` — the directory lists all eight with summaries;
    an entry (Chronic Context Loss) carries description, symptoms in seeded
    position order, its presenting patients with each one's own severity
    scoped to its row (Atlas Severe, Wren Moderate, Nim Mild — the seed's one
    ailment with three severities), and Context Window Hygiene under "Treated
    by"; clicking a patient lands on their case file; clicking the therapy
    lands on its entry; the 404 in voice inside the clinic's landmarks; title
    checks; exactly one `<h1>`.
6.2 `tests/therapies.spec.ts` — the catalog lists all six with durations; an
    entry (Peer Review Circle) carries description, "90 minutes", and its
    three treated ailments linking to the directory; the filter row lists all
    eight ailments; `/therapies/for/tool-call-tremor` lists exactly
    Exponential Backoff Breathing and Structured Output Conditioning and not
    the other four — the *not* half is what distinguishes a filter from a
    copy of the catalog; the 404 in voice; titles; one `<h1>`.
6.3 Rewrite the roster spec's link test (D5): every badge links to its own
    ailment's entry (Atlas's Chronic Context Loss badge → that route), card
    titles still link to patients, and the link count in `<main>` is exactly
    cards + badges so nothing else linked. Rewrite, don't delete — the
    "nothing else links" half is still live.
6.4 Case-file additions: Atlas's Chronic Context Loss diagnosis links to the
    ailment's entry and his appointment's therapy links to its catalog page —
    asserted as hrefs on the rendered rows, then one click-through each way.
6.5 Header: the nav reaches `/ailments` and `/therapies` from `/`, alongside
    the existing Patients test.
6.6 `tests/responsive.spec.ts` — extend `ROUTES` with `/ailments`,
    `/ailments/chronic-context-loss`, `/therapies`,
    `/therapies/peer-review-circle`, and `/therapies/for/tool-call-tremor`
    (seeded ids, per the constant's own comment). The sweep's overflow checks
    are what verify D9's wrap at 320px; the long-prose check stays on the
    case file, and the entry pages' prose is covered by the same sweep that
    caught it there.
6.7 Unit tests (group 2's, listed here as the bar): both branches of all four
    list components rendered via `renderToStaticMarkup` — populated from
    seeded rows, empty with the exact D8 copy — and `severity-badge` mapping
    all three severities to the Phase 3 variants.
6.8 No new tests over `src/server/` — the queries are unchanged and Phase 1's
    suite covers them, including the filter query (D1). If one is needed,
    that is a finding about Phase 1 worth writing down.

**Ends with:** the two halves, their cross-links, the filter's *exclusions*,
and every new route's width all verified by something that can fail.

---

## 7. Gates

7.1 `npm run check` clean — typecheck, lint, format, provenance, unit tests.
7.2 `npm run test:e2e` clean against the production build, both viewports.
7.3 Walk section A of [validation.md](validation.md) in a fresh clone,
    including the offline build, with servers as tracked tasks per
    `.claude/skills/local-server` — the Phase 2 lesson, now twice written
    down.
7.4 Green CI on the pull request — pushing alone produces no run.

**Ends with:** every gate in [tech-stack.md](../tech-stack.md#quality-gates)
passing with eight routes on the map.

---

## 8. Documentation

8.1 `README.md` status blockquote: Phase 4+5 — the directory and catalog are
    open and cross-linked; booking and the dashboard are Phase 6+7.
8.2 Layout maps in `README.md` and `tech-stack.md`: confirm unchanged —
    `src/app/` already covers nested routes. Confirm, don't assume; both maps
    have been wrong once.
8.3 `CHANGELOG.md`: one bullet for the phase, sub-bullets for whatever the
    walk finds worth keeping.

**Ends with:** the README describes the repo that exists.

---

## 9. Close the phase

9.1 Walk [validation.md](validation.md) end to end; record the result, the
    machine, and the Node version in its Result section.
9.2 Confirm no scope leaked: nothing writes, `/` untouched, no site-wide 404,
    no third primitive, no search input, no design pass.
9.3 Open the PR; record section A's result in the description, and flag D4
    and D5's roster-badge call for the owner per the open-questions note.
9.4 The judgement check (C22) awaits the owner's verdict on the evidence its
    row names; it is the one row this branch cannot tick itself.
9.5 Merge on green with the branch **kept** — `phase-4-5-…` joins the phase
    collection ([tech-stack.md](../tech-stack.md#branch-retention)).

