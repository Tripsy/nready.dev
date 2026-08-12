---
description: Start / stop / diagnose the nready dev stack (API + UI containers and their dev servers)
argument-hint: "[start|stop|down|restart|status|logs|doctor] [api|ui|all]"
allowed-tools: Bash(.claude/scripts/dev-stack.sh:*), Bash(docker:*), Read, Grep, Agent
---

Drive the dev stack through `.claude/scripts/dev-stack.sh`. Never start the servers by hand
with `docker exec -it … pnpm run dev` — that blocks the session and leaves no log to read.

Requested action: **$ARGUMENTS** (empty means `start all`).

## The script

```bash
.claude/scripts/dev-stack.sh start   [api|ui|all]   # containers up + pnpm run dev, waits until healthy
.claude/scripts/dev-stack.sh stop    [api|ui|all]   # kill dev servers, containers stay up
.claude/scripts/dev-stack.sh down    [api|ui|all]   # dev servers + containers down
.claude/scripts/dev-stack.sh restart [api|ui|all]   # fast: containers are not recreated
.claude/scripts/dev-stack.sh status  [api|ui|all]   # container, process, memory, HTTP health
.claude/scripts/dev-stack.sh logs    [api|ui|all] [lines]
.claude/scripts/dev-stack.sh doctor  [api|ui|all]   # exit codes, OOM flags, memory, log errors
```

- API — `nready-api.test`, http://localhost:3000, log at `logs/dev.log`
- UI — `nready-ui.test`, http://localhost, log at `../nready-ui/logs/dev.log`
- Both need the external `development` network plus the `postgres` and `redis` containers;
  the script creates the network and warns about the others.

## What to do

1. Run the requested subcommand.
2. Report the outcome in a few lines: per side, container state / dev server / URL.
3. **If a side fails to come up, diagnose it — do not just report the failure.** Run
   `doctor` for that side, read the tail of its `logs/dev.log`, and name the actual cause.
   The recurring ones:
   - **UI unreachable from the host while its log says `✓ Ready`** — the container was
     *restarted* rather than recreated and came back without its host port mapping
     (`docker ps` shows a bare `80/tcp` instead of `0.0.0.0:80->80/tcp`; `docker port
     nready-ui.test` prints nothing). Nothing is wrong with the app. `start` detects this
     and force-recreates on its own; if it still fails, a host process holds port 80 —
     `lsof -nP -iTCP:80 -sTCP:LISTEN`.
   - **exit 137 / OOMKilled** — the container hit its `mem_limit: 4g`. Check what else was
     running; a Next dev server plus a jest run in the API container is the usual squeeze.
   - **`EADDRINUSE`** — a previous dev server survived. `stop` then `start` that side.
   - **`ECONNREFUSED` from the API** — `postgres` or `redis` is down; start those stacks.
   - **Next.js compile / module-resolution errors** — a real code error in `nready-ui`;
     quote the file and line from the log.
   - **Container `absent`** — the image was never built; `docker compose up -d --build` in
     that project directory.
4. Only stop and ask the user when the cause is a code change they need to decide about.
   Restarting a side, clearing a stale process, or rebuilding an image are yours to do.

## Delegating

If the failure needs real digging — chasing an error through `nready-ui` source, or watching
a flaky start across several restarts — hand it to a subagent so the log volume stays out of
this conversation:

> Use the Agent tool (`general-purpose`) with the failing side's log tail and doctor output,
> and ask for a root cause plus the minimal fix. Relay the conclusion, not the transcript.

Keep it inline for anything the log's last 30 lines already answer.
