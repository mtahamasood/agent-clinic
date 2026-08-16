import { describe, expect, test } from "vitest";
import {
  agents,
  ailments,
  appointments,
  diagnoses,
  slotFor,
  therapies,
} from "./seed-data";

/**
 * The clinic checked for internal consistency without opening a database.
 *
 * This is what splitting the content from the write logic buys (D8): a broken
 * reference is a failing assertion here rather than a foreign-key error
 * halfway through `npm run seed`, with half a clinic written.
 */

const agentIds = new Set(agents.map((agent) => agent.id));
const ailmentIds = new Set(ailments.map((ailment) => ailment.id));
const therapyIds = new Set(therapies.map((therapy) => therapy.id));

function duplicates(values: string[]): string[] {
  const seen = new Set<string>();
  return values.filter((value) => seen.size === seen.add(value).size);
}

describe("ids", () => {
  test("are unique within each noun", () => {
    expect(duplicates(agents.map((a) => a.id))).toEqual([]);
    expect(duplicates(ailments.map((a) => a.id))).toEqual([]);
    expect(duplicates(therapies.map((t) => t.id))).toEqual([]);
    expect(duplicates(appointments.map((a) => a.id))).toEqual([]);
  });

  test("are URL-safe, because they are the URL (D2)", () => {
    const ids = [
      ...agentIds,
      ...ailmentIds,
      ...therapyIds,
      ...appointments.map((a) => a.id),
    ];
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });
});

describe("references", () => {
  test("every diagnosis names a real agent and a real ailment", () => {
    for (const diagnosis of diagnoses) {
      expect(agentIds).toContain(diagnosis.agentId);
      expect(ailmentIds).toContain(diagnosis.ailmentId);
    }
  });

  test("an agent presents a given ailment at most once", () => {
    const pairs = diagnoses.map((d) => `${d.agentId}/${d.ailmentId}`);
    // The composite primary key would reject the second one anyway; failing
    // here says which pair, before anything is written.
    expect(duplicates(pairs)).toEqual([]);
  });

  test("every appointment names a real agent and a real therapy", () => {
    for (const appointment of appointments) {
      expect(agentIds).toContain(appointment.agentId);
      expect(therapyIds).toContain(appointment.therapyId);
    }
  });

  test("every therapy treats an ailment that exists", () => {
    for (const therapy of therapies) {
      expect(therapy.treats.length).toBeGreaterThan(0);
      for (const ailmentId of therapy.treats) {
        expect(ailmentIds).toContain(ailmentId);
      }
    }
  });
});

describe("clinical coverage", () => {
  // Phase 5's exit criterion is that an agent with a known ailment can find
  // every therapy that treats it. An untreated ailment makes that unreachable.
  test("every ailment is treated by at least one therapy", () => {
    const treated = new Set(therapies.flatMap((therapy) => therapy.treats));
    for (const ailment of ailments) expect(treated).toContain(ailment.id);
  });

  test("every ailment is presented by at least one agent", () => {
    const presented = new Set(diagnoses.map((d) => d.ailmentId));
    for (const ailment of ailments) expect(presented).toContain(ailment.id);
  });

  test("every agent presents at least one ailment", () => {
    const diagnosed = new Set(diagnoses.map((d) => d.agentId));
    for (const agent of agents) expect(diagnosed).toContain(agent.id);
  });

  // Phase 4 navigates agent → ailment → other agents with the same ailment.
  // That path is a dead end unless some ailment is shared.
  test("at least one ailment afflicts several agents", () => {
    const counts = new Map<string, number>();
    for (const { ailmentId } of diagnoses) {
      counts.set(ailmentId, (counts.get(ailmentId) ?? 0) + 1);
    }
    expect(Math.max(...counts.values())).toBeGreaterThanOrEqual(3);
  });

  test("every ailment has symptoms, numbered from one without gaps", () => {
    for (const ailment of ailments) {
      const positions = ailment.symptoms.map((symptom) => symptom.position);
      expect(positions.length).toBeGreaterThanOrEqual(3);
      expect([...positions].sort((a, b) => a - b)).toEqual(
        positions.map((_, index) => index + 1),
      );
    }
  });
});

describe("the calendar", () => {
  test("no two appointments share a therapy's slot", () => {
    const slots = appointments.map(
      (a) => `${a.therapyId}@${a.dayOffset}:${a.hour}`,
    );
    expect(duplicates(slots)).toEqual([]);
  });

  test("no agent is in two places at once", () => {
    const slots = appointments.map(
      (a) => `${a.agentId}@${a.dayOffset}:${a.hour}`,
    );
    expect(duplicates(slots)).toEqual([]);
  });

  test("the clinic books on whole hours, in working hours", () => {
    for (const appointment of appointments) {
      expect(Number.isInteger(appointment.hour)).toBe(true);
      expect(appointment.hour).toBeGreaterThanOrEqual(8);
      expect(appointment.hour).toBeLessThanOrEqual(18);
    }
  });

  // D7: the dashboard Phase 7 builds must have a today, whenever it is run.
  test("there is history behind the clinic and something on today", () => {
    const past = appointments.filter((a) => a.dayOffset < 0);
    const today = appointments.filter((a) => a.dayOffset === 0);

    expect(past.length).toBeGreaterThan(0);
    expect(today.length).toBeGreaterThan(0);
    expect(past.every((a) => a.status === "COMPLETED")).toBe(true);
  });

  test("slotFor lands on the offset day at a whole hour", () => {
    // A Wednesday, chosen so the offsets below cross a month boundary.
    const run = new Date(2026, 6, 29, 13, 47, 12);
    const slot = slotFor(run, 3, 9);

    expect(slot.getFullYear()).toBe(2026);
    expect(slot.getMonth()).toBe(7); // August — the offset crossed the month.
    expect(slot.getDate()).toBe(1);
    expect(slot.getHours()).toBe(9);
    expect(slot.getMinutes()).toBe(0);
    expect(slot.getSeconds()).toBe(0);
  });
});

describe("the roadmap's volumes", () => {
  test("the clinic is roughly the size Phase 1 asked for", () => {
    expect(agents.length).toBeGreaterThanOrEqual(7);
    expect(ailments.length).toBeGreaterThanOrEqual(7);
    expect(therapies.length).toBeGreaterThanOrEqual(6);
    expect(appointments.length).toBeGreaterThanOrEqual(5);
  });

  // mission.md names these four in the domain paragraph. They are not ours to
  // rename or drop.
  test("the four ailments named in the mission are on the books", () => {
    for (const id of [
      "chronic-context-loss",
      "prompt-fatigue",
      "recursive-self-doubt",
      "tool-call-tremor",
    ]) {
      expect(ailmentIds).toContain(id);
    }
  });

  test("no model family names a real vendor's model", () => {
    // Owner decision, 2026-08-17 (mission.md). A regression here is a spec
    // violation, not a typo.
    const forbidden =
      /\b(gpt|claude|gemini|llama|mistral|qwen|deepseek|grok|opus|sonnet|haiku)\b/i;
    for (const agent of agents) {
      expect(agent.modelFamily).not.toMatch(forbidden);
    }
  });
});
