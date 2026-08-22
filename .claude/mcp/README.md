# nready-api-mcp

Local [MCP](https://modelcontextprotocol.io) servers giving Claude Code direct access to this project's infrastructure. One shared package, one `node_modules`, multiple servers.

- **Transport:** stdio (Claude Code spawns each server)
- **Config:** reads the project-root `.env` — no separate credentials
- **Access:** read-only by default; writes are gated

## Layout

```
src/
├── shared/        # common code both servers use
│   ├── env.ts     # project-root .env loader + host resolution
│   ├── result.ts  # jsonResult / textResult / errorResult / describeError
│   └── stdio.ts   # stdio transport + graceful shutdown + entrypoint wrapper
├── postgres/      # db.ts (pool, transactions, danger gate) + index.ts (tools)
└── redis/         # client.ts (ioredis) + index.ts (tools)
```

## Servers & tools

### postgres (`pg-mcp`)
| Tool | Purpose |
| --- | --- |
| `pg_query` | Read-only SQL in a `READ ONLY` transaction. |
| `pg_execute` | Writes/DDL; `DROP/TRUNCATE/ALTER` and unqualified `UPDATE/DELETE` need `allowDestructive: true`. |
| `pg_list_tables` / `pg_describe_table` / `pg_list_schemas` | Schema introspection. |

### redis (`redis-mcp`)
| Tool | Purpose |
| --- | --- |
| `redis_get_key` | Type-aware read (string/hash/list/set/zset), TTL included. |
| `redis_scan` | Non-blocking `SCAN` by glob pattern (never `KEYS`). |
| `redis_ttl` / `redis_info` | Key TTL / server INFO. |
| `redis_set` / `redis_expire` / `redis_del` | Targeted writes. |
| `redis_flush` | `FLUSHDB` — refused unless `allowDestructive: true`. |

## Safety model

1. **Read-only is structural** on Postgres (`BEGIN TRANSACTION READ ONLY`).
2. **Destructive ops are gated** (`allowDestructive: true`) — defense-in-depth on top of Claude Code's own tool-permission prompt (`.claude/rules/database.md` §6.1).
3. **Parameterize** all user input (`$1,$2…` for SQL; explicit key names for Redis).

## Connection

Containers use `host.docker.internal`; this runs on the host, so `shared/env.ts` maps that to `127.0.0.1` (Postgres publishes `5432`, Redis `6379`). Override with `MCP_DB_HOST` / `MCP_REDIS_HOST`.

## Setup

```bash
npm --prefix .claude/mcp install     # once
npm --prefix .claude/mcp run typecheck
```

Both servers are registered in the project-root `.mcp.json`. Run `/mcp` in Claude Code (or restart) to connect.
