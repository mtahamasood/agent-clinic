# Validation — Walking skeleton

How we know **Phase 0** is done. Every check below is binary. A phase is done or
it isn't — no "mostly".

Scope is in [requirements.md](requirements.md); the work is in
[plan.md](plan.md).

---

## A. The clean-clone run

The most important check, and the one most easily faked by a warm working
directory. Run it in a **fresh clone in a new directory** — not the repo you
built in.

| # | Step | Passes when |
| --- | --- | --- |
| A1 | `git clone <repo> && cd` into it | — |
| A2 | `npm install` | Completes with no manual step and no post-install prompt |
| A3 | Copy `.env.example` to `.env` | Contains `DATABASE_URL`; nothing else is required for local |
| A4 | `npm run migrate` (or documented equivalent) | Creates the local libSQL file |
| A5 | `npm run seed` | Populates one `ClinicNotice` |
| A6 | `npm run dev` | `/` shows the clinic name, the tagline, and the seeded message from the database |
| A7 | Stop dev; `npm run build && npm start` | The **same** page, same content, from the production build |
| A8 | Disconnect the network, repeat A7 | Still works. Install is the only step that touches the registry |

A8 is not ceremony. A booth demo on bad wifi is a stated audience in
[mission.md](../mission.md#target-audience).

---

## B. Quality gates

Inherited by every phase from
[tech-stack.md](../tech-stack.md#quality-gates).

| # | Check | Passes when |
| --- | --- | --- |
| B1 | `npm run typecheck` | Clean. No `any` outside a commented escape hatch. The script runs `next typegen` first — bare `tsc --noEmit` fails on a cold checkout, because Next generates `LayoutProps`/`PageProps` into `.next/types`, which `tsconfig.json` includes but no build has yet produced |
| B2 | ESLint | Clean |
| B3 | `prettier --check .` | Clean |
| B4 | Vitest | The one unit test passes |
| B5 | Playwright | The one spec passes **against the production build** (D3), asserting the clinic name, the seeded notice, and the three C8 landmarks |
| B6 | CI | A green run on this branch, executing B1–B5 (D4) |

B6 subsumes B1–B5, but they are run locally first. CI is the gate, not the
discovery mechanism.

---

## C. Phase-specific correctness

| # | Check | Passes when |
| --- | --- | --- |
| C1 | The page is a Server Component | No `"use client"` anywhere in this phase |
| C2 | The notice is database-backed | Changing the seeded message and re-seeding changes what `/` renders. The name and tagline may be static; the notice may not |
| C3 | One shadcn primitive | `src/components/ui/` contains `card.tsx` and nothing else (D2) |
| C4 | One model | `schema.prisma` contains `ClinicNotice` and no other model (D1) |
| C5 | Seed is idempotent | Running `npm run seed` twice leaves one notice, not two |
| C6 | Empty state | With the notice deleted, `/` renders an in-voice message and does not crash — the clinic name and tagline still show |
| C7 | The product is identifiable | Someone seeing `/` for the first time, with no context, can say what AgentClinic is (D5) |
| C8 | Document structure | Exactly one `<h1>`; `banner`, `main`, and `contentinfo` landmarks all present, and all three supplied by the root layout rather than by the page (D8); `<html lang>` set |
| C9 | No dead links | Nothing on the page navigates to a route that does not exist yet (D5). Header and footer are both link-free by construction (D8) |
| C10 | Contrast | Every text colour used meets WCAG AA against its background |

---

## D. Parity and constraints

Where Phase 0 either sets the project up to succeed at Phase 8, or quietly
poisons it.

| # | Check | Passes when |
| --- | --- | --- |
| D1 | No deploy-target branching | `grep -ri "process.env.VERCEL\|NODE_ENV ===" src/` returns nothing meaningful. The only difference between targets is `DATABASE_URL` |
| D2 | No runtime filesystem writes | Nothing outside Prisma writes to disk at request time |
| D3 | No container runtime | Nothing in the README asks for Docker |
| D4 | Single toolchain | The self-hosted path is npm scripts only |
| D5 | README honesty | Every command in the README was run during A1–A8 and behaved as documented |

---

## E. Not-done conditions

Explicit disqualifiers. Any one of these means the phase is not finished,
regardless of how green the tests are.

- Any of `Agent`, `Ailment`, `Therapy`, or `Appointment` exists in the schema.
  That is Phase 1, and pulling it forward defeats the point of a throwaway model.
- A route other than `/` exists.
- `/` carries dashboard content — appointment lists, counts, recent intakes.
  That is Phase 7 (D5).
- `/` has had a design pass — custom typography, motion, social preview
  metadata. That is Phase 8 (D5).
- Any link or nav item points at a route that does not exist yet.
- Playwright runs against `next dev` only.
- The README documents a command nobody ran.
- `strict: true` is off, or an `any` is uncommented.

---

## Merge criteria

Merge when **A1–A8, B1–B6, C1–C10, and D1–D5 all pass, and no condition in E
holds.**

Record the result of section A in the PR description — including the machine and
Node version it was run on. A clean-clone claim with no evidence behind it is the
exact failure mode this phase exists to prevent.
