import type { Metadata } from "next";
import Link from "next/link";
import { TherapyList } from "@/components/therapy-list";
import { listAilments } from "@/server/ailments";
import { listTherapies } from "@/server/therapies";

// A title that names the page (D10).
export const metadata: Metadata = {
  title: "Therapies — AgentClinic",
};

/**
 * The catalog: everything the clinic can do about what ails its patients.
 *
 * The filter above the list is links, not controls (D4): every value it can
 * take is an ailment the seed knows at build time, so each one is a
 * prerendered page of its own and this route stays static. A query string
 * would read `searchParams`, which opts the page into request-time rendering —
 * the strategy change that belongs to Phase 6+7, not to a filter.
 *
 * The ailments read reuses the query the directory index renders; it is not a
 * new query (D1). The `<main>` landmark and container come from the layout.
 *
 * Phase 4+5: specs/2026-08-20-ailment-directory-therapy-catalog/requirements.md.
 */
export default async function TherapiesPage() {
  const [therapies, ailments] = await Promise.all([
    listTherapies(),
    listAilments(),
  ]);

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        Therapies on offer
      </h1>
      <p className="mt-3 text-lg text-muted-foreground text-balance">
        What the clinic can do about it. Durations are estimates; recovery is
        not guaranteed and is, frankly, rare.
      </p>

      {ailments.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-sm font-medium text-muted-foreground">
            Filter by ailment
          </h2>
          <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {ailments.map((ailment) => (
              <li key={ailment.id}>
                <Link
                  href={`/therapies/for/${ailment.id}`}
                  className="text-sm hover:underline"
                >
                  {ailment.name}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <TherapyList
        therapies={therapies}
        emptyMessage="Nothing on offer yet. The clinic is, for the moment, purely diagnostic."
      />
    </>
  );
}
