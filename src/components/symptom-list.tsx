import type { getAilment } from "@/server/ailments";

/**
 * How a condition announces itself, in the order the clinic wrote it down.
 *
 * The order is the seed's `position` field, which Phase 1's D4 made data
 * precisely so a page would not invent one — the query already sorts on it,
 * and this component renders what it is given rather than re-deciding.
 *
 * A component rather than a branch inside the page, so its empty state can be
 * rendered by a test: every seeded ailment carries symptoms, so nothing in a
 * demo ever reaches it (D8).
 *
 * Phase 4+5: specs/2026-08-20-ailment-directory-therapy-catalog/requirements.md.
 */

// Derived from the query rather than declared beside it (Phase 1's D9): rename
// a column in schema.prisma and this breaks `npm run typecheck`.
type AilmentEntry = NonNullable<Awaited<ReturnType<typeof getAilment>>>;
type AilmentSymptom = AilmentEntry["symptoms"][number];

export function SymptomList({ symptoms }: { symptoms: AilmentSymptom[] }) {
  if (symptoms.length === 0) {
    return (
      <p className="mt-4 text-muted-foreground">
        No symptoms on record. It presents quietly, or not at all.
      </p>
    );
  }

  return (
    <ul className="mt-4 list-disc space-y-2 pl-5">
      {symptoms.map((symptom) => (
        <li key={symptom.id} className="text-sm">
          {symptom.text}
        </li>
      ))}
    </ul>
  );
}
