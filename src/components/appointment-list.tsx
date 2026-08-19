import Link from "next/link";
import { formatClinicDateTime } from "@/lib/clinic-date";
import { appointmentStatusLabel } from "@/lib/appointment-status";
import type { getAgent } from "@/server/agents";

/**
 * Everything on the clinic's calendar for one patient, in two halves.
 *
 * The roadmap calls this section "appointment history", and it shows the future
 * as well (D7): Phase 6's exit criterion is that a newly booked appointment
 * appears on the agent's case file, and a newly booked appointment has not
 * happened yet. Split rather than run together because `getAgent()` returns
 * every booking by date descending, which puts the furthest-away one at the top
 * and reads as a history that starts three days from now.
 *
 * A component rather than a branch inside the page, so its empty state can be
 * rendered by a test: the seed books all eight patients, so nothing in a demo
 * ever reaches it (D9). It becomes ordinary in Phase 6, where a patient exists
 * before their first booking.
 *
 * The therapy's name links to its catalog entry (Phase 4+5's D5) — a link to
 * what a session is, not an affordance to book another one; booking is Phase
 * 6+7's and nothing here writes.
 *
 * Phase 3: specs/2026-08-20-agent-case-file/requirements.md.
 * Phase 4+5: specs/2026-08-20-ailment-directory-therapy-catalog/requirements.md.
 */

// Derived from the query rather than declared beside it (D1).
type CaseFile = NonNullable<Awaited<ReturnType<typeof getAgent>>>;
type CaseFileAppointment = CaseFile["appointments"][number];

export function AppointmentList({
  appointments,
}: {
  appointments: CaseFileAppointment[];
}) {
  if (appointments.length === 0) {
    return (
      <p className="mt-4 text-muted-foreground">
        Never been seen. Registered, diagnosed, and left in the waiting room.
      </p>
    );
  }

  // Taken once, rather than inside a comparator. Worth knowing what this
  // instant actually is: the route is prerendered (D3), so it is the moment of
  // the *build*. An appointment crosses from one heading to the other when the
  // site is rebuilt rather than when its hour arrives, which means a long-lived
  // build eventually files this morning's finished session under "Still to
  // come". That is a sharper failure than D12's — D12 is data going stale, and
  // nothing already on the page becomes untrue; this is an unchanged row
  // migrating to the wrong heading. Phase 6 owns the rendering strategy that
  // fixes it (D7).
  const now = new Date();

  // Split by the clock, not by status. They agree in the seed and they are
  // still two different facts: a session can be over without anyone having
  // marked it completed, and the file should say so rather than quietly file it
  // under what is still to come.
  //
  // Both halves are sorted here rather than trusted from the query. `past`
  // happens to arrive in the right order today — `getAgent()` returns
  // `scheduledFor` descending — and a component that leans on a caller's
  // ordering breaks silently the day the caller changes its mind.
  const upcoming = appointments
    .filter((appointment) => appointment.scheduledFor >= now)
    .sort((a, b) => a.scheduledFor.getTime() - b.scheduledFor.getTime());
  const past = appointments
    .filter((appointment) => appointment.scheduledFor < now)
    .sort((a, b) => b.scheduledFor.getTime() - a.scheduledFor.getTime());

  return (
    <>
      {/* No heading over an empty list: a patient with only past sessions is
          not a patient with an empty diary, and an "Upcoming" heading over
          nothing reads as a bug. */}
      {upcoming.length > 0 ? (
        <Sessions heading="Still to come" appointments={upcoming} />
      ) : null}
      {past.length > 0 ? (
        <Sessions heading="Already seen" appointments={past} />
      ) : null}
    </>
  );
}

function Sessions({
  heading,
  appointments,
}: {
  heading: string;
  appointments: CaseFileAppointment[];
}) {
  return (
    <section className="mt-4">
      <h3 className="text-sm font-medium text-muted-foreground">{heading}</h3>
      <ul className="mt-2 space-y-4">
        {appointments.map((appointment) => (
          <li
            key={appointment.id}
            className="border-t border-foreground/10 pt-4 first:border-t-0 first:pt-0"
          >
            <p className="font-medium">
              <Link
                href={`/therapies/${appointment.therapyId}`}
                className="hover:underline"
              >
                {appointment.therapy.name}
              </Link>
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatClinicDateTime(appointment.scheduledFor)} ·{" "}
              {appointmentStatusLabel(appointment.status)}
            </p>
            {appointment.notes ? (
              <p className="mt-2 text-sm text-muted-foreground italic">
                {appointment.notes}
              </p>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}
