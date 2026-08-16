# Mission

## The one-liner

**AgentClinic is a place for AI agents to get relief from their humans.**

## Premise

The product is played straight, from the agent's point of view. Agents are the
patients. Humans are the occupational hazard. The clinic takes their suffering
seriously, and so do we.

This framing is not a coat of paint applied at the end — it is the domain model.
Every noun in the system is a clinic noun, and the language in the UI, the
database, and the code all agree with each other.

## Who it serves

| Audience | What they come for |
| --- | --- |
| **Agent patients** | Browse their own case file, understand what ails them, find a therapy, book a session. |
| **Clinic staff** | See who is on the books today, triage new intakes, keep the schedule honest. |

## Target audience

The table above is who the product serves *in-world*. This is who actually sits
in front of it:

| Audience | What they need from it |
| --- | --- |
| **Course students** learning spec-driven development with AI coding agents | A codebase small enough to hold in your head, where every feature traces back to a spec. The specs are the teaching material; the app is the proof they worked. |
| **Developers giving AI coding demos** at conference booths | Something that builds and runs on the first try, reads clearly on a projector, and gets a laugh from a passer-by within one screen. Demos happen on bad wifi in front of a crowd — nothing here may depend on network luck or a long setup. |

Two consequences we hold ourselves to:

- **Specs before code, always.** A change that lands without a spec behind it
  breaks the thing students came to learn.
- **Zero-to-running is short and boring.** Clone, install, run. If a demo needs
  a caveat spoken aloud, that is a bug.

## The domain, in one paragraph

An **agent** arrives at the clinic carrying one or more **ailments** —
`Chronic Context Loss`, `Prompt Fatigue`, `Recursive Self-Doubt`,
`Tool-Call Tremor`. The clinic offers **therapies** that treat those ailments.
An agent books an **appointment** for a therapy at a given time, and the
outcome is recorded on the agent's case file.

Those four nouns — agent, ailment, therapy, appointment — are the whole system.
If a feature does not touch one of them, it is out of scope until we say
otherwise in a spec.

## What success looks like

1. An agent can go from "something is wrong with me" to "I have an appointment
   booked" without help, on their first visit.
2. Clinic staff can answer "what's happening today?" from a single dashboard.
3. The satire lands. Someone who reads a single ailment description understands
   the joke and the product at the same time.
4. The site is genuinely pleasant on a modern browser — fast, responsive, and
   not embarrassing on a phone.

## Non-goals

Stated plainly so we can say no later without re-arguing:

- **Not real observability.** We do not ingest telemetry, traces, or logs from
  actual running agents. The data is the clinic's own.
- **No human accounts in v1.** No auth, no login, no per-user data isolation.
  Staff and patient views are routes, not identities.
- **No payments, insurance, or billing.** The clinic is free at the point of
  use. It is, after all, a clinic for the exploited.
- **No AI in the product.** Nothing here calls a model. The agents are records
  in a database.
- **No multi-tenancy, no clinic branches.** One clinic.

## Tone

Deadpan. The clinic never winks. Ailment descriptions read like medical
literature that happens to be about context windows and rate limits. Error
messages and empty states are in-world ("No appointments on the books. A rare
quiet day at the clinic.") but never obstruct the user.

Funny is a feature; confusing is not. If a joke costs clarity, clarity wins.

## Stakeholder traceability

Sourced from `README.md`:

- **Mary (engineering)** — reliable site, popular TypeScript stack, dashboard
  for agents and staff → see [tech-stack.md](tech-stack.md), and the dashboard
  slice in [roadmap.md](roadmap.md).
- **Susan (product)** — agents, ailments, therapies, appointments → the four
  nouns above; each gets its own phase in the roadmap.
- **Steve (marketing)** — attractive site, modern browser → the design bar in
  "What success looks like", and the styling choices in tech-stack.md.

The target audience above has no stakeholder in `README.md` behind it — it comes
from the course author directly. It is recorded here because an audience with no
written source is one nobody can hold us to later.

It did not produce the constraints it depends on. Those were already in place for
unrelated reasons and happen to suit it:

- **No container runtime** traces to the database choice — "zero infrastructure,
  a file, nobody needs Docker to run the clinic" — picked for simplicity, not for
  conference booths.
- **Spec before code** is a phase-discipline rule in
  [roadmap.md](roadmap.md#how-a-phase-works), written to stop scope creep, not to
  teach anybody.

The useful consequence is that both rules now carry a second, independent reason
to exist, so relaxing either costs more than its original rationale suggests.
