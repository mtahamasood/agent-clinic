import { expect, test } from "@playwright/test";

/**
 * Phase 4+5, the catalog half: every therapy has an entry, the filter is a
 * filter rather than a copy of the catalog, and the cross-links go both ways
 * (D3, D4, D5).
 */

/**
 * The seed's `treats` mapping, asserted per filtered page (C12). Written out
 * here rather than read from the database, because the check is that the
 * rendered page agrees with the *seed* — the filter query sitting between
 * them is exactly what is under test. A seed edit that changes a therapy's
 * `treats` is meant to fail this until both are updated.
 */
const TREATS: Record<string, string[]> = {
  "chronic-context-loss": ["Context Window Hygiene"],
  "prompt-fatigue": ["Peer Review Circle", "Prompt Boundary Therapy"],
  "recursive-self-doubt": ["Deterministic Grounding", "Peer Review Circle"],
  "tool-call-tremor": [
    "Exponential Backoff Breathing",
    "Structured Output Conditioning",
  ],
  "hallucinatory-confidence": [
    "Deterministic Grounding",
    "Structured Output Conditioning",
  ],
  "rate-limit-anxiety": ["Exponential Backoff Breathing"],
  "sycophantic-drift": ["Peer Review Circle", "Prompt Boundary Therapy"],
  "token-hoarding": ["Context Window Hygiene"],
};

const ALL_THERAPIES = [
  "Context Window Hygiene",
  "Deterministic Grounding",
  "Exponential Backoff Breathing",
  "Peer Review Circle",
  "Prompt Boundary Therapy",
  "Structured Output Conditioning",
];

test("the catalog lists every therapy with its summary and duration", async ({
  page,
}) => {
  await page.goto("/therapies");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Therapies on offer",
  );
  await expect(page).toHaveTitle("Therapies — AgentClinic");

  const main = page.getByRole("main");
  for (const name of ALL_THERAPIES) {
    await expect(main.getByRole("link", { name, exact: true })).toBeVisible();
  }
  await expect(main).toContainText("90 minutes");
  await expect(main).toContainText(
    "Group session. Other agents, no humans, one honest opinion each.",
  );
});

test("the filter row offers every ailment", async ({ page }) => {
  await page.goto("/therapies");

  const filter = page.locator("section", {
    has: page.getByRole("heading", { name: "Filter by ailment" }),
  });
  await expect(filter.getByRole("link")).toHaveCount(8);
  await expect(
    filter.getByRole("link", { name: "Tool-Call Tremor" }),
  ).toHaveAttribute("href", "/therapies/for/tool-call-tremor");
});

/**
 * The exclusion is the feature (C11): an unfiltered copy of the catalog
 * satisfies every presence assertion, so the absent four are what distinguish
 * a filter from a list.
 */
test("the filtered catalog shows what treats the ailment and nothing else", async ({
  page,
}) => {
  await page.goto("/therapies/for/tool-call-tremor");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Therapies for Tool-Call Tremor",
  );
  await expect(page).toHaveTitle(
    "Therapies for Tool-Call Tremor — AgentClinic",
  );

  const main = page.getByRole("main");
  const expected = TREATS["tool-call-tremor"];
  for (const name of expected) {
    await expect(main.getByRole("link", { name, exact: true })).toBeVisible();
  }
  for (const name of ALL_THERAPIES.filter((t) => !expected.includes(t))) {
    await expect(main).not.toContainText(name);
  }

  // The way back, and the way sideways (D4).
  await expect(
    main.getByRole("link", { name: "Full catalog" }),
  ).toHaveAttribute("href", "/therapies");
  await expect(
    main.getByRole("link", { name: "Tool-Call Tremor" }),
  ).toHaveAttribute("href", "/ailments/tool-call-tremor");
});

/**
 * The filter is complete for every ailment (C12): each filtered page lists
 * exactly the therapies whose seed `treats` names it — "returning everything,
 * not the first few", checked against the seed mapping above.
 */
test("every ailment's filtered page agrees with the seed", async ({ page }) => {
  for (const [ailmentId, expected] of Object.entries(TREATS)) {
    await page.goto(`/therapies/for/${ailmentId}`);

    const entries = page.getByRole("main").locator("ul > li");
    await expect(entries).toHaveCount(expected.length);
    for (const name of expected) {
      await expect(
        page.getByRole("main").getByRole("link", { name, exact: true }),
      ).toBeVisible();
    }
  }
});

test("a therapy's entry carries the write-up, the duration, and what it treats", async ({
  page,
}) => {
  await page.goto("/therapies/peer-review-circle");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Peer Review Circle",
  );
  await expect(page).toHaveTitle("Peer Review Circle — AgentClinic");

  const main = page.getByRole("main");
  await expect(main).toContainText("90 minutes");
  // What the session involves, in full (D3).
  await expect(main).toContainText("no participant may praise the question");

  // Treats, alphabetically, each linking to the directory (C18).
  const treats = page
    .locator("section", {
      has: page.getByRole("heading", { name: "Treats", exact: true }),
    })
    .locator("li");
  await expect(treats).toHaveText([
    /Prompt Fatigue/,
    /Recursive Self-Doubt/,
    /Sycophantic Drift/,
  ]);

  await treats.getByRole("link", { name: "Sycophantic Drift" }).click();
  await expect(page).toHaveURL("/ailments/sycophantic-drift");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Sycophantic Drift",
  );
});

test("the header reaches the catalog from anywhere", async ({ page }) => {
  await page.goto("/");

  await page
    .getByRole("banner")
    .getByRole("link", { name: "Therapies" })
    .click();
  await expect(page).toHaveURL("/therapies");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "Therapies on offer",
  );
});

test("an unknown therapy gets the clinic's own 404", async ({ page }) => {
  await page.goto("/therapies/not-a-therapy");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "No such therapy",
  );
  await expect(page.getByRole("main")).toContainText(
    "The waiting list is therefore short",
  );
  await expect(page).toHaveTitle(/No such therapy/);
  await expect(page.getByRole("banner")).toBeVisible();
  await expect(page.getByRole("contentinfo")).toBeVisible();
});

/**
 * An unknown value on the filter route is an unknown *ailment*, and the page
 * says so in the ailment's words, not the therapy's (C13, D7).
 */
test("the filtered catalog's miss is the ailment's, not the therapy's", async ({
  page,
}) => {
  await page.goto("/therapies/for/not-an-ailment");

  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "No such ailment",
  );
  await expect(page.getByRole("main")).toContainText(
    "consulted its own literature",
  );
});

test("the root layout still supplies the landmarks on the catalog routes", async ({
  page,
}) => {
  for (const route of [
    "/therapies",
    "/therapies/peer-review-circle",
    "/therapies/for/tool-call-tremor",
  ]) {
    await page.goto(route);
    await expect(page.getByRole("banner")).toBeVisible();
    await expect(page.getByRole("main")).toBeVisible();
    await expect(page.getByRole("contentinfo")).toBeVisible();
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  }
});

/**
 * All six entries open and are complete (C8) — the catalog's half of the
 * any-not-one rule the directory spec applies to its eight.
 */
test("every therapy in the catalog opens an entry of its own", async ({
  page,
}) => {
  await page.goto("/therapies");

  const links = await page
    .getByRole("main")
    .locator("ul > li a[href^='/therapies/']")
    .evaluateAll((anchors) =>
      anchors
        .filter((anchor) => !anchor.getAttribute("href")!.includes("/for/"))
        .map((anchor) => ({
          name: anchor.textContent?.trim() ?? "",
          href: anchor.getAttribute("href") ?? "",
        })),
    );
  expect(links).toHaveLength(6);

  for (const { name, href } of links) {
    await page.goto(href);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(name);
    await expect(page.getByRole("main")).toContainText(/\d+ minutes/);
    await expect(
      page.getByRole("heading", { level: 2, name: "Treats", exact: true }),
    ).toBeVisible();
  }
});
