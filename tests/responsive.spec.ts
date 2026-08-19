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
 */

// 320px is the narrowest viewport the convention supports; 1536px is a wide
// desktop. The middle values sit either side of Tailwind's `sm` and `lg`
// breakpoints, which is where a layout that reflows badly gives itself away.
const WIDTHS = [320, 480, 640, 1024, 1536];

for (const width of WIDTHS) {
  test(`the page does not scroll sideways at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");

    // scrollWidth exceeding clientWidth is horizontal overflow, whatever caused
    // it. Measured on the element that actually scrolls, not on `body` — a body
    // can stay narrow while the document overflows.
    const { scrollWidth, clientWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
    }));

    expect(
      scrollWidth,
      `horizontal overflow at ${width}px: content is ${scrollWidth}px wide in a ${clientWidth}px viewport`,
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
 * The width assertion alone is therefore not sufficient. What actually catches
 * a fixed width is the overflow sweep above (a fixed-width *child* cannot be
 * shrunk into place) and the cap assertion below. The gutter checks here are
 * the part that earns its keep.
 */
test("the main container is fluid below its max width", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 900 });
  await page.goto("/");

  const main = page.getByRole("main");
  const box = await main.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBe(320);

  // `px-6` is 24px a side. The text inside must respect it rather than bleed to
  // the edge, which is what a fixed-width child would do.
  const heading = page.getByRole("heading", { level: 1 });
  const headingBox = await heading.boundingBox();
  expect(headingBox).not.toBeNull();
  expect(headingBox!.x).toBeGreaterThanOrEqual(24);
  expect(headingBox!.x + headingBox!.width).toBeLessThanOrEqual(320 - 24);
});

/**
 * The container caps rather than stretches. `max-w-2xl` is 42rem = 672px, and
 * D8 in the Phase 0 spec accepted that cap binding every route from one place —
 * so a change that let the layout run full-bleed on a wide screen should fail
 * here and be argued in a spec, not discovered on a projector.
 */
test("the main container caps its width on a wide screen", async ({ page }) => {
  await page.setViewportSize({ width: 1536, height: 900 });
  await page.goto("/");

  const box = await page.getByRole("main").boundingBox();
  expect(box).not.toBeNull();
  expect(box!.width).toBe(672);
});

/**
 * Mobile-first, checked where it is visible: the `<h1>` carries `sm:text-4xl`,
 * so the phone size is the base style and the desktop size is the addition. If
 * someone inverts that — desktop base, `sm:` shrinking it — this fails.
 */
test("type scales up from the phone size, not down from the desktop one", async ({
  page,
}) => {
  const sizeAt = async (width: number) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    return page
      .getByRole("heading", { level: 1 })
      .evaluate((el) => parseFloat(getComputedStyle(el).fontSize));
  };

  const phone = await sizeAt(375);
  const desktop = await sizeAt(1280);

  expect(phone).toBeLessThan(desktop);
});
