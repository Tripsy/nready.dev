# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

NReady is a Node.js / Express 5 / TypeScript boilerplate for building complex, secure REST APIs. It is fully modular and feature-based, with an emphasis on SOLID/DRY/KISS, strong validation, policy-based authorization, and layered logging. PostgreSQL is the primary database (MariaDB also tested), via TypeORM.

## Development Environment

Development runs **inside a Docker container** (`nready.test`), where the project is mounted at `/var/www/html`. Several scripts and CLI entry points hardcode that path — run migration, seed, and CLI commands from inside the container.

```bash
docker compose up                       # start container (requires external `development` docker network)
docker exec -it nready.test /bin/bash   # shell into container
pnpm install                            # inside container
pnpm run dev                            # nodemon -> tsx ./src/server.ts
```

Package manager is **pnpm** (single-package workspace defined in `pnpm-workspace.yaml`).

## Common Commands

```bash
pnpm run dev                # run dev server (nodemon, watches src)
pnpm run typecheck          # tsc --noEmit
pnpm run biome              # biome check --write (lint + format + organize imports)
pnpm run madge             # circular dependency check (madge --circular src)

# Tests (Jest + Supertest, ESM via ts-jest). NODE_ENV/APP_ENV forced to `test`.
pnpm run test                                          # all tests
pnpm run test account.functional.ts --testTimeout=60000 --detectOpenHandles
pnpm run test account.unit.ts --detect-open-handles
pnpm run test -- <path-or-name-substring>              # run a single test file by name

# Migrations (run inside container; data-source is src/config/data-source.config.ts)
pnpm run migration:generate ./src/database/migrations/<name>
pnpm run migration:run
pnpm run migration:revert

# Seeds
pnpx tsx src/features/template/database/template.seed.ts
pnpx tsx src/features/permission/database/permission.seed.ts

# Feature management CLI (see Feature System below)
pnpx tsx cli/feature.ts <feature> install|remove|upgrade

# Cron CLI
pnpx tsx cli/cron.ts list -s
pnpx tsx cli/cron.ts run <cron-name>
```

> ⚠ Always inspect generated migrations before running — columns are sometimes dropped.

Tests are discovered from `src/tests/**/*.test.ts` and `src/features/**/tests/*.test.ts`. Test suites within a feature are split by type: `*.unit.ts` (service/validator) and `*.functional.ts` (controller, via Supertest).

## Path Aliases

`@/*` maps to `src/*` (see `tsconfig.json`). Use it consistently in imports.

## Code Style

Biome enforces: **tab indent (width 4)**, **single quotes** in JS/TS, and organized imports. Run `pnpm run biome` before finishing. `strict` TypeScript with `experimentalDecorators`/`emitDecoratorMetadata` (TypeORM). ES modules (`"type": "module"`).

## Architecture

### Startup flow

`server.ts` → `bootstrap()` → `createApp()` → `listen` → WebSockets → signal handlers.

- **`src/bootstrap.ts`** initializes infrastructure in order: i18next, database, event listeners, queues, email worker, cron jobs. In the `test` environment, database/listeners/queues/cron are skipped.
- **`src/app.ts`** builds the Express app: Helmet (locked-down API CSP), CORS, compression, cookie/JSON parsing, request-ID, timeout, then the middleware chain, dynamically-loaded routes, `/health` + `/ready`, and finally `notFoundHandler` + `errorHandler` (must remain last).
- **`server.ts`** owns graceful shutdown — `closeHandler()` closes Redis, queues, DB, log streams, and WebSockets.

### Middleware chain (order matters, see `app.ts`)

`outputHandler` (sets `res.locals.output`) → i18next → `languageMiddleware` (`res.locals.language`) → `authMiddleware` (`res.locals.auth`) → `requestContextMiddleware`. The auth and i18next middleware are skipped in the `test` environment. Route-level param validators live in `src/middleware/validate-params.middleware.ts` (`validateParamsWhenId`, `validateParamsWhenEnum`).

### Feature-based modules (`src/features/<name>/`)

Each feature is a self-contained vertical slice. A typical feature exports a **singleton instance** of each layer, wired via constructor injection at the bottom of the file:

- `*.entity.ts` — TypeORM entity; often exports a `NAME` const, a status enum, and `STATUS_TRANSITIONS`.
- `*.repository.ts` — extends `RepositoryAbstract` (`src/shared/abstracts/repository.abstract.ts`); exposes a chainable query builder via `createQuery()`.
- `*.service.ts` — business logic; depends on the repository (and other services).
- `*.validator.ts` — Zod schemas (`create`, `read`, `update`, `find`, etc.).
- `*.policy.ts` — extends `PolicyAbstract`; role/permission authorization (`canCreate`, `canRead`, `allowDeleted`, …).
- `*.controller.ts` — extends `BaseController`; each action is wrapped in `asyncHandler`, calls `policy.canX(res.locals.auth)`, validates input with `this.validate(...)`, calls the service, and writes to `res.locals.output`.
- `*.routes.ts` — default-exports a `FeatureRoutesModule` (`basePath`, `controller`, `routes` map). Optional per-feature `locales/`, `cron-jobs/`, `*.subscriber.ts`, `*.listener.ts`, `*.seed.ts`, `*.mock.ts`, `tests/`, and `manifest.json`.

### Convention-based auto-discovery

The framework scans the filesystem at startup instead of using a central registry. When adding a file, follow the naming suffix and it is picked up automatically:

- **Routes** — `src/config/routes.setup.ts` recursively finds `*.routes.{ts|js}` under `src/features/`, imports each default export (object or async factory), and mounts it. Rate limiting is auto-applied unless a handler named `*RateLimiter` is already present.
- **Cron jobs** — `src/providers/cron.provider.ts` finds `*.cron.{ts|js}` in `src/shared/cron-jobs/` and each feature's `cron-jobs/`. A cron file must export `default` (the job fn), `SCHEDULE_EXPRESSION`, and `EXPECTED_RUN_TIME`. Runs are recorded to `cron_history`.
- **Event listeners** — `src/config/listeners.setup.ts` finds `*.listener.{ts|js}` and calls each default export to register handlers on the shared event emitter (`src/config/event.config.ts`).

The dev/prod file extension is resolved by `Configuration.resolveExtension()` (`ts` in dev, `js` in production), so discovery works against built output too.

### Feature installer (`cli/feature.ts`)

Features can be packaged in `packages/` and installed into `src/features/` via `pnpx tsx cli/feature.ts <feature> install|remove|upgrade`. Each package carries a `manifest.json` (`name`, `version`, `relativePath`, `entities`, `depends_on`, `depends_off`). The CLI enforces dependency ordering, blocks removal of `core` features, backs up on upgrade, supports rollback, and **prompts you to run migrations manually** for entity-bearing features (it does not auto-migrate). Hardcodes `basePath = /var/www/html`.

### Configuration

`src/config/settings.config.ts` centralizes all settings behind `Configuration.get('dot.path')`, sourced from env vars with defaults. Helpers: `Configuration.isEnvironment(env)`, `.environment()`, `.language()`, `.currency()`, `.resolveExtension()`. Prefer this over reading `process.env` directly.

### Response envelope, errors, and i18n

- Controllers never `res.json(data)` raw — they populate `res.locals.output` (`.data()`, `.message()`, `.meta()`, `.errors()`) set up by `output-handler.middleware.ts`, then `res.json(res.locals.output)`.
- Errors are thrown as typed classes from `src/exceptions/` (`BadRequestError`, `NotFoundError`, `UnauthorizedError`, `NotAllowedError`, `UnprocessableContentError`, `CustomError(status, msg)`, `ModuleError`) and normalized by `error-handler.middleware.ts`. Zod validation failures throw `UnprocessableContentError` with issues attached.
- User-facing strings come from i18next via `lang('feature.key', params)`; message catalogs live in `src/features/<name>/locales/` and `src/shared/locales/`.

### Cross-cutting infrastructure

- **`src/providers/`** — `database` (TypeORM data source), `cache` (Redis-backed; `cacheProvider.buildKey(...)` + `get(key, loader)`), `logger` (Pino with file/database/email transports and dedicated system/cron loggers), `email` (SMTP or SES, chosen by `mail.provider`), `cron`.
- **`src/queues/` + `src/workers/`** — BullMQ; email is enqueued (`email.queue.ts`) and processed by `src/workers/email.worker.ts`.
- **`src/config/request.context.ts`** — AsyncLocalStorage request context (`auth_id`, `performed_by`, `source`, `request_id`, `language`), also populated for cron runs and used by subscribers/logging.
- **`src/shared/`** — `abstracts/` (base controller, repository, entity, service helpers, policy, subscriber, validator), shared `cron-jobs/`, `listeners/`, `decorators/`, `locales/`, and `types/` (including `express.d.ts` augmenting `res.locals`).

### Repository query builder

`RepositoryAbstract` wraps TypeORM's `SelectQueryBuilder` with a fluent, safe API: `select`, `filterBy(column, value, operator)`, `filterById`, `filterByStatus`, `filterByRange`, `filterAny`, `filterRaw`, `join`/`joinAndSelect`, `orderBy`, `groupBy`, `pagination`, `withDeleted`, and terminals `first`/`firstOrFail`/`all`/`count`/`delete`/`restore`. `delete`/`restore` refuse to run without an `_id`/`id` filter unless `force: true` (guard against mass mutation), and soft-delete is the default.

## Notes

- Soft deletes are pervasive (`deleted_at`); policies gate visibility of deleted records via `allowDeleted`.
- Status changes go through `assertValidStatusTransition(STATUS_TRANSITIONS, current, next)` — define allowed transitions on the entity.
- Auth is JWT-based; passwords hashed with bcrypt; sessions limited via `user.maxActiveSessions`.
