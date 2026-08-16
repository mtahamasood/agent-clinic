import { describe, expect, test } from "vitest";
import { Severity } from "@/generated/prisma/enums";
import {
  SEVERITIES_BY_CLINICAL_ORDER,
  compareSeverity,
  severityLabel,
} from "./severity";

describe("clinical order", () => {
  test("is stated, not derived from the spelling", () => {
    expect([...SEVERITIES_BY_CLINICAL_ORDER]).toEqual([
      Severity.MILD,
      Severity.MODERATE,
      Severity.SEVERE,
    ]);

    // These three words also happen to sort alphabetically into clinical
    // order. That is a coincidence of vocabulary, not a rule: adding ACUTE or
    // CRITICAL breaks it. Anything ordering severities uses compareSeverity.
    expect([...SEVERITIES_BY_CLINICAL_ORDER].sort()).toEqual([
      ...SEVERITIES_BY_CLINICAL_ORDER,
    ]);
  });

  test("sorts a case file worst-last", () => {
    const presented = [Severity.SEVERE, Severity.MILD, Severity.MODERATE];

    expect(presented.sort(compareSeverity)).toEqual([
      Severity.MILD,
      Severity.MODERATE,
      Severity.SEVERE,
    ]);
  });
});

// A value added to the schema without a label here would render as `undefined`
// rather than fail, so the coverage is asserted rather than assumed.
test("every severity in the schema has a label and a rank", () => {
  const all = Object.values(Severity);

  expect([...SEVERITIES_BY_CLINICAL_ORDER]).toEqual(all);
  for (const severity of all) {
    expect(severityLabel(severity)).toMatch(/\S/);
  }
});
