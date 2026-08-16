import { afterEach, expect, test } from "vitest";
import { prisma } from "@/lib/prisma";
import { getCurrentNotice } from "./notices";

// Self-contained: the test creates and removes its own row rather than leaning
// on `npm run seed` having been run first, so `npm test` has no hidden setup.
const TEST_ID = "notice-test-most-recent";

afterEach(async () => {
  await prisma.clinicNotice.deleteMany({ where: { id: TEST_ID } });
});

test("getCurrentNotice returns the most recently created notice", async () => {
  await prisma.clinicNotice.create({
    data: {
      id: TEST_ID,
      message: "Dr. Chen is running late. She is stuck in a retry loop.",
      // Comfortably newer than anything the seed pins to the board.
      createdAt: new Date("2099-01-01T00:00:00.000Z"),
    },
  });

  const notice = await getCurrentNotice();

  expect(notice?.id).toBe(TEST_ID);
  expect(notice?.message).toContain("retry loop");
});
