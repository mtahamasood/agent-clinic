import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import LoadingRoster from "./loading";
import AgentsPage from "./page";

/**
 * What can honestly be checked about the loading state, and a note about what
 * cannot.
 *
 * D6 predicted that a statically prerendered route gives `loading.tsx` almost
 * no window to appear in. Measured during the Phase 2 walk, it has none at all:
 * the router prefetches the whole payload for a static route, and when the
 * prefetch is held the navigation simply does not commit until it lands — there
 * is no partial state for the boundary to fill, because a prerendered segment
 * is not streamed. A Playwright test was written for it and deleted; the
 * finding is in validation.md.
 *
 * So this file checks the two things that are true regardless of whether Next
 * ever shows the file: it renders, in voice, and in the same grid as the roster
 * so nothing jumps when the swap does start happening — which is Phase 6, where
 * the rendering strategy changes.
 */
describe("the roster's loading state", () => {
  test("renders in clinic voice", () => {
    const markup = renderToStaticMarkup(<LoadingRoster />);

    expect(markup).toContain("Patients on the books");
    expect(markup).toContain("The clinic keeps good records and slow drawers.");
  });

  test("uses the same grid as the roster, so the page does not jump", async () => {
    const loading = renderToStaticMarkup(<LoadingRoster />);
    const roster = renderToStaticMarkup(await AgentsPage());

    const gridClasses = (markup: string) =>
      markup.match(/class="([^"]*grid[^"]*)"/)?.[1];

    expect(gridClasses(loading)).toBeDefined();
    expect(gridClasses(loading)).toBe(gridClasses(roster));
  });
});
