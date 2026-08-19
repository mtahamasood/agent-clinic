import { expect, test } from "@playwright/test";

/**
 * The responsive-design convention in specs/tech-stack.md, made executable.
 *
 * It exists because the constitution asserted a responsive layout in three
 * places and nothing measured any of them — the same shape of hole that check
 * C10 turned out to be in Phase 0. A bar nobody can fail is not a bar.
 *
 * Every spec in this directory already runs at both project viewports (see
 * `projects` in playwright.config.ts). This file adds the checks that are about
 * width specifically, and sweeps the range rather than trusting two points.
 *
 * Phase 2 widened it from one route to every route. Until then the only page
 * was `/` — prose in a capped container, which is the easy case. The roster is
 * a card grid, which is where "fluid by default" stops being free, so a sweep
 * that still visited only `/` would pass while the roster overflowed (C16).
 */

// Every route the site has. A new phase adds its route here; a phase that
// forgets is a phase whose layout is unmeasured. The case file is a seeded id
// rather than a placeholder — `atlas` is hand-written in prisma/seed-data.ts
// precisely so it can be named in a URL.
const ROUTES = [
  "/",
  "/agents",
  "/agents/atlas",
  "/ailments",
  "/ailments/chronic-context-loss",
  "/therapies",
  "/therapies/peer-review-circle",
  "/therapies/for/tool-call-tremor",
];

// 320px is the narrowest viewport the convention supports; 1536px is a wide
// desktop. The middle values sit either side of Tailwind's `sm` and `lg`
// breakpoints, which is where a layout that reflows badly gives itself away.
const WIDTHS = [320, 480, 640, 1024, 1536];

for (const route of ROUTES) {
  for (const width of WIDTHS) {
    test(`${route} does not scroll sideways at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route);

      // scrollWidth exceeding clientWidth is horizontal overflow, whatever
      // caused it. Measured on the element that actually scrolls, not on
      // `body` — a body can stay narrow while the document overflows.
      const { scrollWidth, clientWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        clientWidth: document.documentElement.clientWidth,
      }));

      expect(
        scrollWidth,
        `horizontal overflow at ${width}px on ${route}: content is ${scrollWidth}px wide in a ${clientWidth}px viewport`,
      ).toBeLessThanOrEqual(clientWidth);
    });
  }

  /**
   * Fluid-by-default, stated as a measurement. At 320px the container must fill
   * the viewport minus its own gutters — a container that stays wider is the
   * fixed-width failure the convention forbids, and one that collapses far
   * narrower means something upstream is constraining it.
   *
   * Verified by breaking it, and the break taught something: `<main>` is a flex
   * child of `<body>`, so `flex-shrink` quietly pulls even an explicit
   * `w-[1100px]` back to the viewport width and this measurement still passes.
   * The width assertion alone is therefore not sufficient. What actually
   * catches a fixed width is the overflow sweep above (a fixed-width *child*
   * cannot be shrunk into place) and the cap assertion below. The gutter checks
   * here are the part that earns its keep.
   */
  test(`the main container on ${route} is fluid below its max width`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 320, height: 900 });
    await page.goto(route);

    const main = page.getByRole("main");
    const box = await main.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBe(320);

    // `px-6` is 24px a side. The text inside must respect it rather than bleed
    // to the edge, which is what a fixed-width child would do.
    const heading = page.getByRole("heading", { level: 1 });
    const headingBox = await heading.boundingBox();
    expect(headingBox).not.toBeNull();
    expect(headingBox!.x).toBeGreaterThanOrEqual(24);
    expect(headingBox!.x + headingBox!.width).toBeLessThanOrEqual(320 - 24);
  });

  /**
   * The container caps rather than stretches. `max-w-2xl` is 42rem = 672px, and
   * D8 in the Phase 0 spec accepted that cap binding every route from one place.
   *
   * Phase 2 put that cap to the question — a two-column roster in 672px is a
   * narrow strip on a projector — and the owner kept it on 2026-08-20 (Q1 in
   * specs/2026-08-20-agent-roster/requirements.md), because widening later is
   * this constant and one utility class, while narrowing after Phase 8 has
   * designed against a wide page is not. So a change here is still a change
   * argued in a spec, not discovered on a projector.
   */
  test(`the main container on ${route} caps its width on a wide screen`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1536, height: 900 });
    await page.goto(route);

    const box = await page.getByRole("main").boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBe(672);
  });

  /**
   * Mobile-first, checked where it is visible: every `<h1>` carries
   * `sm:text-4xl`, so the phone size is the base style and the desktop size is
   * the addition. If someone inverts that — desktop base, `sm:` shrinking it —
   * this fails.
   */
  test(`type on ${route} scales up from the phone size, not down from the desktop one`, async ({
    page,
  }) => {
    const sizeAt = async (width: number) => {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(route);
      return page
        .getByRole("heading", { level: 1 })
        .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
    };

    // Retried as a unit, because the measurement — not the property — is
    // racy. This failed once during the Phase 2 walk and passed on every run
    // since, on a suite where a resize and a navigation happen back to back and
    // the computed size is read immediately after. A genuine inversion (desktop
    // base, `sm:` shrinking it) fails every attempt and still fails here; a
    // measurement taken a frame early does not.
    await expect(async () => {
      const phone = await sizeAt(375);
      const desktop = await sizeAt(1280);

      expect(phone).toBeLessThan(desktop);
    }).toPass({ timeout: 15_000 });
  });
}

/**
 * The roster grid, which is the specific thing Phase 2 can get wrong (C17).
 *
 * One column on a phone and two above `sm:`, asserted by geometry rather than
 * by reading the class list: a class name is a claim, and two cards sharing a
 * row is the fact.
 */
test("the roster is one column on a phone and more than one on a desktop", async ({
  page,
}) => {
  const firstTwoCardTops = async (width: number) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/agents");
    const cards = page.locator("ul > li > [data-slot='card']");
    // Wait for the thing being measured to be on screen. `boundingBox()`
    // returns null for an element that is not visible yet rather than waiting
    // for one, so measuring straight after a navigation is a race — it lost
    // once during the Phase 3 review, on the phone project, and passed every
    // run either side of it. Pinned rather than re-run: the property is not
    // racy, the measurement was.
    await expect(cards.nth(1)).toBeVisible();
    const first = await cards.nth(0).boundingBox();
    const second = await cards.nth(1).boundingBox();
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    return [first!.y, second!.y] as const;
  };

  const [phoneFirst, phoneSecond] = await firstTwoCardTops(320);
  expect(phoneSecond).toBeGreaterThan(phoneFirst);

  const [wideFirst, wideSecond] = await firstTwoCardTops(1280);
  expect(wideSecond).toBe(wideFirst);
});

/**
 * The cards themselves are fluid (C19). The document-level sweep above catches
 * overflow that reaches the viewport; this catches a card that has grown past
 * its container while the page still happens not to scroll, which is what a
 * `whitespace-nowrap` badge on a long ailment name would do.
 */
test("no roster card outgrows its container at 320px", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/agents");

  const main = await page.getByRole("main").boundingBox();
  expect(main).not.toBeNull();
  const limit = main!.x + main!.width - 24; // `px-6` gutter

  const cards = page.locator("ul > li > [data-slot='card']");
  const count = await cards.count();
  expect(count).toBe(8);

  for (let i = 0; i < count; i++) {
    const box = await cards.nth(i).boundingBox();
    expect(box).not.toBeNull();
    expect(
      box!.x + box!.width,
      `roster card ${i} reaches ${box!.x + box!.width}px in a container that ends at ${limit}px`,
    ).toBeLessThanOrEqual(limit);
  }
});

/**
 * The case file's version of the risk the badge row was on the roster (C24).
 *
 * A card grid breaks by being too wide; a record page breaks by refusing to
 * wrap — an intake note or a clinical aside that renders as one long line
 * pushes its own box's contents past the edge.
 *
 * **Measured as overflow, not as geometry, and the reason is a finding from
 * this branch's own review.** The first version of this test compared each
 * block's `boundingBox()` against the container's right edge, which cannot
 * fail: a `<p>` is a block box, so its border box is the container's content
 * width no matter what the text inside does. Adding `whitespace-nowrap` to the
 * intake notes was measured to leave it green. `scrollWidth > clientWidth` is
 * the property that actually moves when content refuses to wrap.
 *
 * Bodhi rather than Atlas, because C24 names three kinds of prose — intake
 * notes, clinical asides, and appointment notes — and Atlas's two appointments
 * carry no notes at all, so a third of the claim had no evidence on the route
 * being measured.
 */
test("the case file's prose wraps inside the container at 320px", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/agents/bodhi");

  const main = page.getByRole("main");
  // All three kinds of prose are on this page, so the measurement below covers
  // what C24 claims rather than two thirds of it.
  await expect(main).toContainText("A research assistant throttled"); // intake
  await expect(main).toContainText("count against its quota"); // clinical aside
  await expect(main).toContainText("Returned four minutes later"); // session note

  const overflowing = await main
    .locator("p, li, h1, h2, h3")
    .evaluateAll((blocks) =>
      blocks
        .filter((block) => block.scrollWidth > block.clientWidth)
        .map((block) => ({
          text: (block.textContent ?? "").slice(0, 40),
          scrollWidth: block.scrollWidth,
          clientWidth: block.clientWidth,
        })),
    );

  expect(
    overflowing,
    `these blocks refuse to wrap at 320px: ${JSON.stringify(overflowing)}`,
  ).toEqual([]);
});
