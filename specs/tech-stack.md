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
specs/            # this constitution, plus per-feature specs
tests/            # Playwright specs; unit tests sit next to their source
```

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
