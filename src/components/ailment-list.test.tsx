import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { listAilments } from "@/server/ailments";
import { AilmentList } from "./ailment-list";

/**
 * Both branches rendered rather than read (D8), on the directory's own rows.
 */
describe("the ailment list", () => {
  test("renders each ailment's name as a link, with its summary", async () => {
    const ailments = await listAilments();
    expect(ailments.length).toBeGreaterThanOrEqual(7);

    const markup = renderToStaticMarkup(
      <AilmentList ailments={ailments} emptyMessage="unused" />,
    );

    for (const ailment of ailments) {
      expect(markup).toContain(`href="/ailments/${ailment.id}"`);
      expect(markup).toContain(ailment.name);
      expect(markup).toContain(ailment.summary.slice(0, 40));
    }
    expect(markup).not.toContain("unused");
  });

  test("renders the caller's empty copy when the clinic recognises nothing", () => {
    const markup = renderToStaticMarkup(
      <AilmentList
        ailments={[]}
        emptyMessage="No conditions on the books. The agents are all fine, which nobody who works here believes."
      />,
    );

    expect(markup).toContain(
      "No conditions on the books. The agents are all fine, which nobody who works here believes.",
    );
  });
});
