# Validation — Agent case file

How we know **Phase 3** is done. Every check below is binary. A phase is done or
it isn't — no "mostly".

Scope is in [requirements.md](requirements.md); the work is in
[plan.md](plan.md).

---

## A. The clean-clone run

Same discipline as Phases 0, 1 and 2, and still the check most easily faked by a
warm working directory. Run it in a **fresh clone in a new directory**.

| # | Step | Passes when |
| --- | --- | --- |
| A1 | `git clone <repo> && cd` into it | — |
| A2 | `npm install` | Completes with no manual step and no post-install prompt |
| A3 | Copy `.env.example` to `.env` | Unchanged since Phase 0 — `DATABASE_URL` and nothing else for local |
| A4 | `npm test` before anything else | Passes on a bare clone. The suite still provisions `clinic.test.db` and still leaves `clinic.db` uncreated |
| A5 | `npm run migrate` | Applies cleanly. **No new migration this phase** — `prisma/migrations/` is byte-identical to `main` |
| A6 | `npm run seed` | Populates the full clinic and reports its in-voice summary |
| A7 | `npm run dev` | Every card on `/agents` opens a complete file; `/` and the roster are unchanged apart from the card links (C18) |
| A8 | Stop dev; `npm run build && npm start` | The **same** files, same content, from the production build. The build output lists `/agents/[id]` as prerendered with eight paths (C3) |
| A9 | On the production build, request `/agents/not-a-patient` | The in-voice 404 renders inside the clinic's header and footer. **Record the HTTP status the response carried** (C6) |
| A10 | Disconnect the network, repeat A8 | Still works. Install remains the only step that touches the registry |

A5 is this phase's cheap-to-miss check, for the same reason it was Phase 2's:
this phase adds a route, not a column. A migration on this branch means
something reached for the schema, and the schema is closed until Phase 6 says
otherwise.

A8's build output is not a formality. `/agents/[id]` is the first dynamic
segment in this project, and a dynamic segment that loses its
`generateStaticParams()` does not fail — it silently starts rendering on
demand, which is the rendering-strategy change Phase 6 owns (D3). The line in
the build table is the only place that shows it.

A9 is a manual step because its interesting output is a number nobody has
measured yet, not a pass or a fail. Next's own reference says a `not-found.js`
response carries 200 when streamed and 404 when not; whichever this route does,
the walk writes it into C6 and the Result section rather than asserting a value
in a test that was never run against the real thing.

Reproduce A10 without touching your wifi, on Linux, in a network namespace with
nothing but loopback. Confirm the namespace is genuinely offline **first** —
`curl https://registry.npmjs.org` inside it must fail — or the check passes for
the wrong reason. `rm -rf .next` matters too: a warm build directory can hide a
fetch that only a cold build makes.

**By hand, at a terminal.** The server runs in the foreground and Ctrl-C ends
it:

```sh
unshare -rn bash -c 'ip link set lo up; rm -rf .next; npm run build && npm start'
```

**Scripted, or run by an agent.** Recipe A9 of the
[Phase 2 validation](../2026-08-20-agent-roster/validation.md) unchanged, with
the assertion pointed at a case file: the whole `unshare` invocation is the
tracked background task, so one handle owns the namespace and everything in it.
The procedure is in `.claude/skills/local-server`, and the reason it is written
down is that the obvious shortcut — backgrounding `npm start` inside a
*foreground* `unshare` — stranded a server during the Phase 2 walk and left the
only available remedies being the two the 2026-08-17 owner decision forbids.

Assert on content the database put there — a patient's model family and a
therapy name on their file — and not on a count of `data-slot="card"` elements.
Phase 2 learned that one the expensive way.

---

## B. Quality gates

Inherited by every phase from
[tech-stack.md](../tech-stack.md#quality-gates).

| # | Check | Passes when |
| --- | --- | --- |
| B1 | `npm run typecheck` | Clean. No `any` outside a commented escape hatch, and both list components' prop types are derived from `getAgent()`'s return type rather than hand-written |
| B2 | ESLint | Clean |
| B3 | `prettier --check .` | Clean |
| B4 | Vitest | Every unit test passes, including the date formatter and both empty branches |
| B5 | Playwright | The whole suite passes against the production build, at **both** viewports — every earlier phase's specs plus this phase's case-file and responsive additions |
| B6 | `npm run check:provenance` | Every decision record in this spec names its source |
| B7 | `npm run check:changelog` | This branch touched `specs/` and `src/`, and `CHANGELOG.md` with them |
| B8 | CI | A green run on this branch, executing B1–B7 |

---

## C. Phase-specific correctness

### The route

| # | Check | Passes when |
| --- | --- | --- |
| C1 | Every patient has a file | All eight seeded ids open a page carrying that patient's own data. The roadmap's exit criterion is "every agent on the roster", so it is checked across all eight rather than on the one the test happened to pick |
| C2 | The profile is complete | Name, model family, admission date, and the intake notes in full (D2) |
| C3 | The route is prerendered | `next build` lists `/agents/[id]` as static with eight generated paths. Read from the build output, not inferred from the source (D3) |
| C4 | No new data access | `git diff main -- src/server/` is empty. The page calls `getAgent()` and `generateStaticParams()` calls `listAgents()`, both unchanged (D1) |
| C5 | Types are inferred | Renaming `intakeNotes` or `modelFamily` in `schema.prisma` breaks `npm run typecheck` at the page; renaming `Ailment.name`, `Diagnosis.diagnosedOn` or `Appointment.scheduledFor` breaks it at the list components. **Measured 2026-08-20, and it did not hold as first written** — `npm run typecheck` did not regenerate the client, so the rename passed silently and this row would have been ticked on nothing. The script now runs `prisma generate` first (D11), and the rename was re-run to watch it fail |
| C6 | The unknown patient reads in voice | `/agents/not-a-patient` renders the clinic's own 404 copy inside the root layout's header and footer, on the **production build**. **Measured 2026-08-20: HTTP 200**, with `x-nextjs-prerender: 1` and the response cached for 300s; `/no-such-route`, which never reaches this segment, returns a correct 404 with Next's default page. In voice: yes. Correct status: no — put to the owner on 2026-08-20 and accepted as measured, with the finding and the trade it sits on in D4 (D4, A9) |
| C7 | Still a Server Component | No `"use client"` anywhere in the repo |
| C8 | No primitive was added | `src/components/ui/` still contains `card.tsx` and `badge.tsx` and nothing else, and no package was installed — see D3 for the one script that did change (D10) |

### The ailments

| # | Check | Passes when |
| --- | --- | --- |
| C9 | Every diagnosis is on the file | A patient with three diagnoses shows three, each with its ailment name and its severity written as a word (D2) |
| C10 | The order is the one the owner chose | The rendered order matches Q1's answer, verified on Bodhi (one diagnosis at each severity). The alphabetical tiebreak is verified on **Roux** — not Nim, and the difference is the whole check: Nim's tied pair already arrives alphabetically from the query, so with a stable sort the assertion passes with the tiebreak deleted. **Measured by deleting it 2026-08-20**: green on Nim, red on Roux. Read off the rendered page, not off the sort function (D6) |
| C11 | The severity badge invents nothing | Only `outline`, `secondary`, and `destructive` — variants the vendored primitive already ships. No new colour, no new class, no severity scale of ours (D2's boundary) |

### The appointments

| # | Check | Passes when |
| --- | --- | --- |
| C12 | Every appointment is on the file | Every seeded booking appears on its patient's file and no list drops a row. Checked on **Bodhi** for *Already seen* (one session, seven days back) and **Atlas's `+3`** for *Still to come*. **Corrected 2026-08-20:** this row used to say Atlas shows "one under upcoming and one under past", which is false for any build started before 10:00 — Atlas's other session is today at 10:00, so both sit under *Still to come*, as the walk's own A8 record shows. A check whose truth depends on the hour the build ran is not binary (D7) |
| C13 | The split is real | A future booking never appears under the past heading and vice versa, and a patient with only past sessions shows no empty "Upcoming" heading (D7) |
| C14 | Status reads in words | `Scheduled` and `Completed`, via `appointmentStatusLabel()` — not the raw enum (D2) |

### The states

| # | Check | Passes when |
| --- | --- | --- |
| C15 | The undiagnosed patient | A patient with no diagnoses renders "No diagnosis on file yet…" rather than an empty gap. Verified by a unit test that renders the component — not by reading the JSX, which Phase 2's C9 already ruled out (D9) |
| C16 | The unseen patient | A patient with no appointments renders "Never been seen…" the same way, verified the same way (D9) |

### The rest of the site

| # | Check | Passes when |
| --- | --- | --- |
| C17 | The roster links through | Each card's patient name links to that patient's file, and clicking one lands on the right file. The badges still link nowhere — `/ailments/[id]` is Phase 4 (D5) |
| C18 | `/` is untouched | `git diff main -- src/app/page.tsx` is empty. The home page gains no count, no link, no preview (Phase 7) |
| C19 | No dead links | Every link in the repo resolves to a route that exists. Phase 0's D5, carried through four phases, and the first phase in which a link to `/agents/[id]` is the *correct* thing rather than the forbidden one |
| C20 | Landmarks hold on the new route | On a case file: exactly one `<h1>`, and `banner`, `main`, `contentinfo` all supplied by the root layout, not the page |
| C21 | Document title | A case file's title names the patient and the 404's names the miss, not the bare app name — both asserted in `tests/case-file.spec.ts` (D12). This row cited Phase 2's C15 until 2026-08-20, when the branch's review established that the requirement had no source: a validation row is not one of the three admitted sources. Raised as Q3, answered by the owner the same day, and it now rests on D12 and the register entry behind it rather than on a check in a closed phase |
| C27 | Name order comes from one place | `grep -rn "\.localeCompare(" src/` returns nothing (exit 1): every comparison of two names goes through the pinned collator in `src/lib/name-order.ts`. Added 2026-08-20 — the bare form follows the machine's default locale, so the severity tiebreak and the roster's badge order could differ between two builds of the same database (D8, extended). Matches the *call* and not the word, and both halves were run before this row was written: clean on the branch, and red against a planted `a.name.localeCompare(b.name)`. Writing `--exclude` here instead is how C22 came to be ticked on a command that never passed |
| C22 | Dates come from one place | `grep -rn "toLocaleDateString\|toLocaleString\|Intl.DateTimeFormat" src/ --exclude=clinic-date.ts` returns nothing. **Corrected 2026-08-20:** the exclude was written `--exclude=lib/clinic-date.ts`, and `--exclude` matches a glob against the *basename*, so it excluded nothing and the command returned three hits every time — published and ticked without being run once. The module's own output is unit-tested against fixed instants, and the suite now also asserts a formatted date's **shape** on the page, so a module that returned `""` would fail (D8) |

### Responsive — long prose is this route's version of the risk

| # | Check | Passes when |
| --- | --- | --- |
| C23 | No sideways overflow | The width sweep in `tests/responsive.spec.ts` passes at 320, 480, 640, 1024, and 1536px on a case file as well as `/` and `/agents` (plan 8.7) |
| C24 | Prose wraps | At 320px no block on a case file has `scrollWidth > clientWidth` — measured on **Bodhi**, who carries all three kinds of prose the row names. **Rewritten 2026-08-20, twice over.** It compared each block's `boundingBox()` against the container edge, which cannot fail: a `<p>` is a block box, so its border box is the container's width whatever the text inside does. Adding `whitespace-nowrap` to the intake notes was measured to leave it green, and to make it red after the rewrite. It also named "the appointment notes" while visiting Atlas, whose two bookings have none (plan 8.8) |
| C25 | No bespoke breakpoint | Only Tailwind's default breakpoint prefixes appear, and no fixed width: `grep -rnE "\[[0-9]+px\]|min-\[|max-\[|w-\[" src/app src/components --exclude-dir=ui` returns nothing. The exclusion of the vendored primitives is Phase 2's C18, narrowed there for the reason its row gives |
| C26 | It reads as a patient's record on a phone | **Evidence:** the production build (`npm run build && npm start`) at a 393px-wide viewport, on the case files of **Bodhi** (three diagnoses at three severities, one past session and nothing to come) and **Atlas** (two diagnoses, and at least one session still to come — whether his 10:00 has moved to *Already seen* depends on the hour the build ran, which is D7's build-time split and not something the reader should have to allow for) — not a screenshot, not `next dev`, and not the desktop layout narrowed by eye. **Procedure:** open both, read each top to bottom, and read the 404 at `/agents/not-a-patient` on the same build. **Passes when** the page reads as one patient's record rather than as three stacked lists: the profile identifies who this is before any list starts, a diagnosis's severity is readable without hunting for it, the upcoming and past appointments are distinguishable at a glance, and nothing is clipped or crowded against an edge. A judgement, not a measurement — recorded with who made it and when. **Passed** — owner verdict, 2026-08-20, on the evidence this row names, taken against the post-review build rather than the one the walk produced |

C26 is the human half of the roadmap's exit criterion — "every agent on the
roster opens a **complete** case file" — and complete is not a thing a test can
settle. It is written this way because
[tech-stack.md](../tech-stack.md#judgement-checks) requires a check that asks a
human to decide to name its evidence, its procedure, and its pass condition.
C23–C25 are what a machine can settle; C26 is the part it cannot. The Phase 2
walk is the argument for taking it seriously: the desktop capture taken for its
judgement check is what found a ragged grid row that no automated check was ever
going to catch.

---

## D. Parity and constraints

| # | Check | Passes when |
| --- | --- | --- |
| D1 | No deploy-target branching | `grep -ri "process.env.VERCEL\|NODE_ENV ===" src/ prisma/` returns nothing meaningful |
| D2 | No runtime filesystem writes | Nothing outside Prisma writes to disk at request time |
| D3 | No new dependency | `dependencies`, `devDependencies` and `package-lock.json` are unchanged, and nothing was installed (D10). One script changed — `typecheck` now runs `prisma generate` first, for the reason D11 gives. This row previously read "`package.json` is unchanged", which was a proxy for the thing it meant |
| D4 | No schema change | `prisma/schema.prisma` and `prisma/migrations/` are byte-identical to `main` |
| D5 | Rendering strategy unchanged | Every route prerenders. No `dynamic`, no `revalidate`, no `no-store`, and no `dynamicParams` export anywhere — the last of those is this phase's specific temptation and D3 says why it is refused |
| D6 | Nothing writes | No Server Action, no form, no mutation. Booking is Phase 6 |
| D7 | README honesty | Every command in the README was run during A1–A10 and behaved as documented — **with one exception, named here rather than hidden by the walk's shape**: `npm run seed` is documented as "safe to re-run" and is not, across days. A1–A10 seeds exactly once and so cannot reach it. Knowingly left standing per the owner decision of 2026-08-20, which sends the fix to Phase 6 |

---

## E. Not-done conditions

Explicit disqualifiers. Any one of these means the phase is not finished,
regardless of how green the tests are.

- `/ailments` or `/therapies` exists in any form, or an ailment name or therapy
  name on a case file links anywhere.
- A booking affordance appeared — a button, a form, a Server Action, or a link
  to a route Phase 6 owns.
- A site-wide `not-found.tsx` or `global-not-found.tsx` landed. This phase 404s
  an unknown agent; the rest of the site is Phase 8's question.
- `dynamicParams` was exported, or `generateStaticParams()` was omitted, so the
  case file renders on demand. That is Phase 6's decision arriving early (D3).
- The 404's HTTP status is asserted in a test but was never measured on a
  production build, or C6 is ticked with the status line left blank.
- `/` or the roster gained content beyond the card link.
- The schema changed, or a migration appeared on this branch.
- A query landed in `src/server/`, or `getAgent()` was widened, without a
  written finding explaining why Phase 1's D9 got it wrong.
- A third shadcn primitive was pulled in, or any dependency was added.
- A bespoke breakpoint or a fixed pixel width entered the styling.
- The responsive sweep does not visit a case file.
- Either empty state is ticked by reading the JSX rather than by rendering it.
- A date is formatted anywhere but `src/lib/clinic-date.ts`, or a Playwright
  assertion depends on today's date.
- `"use client"` appears anywhere.
- A design pass happened — bespoke typography, motion, social preview metadata.
- Q1 or Q2 in [requirements.md](requirements.md#open-questions) is still open,
  or was answered by the implementation rather than by the owner.
- A comment or docstring still points at a phase or check number this phase
  replaced — in particular `AgentCard`'s, which says the card is deliberately
  not a link, and `src/lib/severity.ts`'s two ordering comments, which Q1 either
  corrects or confirms (plan 1.3, 7.2).
- A check in section C was rewritten during the walk without the mutation that
  proved it needed rewriting, or without re-running that mutation afterwards to
  watch the new version fail. Three checks on this branch could not fail; each
  is now demonstrated both ways, and a fourth written on the same evidence
  standard is the only kind that should join them.
- `strict: true` is off, or an `any` is uncommented.

---

## Merge criteria

Merge when **A1–A10, B1–B8, C1–C27, and D1–D7 all pass, and no condition in E
holds.**

Record the result of section A in the PR description — including the machine and
Node version it was run on. A clean-clone claim with no evidence behind it is the
failure mode Phase 0 existed to prevent, and this phase inherits the habit.

Merge with the branch **kept**, not deleted:
[tech-stack.md](../tech-stack.md#branch-retention) keeps every `phase-N-*`
branch for the owner's end-of-project review.

## Result

**Walked 2026-08-20 on Linux 6.18 (WSL2), Node v22.23.2, then reviewed on the
same day.** The walk and the review are recorded separately below, because they
found different kinds of thing and the second one falsified four rows the first
had ticked.

### The walk

Section A ran in a fresh clone of this branch at `/tmp/.../scratchpad/clone`, in
order — with A8 taken before A7, which changes nothing about either:

- **A2** `npm install` — clean, no prompt, no manual step.
- **A4** `npm test` on the bare clone, before anything else — passes, and no
  `clinic.db` exists afterwards.
- **A5** `npm run migrate` — applied. `git diff --name-only origin/main...HEAD`
  over `prisma/`, `package-lock.json`, `src/server/` and `src/app/page.tsx` is
  **empty**, which is C4, C18 and D4 in one command: this phase added a route
  and changed no schema, no query, and no existing page.
- **A6** `npm run seed` — 8 patients, 8 ailments, 6 therapies, 3 on today's
  calendar.
- **A8** `npm run build && npm start` — the build lists `/agents/[id]` as
  `● (SSG)` with eight generated paths, which is C3 and D5. The served case file
  carries `Meridian-4`, `Chronic Context Loss`, `Severe`, the intake notes, and
  `Context Window Hygiene` under **Still to come**.
- **A9** `/agents/not-a-patient` — the clinic's own copy, and **HTTP 200** (C6,
  D4). Accepted by the owner as measured.
- **A7** `npm run dev` — all eight patients open a file, and `/` still shows the
  notice board and nothing else.
- **A10** cold offline build in a `unshare -rn` namespace, with the absence of a
  route out confirmed first (`curl https://registry.npmjs.org` failed inside
  it). `rm -rf .next` beforehand. Built, served the case file from the database,
  and returned the same 200 on the unknown patient that the online run did.

Every server started during the walk was a tracked task wrapped so the process
group dies with it, and every one was verified stopped with `ss` and `pgrep`
afterwards. Nothing was stranded and nothing was pattern-killed.

Two findings from the walk are worth more than a tick, and both went to the
owner:

- **The in-voice 404 returns 200, and the page that returns a correct 404 is the
  one that reads badly.** `/agents/not-a-patient` serves the clinic's copy with
  `200`; `/no-such-route`, which never reaches this segment, returns `404` with
  Next's default page. **Accepted as measured**, and Phase 8 now carries the
  question in the roadmap.
- **`npm run seed` is not safe to re-run across days** — `P2002` on
  `Appointment`'s `(agentId, scheduledFor)`, because today's `dayOffset: 0` slot
  for Atlas lands on the instant an earlier run wrote for `dayOffset: +3`. A
  Phase 1 defect, sent to Phase 6 by the owner, registered in
  [mission.md](../mission.md#owner-decisions) and in the
  [roadmap](../roadmap.md#phase-6--booking).

### The review, and what it falsified

Three reviewers were then run over the whole branch — one on spec discipline,
one on code correctness, one on whether the tests verify what they claim. The
third question is the one that mattered. **Four checks could not fail, and three
of those were demonstrated dead by mutation rather than argued:**

| Check | The mutation | Before | After |
| --- | --- | --- | --- |
| C10, the alphabetical tiebreak | delete the tiebreak from `DiagnosisList` | green | red |
| C24, prose wraps at 320px | `whitespace-nowrap` on the intake notes | green | red |
| C5, a renamed column breaks typecheck | rename `Agent.modelFamily`, run `npm run typecheck` | passed | fails |
| C22, dates come from one place | — run the documented command | 3 hits, exit 0 | exit 1 |

Each row's story is in the row itself. The shapes are worth naming together,
because they are four different ways to write a check that reads as rigour:

- **A fixture that cannot discriminate.** C10 used Nim, whose tied pair already
  arrives alphabetically, so the feature could be deleted without moving the
  output. Roux is the only fixture in the seed that can fail.
- **Measuring the wrong property.** C24 compared block boxes to a container
  edge; a `<p>` is its container's width whatever its text does. `scrollWidth`
  is what moves.
- **A gate that fires after a command nobody runs.** C5's claim needed
  `prisma generate` first, which `npm run typecheck` did not do — D11 fixes the
  script rather than the sentence.
- **A command published without being run.** C22's `--exclude` matched a
  basename glob and excluded nothing.

Two more rows were false rather than hollow. **C12** claimed Atlas shows one
appointment in each half, which is untrue for any build started before 10:00 —
and A8's own record above shows this build was one of them. **D3** asserted
`package.json` was unchanged as a proxy for "no dependency was added". Both now
say what they mean.

The review also found **three claims in the spec that were not true of the
code**: D2 cited a Phase 1 decision about slot uniqueness for a set of columns it
never covered; D4 quoted the 404 copy without its third sentence; D7 named a
heading, "Upcoming", that this product has never rendered — and had never pinned
the two strings it does render, while D9 two decisions away pins both empty
states to the full stop. D7's description of the build-time split as "D12's
staleness" was also wrong in a way that mattered, since that framing is what made
it acceptable: D12 is data going stale, while this is an unchanged row migrating
to the wrong heading.

**One requirement turned out to have no source at all.** The page title was
cited to Phase 2's C15, and a validation row is not one of the three admitted
sources — so it had been binding for two phases on nothing. Raised as
[Q3](requirements.md#open-questions) rather than quietly attributed, and
answered by the owner on 2026-08-20: page titles name their page, `/agents`
retroactively included. It is D12 now, with a register entry in
[mission.md](../mission.md#owner-decisions) that records the owner delegated the
choice rather than picking it — a distinction worth keeping, since a record that
dressed a delegation up as a pronouncement would be a tidier version of the
fault it exists to correct.

**One flake was pinned rather than re-run.** `the roster is one column on a phone`
failed once, on the phone project, measuring a card's box before it was visible;
`boundingBox()` returns null for an invisible element instead of waiting. A
visibility wait was added, and the fix was proved not to have neutered the test
by forcing the grid to one column and watching it fail at both widths. Two full
suite runs green afterwards.

### Where it stands

- **A1–A10** — pass, as recorded above.
- **B1–B7** — pass. `npm run check` green: typecheck (now including
  `prisma generate`), ESLint, Prettier, provenance, **59 unit tests**.
  `npm run test:e2e` green against the production build: **82 tests, both
  viewports**, run twice after the last change.
- **C1–C27** — pass **as corrected**. Four of them did not pass as originally
  written, which is what the table above records; correcting a row and then
  ticking it is only honest if the correction is visible, so each one carries
  its date and what it replaced.
- **D1–D7** — pass, with D7 carrying the README exception the owner accepted.
- **C26** — **passed.** Owner verdict, 2026-08-20, on the evidence its row
  names, taken against the post-review build rather than the one the walk
  produced. The row was reworded during the review so the evidence no longer
  depends on the hour the build ran.
- **Q3** — **answered**, 2026-08-20. The page title is a requirement now, with a
  source, a decision record (D12) and a register entry.
- **B8** — **passed.** Green on pull request
  [#15](https://github.com/mtahamasood/agent-clinic/pull/15), run
  [32310873413](https://github.com/mtahamasood/agent-clinic/actions/runs/32310873413),
  in 1m28s — comfortably inside the ten-minute job cap, and with
  `playwright install chromium` behaving as the 2026-08-19 decisions intended.
  Worth repeating what Phase 2 recorded: pushing the branch produced no run at
  all, because `push` has been scoped to `main` since #11. The pull request is
  what makes this check reachable.

  The commit carrying this paragraph triggers a second run, since branch
  protection judges the head commit rather than the branch. That run has to be
  green too; the one named above is what proved the code, and the one after it
  proves the sentence describing it did no harm.

**Everything holds.** A1–A10, B1–B8, C1–C27 and D1–D7 all pass, and no condition
in section E does. Phase 3 is closed on merge, with the branch kept.

The lesson this phase leaves for Phase 4, in the way Phase 1 left D12 and Phase
2 left the loading state: **a check is not finished when it is written, it is
finished when it has been seen to fail.** Four of the checks here read as
rigour, passed on green, and verified nothing — and every one of them was
written by someone who believed it worked. The cheapest guard found so far is
the one this phase ended up using: break the thing on purpose, watch the check
go red, put it back. It costs a minute per check and it is the only evidence
that distinguishes a gate from a sentence.
