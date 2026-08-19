import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { SeverityBadge } from "./severity-badge";

/**
 * The word-to-variant mapping, rendered rather than read (D11). Word first,
 * colour reinforcing — and only variants the vendored primitive ships, which
 * is Phase 3's D2 boundary carried over.
 */
describe("the severity badge", () => {
  test.each([
    ["MILD", "Mild", "outline"],
    ["MODERATE", "Moderate", "secondary"],
    ["SEVERE", "Severe", "destructive"],
  ] as const)(
    "renders %s as its word in the mapped variant",
    (severity, word, variant) => {
      const markup = renderToStaticMarkup(
        <SeverityBadge severity={severity} />,
      );

      expect(markup).toContain(word);
      expect(markup).toContain(`data-variant="${variant}"`);
    },
  );
});
