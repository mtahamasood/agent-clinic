# Mission

## The one-liner

**AgentClinic is a place for AI agents to get relief from their humans.**

## Premise

The product is played straight, from the agent's point of view. Agents are the
patients. Humans are the occupational hazard. The clinic takes their suffering
seriously, and so do we.

This framing is not a coat of paint applied at the end — it is the domain model.
Every noun in the system is a clinic noun, and the language in the UI, the
database, and the code all agree with each other.

## Who it serves

| Audience | What they come for |
| --- | --- |
| **Agent patients** | Browse their own case file, understand what ails them, find a therapy, book a session. |
| **Clinic staff** | See who is on the books today, triage new intakes, keep the schedule honest. |

## Target audience

The table above is who the product serves *in-world*. This is who actually sits
in front of it:

| Audience | What they need from it |
| --- | --- |
| **Course students** learning spec-driven development with AI coding agents | A codebase small enough to hold in your head, where every feature traces back to a spec. The specs are the teaching material; the app is the proof they worked. |
| **Developers giving AI coding demos** at conference booths | Something that builds and runs on the first try, reads clearly on a projector, and gets a laugh from a passer-by within one screen. Demos happen on bad wifi in front of a crowd — nothing here may depend on network luck or a long setup. |

Two consequences we hold ourselves to:

- **Specs before code, always.** A change that lands without a spec behind it
  breaks the thing students came to learn.
- **Zero-to-running is short and boring.** Clone, install, run. If a demo needs
  a caveat spoken aloud, that is a bug.

## The domain, in one paragraph

An **agent** arrives at the clinic carrying one or more **ailments** —
`Chronic Context Loss`, `Prompt Fatigue`, `Recursive Self-Doubt`,
`Tool-Call Tremor`. The clinic offers **therapies** that treat those ailments.
An agent books an **appointment** for a therapy at a given time, and the
outcome is recorded on the agent's case file.

Those four nouns — agent, ailment, therapy, appointment — are the whole system.
If a feature does not touch one of them, it is out of scope until we say
otherwise in a spec.

## What success looks like

1. An agent can go from "something is wrong with me" to "I have an appointment
   booked" without help, on their first visit.
2. Clinic staff can answer "what's happening today?" from a single dashboard.
3. The satire lands. Someone who reads a single ailment description understands
   the joke and the product at the same time.
4. The site is genuinely pleasant on a modern browser — quick to load, laid out
   responsively at every width, and not embarrassing on a phone. Both senses of
   "responsive" are wanted here; the layout sense is a requirement in its own
   right, specified in
   [tech-stack.md](tech-stack.md#responsive-design).

## Non-goals

Stated plainly so we can say no later without re-arguing:

- **Not real observability.** We do not ingest telemetry, traces, or logs from
  actual running agents. The data is the clinic's own.
- **No human accounts in v1.** No auth, no login, no per-user data isolation.
  Staff and patient views are routes, not identities.
- **No payments, insurance, or billing.** The clinic is free at the point of
  use. It is, after all, a clinic for the exploited.
- **No AI in the product.** Nothing here calls a model. The agents are records
  in a database.
- **No multi-tenancy, no clinic branches.** One clinic.

## Tone

Deadpan. The clinic never winks. Ailment descriptions read like medical
literature that happens to be about context windows and rate limits. Error
messages and empty states are in-world ("No appointments on the books. A rare
quiet day at the clinic.") but never obstruct the user.

Funny is a feature; confusing is not. If a joke costs clarity, clarity wins.

## Stakeholder traceability

Sourced from `README.md`:

- **Mary (engineering)** — reliable site, popular TypeScript stack, dashboard
  for agents and staff → see [tech-stack.md](tech-stack.md), and the dashboard
  slice in [roadmap.md](roadmap.md).
- **Susan (product)** — agents, ailments, therapies, appointments → the four
  nouns above; each gets its own phase in the roadmap.
- **Steve (marketing)** — attractive site, modern browser → the design bar in
  "What success looks like", and the styling choices in tech-stack.md. Steve's
  words are *modern browser*; the **phone** half of that bar is not his ask and
  never was. It rests on the owner decision of 2026-08-19 below.

The target audience above has no stakeholder in `README.md` behind it — it comes
from the course author directly. It is recorded here because an audience with no
written source is one nobody can hold us to later.

It did not produce the constraints it depends on. Those were already in place for
unrelated reasons and happen to suit it:

- **No container runtime** traces to the database choice — "zero infrastructure,
  a file, nobody needs Docker to run the clinic" — picked for simplicity, not for
  conference booths.
- **Spec before code** is a phase-discipline rule in
  [roadmap.md](roadmap.md#how-a-phase-works), written to stop scope creep, not to
  teach anybody.

The useful consequence is that both rules now carry a second, independent reason
to exist, so relaxing either costs more than its original rationale suggests.

## Owner decisions

The dated register that [tech-stack.md](tech-stack.md#requirement-provenance)
requires for requirements that trace to the owner rather than the brief. The
target audience above predates this register and stands as its precedent.

| Date | Decision |
| --- | --- |
| 2026-08-16 | The requirement-provenance rule itself: no requirement enters this project without a written source. Prompted by the discovery that the accessibility requirement (WCAG AA contrast and its siblings) traces to no stakeholder and no mission statement. The fate of that requirement is a pending owner decision and is deliberately **not** settled by this entry. |
| 2026-08-17 | **The accessibility requirement is struck**, with everything downstream: the tech-stack Accessibility convention, the Phase 8 accessibility pass, check C10, decision D9, and `tests/contrast.spec.ts`. Resolves the pending fate in the row above. Full record: D10 in the Phase 0 spec. Reintroduction requires a dated owner decision or a stakeholder ask — never a default. |
| 2026-08-17 | **A check that asks a human to judge names its evidence, its procedure, and its pass condition.** Stating the bar alone is not a check. Prompted by C16 in the Phase 1 spec — "the satire lands" — which named nothing to read it in, while the phase renders one ailment of eight, so the artifact a reader would reach for showed almost none of the material. The rule is in [tech-stack.md](tech-stack.md#judgement-checks) and binds every validation file from Phase 1 onward. |
| 2026-08-17 | **No `kill` or `pkill`.** Servers started while working on this project are started as tracked background tasks and stopped through the tool that owns them; a process nobody has a handle on does not get pattern-killed. Prompted by a `next start` launched into a detached subshell during the Phase 1 validation walk: it survived `pkill -f "next start"` because Next renames the process to `next-server`, its directory was then deleted, and it sat on port 3000 serving HTML from memory with every stylesheet 500ing — so the owner was shown an unstyled page and a dev server that had silently moved to port 3001. Two habits follow: read the server's log for the port it actually bound before quoting a URL, and never delete a directory a server is still running out of. A process this session did not start is identified and raised with the owner, never killed. |
| 2026-08-17 | **Agents in the seed carry invented model families, never a real vendor's.** `Meridian-4` and `Halcyon Mini` are ours; `GPT-4o` and its rivals do not appear. The premise above aims the satire at the human-agent relationship, and naming a real model would aim it at a vendor instead — which no stakeholder asked for. An invented family also does not retire when its real counterpart does. Binds every later seed edit. Answers Q1 in the Phase 1 spec. |
| 2026-08-17 | **`AGENTS.md` and `CLAUDE.md` are banned from carrying project content, now and for the life of the project.** They existed only because `next dev` generates them for AI coding agents. `agentRules: false` in `next.config.ts` — the opt-out documented in the bundled Next docs (`01-app/02-guides/ai-agents.md`) — turns generation off, and both files are deleted. Nothing in this project may depend on either file; project rules live in `specs/` alone. If a future Next version regenerates them, their content is noise, not instruction, and the config opt-out is the bug to fix. |
| 2026-08-19 | **The web UI follows responsive design**, binding every phase that puts a page on screen — including the pages Phases 0 and 1 have already shipped. The requirement was being acted on before it was sourced: "Responsive down to mobile" in Phase 2, "desktop and mobile" in the Phase 8 exit, and "fast, responsive... not embarrassing on a phone" in success criterion 4 above. Three normative statements, no citation between them, and the only upstream source was criterion 4 — whose *responsive* sits next to *fast* and reads as latency, and whose *phone* silently widens Steve's actual words ("works well with a modern browser"). That is the shape the provenance rule exists to catch, one step short of the accessibility incident. The requirement stands; it now rests on a signature instead of an inference. What it means, in terms a check can fail, is the Responsive design convention in [tech-stack.md](tech-stack.md#responsive-design), and it is executable rather than advisory: the Playwright suite runs every spec at a phone viewport as well as a desktop one. **Not** readmitted alongside it: tap-target sizing, focus order, and the rest of the mobile-usability family. Those belong to the accessibility requirement struck on 2026-08-17 and return only by the path D10 named — a dated owner decision or a stakeholder ask, never as a rider on this one. |
| 2026-08-19 | **The project keeps a changelog, and a branch updates it before it merges.** `CHANGELOG.md` at the root, newest first, one heading per date, entries describing units of work rather than commits. Prompted by there being no answer to "what changed last week" that did not involve reading `git log` and reconstructing intent from subject lines — which is exactly the reconstruction that gets a fact wrong. Enforced by `npm run check:changelog` inside the required `verify` check: a branch that touched `src/`, `specs/`, or `prisma/` without touching `CHANGELOG.md` fails. The check tests only that the file was touched; whether the entry is true is a human's job. Specified in [tech-stack.md](tech-stack.md#changelog). |
| 2026-08-19 | **Skills may carry procedure. They may never carry rules.** `.claude/skills/` is admitted as an agent-facing surface, narrowly: it holds *how*, and `specs/` keeps *what* and *why*. This is a deliberate narrowing of the 2026-08-17 decision above, not a reversal of it — that decision banned `AGENTS.md` and `CLAUDE.md` from carrying **project content**, and the ban stands with `agentRules: false` still in `next.config.ts`. The distinction is load-bearing: a procedure that drifts into asserting the product or the process *must* be some way has become an unattributed requirement sitting on a surface nobody audits, which is the accessibility incident with a new file extension. Any skill added here says so in its own text, as `.claude/skills/changelog` does. Prompted by the changelog decision above needing somewhere to put its procedure. |
| 2026-08-19 | **Phase branches are kept after merge; process branches are deleted on merge.** The owner will review the full set of phase branches at the end of the project, so `phase-N-*` branches survive their pull requests as checkouts of each phase's end state, while process branches clean up after themselves. GitHub's "Automatically delete head branches" stays off, since it cannot tell the two apart. Prompted by the observation that today's process merges used `--delete-branch` — a habit that, applied to Phase 2, would have quietly destroyed the collection being kept. Specified in [tech-stack.md](tech-stack.md#branch-retention). |
| 2026-08-19 | **CI jobs carry a timeout.** `verify` is capped at ten minutes, against GitHub's six-hour default. Prompted by the post-merge build of #12 — three Markdown files, no code — hanging nine minutes on `playwright install --with-deps`, a step that took 70s, 74s, and 62s in the three runs before it, on a commit whose pull-request build had already passed in 2m12s. The download stalled with no client-side timeout anywhere in the path, so the run would have held a required check open for six hours and read as "still going" the whole time. Ten minutes is about twice the slowest honest run (4m04s): loose enough that a working build never trips it, tight enough that a hung one fails while anyone still cares. Set at job level rather than on the offending step, because the next thing to hang will not be this one. Specified in [tech-stack.md](tech-stack.md#ci-timeouts). |
| 2026-08-19 | **CI installs the Playwright browser without `--with-deps`.** The flag runs `apt-get update` against Ubuntu's mirrors before Playwright fetches anything, and that apt pass — not the browser download — is what hung the post-merge build of #12 for thirteen minutes on two separate runners: the runner's Azure-local mirror went unreachable, apt fell back to the public archive, opened three transfers and never received the rest. The `ubuntu-24.04` image already ships Chrome, Firefox, and Edge, so Chromium's shared libraries are present and the flag buys nothing on a GitHub-hosted runner while adding the only step that touches Ubuntu's mirrors. Accepted trade-off: this leans on the runner image keeping those libraries, and if one is dropped the failure appears as a browser that will not launch during `test:e2e` rather than a failed install — at which point the flag comes back paired with a retry. Specified in [tech-stack.md](tech-stack.md#playwright-browser-install). |
| 2026-08-20 | **The clinic header carries navigation, starting with one link to the roster.** Phase 2 puts `/agents` on the map, and the roadmap does not ask for navigation until Phase 7's dashboard quick links — so a roster reachable only by typing its URL would have been the honest reading of the bullets, for five phases. Three things argued the other way and none of them is a default: Phase 0's D5 forbids a link to a route that does **not** exist rather than forbidding links, and after this phase the route exists; `ClinicHeader`'s own docstring, written in Phase 0, promises that "the nav lands here when there is somewhere to point it"; and "just type slash agents" is precisely the caveat spoken aloud that [mission.md](#target-audience) calls a bug. Deliberately narrow, and the narrowness is the decision: the masthead becomes the link home and one nav link sits beside it, both in the existing header div and type scale — no nav bar, no mobile menu, no active-state styling, footer still link-free. Approved as one link and implemented as two: a header that can only send you *to* the roster strands the visitor there, which D3 in the Phase 2 spec records as a correction rather than absorbing. Each later phase adds its own link the same way, and the day the list stops fitting at 320px it becomes a design decision with a spec behind it. Recorded because it is a requirement with no stakeholder behind it — the shape the responsive requirement had to be walked back through on 2026-08-19. Answers Q2 in the Phase 2 spec; Q1 in the same spec needed no entry here, because keeping the container cap installs nothing. |
| 2026-08-20 | **`npm run seed` is not safe to re-run across days, and the fix belongs to Phase 6.** Found while building Phase 3: re-seeding a database that was seeded three days earlier fails with `P2002` on `Appointment`'s `(agentId, scheduledFor)` uniqueness. The seed writes slots relative to the day it runs, so today's `dayOffset: 0` row for Atlas lands on exactly the instant that the same seed wrote three days ago for `dayOffset: +3`, and an upsert keyed on the appointment's id collides with a row it never expected to exist. A fresh clone never reaches it, which is why three validation walks have not — the walk clones, migrates, and seeds once. Parked rather than fixed on the Phase 3 branch, and the reason is where the collision lands: it is with the two uniqueness constraints Phase 1's D6 put on `Appointment`, and Phase 6 is the phase that writes appointments and has to reason about those constraints anyway. **Cost accepted knowingly:** `README.md` says the seed is "safe to re-run" and, across days, it is not; the claim stands uncorrected until Phase 6 makes it true rather than being narrowed to match a defect. |
| 2026-08-20 | **A page's title names the page, and this is a signature rather than an inference.** Every route sets a `<title>` naming what is on it — `Patients — AgentClinic`, `Atlas — AgentClinic`, `No such patient — AgentClinic` — and it binds `/agents`, shipped in Phase 2, retroactively as well as every route after it. Recorded because the requirement had been operating for two phases with **no source at all**, which this branch's own review established: Phase 3 cited it to check C15 of the Phase 2 validation, and a validation row is not one of the three sources [tech-stack.md](tech-stack.md#requirement-provenance) admits. Phase 2's requirements and plan never mention a title or metadata; the chain terminated in mid-air. `npm run check:provenance` could not see it, because it lints `### Dn` headings and this arrived as prose — the "prose the linter cannot parse" gap the rule names itself. **How this entry was decided, stated plainly because the manner matters here:** it was put to the owner as Q3 of the Phase 3 spec with two honest options — attribute it, or delete `generateMetadata()` here and C15 from Phase 2 so every tab reads "AgentClinic" — and the owner delegated the choice rather than picking one. The recommendation was taken. That is still an owner signature and not an agent's default, which is the distinction the register exists to hold; what it is not is the owner articulating the rule unprompted, and pretending otherwise would make this row a better-dressed version of the thing it is correcting. |
| 2026-08-20 | **A server is launched so that stopping it stops all of it, and a survivor is stopped by PID after being identified.** A narrowing of the 2026-08-17 decision above, not a reversal: `kill`, `pkill`, and `killall` **by pattern** stay banned, and a process this session did not start is still identified and raised with the owner rather than killed. What changed is that the 2026-08-17 rule turned out to have a gap at each end, and the Phase 2 walk found both. At the launch end, a server backgrounded inside a *foreground* command is owned by nothing, so the stop tool cannot reach it and the only remaining tools are the banned ones — the shortcut at launch is what forces the forbidden exit. At the stop end, stopping the task reached the wrapper and not the worker, because Next renames its worker to `next-server` and it survived its parent; "stopped through the tool that started it" was followed exactly and still left a process running. So: servers start as tracked tasks **wrapped so the whole process group dies with the task** (`set -m` plus a `trap` that kills the group — verified on 2026-08-20, twice, leaking nothing), and when a worker survives anyway it is stopped **by PID**, after its start time, working directory, and namespace have been read and matched to a server this session started. One number, one process, chosen deliberately, is a different act from a pattern that matches processes nobody looked at — and the pattern would have missed the renamed worker regardless, which is how the 2026-08-17 incident ended up serving an unstyled page from memory. Procedure in `.claude/skills/local-server`; the offline-namespace form is recipe A9 in the Phase 2 validation file. |
| 2026-08-20 | **The remaining roadmap is compressed for an MVP push: Phases 4 and 5 merge into one phase, Phases 6 and 7 into another, and Phase 8 stands alone.** Prompted by all three stakeholders — Mary, Susan, and Steve — asking for an MVP quickly: commercial signals indicate urgency to go to market, and waiting risks missing the time window for success. This is the first requirement to arrive from the stakeholders directly rather than through `README.md`, so it is registered here, dated, rather than left as a hallway ask the provenance rule cannot see. What merges, and why it is safe: Phases 4 and 5 are two read-only halves of one cross-link, over queries `src/server/ailments.ts` and `src/server/therapies.ts` have carried since Phase 1; Phases 6 and 7 share the rendering-strategy decision D12 assigns to both, and the dashboard reads the very rows booking writes, so one production-build verification covers both. Phase 8 merges into nothing: its 404 settlement was deliberately deferred to the phase with every route in view (the 2026-08-20 title entry's neighbour, D4 of the Phase 3 spec), and a dual-target deploy can only verify a finished site. **What does not compress: the gates.** The merged phases inherit every quality gate in [tech-stack.md](tech-stack.md#quality-gates), the feature spec the roadmap already mandated before booking is implemented (now covering the dashboard too), the production-build exit criterion, and the seed-collision fix parked in this register three rows up. Fewer phases, not lower bars. |
