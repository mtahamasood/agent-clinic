import type { Metadata } from "next";
import { AilmentList } from "@/components/ailment-list";
import { listAilments } from "@/server/ailments";

// A title that names the page — the 2026-08-20 register entry, applied as D10.
export const metadata: Metadata = {
  title: "Ailments — AgentClinic",
};

/**
 * The directory: every condition the clinic recognises.
 *
 * A list rather than a card grid, deliberately (D2, D3's joint layout note):
 * this is reference material a reader arrives at from a cross-link, not a
 * waiting room to scan side by side, and a single column in reading order is
 * the legible default that leaves treatment to Phase 8.
 *
 * The `<main>` landmark and the container width come from the root layout.
 *
 * Phase 4+5: specs/2026-08-20-ailment-directory-therapy-catalog/requirements.md.
 */
export default async function AilmentsPage() {
  // The query Phase 1 wrote for this page, unchanged (D1).
  const ailments = await listAilments();

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        Recognised ailments
      </h1>
      <p className="mt-3 text-lg text-muted-foreground text-balance">
        Every condition the clinic has a name for, and it has a name for all of
        them.
      </p>

      <AilmentList
        ailments={ailments}
        emptyMessage="No conditions on the books. The agents are all fine, which nobody who works here believes."
      />
    </>
  );
}
