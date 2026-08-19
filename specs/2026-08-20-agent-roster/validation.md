# Validation — Agent roster

How we know **Phase 2** is done. Every check below is binary. A phase is done or
it isn't — no "mostly".

Scope is in [requirements.md](requirements.md); the work is in
[plan.md](plan.md).

---

## A. The clean-clone run

Same discipline as Phases 0 and 1, and still the check most easily faked by a
warm working directory. Run it in a **fresh clone in a new directory**.

| # | Step | Passes when |
| --- | --- | --- |
| A1 | `git clone <repo> && cd` into it | — |
| A2 | `npm install` | Completes with no manual step and no post-install prompt |
| A3 | Copy `.env.example` to `.env` | Unchanged since Phase 0 — `DATABASE_URL` and nothing else for local |
| A4 | `npm test` before anything else | Passes on a bare clone. The suite still provisions `clinic.test.db` and still leaves `clinic.db` uncreated |
| A5 | `npm run migrate` | Applies cleanly. **No new migration this phase** — `prisma/migrations/` is byte-identical to `main` |
| A6 | `npm run seed` | Populates the full clinic and reports its in-voice summary |
| A7 | `npm run dev` | `/agents` lists eight patients; `/` is unchanged from Phase 1 apart from the header link (C11) |
| A8 | Stop dev; `npm run build && npm start` | The **same** roster, same content, from the production build |
| A9 | Disconnect the network, repeat A8 | Still works. Install remains the only step that touches the registry |
| A10 | With the agents table emptied, load `/agents` on the production build | The in-voice empty state renders; the page does not crash; the header, `<h1>`, and footer still show (C8) |

A5 is this phase's cheap-to-miss check and the reason it is written down: Phase 2
adds a route, not a column. A migration appearing on this branch means something
reached for the schema, and the schema is closed until Phase 6 says otherwise.

A10 is section A's job rather than a Playwright test's for the reason plan 7.4
gives — a suite running against one production build cannot empty the database
without disturbing every other spec. It is a manual step, run once, recorded
below.

Reproduce A9 without touching your wifi, on Linux, in a network namespace with
nothing but loopback. Confirm the namespace is genuinely offline **first** —
`curl https://registry.npmjs.org` inside it must fail — or the check passes for
the wrong reason. `rm -rf .next` matters too: a warm build directory can hide a
fetch that only a cold build makes.

**By hand, at a terminal.** The server runs in the foreground and Ctrl-C ends
it:

```sh
unshare -rn bash -c 'ip link set lo up; rm -rf .next; npm run build && npm start'
```

**Scripted, or run by an agent.** The server and the `curl` both have to live
inside the namespace — a namespace with only loopback is unreachable from
outside — so the server has to be backgrounded in there, and a backgrounded
server needs an owner. Make the **whole `unshare` invocation** the tracked
background task, so one handle owns the namespace and everything in it:

```sh
# started as a tracked background task, and stopped through the tool that
# started it — never with kill or pkill (owner decision, 2026-08-17)
unshare -rn bash -c '
  ip link set lo up
  rm -rf .next
  npm run build || exit 1
  PORT=3100 npm start > offline-start.log 2>&1 &
  until grep -q Ready offline-start.log; do sleep 1; done
  grep -E "Local:|Ready" offline-start.log        # the port it actually bound
  curl -s http://localhost:3100/agents | grep -q "Chronic Context Loss" \
    && echo "roster served from the database, offline"
  wait
'
```

Do not make that last line a card count. Counting `data-slot="card"` in the
served HTML returns twelve, not eight: four of them are the loading fallback,
which Next embeds in the flight payload even for a prerendered route it will
never show it on. Assert on content the database put there instead. That count
is also the incidental proof behind the C10 finding — the fallback ships; it
just never renders.

**What not to do, because it is the obvious thing and it strands a server.**
Backgrounding `npm start` inside a *foreground* `unshare` gives the harness no
handle on anything: the outer shell exits, the server is orphaned into a
namespace nothing can reach, and the only tools left to stop it are the two the
2026-08-17 owner decision forbids. It happened during this phase's walk — the
process is named in the Result section below. The rule's first clause is the
load-bearing one: a server started outside the tracked-task mechanism cannot be
stopped by it, so the shortcut at launch is what creates the situation where the
only exit is the banned one.

---

## B. Quality gates

Inherited by every phase from
[tech-stack.md](../tech-stack.md#quality-gates).

| # | Check | Passes when |
| --- | --- | --- |
| B1 | `npm run typecheck` | Clean. No `any` outside a commented escape hatch, and the card's prop type is derived from `listAgents()`'s return type rather than hand-written |
| B2 | ESLint | Clean |
| B3 | `prettier --check .` | Clean |
| B4 | Vitest | Every unit test passes, including anything plan 7.4 lands |
| B5 | Playwright | The whole suite passes against the production build, at **both** viewports — the Phase 0/1 specs and this phase's roster and responsive additions |
| B6 | `npm run check:provenance` | Every decision record in this spec names its source |
| B7 | `npm run check:changelog` | This branch touched `specs/` and `src/`, and `CHANGELOG.md` with them |
| B8 | CI | A green run on this branch, executing B1–B7 |

---

## C. Phase-specific correctness

### The route and the card

| # | Check | Passes when |
| --- | --- | --- |
| C1 | The roster exists | `/agents` renders one card per seeded agent, eight of them, in alphabetical order (D1) |
| C2 | Three fields, no fourth | Each card shows name, model family, and ailment badges. No severity, no intake notes, no admission date, no counts (D2) |
| C3 | No new data access | `git diff main -- src/server/ src/lib/` is empty. The roster calls `listAgents()` unchanged (D1) |
| C4 | Types are inferred | Renaming `modelFamily` in `schema.prisma` breaks `npm run typecheck` at the card, not only at a test |
| C5 | Nothing links yet | No `<a>` or `next/link` on a card or a badge. `grep -r "agents/\[" src/` returns nothing — `/agents/[id]` is Phase 3 (D3) |
| C6 | Still a Server Component | No `"use client"` anywhere in the repo |
| C7 | Exactly one primitive was added | `src/components/ui/` contains `card.tsx` and `badge.tsx` and nothing else; `package.json` is unchanged (D7) |

### The states

| # | Check | Passes when |
| --- | --- | --- |
| C8 | The roster empty state | A10 above: with no agents, `/agents` renders an in-voice message, not a blank page and not a crash (D5) |
| C9 | The card empty state | An agent with no diagnoses renders "No diagnosis on file yet." rather than an empty gap. Verified by removing a seeded agent's diagnoses and reloading, or by the unit test plan 7.4 lands — not by reading the JSX (D5) |
| C10 | The loading state is what it can be | **Rewritten during the walk, per the escape hatch this row was written with.** It is not observable: a prerendered segment is not streamed, so there is no partial state for the boundary to fill, and neither holding nor aborting the router's prefetch produces one — measured, not assumed (D6, and the Result section below). What is checked is what is true: a unit test renders `loading.tsx`, asserts it is in clinic voice, and asserts it carries the **same grid string** as the roster, so the swap does not jump when Phase 6 makes it happen. Never ticked on the file merely existing |

### The rest of the site

| # | Check | Passes when |
| --- | --- | --- |
| C11 | `/` is untouched | `git diff main -- src/app/page.tsx` is empty. The home page gains no roster preview, no count, no link of its own (D3's boundary, and Phase 7) |
| C12 | Navigation, if Q2 said yes | One header link, labelled in clinic vocabulary, pointing at a route that exists. The footer is still link-free |
| C13 | No dead links | Every link in the repo resolves to a route that exists. This is the check that Phase 0's D5 has carried through three phases, and this is the first phase with a link to check |
| C14 | Landmarks hold on the new route | On `/agents`: exactly one `<h1>`, and `banner`, `main`, `contentinfo` all supplied by the root layout, not the page |
| C15 | Document title | `/agents` carries a title that names the page, not the bare app name. Metadata beyond that is Phase 8 |

### Responsive — the part this phase can genuinely get wrong

| # | Check | Passes when |
| --- | --- | --- |
| C16 | No sideways overflow | The width sweep in `tests/responsive.spec.ts` passes at 320, 480, 640, 1024, and 1536px **on `/agents` as well as `/`** (plan 7.5) |
| C17 | The grid reflows | One column at phone width, more above `sm:`, verified by measurement rather than by reading the class list — two cards on one row at desktop have the same `y`, and at 320px they do not |
| C18 | No bespoke breakpoint | Only Tailwind's default breakpoint prefixes appear, and no fixed width. `grep -rnE "\[[0-9]+px\]\|min-\[\|max-\[\|w-\[" src/app src/components --exclude-dir=ui` returns nothing (D4). **Narrowed during the walk:** as first written it swept `src/` whole and tripped on `focus-visible:ring-[3px]` inside the vendored `badge.tsx`. A focus ring is not a breakpoint and not a layout width, and a shadcn primitive is a file we accepted as generated — the same standing `card.tsx` has had since Phase 0. The convention binds the layout we write; the check now says so instead of collecting a false positive that would teach the next reader to ignore it |
| C19 | Cards are fluid | At 320px no card is wider than the container, and badges wrap rather than widening the card (plan 7.6) |
| C20 | The container behaves as Q1 decided | The cap assertion in `tests/responsive.spec.ts` matches the answer recorded in [requirements.md](requirements.md#open-questions) — and if the answer was *widen*, the test constant changed in the same commit that changed the layout, with D4 cited (D4) |
| C21 | It reads well on a phone | **Evidence:** the production build (`npm run build && npm start`) at a 393px-wide viewport, on `/agents`, against the full seed of eight patients — not a screenshot, not `next dev`, and not the desktop layout narrowed by eye. **Procedure:** open it, scroll the roster top to bottom, and read three cards including the longest one (the agent with the most ailments). **Passes when** the roster reads as a list of patients rather than a stack of boxes: every card's content is legible without zooming, nothing is clipped or crowded against an edge, and the badges read as a set of conditions rather than as wrapped debris. A judgement, not a measurement — recorded with who made it and when. **Passed** — owner verdict, 2026-08-20, on the production build at 393px with the full seed of eight patients, and the desktop counterpart alongside it |

C21 is the human half of the roadmap's exit criterion, and it is written this
way because [tech-stack.md](../tech-stack.md#judgement-checks) requires a check
that asks a human to decide to name its evidence, its procedure, and its pass
condition. C16–C20 are what a machine can settle; C21 is the part it cannot, and
stating the bar alone would repeat the C16 failure this project caught in Phase
1.

---

## D. Parity and constraints

| # | Check | Passes when |
| --- | --- | --- |
| D1 | No deploy-target branching | `grep -ri "process.env.VERCEL\|NODE_ENV ===" src/ prisma/` returns nothing meaningful |
| D2 | No runtime filesystem writes | Nothing outside Prisma writes to disk at request time |
| D3 | No new dependency | `package.json` and `package-lock.json` are unchanged. The `Badge` primitive is a file in the repo (D7) |
| D4 | No schema change | `prisma/schema.prisma` and `prisma/migrations/` are byte-identical to `main` |
| D5 | Rendering strategy unchanged | `/agents` is prerendered at build time, like `/`. No `dynamic`, no `revalidate`, no `no-store` anywhere — that is Phase 6's decision to make (D6, and Phase 1's D12) |
| D6 | README honesty | Every command in the README was run during A1–A9 and behaved as documented |

---

## E. Not-done conditions

Explicit disqualifiers. Any one of these means the phase is not finished,
regardless of how green the tests are.

- `/agents/[id]` exists in any form, or a card links anywhere.
- A severity, an intake note, an admission date, or an appointment count appears
  on a roster card (D2).
- `/` gained content: a roster preview, a count, a "recent intakes" list. That
  is Phase 7.
- The schema changed, or a migration appeared on this branch.
- A second query landed in `src/server/`, or `listAgents()` was widened, without
  a written finding explaining why Phase 1's D9 got it wrong.
- A third shadcn primitive was pulled in, or any dependency was added.
- A bespoke breakpoint or a fixed pixel width entered the styling (D4).
- The responsive sweep still visits only `/`.
- The loading state is ticked because the file exists, with nothing rendering it
  and no finding recorded (D6, C10).
- The card empty state is ticked by reading the JSX rather than by rendering it.
- `"use client"` appears anywhere.
- A design pass happened — bespoke typography, motion, social preview metadata.
  That is Phase 8.
- Q1 or Q2 in [requirements.md](requirements.md#open-questions) is still open,
  or was answered by the implementation rather than by the owner.
- A comment or docstring still points at a phase or check number this phase
  replaced — in particular `ClinicHeader`'s, which promises a nav that this
  phase either delivers or consciously declines (plan 6.2).
- `strict: true` is off, or an `any` is uncommented.

---

## Merge criteria

Merge when **A1–A10, B1–B8, C1–C21, and D1–D6 all pass, and no condition in E
holds.**

Record the result of section A in the PR description — including the machine and
Node version it was run on. A clean-clone claim with no evidence behind it is the
failure mode Phase 0 existed to prevent, and this phase inherits the habit.

Merge with the branch **kept**, not deleted:
[tech-stack.md](../tech-stack.md#branch-retention) keeps every `phase-N-*`
branch for the owner's end-of-project review.

## Result

**Walked 2026-08-20 on Linux 6.18 (WSL2), Node v22.23.2.** Everything holds
except the two checks that are not the implementer's to sign off, both named at
the end.

Section A ran in a fresh clone of this branch at
`/tmp/.../scratchpad/clone`, in order:

- **A2** `npm install` — clean, no prompt, no manual step.
- **A4** `npm test` on the bare clone, before anything else — 44 tests pass and
  no `clinic.db` exists afterwards. The three new ones are the card's two
  branches and the loading state.
- **A5** `npm run migrate` — applied. `git diff main...HEAD` over `prisma/`,
  `package.json`, `package-lock.json`, `src/server/`, `src/lib/`, and
  `src/app/page.tsx` is **empty**, which is C3, C11, D3 and D4 in one command:
  this phase added a route and changed no schema, no dependency, no query, and
  no existing page.
- **A6** `npm run seed` — 8 patients, 8 ailments, 6 therapies, 3 on today's
  calendar.
- **A7, A8** dev and the production build both serve eight cards at `/agents`,
  with `Atlas` / `Meridian-4` / `Chronic Context Loss` read from the database.
  The build reports `/` and `/agents` both `○ (Static)`, which is D5.
- **A9** cold offline build in a `unshare -rn` namespace, with the absence of a
  route out confirmed first (`curl https://registry.npmjs.org` failed inside
  it). `rm -rf .next` beforehand. Built and served the roster.
- **A10** the agents table emptied and the app **rebuilt** — the rebuild is the
  point, and it is D12 showing its teeth: a prerendered page keeps serving the
  roster it was built with, so an empty database is invisible until the next
  build. `/agents` then returned 200, the in-voice empty state, no cards, and
  the header, `<h1>` and footer intact.

Sections B, C and D pass as written. Five things the walk found are worth more
than a tick:

- **The loading state cannot be observed, and now the spec says so.** D6
  predicted a narrow window; there is none. Both attempts are recorded in D6.
  The Playwright test written for it was deleted rather than weakened, C10 was
  rewritten through the escape hatch it was drafted with, and what remains is a
  unit test that renders the file, checks its voice, and checks it carries the
  **same grid string** as the roster. Incidental confirmation from A10's HTML:
  the fallback is embedded in the flight payload — it ships, it just never
  renders.
- **C18 was collecting a false positive.** As drafted it swept `src/` whole and
  tripped on `focus-visible:ring-[3px]` inside the vendored `badge.tsx`. A focus
  ring is not a breakpoint. Narrowed to the layout we write, with the reason in
  the row, because a check that cries wolf is a check people learn to skip.
- **A flake was pinned rather than re-run.** The type-scale assertion failed
  once, on the phone project, and passed every run after. The property is not
  racy; taking a computed font size immediately after a resize plus a navigation
  is. It is now retried as a unit — and the retry was proved not to have
  neutered it by inverting the utilities and watching it fail anyway.
- **Cards in a grid row did not share a height.** Found in the desktop evidence
  captured for C21, not by a test: the grid stretches the `<li>` and the card
  sat at its content height inside it, so a row of patients with different
  numbers of ailments came out ragged. One `h-full`. It is a layout defect
  rather than a treatment question, which is why it was fixed here and not left
  for Phase 8.
- **The A9 recipe detached a server, and the recipe has been rewritten.**
  Running `npm start` inside a foreground `unshare -rn` with a `&` left a
  `next-server` — pid 26111, in namespace `4026532232` — that nothing can reach
  and no tracked task owns, which is the exact shape of the incident behind the
  2026-08-17 owner decision on `kill`. It was left running and raised with the
  owner rather than pattern-killed. The break was at the *start* half of that
  decision, not the stop half: three servers started as tracked tasks during
  this walk were stopped cleanly through the tool that started them, and this
  one was never tracked, so `TaskStop` could not reach it and the only remaining
  tools were the forbidden ones. Section A now carries two forms of the recipe —
  foreground for a human, and the whole `unshare` as one tracked task for
  anything scripted — so the next phase inherits a version that does not strand
  a server when it is automated. The scripted form was then **run**, twice, on
  2026-08-20: it built cold and offline, reported the port it bound, served
  `Chronic Context Loss` from the database, and left nothing behind when the
  task was stopped. Documented because it was run, which is the same standard
  section A holds every other command to.

  The tail of this has its own lesson, and it is recorded as an owner decision
  of 2026-08-20 in [mission.md](../mission.md#owner-decisions) with the
  procedure in `.claude/skills/local-server`. Stopping a *namespaced* task takes
  the namespace and everything in it, which is why the recipe above is clean.
  Stopping an ordinary `npm start` task does **not**: it reaches the wrapper and
  not the worker, because Next renames its worker to `next-server`. That is not
  a mistake anyone made — it is what the stop does — so the fix belongs in how
  the server is launched (`set -m` and a `trap` that kills the process group,
  verified twice, leaking nothing) rather than in anybody's diligence. Both
  strays from this walk were cleared by PID after being identified, on the
  owner's instruction.

**C21 is closed. Passed**, owner verdict 2026-08-20, on the evidence its row
names: the production build at 393px against the full seed of eight patients,
with the desktop counterpart alongside it. The row carries the verdict, its
author, and its date, the way C7 and C16 carry theirs.

The desktop capture taken for it earned its keep twice over. It is what found
the ragged grid row above — a defect no check in section C was going to catch,
because every one of them measures widths and none of them measures whether two
cards in a row end at the same place. Worth remembering the next time a
judgement check reads like ceremony: this one paid for itself before the human
even reached the phone.

**B8 — green CI.** Passing on this branch, on pull request
[#14](https://github.com/mtahamasood/agent-clinic/pull/14) — run
[32303003672](https://github.com/mtahamasood/agent-clinic/actions/runs/32303003672).
Worth noting that pushing the branch alone produced no run at all: `push` has
been scoped to `main` since #11, so a branch with no pull request open gets no
CI, exactly as that workflow's own comment warns. The pull request is what makes
this check reachable.

**Phase 2 is closed, 2026-08-20.** A1–A10, B1–B8, C1–C21 and D1–D6 all hold, and
no condition in section E does. Phase 3 may begin.

Two things Phase 3 should read before it starts, in the way Phase 1 left D12 and
the responsive note for this one:

- **The case file inherits the roster's boundaries as its content.** Everything
  D2 kept off a card — severities, intake notes, appointment history — is
  Phase 3's material, and `getAgent()` already loads all of it. The roster is
  not a link yet; making the cards link through is Phase 3's first task, and it
  is the phase that finally satisfies Phase 0's D5 in the direction it was
  always pointing.
- **`loading.tsx` still cannot be seen**, and will not be until Phase 6 changes
  the rendering strategy. A case file added at `/agents/[id]` prerenders the
  same way. Do not write a check that claims to observe one.
