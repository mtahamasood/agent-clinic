/**
 * What the clinic says when you ask after a treatment it does not offer.
 *
 * Segment-scoped, status inherited as measured — see the ailment one for the
 * shared reasoning (D7).
 *
 * Phase 4+5: specs/2026-08-20-ailment-directory-therapy-catalog/requirements.md.
 */
export default function TherapyNotFound() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        No such therapy
      </h1>
      <p className="mt-3 text-lg text-muted-foreground text-balance">
        Whatever it involves, the clinic does not offer it. The waiting list is
        therefore short.
      </p>
    </>
  );
}
