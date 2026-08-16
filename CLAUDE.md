@AGENTS.md

# Requirement provenance (owner directive, 2026-08-16)

Never write a requirement, convention, or quality bar into `specs/` — or code
that enforces one — without a written source. Valid sources are exactly the
three in [tech-stack.md → Requirement provenance](specs/tech-stack.md#requirement-provenance):
the stakeholder brief in `README.md`, an existing constitution clause (cite
it), or a dated owner decision in `mission.md`. "Best practice", "industry
standard", or "the framework default" are proposals, not sources.

If work seems to need a requirement that has no source: **stop and ask the
owner.** Do not write it in as a default, however reasonable it looks. This
directive exists because an unattributed accessibility requirement entered the
constitution on day one and produced real work before anyone could say who
asked for it.

Decision records in feature specs must carry a `*Source:*` line —
`npm run check:provenance` enforces this and runs in CI.
