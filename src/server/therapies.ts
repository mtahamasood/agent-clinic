import { prisma } from "@/lib/prisma";

/** Reads over what the clinic can offer. */

/** The catalog: every therapy, with the ailments it treats. */
export async function listTherapies() {
  return prisma.therapy.findMany({
    orderBy: { name: "asc" },
    include: { ailments: { orderBy: { name: "asc" } } },
  });
}

/**
 * The catalog filtered to one ailment — every therapy that treats it.
 *
 * An agent who knows what ails them arrives here; Phase 5 stakes its exit
 * criterion on this returning everything, not the first few.
 */
export async function listTherapiesForAilment(ailmentId: string) {
  return prisma.therapy.findMany({
    where: { ailments: { some: { id: ailmentId } } },
    orderBy: { name: "asc" },
  });
}

/** One therapy: what it involves, how long it takes, what it treats. */
export async function getTherapy(id: string) {
  return prisma.therapy.findUnique({
    where: { id },
    include: { ailments: { orderBy: { name: "asc" } } },
  });
}
