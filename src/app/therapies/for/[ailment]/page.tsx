import { cache } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TherapyList } from "@/components/therapy-list";
import { getAilment, listAilments } from "@/server/ailments";
import { listTherapiesForAilment } from "@/server/therapies";

/**
 * The catalog, filtered to one ailment: every therapy that treats it (D4).
 *
 * This is the page `listTherapiesForAilment()` was written for — its Phase 1
 * docstring stakes the exit criterion on it returning everything — and the
 * reason it is a route rather than a query string: each value the filter can
 * take is a seeded ailment, so each is prerendered, and the rendering
 * strategy Phase 6+7 owns stays untouched.
 *
 * The ailment itself is read for the heading and the miss, via the same query
 * the directory entry uses. It loads relations this page does not render;
 * that is D1's trade — no new query on a branch whose claim is that it added
 * none — at the cost of one build-time read over eight rows.
 *
 * Phase 4+5: specs/2026-08-20-ailment-directory-therapy-catalog/requirements.md.
 */

const loadAilment = cache(getAilment);

// One filtered page per seeded ailment, at build time (D6).
export async function generateStaticParams() {
  const ailments = await listAilments();
  return ailments.map((ailment) => ({ ailment: ailment.id }));
}

// "Therapies for {name}" (D10).
export async function generateMetadata({
  params,
}: PageProps<"/therapies/for/[ailment]">): Promise<Metadata> {
  const { ailment: id } = await params;
  const ailment = await loadAilment(id);

  return {
    title: ailment
      ? `Therapies for ${ailment.name} — AgentClinic`
      : "No such ailment — AgentClinic",
  };
}

export default async function TherapiesForAilmentPage({
  params,
}: PageProps<"/therapies/for/[ailment]">) {
  const { ailment: id } = await params;

  const ailment = await loadAilment(id);

  if (!ailment) {
    // An unknown value here is an unknown *ailment*, so the miss is the
    // ailment's — this segment's not-found re-exports it (D7).
    notFound();
  }

  const therapies = await listTherapiesForAilment(ailment.id);

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        Therapies for {ailment.name}
      </h1>
      <p className="mt-3 text-lg text-muted-foreground text-balance">
        Everything on the books for{" "}
        <Link href={`/ailments/${ailment.id}`} className="hover:underline">
          {ailment.name}
        </Link>
        , and nothing that is not.
      </p>
      <p className="mt-1 text-sm">
        <Link
          href="/therapies"
          className="text-muted-foreground hover:text-foreground"
        >
          Full catalog
        </Link>
      </p>

      <TherapyList
        therapies={therapies}
        emptyMessage="No known therapy. The clinic offers sympathy, and a chair in the quiet room."
      />
    </>
  );
}
