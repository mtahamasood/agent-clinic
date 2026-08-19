---
name: local-server
description: Start and stop a local AgentClinic server without stranding a process. Use whenever running `next dev`, `next start`, or a server inside a network namespace for the offline check — and whenever a stray `next-server` needs clearing.
---

# Local server

Start it so it can be stopped. Stop it so nothing is left.

The rule lives in `specs/mission.md`, in the owner decisions of 2026-08-17 and
2026-08-20. This file is the procedure, not the rule — if the two ever disagree,
the spec wins and this file is the bug.

## Why this exists

Two servers were stranded during the Phase 2 walk, by two different mistakes
that look nothing alike until you have made both:

- A server backgrounded inside a **foreground** command. Nothing tracked it, so
  nothing could stop it.
- A server started as a tracked task and stopped with the stop tool — where the
  stop reached the wrapper and **not** the worker. Next renames its worker
  process to `next-server`, and it survived its parent.

The first is a launch mistake. The second is not a mistake at all — it is what
the stop tool does — which is why the launcher below, not the person, is what
has to get this right.

## Starting

Wrap the server so the **whole process group** dies with the task, and run that
as a tracked background task:

```sh
bash -c 'set -m; npm start & SRV=$!; trap "kill -- -$SRV 2>/dev/null" EXIT TERM INT; wait $SRV'
```

- `set -m` puts the server in its own process group, so `kill -- -$SRV` reaches
  the renamed worker as well as the wrapper.
- The `trap` fires when the task is stopped, so the cleanup belongs to the thing
  that did the starting.
- `npm run dev` substitutes for `npm start` unchanged.
- `PORT=NNNN` in front avoids a clash if something already holds 3000.

**Read the port out of the log before quoting a URL.** Next moves to the next
free port without being asked, and a URL quoted from the command rather than
from the log is how somebody gets shown the wrong page:

```sh
grep -E "Local:|Ready" <the task's output file>
```

Then confirm the port is genuinely bound, rather than trusting the log alone:

```sh
ss -tln | grep :3000
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/
```

## Inside a network namespace (the offline check)

A namespace with only loopback is unreachable from outside, so the server *and*
whatever probes it both have to live in there. Make the **whole `unshare`
invocation** the tracked task — one handle then owns the namespace and
everything in it, and stopping the task takes the lot. The worked recipe is
`A9` in `specs/2026-08-20-agent-roster/validation.md`.

## Stopping

1. Stop the task through the tool that started it. Never `pkill`.
2. Verify, every time — the stop is not the evidence:

```sh
ss -tln | grep :3000                              # expect nothing
pgrep -af "next-server|next start" | grep -v pgrep # expect nothing
```

3. If a worker survived anyway, **identify it before touching it**:

```sh
ps -o pid,ppid,lstart,args -p <pid>
readlink /proc/<pid>/cwd        # is it even this project?
readlink /proc/<pid>/ns/net     # compare with /proc/self/ns/net
```

4. Only once it is identified as a server this session started, stop it **by
   PID**: `kill <pid>`. One number, one process, chosen deliberately.

**Never `pkill -f "next start"`** or any other pattern. A pattern matches
processes nobody looked at, including somebody else's, and Next's rename means
it will miss the one you meant anyway — which is exactly how the 2026-08-17
incident produced an unstyled page served from memory by a process nobody could
name.

**A process this session did not start is not yours to stop.** Identify it, say
what it is, and let the owner decide.

## Never

- Do not `kill`, `pkill`, or `killall` by pattern.
- Do not delete a directory a server is still running out of.
- Do not quote a URL you have not seen in the server's own log.
