import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { getAgent } from "@/server/agents";
import { AppointmentList } from "./appointment-list";

/**
 * The upcoming/past split and the empty branch, both rendered rather than read.
 *
 * The dates are moved rather than taken as seeded. Atlas's own appointments sit
 * at "today at 10:00" and "three days out", so a suite that trusted them would
 * pass all morning and start failing at ten — the split is against the clock,
 * and a test whose fixture crosses the clock during the working day is a flake
 * with a schedule. Everything else about the fixture is the real seeded row.
 *
 * The empty branch (D9) is unreachable from the seed, which books all eight
 * patients, and becomes ordinary in Phase 6 the moment a patient is admitted
 * before their first booking.
 */
async function caseFileFor(id: string) {
  const agent = await getAgent(id);
  if (!agent) throw new Error(`the seed has no patient called ${id}`);
  return agent;
}

/** The same appointment, moved a whole number of days from now. */
function movedBy(
  appointment: Awaited<ReturnType<typeof caseFileFor>>["appointments"][number],
  days: number,
) {
  const scheduledFor = new Date();
  scheduledFor.setDate(scheduledFor.getDate() + days);
  return { ...appointment, scheduledFor };
}

describe("the appointment list", () => {
  test("shows what is still to come and what has already happened, under their own headings", async () => {
    const agent = await caseFileFor("atlas");
    const [first, second] = agent.appointments;

    const markup = renderToStaticMarkup(
      <AppointmentList
        appointments={[movedBy(first, 3), movedBy(second, -7)]}
      />,
    );

    expect(markup).toContain("Still to come");
    expect(markup).toContain("Already seen");
    // The future one is listed first, whichever order it arrived in (D7).
    expect(markup.indexOf("Still to come")).toBeLessThan(
      markup.indexOf("Already seen"),
    );
    expect(markup).toContain(first.therapy.name);
    expect(markup).toContain(second.therapy.name);
  });

  test("carries the therapy, the status in words, and the session note", async () => {
    const agent = await caseFileFor("roux");
    const [appointment] = agent.appointments;

    const markup = renderToStaticMarkup(
      <AppointmentList appointments={[movedBy(appointment, -1)]} />,
    );

    expect(markup).toContain(appointment.therapy.name);
    expect(markup).toContain("Completed");
    // Never the raw enum.
    expect(markup).not.toContain("COMPLETED");
    expect(markup).toContain("Verified nine claims. Seven survived.");
  });

  test("raises no empty heading over a patient with nothing to come", async () => {
    const agent = await caseFileFor("atlas");
    const markup = renderToStaticMarkup(
      <AppointmentList
        appointments={agent.appointments.map((appointment) =>
          movedBy(appointment, -4),
        )}
      />,
    );

    expect(markup).toContain("Already seen");
    expect(markup).not.toContain("Still to come");
  });

  test("says so in voice when a patient has never been seen", async () => {
    const markup = renderToStaticMarkup(<AppointmentList appointments={[]} />);

    expect(markup).toContain("Never been seen.");
    expect(markup).not.toContain("Still to come");
    expect(markup).not.toContain("Already seen");
  });
});
