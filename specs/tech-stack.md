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

**Accessibility.** Keyboard navigable, labelled form controls, visible focus
rings, WCAG AA contrast. Checked in the Playwright pass, not by vibes.

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
