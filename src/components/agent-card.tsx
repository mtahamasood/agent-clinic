import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { compareNames } from "@/lib/name-order";
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
 * Three fields and no fourth (Phase 2's D2): name, model family, and the
 * ailments they present. Severities and intake notes are the case file's, and
 * counts belong to Phase 7's dashboard — each of those is a phase that has
 * already claimed the field, and a roster that carries them all is the case
 * file with worse typography.
 *
 * The name links to that case file. It carried no link for one phase because
 * `/agents/[id]` did not exist and Phase 0's D5 forbids a link to a route that
 * does not; Phase 3 built the route, so the link arrived with it.
 *
 * The *name* rather than the whole card, deliberately (Phase 3's D5): wrapping
 * the card would make the link's text every word on it — the name, the model
 * family, and each ailment run together — so what the reader is told they are
 * clicking would be a paragraph rather than a patient. The badges link to their
 * ailments' directory entries — they were dead text for exactly as long as
 * `/ailments/[id]` did not exist, which is Phase 0's no-dead-links rule
 * pointing first away from the route and then at it (Phase 4+5's D5).
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
  // waiting to happen. Alphabetical, not by severity — severity belongs to the
  // case file, which is where Phase 3 put it.
  //
  // Through the pinned collator rather than bare `localeCompare`, which follows
  // the machine's default locale and can therefore order two ailments
  // differently on two machines (D8, extended 2026-08-20).
  const ailments = agent.diagnoses
    .map((diagnosis) => diagnosis.ailment)
    .sort((a, b) => compareNames(a.name, b.name));

  return (
    // `h-full` so cards sharing a grid row share a height. The grid stretches
    // the `<li>`; without this the card sits at its content height inside a
    // taller cell, and a row of patients with different numbers of ailments
    // comes out ragged.
    <Card className="h-full">
      <CardHeader>
        <CardTitle>
          <Link href={`/agents/${agent.id}`} className="hover:underline">
            {agent.name}
          </Link>
        </CardTitle>
        <CardDescription>{agent.modelFamily}</CardDescription>
      </CardHeader>
      <CardContent>
        {ailments.length > 0 ? (
          // `flex-wrap` is what keeps a patient with four conditions from
          // widening the card at 320px: the badges wrap, the card does not grow.
          <ul className="flex flex-wrap gap-1.5">
            {ailments.map((ailment) => (
              <li key={ailment.id}>
                {/* `asChild` puts the link inside the badge's own shape — no
                    new primitive, and the vendored variant already carries a
                    hover treatment for links. */}
                <Badge variant="secondary" asChild>
                  <Link href={`/ailments/${ailment.id}`}>{ailment.name}</Link>
                </Badge>
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
