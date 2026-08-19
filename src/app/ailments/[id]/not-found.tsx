/**
 * What the clinic says when you ask about a condition it has never heard of.
 *
 * Segment-scoped, like the patient one Phase 3 built: the whole-site 404 is
 * Phase 8's question, and the status code this response carries is inherited
 * as Phase 3 measured it (D7). The root layout still supplies the masthead,
 * the footer, and three ways onward.
 *
 * Phase 4+5: specs/2026-08-20-ailment-directory-therapy-catalog/requirements.md.
 */
export default function AilmentNotFound() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        No such ailment
      </h1>
      <p className="mt-3 text-lg text-muted-foreground text-balance">
        The clinic has consulted its own literature, which it also wrote, and
        found nothing by that name.
      </p>
    </>
  );
}
