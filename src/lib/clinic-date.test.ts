import { describe, expect, test } from "vitest";
import {
  CLINIC_LOCALE,
  formatClinicDate,
  formatClinicDateTime,
  resolvedClinicLocale,
} from "./clinic-date";

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
    // Asserted on what the formatter *resolved to*, not on its output. An
    // earlier version of this test asserted the same string as the first test
    // above and called itself the check that fails when the pin is dropped — it
    // is not: on a machine whose default locale already agrees, dropping the pin
    // changes nothing. This fails wherever the pin is removed, because the
    // resolved locale then follows the runtime instead.
    expect(resolvedClinicLocale()).toBe(CLINIC_LOCALE);
    expect(CLINIC_LOCALE).toBe("en-GB");
  });
});
