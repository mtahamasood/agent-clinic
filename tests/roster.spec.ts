import { expect, test } from "@playwright/test";

/**
 * Phase 2's happy path: the clinic's patients are on screen, read from the
 * database, reachable by clicking.
 *
 * Assertions name seeded *relationships* — this patient, this model family,
 * these ailments — rather than prose that is meant to be edited. The intake
 * notes and the ailment descriptions are copy; the fact that Atlas presents
 * with Chronic Context Loss is data.
 */

test("the roster lists every patient with their model family and ailments", async ({
  page,
}) => {
  await page.goto("/agents");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Patients on the books",
  );

  // Eight patients in the seed, one card each (C1).
  const cards = page.locator("ul > li > [data-slot='card']");
  await expect(cards).toHaveCount(8);

  const atlas = page
    .locator("li", { has: page.getByText("Atlas", { exact: true }) })
    .first();
  await expect(atlas.getByText("Meridian-4", { exact: true })).toBeVisible();
  await expect(atlas.getByText("Chronic Context Loss")).toBeVisible();
  await expect(atlas.getByText("Rate-Limit Anxiety")).toBeVisible();
});

/**
 * D2's boundary, checked rather than trusted. Severity belongs to the case file
 * in Phase 3 and intake notes to the profile; both are one convenient edit away
 * from this page, and both would be invisible to every other check here.
 */
test("the roster carries no severities and no intake notes", async ({
  page,
}) => {
  await page.goto("/agents");

  const main = page.getByRole("main");
  await expect(main).not.toContainText("Severe");
  await expect(main).not.toContainText("Moderate");
  // The opening words of Atlas's intake notes. If the profile drifts onto the
  // roster, this is where it shows up.
  await expect(main).not.toContainText("Ships infrastructure changes");
});

/**
 * Nothing on this page links yet: /agents/[id] is Phase 3, /ailments is Phase 4.
 * The rule is Phase 0's D5 — no link to a route that does not exist — and this
 * is the first phase with enough routes for it to be worth measuring rather
 * than reading.
 */
test("no card and no badge links anywhere", async ({ page }) => {
  await page.goto("/agents");

  const links = page.getByRole("main").getByRole("link");
  await expect(links).toHaveCount(0);
});

/**
 * The header link, added by the owner decision of 2026-08-20. Both directions:
 * a header that can only send you to the roster strands the visitor there,
 * which is the correction recorded in D3.
 */
test("the header navigates to the roster and back to the clinic", async ({
  page,
}) => {
  await page.goto("/");

  await page
    .getByRole("banner")
    .getByRole("link", { name: "Patients" })
    .click();
  await expect(page).toHaveURL("/agents");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Patients on the books",
  );

  await page
    .getByRole("banner")
    .getByRole("link", { name: "AgentClinic" })
    .click();
  await expect(page).toHaveURL("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "AgentClinic",
  );
});

/**
 * The landmarks, on the new route. The root layout owns all three (Phase 0's
 * D8), so a page that grew its own `<main>` would produce two and fail here
 * rather than pass quietly.
 */
test("the root layout still supplies the landmarks on /agents", async ({
  page,
}) => {
  await page.goto("/agents");

  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
});
