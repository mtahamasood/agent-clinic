import { AppointmentStatus } from "@/generated/prisma/enums";

/**
 * Wording for appointment status. The vocabulary is a Prisma enum; this is the
 * half a schema cannot carry (D5).
 *
 * Two values, deliberately. Cancellation and rescheduling are backlog items,
 * and each would have to settle how a freed slot interacts with the uniqueness
 * constraints on `Appointment` before it could be added here.
 */
const LABELS: Record<AppointmentStatus, string> = {
  [AppointmentStatus.SCHEDULED]: "Scheduled",
  [AppointmentStatus.COMPLETED]: "Completed",
};

/** How the clinic writes a status down. */
export function appointmentStatusLabel(status: AppointmentStatus): string {
  return LABELS[status];
}
