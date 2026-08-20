import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { getAilment } from "@/server/ailments";
import { PresentingPatients } from "./presenting-patients";

/**
 * Both branches rendered rather than read (D8), on a real seeded ailment.
 *
 * Chronic Context Loss is the fixture on purpose: its three patients arrive
 * from the query in diagnosis order and carry three different severities, so
 * the alphabetical sort and the each-patient's-own-severity claim are both
 * observable here rather than passing by coincidence.
 */
describe("the presenting-patients list", () => {
  test("lists every presenting patient alphabetically, each with their own severity", async () => {
    const ailment = await getAilment("chronic-context-loss");
    expect(ailment).not.toBeNull();

    const markup = renderToStaticMarkup(
      <PresentingPatients diagnoses={ailment!.diagnoses} />,
    );

    for (const diagnosis of ailment!.diagnoses) {
      expect(markup).toContain(`href="/agents/${diagnosis.agent.id}"`);
      expect(markup).toContain(diagnosis.agent.name);
    }

    // Alphabetical: Atlas (Severe) before Nim (Mild) before Wren (Moderate).
    const atlas = markup.indexOf(">Atlas<");
    const nim = markup.indexOf(">Nim<");
    const wren = markup.indexOf(">Wren<");
    expect(atlas).toBeGreaterThan(-1);
    expect(nim).toBeGreaterThan(atlas);
    expect(wren).toBeGreaterThan(nim);

    // Each severity is the patient's own: the word sits in the same list item
    // as the name, checked by slicing the markup between entries.
    const atlasEntry = markup.slice(atlas, nim);
    const nimEntry = markup.slice(nim, wren);
    const wrenEntry = markup.slice(wren);
    expect(atlasEntry).toContain("Severe");
    expect(nimEntry).toContain("Mild");
    expect(wrenEntry).toContain("Moderate");
  });

  test("says so in voice when nobody presents with a condition", () => {
    const markup = renderToStaticMarkup(<PresentingPatients diagnoses={[]} />);

    expect(markup).toContain(
      "Nobody on the books presents with this. The clinic keeps the file open anyway.",
    );
  });
});
