import { prisma } from "@/lib/prisma";

/** Reads over the conditions the clinic recognises. */

/** The directory: every ailment, in alphabetical order. */
export async function listAilments() {
  return prisma.ailment.findMany({ orderBy: { name: "asc" } });
}

/**
 * One ailment in full: symptoms in presentation order, the agents who present
 * with it, and the therapies that treat it.
 */
export async function getAilment(id: string) {
  return prisma.ailment.findUnique({
    where: { id },
    include: {
      symptoms: { orderBy: { position: "asc" } },
      diagnoses: { include: { agent: true } },
      therapies: { orderBy: { name: "asc" } },
    },
  });
}

/**
 * The ailment on the clinic's notice board.
 *
 * Deterministic on purpose: the home page is what Playwright asserts against,
 * and a rotating board would make that assertion a coin toss. Alphabetical is
 * as good a rule as any, and it is a rule.
 */
export async function getNoticeBoardAilment() {
  return prisma.ailment.findFirst({ orderBy: { name: "asc" } });
}
