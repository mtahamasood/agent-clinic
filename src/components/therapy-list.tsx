import Link from "next/link";

/**
 * Therapies, in catalog form: the name linking to its entry, the one-line
 * summary, and the duration with its unit written out (D3).
 *
 * Three pages render this shape — the catalog, the catalog filtered to one
 * ailment, and an ailment entry's "Treated by" section — so the entry layout
 * lives once. The empty-state copy arrives as a prop because D8 pins one
 * string for the treats-nothing fact on both ailment-scoped pages and a
 * different one for the bare catalog; the strings are pinned in the spec and
 * supplied at the call sites.
 *
 * The prop type is structural rather than tied to one query, because three
 * queries return it: `listTherapies()` and `getAilment().therapies` carry
 * relations this component does not read, and `listTherapiesForAilment()`
 * carries none. The fields named here are still schema-derived — rename one in
 * schema.prisma and `npm run typecheck` breaks at every call site, which
 * passes these props straight off a query (Phase 1's D9, one hop removed).
 *
 * Phase 4+5: specs/2026-08-20-ailment-directory-therapy-catalog/requirements.md.
 */

import type { listTherapiesForAilment } from "@/server/therapies";

type TherapyEntry = Awaited<ReturnType<typeof listTherapiesForAilment>>[number];

export function TherapyList({
  therapies,
  emptyMessage,
}: {
  therapies: TherapyEntry[];
  emptyMessage: string;
}) {
  if (therapies.length === 0) {
    return <p className="mt-4 text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <ul className="mt-4 space-y-4">
      {therapies.map((therapy) => (
        <li
          key={therapy.id}
          className="border-t border-foreground/10 pt-4 first:border-t-0 first:pt-0"
        >
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <Link
              href={`/therapies/${therapy.id}`}
              className="font-medium hover:underline"
            >
              {therapy.name}
            </Link>
            <span className="text-sm text-muted-foreground">
              {therapy.durationMinutes} minutes
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {therapy.summary}
          </p>
        </li>
      ))}
    </ul>
  );
}
