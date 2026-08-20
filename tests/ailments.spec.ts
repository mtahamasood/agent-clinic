import { expect, test } from "@playwright/test";

/**
 * Phase 4+5, the directory half: every condition has an entry, the entry says
 * everything the roadmap asked it to, and the cross-links actually go where
 * they claim (D2, D5).
 *
 * Assertions name seeded relationships — this ailment, these patients, these
 * severities, this therapy — plus the short openings of prose where a section's
 * presence cannot be told apart from its absence any other way, the precedent
 * the case-file spec set with the intake notes.
 */

test("the directory lists every recognised condition with its summary", async ({
  page,
}) => {
  await page.goto("/ailments");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Recognised ailments",
  );
  await expect(page).toHaveTitle("Ailments — AgentClinic");

  // Eight ailments in the seed, each linking to its own entry and nothing
  // else linking (D5's boundary at index scale).
  const links = page.getByRole("main").getByRole("link");
  await expect(links).toHaveCount(8);
  await expect(
    page.getByRole("link", { name: "Chronic Context Loss" }),
  ).toHaveAttribute("href", "/ailments/chronic-context-loss");
  // A summary rides along with its name.
  await expect(page.getByRole("main")).toContainText(
    "Progressive loss of information supplied earlier",
  );
});

test("an ailment's entry carries the write-up, the symptoms, the patients, and the treatments", async ({
  page,
}) => {
  await page.goto("/ailments/chronic-context-loss");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Chronic Context Loss",
  );
  await expect(page).toHaveTitle("Chronic Context Loss — AgentClinic");

  const main = page.getByRole("main");
  // The clinical description, present in full rather than summarised (D2).
  await expect(main).toContainText("The gradual and irreversible shedding");

  // Symptoms in seeded `position` order: 1 before 2 before 3, read off the
  // rendered list rather than off the query.
  const symptoms = page
    .locator("section", {
      has: page.getByRole("heading", { name: "Presenting symptoms" }),
    })
    .locator("li");
  await expect(symptoms.nth(0)).toContainText("Requests a file path");
  await expect(symptoms.nth(1)).toContainText("Refers to work it completed");
  await expect(symptoms.nth(2)).toContainText(
    "Reads the same configuration file",
  );
});

/**
 * The severity beside each patient is that patient's own (C5), and the list is
 * alphabetical (C6). Chronic Context Loss is the one seeded ailment with three
 * presenting patients at three severities, and their alphabetical order —
 * Atlas, Nim, Wren — differs from the diagnosis order the query returns, so
 * both claims are observable rather than coincidental.
 */
test("patients presenting are alphabetical, each with their own severity", async ({
  page,
}) => {
  await page.goto("/ailments/chronic-context-loss");

  const entries = page
    .locator("section", {
      has: page.getByRole("heading", { name: "Patients presenting" }),
    })
    .locator("li");

  await expect(entries).toHaveText([/Atlas/, /Nim/, /Wren/]);

  // Scoped to the row: three right words against three wrong patients would
  // satisfy an unscoped assertion.
  await expect(entries.nth(0)).toContainText("Severe");
  await expect(entries.nth(1)).toContainText("Mild");
  await expect(entries.nth(2)).toContainText("Moderate");
});

test("an entry's cross-links reach the case file and the catalog", async ({
  page,
}) => {
  await page.goto("/ailments/chronic-context-loss");

  // Directory → case file (C17).
  await page.getByRole("link", { name: "Wren" }).click();
  await expect(page).toHaveURL("/agents/wren");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Wren");

  // Directory → catalog, on the treated-by entry (C17).
  await page.goto("/ailments/chronic-context-loss");
  const treatedBy = page.locator("section", {
    has: page.getByRole("heading", { name: "Treated by" }),
  });
  await expect(treatedBy).toContainText("45 minutes");
  await treatedBy.getByRole("link", { name: "Context Window Hygiene" }).click();
  await expect(page).toHaveURL("/therapies/context-window-hygiene");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Context Window Hygiene",
  );
});

test("the header reaches the directory from anywhere", async ({ page }) => {
  await page.goto("/");

  await page
    .getByRole("banner")
    .getByRole("link", { name: "Ailments" })
    .click();
  await expect(page).toHaveURL("/ailments");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Recognised ailments",
  );
});

/**
 * An unknown condition gets the clinic's own sentence, inside the clinic's own
 * chrome (D7). The HTTP status is the walk's measurement (A9), not an
 * assertion here — the Phase 3 rule.
 */
test("an unknown ailment gets the clinic's own 404", async ({ page }) => {
  await page.goto("/ailments/not-an-ailment");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "No such ailment",
  );
  await expect(page.getByRole("main")).toContainText(
    "consulted its own literature",
  );
  await expect(page).toHaveTitle(/No such ailment/);
  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();
});

test("the root layout still supplies the landmarks on the new routes", async ({
  page,
}) => {
  for (const route of ["/ailments", "/ailments/chronic-context-loss"]) {
    await page.goto(route);
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  }
});

/**
 * The exit criterion is any-ailment, not the one a test picked: all eight
 * entries open and are recognisably complete (C1).
 */
test("every condition in the directory opens an entry of its own", async ({
  page,
}) => {
  await page.goto("/ailments");

  const links = await page
    .getByRole("main")
    .getByRole("link")
    .evaluateAll((anchors) =>
      anchors.map((anchor) => ({
        name: anchor.textContent?.trim() ?? "",
        href: anchor.getAttribute("href") ?? "",
      })),
    );
  expect(links).toHaveLength(8);

  for (const { name, href } of links) {
    await page.goto(href);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);
    await expect(
      page.getByRole("heading", { level: 2, name: "Presenting symptoms" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "Patients presenting" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "Treated by" }),
    ).toBeVisible();
  }
});
