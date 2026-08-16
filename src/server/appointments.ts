import { prisma } from "@/lib/prisma";

/** Reads over the clinic's calendar. */

/**
 * Everything on the calendar for the day `moment` falls in, earliest first.
 *
 * The day boundary is the server's local midnight, matching the seed's own
 * sense of a day. There is no timezone handling here and none is needed: one
 * clinic, one calendar.
 */
export async function listAppointmentsOn(moment: Date) {
  const dayStart = new Date(moment);
  dayStart.setHours(0, 0, 0, 0);

  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  return prisma.appointment.findMany({
    where: { scheduledFor: { gte: dayStart, lt: dayEnd } },
    orderBy: { scheduledFor: "asc" },
    include: { agent: true, therapy: true },
  });
}

/** One appointment, with both ends of it. Null if there is no such booking. */
export async function getAppointment(id: string) {
  return prisma.appointment.findUnique({
    where: { id },
    include: { agent: true, therapy: true },
  });
}
