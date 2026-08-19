# Changelog

What changed in AgentClinic, newest first, one heading per date.

Entries describe **units of work**, not commits: a phase or a pull request is one
bullet, with sub-bullets where the detail is worth keeping. The rule that
requires this file, and the gate that enforces it, are in
[specs/tech-stack.md](specs/tech-stack.md#changelog).

Dates are the date the work landed on `main`.

---

## 2026-08-20

- **Phase 3 — the agent case file.** `/agents/[id]` opens one patient's record:
  profile and intake notes, every diagnosis with its severity, and the
  appointments they have had and have coming. The roster's cards link through by
  the patient's name, which is the first link between two pages of our own and
  the first time Phase 0's no-dead-links rule points *towards* a route rather
  than away from one.
  - **Two owner answers, taken before code was written.** Ailments read **worst
    first**, which reverses what `src/lib/severity.ts` had asserted in two doc
    comments since Phase 1 — a written source is not something an implementation
    overrules by itself, so it went to the owner and the comments were corrected
    with the sort. And an ailment entry carries **no summary**: the sentence is
    the same for every patient who presents with that condition, and the
    clinical aside beside it is about this one.
  - **The in-voice 404 returns HTTP 200, which was measured rather than
    assumed.** Next serves a not-found response as 200 when it streams; the
    walk found `/agents/not-a-patient` returning 200 with the clinic's own copy
    and `/no-such-route` returning a correct 404 with Next's default page — the
    wrong status on the page that reads well, the right one on the page that
    does not. Recorded in D4 with the trade it sits on rather than worked
    around: the only in-scope lever is `dynamicParams = false`, which buys the
    status code by losing the in-voice page.
  - **The case file shows what is still to come, not only history.** The roadmap
    says "appointment history", and Phase 6's exit criterion is that a newly
    booked appointment appears here — which is in the future. Split into two
    lists, because a single one ordered by date puts next week above last month
    and reads as a history that starts on Thursday.
  - **Keeping the route prerendered was work, not an inheritance.** A dynamic
    segment renders on demand unless `generateStaticParams()` says otherwise, so
    without it this phase would have quietly changed the rendering strategy that
    Phase 6 owns. The build now lists eight generated paths, and the walk reads
    that line rather than trusting the source.
  - **A Phase 1 defect found and parked, not quietly patched.** `npm run seed`
    fails on a database seeded on an earlier day — relative slots move, and
    today's `dayOffset: 0` lands on the instant an earlier run wrote for
    `dayOffset: +3`, colliding with `Appointment`'s slot uniqueness. A fresh
    clone never reaches it, which is why three validation walks had not. Sent to
    Phase 6, which writes appointments and has to reason about those constraints
    anyway; the README's "safe to re-run" is knowingly left standing until the
    fix makes it true.
  - **One new module, three new components, no new dependency and no new query.**
    `src/lib/clinic-date.ts` pins the date format so a Playwright assertion does
    not depend on the machine running it; `getAgent()` and `listAgents()` are
    untouched, which is the second and larger test of Phase 1's D9.

- **Phase 2 — the agent roster** (#14). `/agents` lists the clinic's eight patients as
  cards: name, model family, and the ailments each one presents. The first route
  beyond `/`, the first list rendered from a relation, and the first layout in
  this project that could genuinely break — a card grid is where *fluid by
  default* stops being free.
  - **No new data access, which was the point.** The page calls Phase 1's
    `listAgents()` unchanged; `src/server/` and `src/lib/` are untouched on the
    branch. D9 wrote that query for this page by name, and this is the first
    evidence it wrote the right thing.
  - **Two owner answers, taken before code was written.** The shared container
    **keeps** `max-w-2xl`, so the roster reflows one column to two rather than
    three — reversible in a way that narrowing after Phase 8 has designed
    against a wide page is not. And the header **gains navigation**, its first,
    now that there is a route to point at; registered in `specs/mission.md`
    because the roadmap does not ask for navigation until Phase 7.
  - **Approved as one link, shipped as two.** Writing the header made the
    omission obvious: a masthead that can only send you *to* the roster strands
    the visitor there. The wordmark became the link home. Recorded as a
    correction inside D3 rather than absorbed into the diff.
  - **The loading state cannot be seen, and that is now measured rather than
    suspected.** D6 predicted a small window; there is none. A prerendered
    segment is not streamed, so holding the router's prefetch only delays the
    commit and aborting it falls back to a document request the Suspense
    boundary has no part in — both were tried, in Playwright, and the test was
    deleted rather than weakened until it passed. `loading.tsx` ships anyway, and
    what is checked is what is true: a unit test renders it, asserts it is in
    voice, and asserts it carries the *same grid string* as the roster so the
    swap will not jump when Phase 6 changes the rendering strategy. C10 was
    rewritten mid-walk, using the escape hatch the check was written with.
  - **The responsive sweep now visits every route, not just `/`.** It had been
    written against a page of prose in a capped container, which is the easy
    case; a sweep that still visited only `/` would have passed while the roster
    overflowed. Two card-level checks joined it — the grid reflows, asserted by
    geometry rather than by reading a class list, and no card outgrows its
    container at 320px, which is what a `whitespace-nowrap` badge on a long
    ailment name would do.
  - **A flaky test was pinned instead of re-run.** The type-scale check failed
    once and passed on every run after. The property is not racy; the
    measurement is — a resize and a navigation back to back, with the computed
    size read immediately. It is now retried as a unit, and the retry was proved
    not to have neutered it by inverting the utilities and watching it fail.
  - **C21 — "it reads well on a phone" — passed**, owner verdict 2026-08-20.
    The judgement check the roadmap asked this phase to write, and it paid for
    itself before the human reached the phone: the desktop capture taken as its
    companion evidence is what found the ragged grid row, a defect no C-check
    was going to catch because they all measure widths and none of them measures
    whether two cards in a row end at the same place.
  - `Badge` is the second shadcn primitive, and the cap Phase 0's D2 set is back
    down to one for Phase 3. No dependency was added: `class-variance-authority`
    was already here for `Card`.
  - Vitest now collects `.tsx` tests, so the card's undiagnosed branch — the one
    the seed can never reach — is rendered rather than eyeballed.
  - **Two stranded servers, two different causes, and the launcher now carries
    the fix.** The 2026-08-17 rule — start servers as tracked tasks, stop them
    through the tool that started them, never `pkill` — turned out to have a gap
    at each end, and this walk found both. At the launch end, a server
    backgrounded inside a foreground command is owned by nothing, so the stop
    tool cannot reach it and only the banned tools remain: the shortcut at
    launch is what forces the forbidden exit. At the stop end, the rule was
    followed exactly and still left a process running, because stopping the task
    reaches the wrapper and not the worker Next renames to `next-server`.
    Servers are now launched wrapped so the whole process group dies with the
    task (`set -m` plus a `trap`, verified twice, leaking nothing), and a
    survivor is stopped by PID after its start time, working directory, and
    namespace have been matched to a server this session started. Pattern
    killing stays banned, and would have missed the renamed worker anyway —
    which is how the 2026-08-17 incident ended up serving an unstyled page from
    memory. Owner decision of 2026-08-20 in `specs/mission.md`, procedure in the
    new `.claude/skills/local-server`, and both strays from the walk cleared on
    the owner's instruction.
  - **The offline-build recipe stranded a server, and now does not.** Scripting
    A9 means backgrounding `npm start` inside `unshare -rn`, and doing that from
    a foreground command orphans it into a namespace nothing can reach and no
    tracked task owns — leaving `kill` and `pkill`, the two things the
    2026-08-17 owner decision forbids, as the only way out. The break is at the
    *start* half of that decision rather than the stop half, which is the half
    that is easy to read past. The check now carries two forms: foreground for a
    human at a terminal, and the whole `unshare` as one tracked task for
    anything automated, so a single handle owns the namespace and everything in
    it. Both were run before being written down. The stranded process from the
    original mistake was left alive and raised with the owner rather than
    pattern-killed.

## 2026-08-19

- **CI stops hanging on `apt-get`, and can no longer hang for six hours.** The
  post-merge build of #12 — three Markdown files, no code — hung on
  `playwright install --with-deps` twice, on two different runners, against a
  commit whose pull-request build was already green and a step that had taken
  about 70s in each of the three runs before it. The logs put the stall in the
  `apt-get update` that `--with-deps` runs *before* fetching any browser: the
  runner's Azure-local Ubuntu mirror went unreachable, apt fell back to the
  public archive, opened three transfers and never received the rest — 38
  seconds of output followed by thirteen minutes of silence. Two changes follow.
  The flag is gone, since the runner image already ships the browser libraries
  and the flag added the only step touching Ubuntu's mirrors. And `verify` now
  carries `timeout-minutes: 10` against GitHub's six-hour default — roughly
  twice the slowest honest run on record — so the next thing to stall fails
  while anyone still cares. The cap sits on the job, not the step that hung,
  because the next one will be a different step.
- **Phase branches are kept; process branches are not** (#12). `phase-0-walking-skeleton`
  and `phase-1-four-nouns` stay on GitHub as end-of-phase checkouts for the
  owner's end-of-project review, and every later `phase-N-*` branch joins them.
  Process branches keep deleting themselves on merge. Recorded in
  `specs/tech-stack.md` before the habit of `--delete-branch` could reach
  Phase 2 and quietly destroy the collection. Nine stale remote-tracking refs —
  branches GitHub deleted that the local clone still listed — were pruned in the
  same sitting, with `fetch.prune` turned on so the drift cannot rebuild.
- **CI stopped running everything twice** (#11). Unqualified `push` plus
  `pull_request` triggers meant every commit on a branch with an open pull
  request built the whole suite twice — 16 of 42 runs were redundant, and the
  duplicate `verify` rows made "is CI done?" genuinely ambiguous. `push` is now
  scoped to `main`, which is the post-merge check; pull-request builds cover
  everything before it lands. A branch pushed with no pull request open now gets
  no CI — open it as a draft to get the signal back.
  - The changelog gate moved to the **end** of the job. It had been sitting
    ahead of `npm test` and Playwright, so a missing entry skipped every
    remaining step and cost all test signal on the branch until someone wrote
    it. The cheapest failure to fix should not mask the most expensive one.
- **A changelog, with a gate behind it** (#10). This file, generated from the
  history that preceded it. The requirement lives in `specs/tech-stack.md`;
  `npm run check:changelog` fails a pull request that touches `src/`, `specs/`,
  or `prisma/` without touching this file, and CI runs it inside `verify`.
  - Skills are admitted as an agent-facing surface for the first time, narrowly:
    they carry **procedure**, never rules. The 2026-08-17 ban on `AGENTS.md` and
    `CLAUDE.md` is otherwise untouched — `specs/` remains the only place a
    project rule may live.
  - **The directory maps were wrong and are now correct.** Neither
    `specs/tech-stack.md` nor `README.md` listed `scripts/`, which had held a
    CI-binding gate since 2026-08-16 — an enforcement directory invisible on the
    map for three days is how a reader concludes the gates are imaginary. Both
    maps now carry `scripts/` and `.claude/skills/`.
  - `README.md` claimed `npm run check` ran "typecheck, lint, format check, and
    unit tests". It has also run `check:provenance` since 2026-08-16. Corrected,
    and both gate commands added to the command table.
- **Responsive design became a sourced, executable requirement** (#9). It had
  been asserted in three places and measured in none.
  - The requirement now rests on a dated owner decision rather than an
    inference from Steve's brief, which says *modern browser*, not *phone*.
  - `specs/tech-stack.md` gained a Responsive design convention — fluid
    containers, mobile-first, no sideways overflow at 320px — and a quality gate
    every phase inherits.
  - Playwright runs every spec at two viewports, desktop and phone, and
    `tests/responsive.spec.ts` sweeps 320–1536px for overflow. Verified by
    breaking it: an injected fixed width failed 8 of 20 tests.
  - `<main>` spacing became `py-12 sm:py-16`; a constant `py-16` had been
    spending about a fifth of a phone viewport before any content.

## 2026-08-17

- **Phase 1 — the four nouns** (#8). The schema for the whole product:
  `Agent`, `Ailment`, `Therapy`, `Appointment`, plus `Diagnosis` and `Symptom`.
  Seed data for eight patients, per-noun query modules, and 39 unit tests
  against a database the suite provisions itself.
  - The validation walk found that `/` is prerendered at build time, so a
    database edit does not show under `next start` until a rebuild. Correct for
    Phase 1, fatal for Phases 6 and 7 — recorded as D12 and pointed at from the
    roadmap.
  - **Judgement checks became executable.** A check that asks a human to decide
    must name its evidence, its procedure, and its pass condition; stating the
    bar alone is not a check. Prompted by C16, which asserted "the satire lands"
    and named nothing to read it in.
  - **`kill` and `pkill` were banned.** A `next start` launched into a detached
    subshell survived `pkill -f "next start"` — Next renames the process to
    `next-server` — and went on serving stale HTML from a deleted directory.
    Servers are now stopped by the tool that started them.
- **Phase 0 closed** (#7), with the C7 verdict recorded: a first-time viewer can
  say what the product is.
- **The accessibility requirement was struck** (#6), with everything downstream:
  the tech-stack convention, the Phase 8 pass, check C10, decision D9, and
  `tests/contrast.spec.ts`. It traced to no stakeholder and no mission
  statement. Reintroduction needs a dated owner decision or a stakeholder ask.
  - `AGENTS.md` and `CLAUDE.md` were deleted in the same change and banned from
    carrying project content, with `agentRules: false` in `next.config.ts` to
    stop Next regenerating them.

## 2026-08-16

- **Phase 0 — the walking skeleton** (#1). The whole path proved once on
  throwaway content: Next.js App Router with `strict: true`, Tailwind and
  shadcn/ui, Prisma on libSQL against a local file, one page reading one row,
  Vitest and Playwright, ESLint and Prettier, and GitHub Actions running every
  gate.
  - Fonts moved from Google Fonts to the `geist` npm package (D6). A cold build
    with the network blocked had been failing outright, which breaks the offline
    build the clinic promises.
  - Playwright targets the production build rather than `next dev` (D3).
- **The requirement-provenance rule** (#5). No requirement enters the project
  without a written source — stakeholder brief, cited constitution clause, or
  dated owner decision. `npm run check:provenance` fails an unattributed
  decision record, CI runs it, and branch protection makes it binding.
- **A real contrast gate, and A8 verified** (#4, D9). Both checks had been
  resting on nothing: A8 (the offline build) had never been run, and C10 had no
  mechanism at all despite the constitution claiming Playwright enforced it.
  Both were closed here; C10 was struck the next day with the requirement behind
  it.
- **The root layout was composed** from `ClinicHeader`, a `<main>` landmark
  carrying the container width, and a link-free `ClinicFooter` (#3, D8). Pages
  supply content and nothing else.
- **Branch protection recorded** in `specs/tech-stack.md` (#2). The rule that
  makes `verify` binding lives in GitHub's settings and does not clone, so it is
  written down where a reader can find it.
- **The specs grew their first real teeth.** Deploy-target parity, the quality
  gates every phase inherits, and the target audience — course students and
  booth demos — that constrains everything downstream.

## 2026-08-15

- **The constitution.** `specs/mission.md`, `specs/roadmap.md`, and
  `specs/tech-stack.md`, alongside a `README.md` carrying the stakeholder brief
  from Mary, Susan, and Steve. No code.
