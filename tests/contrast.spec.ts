import { expect, test } from "@playwright/test";

/**
 * Check C10: every text colour used meets WCAG AA against its background.
 *
 * tech-stack.md puts contrast in the Playwright pass "not by vibes", so this
 * measures rather than eyeballs. No axe dependency: C10 asks about contrast
 * specifically, and the maths is short enough that a library would cost an
 * install for one formula.
 *
 * Colours are resolved by painting them to a canvas rather than parsing the
 * computed value — Chromium reports these tokens as `lab(...)`, which no
 * hand-written rgb() parser would read correctly.
 *
 * Phase 0 ships light only. The `.dark` class from the shadcn preset is never
 * applied, so it is deliberately not measured here; it becomes real work when a
 * theme toggle lands.
 */
test("every text colour on / meets WCAG AA", async ({ page }) => {
  await page.goto("/");

  const samples = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 1;
    const ctx = canvas.getContext("2d")!;

    // Painting to a canvas resolves any CSS colour syntax to sRGB bytes.
    const toRgba = (css: string): [number, number, number, number] => {
      ctx.clearRect(0, 0, 1, 1);
      ctx.fillStyle = "#000";
      ctx.fillStyle = css;
      ctx.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
      return [r, g, b, a / 255];
    };

    const luminance = (r: number, g: number, b: number) => {
      const channel = (v: number) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
      };
      return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
    };

    // Source-over compositing. Translucent text (`text-foreground/25` and
    // friends) is what the eye actually sees blended onto its backdrop, so
    // ignoring alpha would score 25%-opacity black as if it were solid black.
    const over = (
      fg: [number, number, number, number],
      bg: [number, number, number],
    ): [number, number, number] => [
      fg[0] * fg[3] + bg[0] * (1 - fg[3]),
      fg[1] * fg[3] + bg[1] * (1 - fg[3]),
      fg[2] * fg[3] + bg[2] * (1 - fg[3]),
    ];

    // Walk up compositing every layer, so partly-transparent backgrounds stack
    // the way they paint. Terminates on the first fully opaque layer.
    const backgroundOf = (el: Element): [number, number, number] => {
      const layers: [number, number, number, number][] = [];
      let node: Element | null = el;
      while (node) {
        const layer = toRgba(getComputedStyle(node).backgroundColor);
        if (layer[3] > 0) layers.push(layer);
        if (layer[3] === 1) break;
        node = node.parentElement;
      }
      let out: [number, number, number] = [255, 255, 255];
      for (const layer of layers.reverse()) out = over(layer, out);
      return out;
    };

    const IGNORED = new Set(["SCRIPT", "STYLE", "TITLE", "NOSCRIPT", "HEAD"]);

    return Array.from(document.querySelectorAll("body *"))
      .filter((el) => !IGNORED.has(el.tagName))
      .filter((el) =>
        Array.from(el.childNodes).some(
          (n) => n.nodeType === Node.TEXT_NODE && n.textContent?.trim(),
        ),
      )
      .map((el) => {
        const cs = getComputedStyle(el);
        const backdrop = backgroundOf(el);
        // Composite the text colour onto its backdrop before measuring.
        const [fr, fg, fb] = over(toRgba(cs.color), backdrop);
        const a = luminance(fr, fg, fb);
        const b = luminance(...backdrop);
        const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);

        const px = parseFloat(cs.fontSize);
        const bold = parseInt(cs.fontWeight, 10) >= 700;
        // WCAG "large text": 24px, or 18.66px when bold.
        const large = px >= 24 || (px >= 18.66 && bold);

        return {
          label: `<${el.tagName.toLowerCase()}> "${el.textContent?.trim().slice(0, 40)}"`,
          ratio: Math.round(ratio * 100) / 100,
          required: large ? 3 : 4.5,
        };
      });
  });

  // A page that rendered no text would otherwise pass this test vacuously.
  expect(samples.length).toBeGreaterThan(3);

  const failures = samples.filter((s) => s.ratio < s.required);
  expect(
    failures,
    `Text below WCAG AA:\n${failures
      .map((f) => `  ${f.label} — ${f.ratio}:1, needs ${f.required}:1`)
      .join("\n")}`,
  ).toEqual([]);
});
