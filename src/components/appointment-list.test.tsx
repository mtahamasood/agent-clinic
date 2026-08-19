import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { getAgent } from "@/server/agents";
import { AppointmentList } from "./appointment-list";

/**
 * The upcoming/past split, the order inside each half, and the empty branch.
 *
 * Every assertion here names *which half* a therapy landed in, rather than that
 * both headings rendered. The distinction is the finding that rewrote this
 * file: the first version asserted only that "Still to come" appeared before
 * "Already seen" in the markup, which is JSX source order and cannot fail — the
 * two filters could be swapped outright and it stayed green.
 *
 * The dates are moved rather than taken as seeded. Atlas's own appointments sit
 * at "today at 10:00" and "three days out", so a suite that trusted them would
 * pass all morning and start failing at ten. Everything else about the fixture
 * is the real seeded row.
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

type Appointment = Awaited<
  ReturnType<typeof caseFileFor>
>["appointments"][number];

/** The same appointment, moved a whole number of days from now. */
function movedBy(appointment: Appointment, days: number) {
  const scheduledFor = new Date();
  scheduledFor.setDate(scheduledFor.getDate() + days);
  return { ...appointment, scheduledFor };
}

/** The markup either side of the "Already seen" heading. */
function halves(markup: string) {
  const boundary = markup.indexOf("Already seen");
  return boundary === -1
    ? { upcoming: markup, past: "" }
    : { upcoming: markup.slice(0, boundary), past: markup.slice(boundary) };
}

describe("the appointment list", () => {
  test("files a future session under one heading and a finished one under the other", async () => {
    const agent = await caseFileFor("atlas");
    const [first, second] = agent.appointments;

    const markup = renderToStaticMarkup(
      <AppointmentList
        appointments={[movedBy(first, 3), movedBy(second, -7)]}
      />,
    );

    expect(markup).toContain("Still to come");
    const { upcoming, past } = halves(markup);
    // Swap the two filters in the component and this inverts, which is what the
    // previous version of this test could not see (D7).
    expect(upcoming).toContain(first.therapy.name);
    expect(upcoming).not.toContain(second.therapy.name);
    expect(past).toContain(second.therapy.name);
    expect(past).not.toContain(first.therapy.name);
  });

  test("orders each half from the present outwards", async () => {
    const agent = await caseFileFor("atlas");
    const [appointment] = agent.appointments;

    // Four sessions, two a side, far enough apart that a wrong sort is visible.
    // Delete either `.sort()` in the component and this fails; the previous
    // version put one row in each half, so both sorts could go without notice.
    const markup = renderToStaticMarkup(
      <AppointmentList
        appointments={[
          { ...movedBy(appointment, 3), id: "far-future", notes: "far future" },
          {
            ...movedBy(appointment, 1),
            id: "near-future",
            notes: "near future",
          },
          {
            ...movedBy(appointment, -1),
            id: "recent-past",
            notes: "recent past",
          },
          {
            ...movedBy(appointment, -3),
            id: "distant-past",
            notes: "distant past",
          },
        ]}
      />,
    );

    const { upcoming, past } = halves(markup);
    // Soonest first among what is still to come.
    expect(upcoming.indexOf("near future")).toBeLessThan(
      upcoming.indexOf("far future"),
    );
    // Most recent first among what has already happened.
    expect(past.indexOf("recent past")).toBeLessThan(
      past.indexOf("distant past"),
    );
  });

  test("carries the therapy, the slot, the status in words, and the session note", async () => {
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
    // The slot's shape, not its day — the seed's calendar moves.
    expect(markup).toMatch(
      /[A-Z][a-z]+day, \d{1,2} [A-Z][a-z]+ \d{4} at \d{2}:\d{2}/,
    );
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
