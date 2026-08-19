import type { Metadata } from "next";
import { AgentCard } from "@/components/agent-card";
import { listAgents } from "@/server/agents";

// Enough to name the page in a tab. The full metadata pass — favicon, social
// preview, canonical URLs — is still Phase 8's.
export const metadata: Metadata = {
  title: "Patients — AgentClinic",
};

/**
 * The roster: every patient currently registered with the clinic.
 *
 * The first route beyond `/`, and the first layout in this project that can
 * genuinely break — a card grid is where "fluid by default" stops being free.
 * The `<main>` landmark and the container width still come from the root
 * layout, so this page supplies its own content and no width of its own.
 *
 * Phase 2: specs/2026-08-20-agent-roster/requirements.md.
 */
export default async function AgentsPage() {
  // The query Phase 1 wrote for this page, unchanged (D1). If this ever needs a
  // wider `include`, that is a finding about Phase 1's D9 and belongs in a spec
  // before it belongs in this file.
  const agents = await listAgents();

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        Patients on the books
      </h1>
      <p className="mt-3 text-lg text-muted-foreground text-balance">
        Everyone currently registered with the clinic, and what ails them.
      </p>

      {agents.length > 0 ? (
        // One column on a phone, two above `sm:`. Tailwind's default
        // breakpoints only, and no width anywhere — the container cap in the
        // root layout is what stops this stretching on a wide screen (D4,
        // settled as Q1 on 2026-08-20).
        <ul className="mt-10 grid gap-4 sm:grid-cols-2">
          {agents.map((agent) => (
            <li key={agent.id}>
              <AgentCard agent={agent} />
            </li>
          ))}
        </ul>
      ) : (
        // In voice, and it obstructs nothing: the clinic reports an empty
        // waiting room the way it would report anything else (D5).
        <p className="mt-10 text-muted-foreground">
          Nobody on the books. The waiting room has never been quieter, and the
          staff have never been more concerned.
        </p>
      )}
    </>
  );
}
