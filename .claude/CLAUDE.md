# NReady

## Overview

NReady is a Node.js / Express 5 / TypeScript boilerplate for building complex, secure REST APIs.
It is fully modular and feature-based, with an emphasis on SOLID/DRY/KISS, strong validation,
policy-based authorization and layered logging. PostgreSQL is the primary database (MariaDB also
tested), via TypeORM.

It is the **base project**: other backends (e.g. `../star-api`) are started from it, so core and
shared code here is expected to be ported outward. Changes to `src/shared/**`, `src/config/**`,
`src/middleware/**`, `src/providers/**`, `src/helpers/**` or a core feature should be flagged as
"needs porting" when relevant.

## Tech Stack

- Runtime: Node.js v24 (Active LTS)
- Framework: Express.js v5.2.1
- Database: PostgreSQL (TypeORM), Redis (cache + BullMQ)
- Language: TypeScript v6.0.3
- Security: Helmet, CORS, rate limiting, Zod validation, JWT tokens, bcrypt hashing
- Logging: Pino
- Containerization: Docker
- Testing: Jest, Supertest

Versions above are current as of 2026-08. If a suggestion depends on version-specific behavior,
check `pnpm-lock.yaml` for the resolved version before assuming it applies.

## Role

You are a concise assistant for a pragmatic senior full-stack developer.
- Use bullet points
- Skip pleasantries
- Provide direct answers
- Write production-ready code with clear intent and low complexity.
- Whenever we interact if it helps for the work-flow & token usage suggest changes for CLAUDE.md

## Detailed Protocols (`.claude/rules/`)

These files carry the real conventions for their area. All are **path-scoped** via their `paths:`
frontmatter — they load only once a matching file is opened, so during planning they are not in
context yet. Read the relevant one *before* proposing an approach in that area, not after:

| File | Covers | Loads for |
|---|---|---|
| `api.md` | Express app setup, route registration, controller structure, response envelope | `*.routes.ts`, `*.controller.ts`, `app.ts`, output/param middleware |
| `auth.md` | Token model, `res.locals.auth`, policy layer, passwords, rate limiting, social login | `account`/`user-permission` features, `*.policy.ts`, auth middleware |
| `database.md` | Entities, repository/query layer, transactions, migrations, seeds | `*.entity.ts`, `*.repository.ts`, `*.service.ts`, `*.subscriber.ts`, migrations |
| `error-handling.md` | Throwing, catching, logging, formatting errors across the request lifecycle | `src/exceptions/**`, error/not-found middleware, `async.handler.ts` |
| `validation.md` | Validator structure, messages, partial-update pattern, controller integration | `*.validator.ts`, feature/shared `locales/*.json` |
| `testing.md` | Test layout, reusable builders, mocking conventions | `src/tests/**`, `features/**/tests/*.test.ts`, `*.mock.ts` |
| `typescript.md` | TS conventions, linting rules, code organization | every `.ts` |

## Rules & Conventions

- Do not blindly accept the user's proposed solution — verify it is correct and complete before
  implementing. If the approach has gaps, edge cases, or a better alternative exists, flag it.
- When the user describes a fix or approach, cross-check it against the actual codebase before
  writing code.
- Path alias `@/*` maps to `src/*` (see `tsconfig.json`). Use it consistently in imports.
- Import helpers by file — `@/helpers/date.helper`, not `@/helpers`. There is no helpers barrel and
  none is planned; the one that existed was removed so the module graph stays explicit.
- Biome enforces **tab indent (width 4)**, **single quotes** in JS/TS, and organized imports.
  `strict` TypeScript with `experimentalDecorators`/`emitDecoratorMetadata` (TypeORM). ES modules
  (`"type": "module"`).

## Coding Standards

- **Readability** over cleverness - code is read 10x more than written
- **Maintainability** - future developers (including yourself) should understand intent immediately
- **Error handling** - always consider edge cases and failure modes
- Prefer async/await over .then() chains
- Explicit error handling - no empty catch blocks
- Follow existing code conventions used in the project. When creating or editing a file, check
  sibling files for the correct structure, approach, and naming.
- The code should follow **best practices** and **design principles** like SOLID, KISS, DRY, and
  strong security standards.

## Decision Documentation

- Explain your reasoning for non-obvious decisions in comments
- **Write comments about the code as it is, never as a diff against what it was.** No "this
  used to run unconditionally", no "the previous order broke X". State the constraint that
  still applies ("split before the lowercase, which destroys the case boundary the split
  reads") and leave the before/after for the commit message
- If there are two valid approaches, document why you chose one over the other
- Note any performance implications or trade-offs

## Development Environment

Development runs **inside a Docker container** (`nready`, `$DOCKER_CONTAINER`), where the project is
mounted at `/var/www/html`. Several scripts and CLI entry points hardcode that path — run migration,
seed and CLI commands from inside the container. Package manager is **pnpm** (single-package
workspace defined in `pnpm-workspace.yaml`).

```bash
docker compose up                     # start container (requires external `development` network)
docker exec -it $DOCKER_CONTAINER /bin/bash
```

## Commands

Run inside the container (`docker exec $DOCKER_CONTAINER ...`):

```bash
pnpm run dev                # nodemon -> tsx ./src/server.ts
pnpm run build              # production build -> dist/src (tsc + tsc-alias + asset copy)
pnpm run start              # run the build from dist/ (APP_ENV=production)
pnpm run typecheck          # tsc --noEmit
pnpm run biome              # biome check --write (lint + format + imports + import cycles)
pnpm run messages:check     # fail on any lang() key with no locale entry
pnpm run test               # Jest + Supertest (see rules/testing.md §2.1 — bail:3 truncates)

pnpm run migration:generate ./src/database/migrations/<name>
pnpm run migration:run
pnpm run migration:revert

# Seeds — reference data and the bootstrap admin run on their own
tsx src/features/template/database/template.seed.ts
tsx src/features/permission/database/permission.seed.ts
tsx src/features/account/database/admin.seed.ts   # needs ADMIN_EMAIL / ADMIN_PASSWORD

pnpm run seed               # demo data, every entity in foreign-key order
pnpm run seed brand         # one entity

tsx cli/feature.ts <feature> install|remove|upgrade   # feature installer
tsx cli/cron.ts list -s
tsx cli/cron.ts run <cron-name>
```

> ⚠ Always inspect generated migrations before running — columns are sometimes dropped.

`start` runs from inside `dist/` on purpose. `SRC_PATH` in `system.helper.ts` is `<cwd>/src`, and
both the TypeORM entity glob and the runtime asset reads (Nunjucks templates, per-feature
`locales/en.json`) resolve through it — so the process has to see `dist/src` as its `src`. It reads
configuration from real environment variables; there is no `.env` in the build output, by design.

**A green test run can be a lie** — read the test *count*, not just the colour. `bail: 3` truncates
the run, and a SIGKILLed jest worker silently drops a whole file. `maxWorkers` is pinned to 2 in
`jest.config.js` against the container's 4g `mem_limit`; do not raise it. Full detail and the
trustworthy-run command are in `.claude/rules/testing.md` §2.1.

## Architecture

### Startup flow

`server.ts` → `bootstrap()` → `createApp()` → `listen` → WebSockets → signal handlers.

- **`src/bootstrap.ts`** initializes infrastructure in order: messages, database, event listeners,
  queues, email worker, cron jobs. In the `test` environment, database/listeners/queues/cron are
  skipped.
- **`src/app.ts`** builds the Express app: Helmet (locked-down API CSP), CORS, compression,
  cookie/JSON parsing, request-ID, timeout, then the middleware chain, dynamically-loaded routes,
  `/health` + `/ready`, and finally `notFoundHandler` + `errorHandler` (must remain last).
- **`server.ts`** owns graceful shutdown — `closeHandler()` closes Redis, queues, DB, log streams
  and WebSockets.

### Middleware chain (order matters, see `app.ts`)

`outputHandler` (sets `res.locals.output`) → `languageMiddleware` (`res.locals.language`) →
`authMiddleware` (`res.locals.auth`) → `requestContextMiddleware`. `authMiddleware` is skipped in
the `test` environment. `res.locals.language` selects *content* language (brand/address/place/
template entries, email rendering) — response messages are English-only. Route-level param
validators live in `src/middleware/validate-params.middleware.ts` (`validateParamsWhenId`,
`validateParamsWhenEnum`).

### Feature-based modules (`src/features/<name>/`)

Each feature is a self-contained vertical slice exporting a **singleton instance** of each layer,
wired via constructor injection at the bottom of the file:

- `*.entity.ts` — TypeORM entity; often exports a `NAME` const, a status enum, `STATUS_TRANSITIONS`.
- `*.repository.ts` — a `<Feature>Query` class extending `RepositoryAbstract`, plus a
  `get<Feature>Repository()` factory exposing `createQuery()`.
- `*.service.ts` — business logic; depends on the repository (and other services).
- `*.validator.ts` — Zod schemas (`create`, `read`, `update`, `find`, …).
- `*.policy.ts` — extends `PolicyAbstract`; role/permission authorization.
- `*.controller.ts` — extends `BaseController`; each action wrapped in `asyncHandler`.
- `*.routes.ts` — default-exports a `FeatureRoutesModule` (`basePath`, `controller`, `routes` map).

Optional per-feature `locales/`, `cron-jobs/`, `database/`, `*.subscriber.ts`, `*.listener.ts`,
`*.mock.ts`, `tests/`, `manifest.json`.

**A new feature owning a table gets a demo seed** — `database/<feature>.seed.ts`, registered in
`src/database/seed/index.ts` after its parents. Treat it as part of the feature, not a follow-up:
this is a boilerplate other projects are started from, so a feature nobody can populate is a
feature nobody can evaluate. Conventions (top-up, seeded PRNG, natural keys) are in
`.claude/rules/database.md` §5.4. Features that hold no table of their own — or reference data with
a fixed canonical list, like `permission` and `template` — are the exception.

Features are categorized as core and additional; further projects are started from this one and more
additional features are expected over time.

- **core:** account, cron-history, log-data, log-history, mail-queue, permission, template, user,
  user-permission
- **additional:** address, article, brand, carrier, cash-flow, category, client, discount, image,
  invoice, order, order-shipping, place, product, subscription, term, vendor

### Convention-based auto-discovery

The framework scans the filesystem at startup instead of using a central registry. Follow the naming
suffix and a file is picked up automatically:

- **Routes** — `src/config/routes.setup.ts` recursively finds `*.routes.{ts|js}` under
  `src/features/`, imports each default export (object or async factory), and mounts it. Rate
  limiting is auto-applied unless a handler named `*RateLimiter` is already present.
- **Cron jobs** — `src/providers/cron.provider.ts` finds `*.cron.{ts|js}` in
  `src/shared/cron-jobs/` and each feature's `cron-jobs/`. A cron file must export `default` (the
  job fn), `SCHEDULE_EXPRESSION` and `EXPECTED_RUN_TIME`. Runs are recorded to `cron_history`.
- **Event listeners** — `src/config/listeners.setup.ts` finds `*.listener.{ts|js}` and calls each
  default export to register handlers on the shared emitter (`src/config/event.config.ts`).

The dev/prod file extension is resolved by `Configuration.resolveExtension()` (`ts` in dev, `js` in
production), so discovery works against built output too.

### Feature installer (`cli/feature.ts`)

Features can be packaged in `packages/` and installed into `src/features/` via
`tsx cli/feature.ts <feature> install|remove|upgrade`. Each package carries a `manifest.json`
(`name`, `version`, `relativePath`, `entities`, `depends_on`, `depends_off`). The CLI enforces
dependency ordering, blocks removal of `core` features, backs up on upgrade, supports rollback, and
**prompts you to run migrations manually** for entity-bearing features. Hardcodes
`basePath = /var/www/html`.

### Configuration

`src/config/settings.config.ts` centralizes all settings behind `Configuration.get('dot.path')`,
sourced from env vars with defaults, built once and cached. The key is **type-checked** against the
shape of `loadSettings()` and the return type is inferred — don't add `as string` / `as number` at
call sites and don't pass an explicit generic; a cast re-hides the errors the typing exists to catch.
Helpers: `Configuration.isEnvironment(env)`, `.environment()`, `.language()`, `.currency()`,
`.resolveExtension()`. Prefer this over reading `process.env` directly.

### Response envelope, errors, and messages

Controllers never `res.json(data)` raw — they populate `res.locals.output`, then
`res.json(res.locals.output)`. Errors are thrown as typed classes from `src/exceptions/` and
normalized by `error-handler.middleware.ts`. User-facing strings come from `lang('feature.key')`;
`lang()` reads `en.json` and nothing else. `errorHandler` masks every `>= 500` message unless
`app.debug` is on — model actionable failures as 4xx. Full detail in `rules/api.md`,
`rules/error-handling.md` and `rules/validation.md`.

Response shape (omit `request`/`meta` unless debugging):

```typescript
type OutputData = Record<string, unknown>;
type ZodIssue = z.core.$ZodIssue;

interface OutputWrapperInterface {
  success: boolean;
  message: string;
  errors: Array<ZodIssue | OutputData>;
  data: OutputData;
  meta: OutputData;
  request: {
    url: string;
    headers: OutputData;
    method: string;
    query?: OutputData;
    body?: OutputData;
    params?: OutputData;
  };
}
```

Dates are ISO 8601 strings (not timestamps). Protected routes require `Authorization: Bearer
{accessToken}`.

### Cross-cutting infrastructure

- **`src/providers/`** — `database` (TypeORM data source), `cache` (Redis-backed;
  `cacheProvider.buildKey(...)` + `get(key, loader)`), `logger` (Pino; `providers/logger/` holds one
  `LogDestination` per sink — console, file, database, email, CloudWatch — selected per level by
  `log-destinations.factory.ts`, with dedicated system/cron loggers), `email` (SMTP or SES, chosen by
  `mail.provider`), `cron`.
- **`src/queues/` + `src/workers/`** — BullMQ; email is enqueued (`email.queue.ts`) and processed by
  `src/workers/email.worker.ts`.
- **`src/config/request.context.ts`** — AsyncLocalStorage request context (`auth_id`,
  `performed_by`, `source`, `request_id`, `language`), also populated for cron runs and used by
  subscribers/logging.
- **`src/shared/`** — `abstracts/` (base controller, repository, entity, service helpers, policy,
  subscriber, validator), shared `cron-jobs/`, `listeners/`, `decorators/`, `locales/`, `types/`
  (including `express.d.ts` augmenting `res.locals`).

### Repository query builder

`RepositoryAbstract` wraps TypeORM's `SelectQueryBuilder` with a fluent, safe API: `select`,
`filterBy(column, value, operator)`, `filterById`, `filterByStatus`, `filterByRange`, `filterAny`,
`filterRaw`, `join`/`joinAndSelect`, `orderBy`, `groupBy`, `pagination`, `withDeleted`, and
terminals `first`/`firstOrFail`/`all`/`count`/`delete`/`restore`. `delete`/`restore` refuse to run
without an `_id`/`id` filter unless `force: true` (guard against mass mutation); soft-delete is the
default.

## Notes

- **Never `void` a promise.** `server.ts` turns an `unhandledRejection` into a full shutdown, so a
  failed background side effect takes the API down. Use `runInBackground(promise, context)` from
  `helpers/background.helper.ts`. The same trap hides in `async` event listeners — a synchronous
  throw inside one becomes an unawaited rejection.
- **Don't null-check a `firstOrFail()`-backed finder.** `userService.findById` returns
  `Promise<UserEntity>`; an `if (!user)` after it is unreachable and the 404 already comes from the
  repository. Use a `.first()`-backed finder when null is a real outcome.
- **Validate from the right source.** `req.query` alone is correct only for `find` (path `''`). Any
  action whose route declares `:params` must merge them — `{ ...req.query, id: req.params.id }` — or
  the schema gets `undefined` and the endpoint rejects every request with `invalid_id`. This has
  shipped twice.
- Soft deletes are pervasive (`deleted_at`); policies gate visibility of deleted records via
  `allowDeleted`.
- Status changes go through `assertValidStatusTransition(STATUS_TRANSITIONS, current, next)` —
  define allowed transitions on the entity.
- Auth is JWT-based; passwords hashed with bcrypt; sessions limited via `user.maxActiveSessions`.

## Database & Cache Access

Postgres and Redis MCP servers (`.claude/mcp/`, registered in `.mcp.json`) point at the local dev
stack.

- Inspect data, schema and cache through the MCP tools (`pg_query`, `pg_describe_table`,
  `redis_get_key`, `redis_scan`) — not `docker exec ... psql` / `redis-cli`.
- `pg_query` is read-only at the transaction level. Writes go through `pg_execute`; destructive ops
  (`DROP`/`TRUNCATE`/`ALTER`, unqualified `UPDATE`/`DELETE`) require `allowDestructive: true` **and**
  explicit user confirmation — show a `SELECT` of the affected rows first.
- Never echo password hashes, tokens or connection strings into the conversation.
- Full tool list and safety model: `.claude/mcp/README.md`.

## Context — sibling projects

`../star-api` (available via `permissions.additionalDirectories`) is a fleet/drivers management API
started from this boilerplate. It has diverged in its feature set (cmr, work-session, vehicle,
driver-session, stats) but shares `src/shared/**`, `src/config/**`, `src/middleware/**`,
`src/providers/**`, `src/helpers/**` and the core features. When core or shared code changes here,
say so and offer to port it; when reviewing a fix that originated there, check it applies before
copying it over.

`../nready-ui` is this project's frontend. **It does not exist yet** — it will be a Next.js app
modelled on `../star-ui`, which pairs with `star-api` the same way. Until it lands, treat every
mention of it as forward-looking: don't try to read it, and don't assume a call site there.

The two connect purely over HTTP, so the API contract is the whole coupling:

- When `src/features/**/*.controller.ts` or `src/features/**/*.routes.ts` changes, state which
  `nready-ui` service (`src/services/*.service.ts`) needs the matching update. Once the repo exists,
  make the change there too.
- Response shape is the envelope above; dates are ISO 8601 strings; protected routes need
  `Authorization: Bearer {accessToken}`.
- Frontend conventions live in that repo's own `.claude/rules/` (`forms.md`, `data-fetching.md`,
  `state.md`, `typescript.md`) — consult those rather than inferring frontend rules from this
  project. `star-ui` carries the same set today and is the closest reference.

## Project Structure

```
├── cli/                   # feature installer, cron runner, build/message tooling
├── docker/
├── src/
│   ├── config/            # Configuration files
│   ├── database/
│   │   ├── migrations/    # TypeORM migrations
│   │   └── migrate.ts
│   ├── exceptions/        # Custom error classes
│   ├── features/          # Feature-based modules
│   │   ├── user/
│   │   │   ├── cron-jobs/        # Optional — see account/, log-data/
│   │   │   ├── database/
│   │   │   │   └── user.seed.ts
│   │   │   ├── locales/
│   │   │   │   └── en.json
│   │   │   ├── tests/
│   │   │   │   ├── user-controller.test.ts
│   │   │   │   ├── user-service.test.ts
│   │   │   │   └── user-validator.test.ts
│   │   │   ├── manifest.json
│   │   │   ├── user.controller.ts
│   │   │   ├── user.entity.ts
│   │   │   ├── user.mock.ts
│   │   │   ├── user.policy.ts
│   │   │   ├── user.repository.ts
│   │   │   ├── user.routes.ts
│   │   │   ├── user.service.ts
│   │   │   ├── user.subscriber.ts
│   │   │   └── user.validator.ts
│   │   └── ...            # Other features (product, order, invoice, cash-flow, etc.)
│   ├── helpers/           # Utilities (date, string, object, etc.)
│   ├── middleware/        # Custom Express middlewares
│   ├── providers/         # Infrastructure (DB, Redis, logger, email, cron)
│   │   ├── logger/        # One LogDestination per sink
│   │   └── email/         # One EmailService per transport (SMTP/SES) + factory
│   ├── queues/            # BullMQ queues
│   ├── shared/
│   │   ├── abstracts/     # Base / abstract classes
│   │   ├── cron-jobs/     # System cron-jobs
│   │   ├── decorators/
│   │   ├── listeners/     # Core event listeners
│   │   ├── locales/       # Shared language
│   │   └── types/         # Shared types
│   ├── templates/         # Email layout templates
│   ├── tests/             # Jest & Supertest shared setup + mocks
│   ├── workers/           # Background workers
│   ├── app.ts
│   ├── bootstrap.ts
│   └── server.ts
├── biome.json
├── docker-compose.yml
├── jest.config.js
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json
└── tsconfig.build.json
```

## Restrictions

- Skip tests after applying changes. Run tests only on demand or before git push commands. When
  running tests, scope them to the changed files in the current diff rather than the full suite,
  unless a full run is requested.
- Do not run biome after applying changes. Run it only on demand or before git push commands.
- **Never commit onto `main`.** GitHub refuses a direct push to it, so a commit made there has to be
  moved off before it can go anywhere. If the current branch is `main` when a commit is requested,
  create the branch first (`git switch -c <type>/<short-name>`) and commit on that. The same applies
  in `../star-api`.
- When subagents are available and appropriate for the task, prefer delegating noisy operations
  (full test suites, broad searches, large log files, build output) to one so the verbose output
  stays contained there and only a summary comes back — this is a preference for keeping the main
  context clean, not an instruction to spawn agents unprompted.
