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
 * Deliberately one link, in the existing type scale: no nav bar, no mobile
 * menu, no active-state styling. Each later phase adds its own the same way,
 * and the day the list stops fitting at 320px it becomes a design decision with
 * a spec behind it — which will be Phase 8's, with every route in view.
 */
export function ClinicHeader() {
  return (
    <header className="border-b border-foreground/10">
      <div className="mx-auto flex w-full max-w-2xl items-center justify-between gap-4 px-6 py-4">
        <Link href="/" className="text-sm font-medium tracking-tight">
          AgentClinic
        </Link>
        <nav>
          {/* "Patients", not "Agents". The clinic's own word for them, per the
              naming rule in specs/tech-stack.md — the route is `/agents`
              because the model is `Agent`, and the label is what a receptionist
              would say. */}
          <Link
            href="/agents"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Patients
          </Link>
        </nav>
      </div>
    </header>
  );
}
