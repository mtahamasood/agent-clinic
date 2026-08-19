import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { getAgent } from "@/server/agents";
import { DiagnosisList } from "./diagnosis-list";

/**
 * The ailment list's order and its empty branch, both rendered rather than read.
 *
 * The empty branch (D9) is the reason half of this file exists: the seed
 * diagnoses all eight patients, so nothing in a demo, a screenshot, or the
 * Playwright run ever reaches it, and check C15 says explicitly that ticking it
 * by reading the JSX does not count.
 *
 * The order is here as well as in Playwright because this is where the tiebreak
 * is visible. Nim presents one `SEVERE` and two `MILD` diagnoses, which is the
 * case a sort with no secondary key gets wrong intermittently — the kind of
 * failure that passes in CI for weeks first.
 *
 * Fixtures are real seeded patients from the suite's own database rather than
 * hand-built objects: they stay typed, they stay honest about the shape
 * `getAgent()` returns, and they cost nothing to maintain.
 */
async function caseFileFor(id: string) {
  const agent = await getAgent(id);
  if (!agent) throw new Error(`the seed has no patient called ${id}`);
  return agent;
}

describe("the presenting ailments", () => {
  test("lists every diagnosis with its severity written as a word", async () => {
    const agent = await caseFileFor("bodhi");
    const markup = renderToStaticMarkup(
      <DiagnosisList diagnoses={agent.diagnoses} />,
    );

    expect(agent.diagnoses).toHaveLength(3);
    for (const { ailment } of agent.diagnoses) {
      expect(markup).toContain(ailment.name);
    }
    expect(markup).toContain("Severe");
    expect(markup).toContain("Moderate");
    expect(markup).toContain("Mild");
  });

  test("reads worst first", async () => {
    const agent = await caseFileFor("bodhi");
    const markup = renderToStaticMarkup(
      <DiagnosisList diagnoses={agent.diagnoses} />,
    );

    // Owner decision, 2026-08-20 (Q1). Positions rather than a snapshot: what
    // matters is that the severe row comes first, not what the markup around
    // it looks like.
    expect(markup.indexOf("Rate-Limit Anxiety")).toBeLessThan(
      markup.indexOf("Tool-Call Tremor"),
    );
    expect(markup.indexOf("Tool-Call Tremor")).toBeLessThan(
      markup.indexOf("Recursive Self-Doubt"),
    );
  });

  test("breaks a tie alphabetically", async () => {
    const agent = await caseFileFor("nim");
    const markup = renderToStaticMarkup(
      <DiagnosisList diagnoses={agent.diagnoses} />,
    );

    // Nim's two MILD diagnoses. Without the tiebreak these two sit in whatever
    // order the database returned them (D6).
    expect(markup.indexOf("Tool-Call Tremor")).toBeLessThan(
      markup.indexOf("Chronic Context Loss"),
    );
    expect(markup.indexOf("Chronic Context Loss")).toBeLessThan(
      markup.indexOf("Sycophantic Drift"),
    );
  });

  test("does not reorder the array it was handed", async () => {
    const agent = await caseFileFor("bodhi");
    const before = agent.diagnoses.map((diagnosis) => diagnosis.ailmentId);

    renderToStaticMarkup(<DiagnosisList diagnoses={agent.diagnoses} />);

    expect(agent.diagnoses.map((diagnosis) => diagnosis.ailmentId)).toEqual(
      before,
    );
  });

  test("says so in voice when a patient has no diagnosis on file", async () => {
    const agent = await caseFileFor("bodhi");
    const markup = renderToStaticMarkup(<DiagnosisList diagnoses={[]} />);

    expect(markup).toContain("No diagnosis on file yet.");
    expect(markup).not.toContain('data-slot="badge"');
    expect(markup).not.toContain(agent.diagnoses[0].ailment.name);
  });
});
