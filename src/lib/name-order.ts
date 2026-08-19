/**
 * How the clinic orders things that are ordered by name.
 *
 * The fourth module of this kind, and it exists for the reason `clinic-date.ts`
 * gives for pinning its locale: left to the runtime, the answer depends on the
 * machine. `String.prototype.localeCompare` with no argument uses the default
 * collator, which follows `LANG`/`LC_ALL`/ICU defaults and is independent of
 * both the timezone and anything this project sets. Two builds of the same
 * database can then disagree about the order of two rows, and the test that
 * notices is a test that fails on somebody else's laptop.
 *
 * Nothing in the seed exercises it today — every name is plain Latin script —
 * which is precisely why it was worth pinning before something does. Found by
 * the branch's own review on 2026-08-20 (D8).
 *
 * Clinical order is *not* here. Severity is ordered by rank rather than by
 * spelling, and that lives in `severity.ts` with its own reasoning.
 */
const NAMES = new Intl.Collator("en-GB");

/** Negative when `a` sorts first. The clinic's one answer for name order. */
export function compareNames(a: string, b: string): number {
  return NAMES.compare(a, b);
}

/** The collator's resolved locale, so a dropped pin is a test failure. */
export function resolvedNameLocale(): string {
  return NAMES.resolvedOptions().locale;
}
