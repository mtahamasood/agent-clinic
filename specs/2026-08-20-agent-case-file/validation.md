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
| C5 | Types are inferred | Renaming `intakeNotes` or `modelFamily` in `schema.prisma` breaks `npm run typecheck` at the page and the list components, not only at a test |
| C6 | The unknown patient reads in voice | `/agents/not-a-patient` renders the clinic's own 404 copy inside the root layout's header and footer, on the **production build**. **Measured 2026-08-20: HTTP 200**, with `x-nextjs-prerender: 1` and the response cached for 300s; `/no-such-route`, which never reaches this segment, returns a correct 404 with Next's default page. In voice: yes. Correct status: no — put to the owner on 2026-08-20 and accepted as measured, with the finding and the trade it sits on in D4 (D4, A9) |
| C7 | Still a Server Component | No `"use client"` anywhere in the repo |
| C8 | No primitive was added | `src/components/ui/` still contains `card.tsx` and `badge.tsx` and nothing else; `package.json` is unchanged (D10) |

### The ailments

| # | Check | Passes when |
| --- | --- | --- |
| C9 | Every diagnosis is on the file | A patient with three diagnoses shows three, each with its ailment name and its severity written as a word (D2) |
| C10 | The order is the one the owner chose | The rendered order matches Q1's answer, with the alphabetical tiebreak, verified on Bodhi (three severities) and on Roux or Nim (a tie). Read off the rendered page, not off the sort function (D6) |
| C11 | The severity badge invents nothing | Only `outline`, `secondary`, and `destructive` — variants the vendored primitive already ships. No new colour, no new class, no severity scale of ours (D2's boundary) |

### The appointments

| # | Check | Passes when |
| --- | --- | --- |
| C12 | Every appointment is on the file | Both of Atlas's appear, one under upcoming and one under past, and neither list drops a row (D7) |
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
| C21 | Document title | A case file's title names the patient, not the bare app name. Metadata beyond that is still Phase 8 |
| C22 | Dates come from one place | `grep -rn "toLocaleDateString\|toLocaleString\|Intl.DateTimeFormat" src/ --exclude=lib/clinic-date.ts` returns nothing. The module's own output is unit-tested against fixed instants, so a format change fails there rather than in a screenshot (D8) |

### Responsive — long prose is this route's version of the risk

| # | Check | Passes when |
| --- | --- | --- |
| C23 | No sideways overflow | The width sweep in `tests/responsive.spec.ts` passes at 320, 480, 640, 1024, and 1536px on a case file as well as `/` and `/agents` (plan 8.7) |
| C24 | Prose wraps | At 320px the intake notes, the clinical asides, and the appointment notes wrap inside the container rather than widening it (plan 8.8) |
| C25 | No bespoke breakpoint | Only Tailwind's default breakpoint prefixes appear, and no fixed width: `grep -rnE "\[[0-9]+px\]|min-\[|max-\[|w-\[" src/app src/components --exclude-dir=ui` returns nothing. The exclusion of the vendored primitives is Phase 2's C18, narrowed there for the reason its row gives |
| C26 | It reads as a patient's record on a phone | **Evidence:** the production build (`npm run build && npm start`) at a 393px-wide viewport, on the case files of **Bodhi** (three diagnoses, one completed appointment) and **Atlas** (two diagnoses, one upcoming and one past) — not a screenshot, not `next dev`, and not the desktop layout narrowed by eye. **Procedure:** open both, read each top to bottom, and read the 404 at `/agents/not-a-patient` on the same build. **Passes when** the page reads as one patient's record rather than as three stacked lists: the profile identifies who this is before any list starts, a diagnosis's severity is readable without hunting for it, the upcoming and past appointments are distinguishable at a glance, and nothing is clipped or crowded against an edge. A judgement, not a measurement — recorded with who made it and when |

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
| D3 | No new dependency | `package.json` and `package-lock.json` are unchanged (D10) |
| D4 | No schema change | `prisma/schema.prisma` and `prisma/migrations/` are byte-identical to `main` |
| D5 | Rendering strategy unchanged | Every route prerenders. No `dynamic`, no `revalidate`, no `no-store`, and no `dynamicParams` export anywhere — the last of those is this phase's specific temptation and D3 says why it is refused |
| D6 | Nothing writes | No Server Action, no form, no mutation. Booking is Phase 6 |
| D7 | README honesty | Every command in the README was run during A1–A10 and behaved as documented |

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
- `strict: true` is off, or an `any` is uncommented.

---

## Merge criteria

Merge when **A1–A10, B1–B8, C1–C26, and D1–D7 all pass, and no condition in E
holds.**

Record the result of section A in the PR description — including the machine and
Node version it was run on. A clean-clone claim with no evidence behind it is the
failure mode Phase 0 existed to prevent, and this phase inherits the habit.

Merge with the branch **kept**, not deleted:
[tech-stack.md](../tech-stack.md#branch-retention) keeps every `phase-N-*`
branch for the owner's end-of-project review.

## Result

**Walked 2026-08-20 on Linux 6.18 (WSL2), Node v22.23.2.** Sections A, B, C and
D hold, with two checks still open at the end and both named there: C26, which is
the owner's to sign off, and B8, which needs a pull request to exist before it
can be reached.

Section A ran in a fresh clone of this branch at
`/tmp/.../scratchpad/clone`, in order — with A8 taken before A7, which changes
nothing about either:

- **A2** `npm install` — clean, no prompt, no manual step.
- **A4** `npm test` on the bare clone, before anything else — 56 tests pass and
  no `clinic.db` exists afterwards. The twelve new ones are the date formatter,
  the ailment list's order and tiebreak, and both empty branches.
- **A5** `npm run migrate` — applied. `git diff --name-only origin/main...HEAD`
  over `prisma/`, `package.json`, `package-lock.json`, `src/server/` and
  `src/app/page.tsx` is **empty**, which is C4, C18, D3 and D4 in one command:
  this phase added a route and changed no schema, no dependency, no query, and
  no existing page.
- **A6** `npm run seed` — 8 patients, 8 ailments, 6 therapies, 3 on today's
  calendar.
- **A8** `npm run build && npm start` — the build lists `/agents/[id]` as `●
  (SSG)` with eight generated paths, which is C3 and D5. The served case file
  carries `Meridian-4`, `Chronic Context Loss`, `Severe`, the intake notes, and
  `Context Window Hygiene` under **Still to come** — profile, diagnosis and
  appointment, all from the database.
- **A9** `/agents/not-a-patient` — the clinic's own copy, and **HTTP 200**. The
  finding is in C6 and D4; the owner accepted it as measured on 2026-08-20.
- **A7** `npm run dev` — all eight patients open a file (200, with the
  *Presenting ailments* section on each), and `/` still shows the notice board
  and nothing else.
- **A10** cold offline build in a `unshare -rn` namespace, with the absence of a
  route out confirmed first (`curl https://registry.npmjs.org` failed inside
  it). `rm -rf .next` beforehand. Built, served the case file from the database,
  and returned the same 200 on the unknown patient that the online run did.

Three servers were started during the walk, all as tracked tasks wrapped so the
process group dies with the task, and all three verified stopped with `ss` and
`pgrep` afterwards. Nothing was stranded and nothing was pattern-killed, which
is the 2026-08-20 owner decision working as intended one phase after the walk
that produced it.

Three things the walk found are worth more than a tick:

- **The in-voice 404 returns 200, and the page that returns a correct 404 is
  the one that reads badly.** D4 predicted the status code was a measurement
  rather than a fact; it is, and it came back the wrong way round.
  `/agents/not-a-patient` serves the clinic's copy with `200` and
  `x-nextjs-prerender: 1`, cached for 300 seconds, while `/no-such-route` —
  which never reaches this segment — returns `404` with Next's default page. Put
  to the owner with the three options D4 lists and **accepted as measured**: the
  roadmap asked for an unknown agent to be handled in voice, and it is. The
  alternatives each cost more than the number is worth today, and Phase 8
  inherits a measurement instead of a suspicion.
- **`npm run seed` is not safe to re-run across days.** Found by re-seeding a
  local database that had been seeded three days earlier: `P2002` on
  `Appointment`'s `(agentId, scheduledFor)`, because today's `dayOffset: 0` slot
  for Atlas lands on the instant an earlier run wrote for `dayOffset: +3`. A
  fresh clone never reaches it, which is why three validation walks had not —
  the walk clones, migrates and seeds exactly once. It is a Phase 1 defect, it
  contradicts a line in `README.md`, and the owner sent it to Phase 6 on
  2026-08-20 rather than have it fixed on this branch: the collision is with the
  slot-uniqueness constraints that phase has to reason about anyway. Registered
  in [mission.md](../mission.md#owner-decisions) and added to Phase 6 in the
  [roadmap](../roadmap.md#phase-6--booking).
- **The upcoming/past boundary is a build-time fact.** The route prerenders, so
  the instant the split is measured against is the moment of the build, and an
  appointment crosses from *Still to come* to *Already seen* when the site is
  rebuilt rather than when its hour arrives. Written into D7. It is D12's
  staleness rather than a new one, but it is the first place in this project
  where prerendering changes what a page *means* rather than only how fresh it
  is — which makes it Phase 6's problem in a more pointed way than `/` ever was.

**C26 is open.** The evidence its row names — the production build at 393px, on
Bodhi's and Atlas's files and the unknown-patient page — has to be read by a
human, and the verdict recorded here with its author and date. The Phase 2 walk
is the argument for not skipping it: the capture taken for that phase's
judgement check is what found a ragged grid row no automated check would have
caught.

**B8 is open.** Pushing the branch alone produces no run — `push` has been
scoped to `main` since #11 — so the pull request is what makes the check
reachable.
