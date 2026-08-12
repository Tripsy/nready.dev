#!/usr/bin/env bash
#
# dev-stack — start/stop/inspect the nready dev stack (API + UI) from the host.
#
# Both containers idle on a tty (their dockerfile CMD is commented out), so "running
# container" and "running dev server" are two separate states. Every command here treats
# them separately: `up` brings the container in, `start` puts a dev server inside it.
#
# Dev servers are launched detached with `docker exec -d` and log to <project>/logs/dev.log,
# which is on the bind mount and therefore readable from the host without docker exec.
#
# Usage: dev-stack.sh <command> [api|ui|all] [options]
set -uo pipefail

API_DIR="/Users/Shared/Projects/nready-api"
UI_DIR="/Users/Shared/Projects/nready-ui"

API_CONTAINER="nready-api.test"
UI_CONTAINER="nready-ui.test"

API_HEALTH="http://localhost:3000/health"
UI_HEALTH="http://localhost/"

API_PORT=3000
UI_PORT=80

# ERE matched against the container's full process list (`pgrep -f`) to decide whether a dev
# server is up. `pnpm run dev` is part of every pattern because it is the first process to
# appear — matching only the child would read the seconds before it spawns as a crash.
API_PROC="nodemon|pnpm run dev"
UI_PROC="next|pnpm run dev"

NETWORK="development"
DEPENDENCIES=("postgres" "redis")

RED=$'\033[31m'; GREEN=$'\033[32m'; YELLOW=$'\033[33m'; DIM=$'\033[2m'; BOLD=$'\033[1m'; OFF=$'\033[0m'

log()  { printf '%s\n' "$*"; }
ok()   { printf '%s✓%s %s\n' "$GREEN" "$OFF" "$*"; }
warn() { printf '%s!%s %s\n' "$YELLOW" "$OFF" "$*"; }
err()  { printf '%s✗%s %s\n' "$RED" "$OFF" "$*" >&2; }
head_() { printf '\n%s%s%s\n' "$BOLD" "$*" "$OFF"; }

# ---------------------------------------------------------------------------
# target resolution
# ---------------------------------------------------------------------------

# Each target's settings are read through these accessors rather than an associative array,
# so the script keeps working on the bash 3.2 that ships with macOS.
dir_of()       { [ "$1" = api ] && echo "$API_DIR"       || echo "$UI_DIR"; }
container_of() { [ "$1" = api ] && echo "$API_CONTAINER" || echo "$UI_CONTAINER"; }
health_of()    { [ "$1" = api ] && echo "$API_HEALTH"    || echo "$UI_HEALTH"; }
port_of()      { [ "$1" = api ] && echo "$API_PORT"      || echo "$UI_PORT"; }
proc_of()      { [ "$1" = api ] && echo "$API_PROC"      || echo "$UI_PROC"; }
log_of()       { echo "$(dir_of "$1")/logs/dev.log"; }

targets() {
    case "${1:-all}" in
        api) echo api ;;
        ui)  echo ui ;;
        all|"") echo api ui ;;
        *) err "unknown target '$1' (expected: api, ui, all)"; exit 2 ;;
    esac
}

# ---------------------------------------------------------------------------
# state probes
# ---------------------------------------------------------------------------

container_state() { docker inspect -f '{{.State.Status}}' "$1" 2>/dev/null || echo absent; }
container_running() { [ "$(container_state "$1")" = running ]; }

dev_running() {
    local target=$1
    container_running "$(container_of "$target")" || return 1
    docker exec "$(container_of "$target")" pgrep -f "$(proc_of "$target")" >/dev/null 2>&1
}

# "Responding at all" is the signal, not "returned 200" — the UI root answers with a redirect
# to the login page, which is a perfectly healthy dev server. Only a 5xx or no answer counts
# as down.
http_ok() {
    local code
    code="$(curl -so /dev/null --max-time 3 -w '%{http_code}' "$1" 2>/dev/null)"
    [ -n "$code" ] && [ "$code" != 000 ] && [ "$code" -lt 500 ]
}

preflight() {
    docker info >/dev/null 2>&1 || { err "Docker is not running — start Docker Desktop first."; exit 1; }

    # The compose files declare `development` as external; without it `compose up` fails
    # with a network-not-found error that reads like a config bug.
    docker network inspect "$NETWORK" >/dev/null 2>&1 || {
        warn "network '$NETWORK' missing — creating it"
        docker network create "$NETWORK" >/dev/null
    }

    local dep
    for dep in "${DEPENDENCIES[@]}"; do
        container_running "$dep" || warn "'$dep' is not running — the API will fail to boot without it"
    done
}

# ---------------------------------------------------------------------------
# commands
# ---------------------------------------------------------------------------

# A container restarted (rather than recreated) can come back with its host port mapping
# missing: `docker port` prints nothing and `docker ps` shows a bare `80/tcp` instead of
# `0.0.0.0:80->80/tcp`. The dev server inside is perfectly healthy, so this reads as "the UI
# is broken" when nothing in the app is wrong. Only a recreate re-establishes the binding.
port_published() {
    docker port "$(container_of "$1")" "$(port_of "$1")" 2>/dev/null | grep -q .
}

cmd_up() {
    local target
    for target in $(targets "${1:-all}"); do
        if ! container_running "$(container_of "$target")"; then
            log "${DIM}starting $target container…${OFF}"
            (cd "$(dir_of "$target")" && docker compose up -d) >/dev/null 2>&1 \
                || { err "$target container failed to start — see: docker compose -f $(dir_of "$target")/docker-compose.yml up"; return 1; }
        fi

        if ! port_published "$target"; then
            warn "$target host port $(port_of "$target") is not published — recreating the container"
            (cd "$(dir_of "$target")" && docker compose up -d --force-recreate) >/dev/null 2>&1
            port_published "$target" \
                || { err "$target port $(port_of "$target") still unpublished — check for a host process holding it: lsof -nP -iTCP:$(port_of "$target") -sTCP:LISTEN"; return 1; }
        fi

        ok "$target container up (port $(port_of "$target") published)"
    done
}

cmd_start() {
    preflight
    cmd_up "${1:-all}" || return 1

    local target
    for target in $(targets "${1:-all}"); do
        if dev_running "$target"; then
            ok "$target dev server already running"
            continue
        fi

        local logfile
        logfile="$(log_of "$target")"
        mkdir -p "$(dirname "$logfile")"
        : > "$logfile"

        # setsid detaches the dev server from the exec session, so it survives this script
        # exiting and can be found again by pgrep on the next invocation.
        docker exec -d "$(container_of "$target")" \
            /bin/bash -c "cd /var/www/html && exec setsid pnpm run dev >> logs/dev.log 2>&1"

        log "${DIM}$target dev server launching…${OFF}"
    done

    wait_ready "${1:-all}"
}

# Polls the health endpoint rather than the process list — a live process that never binds
# a port (a compile error, a port clash) is the exact failure this is meant to catch.
wait_ready() {
    local timeout=${DEV_STACK_TIMEOUT:-90}
    local target rc=0

    # `docker exec -d` returns before the process is in the container's process table;
    # probing immediately would read a not-yet-started server as a dead one.
    sleep 3

    for target in $(targets "${1:-all}"); do
        local waited=0 outcome=timeout misses=0
        while [ "$waited" -lt "$timeout" ]; do
            if http_ok "$(health_of "$target")"; then
                outcome=ready
                break
            fi

            # Process gone and nothing on the port: it died on startup rather than being slow.
            # Two consecutive misses are required — the process list is briefly empty while
            # the runner hands off to the dev server, and one sample there is not a crash.
            if dev_running "$target"; then
                misses=0
            else
                misses=$((misses + 1))
                if [ "$misses" -ge 2 ]; then
                    outcome=died
                    break
                fi
            fi

            sleep 2
            waited=$((waited + 2))
        done

        case "$outcome" in
            ready) ok "$target ready ($(health_of "$target"))" ;;
            died)
                err "$target dev server exited during startup"
                tail -n 30 "$(log_of "$target")" 2>/dev/null | sed 's/^/    /'
                rc=1
                ;;
            timeout)
                err "$target did not become ready within ${timeout}s"
                tail -n 30 "$(log_of "$target")" 2>/dev/null | sed 's/^/    /'
                rc=1
                ;;
        esac
    done

    return $rc
}

# Kills the dev server but leaves the container up, so a restart skips container boot.
cmd_stop() {
    local target
    for target in $(targets "${1:-all}"); do
        if ! container_running "$(container_of "$target")"; then
            ok "$target container not running"
            continue
        fi
        if dev_running "$target"; then
            docker exec "$(container_of "$target")" pkill -f "$(proc_of "$target")" >/dev/null 2>&1
            sleep 1
            dev_running "$target" \
                && { docker exec "$(container_of "$target")" pkill -9 -f "$(proc_of "$target")" >/dev/null 2>&1; sleep 1; }
            ok "$target dev server stopped"
        else
            ok "$target dev server not running"
        fi
    done
}

cmd_down() {
    cmd_stop "${1:-all}"
    local target
    for target in $(targets "${1:-all}"); do
        (cd "$(dir_of "$target")" && docker compose stop) >/dev/null 2>&1 \
            && ok "$target container stopped"
    done
}

cmd_restart() {
    cmd_stop "${1:-all}"
    cmd_start "${1:-all}"
}

# Drops .next, Turbopack's on-disk dev cache, which grows across a long session (1.1 GB in a
# day's work). Worth doing when the cache goes stale or the disk matters — but it is *not* the
# cure for the container's memory pressure: that lives in the Turbopack heap, which returns to
# its resting size as soon as the dev server restarts. The first page load afterwards is slow
# because everything recompiles.
#
# UI-only on purpose: the API has no build cache and no `clean` script.
cmd_clean() {
    if [ "${1:-ui}" != ui ] && [ "${1:-ui}" != all ]; then
        warn "nothing to clean for '$1' — only the UI carries a build cache"
        return 0
    fi

    if ! container_running "$UI_CONTAINER"; then
        err "ui container is not running — start it first"
        return 1
    fi

    # .next is held open by the running dev server, so it has to go down first.
    local was_running=0
    dev_running ui && was_running=1
    [ "$was_running" = 1 ] && cmd_stop ui

    local before
    before="$(du -sh "$UI_DIR/.next" 2>/dev/null | cut -f1)"

    docker exec "$UI_CONTAINER" /bin/bash -c "cd /var/www/html && pnpm run clean" >/dev/null 2>&1 \
        && ok "ui build cache cleared${before:+ (was $before)}" \
        || { err "ui clean failed — try: docker exec $UI_CONTAINER bash -c 'cd /var/www/html && pnpm run clean'"; return 1; }

    [ "$was_running" = 1 ] && cmd_start ui
    return 0
}

cmd_status() {
    local target
    for target in $(targets "${1:-all}"); do
        local container state
        container="$(container_of "$target")"
        state="$(container_state "$container")"

        head_ "$target ($container)"

        if [ "$state" != running ]; then
            printf '  container   %s%s%s\n' "$RED" "$state" "$OFF"
            [ "$state" = exited ] && printf '  last exit   %s\n' \
                "$(docker inspect -f 'code={{.State.ExitCode}} oom={{.State.OOMKilled}}' "$container" 2>/dev/null)"
            continue
        fi

        printf '  container   %srunning%s (%s)\n' "$GREEN" "$OFF" \
            "$(docker stats --no-stream --format '{{.MemUsage}} / cpu {{.CPUPerc}}' "$container" 2>/dev/null)"

        # Warn before the OOM killer does — past ~75% of the mem_limit a spike lands as exit 137.
        #
        # For the UI a high reading is close to its resting state, not a leak: the Turbopack
        # arena (`turbopackMemoryLimit` in next.config.ts) sits under the container's
        # `mem_limit`, so the dev server is licensed to hold most of the container. `clean`
        # reclaims disk, not this — measured at 87% before a clean and 85% after it, idle.
        # The lever is that pair of limits, not the cache.
        local mem_pct
        mem_pct="$(docker stats --no-stream --format '{{.MemPerc}}' "$container" 2>/dev/null | tr -d ' %')"
        if [ -n "$mem_pct" ] && [ "${mem_pct%%.*}" -ge 75 ] 2>/dev/null; then
            if [ "$target" = ui ]; then
                warn "memory at ${mem_pct}% of the limit — near the UI's resting level; compare turbopackMemoryLimit (next.config.ts) against mem_limit (docker-compose.yml) before treating it as a leak"
            else
                warn "memory at ${mem_pct}% of the limit — an OOM kill (exit 137) is close"
            fi
        fi

        if dev_running "$target"; then
            printf '  dev server  %srunning%s\n' "$GREEN" "$OFF"
        else
            printf '  dev server  %sstopped%s\n' "$RED" "$OFF"
        fi

        if http_ok "$(health_of "$target")"; then
            printf '  http        %sok%s  %s\n' "$GREEN" "$OFF" "$(health_of "$target")"
        else
            printf '  http        %sunreachable%s  %s\n' "$RED" "$OFF" "$(health_of "$target")"
        fi

        printf '  log         %s\n' "$(log_of "$target")"
    done
    printf '\n'
}

cmd_logs() {
    local target=${1:-all} lines=${2:-60}
    local t
    for t in $(targets "$target"); do
        head_ "$t — last $lines lines of $(log_of "$t")"
        tail -n "$lines" "$(log_of "$t")" 2>/dev/null || warn "no log yet"
    done
}

# Everything a diagnosis needs in one shot: exit codes, OOM flags, memory headroom against
# the compose mem_limit, port conflicts and the error lines from the log.
cmd_doctor() {
    head_ "environment"
    docker info >/dev/null 2>&1 && ok "docker running" || err "docker not running"
    docker network inspect "$NETWORK" >/dev/null 2>&1 && ok "network '$NETWORK' present" || err "network '$NETWORK' missing"
    local dep
    for dep in "${DEPENDENCIES[@]}"; do
        container_running "$dep" && ok "$dep running" || err "$dep not running"
    done

    local target
    for target in $(targets "${1:-all}"); do
        local container
        container="$(container_of "$target")"

        head_ "$target ($container)"
        printf '  state       %s\n' "$(docker inspect -f 'status={{.State.Status}} exit={{.State.ExitCode}} oom={{.State.OOMKilled}} restarts={{.RestartCount}}' "$container" 2>/dev/null || echo absent)"

        if container_running "$container"; then
            printf '  memory      %s\n' "$(docker stats --no-stream --format '{{.MemUsage}} ({{.MemPerc}})' "$container" 2>/dev/null)"
            printf '  top processes by RSS:\n'
            docker exec "$container" sh -c "ps -eo pid,rss,args --sort=-rss | head -5 | cut -c1-100" 2>/dev/null | sed 's/^/    /'
        fi

        # 137 is SIGKILL — nearly always the cgroup OOM killer hitting the 4g mem_limit.
        local exitcode oom
        exitcode="$(docker inspect -f '{{.State.ExitCode}}' "$container" 2>/dev/null)"
        oom="$(docker inspect -f '{{.State.OOMKilled}}' "$container" 2>/dev/null)"
        if [ "$oom" = true ] || [ "$exitcode" = 137 ]; then
            warn "exit 137 / OOMKilled — the container hit its 4g mem_limit in docker-compose.yml"
        fi

        local logfile
        logfile="$(log_of "$target")"
        if [ -f "$logfile" ]; then
            printf '  log size    %s\n' "$(du -h "$logfile" | cut -f1)"
            head_ "  $target — recent errors"
            # The leading class keeps `cron-error-count` and friends out — a job *name*
            # containing "error" is not an error line.
            grep -inE '(^|[^-a-z])(error|fatal|killed)|EADDRINUSE|ECONNREFUSED|heap out of memory' "$logfile" \
                | tail -n 15 | sed 's/^/    /' || log "    none"
        else
            warn "no log at $logfile"
        fi
    done
    printf '\n'
}

usage() {
    cat <<'EOF'
dev-stack.sh <command> [api|ui|all]

  start      bring containers up and launch pnpm run dev in each, wait until healthy
  stop       kill the dev servers, leave the containers up
  down       kill the dev servers and stop the containers
  restart    stop + start (containers stay up, so it is fast)
  status     container state, dev process, memory, HTTP health
  logs       tail <project>/logs/dev.log        (logs [target] [lines])
  clean      UI only: drop .next (the Turbopack cache that grows into the mem_limit),
             restarting the dev server if it was running
  doctor     full diagnostics: exit codes, OOM flags, memory, port/log errors
  up         containers only, no dev server

Target defaults to `all`. DEV_STACK_TIMEOUT (default 90) caps the readiness wait.
EOF
}

case "${1:-}" in
    start)   cmd_start "${2:-all}" ;;
    stop)    cmd_stop "${2:-all}" ;;
    down)    cmd_down "${2:-all}" ;;
    restart) cmd_restart "${2:-all}" ;;
    status)  cmd_status "${2:-all}" ;;
    logs)    cmd_logs "${2:-all}" "${3:-60}" ;;
    clean)   cmd_clean "${2:-ui}" ;;
    doctor)  cmd_doctor "${2:-all}" ;;
    up)      preflight; cmd_up "${2:-all}" ;;
    ""|-h|--help|help) usage ;;
    *) err "unknown command '$1'"; usage; exit 2 ;;
esac
