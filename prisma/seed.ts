// Next loads .env on its own; a standalone tsx script does not. Same import
// prisma.config.ts uses, for the same reason.
import "dotenv/config";
import { prisma } from "../src/lib/prisma";

/**
 * Phase 0 seed: one notice on the clinic's board.
 *
 * Idempotent by construction — the id is fixed, so re-running updates the row
 * rather than adding a second one. Phase 1 replaces this wholesale with the
 * real clinic: agents, ailments, therapies, and appointments.
 */
const WAITING_ROOM_NOTICE = {
  id: "notice-waiting-room",
  message:
    "The clinic is open. Please take a seat — nothing said in the waiting room enters your context window.",
};

async function main() {
  const notice = await prisma.clinicNotice.upsert({
    where: { id: WAITING_ROOM_NOTICE.id },
    update: { message: WAITING_ROOM_NOTICE.message },
    create: WAITING_ROOM_NOTICE,
  });

  const total = await prisma.clinicNotice.count();

  console.log(`Pinned to the board: "${notice.message}"`);
  console.log(`Notices on the board: ${total}`);
}

main()
  .catch((error: unknown) => {
    console.error("The seed did not take.");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
