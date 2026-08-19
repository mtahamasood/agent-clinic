import { describe, expect, test } from "vitest";
import { formatClinicDate, formatClinicDateTime } from "./clinic-date";

/**
 * The formats themselves, which is where a change to them should fail.
 *
 * Every instant here is built in *local* time — `new Date(y, m, d, h)` rather
 * than an ISO string — because the module formats in local time on purpose
 * (D8). Constructing the fixture the same way the seed does keeps this suite
 * from disagreeing with itself on a machine outside Europe.
 *
 * This file is also why no Playwright assertion names a date: the format is
 * checked once, here, against a fixed instant, instead of eight times against
 * whatever today happens to be.
 */
describe("how the clinic writes a date down", () => {
  test("a day carries no time of day", () => {
    expect(formatClinicDate(new Date(2026, 5, 27, 10, 30))).toBe(
      "27 June 2026",
    );
  });

  test("a slot carries the weekday and the hour, on a 24-hour clock", () => {
    expect(formatClinicDateTime(new Date(2026, 5, 27, 10, 0))).toBe(
      "Saturday, 27 June 2026 at 10:00",
    );
    expect(formatClinicDateTime(new Date(2026, 5, 27, 16, 0))).toBe(
      "Saturday, 27 June 2026 at 16:00",
    );
  });

  test("the locale does not follow the machine", () => {
    // en-GB puts the day before the month. A US-locale runner formatting this
    // instant with no locale argument would say "June 27, 2026", so this is the
    // assertion that fails if the pin is ever dropped.
    expect(formatClinicDate(new Date(2026, 5, 27))).toBe("27 June 2026");
  });
});
