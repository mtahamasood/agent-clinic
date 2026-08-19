import Link from "next/link";
import { SeverityBadge } from "@/components/severity-badge";
import { compareNames } from "@/lib/name-order";
import type { getAilment } from "@/server/ailments";

/**
 * Who has this condition, and how badly each of them has it.
 *
 * The severity is the same fact the case file shows, rendered from the other
 * end: the roadmap sends a reader here to find "other affected agents", and a
 * bare list of names would answer who while withholding how badly — the half a
 * clinic leads with (D2).
 *
 * Alphabetical by patient name, deliberately not worst-first: Phase 3's Q1
 * settled severity order for one list on one page and its record says it
 * installs no product-wide rule. The precedent that carries here is the
 * roster's — a list of patients reads alphabetically. Sorted on a copy,
 * through the pinned collator, as everywhere.
 *
 * A component rather than a branch inside the page, so its empty state can be
 * rendered by a test: every seeded ailment has at least two presenting
 * patients, so nothing in a demo ever reaches it (D8).
 *
 * Phase 4+5: specs/2026-08-20-ailment-directory-therapy-catalog/requirements.md.
 */

// Derived from the query rather than declared beside it (Phase 1's D9).
type AilmentEntry = NonNullable<Awaited<ReturnType<typeof getAilment>>>;
type AilmentDiagnosis = AilmentEntry["diagnoses"][number];

export function PresentingPatients({
  diagnoses,
}: {
  diagnoses: AilmentDiagnosis[];
}) {
  if (diagnoses.length === 0) {
    return (
      <p className="mt-4 text-muted-foreground">
        Nobody on the books presents with this. The clinic keeps the file open
        anyway.
      </p>
    );
  }

  const ordered = diagnoses.toSorted((a, b) =>
    compareNames(a.agent.name, b.agent.name),
  );

  return (
    <ul className="mt-4 space-y-3">
      {ordered.map((diagnosis) => (
        <li
          key={diagnosis.agentId}
          className="flex flex-wrap items-center gap-x-3 gap-y-1"
        >
          <Link
            href={`/agents/${diagnosis.agent.id}`}
            className="font-medium hover:underline"
          >
            {diagnosis.agent.name}
          </Link>
          <SeverityBadge severity={diagnosis.severity} />
        </li>
      ))}
    </ul>
  );
}
