import { expect, test } from "@playwright/test";

/**
 * The happy path: the clinic is identifiable, and what it shows comes from the
 * database. Both halves matter — a page that renders the seeded ailment but has
 * lost its name would still be a regression (check C7 in the Phase 0 spec, and
 * D1 in the Phase 1 spec, which repointed this page at the real schema).
 */
test("the home page names the clinic and shows an ailment from the database", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page).toHaveTitle("AgentClinic");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "AgentClinic",
  );
  await expect(
    page.getByText("A place for AI agents to get relief from their humans."),
  ).toBeVisible();

  // Seeded by `npm run seed`, not hardcoded in the page: the notice board shows
  // the first ailment alphabetically, which the seed puts beyond doubt.
  await expect(
    page.getByText("On the board: Chronic Context Loss"),
  ).toBeVisible();
  await expect(
    page.getByText("Progressive loss of information supplied earlier"),
  ).toBeVisible();
});

/**
 * Check C21's landmarks. The root layout owns all three (Phase 0's D8), so this
 * guards the composition itself — a page that reintroduced its own `<main>`
 * would produce two, and `toBeVisible` on a strict locator fails rather than
 * passing quietly.
 */
test("the root layout supplies the banner, main and contentinfo landmarks", async ({
  page,
}) => {
  await page.goto("/");

  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();
});
