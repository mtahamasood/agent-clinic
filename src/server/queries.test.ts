import { describe, expect, test } from "vitest";
import { getAgent, listAgents } from "./agents";
import { getAilment, getNoticeBoardAilment, listAilments } from "./ailments";
import {
  getTherapy,
  listTherapies,
  listTherapiesForAilment,
} from "./therapies";
import { getAppointment, listAppointmentsOn } from "./appointments";

/**
 * The phase's exit criterion: queries for each noun return sensible typed
 * results. Run against the database the suite provisions and seeds for itself
 * (D11) — never the developer's clinic.db.
 *
 * Assertions are about shape and relations, not prose. The copy in
 * seed-data.ts is meant to be edited, and a test that pins a description makes
 * editing it a failure.
 */

describe("agents", () => {
  test("the roster carries every patient and what they present with", async () => {
    const roster = await listAgents();

    expect(roster.length).toBeGreaterThanOrEqual(7);
    for (const agent of roster) {
      expect(agent.modelFamily).toMatch(/\S/);
      expect(agent.diagnoses.length).toBeGreaterThan(0);
      // The ailment is joined through, not just its id — a roster card needs
      // the name (Phase 2).
      expect(agent.diagnoses[0]?.ailment.name).toMatch(/\S/);
    }
  });

  test("the roster is alphabetical", async () => {
    const names = (await listAgents()).map((agent) => agent.name);
    expect(names).toEqual([...names].sort());
  });

  test("a case file carries severities and appointment history", async () => {
    const atlas = await getAgent("atlas");

    expect(atlas?.name).toBe("Atlas");
    expect(atlas?.diagnoses.some((d) => d.severity === "SEVERE")).toBe(true);
    // Phase 3 shows the history newest first.
    const times =
      atlas?.appointments.map((a) => a.scheduledFor.getTime()) ?? [];
    expect(times).toEqual([...times].sort((a, b) => b - a));
    expect(atlas?.appointments[0]?.therapy.name).toMatch(/\S/);
  });

  test("an unknown agent is null rather than a throw", async () => {
    expect(await getAgent("no-such-agent")).toBeNull();
  });
});

describe("ailments", () => {
  test("the directory is alphabetical and complete", async () => {
    const directory = await listAilments();
    const names = directory.map((ailment) => ailment.name);

    expect(directory.length).toBeGreaterThanOrEqual(7);
    expect(names).toEqual([...names].sort());
  });

  test("an ailment carries symptoms in order, its agents, and its therapies", async () => {
    const ailment = await getAilment("chronic-context-loss");

    const positions = ailment?.symptoms.map((s) => s.position) ?? [];
    expect(positions).toEqual([...positions].sort((a, b) => a - b));
    expect(positions.length).toBeGreaterThanOrEqual(3);

    // Phase 4 navigates ailment → the agents who present with it.
    expect(ailment?.diagnoses.length).toBeGreaterThan(1);
    expect(ailment?.diagnoses[0]?.agent.name).toMatch(/\S/);
    expect(ailment?.therapies.length).toBeGreaterThan(0);
  });

  test("the notice board picks the same ailment every time", async () => {
    const [first, second] = await Promise.all([
      getNoticeBoardAilment(),
      getNoticeBoardAilment(),
    ]);

    expect(first?.id).toBe(second?.id);
    expect(first?.summary).toMatch(/\S/);
  });
});

describe("therapies", () => {
  test("the catalog carries what each therapy treats", async () => {
    const catalog = await listTherapies();

    expect(catalog.length).toBeGreaterThanOrEqual(6);
    for (const therapy of catalog) {
      expect(therapy.durationMinutes).toBeGreaterThan(0);
      expect(therapy.ailments.length).toBeGreaterThan(0);
    }
  });

  test("filtering by ailment finds every therapy that treats it", async () => {
    const treating = await listTherapiesForAilment("tool-call-tremor");
    const expected = (await listTherapies()).filter((therapy) =>
      therapy.ailments.some((ailment) => ailment.id === "tool-call-tremor"),
    );

    expect(treating.map((t) => t.id)).toEqual(expected.map((t) => t.id));
    expect(treating.length).toBeGreaterThan(0);
  });

  test("an unknown therapy is null", async () => {
    expect(await getTherapy("leeches")).toBeNull();
  });
});

describe("appointments", () => {
  test("today's calendar is populated and in time order", async () => {
    const today = await listAppointmentsOn(new Date());

    // D7: the seed always puts something on today, whenever it runs.
    expect(today.length).toBeGreaterThan(0);
    const times = today.map((a) => a.scheduledFor.getTime());
    expect(times).toEqual([...times].sort((a, b) => a - b));

    for (const appointment of today) {
      expect(appointment.agent.name).toMatch(/\S/);
      expect(appointment.therapy.name).toMatch(/\S/);
    }
  });

  test("a day with nothing booked is an empty list, not an error", async () => {
    const farFuture = new Date();
    farFuture.setFullYear(farFuture.getFullYear() + 5);

    expect(await listAppointmentsOn(farFuture)).toEqual([]);
  });

  test("a seeded appointment joins to both ends", async () => {
    const appointment = await getAppointment("appt-bodhi-backoff");

    expect(appointment?.agent.id).toBe("bodhi");
    expect(appointment?.therapy.id).toBe("exponential-backoff-breathing");
    expect(appointment?.status).toBe("COMPLETED");
    expect(appointment?.scheduledFor.getTime()).toBeLessThan(Date.now());
  });
});

describe("the database enforces what the schema promises", () => {
  test("a therapy cannot run two sessions in the same slot (D6)", async () => {
    const { prisma } = await import("@/lib/prisma");
    const taken = await getAppointment("appt-atlas-context-hygiene");
    if (!taken) throw new Error("Seed is missing the slot this test needs.");

    await expect(
      prisma.appointment.create({
        data: {
          agentId: "juniper",
          therapyId: taken.therapyId,
          scheduledFor: taken.scheduledFor,
        },
      }),
    ).rejects.toThrow();
  });

  test("an agent cannot be in two therapies at once (D6)", async () => {
    const { prisma } = await import("@/lib/prisma");
    const taken = await getAppointment("appt-atlas-context-hygiene");
    if (!taken) throw new Error("Seed is missing the slot this test needs.");

    await expect(
      prisma.appointment.create({
        data: {
          agentId: taken.agentId,
          therapyId: "peer-review-circle",
          scheduledFor: taken.scheduledFor,
        },
      }),
    ).rejects.toThrow();
  });
});
