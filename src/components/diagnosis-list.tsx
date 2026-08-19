import { Badge } from "@/components/ui/badge";
import { formatClinicDate } from "@/lib/clinic-date";
import { compareNames } from "@/lib/name-order";
import { compareSeverity, severityLabel } from "@/lib/severity";
import type { Severity } from "@/generated/prisma/enums";
import type { getAgent } from "@/server/agents";

/**
 * Everything the clinic has diagnosed in one patient.
 *
 * Worst first, ties broken alphabetically (D6). A patient's file exists to
 * answer what is wrong with this one, and the answer is the severe row — which
 * is the owner's decision of 2026-08-20, taken because it reverses what
 * `src/lib/severity.ts` had asserted since Phase 1 and a written source is not
 * something an implementation overrules by itself.
 *
 * A component rather than a branch inside the page, so its empty state can be
 * rendered by a test: the seed diagnoses all eight patients, so nothing in a
 * demo, a screenshot, or the Playwright run ever reaches it (D9).
 *
 * Phase 3: specs/2026-08-20-agent-case-file/requirements.md.
 */

// Derived from the query rather than declared beside it (D1): rename a column
// in schema.prisma and this breaks `npm run typecheck`. `getAgent` is nullable
// because a wrong id is a real case — the page handles that with notFound()
// long before this component sees anything.
type CaseFile = NonNullable<Awaited<ReturnType<typeof getAgent>>>;
type CaseFileDiagnosis = CaseFile["diagnoses"][number];

// The vendored primitive's own variants and nothing else (D2's boundary). A
// severity colour scale of our own would be a design decision with no source,
// in the phase least equipped to make one — and the word carries the meaning
// here regardless, which is why it is written out beside the colour.
const SEVERITY_VARIANT: Record<
  Severity,
  "outline" | "secondary" | "destructive"
> = {
  MILD: "outline",
  MODERATE: "secondary",
  SEVERE: "destructive",
};

export function DiagnosisList({
  diagnoses,
}: {
  diagnoses: CaseFileDiagnosis[];
}) {
  if (diagnoses.length === 0) {
    return (
      <p className="mt-4 text-muted-foreground">
        No diagnosis on file yet. The intake notes are all the clinic has to go
        on.
      </p>
    );
  }

  // `toSorted` rather than a copy-then-sort: the array comes straight from the
  // query, and a component that reorders its own props in place is a bug that
  // only shows itself once something else reads them.
  //
  // Negated rather than argument-swapped, so the reversal says so out loud. The
  // tiebreak is not decoration: Roux presents two MODERATE diagnoses and Nim two
  // MILD ones, and without it those pairs come out in whatever order the
  // database happened to return.
  const ordered = diagnoses.toSorted(
    (a, b) =>
      -compareSeverity(a.severity, b.severity) ||
      compareNames(a.ailment.name, b.ailment.name),
  );

  return (
    <ul className="mt-4 space-y-4">
      {ordered.map((diagnosis) => (
        <li
          key={diagnosis.ailmentId}
          className="border-t border-foreground/10 pt-4 first:border-t-0 first:pt-0"
        >
          {/* Wraps rather than pushing the container wide: at 320px a long
              ailment name and its severity need two lines, and taking them is
              cheaper than a horizontal scrollbar. */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {/* Not a heading. One heading level meaning two different things in
                one document — an item title here, a group label over the
                appointments — is what made a Playwright locator need a comment
                apologising for itself. Items are items in both lists now, and
                `<h3>` belongs to the appointment groups alone. */}
            <p className="font-medium">{diagnosis.ailment.name}</p>
            <Badge variant={SEVERITY_VARIANT[diagnosis.severity]}>
              {severityLabel(diagnosis.severity)}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Diagnosed {formatClinicDate(diagnosis.diagnosedOn)}
          </p>
          {diagnosis.notes ? (
            <p className="mt-2 text-sm text-muted-foreground italic">
              {diagnosis.notes}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}
