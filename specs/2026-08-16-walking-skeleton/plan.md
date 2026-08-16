# Plan — Walking skeleton

Task groups for **Phase 0**. Scope and decisions live in
[requirements.md](requirements.md); the pass/fail bar lives in
[validation.md](validation.md).

Groups are ordered by dependency. Each one ends somewhere you could stop and
still have a coherent repo.

---

## 1. Project scaffold

1.1 Initialise Next.js (App Router) with TypeScript into the repo root,
    preserving the existing `README.md` and `specs/`.
1.2 Set `"strict": true` in `tsconfig.json`; confirm no `any` anywhere.
1.3 Confirm the generated tree matches the layout in
    [tech-stack.md](../tech-stack.md) — `src/app`, `src/components`, `src/lib`,
    `src/server`. Create the empty ones as needed.
1.4 Add `.gitignore` entries for `node_modules`, `.next`, `*.db`, `.env`.

**Ends with:** `npm run dev` serves the default page.

---

## 2. Styling toolchain

2.1 Install and configure Tailwind CSS; wire the global stylesheet.
2.2 Run `shadcn init` — theming, CSS variables, `cn` utility, `components.json`.
2.3 Pull in exactly one primitive: `Card`. No others (D2).

**Ends with:** a Tailwind-styled page rendering a shadcn `Card`.

---

## 3. Database

3.1 Install Prisma and the libSQL driver adapter.
3.2 Write `prisma/schema.prisma` with the single `ClinicNotice` model from D1.
3.3 Configure `DATABASE_URL` for a local file (`file:./clinic.db`); document
    `DATABASE_AUTH_TOKEN` as remote-only. Add `.env.example`.
3.4 Create the first migration and run `prisma migrate deploy` locally.
3.5 Write the Prisma client singleton in `src/lib/` — one instance, adapter
    configured from `DATABASE_URL` alone, no branch on deploy target.
3.6 Write `prisma/seed.ts` seeding one `ClinicNotice` in clinic voice. Seeding
    is idempotent — running it twice does not produce two notices.

**Ends with:** `npm run seed` populates the local database file.

---

## 4. The data path

4.1 Write the data-access function in `src/server/` that reads the single
    `ClinicNotice`.
4.2 Make `/` a Server Component that calls it and renders the `message` inside
    the shadcn `Card`.
4.3 Handle the no-row case in voice, without crashing.

**Ends with:** `npm run dev` shows database-backed content — the first roadmap
exit criterion.

---

## 5. Minimal home page

Group 4 proves the data path but leaves the product anonymous — a bare card with
a sentence in it. This group makes `/` recognisably AgentClinic and stops there.
Bounded by D5.

5.1 Root layout: `<html lang="en">` and a body composing three parts — a
    `ClinicHeader` carrying the clinic name, a `<main>` landmark holding the
    page container width, and a `ClinicFooter` of one line in clinic voice
    (D8). Pages supply content only; they do not declare their own `<main>`.
5.2 On `/`, an `<h1>` with the clinic name and a one-line tagline in clinic
    voice, taken from the one-liner in [mission.md](../mission.md#the-one-liner).
5.3 Present the `ClinicNotice` `Card` from group 4 beneath it, framed as the
    clinic's notice board rather than a loose card.
5.4 Add no navigation, in the header or the footer. Routes beyond `/` do not
    exist until Phase 2, and a link to a 404 is worse than no link (D5).
5.5 Check heading hierarchy — exactly one `<h1>`. (This task's AA-contrast half
    was struck with the accessibility requirement — D10.)

**Ends with:** a first-time viewer can say what the product is, and the notice on
screen still comes from the database.

---

## 6. Tests

6.1 Install and configure Vitest; one passing unit test over the data-access
    function or seed helper.
6.2 Install Playwright.
6.3 Configure `webServer` to run `npm run build && npm start` (D3).
6.4 Write one spec asserting both halves of the page: the clinic name is
    present, and so is the seeded notice text.

**Ends with:** `npm test` and the Playwright run both pass.

---

## 7. Quality gates

7.1 Configure ESLint and Prettier; resolve every existing violation.
7.2 Add an npm script chaining the gates for local use.
7.3 Add `.github/workflows/ci.yml` running `npm run typecheck`, ESLint, Prettier
    `--check`, Vitest, and Playwright on push (D4). CI provisions its own
    database file — migrate, then seed, before the E2E step.

**Ends with:** a green CI run on this branch.

---

## 8. Documentation

8.1 Rewrite `README.md` to document install, dev, build, start, seed, and test —
    for **both** deploy targets, per the table in
    [tech-stack.md](../tech-stack.md#deployment).
8.2 Verify each documented command by running it, in order, from a clean clone.
    Commands are documented because they were run, not because they seemed
    right.
8.3 Keep the stakeholder input section in `README.md` intact.

**Ends with:** every claim in the README verified.

---

## 9. Close the phase

9.1 Walk [validation.md](validation.md) end to end and record the result.
9.2 Confirm no scope from groups 1–8 leaked into Phase 1, 7, or 8 territory —
    the four real nouns are still absent, `/` carries no dashboard content, and
    nothing has been styled beyond legible defaults.
9.3 Open the PR.
