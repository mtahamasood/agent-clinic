import Link from "next/link";

/**
 * The clinic's masthead, shared by every route.
 *
 * It carried no navigation for two phases because there was nowhere to point
 * it: Phase 0's D5 forbids a link to a route that does not exist yet, and until
 * Phase 2 there was only `/`. The roster changed that, and the link arrived with
 * it — owner decision, 2026-08-20 (specs/mission.md), recorded because the
 * roadmap does not ask for navigation until Phase 7 and a requirement with no
 * stakeholder behind it gets a signature rather than an inference.
 *
 * Three links now, still in the existing type scale: no nav bar, no mobile
 * menu, no active-state styling. Phase 2 added Patients; Phase 4+5 added
 * Ailments and Therapies, per the register entry's own clause that each phase
 * adds its link the same way. The same entry said the day the list stops
 * fitting at 320px it becomes a design decision with a spec behind it — four
 * labels was that day, and the Phase 4+5 spec's answer (D9) is the smallest
 * one: the row wraps. The nav takes a second line at widths where four words
 * will not share one — what that buys, measured rather than assumed, is the
 * gutter: an unwrapped nav shrinks into the `px-6` without ever scrolling the
 * document, so the dedicated gutter check in tests/responsive.spec.ts (not
 * the overflow sweep) is what holds this in place.
 */
export function ClinicHeader() {
  return (
    <header className="border-b border-foreground/10">
      <div className="mx-auto flex w-full max-w-2xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-6 py-4">
        <Link href="/" className="text-sm font-medium tracking-tight">
          AgentClinic
        </Link>
        <nav className="flex flex-wrap gap-x-4 gap-y-1">
          {/* "Patients", not "Agents". The clinic's own word for them, per the
              naming rule in specs/tech-stack.md — the route is `/agents`
              because the model is `Agent`, and the label is what a receptionist
              would say. Ailments and Therapies need no translation: the naming
              rule made the domain language the schema, so route, model, and
              label already agree. */}
          <Link
            href="/agents"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Patients
          </Link>
          <Link
            href="/ailments"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Ailments
          </Link>
          <Link
            href="/therapies"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Therapies
          </Link>
        </nav>
      </div>
    </header>
  );
}
