import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AppointmentList } from "@/components/appointment-list";
import { DiagnosisList } from "@/components/diagnosis-list";
import { formatClinicDate } from "@/lib/clinic-date";
import { getAgent, listAgents } from "@/server/agents";

/**
 * One patient's case file.
 *
 * The first dynamic route in the project, and the first that can be asked for
 * something that does not exist. Both of those are work rather than
 * inheritance: `generateStaticParams()` is what keeps this route prerendered
 * like `/` and `/agents` (D3), and `notFound()` is what makes a wrong id read
 * like the clinic rather than like a crash (D4).
 *
 * The `<main>` landmark and the container width still come from the root
 * layout, so this page supplies its own content and no width of its own.
 *
 * Phase 3: specs/2026-08-20-agent-case-file/requirements.md.
 */

/**
 * Every patient gets a page at build time.
 *
 * Without this the segment renders on demand, which is a different rendering
 * strategy arriving one phase before the one that owns the decision (D3, and
 * Phase 1's D12). `dynamicParams` is deliberately left at its default: at
 * `false` an unbuilt id is refused at the routing layer, so this segment's own
 * `not-found.tsx` would never render and the in-voice 404 the roadmap asks for
 * is exactly what would be lost.
 *
 * It reuses `listAgents()` rather than adding a `listAgentIds()` (D1). Eight
 * agents with their diagnoses attached is more than this needs; a new query in
 * `src/server/` on a branch whose claim is that it added none costs more.
 */
export async function generateStaticParams() {
  const agents = await listAgents();
  return agents.map((agent) => ({ id: agent.id }));
}

// A title that names the patient, which is the bar check C15 set for `/agents`
// in Phase 2. This reads the agent a second time; at build time, over eight
// rows, that is cheaper than the alternative — a memoised read is a change to
// `src/server/`, and D1 says this phase makes none.
export async function generateMetadata({
  params,
}: PageProps<"/agents/[id]">): Promise<Metadata> {
  const { id } = await params;
  const agent = await getAgent(id);

  return {
    title: agent
      ? `${agent.name} — AgentClinic`
      : "No such patient — AgentClinic",
  };
}

export default async function AgentCaseFilePage({
  params,
}: PageProps<"/agents/[id]">) {
  const { id } = await params;

  // The query Phase 1 wrote for this page, unchanged (D1): profile, diagnoses
  // with their ailments, appointments with their therapies. If this ever needs
  // a wider `include`, that is a finding about Phase 1's D9 and belongs in a
  // spec before it belongs in this file.
  const agent = await getAgent(id);

  if (!agent) {
    notFound();
  }

  return (
    <>
      <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {agent.name}
      </h1>
      <p className="mt-3 text-lg text-muted-foreground text-balance">
        {agent.modelFamily}
      </p>
      <p className="mt-1 text-sm text-muted-foreground">
        Admitted {formatClinicDate(agent.admittedOn)}
      </p>
      {/* The intake notes, in full and on the page they were always for. The
          roster deliberately does not carry them — Phase 2's D2 — and this is
          the phase that spends them. */}
      <p className="mt-6 text-balance">{agent.intakeNotes}</p>

      <section className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight">
          Presenting ailments
        </h2>
        <DiagnosisList diagnoses={agent.diagnoses} />
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold tracking-tight">Appointments</h2>
        <AppointmentList appointments={agent.appointments} />
      </section>
    </>
  );
}
