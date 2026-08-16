import { expect, test } from "@playwright/test";

/**
 * Phase 0's happy path: the clinic is identifiable, and what it shows comes
 * from the database. Both halves matter — a page that renders the seeded
 * notice but has lost its name would still be a regression (check C7).
 */
test("the home page names the clinic and shows the seeded notice", async ({
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

  // Seeded by `npm run seed`, not hardcoded in the page.
  await expect(
    page.getByText("nothing said in the waiting room enters your context"),
  ).toBeVisible();
});
