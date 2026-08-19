import { expect, test } from "@playwright/test";

/**
 * Phase 3's happy path: a patient's whole record, reached by clicking their
 * name on the roster.
 *
 * Assertions name seeded *relationships* — this patient presents this ailment at
 * this severity, this therapy was this patient's session — rather than prose
 * that is meant to be edited. No assertion names a date: the format is pinned
 * and unit-tested in `src/lib/clinic-date.test.ts` (D8), and a suite that
 * asserts today's date in prose is a suite that fails at midnight.
 */

test("the roster opens a patient's case file", async ({ page }) => {
  await page.goto("/agents");
  await page.getByRole("link", { name: "Atlas" }).click();

  await expect(page).toHaveURL("/agents/atlas");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Atlas");
  await expect(page).toHaveTitle(/Atlas/);

  // The profile: the three fields the roster deliberately withheld, plus the
  // one it showed (D2).
  const main = page.getByRole("main");
  await expect(main).toContainText("Meridian-4");
  await expect(main).toContainText("Admitted");
  await expect(main).toContainText("Ships infrastructure changes");

  // A diagnosis, with the severity the roster is forbidden to carry.
  await expect(main).toContainText("Chronic Context Loss");
  await expect(main).toContainText("Severe");

  // An appointment, with the therapy at the other end of it.
  await expect(main).toContainText("Context Window Hygiene");
});

/**
 * Worst first, with the tiebreak — owner decision, 2026-08-20 (Q1 in the Phase
 * 3 spec). Read off the rendered page rather than off the sort function, which
 * is check C10's whole point.
 *
 * Bodhi carries one diagnosis at each severity, so the order is unambiguous.
 */
test("a case file lists its ailments worst first", async ({ page }) => {
  await page.goto("/agents/bodhi");

  // Scoped to its own section: the appointments below carry `<h3>` headings of
  // their own, so an unscoped level-3 query collects both lists.
  const ailments = page
    .locator("section", {
      has: page.getByRole("heading", { name: "Presenting ailments" }),
    })
    .getByRole("heading", { level: 3 });
  await expect(ailments).toHaveText([
    "Rate-Limit Anxiety",
    "Tool-Call Tremor",
    "Recursive Self-Doubt",
  ]);

  await expect(page.getByRole("main")).toContainText("Moderate");
});

/**
 * The upcoming/past split (D7). Atlas has a session three days out and Bodhi
 * has one from last week, so the two halves are checked on the patients whose
 * bookings cannot cross the clock while the suite runs — Atlas's other session
 * is today at 10:00, and asserting on that one would pass all morning and start
 * failing at ten.
 */
test("a case file separates what is still to come from what has already happened", async ({
  page,
}) => {
  await page.goto("/agents/atlas");
  // `.last()` for the inner section: the "Appointments" block contains this
  // one, so both match. Same narrowing the roster spec uses for a card inside
  // its list item.
  const upcoming = page
    .locator("section", {
      has: page.getByRole("heading", { name: "Still to come" }),
    })
    .last();
  await expect(upcoming).toContainText("Exponential Backoff Breathing");
  await expect(upcoming).toContainText("Scheduled");

  await page.goto("/agents/bodhi");
  const past = page
    .locator("section", {
      has: page.getByRole("heading", { name: "Already seen" }),
    })
    .last();
  await expect(past).toContainText("Exponential Backoff Breathing");
  await expect(past).toContainText("Completed");
  // Bodhi has nothing booked, so there is no heading over an empty list.
  await expect(page.getByRole("main")).not.toContainText("Still to come");
});

/**
 * An id nobody has: the 404 the roadmap asks for, in voice, inside the clinic's
 * own header and footer (D4).
 *
 * The HTTP status this response carries is deliberately not asserted here.
 * Next's reference says a not-found response is 200 when streamed and 404 when
 * not, so the number is a measurement taken against the production build during
 * the validation walk and recorded in the spec — not a value a test asserts
 * from the source.
 */
test("an unknown patient gets the clinic's own 404", async ({ page }) => {
  await page.goto("/agents/not-a-patient");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "No such patient",
  );
  await expect(page.getByRole("main")).toContainText(
    "The clinic has looked twice",
  );

  // Still the clinic: the masthead, the footer, and the way back.
  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();
  await expect(
    page.getByRole("banner").getByRole("link", { name: "Patients" }),
  ).toBeVisible();
});

/**
 * The landmarks, on the new route. The root layout owns all three (Phase 0's
 * D8), so a page that grew its own `<main>` would produce two and fail here
 * rather than pass quietly.
 */
test("the root layout still supplies the landmarks on a case file", async ({
  page,
}) => {
  await page.goto("/agents/atlas");

  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("main")).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
});

/**
 * The roadmap's exit criterion is "every agent on the roster opens a complete
 * case file", so every one of them is opened rather than the one the test
 * happened to pick (C1).
 */
test("every patient on the roster opens a file of their own", async ({
  page,
}) => {
  await page.goto("/agents");

  const names = await page
    .getByRole("main")
    .getByRole("link")
    .evaluateAll((links) =>
      links.map((link) => ({
        name: link.textContent?.trim() ?? "",
        href: link.getAttribute("href") ?? "",
      })),
    );
  expect(names).toHaveLength(8);

  for (const { name, href } of names) {
    await page.goto(href);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);
    // A complete file, not a stub: the profile and both sections.
    await expect(page.getByRole("main")).toContainText("Admitted");
    await expect(
      page.getByRole("heading", { level: 2, name: "Presenting ailments" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "Appointments" }),
    ).toBeVisible();
  }
});
