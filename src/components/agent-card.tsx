import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { listAgents } from "@/server/agents";

/**
 * One patient, as they appear on the roster.
 *
 * Three fields and no fourth (D2): name, model family, and the ailments they
 * present. Severities are the case file's job in Phase 3, intake notes are the
 * profile, and counts belong to Phase 7's dashboard — each of those is a phase
 * that has already claimed the field, and a roster that carries them all is the
 * case file with worse typography.
 *
 * Not a link, deliberately. `/agents/[id]` arrives in Phase 3, and Phase 0's D5
 * has forbidden a link to a route that does not exist yet since the first
 * commit (D3).
 */

// Derived from the query rather than declared beside it (D1): rename a column
// in schema.prisma and this breaks `npm run typecheck`, which is the whole
// reason the ORM is here. Phase 1's D9 wrote `listAgents` for this page, and
// this line is the check that it wrote the right thing.
type RosterAgent = Awaited<ReturnType<typeof listAgents>>[number];

export function AgentCard({ agent }: { agent: RosterAgent }) {
  // Presentation order, settled here rather than by widening the query. The
  // relation comes back in whatever order the database happens to hold it, and
  // a roster that reshuffles its own badges between builds is a flaky test
  // waiting to happen. Alphabetical, not by severity: severity is Phase 3.
  const ailments = agent.diagnoses
    .map((diagnosis) => diagnosis.ailment)
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    // `h-full` so cards sharing a grid row share a height. The grid stretches
    // the `<li>`; without this the card sits at its content height inside a
    // taller cell, and a row of patients with different numbers of ailments
    // comes out ragged.
    <Card className="h-full">
      <CardHeader>
        <CardTitle>{agent.name}</CardTitle>
        <CardDescription>{agent.modelFamily}</CardDescription>
      </CardHeader>
      <CardContent>
        {ailments.length > 0 ? (
          // `flex-wrap` is what keeps a patient with four conditions from
          // widening the card at 320px: the badges wrap, the card does not grow.
          <ul className="flex flex-wrap gap-1.5">
            {ailments.map((ailment) => (
              <li key={ailment.id}>
                <Badge variant="secondary">{ailment.name}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          // The empty state nobody sees in a demo, because the seed diagnoses
          // every patient — and the one that would otherwise ship as a blank
          // gap the first time somebody admits a patient before diagnosing them
          // (D5).
          <p className="text-sm text-muted-foreground">
            No diagnosis on file yet.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
