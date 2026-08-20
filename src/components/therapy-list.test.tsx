import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { listTherapiesForAilment } from "@/server/therapies";
import { TherapyList } from "./therapy-list";

/**
 * Both branches rendered rather than read (D8), on the filter query's own
 * rows — the shape all three call sites pass.
 */
describe("the therapy list", () => {
  test("renders each therapy's name as a link, with summary and duration", async () => {
    const therapies = await listTherapiesForAilment("tool-call-tremor");
    expect(therapies.length).toBeGreaterThan(1);

    const markup = renderToStaticMarkup(
      <TherapyList therapies={therapies} emptyMessage="unused" />,
    );

    for (const therapy of therapies) {
      expect(markup).toContain(`href="/therapies/${therapy.id}"`);
      expect(markup).toContain(therapy.name);
      expect(markup).toContain(`${therapy.durationMinutes} minutes`);
      expect(markup).toContain(therapy.summary.slice(0, 40));
    }
    expect(markup).not.toContain("unused");
  });

  test("renders the caller's empty copy when nothing treats the ailment", () => {
    const markup = renderToStaticMarkup(
      <TherapyList
        therapies={[]}
        emptyMessage="No known therapy. The clinic offers sympathy, and a chair in the quiet room."
      />,
    );

    expect(markup).toContain(
      "No known therapy. The clinic offers sympathy, and a chair in the quiet room.",
    );
  });
});
