---
name: migration-consolidate
description: Replace every file in src/database/migrations with a single migration describing the current entity state. Use before a new project's first production deploy, or when the migration history has become long and only the final schema matters. Do NOT use on a project already deployed to production.
---

# Consolidate migrations

Collapses the migration history into one `init` migration generated from the entities.

## When this is safe

Only when **every** database that matters can be rebuilt or baselined:

- A new project that has never been deployed. This is the intended case.
- A shared dev database, which `--baseline` rewrites in place.

It is **not** safe once a production database exists and is beyond your reach: its
`system.migrations` table would still list the replaced files, and the consolidated migration
would try to recreate every table. Stop and say so rather than running it.

## Before running

1. Confirm the working tree is committed — the command deletes migration files.
2. Check for schema drift:

   ```bash
   docker exec -w /var/www/html $DOCKER_CONTAINER pnpm exec tsx \
     ./node_modules/typeorm/cli.js schema:log -d ./src/config/data-source.config.ts
   ```

   Anything other than *"Your schema is up to date"* means the entities and the database
   disagree. Resolve that first — the consolidated migration is generated from the
   **entities**, so drift becomes a silent difference between the migration and every
   existing database.

## Running it

```bash
docker exec -w /var/www/html $DOCKER_CONTAINER pnpm exec tsx \
  ./cli/migration-consolidate.ts --baseline
```

Note `pnpm exec`, not `pnpm run … --`: pnpm forwards `--` as a literal argument and commander
rejects it.

Flags:

- `--baseline` — rewrite the working database's migrations table to list only the new
  migration. Use it whenever that database already matches the entities; without it the next
  `migrate.ts` run tries to create every table again.
- `--yes` — skip the confirmation prompt.
- `--name <name>` — migration name, default `init`.
- `--no-keep-backup` — delete the copy of the replaced migrations. The default keeps them in
  `.migrations-backup/<timestamp>/`, which is gitignored.

## What it does

1. Moves the existing migrations to `.migrations-backup/<timestamp>/`.
2. Generates a migration against a scratch database — empty, because `migration:generate`
   emits a *diff*, so generating against a populated database yields a partial schema.
3. Replays it on a second scratch database through `src/database/migrate.ts`, then asserts
   `schema:log` reports no drift.
4. Drops both scratch databases; optionally baselines the working one.

On any failure it restores the original migrations and drops the scratch databases.

## Afterwards

- Run `pnpm run typecheck` and `pnpm run biome`; the generated file uses TypeORM's 4-space
  formatting until Biome rewrites it.
- Read the generated migration before committing. `migration:generate` has dropped columns
  unexpectedly before — this is the same warning that applies to any generated migration.
- Every other database built from the old history must be rebuilt or baselined the same way.
