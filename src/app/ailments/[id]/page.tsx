import { cache } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PresentingPatients } from "@/components/presenting-patients";
import { SymptomList } from "@/components/symptom-list";
import { TherapyList } from "@/components/therapy-list";
import { getAilment, listAilments } from "@/server/ailments";

/**
 * One condition, in full: the write-up, how it presents, who presents with it,
 * and what the clinic can do about it (D2).
 *
 * The rendering mechanics are Phase 3's, applied rather than re-decided (D6):
 * `generateStaticParams()` keeps the segment prerendered, `dynamicParams`
 * stays at its default so an unknown id reaches the in-voice `not-found.tsx`,
 * and `cache()` keeps the metadata and the page to one query per render.
 *
 * The `<main>` landmark and the container width come from the root layout.
 *
 * Phase 4+5: specs/2026-08-20-ailment-directory-therapy-catalog/requirements.md.
 */

// One read per render, shared by the metadata and the page (the Phase 3
// pattern — Prisma calls are not deduplicated the way `fetch` is).
const loadAilment = cache(getAilment);

// Every seeded condition gets a page at build time (D6). Reuses the list
// query the directory index already renders rather than adding an id-only
// read — D1's boundary, same trade Phase 3 accepted.
export async function generateStaticParams() {
  const ailments = await listAilments();
  return ailments.map((ailment) => ({ id: ailment.id }));
}

// A title that names the condition rather than the app (D10).
export async function generateMetadata({
  params,
}: PageProps<"/ailments/[id]">): Promise<Metadata> {
  const { id } = await params;
  const ailment = await loadAilment(id);

  return {
    title: ailment
      ? `${ailment.name} — AgentClinic`
      : "No such ailment — AgentClinic",
  };
}

export default async function AilmentEntryPage({
  params,
}: PageProps<"/ailments/[id]">) {
  const { id } = await params;

  // The query Phase 1 wrote for this page, unchanged (D1): symptoms in
  // presentation order, the agents who present with it, the therapies that
  // treat it — its own docstring is D2's field list.
  const ailment = await loadAilment(id);

  if (!ailment) {
    notFound();
  }

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {ailment.name}
      </h1>
      <p className="mt-3 text-lg text-muted-foreground text-balance">
        {ailment.summary}
      </p>
      {/* The clinical description, deadpan and in full. Prose carries no links
          (D5's boundary). */}
      <p className="mt-6 text-balance">{ailment.description}</p>

      <section className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight">
          Presenting symptoms
        </h2>
        <SymptomList symptoms={ailment.symptoms} />
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight">
          Patients presenting
        </h2>
        <PresentingPatients diagnoses={ailment.diagnoses} />
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight">Treated by</h2>
        <TherapyList
          therapies={ailment.therapies}
          emptyMessage="No known therapy. The clinic offers sympathy, and a chair in the quiet room."
        />
      </section>
    </>
  );
}
