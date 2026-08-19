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
| Layout | Root layout composes `ClinicHeader`, a `<main>` landmark holding the container width, and a link-free `ClinicFooter` (D8) |
| Page | `/` names the clinic, carries a one-line tagline, and renders one row read from the database |
| Unit tests | Vitest installed, one passing test |
| E2E tests | Playwright against a **production build**: the seeded page and the C8 landmarks |
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
home page came into scope, and D6–D10 were recorded during implementation. All
ten are closed; D9 was struck by D10 and stands only as audit trail.

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

*Source:* [roadmap.md](../roadmap.md#phase-0--walking-skeleton) — "a single
throwaway model".

### D2 — Tailwind plus one shadcn primitive

`shadcn init` runs in this phase and exactly one component (`Card`) is pulled in
to render the seeded row.

*Rationale:* shadcn setup touches `components.json`, CSS variables, theming, and
the `cn` utility. Discovering a problem there inside Phase 2, next to real roster
UI, means debugging two things at once. Here it is the only thing that can break.

*Constraint:* one component. A second is scope creep and goes to Phase 2.

*Source:* [roadmap.md](../roadmap.md#phase-0--walking-skeleton) — "Tailwind +
shadcn/ui initialised" — and the Locked in table in
[tech-stack.md](../tech-stack.md#locked-in).

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

*Source:* [tech-stack.md](../tech-stack.md#quality-gates) — "The **production
build** (`next build` + `next start`) runs locally" — and the Phase 0 exit
criterion in [roadmap.md](../roadmap.md#phase-0--walking-skeleton).

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

*Source:* [tech-stack.md](../tech-stack.md#locked-in) — lint and format
"run in CI" — and its quality gates section.

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

*Source:* [roadmap.md](../roadmap.md#phase-0--walking-skeleton) — "One page
that reads one row from the database" — and the one-liner in
[mission.md](../mission.md#the-one-liner).

### D6 — Fonts ship through npm, not from Google

`next/font/google` is replaced by the `geist` npm package.

*Rationale:* the generated layout fetched Geist from Google Fonts at build time.
A cold build with the network blocked fails outright — verified, not assumed:

```
Error: next/font: Failed to fetch Geist Mono from Google Fonts.
```

[tech-stack.md](../tech-stack.md#deployment) states that once `npm install` has
run, the app needs no network at all, and check A8 in
[validation.md](validation.md) tests precisely that. The `geist` package ships
the font files through the registry, so install remains the only step that
touches the network.

*Rejected:* `next/font/local` with committed `.woff2` files — same outcome, but
puts binaries in a teaching repo. And the plain system font stack — free, but
discards the shadcn preset's typography for nothing in return.

*Scope note:* this adds one dependency that [tech-stack.md](../tech-stack.md)
does not name. It is a font asset rather than a stack choice, so no row in the
"Locked in" table changes and that document needs no edit.

*Source:* [tech-stack.md](../tech-stack.md#deployment) parity rule — "the app
needs no network at all" after install — enforced as check A8 in
[validation.md](validation.md).

### D7 — `shadcn` stays in `dependencies`, not `devDependencies`

It looks misplaced, because `shadcn` is best known as a CLI. It is not only that
here: `src/app/globals.css` does `@import "shadcn/tailwind.css"`, making the
package a real input to the build.

*Rationale:* moving it to `devDependencies` means any production-mode install —
`npm ci --omit=dev`, or `npm install` with `NODE_ENV=production` — produces a
build that fails on a missing CSS import. Nothing in
[tech-stack.md](../tech-stack.md#deployment) forbids that install mode, and the
self-hosted path is meant to be `npm install && npm run build && npm start` with
no asterisks. *"If a demo needs a caveat spoken aloud, that is a bug"*
([mission.md](../mission.md#target-audience)).

*Cost accepted:* a less precise `package.json` and a slightly larger production
`node_modules`. Recorded here so nobody tidies it later and breaks the
`--omit=dev` path.

*Source:* [tech-stack.md](../tech-stack.md#deployment) — the self-hosted path
is `npm install && npm run build && npm start` with no asterisks.

### D8 — The root layout composes header, `<main>`, and footer

The root layout is three parts: a `ClinicHeader` component, a `<main>` landmark
carrying the page container width, and a `ClinicFooter` component. Pages supply
content and nothing else.

*Rationale:* three separate pressures, one change.

- The header grows a nav in Phase 2. Extracting it now means that change touches
  one small file instead of the root layout.
- `<main>` and the container width belong to the layout, which is what 5.1 in
  [plan.md](plan.md) asked for — the first implementation put both in `page.tsx`
  instead. Hoisting them means check C8 in [validation.md](validation.md) cannot
  regress one route at a time as Phase 2 onwards adds pages.
- The body already carried `flex min-h-full flex-col`, and `<main>` already
  carried `flex-1` — sticky-footer scaffolding with no footer to pin. The
  footer completes a structure that was half-built.

*Rejected:* a `ClinicMain` component alongside the other two. Symmetric to read,
but it would wrap `children` in a `<main>` and do nothing else — indirection with
no behaviour behind it. The element stays inline in the layout.

*Rejected:* links in the footer. A footer is where navigation collects, and every
route beyond `/` is Phase 2 or later. This is the same reasoning D5 uses to keep
the header bare, and check C9 fails on a link to a route that does not exist.
The footer is text only until there is somewhere to point it.

*Boundary.* The footer is one line in clinic voice. It is not a site map, not
credits, not metadata. This is a structural change plus a single sentence — it is
**not** the Phase 8 design pass, and it does not license one. If the footer grows
links it is Phase 2 at the earliest; if it grows a treatment it is Phase 8.

*Cost accepted:* `max-w-2xl` now binds every route from one place. A later route
wanting a wider canvas — the Phase 2 roster, the Phase 5 catalogue with filters —
takes a nested layout rather than a per-page override. One landmark definition,
bought with per-route width freedom.

*Scope note:* both components live in `src/components/`, which
[tech-stack.md](../tech-stack.md) already designates for shared UI, and both are
named in clinic vocabulary per the same document. No row in the "Locked in" table
changes and the constitution needs no edit.

*Source:* owner request, 2026-08-16 — compose the root layout from
header/main/footer subcomponents — plus 5.1 in [plan.md](plan.md), which had
already placed the `<main>` landmark and container width in the root layout.

### D9 — Contrast is measured in the Playwright pass, with no new dependency

> **Struck by D10, 2026-08-17.** The requirement this decision implemented was
> itself unattributed and has been removed, along with `tests/contrast.spec.ts`.
> The record below is kept unedited as audit trail.

Check C10 is enforced by `tests/contrast.spec.ts`, which walks every text-bearing
element on `/`, composites foreground and background to sRGB, and asserts the
WCAG AA ratio — 4.5:1, or 3:1 for large text.

*Rationale:* [tech-stack.md](../tech-stack.md) says contrast is *"[c]hecked in
the Playwright pass, not by vibes"*. Until now nothing enforced it, so C10 was a
promise rather than a gate — the same shape of hole that D4 exists to close.
The margin turned out to be thin enough to be worth guarding: `muted-foreground`
on `background` measures **4.74:1** against a 4.5 requirement. A darkening of
that token by a few percent would breach AA, and nothing would have said so.

*Rejected:* `@axe-core/playwright`. It is the industry-standard sweep and catches
far more than contrast, but C10 asks about contrast specifically, and the
relative-luminance formula is about fifteen lines. A broad a11y audit is worth
having — it is simply a different, larger decision than closing C10, and it
should arrive with its own spec rather than smuggled in as a fix.

*Implementation notes*, both of which cost a wrong result before they were found:

- Colours are resolved by painting to a canvas, not by parsing the computed
  value. Chromium reports these theme tokens as `lab(...)`, which a hand-written
  `rgb()` parser silently misreads.
- Alpha is composited before measuring. The first version discarded it, and so
  scored `text-foreground/25` — a 1.78:1 failure — as solid black at 21:1. The
  test was verified by degrading the footer until it failed, then restoring it.

*Scope note:* no new dependency, so no row in the "Locked in" table changes and
the constitution needs no edit. Dark theme is out of scope: the shadcn preset
ships a `.dark` class that Phase 0 never applies, and measuring a state the app
cannot enter would test the preset rather than this product. It becomes real
work when a theme toggle lands.

*Source:* [tech-stack.md](../tech-stack.md#conventions) Accessibility
convention — "WCAG AA contrast. Checked in the Playwright pass, not by vibes."
That clause is itself unattributed to any stakeholder; whether it stands is a
pending owner decision recorded in
[mission.md](../mission.md#owner-decisions), and this record deliberately does
not settle it. D9 closes the gap between what the constitution claimed and
what the tests measured — it does not adjudicate the claim.

### D10 — The accessibility requirement is struck

The owner's ruling on the incident that created the provenance rule. Removed in
full:

- The Accessibility convention in [tech-stack.md](../tech-stack.md) — keyboard
  navigable, labelled form controls, visible focus rings, WCAG AA contrast.
- The "Accessibility pass" line in Phase 8 of [roadmap.md](../roadmap.md).
- Check C10 in [validation.md](validation.md), the AA-contrast half of plan
  task 5.5, decision D9, and `tests/contrast.spec.ts`.

*Rationale:* traced in full, the requirement had no source — no stakeholder in
`README.md` asked for accessibility and `mission.md` never mentioned it. Under
the provenance rule an unattributed requirement is attributed or deleted; the
owner chose deletion.

*What survives:* check C8 — heading hierarchy, the `banner`/`main`/`contentinfo`
landmarks, `<html lang>` — because it traces to document structure in
[plan.md](plan.md) 5.1 and the layout decision D8, not to the struck
convention. Likewise the shadcn/ui row in the Locked in table: "accessible" there
describes what Radix primitives are, sourced to Steve's bar, not a requirement
this project added.

*Reintroduction path:* accessibility may return, but only as a dated owner
decision or a stakeholder ask in the brief — never again as a default.

*Source:* owner decision, 2026-08-17 — registered in
[mission.md](../mission.md#owner-decisions).

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

## Amendments

Constitution changes made **after this phase closed** that reach into code this
phase still owns. They are recorded here rather than edited into the decisions
and checks above: [validation.md](validation.md) is the record of a walk that
actually happened, and inserting a check nobody ran — then ticking it — is the
failure mode this project has already caught twice (C10 in this phase, C16 in
Phase 1).

### 2026-08-19 — the responsive-design convention

The web UI follows responsive design: owner decision registered in
[mission.md](../mission.md#owner-decisions), specified as a convention in
[tech-stack.md](../tech-stack.md#responsive-design), and a standing quality gate
from that date. It reaches this phase because this phase's output is still on
every screen — the root layout of D8, the `<main>` container width, the header,
and the footer are what every later route renders inside.

**Assessed, not assumed.** The layout was already fluid: `mx-auto w-full
max-w-2xl px-6` on all three containers, no fixed pixel width anywhere in the
phase's output, and the `max-w-2xl` cost accepted in D8 is a cap rather than a
width. So **D8 stands unrevised** and no decision above changes.

What the phase lacked was a mechanism, which is the same defect C10 turned out
to be: the constitution asserted a bar and nothing measured it. That is now
`tests/responsive.spec.ts` plus the second Playwright viewport in
`playwright.config.ts`, which cover this phase's layout as a consequence of
covering every phase after it.

One change did land in this phase's code: the vertical rhythm on `<main>` moved
from a constant `py-16` to `py-12 sm:py-16`. 64px of dead space top and bottom
costs roughly a fifth of a phone viewport before any content appears. That is a
layout fault at a width, not a design pass — the Phase 8 boundary in D5 is
untouched.

No new C-numbered check is added here. Phase 0's checks are closed, and the
convention is inherited by every phase from
[tech-stack.md](../tech-stack.md#quality-gates) rather than restated per phase.
