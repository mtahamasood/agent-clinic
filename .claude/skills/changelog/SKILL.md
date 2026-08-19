---
name: changelog
description: Update CHANGELOG.md for the work on the current branch, before merging. Use when the user asks to update the changelog, says they are about to merge or open a PR, or when check:changelog fails. Also bootstraps the file from git history if it does not exist.
---

# Changelog

Keep `CHANGELOG.md` at the repo root truthful and current. Run this **before
merging**, once the branch's work is finished.

The requirement lives in `specs/tech-stack.md` under "Changelog". This file is
the procedure, not the rule — if the two ever disagree, the spec wins and this
file is the bug.

## Format

- One `## YYYY-MM-DD` heading per date, **newest first**, under a short preamble.
- Bullets describe **units of work**, not commits. A phase or a pull request is
  one bullet; sub-bullets carry detail worth keeping.
- Reference the PR as `(#N)` and decision records as `D3`, `C16` where they
  explain the change.
- The date is the date the work lands on `main`, not the date the branch opened.

## Procedure

### 1. Find what changed

```sh
git fetch origin
git log --reverse --format='%h %s' origin/main..HEAD     # commits on this branch
git diff --stat origin/main...HEAD                        # files, at a glance
```

Read the actual diff for anything you cannot summarise from the subject line.
A changelog written from commit subjects alone repeats whatever the subjects got
wrong.

### 2. Decide whether an entry is owed

An entry is owed when the branch touches `src/`, `specs/`, or `prisma/` — the
same paths `npm run check:changelog` tests. Branches that only touch CI config,
formatting, or the changelog itself are exempt: padding the file with entries
nobody wants is how a changelog stops being read.

### 3. Write the entry

Today's date (`date +%F`) is normally the heading. If a heading for it already
exists, add to it rather than opening a second one.

Write **what changed and why it mattered**, in the register the specs use. The
audience is someone returning to the project in a month, and the course students
in `specs/mission.md`.

- Good: *"Responsive design became a sourced, executable requirement (#9). It
  had been asserted in three places and measured in none."*
- Bad: *"Updated tech-stack.md and playwright.config.ts."* That is the diff, and
  the reader already has the diff.

Where a change fixed a wrong belief, say what the belief was. Those entries are
the ones worth re-reading.

### 4. Check it

```sh
npm run check:changelog
npm run format
```

## Bootstrapping, when CHANGELOG.md does not exist

Build it from history rather than inventing it:

```sh
git log --date=short --pretty=format:'%ad|%h|%s|%p' --reverse
```

Group commits into units of work — a merge commit and the commits it brought in
are one entry, keyed to its PR number. Then **read the merge commits and the
substantive diffs** before writing; subjects alone will not tell you why a
change happened. Oldest date at the bottom.

## Rules

- **Never invent an entry.** Every bullet traces to a commit on this branch. If
  you cannot point at one, delete the bullet.
- **Never rewrite a past date's entries** to read better in hindsight. Correct a
  factual error in place and say so; otherwise the file stops being a record.
- **Do not restate the diff.** A bullet that only lists changed filenames is
  noise.
- **Do not add a rule here.** This file carries procedure. A new project rule —
  anything asserting the product or process *must* be some way — goes to the
  owner and enters through `specs/`, with a source. That is the standing owner
  decision of 2026-08-17, narrowed on 2026-08-19 to admit skills as a procedure
  surface only.
- **The gate is not the goal.** `check:changelog` only tests that the file was
  touched. It cannot tell whether the entry is true or useful. You can.
