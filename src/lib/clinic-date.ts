/**
 * How the clinic writes a date down.
 *
 * The third module of this kind, and the same shape as the other two: the half
 * of a value that neither the schema nor the ORM can carry. `severity.ts` holds
 * clinical order, `appointment-status.ts` holds wording, and this holds the one
 * decision a `DateTime` column leaves open — what it looks like on a page (D8).
 *
 * The locale is pinned. Left to `toLocaleDateString()` with no arguments, every
 * date on the case file would depend on the machine rendering it: a Playwright
 * assertion would pass on one developer's laptop and fail on another's, and two
 * screenshots of the same patient would disagree for a reason neither reader
 * could see.
 *
 * No `timeZone` option, equally deliberately. The seed builds every instant
 * from local midnight plus a whole number of hours (Phase 1's D7), so the
 * clinic's calendar is already relative to whoever is running it. Forcing UTC
 * would render a 09:00 appointment at some other hour and put the seeded day
 * boundaries in the wrong place.
 *
 * Phase 3: specs/2026-08-20-agent-case-file/requirements.md.
 */

/** Admission and diagnosis dates: "27 June 2026". */
const DAY = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** Appointment slots: "Saturday, 27 June 2026 at 10:00". */
const SLOT = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** A day, with no time of day attached to it. */
export function formatClinicDate(date: Date): string {
  return DAY.format(date);
}

/** A slot on the calendar, which is a day and an hour the patient has to turn up. */
export function formatClinicDateTime(date: Date): string {
  return SLOT.format(date);
}
