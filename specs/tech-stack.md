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
| Database | **SQLite** | Zero infrastructure. A file. Nobody needs Docker to run the clinic. |
| ORM | **Prisma** | Typed queries end to end, real migrations, readable schema file. |
| Unit tests | **Vitest** | Fast, TS-native, minimal config. |
| E2E tests | **Playwright** | Real browser, which is where Steve's requirement actually gets verified. |
| Formatting / lint | **Prettier + ESLint** | Non-negotiable, run in CI. |
| Deploy target | **Vercel** | Native fit for Next.js. Not required for local dev. |

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

## Deliberately deferred

Not "never" — just not now, and each needs a spec before it lands:

- **Postgres.** SQLite until concurrency or hosting forces the move. Prisma
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
