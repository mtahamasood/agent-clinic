# Tech Stack

The stack is fixed by this document. Changing anything in the "Locked in" table
means editing this file first, with a reason — not reaching for a new dependency
mid-phase.

## Locked in

| Concern | Choice | Why |
| --- | --- | --- |
| Language | **TypeScript**, `strict: true` | Mary's explicit ask. Strict from day one; retrofitting it later is miserable. |
| Framework | **Next.js (App Router)** | The most popular reliable TypeScript web stack. One codebase for pages and data access. |
| Runtime | **Node.js LTS** | Boring on purpose. |
| Package manager | **npm** | Ships with Node. No extra install step for anyone cloning this. |
| Styling | **Tailwind CSS** | Fast to iterate, consistent spacing and type scale without inventing a design system. |
| Components | **shadcn/ui** | Accessible Radix primitives we own in-repo, not a black-box dependency. Carries Steve's "attractive" bar. |
| Database | **libSQL** (SQLite-compatible) | A local file when self-hosted, a hosted Turso URL on Vercel. Same engine and same SQL on both targets. |
| ORM | **Prisma** (libSQL driver adapter) | Typed queries end to end, real migrations, readable schema file. One schema serves both deploy targets. |
| Unit tests | **Vitest** | Fast, TS-native, minimal config. |
| E2E tests | **Playwright** | Real browser, which is where Steve's requirement actually gets verified. |
| Formatting / lint | **Prettier + ESLint** | Non-negotiable, run in CI. |
| Deploy targets | **Local (self-hosted) and Vercel** | Both first-class and equally supported. See [Deployment](#deployment). |

## Conventions

**Data access.** Server Components read from Prisma directly. Mutations go
through Server Actions. We do not build a REST or tRPC layer in v1 — there is no
second client that needs one. If one appears, it gets a spec.

**Directory layout.**

```
src/
  app/            # routes, layouts, pages (App Router)
  components/     # shared UI; ui/ holds shadcn primitives
  lib/            # domain logic, Prisma client, formatters
  server/         # Server Actions and data-access functions
prisma/
  schema.prisma
  seed.ts
scripts/          # the executables behind the gates below; no dependencies
specs/            # this constitution, plus per-feature specs
tests/            # Playwright specs; unit tests sit next to their source
.claude/skills/   # procedure agents follow — never rules (see Changelog)
```

`scripts/` and `.claude/skills/` are on this map because a directory that
enforces something has to be findable. `scripts/` held a CI-binding gate for
three days without appearing here, which is how a reader concludes the gates are
imaginary.

**Naming.** Clinic vocabulary everywhere — tables, types, routes, variables.
`Ailment`, not `Tag`. `Appointment`, not `Booking`. The domain language from
[mission.md](mission.md) is the schema.

**Server-first.** Components are Server Components by default. `"use client"` is
opt-in, per component, and only when there is genuine interactivity.

### Responsive design

The web UI is responsive. Stated concretely, because a bar nobody can fail is
not a bar:

- **Fluid by default.** Containers cap their width with `max-w-*` and fill
  what is left of the viewport below that. No element declares a fixed pixel
  width the screen has to accommodate.
- **Mobile-first.** The unprefixed Tailwind utility is the phone style; `sm:`
  and upward add to it, never rescue it. Tailwind's default breakpoints are the
  only set in the project — a bespoke breakpoint is a decision record with a
  source, not a class name someone reached for.
- **Nothing overflows sideways at 320px**, the narrowest viewport worth
  supporting, and nothing is clipped or overlapped anywhere between 320px and a
  wide desktop. Horizontal scroll is the failure this rule mostly exists to
  catch.
- **Verified in the Playwright pass**, at a phone viewport and a desktop one,
  not by eye. Every spec runs twice — see the `projects` list in
  `playwright.config.ts`. A responsive claim nobody measured is precisely the
  hole that check C10 turned out to be.

Deliberately **not** part of this convention: tap-target sizing, focus order,
visible focus rings, and the rest of the mobile-usability family. They read like
they belong here, which is the danger — they belong to the accessibility
requirement struck on 2026-08-17, and they return only as a dated owner decision
or a stakeholder ask (D10 in the Phase 0 spec). Adding one as a rider on this
convention would repeat the incident that produced
[Requirement provenance](#requirement-provenance).

*Source:* owner decision, 2026-08-19 — registered in
[mission.md](mission.md#owner-decisions). It supersedes the implied sourcing
that previously carried "Responsive down to mobile" in the roadmap, which cited
nothing and leaned on a success criterion whose wording was ambiguous.

## Deployment

AgentClinic must be fully deployable **two ways**, and neither is the "real" one.
A feature is not done until it works on both.

| | Local / self-hosted | Vercel |
| --- | --- | --- |
| Runtime | `next build` + `next start` on Node LTS | Vercel's Next.js runtime |
| Database | libSQL file on disk (`file:./clinic.db`) | Hosted Turso database over its URL |
| Config | `DATABASE_URL` (+ `DATABASE_AUTH_TOKEN` only when remote) | Same two variables, set in project settings |
| Migrations | `prisma migrate deploy` against the local file | `prisma migrate deploy` against Turso |

**Parity rules.**

- The application code contains no branch on deploy target. The only difference
  between the two is the value of `DATABASE_URL`.
- No Vercel-only APIs, and no writing to the filesystem at runtime — the
  serverless filesystem is read-only apart from an ephemeral `/tmp`, so all
  persistence goes through the database. This is precisely why the database is
  libSQL rather than a plain SQLite file: the booking flow writes rows, and a
  bundled `.db` file cannot accept writes on Vercel.
- Anyone with a clone and Node can run the whole clinic with no account and no
  container runtime. Node is the only prerequisite. Once `npm install` has run,
  the app needs no network at all — install is the only step that touches the
  registry, which is what makes a booth demo on bad wifi safe.
- `README.md` documents both paths. The self-hosted path is npm scripts only —
  `npm install`, `npm run build`, `npm start` — so there is no second toolchain
  to install or keep in sync with the first.

## Deliberately deferred

Not "never" — just not now, and each needs a spec before it lands:

- **Postgres.** libSQL until write concurrency genuinely forces the move. Prisma
  makes it a provider change plus a migration, so the cost of waiting is low.
- **Auth.** No accounts in v1 (see mission non-goals).
- **State management library.** URL params and Server Components first. Reach
  for a store only when something genuinely can't be modelled that way.
- **Component/visual testing (Storybook, snapshots).** Playwright covers the
  flows that matter at this size.
- **Analytics, error tracking, i18n.** All post-v1.

## Quality gates

Every phase in [roadmap.md](roadmap.md) is done only when all of these pass:

- `tsc --noEmit` clean, no `any` outside a commented escape hatch.
- ESLint and Prettier clean.
- Unit tests pass for logic introduced in that phase.
- The phase's Playwright happy path passes.
- The app builds and runs from a clean clone with documented commands.
- The **production build** (`next build` + `next start`) runs locally against a
  local libSQL file — not just `next dev`.
- The Playwright suite passes at **both** viewports, phone and desktop
  ([Responsive design](#responsive-design)). A phase that put a page on screen
  and verified it at one width has not met this gate.
- `CHANGELOG.md` carries an entry for the work ([Changelog](#changelog)).

## Changelog

`CHANGELOG.md` at the repo root records what changed, newest first, one heading
per date. Entries describe units of work — a phase, a pull request — not
commits, because a transcript of the branch is something the reader can already
get from `git log`.

**The rule.** A branch that changes `src/`, `specs/`, or `prisma/` updates
`CHANGELOG.md` before it merges. Branches that only touch CI config, formatting,
or the changelog itself are exempt: padding the file with entries nobody wants is
how a changelog stops being read.

**Enforcement**, because a rule that lives only in prose is not a gate:

- `npm run check:changelog` compares the branch against its merge base and fails
  when material paths changed and `CHANGELOG.md` did not. CI runs it inside the
  required `verify` check, on pull-request builds — which is where the rule
  applies, since the rule is *before it merges* and a branch with no pull request
  is not yet a merge candidate. It runs **last** in the job: a failing step skips
  the rest, and a missing changelog entry must never mask a broken test. It fails
  loudly rather than skipping when it cannot see enough history to answer — a
  check that passes blind is the C10 failure.
- The check tests only that the file was **touched**. Whether the entry is true
  or worth reading is a human's job, and the procedure is in
  `.claude/skills/changelog`.
- It is deliberately **not** part of `npm run check`. That script runs constantly
  mid-branch, where the changelog is legitimately not written yet; a gate that
  cries wolf during normal work gets routed around.

**Skills carry procedure, never rules.** They live in `.claude/skills/<name>/SKILL.md`,
committed to the repository so they travel with a clone. The leading dot is not a
preference — it is the path the coding agent searches, so a tidier top-level
`skills/` would simply never load. The directory is therefore listed in the
layout map above rather than moved. `.claude/skills/` is admitted as an
agent-facing surface for this and for what follows it, on one condition: it holds
*how*, and `specs/` holds *what* and *why*. A skill that starts asserting the
product or the process must be some way has become an unattributed requirement on
a surface nobody audits, which is the incident that produced
[Requirement provenance](#requirement-provenance). The 2026-08-17 ban on
`AGENTS.md` and `CLAUDE.md` is otherwise untouched, and `agentRules: false`
stays in `next.config.ts`.

*Source:* owner decision, 2026-08-19 — registered in
[mission.md](mission.md#owner-decisions).

## Judgement checks

Some checks cannot be automated. "Does the satire land" and "can a first-time
viewer say what this is" are real bars, and no test will ever settle them. They
are allowed — but a check that asks a human to decide carries three things, or
it is not a check:

| | |
| --- | --- |
| **Evidence** | What to open. Named explicitly, and never assumed to be the app — a phase may not put its work on screen at all |
| **Procedure** | What to do with it. How many, chosen how |
| **Pass condition** | What a yes looks like, in a sentence someone could disagree with |

The verdict is then recorded in the row with who made it and when, the way any
other check records its result.

A judgement check that states only the bar is the same defect as a gate that
lives only in prose. It reads as rigour, it cannot be executed, and it gets
ticked on whatever the reader happened to have in front of them.

*Source:* owner directive, 2026-08-17 — registered in
[mission.md](mission.md#owner-decisions). Prompted by C16 in the Phase 1 spec,
which asserted that the satire must land and named nothing to read it in. Phase
1 renders one ailment of eight, so the only artifact a reader would naturally
reach for showed almost none of the material being judged. Phase 0's C7 has the
same shape and escaped notice because there the application *was* the evidence;
it stands as written, since rewriting a closed phase's audit trail would cost
more than it teaches.

## Requirement provenance

No requirement enters this project without a written source. This section exists
because one did: an accessibility convention (formerly in Conventions above) and
a Phase 8 accessibility pass asserted WCAG AA contrast, yet no stakeholder in
`README.md` asked for accessibility and `mission.md` never mentioned it. The
requirement produced real work — a validation check and a test — before anyone
could say who wanted it. The owner struck it and everything downstream on
2026-08-17 (D10 in the Phase 0 spec, registered in
[mission.md](mission.md#owner-decisions)); this section makes sure the pattern
cannot repeat.

**The rule.** Every normative statement — anything asserting the product or the
process *must* be some way — carries exactly one of three sources:

| Source | Meaning | Recorded where |
| --- | --- | --- |
| **Stakeholder** | Traces to the brief | `README.md` input, mapped in mission.md's traceability section |
| **Constitution** | Derived from an existing clause | The citation sits next to the requirement (file + section) |
| **Owner** | The project owner decided it, dated | mission.md's traceability section, as the target audience already is |

"It seemed like good practice" is not a source. Engineering defaults are
proposals, not requirements: an agent or contributor who believes the project
needs something nobody asked for brings it to the owner as a question, and it
enters — if it enters — as a dated Owner entry. Until then it binds nobody.

The Owner row exists because some requirements legitimately come from nobody in
the brief — the target audience in mission.md is one. The discipline is not "no
new requirements"; it is "no anonymous ones."

**Enforcement**, because a rule that lives only in prose is not a gate:

- Decision records in feature specs (`### D1`, `### D2`, …) must carry a
  `*Source:*` line. `npm run check:provenance` fails without one, CI runs it
  inside the required `verify` check, and branch protection makes `verify`
  binding — so an unattributed decision record cannot reach `main`.
- `.github/pull_request_template.md` asks where every new requirement came
  from. Prose the linter cannot parse gets caught by the author having to
  answer that question in writing.
- The specs are the only agent-facing instruction surface: `AGENTS.md` and
  `CLAUDE.md` carry no project content and never will (owner decision,
  2026-08-17, in [mission.md](mission.md#owner-decisions)). An agent that wants
  a new quality bar proposes it to the owner; it does not install it.
- A requirement discovered without a source is a spec bug. The fix is to
  attribute it or delete it — never to keep it silently.

*Source:* owner directive, 2026-08-16, prompted by the unattributed
accessibility requirement above.

## Branch protection

The gates above are enforced on `main` by GitHub, not by anything in this
repository. It is written down here because the rule is otherwise invisible: the
workflow that *defines* the gate is versioned in `.github/workflows/ci.yml`, but
the rule that makes it *binding* lives in GitHub's settings and does not clone.

| Rule | Setting |
| --- | --- |
| Required status check | `verify` — the CI workflow |
| Branch up to date before merging | Required |
| Enforced for administrators | Yes |
| Force pushes | Blocked |
| Branch deletion | Blocked |
| Required reviews | None — single maintainer |

The consequence: `main` is pull-request only, for everyone including the
repository owner. Every change goes branch → PR → green `verify` → merge. A
one-line typo fix costs a branch and a CI run, which is the price of the gate
being real rather than advisory.

A fork or a clone inherits none of this. Branch protection is a platform
feature, not a Git one — Git itself has no concept of a protected branch, only
server-side hooks and `receive.denyNonFastForwards` to build one from. Anyone
running their own copy who wants the same discipline has to configure their
host's equivalent themselves.

## Branch retention

Phase branches outlive their merge. Process branches do not.

- A branch that carries a phase — `phase-0-walking-skeleton`,
  `phase-1-four-nouns`, and each one after them — is **kept** after its pull
  request merges, on GitHub and in clones. The owner reviews the full set of
  phase branches at the end of the project, so each one stays as a convenient
  checkout of the repo at the end of its phase.
- Every other branch — process changes, conventions, fixes — is **deleted on
  merge** (`gh pr merge --delete-branch`, or the button on the PR page). The
  pull request keeps its diff and conversation either way, so nothing readable
  is lost.
- GitHub's **"Automatically delete head branches"** setting stays **off**: it
  cannot tell the two kinds apart, and it is exactly the sort of invisible
  platform configuration this document exists to write down.
- A phase branch deleted by mistake is an inconvenience, not a loss. The
  phase's merge commit pins the end-of-phase state — `git checkout <merge>^2`
  recovers it, and the PR page keeps the diff regardless. The branch is a
  convenience for review, not the record.

*Source:* owner decision, 2026-08-19 — registered in
[mission.md](mission.md#owner-decisions).

## CI timeouts

The `verify` job carries `timeout-minutes: 10`.

GitHub's default is six hours. That default is written for builds that might
legitimately take an afternoon; this suite takes about two minutes, and the
slowest honest run on record is 4m04s. Between those two numbers sits the case
this rule exists for: a step that is not slow but *stuck*, holding a required
check open long enough that nobody can tell a hung build from a busy one.

The prompting run is a real one. On 2026-08-19 the post-merge build of #12 —
a merge touching three Markdown files and no code — hung on
`playwright install --with-deps chromium`, twice, on two different runners. The
same step in the three runs before it took 70s, 74s, and 62s, and the
pull-request build of that exact commit had already gone green in 2m12s. Nothing
was wrong with the commit. The cause is in
[Playwright browser install](#playwright-browser-install) below; what matters
here is that `apt-get` carries no timeout on a connection that opens and then
goes quiet, so the run would have held a required check open for the full six
hours while reporting itself as in progress.

Two consequences worth stating, since both were choices:

- **Ten minutes**, not the tightest number that fits. A gate that trips on a
  merely slow-but-working build teaches people to re-run without reading, which
  is how a real failure gets clicked past.
- **On the job, not the step.** Pinning a timeout to the Playwright install
  would guard the step that happened to hang once. The job-level limit covers
  every step including the ones added later, and GitHub names the running step
  in the timeout message, so the diagnostic value of a per-step limit is already
  there.

This is a backstop, not a check. It reports nothing about the code — it only
bounds how long the repository will wait to be told.

*Source:* owner decision, 2026-08-19 — registered in
[mission.md](mission.md#owner-decisions).

## Playwright browser install

CI installs the browser with `npx playwright install chromium` — **without**
`--with-deps`.

`--with-deps` is the documented way to install Playwright's system libraries,
and on a bare machine it is the right flag. On a GitHub-hosted runner it is
close to a no-op with a failure mode attached. The `ubuntu-24.04` image ships
Chrome, Firefox, and Edge preinstalled, so the shared libraries Chromium needs
are already on disk; what the flag adds is an `apt-get update` against Ubuntu's
mirrors before Playwright fetches anything of its own.

That apt pass is what hung on 2026-08-19, twice, on the same commit:

```
07:25:17  microsoft + google repos fetch fine, ~0.2s each
07:25:47  Ign: azure.archive.ubuntu.com noble InRelease   (30s stall, ignored)
07:25:48  Ign: retry 2
07:25:50  Ign: retry 3
07:25:54  Ign: retry 4
07:25:54  Hit/Get: archive.ubuntu.com — three InRelease transfers open
          ...13 minutes of silence...
07:38:54  cancelled by hand
```

The runner's Azure-local Ubuntu mirror went unreachable, apt fell back to the
public archive, opened three transfers there, and never received the rest. The
last line of output came 38 seconds into a step that then produced nothing for
thirteen minutes. The browser download never started, so caching
`~/.cache/ms-playwright` would not have helped — the stall is upstream of
anything Playwright fetches.

Dropping the flag removes the only step in this workflow that touches Ubuntu's
mirrors at all.

**The trade-off, stated because it is a real one.** This leans on the runner
image continuing to carry those libraries. If a future image drops one, the
failure surfaces at `npm run test:e2e` as a browser that will not launch, which
is a worse error message than a failed install would have been. The fix at that
point is to put `--with-deps` back and pair it with a retry, not to debug the
e2e suite: a Playwright browser that cannot start on a runner where the tests
used to pass is a system-library problem until proven otherwise.

*Source:* owner decision, 2026-08-19 — registered in
[mission.md](mission.md#owner-decisions).
