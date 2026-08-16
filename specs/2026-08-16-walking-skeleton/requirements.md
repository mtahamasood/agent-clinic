# Requirements — Walking skeleton

Feature spec for **Phase 0** of [roadmap.md](../roadmap.md#phase-0--walking-skeleton).

## Why this phase exists

Prove the entire path — clone, install, migrate, seed, render, build, serve,
test — once, on content nobody cares about. Every later phase then argues about
features instead of setup.

The phase is deliberately hostile to interesting work. If a decision can be
deferred to Phase 1, it is.

## In scope

| Area | What lands |
| --- | --- |
| Framework | Next.js App Router, TypeScript `strict: true` |
| Styling | Tailwind CSS, configured and used |
| Components | shadcn/ui initialised; exactly one primitive (`Card`) pulled in |
| Database | Prisma + libSQL driver adapter, one throwaway model, local file via `DATABASE_URL` |
| Page | `/` names the clinic, carries a one-line tagline, and renders one row read from the database |
| Unit tests | Vitest installed, one passing test |
| E2E tests | Playwright installed, one passing spec against a **production build** |
| Quality | ESLint + Prettier configured and clean |
| CI | GitHub Actions running every quality gate on push |
| Docs | `README.md` documents run / build / test / seed for both deploy targets |

## Out of scope

Not deferred forever — deferred to a named phase, so nobody has to re-argue it.

- The four real nouns (`Agent`, `Ailment`, `Therapy`, `Appointment`) — **Phase 1**.
- Any route beyond `/`, and any navigation pointing at one — **Phase 2** onwards.
- Dashboard content on `/` — today's appointments, recent intakes, headline
  counts — **Phase 7**.
- Real seed data with personality — **Phase 1**.
- Visual design beyond legible defaults: typography treatment, motion, metadata,
  favicon, social preview — **Phase 8**.
- An actual Vercel deployment. Phase 0 keeps the *code* deploy-target-agnostic
  and documents the Vercel path; it does not create the Turso database or push
  to Vercel. That is **Phase 8**.

## Decisions

Four questions were open before this spec was written; a fifth was added when the
home page came into scope. All five are now closed.

### D1 — The throwaway model is genuinely throwaway

```prisma
model ClinicNotice {
  id        String   @id @default(cuid())
  message   String
  createdAt DateTime @default(now())
}
```

Seeded with one row, in clinic voice. **Phase 1 deletes this model entirely.**

*Rejected:* starting with a minimal real `Agent`. It saves throwaway work but
front-loads a schema decision the roadmap deliberately defers to Phase 1, under
the worst possible conditions — while the toolchain is still unproven. A model
we have already agreed to delete cannot accidentally become load-bearing.

### D2 — Tailwind plus one shadcn primitive

`shadcn init` runs in this phase and exactly one component (`Card`) is pulled in
to render the seeded row.

*Rationale:* shadcn setup touches `components.json`, CSS variables, theming, and
the `cn` utility. Discovering a problem there inside Phase 2, next to real roster
UI, means debugging two things at once. Here it is the only thing that can break.

*Constraint:* one component. A second is scope creep and goes to Phase 2.

### D3 — Playwright targets the production build

The single Playwright spec runs against `next build && next start`, not
`next dev`.

*Rationale:* dev-server rendering is the easy case. The production path is where
Prisma adapters, server-component bundling, and environment loading actually
misbehave — and both Phase 6 (first database writes) and Phase 8 (self-hosted
deploy) stake their exit criteria on it. Testing the easy case would leave the
hard one unproven until the phase that can least afford a surprise.

`npm run dev` is still verified, by hand, against the README instructions.

*Cost accepted:* the E2E suite is slower from day one, because every run pays for
a build.

### D4 — CI lands now

A GitHub Actions workflow runs `tsc --noEmit`, ESLint, Prettier, Vitest, and
Playwright on push.

*Rationale:* [tech-stack.md](../tech-stack.md) already states lint and format are
"run in CI" and lists the quality gates every phase inherits. A gate that exists
only as a promise is not a gate. Wiring it while the codebase is one page and one
model is the cheapest it will ever be.

The repo is public, so Actions minutes are free and unmetered, and the passing
run is visible to the course-student audience in
[mission.md](../mission.md#target-audience). The gate that cannot be reproduced
locally is the clean-clone one — a CI runner starts from an empty machine every
time, which is exactly what section A of [validation.md](validation.md) asks for.

### D5 — The home page is minimal, not a landing page

`/` identifies the clinic — name, one-line tagline, and the seeded notice — and
stops there.

*Rationale:* D1–D4 left `/` as a bare card containing one sentence, which proves
the data path but leaves the product anonymous. A heading and a tagline cost
almost nothing and make the skeleton demonstrable to the stakeholders in
[mission.md](../mission.md#stakeholder-traceability) rather than only to whoever
wrote it.

*Boundary.* Three things it explicitly does not become:

- **Not the dashboard.** Phase 7 replaces `/` with today's appointments, recent
  intakes, and headline counts.
- **Not the landing treatment.** Phase 8 owns typography, spacing, motion,
  metadata, and social preview. Phase 0 uses legible defaults.
- **No navigation.** Routes beyond `/` arrive in Phase 2; a link to one now
  resolves to a 404.

The test: if a change to `/` in this phase cannot be justified by *"someone must
be able to tell what this product is"*, it belongs to Phase 7 or Phase 8.

## Constraints inherited

From [tech-stack.md](../tech-stack.md), restated because Phase 0 is where they
first become real code:

- **No branch on deploy target.** The only difference between local and Vercel
  is the value of `DATABASE_URL`. If Phase 0 introduces an `if (process.env.VERCEL)`,
  Phase 0 has failed.
- **No runtime filesystem writes.** All persistence goes through the database.
- **Node is the only prerequisite.** No container runtime, no second toolchain.
  The self-hosted path is npm scripts only.
- **No network after `npm install`.** A booth demo on bad wifi must survive.

## Open questions

None. This spec is closed; ambiguity found during implementation goes to the
backlog or reopens this file, not into the code.
