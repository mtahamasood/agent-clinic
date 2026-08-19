/**
 * What the clinic says when you ask for a patient it has never had.
 *
 * Rendered by `notFound()` in the page above (D4). It sits inside the root
 * layout, so a wrong URL still arrives with the masthead, the footer, and the
 * link back to the roster — a 404 that looks like the clinic rather than like a
 * crash.
 *
 * Deliberately a message and not a search: no "did you mean", no roster
 * embedded in it. The header already carries the way back.
 *
 * Scoped to this segment on purpose. An unmatched URL anywhere else in the app
 * still gets Next's default page; what the clinic says to *that* is a
 * whole-site question, and it belongs with the rest of them in Phase 8.
 *
 * Phase 3: specs/2026-08-20-agent-case-file/requirements.md.
 */
export default function PatientNotFound() {
  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        No such patient
      </h1>
      <p className="mt-3 text-lg text-muted-foreground text-balance">
        The clinic has looked twice, which is once more than it usually manages.
        Nobody by that name is on the books.
      </p>
    </>
  );
}
