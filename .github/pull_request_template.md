<!-- The gates in specs/tech-stack.md apply to every PR. Two of them need a
     human answer rather than a script, so they are asked here. -->

## What and why

<!-- What changes, and which spec / phase / decision it traces to. -->

## Provenance

Per [tech-stack.md → Requirement provenance](../specs/tech-stack.md#requirement-provenance):

- [ ] Every requirement this PR adds or changes names its source — stakeholder
      brief, constitution clause (cited), or a dated owner decision in
      mission.md. **None of it exists because it "seemed like good practice."**
- [ ] New decision records carry a `*Source:*` line (`npm run check:provenance`
      passes).
- [ ] Nothing here widens scope beyond what the current phase's spec asks for;
      anything discovered mid-work went to the backlog or reopened the spec.

## Changelog

Per [tech-stack.md → Changelog](../specs/tech-stack.md#changelog):

- [ ] `CHANGELOG.md` carries an entry for this work, under today's date, written
      as a unit of work rather than a list of changed files. `npm run
      check:changelog` tests that the file was touched; that it says something
      true and worth reading is this checkbox.
