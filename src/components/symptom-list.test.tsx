import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { getAilment } from "@/server/ailments";
import { SymptomList } from "./symptom-list";

/**
 * Both branches rendered rather than read — the Phase 2 fixture pattern, on a
 * real seeded ailment from the suite's own database. The empty branch is the
 * reason the file exists: every seeded ailment carries symptoms, so nothing in
 * a demo ever reaches it (D8).
 */
describe("the symptom list", () => {
  test("renders every symptom in the seeded presentation order", async () => {
    const ailment = await getAilment("chronic-context-loss");
    expect(ailment).not.toBeNull();

    const markup = renderToStaticMarkup(
      <SymptomList symptoms={ailment!.symptoms} />,
    );

    // In `position` order, which the query applies and the component must not
    // undo: each symptom's text appears after the previous one's.
    let cursor = 0;
    for (const symptom of ailment!.symptoms) {
      const at = markup.indexOf(symptom.text.slice(0, 40), cursor);
      expect(at, `missing or out of order: ${symptom.text}`).toBeGreaterThan(
        -1,
      );
      cursor = at;
    }
    expect(markup).not.toContain("No symptoms on record.");
  });

  test("says so in voice when a condition has no recorded symptoms", () => {
    const markup = renderToStaticMarkup(<SymptomList symptoms={[]} />);

    expect(markup).toContain(
      "No symptoms on record. It presents quietly, or not at all.",
    );
  });
});
