# Validation — Ailment directory & therapy catalog

How we know **Phase 4+5** is done. Every check below is binary. A phase is
done or it isn't — no "mostly".

Scope is in [requirements.md](requirements.md); the work is in
[plan.md](plan.md).

The standing lesson from Phase 3 applies to every row here: a check is not
finished when it is written, it is finished when it has been seen to fail.
New checks whose failure is cheap to stage are staged (the mutation named in
the row); the rest lean on assertions that name seeded relationships, which a
deleted feature cannot satisfy.

---

## A. The clean-clone run

Same discipline as every phase, still the check most easily faked by a warm
working directory. Run it in a **fresh clone in a new directory**.

| # | Step | Passes when |
| --- | --- | --- |
| A1 | `git clone <repo> && cd` into it | — |
| A2 | `npm install` | Completes with no manual step and no prompt |
| A3 | Copy `.env.example` to `.env` | Unchanged since Phase 0 |
| A4 | `npm test` before anything else | Passes on a bare clone; still leaves `clinic.db` uncreated |
| A5 | `npm run migrate` | Applies cleanly. **No new migration this phase** — `prisma/migrations/` is byte-identical to `main` |
| A6 | `npm run seed` | Populates the full clinic (the day-crossing defect stands, per the 2026-08-20 owner decision — Phase 6+7's to fix; a fresh clone does not reach it) |
| A7 | `npm run dev` | The directory, the catalog, an entry of each, and the filter all render seed data; roster and case files carry their new links |
| A8 | Stop dev; `npm run build && npm start` | Same content from the production build. The build table lists `/ailments/[id]` with **8** paths, `/therapies/[id]` with **6**, and `/therapies/for/[ailment]` with **8**, all prerendered (C3) |
| A9 | On the production build, request `/ailments/not-an-ailment` and `/therapies/not-a-therapy` | Both render their in-voice copy inside the clinic's landmarks. **Record the HTTP status each carried** — Phase 3 measured 200 on this configuration; a different number here is a finding (D7) |
| A10 | Disconnect the network, repeat A8 | Still works; install remains the only step that touches the registry |

A8's build table is not a formality, for the reason Phase 3 recorded: a
dynamic segment that loses `generateStaticParams()` does not fail, it silently
starts rendering on demand, and the table is the only place that shows it —
now on three segments instead of one.

Reproduce A10 on Linux in a network namespace with only loopback, confirming
the namespace is offline **first** (`curl https://registry.npmjs.org` inside
it must fail) and `rm -rf .next` before the build. Servers start as tracked
tasks wrapped so the process group dies with the task, per
`.claude/skills/local-server`; a stranded process is the failure the recipe
exists to prevent. Assert on content the database put there — a therapy's
duration on its entry, a patient's name on an ailment's page — not on element
counts.

---

## B. Quality gates

Inherited by every phase from [tech-stack.md](../tech-stack.md#quality-gates).

| # | Check | Passes when |
| --- | --- | --- |
| B1 | `npm run typecheck` | Clean; every new component's prop type is derived from a query's return type, none hand-written |
| B2 | ESLint | Clean |
| B3 | `prettier --check .` | Clean |
| B4 | Vitest | Every unit test passes, including both branches of all four new list components and the severity badge |
| B5 | Playwright | The whole suite passes against the production build at **both** viewports — every earlier phase's specs plus this phase's |
| B6 | `npm run check:provenance` | Every decision record in this spec names its source |
| B7 | `npm run check:changelog` | This branch touched `specs/` and `src/`, and `CHANGELOG.md` with them |
| B8 | CI | A green run on the pull request, executing B1–B7 |

---

## C. Phase-specific correctness

### The directory

| # | Check | Passes when |
| --- | --- | --- |
| C1 | Every ailment has an entry | All eight seeded ids open a page carrying that ailment's own description — checked across all eight, since the cross-link exit criterion is any-ailment, not the one a test picked |
| C2 | The entry is complete | Name, summary, description, symptoms in seeded `position` order, patients presenting, treated by (D2) |
| C3 | All five routes prerender | The build table: `/ailments` and `/therapies` static; the three dynamic segments SSG with 8, 6, and 8 paths. Read from the build output, not inferred (D6) |
| C4 | No new data access | `git diff main -- src/server/` is empty (D1) |
| C5 | Severity is the patient's own | On Chronic Context Loss: Atlas reads Severe, Wren Moderate, Nim Mild — each scoped to its own row, because three right words against three wrong patients would satisfy an unscoped assertion (D2) |
| C6 | Patients read alphabetically | Atlas, Nim, Wren — the seeded order of arrival is 52/14/1 days ago, so query order (insertion) differs from rendered order and the sort is observable (D2) |
| C7 | The misses read in voice | `/ailments/not-an-ailment` and `/therapies/not-a-therapy` render their D7 copy inside the root layout's landmarks, on the production build, status recorded in A9 |

### The catalog and the filter

| # | Check | Passes when |
| --- | --- | --- |
| C8 | Every therapy has an entry | All six seeded ids open a page carrying that therapy's description and duration |
| C9 | The entry is complete | Name, summary, duration as "{n} minutes", description, treated ailments with summaries (D3) |
| C10 | The filter row is complete | `/therapies` lists all eight ailments as links to their filtered pages (D4) |
| C11 | The filter filters | `/therapies/for/tool-call-tremor` lists Exponential Backoff Breathing and Structured Output Conditioning **and none of the other four** — the exclusion is the feature; an assertion without it passes on an unfiltered copy of the catalog (D4) |
| C12 | The filter is complete | For each of the eight ailments, the filtered page lists exactly the therapies whose seed `treats` names it — the docstring's "returning everything, not the first few" claim, checked against the seed rather than the query (D1, D4) |
| C13 | The filtered miss is the ailment's | `/therapies/for/not-an-ailment` renders the *ailment* 404 copy, not the therapy one (D7) |

### The cross-links

| # | Check | Passes when |
| --- | --- | --- |
| C14 | Case file → directory | A diagnosis row's ailment name links to that ailment's entry, and clicking it lands there (D5) |
| C15 | Case file → catalog | An appointment row's therapy name links to that therapy's entry (D5) |
| C16 | Roster → directory | Every badge links to its own ailment's entry; card titles still link to patients; the count of links in `<main>` equals cards plus badges, so nothing else linked (D5) |
| C17 | Directory → case files and catalog | An ailment entry's patient names reach case files and its therapy names reach the catalog, by clicking (D2, D5) |
| C18 | Catalog → directory | A therapy entry's ailment names reach the directory (D3, D5) |
| C19 | No dead links | Every link in the repo resolves to a route that exists — Phase 0's D5, five phases running, now pointing every direction it can |
| C20 | Prose stays prose | No link inside a description, intake note, or clinical aside (D5's boundary) |

### The states and the chrome

| # | Check | Passes when |
| --- | --- | --- |
| C21 | Six empty states render in voice | Each of D8's six, verified by a unit test that renders the component (or, for the two index pages, the page's list component) empty with the exact pinned copy — never by reading JSX (D8) |
| C22 | Judgement: the reference reads as a reference | **Evidence:** the production build at a 393px viewport: `/ailments`, the Chronic Context Loss entry, `/therapies`, the Peer Review Circle entry, and `/therapies/for/tool-call-tremor`. **Procedure:** open all five, read each top to bottom, follow one cross-link from each. **Passes when** each entry reads as one thing described — the reader can say who presents with the condition and what treats it (or what a therapy involves and what it treats) without scrolling back up, the filter page is recognisably the catalog narrowed rather than a new kind of page, and nothing is clipped or crowded. A judgement, not a measurement — recorded with who made it and when |
| C23 | Header nav is complete and wraps | Patients, Ailments, Therapies all reachable from the banner on every route; at 320px the header wraps rather than scrolls — the sweep's overflow check is the measurement, this row is the click-through (D9) |
| C24 | Titles name the pages | All five new routes and both misses, per D10, asserted in the new specs |
| C25 | Landmarks hold on every new route | Exactly one `<h1>`; `banner`, `main`, `contentinfo` from the root layout |
| C26 | Still a Server Component | No `"use client"` anywhere in the repo |
| C27 | No primitive was added | `src/components/ui/` still holds exactly `card.tsx` and `badge.tsx`; the linked badges use the `asChild` the primitive already ships (D12) |

### Responsive

| # | Check | Passes when |
| --- | --- | --- |
| C28 | No sideways overflow | The width sweep passes at 320, 480, 640, 1024, and 1536px on all five new routes as well as the existing three (plan 6.6) — this is also D9's wrap, measured |
| C29 | No bespoke breakpoint | The Phase 2 grep for breakpoint prefixes and fixed widths still returns nothing outside `ui/` |

C22 is the human half of the exit criterion, written to the
[judgement-check rule](../tech-stack.md#judgement-checks): evidence, procedure,
pass condition, and a recorded verdict.

---

## D. Parity and constraints

| # | Check | Passes when |
| --- | --- | --- |
| D1 | No deploy-target branching | The Phase 2 grep still returns nothing meaningful |
| D2 | No runtime filesystem writes | Nothing outside Prisma writes at request time |
| D3 | No new dependency | `dependencies`, `devDependencies`, `package-lock.json` unchanged; no script changed either, this phase |
| D4 | No schema change | `prisma/schema.prisma` and `prisma/migrations/` byte-identical to `main` |
| D5 | Rendering strategy unchanged | Every route prerenders; no `dynamic`, no `revalidate`, no `no-store`, no `dynamicParams` export, and **no `searchParams` read anywhere** — the last is this phase's specific temptation and D4 says why it is refused |
| D6 | Nothing writes | No Server Action, no form, no mutation. Booking is next phase |
| D7 | README honesty | Every command in the README ran during A1–A10 as documented, with the standing seed exception the 2026-08-20 owner decision accepts |

---

## E. Not-done conditions

Explicit disqualifiers. Any one of these means the phase is not finished,
regardless of how green the tests are.

- A booking affordance appeared — a button, a form, a Server Action, or a
  Server Action import.
- `/` changed at all: `git diff main -- src/app/page.tsx` is non-empty.
- `searchParams` is read anywhere, or any route renders on demand.
- A site-wide `not-found.tsx` landed — the misses here are segment-scoped,
  like Phase 3's; the whole-site page is Phase 8's.
- The filter page for any ailment omits a therapy whose seed `treats` names
  that ailment, or C11's exclusion half is missing from the suite.
- A link points into prose, or any noun's name on the new pages is dead text.
- The roster's link test was deleted rather than rewritten, or its
  nothing-else-links half was dropped.
- A third shadcn primitive, any dependency, or any schema change arrived.
- A bespoke breakpoint, a fixed pixel width, or a header treatment beyond
  `flex-wrap` entered the styling.
- The responsive sweep does not visit all five new routes.
- Any empty state is ticked by reading JSX rather than rendering it, or its
  rendered copy differs from D8's pinned string.
- A docstring still gives "Phase 4" or "Phase 5" as the reason a name is not
  a link (plan 5.1–5.4 name the four).
- `"use client"` appears anywhere.
- A design pass happened.
- `strict: true` is off, or an `any` is uncommented.

---

## Merge criteria

Merge when **A1–A10, B1–B8, C1–C29, and D1–D7 all pass, and no condition in E
holds** — C22 with the owner's recorded verdict.

Record section A's result in the PR description, with the machine and Node
version. Merge with the branch **kept**, per
[branch retention](../tech-stack.md#branch-retention).

## Result

*To be completed by the validation walk.*
