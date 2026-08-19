import Link from "next/link";
import type { listAilments } from "@/server/ailments";

/**
 * Ailments, in directory form: the name linking to its entry, and the one-line
 * summary the schema keeps for exactly this (D2).
 *
 * Two pages render this shape — the directory index and a therapy entry's
 * "Treats" section — so the entry layout lives once, with the empty-state copy
 * as a prop for the same reason `TherapyList` takes one: the two call sites
 * state different facts when empty, and both strings are pinned in D8.
 *
 * Phase 4+5: specs/2026-08-20-ailment-directory-therapy-catalog/requirements.md.
 */

// Derived from the query rather than declared beside it (Phase 1's D9).
type AilmentEntry = Awaited<ReturnType<typeof listAilments>>[number];

export function AilmentList({
  ailments,
  emptyMessage,
}: {
  ailments: AilmentEntry[];
  emptyMessage: string;
}) {
  if (ailments.length === 0) {
    return <p className="mt-4 text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <ul className="mt-4 space-y-4">
      {ailments.map((ailment) => (
        <li
          key={ailment.id}
          className="border-t border-foreground/10 pt-4 first:border-t-0 first:pt-0"
        >
          <Link
            href={`/ailments/${ailment.id}`}
            className="font-medium hover:underline"
          >
            {ailment.name}
          </Link>
          <p className="mt-1 text-sm text-muted-foreground">
            {ailment.summary}
          </p>
        </li>
      ))}
    </ul>
  );
}
