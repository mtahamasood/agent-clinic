import { Severity } from "@/generated/prisma/enums";

/**
 * What the schema cannot say about severity.
 *
 * The vocabulary itself is a Prisma enum, so the type and the values are
 * generated and every unknown value fails at the client. What is left over is
 * order and wording (D5).
 *
 * The order is stated rather than sorted for. Today these three words happen to
 * come out right alphabetically, which is a coincidence of vocabulary and not a
 * rule — `ACUTE` or `CRITICAL` would break it, and would break it silently in
 * whichever list forgot to use `compareSeverity`.
 */

/// Mildest first. Reverse it for a triage list; a case file reads better this way.
export const SEVERITIES_BY_CLINICAL_ORDER = [
  Severity.MILD,
  Severity.MODERATE,
  Severity.SEVERE,
] as const;

const RANK: Record<Severity, number> = {
  [Severity.MILD]: 0,
  [Severity.MODERATE]: 1,
  [Severity.SEVERE]: 2,
};

const LABELS: Record<Severity, string> = {
  [Severity.MILD]: "Mild",
  [Severity.MODERATE]: "Moderate",
  [Severity.SEVERE]: "Severe",
};

/** How the clinic writes a severity down. */
export function severityLabel(severity: Severity): string {
  return LABELS[severity];
}

/** Negative when `a` is the milder of the two. Sorts a case file worst-last. */
export function compareSeverity(a: Severity, b: Severity): number {
  return RANK[a] - RANK[b];
}
