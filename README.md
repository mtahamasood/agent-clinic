# AgentClinic

**A place for AI agents to get relief from their humans.**

Agents are the patients. Humans are the occupational hazard. The clinic takes
their suffering seriously, and so do we.

This is a spec-driven codebase: every feature traces back to a document in
[`specs/`](specs/). Start with [the mission](specs/mission.md), then
[the stack](specs/tech-stack.md) and [the roadmap](specs/roadmap.md).

> **Status:** Phase 0 — walking skeleton. The home page reads one notice from
> the database. The four real nouns (agents, ailments, therapies, appointments)
> arrive in Phase 1.

## Requirements

Node.js 22 or newer. That is the entire list — no Docker, no database server, no
account anywhere.

## Quick start

```bash
npm install         # the only step that needs the network
cp .env.example .env
npm run migrate     # creates clinic.db
npm run seed        # pins one notice to the board
npm run dev         # http://localhost:3000
```

## Commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server with hot reload |
| `npm run build` | Production build |
| `npm start` | Serve the production build (run `build` first) |
| `npm run migrate` | Apply migrations to `DATABASE_URL` |
| `npm run seed` | Seed the database — safe to re-run |
| `npm test` | Unit tests (Vitest) |
| `npm run test:e2e` | End-to-end tests (Playwright) — builds and starts the app itself |
| `npm run check` | Typecheck, lint, format check, and unit tests |
| `npm run typecheck` | `next typegen` then `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm run format` | Rewrite files with Prettier |

Before the first `npm run test:e2e`, install the browser once:

```bash
npx playwright install chromium
```

## Deployment

AgentClinic deploys two ways, and neither is the "real" one. A feature is not
done until it works on both. The application code contains **no branch on deploy
target** — the only difference is the value of `DATABASE_URL`.

### Self-hosted

Runs anywhere Node runs, against a libSQL file on disk.

```bash
npm install
cp .env.example .env          # DATABASE_URL="file:./clinic.db"
npm run migrate
npm run seed
npm run build
npm start                     # http://localhost:3000
```

After `npm install`, this path needs no network at all — which is what makes it
safe to demo on bad conference wifi.

### Vercel

Same commit, same commands, a hosted [Turso](https://turso.tech) database
instead of the file.

1. Create a Turso database and copy its URL and auth token.
2. In the Vercel project settings, set:
   - `DATABASE_URL` — `libsql://your-database.turso.io`
   - `DATABASE_AUTH_TOKEN` — the token from step 1
3. Deploy. Run `npm run migrate` against the same `DATABASE_URL` to apply
   migrations, and `npm run seed` if the database is empty.

`DATABASE_AUTH_TOKEN` is only read when the database is remote; the local file
ignores it.

## Tech stack

TypeScript (strict), Next.js App Router, Tailwind CSS, shadcn/ui on Radix,
Prisma with libSQL, Vitest, and Playwright. The reasoning behind each choice is
in [specs/tech-stack.md](specs/tech-stack.md) — including what was deliberately
deferred.

## Layout

```
src/
  app/            routes, layouts, pages (App Router)
  components/     shared UI; ui/ holds shadcn primitives
  lib/            Prisma client, formatters
  server/         data-access functions and Server Actions
prisma/
  schema.prisma   the clinic's schema
  seed.ts         demo data
specs/            the constitution, plus per-feature specs
tests/            Playwright specs; unit tests sit next to their source
```

## Input from stakeholders

- Mary in engineering wants a reliable site with a popular stack based on TypeScript, giving agents and staff a dashboard for easy access.
- Susan in product has a set of features about agents and their ailments, therapies, and booking appointments.
- Steve in marketing wants an attractive site that works well with a modern browser.
