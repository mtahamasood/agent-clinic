// Next loads .env on its own; a standalone tsx script does not. Same import
// prisma.config.ts uses, for the same reason.
import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import {
  agents,
  ailments,
  appointments,
  daysBefore,
  diagnoses,
  slotFor,
  therapies,
} from "./seed-data";

/**
 * Writes the clinic. The clinic itself is in seed-data.ts (D8).
 *
 * Idempotent by construction: every row the seed writes has a hand-written id
 * or a natural key (D2), so a second run updates what is there instead of
 * opening a second clinic. Symptoms are the exception — a value list is
 * replaced wholesale, so deleting one from the data deletes it from the
 * database too.
 *
 * Times are relative to this run (D7). Re-seeding therefore moves the
 * calendar, deliberately: the clinic always has a today.
 */
async function main() {
  const runDate = new Date();

  for (const ailment of ailments) {
    const { symptoms, ...fields } = ailment;
    await prisma.ailment.upsert({
      where: { id: ailment.id },
      update: fields,
      create: fields,
    });

    // Replaced rather than upserted: the set is the unit, not the row.
    await prisma.symptom.deleteMany({ where: { ailmentId: ailment.id } });
    await prisma.symptom.createMany({
      data: symptoms.map((symptom) => ({ ...symptom, ailmentId: ailment.id })),
    });
  }

  for (const agent of agents) {
    const { admittedDaysAgo, ...fields } = agent;
    const admittedOn = daysBefore(runDate, admittedDaysAgo);
    await prisma.agent.upsert({
      where: { id: agent.id },
      update: { ...fields, admittedOn },
      create: { ...fields, admittedOn },
    });
  }

  for (const therapy of therapies) {
    const { treats, ...fields } = therapy;
    const links = treats.map((id) => ({ id }));
    await prisma.therapy.upsert({
      where: { id: therapy.id },
      // `set` on update, not `connect`: an ailment removed from `treats` should
      // stop being treated, which `connect` alone would never notice. On create
      // there is nothing to replace, and `set` is not offered there.
      update: { ...fields, ailments: { set: links } },
      create: { ...fields, ailments: { connect: links } },
    });
  }

  for (const diagnosis of diagnoses) {
    const { agentId, ailmentId, diagnosedDaysAgo, ...fields } = diagnosis;
    const record = {
      ...fields,
      diagnosedOn: daysBefore(runDate, diagnosedDaysAgo),
    };
    await prisma.diagnosis.upsert({
      where: { agentId_ailmentId: { agentId, ailmentId } },
      update: record,
      create: { ...record, agentId, ailmentId },
    });
  }

  for (const appointment of appointments) {
    const { id, dayOffset, hour, ...fields } = appointment;
    const record = {
      ...fields,
      scheduledFor: slotFor(runDate, dayOffset, hour),
    };
    await prisma.appointment.upsert({
      where: { id },
      update: record,
      create: { ...record, id },
    });
  }

  const [agentCount, ailmentCount, therapyCount, todayCount] =
    await Promise.all([
      prisma.agent.count(),
      prisma.ailment.count(),
      prisma.therapy.count(),
      prisma.appointment.count({
        where: {
          scheduledFor: {
            gte: slotFor(runDate, 0, 0),
            lt: slotFor(runDate, 1, 0),
          },
        },
      }),
    ]);

  console.log(`Registered patients: ${agentCount}`);
  console.log(`Ailments on the books: ${ailmentCount}`);
  console.log(`Therapies offered: ${therapyCount}`);
  console.log(`On today's calendar: ${todayCount}`);
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
