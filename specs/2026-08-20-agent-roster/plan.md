# Plan — Agent roster

Task groups for **Phase 2**. Scope and decisions live in
[requirements.md](requirements.md); the pass/fail bar lives in
[validation.md](validation.md).

Groups are ordered by dependency. Each one ends somewhere you could stop and
still have a coherent repo — no exceptions this time; Phase 1's group 1 was a
deletion that could not be half-finished, and this phase deletes nothing.

Two groups are gated on an owner answer, and both are marked. Everything else
can proceed while those are outstanding.

---

## 1. Settle the open questions

1.1 Put Q1 (container width) and Q2 (the header link) from
    [requirements.md](requirements.md#open-questions) to the owner, with the
    costs as written. Q1 blocks group 4; Q2 blocks group 6.
1.2 Record either answer as a dated entry in
    [mission.md](../mission.md#owner-decisions) — both are layout or navigation
    requirements with no stakeholder behind them, which is exactly what that
    register is for. Q2's answer needs no entry if it is *no*, since declining
    to add a link installs no requirement.
1.3 If Q1 comes back *widen*, amend D4 in place before any code is written, and
    say in the same edit which utility replaces `max-w-2xl` and that
    `tests/responsive.spec.ts` changes with it.

**Ends with:** no decision left for the implementation to make by itself.

---

## 2. The second primitive

2.1 `npx shadcn add badge`. Confirm it writes exactly
    `src/components/ui/badge.tsx` and touches nothing else — in particular that
    `package.json` and `src/app/globals.css` are unchanged (D7).
2.2 Read the generated file before committing it. It is ours now, the same way
    `card.tsx` is, and a primitive nobody read is a dependency with extra steps.

**Ends with:** `src/components/ui/` holds `card.tsx` and `badge.tsx`, and
nothing else.

---

## 3. The roster card

3.1 `src/components/agent-card.tsx` — a Server Component taking one element of
    `listAgents()`'s return type. The prop type is derived from that return
    type, never re-declared: a field renamed in the schema must break
    `npm run typecheck` here (D1, and Phase 1's D9 on inferred types).
3.2 Render name, model family, and one badge per presenting ailment. Nothing
    else (D2). No `<a>`, no `next/link` (D3).
3.3 The no-diagnosis case renders "No diagnosis on file yet." in place of the
    badge row (D5). It is a branch in this component, not a filter upstream.
3.4 No width, no min-width, no fixed height. The card is a grid child and the
    grid decides how wide it is; a card that sets its own width is the
    fixed-width failure the responsive convention forbids, and it is the single
    likeliest way this phase breaks 320px.

**Ends with:** a card component that compiles and is used by nothing yet.

---

## 4. The route

**Gated on Q1.**

4.1 `src/app/agents/page.tsx` — a Server Component calling `listAgents()` (D1).
    No `"use client"`, no new query, no props.
4.2 An `<h1>`: "Patients on the books". Exactly one per page, as in both closed
    phases; the layout supplies `<main>`, so the page supplies only its content.
4.3 The grid: one column, then more above `sm:`, with Tailwind's default
    breakpoints only and no width of its own (D4). Whatever Q1 returns, the
    column count is the only thing that changes with viewport.
4.4 The all-empty state in place of the grid, in voice (D5).
4.5 Confirm the page renders inside the shared container without a second
    container of its own — the header, the roster, and the footer stay on the
    same left edge at every width.

**Ends with:** `npm run dev` serves eight patients at `/agents`.

---

## 5. The loading state

5.1 `src/app/agents/loading.tsx` — an in-voice line and placeholder cards in the
    same grid as group 4, so the page does not reflow when the content lands
    (D6).
5.2 No `Skeleton` primitive, no animation library: muted blocks inside `Card`
    (D7's boundary).
5.3 Do not add a delay anywhere to see it. Group 7 has a test that makes it
    observable without changing the product.

**Ends with:** a loading state that exists and is honest about how rarely it is
seen.

---

## 6. Navigation

**Gated on Q2.** Skip this group entirely if the answer is no; nothing
downstream depends on it except the checks that name it.

6.1 One link in `ClinicHeader`: **Patients** → `/agents`, in the existing div and
    the existing type scale (D3).
6.2 Update the component's docstring. It currently says the nav "lands here when
    there is somewhere to point it" and cites Phase 0's D5 — a stale comment in a
    teaching repo sends the next reader to the wrong spec, which is a fault
    Phase 1's plan 7.1 already had to fix once.
6.3 The footer stays link-free. `ClinicFooter`'s docstring gets the same
    treatment only if it now says something untrue.
6.4 Confirm the header still fits at 320px with the link in it.

**Ends with:** the roster is reachable from every page by clicking.

---

## 7. Tests

7.1 `tests/roster.spec.ts` — the happy path: `/agents` shows the `<h1>`, a card
    for a named seeded patient, that patient's model family, and a badge naming
    an ailment the seed gives them. Assert on the seed's *relationships* and its
    stable ids, not on prose that is meant to be edited (Phase 1's plan 6.2).
7.2 The same spec covers the landmarks on this route: one `<h1>`, and `banner` /
    `main` / `contentinfo` still supplied by the layout rather than the page.
7.3 The loading state, made observable without touching the product (D6): drive
    a client-side navigation into `/agents`, hold the segment's payload with
    `page.route(...)` — including the prefetch, or the router will have the
    payload before the click — and assert the in-voice line appears. If this
    proves genuinely impossible against a prerendered segment, that is a
    finding: record it in [validation.md](validation.md) and downgrade C-check
    for the loading state to a judgement check with its evidence named, per
    [tech-stack.md](../tech-stack.md#judgement-checks). Do not leave it ticked
    on nothing.
7.4 The all-empty state: with the agents table emptied, `/agents` renders its
    in-voice message and does not crash. A Playwright run against a production
    build cannot empty the database mid-suite without disturbing every other
    spec, so this is a unit test over the component's branch or a manual step in
    validation section A — whichever is honest, not whichever is easier to tick.
7.5 Extend `tests/responsive.spec.ts` to sweep `/agents` as well as `/`. The
    existing width sweep, gutter check, and cap assertion parameterise over the
    two routes; the grid is the thing this phase can break, so a sweep that only
    visits `/` would pass while the roster overflowed.
7.6 Add the card-level check the sweep cannot make: at 320px, no card's right
    edge exceeds the container's, and the badges wrap rather than push the card
    wide.
7.7 No new unit tests over `src/server/` — the query is unchanged and Phase 1's
    tests still cover it (D1). If one is needed here, that is a finding about
    Phase 1 worth writing down.

**Ends with:** the roster is verified at both viewports, and the states are
verified by something rather than asserted in prose.

---

## 8. Gates

8.1 `npm run check` clean — typecheck, lint, format, provenance, unit tests.
8.2 `npm run test:e2e` clean, against the production build, at both viewports.
8.3 Walk section A of [validation.md](validation.md) in a fresh clone, including
    the offline build.
8.4 Green CI on the branch.

**Ends with:** every gate in [tech-stack.md](../tech-stack.md#quality-gates)
passes with a second route on the map.

---

## 9. Documentation

9.1 Update the status blockquote in `README.md`: Phase 2, the roster is on
    screen, case files arrive in Phase 3.
9.2 The layout block in `README.md` and in
    [tech-stack.md](../tech-stack.md#conventions) is unchanged — `src/app/`
    already covers a second route, and no new directory appears. Confirm rather
    than assume; both maps were wrong once already.
9.3 `CHANGELOG.md` entry for the phase, per
    [tech-stack.md](../tech-stack.md#changelog). One bullet for the phase, with
    sub-bullets for the two owner answers and anything the validation walk
    found.

**Ends with:** the README describes the repo that exists.

---

## 10. Close the phase

10.1 Walk [validation.md](validation.md) end to end and record the result in its
     Result section — the machine and Node version section A ran on, and the
     verdict, date, and author of the judgement check.
10.2 Confirm no scope leaked: no `/agents/[id]`, no severities on a card, no
     dashboard content on `/`, no design pass, no third primitive.
10.3 Open the PR. Record section A's result in the description.
10.4 Merge, and **keep the branch** — `phase-2-agent-roster` joins the phase
     collection, per [tech-stack.md](../tech-stack.md#branch-retention). Do not
     pass `--delete-branch`.
