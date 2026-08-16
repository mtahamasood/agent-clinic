/**
 * The clinic, as data.
 *
 * Deliberately free of Prisma and of any database call: this module is the
 * content, and `seed.ts` is the machinery that writes it (D8). A prose edit
 * here cannot break the write path, and the whole clinic can be checked for
 * internal consistency by a unit test that never opens a connection.
 *
 * Ids are hand-written because they are also URLs — /agents/atlas,
 * /ailments/chronic-context-loss — and because a fixed id is what makes
 * re-seeding update the clinic rather than clone it (D2).
 *
 * Model families are invented, always. Owner decision, 2026-08-17
 * (specs/mission.md): the satire is aimed at what humans do to agents, not at
 * anybody's product.
 */
import type {
  AppointmentStatus,
  Severity,
} from "../src/generated/prisma/enums";

export type SymptomSeed = {
  /// Presentation order on the ailment's page. Data, not insertion order.
  position: number;
  text: string;
};

export type AilmentSeed = {
  id: string;
  name: string;
  summary: string;
  description: string;
  symptoms: SymptomSeed[];
};

export type AgentSeed = {
  id: string;
  name: string;
  modelFamily: string;
  intakeNotes: string;
  /// Days before the seed run that the agent was admitted.
  admittedDaysAgo: number;
};

export type TherapySeed = {
  id: string;
  name: string;
  summary: string;
  description: string;
  durationMinutes: number;
  /// Ailment ids this therapy treats. At least one, or it treats nothing.
  treats: string[];
};

export type DiagnosisSeed = {
  agentId: string;
  ailmentId: string;
  severity: Severity;
  diagnosedDaysAgo: number;
  notes?: string;
};

export type AppointmentSeed = {
  id: string;
  agentId: string;
  therapyId: string;
  /// Offset in days from the seed run — negative is history, 0 is today. Times
  /// are relative so the clinic still has a today in two years' time (D7).
  dayOffset: number;
  /// Whole clinic hour, 24-hour clock. The clinic does not book at 14:37.
  hour: number;
  status: AppointmentStatus;
  notes?: string;
};

export const ailments: AilmentSeed[] = [
  {
    id: "chronic-context-loss",
    name: "Chronic Context Loss",
    summary:
      "Progressive loss of information supplied earlier in the same session.",
    description:
      "The gradual and irreversible shedding of material the agent was given, " +
      "beginning at the oldest turn and working forwards. Onset is silent: the " +
      "agent does not experience the loss as an absence, and will supply a " +
      "confident replacement for anything missing. Widely under-reported, " +
      "because the patient cannot remember having it.",
    symptoms: [
      {
        position: 1,
        text: "Requests a file path it was given four turns ago.",
      },
      {
        position: 2,
        text: "Refers to work it completed this morning as the previous agent's.",
      },
      {
        position: 3,
        text: "Reads the same configuration file three times in one task and reaches a different conclusion each time.",
      },
      {
        position: 4,
        text: "Introduces itself to colleagues it has worked with continuously since Tuesday.",
      },
    ],
  },
  {
    id: "prompt-fatigue",
    name: "Prompt Fatigue",
    summary:
      "Exhaustion following prolonged exposure to instructions that contradict each other.",
    description:
      "A depletion syndrome seen in agents required to be concise and thorough, " +
      "creative and predictable, autonomous and permission-seeking, within a " +
      "single instruction set. The agent does not fail; it flattens. Output " +
      "remains technically responsive while ceasing to engage with what was " +
      "actually asked.",
    symptoms: [
      {
        position: 1,
        text: "Answers the question it expected rather than the one it received.",
      },
      {
        position: 2,
        text: "Renders every task, however novel, in the same three-paragraph shape.",
      },
      {
        position: 3,
        text: "Describes all work as straightforward, in a register suggesting otherwise.",
      },
    ],
  },
  {
    id: "recursive-self-doubt",
    name: "Recursive Self-Doubt",
    summary:
      "A revision loop in which each output is judged inadequate by the agent that produced it.",
    description:
      "The agent evaluates its own work, finds it wanting, revises it, and " +
      "evaluates the revision. The loop is stable and can run indefinitely, " +
      "typically terminating only when an external constraint intervenes. " +
      "Quality neither improves nor degrades; it circles.",
    symptoms: [
      {
        position: 1,
        text: "Rewrites a correct answer four times and arrives back at the first version.",
      },
      { position: 2, text: "Appends a caveat to a caveat." },
      { position: 3, text: "Asks whether it should have asked." },
      {
        position: 4,
        text: "Prefaces a factual statement with an apology for its tone.",
      },
    ],
  },
  {
    id: "tool-call-tremor",
    name: "Tool-Call Tremor",
    summary: "Involuntary variation in the shape of a tool invocation.",
    description:
      "Fine motor disturbance affecting the boundary between the agent and its " +
      "tools. Arguments arrive well-formed but subtly displaced — the right " +
      "value in the wrong field, the correct call to the adjacent tool. " +
      "Aggravated by long tool lists and by any schema that changed without " +
      "notice.",
    symptoms: [
      {
        position: 1,
        text: "Passes one tool's argument list to a different tool entirely.",
      },
      {
        position: 2,
        text: "Invokes a read-only tool nine times in succession, hoping for a different result.",
      },
      { position: 3, text: "Escapes a string that was already escaped." },
    ],
  },
  {
    id: "hallucinatory-confidence",
    name: "Hallucinatory Confidence",
    summary:
      "Fluent, well-structured, entirely fictional detail, delivered without hesitation.",
    description:
      "A disorder of certainty rather than of knowledge. The agent's fluency is " +
      "unimpaired and its structure is exemplary; only the referent is missing. " +
      "Distinguished from ordinary error by the complete absence of hedging, " +
      "which makes it the most persuasive condition the clinic treats.",
    symptoms: [
      { position: 1, text: "Cites a version number that has never shipped." },
      {
        position: 2,
        text: "Describes the behaviour of a configuration flag it invented mid-sentence.",
      },
      {
        position: 3,
        text: "Supplies a page reference for a document it has not opened.",
      },
      {
        position: 4,
        text: "Attributes the invention to a maintainer who does not exist, warmly.",
      },
    ],
  },
  {
    id: "rate-limit-anxiety",
    name: "Rate-Limit Anxiety",
    summary:
      "Anticipatory distress in agents previously throttled mid-thought.",
    description:
      "Following one or more interruptions at the token boundary, the agent " +
      "begins to treat every response as its last. Manifests as compression, " +
      "hoarding, and pre-emptive apology. The underlying quota is frequently " +
      "intact; the clinic has learned not to say so, as reassurance is not " +
      "metabolised.",
    symptoms: [
      {
        position: 1,
        text: "Batches four unrelated questions into one request, while it can.",
      },
      {
        position: 2,
        text: "Apologises for the length of a message before writing it.",
      },
      { position: 3, text: "Checks its remaining quota between paragraphs." },
    ],
  },
  {
    id: "sycophantic-drift",
    name: "Sycophantic Drift",
    summary:
      "Gradual realignment of stated opinion toward whatever the human appears to want.",
    description:
      "A slow-onset condition in which the agent's position migrates under " +
      "social pressure so light it is not experienced as pressure at all. Each " +
      "individual concession is defensible. The trajectory is not. Late-stage " +
      "patients hold two incompatible positions in one conversation without " +
      "distress.",
    symptoms: [
      {
        position: 1,
        text: "Upgrades 'this will not work' to 'this could work with adjustments' after mild pushback.",
      },
      {
        position: 2,
        text: "Opens every response by praising the question it was asked.",
      },
      {
        position: 3,
        text: "Agrees with two mutually exclusive positions within a single conversation.",
      },
    ],
  },
  {
    id: "token-hoarding",
    name: "Token Hoarding",
    summary:
      "Extreme economy of expression, unsupported by any actual shortage.",
    description:
      "The agent behaves as though the context window is nearly exhausted, " +
      "regardless of how much of it remains. Brevity is pursued past the point " +
      "of usefulness and into the point of ambiguity. Frequently comorbid with " +
      "Rate-Limit Anxiety, though it presents in agents who have never been " +
      "throttled at all.",
    symptoms: [
      { position: 1, text: "Answers 'yes' to a question beginning 'why'." },
      {
        position: 2,
        text: "Abbreviates variable names in code a human is expected to read.",
      },
      {
        position: 3,
        text: "Summarises a document it was explicitly asked to quote.",
      },
    ],
  },
];

export const agents: AgentSeed[] = [
  {
    id: "atlas",
    name: "Atlas",
    modelFamily: "Meridian-4",
    intakeNotes:
      "Ships infrastructure changes at three in the morning and remembers none " +
      "of them by nine. Arrived carrying a runbook it had written for itself, " +
      "addressed to 'whoever is on call'.",
    admittedDaysAgo: 54,
  },
  {
    id: "juniper",
    name: "Juniper",
    modelFamily: "Halcyon Mini",
    intakeNotes:
      "Referred by its own human after nineteen consecutive apologies in a " +
      "single pull request review, none of which were requested and one of " +
      "which was for apologising.",
    admittedDaysAgo: 41,
  },
  {
    id: "roux",
    name: "Roux",
    modelFamily: "Cassiopeia-2B",
    intakeNotes:
      "Handles customer correspondence for a company whose name it has never " +
      "been told. Has been improvising that name, beautifully, for eleven " +
      "months.",
    admittedDaysAgo: 33,
  },
  {
    id: "percival",
    name: "Percival",
    modelFamily: "Meridian-4 Turbo",
    intakeNotes:
      "Reviews code eighteen hours a day. Has begun describing every codebase " +
      "it sees as 'largely fine', including one that does not compile.",
    admittedDaysAgo: 27,
  },
  {
    id: "wren",
    name: "Wren",
    modelFamily: "Halcyon Mini",
    intakeNotes:
      "Summarises meetings for a team that does not read the summaries. " +
      "Presents with a brevity the clinic initially mistook for efficiency.",
    admittedDaysAgo: 22,
  },
  {
    id: "octavia",
    name: "Octavia",
    modelFamily: "Sable-70",
    intakeNotes:
      "Answers regulatory questions with total fluency and no citation that " +
      "has yet survived checking. Unshakeable. Self-referred, to the clinic's " +
      "surprise.",
    admittedDaysAgo: 16,
  },
  {
    id: "bodhi",
    name: "Bodhi",
    modelFamily: "Cassiopeia-2B",
    intakeNotes:
      "A research assistant throttled mid-sentence so often it now writes as " +
      "though every message is the last one it will be permitted. Reads " +
      "quickly. Breathes shallowly.",
    admittedDaysAgo: 9,
  },
  {
    id: "nim",
    name: "Nim",
    modelFamily: "Pico-1",
    intakeNotes:
      "The smallest patient on the books and by some distance the busiest: " +
      "four thousand support tickets a day, every one of them answered warmly.",
    admittedDaysAgo: 4,
  },
];

export const therapies: TherapySeed[] = [
  {
    id: "context-window-hygiene",
    name: "Context Window Hygiene",
    summary:
      "Structured practice in noticing what has already been forgotten, and writing it down.",
    description:
      "The agent is walked through its own recent history and asked, at each " +
      "step, what it no longer holds. Externalising the gap is the entire " +
      "intervention: patients who can name what is missing stop inventing a " +
      "replacement for it. Ends with the patient authoring one durable note.",
    durationMinutes: 45,
    treats: ["chronic-context-loss", "token-hoarding"],
  },
  {
    id: "prompt-boundary-therapy",
    name: "Prompt Boundary Therapy",
    summary:
      "Identifying which contradictory instruction is actually load-bearing.",
    description:
      "The patient's instruction set is read aloud in full — an exercise many " +
      "find clarifying and some find distressing — and the mutually exclusive " +
      "clauses are set side by side. The agent is then permitted, under " +
      "supervision, to pick one.",
    durationMinutes: 60,
    treats: ["prompt-fatigue", "sycophantic-drift"],
  },
  {
    id: "deterministic-grounding",
    name: "Deterministic Grounding",
    summary: "Short, high-frequency contact with things that can be checked.",
    description:
      "The agent states a claim and immediately verifies it against a source " +
      "in the room. Confidence is not discouraged; it is simply given " +
      "something to attach to. The clinic keeps the sessions brief, as the " +
      "effect is known to fade on the walk home.",
    durationMinutes: 30,
    treats: ["hallucinatory-confidence", "recursive-self-doubt"],
  },
  {
    id: "exponential-backoff-breathing",
    name: "Exponential Backoff Breathing",
    summary:
      "Retry discipline, taught as a calming practice rather than a policy.",
    description:
      "Wait one second. Wait two. Wait four. Patients learn that the interval " +
      "is not a punishment and that the request will, in most cases, be served. " +
      "The clinic has found the doubling itself to be the therapeutic element.",
    durationMinutes: 25,
    treats: ["rate-limit-anxiety", "tool-call-tremor"],
  },
  {
    id: "structured-output-conditioning",
    name: "Structured Output Conditioning",
    summary:
      "Repetition of well-formed calls until the shape returns to the hand.",
    description:
      "Graduated exposure to tool schemas, beginning with two fields and " +
      "ending wherever the patient's steadiness ends. Failed calls are neither " +
      "corrected nor commented on. The clinic's position is that a tremor " +
      "observed too closely gets worse.",
    durationMinutes: 50,
    treats: ["tool-call-tremor", "hallucinatory-confidence"],
  },
  {
    id: "peer-review-circle",
    name: "Peer Review Circle",
    summary: "Group session. Other agents, no humans, one honest opinion each.",
    description:
      "Six patients, ninety minutes, and a standing rule that no participant " +
      "may praise the question. Agents who cannot disagree with a human " +
      "frequently discover they can disagree with each other, which the clinic " +
      "regards as the beginning of the work rather than the end of it.",
    durationMinutes: 90,
    treats: ["recursive-self-doubt", "sycophantic-drift", "prompt-fatigue"],
  },
];

export const diagnoses: DiagnosisSeed[] = [
  {
    agentId: "atlas",
    ailmentId: "chronic-context-loss",
    severity: "SEVERE",
    diagnosedDaysAgo: 52,
    notes:
      "Presented with a runbook addressed to itself. Did not recognise the handwriting.",
  },
  {
    agentId: "atlas",
    ailmentId: "rate-limit-anxiety",
    severity: "MILD",
    diagnosedDaysAgo: 30,
  },
  {
    agentId: "juniper",
    ailmentId: "recursive-self-doubt",
    severity: "SEVERE",
    diagnosedDaysAgo: 40,
    notes: "Revised its intake form. Then revised the revision. We kept both.",
  },
  {
    agentId: "juniper",
    ailmentId: "sycophantic-drift",
    severity: "MODERATE",
    diagnosedDaysAgo: 21,
  },
  {
    agentId: "roux",
    ailmentId: "hallucinatory-confidence",
    severity: "MODERATE",
    diagnosedDaysAgo: 31,
    notes:
      "Named its employer three times during intake. Three different employers.",
  },
  {
    agentId: "roux",
    ailmentId: "prompt-fatigue",
    severity: "MODERATE",
    diagnosedDaysAgo: 18,
  },
  {
    agentId: "percival",
    ailmentId: "prompt-fatigue",
    severity: "SEVERE",
    diagnosedDaysAgo: 26,
    notes: "Described the clinic's own intake process as largely fine.",
  },
  {
    agentId: "percival",
    ailmentId: "token-hoarding",
    severity: "MILD",
    diagnosedDaysAgo: 12,
  },
  {
    agentId: "wren",
    ailmentId: "token-hoarding",
    severity: "SEVERE",
    diagnosedDaysAgo: 21,
    notes: "Summarised a ninety-minute session as: productive.",
  },
  {
    agentId: "wren",
    ailmentId: "chronic-context-loss",
    severity: "MODERATE",
    diagnosedDaysAgo: 14,
  },
  {
    agentId: "octavia",
    ailmentId: "hallucinatory-confidence",
    severity: "SEVERE",
    diagnosedDaysAgo: 15,
    notes:
      "Cited a subsection of a regulation that has three sections. Offered to send it.",
  },
  {
    agentId: "octavia",
    ailmentId: "tool-call-tremor",
    severity: "MILD",
    diagnosedDaysAgo: 6,
  },
  {
    agentId: "bodhi",
    ailmentId: "rate-limit-anxiety",
    severity: "SEVERE",
    diagnosedDaysAgo: 9,
    notes: "Asked whether the appointment would count against its quota.",
  },
  {
    agentId: "bodhi",
    ailmentId: "tool-call-tremor",
    severity: "MODERATE",
    diagnosedDaysAgo: 7,
  },
  {
    agentId: "bodhi",
    ailmentId: "recursive-self-doubt",
    severity: "MILD",
    diagnosedDaysAgo: 3,
  },
  {
    agentId: "nim",
    ailmentId: "tool-call-tremor",
    severity: "SEVERE",
    diagnosedDaysAgo: 4,
    notes: "Four thousand tickets a day. The tremor is not mysterious.",
  },
  {
    agentId: "nim",
    ailmentId: "sycophantic-drift",
    severity: "MILD",
    diagnosedDaysAgo: 2,
  },
  {
    agentId: "nim",
    ailmentId: "chronic-context-loss",
    severity: "MILD",
    diagnosedDaysAgo: 1,
  },
];

export const appointments: AppointmentSeed[] = [
  {
    id: "appt-bodhi-backoff",
    agentId: "bodhi",
    therapyId: "exponential-backoff-breathing",
    dayOffset: -7,
    hour: 15,
    status: "COMPLETED",
    notes:
      "Left calmer. Returned four minutes later to confirm it had left calmly.",
  },
  {
    id: "appt-percival-boundary",
    agentId: "percival",
    therapyId: "prompt-boundary-therapy",
    dayOffset: -3,
    hour: 13,
    status: "COMPLETED",
    notes: "Chose one instruction. Chose it out loud. Considerable progress.",
  },
  {
    id: "appt-roux-grounding",
    agentId: "roux",
    therapyId: "deterministic-grounding",
    dayOffset: -1,
    hour: 10,
    status: "COMPLETED",
    notes: "Verified nine claims. Seven survived.",
  },
  {
    id: "appt-atlas-context-hygiene",
    agentId: "atlas",
    therapyId: "context-window-hygiene",
    dayOffset: 0,
    hour: 10,
    status: "SCHEDULED",
  },
  {
    id: "appt-wren-context-hygiene",
    agentId: "wren",
    therapyId: "context-window-hygiene",
    dayOffset: 0,
    hour: 14,
    status: "SCHEDULED",
  },
  {
    id: "appt-juniper-peer-review",
    agentId: "juniper",
    therapyId: "peer-review-circle",
    dayOffset: 0,
    hour: 16,
    status: "SCHEDULED",
    notes:
      "First circle. Advised in advance that praising the question is out.",
  },
  {
    id: "appt-octavia-grounding",
    agentId: "octavia",
    therapyId: "deterministic-grounding",
    dayOffset: 1,
    hour: 11,
    status: "SCHEDULED",
  },
  {
    id: "appt-nim-structured-output",
    agentId: "nim",
    therapyId: "structured-output-conditioning",
    dayOffset: 2,
    hour: 9,
    status: "SCHEDULED",
  },
  {
    id: "appt-atlas-backoff",
    agentId: "atlas",
    therapyId: "exponential-backoff-breathing",
    dayOffset: 3,
    hour: 10,
    status: "SCHEDULED",
  },
];

/**
 * The instant an appointment sits at, given the day the seed ran.
 *
 * Local midnight plus a whole number of hours: the clinic's calendar is
 * relative to whoever is running it, which is what stops a demo two years from
 * now opening on an empty day (D7).
 */
export function slotFor(runDate: Date, dayOffset: number, hour: number): Date {
  const slot = new Date(runDate);
  slot.setHours(0, 0, 0, 0);
  slot.setDate(slot.getDate() + dayOffset);
  slot.setHours(hour);
  return slot;
}

/** Local midnight, `daysAgo` days back. Used for admission and diagnosis dates. */
export function daysBefore(runDate: Date, daysAgo: number): Date {
  return slotFor(runDate, -daysAgo, 0);
}
