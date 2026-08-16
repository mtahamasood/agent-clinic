/**
 * The clinic's masthead, shared by every route.
 *
 * No navigation yet: every route beyond `/` arrives in Phase 2, and a link to a
 * 404 is worse than no link (D5). The nav lands here when there is somewhere to
 * point it.
 */
export function ClinicHeader() {
  return (
    <header className="border-b border-foreground/10">
      <div className="mx-auto w-full max-w-2xl px-6 py-4">
        <span className="text-sm font-medium tracking-tight">AgentClinic</span>
      </div>
    </header>
  );
}
