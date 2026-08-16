import { expect, test } from "vitest";
import { AppointmentStatus } from "@/generated/prisma/enums";
import { appointmentStatusLabel } from "./appointment-status";

// Same guard as severity: a status added to the schema without a label here
// would render as `undefined` instead of failing.
test("every appointment status in the schema has a label", () => {
  for (const status of Object.values(AppointmentStatus)) {
    expect(appointmentStatusLabel(status)).toMatch(/\S/);
  }
});

test("the vocabulary is the two values Phase 1 committed to", () => {
  // Cancellation and rescheduling are backlog items. A third value arriving
  // here without a spec should fail loudly — see D5.
  expect(Object.values(AppointmentStatus)).toEqual(["SCHEDULED", "COMPLETED"]);
});
