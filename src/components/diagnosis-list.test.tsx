import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { getAgent } from "@/server/agents";
import { DiagnosisList } from "./diagnosis-list";

/**
 * The ailment list's order, its pairing, and its empty branch — all rendered
 * rather than read.
 *
 * The tiebreak test is written against **Roux** deliberately, and the reason is
 * a finding from this branch's own review. It was first written against Nim,
 * whose two `MILD` diagnoses already arrive alphabetically from the
 * `diagnosedOn desc` query — so with a stable sort, deleting the tiebreak left
 * Nim's rendered order byte-identical and the test passed on a feature that was
 * no longer there. Measured by deleting it, not argued. Roux's two `MODERATE`
 * diagnoses arrive in the opposite order to alphabetical, so Roux is the one
 * fixture in the whole seed that can fail.
 *
 * The empty branch (D9) is unreachable from the seed, which diagnoses all eight
 * patients, and check C15 says explicitly that ticking it by reading the JSX
 * does not count.
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

/** The rendered entries, one string each, so a claim can be made about one row. */
function entries(markup: string) {
  return markup.split("<li").slice(1);
}

describe("the presenting ailments", () => {
  test("lists every diagnosis with its severity written as a word", async () => {
    const agent = await caseFileFor("bodhi");
    const markup = renderToStaticMarkup(
      <DiagnosisList diagnoses={agent.diagnoses} />,
    );

    expect(agent.diagnoses).toHaveLength(3);
    expect(entries(markup)).toHaveLength(3);
    for (const { ailment } of agent.diagnoses) {
      expect(markup).toContain(ailment.name);
    }
  });

  test("puts each severity beside the ailment it belongs to", async () => {
    const agent = await caseFileFor("bodhi");
    const markup = renderToStaticMarkup(
      <DiagnosisList diagnoses={agent.diagnoses} />,
    );

    // Asserting the words are all *somewhere* in the markup passes on a
    // component that renders three correct words against three wrong ailments,
    // which is the whole failure worth catching here.
    const rendered = entries(markup);
    for (const { ailment, severity } of agent.diagnoses) {
      const entry = rendered.find((row) => row.includes(ailment.name));
      expect(entry, `no entry rendered for ${ailment.name}`).toBeDefined();
      expect(entry).toContain(
        severity[0] + severity.slice(1).toLowerCase(), // MODERATE -> Moderate
      );
    }
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
    const agent = await caseFileFor("roux");
    const markup = renderToStaticMarkup(
      <DiagnosisList diagnoses={agent.diagnoses} />,
    );

    // Roux's two MODERATE diagnoses arrive from the query as Prompt Fatigue
    // (18 days ago) then Hallucinatory Confidence (31 days ago). Remove the
    // tiebreak and a stable sort leaves them in exactly that order, so this
    // assertion inverts — which is the point of choosing this patient (D6).
    expect(markup.indexOf("Hallucinatory Confidence")).toBeLessThan(
      markup.indexOf("Prompt Fatigue"),
    );
  });

  test("carries the diagnosis date and the clinical aside", async () => {
    const agent = await caseFileFor("bodhi");
    const markup = renderToStaticMarkup(
      <DiagnosisList diagnoses={agent.diagnoses} />,
    );

    // The shape, not the day: the seed's dates move with the calendar, and a
    // suite that asserts today's date is a suite that fails at midnight.
    expect(markup).toMatch(/Diagnosed \d{1,2} [A-Z][a-z]+ \d{4}/);
    // Where most of the comedy lives, and otherwise verified by nothing.
    expect(markup).toContain(
      "Asked whether the appointment would count against its quota.",
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
    const markup = renderToStaticMarkup(<DiagnosisList diagnoses={[]} />);

    expect(markup).toContain("No diagnosis on file yet.");
    expect(entries(markup)).toHaveLength(0);
    for (const word of ["Mild", "Moderate", "Severe"]) {
      expect(markup).not.toContain(word);
    }
  });
});
