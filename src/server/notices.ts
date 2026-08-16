import { prisma } from "@/lib/prisma";

/**
 * The notice currently pinned to the clinic's board, or null if the board is
 * bare. Phase 0 keeps exactly one; the most recent wins if that ever changes.
 */
export async function getCurrentNotice() {
  return prisma.clinicNotice.findFirst({
    orderBy: { createdAt: "desc" },
  });
}
