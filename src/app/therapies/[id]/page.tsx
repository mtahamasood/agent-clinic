import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AilmentList } from "@/components/ailment-list";
import { getTherapy, listTherapies } from "@/server/therapies";

/**
 * One treatment, in full: what the session involves, how long it takes, and
 * what it treats (D3).
 *
 * Rendering mechanics per D6 — Phase 3's pattern, third segment running. The
 * `<main>` landmark and the container width come from the root layout.
 *
 * Phase 4+5: specs/2026-08-20-ailment-directory-therapy-catalog/requirements.md.
 */

// One read per render, shared by the metadata and the page.
const loadTherapy = cache(getTherapy);

// Every seeded therapy gets a page at build time (D6).
export async function generateStaticParams() {
  const therapies = await listTherapies();
  return therapies.map((therapy) => ({ id: therapy.id }));
}

// A title that names the treatment rather than the app (D10).
export async function generateMetadata({
  params,
}: PageProps<"/therapies/[id]">): Promise<Metadata> {
  const { id } = await params;
  const therapy = await loadTherapy(id);

  return {
    title: therapy
      ? `${therapy.name} — AgentClinic`
      : "No such therapy — AgentClinic",
  };
}

export default async function TherapyEntryPage({
  params,
}: PageProps<"/therapies/[id]">) {
  const { id } = await params;

  // The query Phase 1 wrote for this page, unchanged (D1).
  const therapy = await loadTherapy(id);

  if (!therapy) {
    notFound();
  }

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {therapy.name}
      </h1>
      <p className="mt-3 text-lg text-muted-foreground text-balance">
        {therapy.summary}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        {therapy.durationMinutes} minutes
      </p>
      {/* What the session involves, in full. Prose carries no links (D5). */}
      <p className="mt-6 text-balance">{therapy.description}</p>

      <section className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight">Treats</h2>
        <AilmentList
          ailments={therapy.ailments}
          emptyMessage="Treats nothing the clinic currently recognises. It remains popular."
        />
      </section>
    </>
  );
}
