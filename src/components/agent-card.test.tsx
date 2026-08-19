import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, test } from "vitest";
import { listAgents } from "@/server/agents";
import { AgentCard } from "./agent-card";

/**
 * The card's two branches, both rendered rather than read.
 *
 * The undiagnosed branch (D5) is the reason this file exists: the seed gives
 * every patient at least one diagnosis, so nothing in a demo, a screenshot, or
 * the Playwright run ever reaches it — and check C9 says explicitly that ticking
 * it by reading the JSX does not count. It becomes reachable the first time
 * anyone seeds a partial clinic or admits a patient before diagnosing them, and
 * what it must not do then is leave a blank gap where a list was.
 *
 * The fixture is a real seeded agent from the suite's own database rather than
 * a hand-built object: it stays typed, it stays honest about the shape
 * `listAgents()` actually returns, and it costs no fixture to maintain.
 */
describe("the roster card", () => {
  test("carries the patient's name, model family, and every ailment they present", async () => {
    const [agent] = await listAgents();
    const markup = renderToStaticMarkup(<AgentCard agent={agent} />);

    expect(markup).toContain(agent.name);
    expect(markup).toContain(agent.modelFamily);
    for (const { ailment } of agent.diagnoses) {
      expect(markup).toContain(ailment.name);
    }
    expect(markup).not.toContain("No diagnosis on file yet.");
  });

  test("says so in voice when a patient has no diagnosis on file", async () => {
    const [agent] = await listAgents();
    const undiagnosed = { ...agent, diagnoses: [] };

    const markup = renderToStaticMarkup(<AgentCard agent={undiagnosed} />);

    expect(markup).toContain("No diagnosis on file yet.");
    // The name and model family still show: an undiagnosed patient is still a
    // patient, not a hole in the roster.
    expect(markup).toContain(agent.name);
    expect(markup).toContain(agent.modelFamily);
    expect(markup).not.toContain('data-slot="badge"');
  });

  test("shows no severity — that is the case file's job in Phase 3", async () => {
    const [agent] = await listAgents();
    const markup = renderToStaticMarkup(<AgentCard agent={agent} />);

    // D2: three fields and no fourth. Severity and the intake notes are the
    // two most likely to drift onto this card, so they are asserted absent
    // rather than left to a reviewer's eye.
    for (const { severity } of agent.diagnoses) {
      expect(markup.toLowerCase()).not.toContain(severity.toLowerCase());
    }
    expect(markup).not.toContain(agent.intakeNotes);
  });
});
