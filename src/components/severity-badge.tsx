import { Badge } from "@/components/ui/badge";
import { severityLabel } from "@/lib/severity";
import type { Severity } from "@/generated/prisma/enums";

/**
 * A severity, written out and coloured to match.
 *
 * One component because two pages now render the same fact — a diagnosis row
 * on the case file, and a patient's entry on the ailment they present with —
 * and the word-to-variant mapping is the product's rule, not either page's
 * (D11). Word first, colour reinforcing: a colour alone is a claim only the
 * author can read.
 *
 * The mapping uses only variants the vendored primitive ships — Phase 3's D2
 * boundary, carried over verbatim. No new colour, no new class, no severity
 * scale of our own.
 *
 * Phase 4+5: specs/2026-08-20-ailment-directory-therapy-catalog/requirements.md.
 */

const SEVERITY_VARIANT: Record<
  Severity,
  "outline" | "secondary" | "destructive"
> = {
  MILD: "outline",
  MODERATE: "secondary",
  SEVERE: "destructive",
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  return (
    <Badge variant={SEVERITY_VARIANT[severity]}>
      {severityLabel(severity)}
    </Badge>
  );
}
