import { prisma } from "@/lib/prisma";

/**
 * Reads over the clinic's patients.
 *
 * Return types are inferred from Prisma rather than written by hand (D9): a
 * renamed column breaks `npm run typecheck` here and everywhere downstream,
 * which is the point of the ORM.
 */

/** The roster: every patient, with the ailments they present. */
export async function listAgents() {
  return prisma.agent.findMany({
    orderBy: { name: "asc" },
    include: {
      diagnoses: { include: { ailment: true } },
    },
  });
}

/**
 * One patient's case file: profile, ailments with severities, and every
 * appointment they have on the books, most recent first.
 *
 * Null when no such agent exists — the caller decides what that reads like.
 */
export async function getAgent(id: string) {
  return prisma.agent.findUnique({
    where: { id },
    include: {
      diagnoses: {
        include: { ailment: true },
        orderBy: { diagnosedOn: "desc" },
      },
      appointments: {
        include: { therapy: true },
        orderBy: { scheduledFor: "desc" },
      },
    },
  });
}
