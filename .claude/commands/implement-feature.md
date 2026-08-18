---
description: Build the full vertical slice for a feature whose entity already exists
argument-hint: "<feature> (kebab-case folder under src/features — e.g. review, complaint, comment)"
allowed-tools: Read, Grep, Glob, Edit, Write, Bash, Agent
---

Implement the feature **$ARGUMENTS**.

`src/features/<feature>/<feature>.entity.ts` is the contract. This command builds the layers around
an entity that already exists — it does not design one.

## 0. Precondition — stop if the entity is not there

Check `src/features/$ARGUMENTS/*.entity.ts`. If no entity file exists, **stop and say so**: this
command has nothing to build from, and inventing a table is a schema decision the user makes, not a
scaffolding step. Offer to design the entity instead and wait.

If the layer files already exist, treat this as a gap-filling pass: list what is present, build only
what is missing, and say what you skipped.

## 1. Review the entity before writing anything

Read every `*.entity.ts` in the folder, and its doc comments in full — they carry the rules the
columns cannot state (why a table is not `EntityAbstract`, which deletes are hard, what a service is
expected to maintain by hand). Those comments are the spec for the service you are about to write;
anything they promise ("`CommentService` clears them in the same transaction") is work in this pass,
not a later chore.

Extract and write down:

| From | What you need it for |
|---|---|
| `extends EntityAbstract` or not | whether `deleted_at` exists → whether there is `delete(true)` / `restore` at all |
| `STATUS_TRANSITIONS` | whether the feature needs a `statusUpdate` action and `assertValidStatusTransition` |
| `@Check(...)` constraints | the validator must reject **before** the database does — a constraint violation reaches the client as a masked 500, not a 422 |
| unique indexes | every insert that can collide needs conflict handling with a message per constraint (`RepositoryAbstract.isUniqueViolation`, see `rating.service.ts#asConflict`) |
| polymorphic target columns (`entity_type` + `entity_id`) | there is no foreign key, so cleanup and orphan handling are the service's job |
| denormalized counters (`reply_count`, `rating_avg`) | who maintains them, and in which transaction |
| nullable author columns (`user_id` + `guest_*` + `user_ip_hash`) | the feature has a public, guest-reachable side — see §4 |

### Indexes — fix them here, before any query is written

Every query you are about to write in §3 has to be served by an index. Walk the reads first, then
check the entity covers them:

- **List/find reads** — the columns a dashboard `find` filters and orders by, leading with the most
  selective. A composite in the order the query uses them, not one index per column.
- **Public reads** — the target lookup (`entity_type, entity_id, …, created_at`).
- **Moderation queues** — partial (`where: "status = 'pending'"`) when the table is dominated by
  rows that have left that state.
- **Soft-deletable tables** — `@SoftDeleteIndex(ENTITY_TABLE_NAME)`, and every other partial index
  on such a table repeats `AND deleted_at IS NULL` or it silently matches deleted rows.
- **Foreign keys** — Postgres does not index the referencing side. An unindexed FK turns every
  parent delete into a sequential scan of the child table.
- **Uniqueness that is really a business rule** — one review per user per product, one rating per
  address — belongs in a unique index, not only in a service check, which races.

Propose the missing ones with a one-line reason each, add them to the entity, and note that a
migration follows in §5. Do not add an index "just in case": each one is paid for on every write.

## 2. Pick the closest existing feature and copy its structure

Read it end to end before writing. Do not compose a feature out of remembered conventions — open the
template and follow it.

- **polymorphic target, public + dashboard split, hard delete, ip-hashed guests** → `rating`
- **status + moderation + soft delete** → `article` (and `review`'s entity for the moderation columns)
- **plain CRUD, status, soft delete** → `brand`, `vendor`
- **content translations / parent-child tree** → `category`, `place`

The path-scoped protocols are the authority where the template and your instinct disagree — read the
ones that apply **before** proposing an approach: `.claude/rules/database.md` (repository/query
layer, transactions, migrations, seeds), `.claude/rules/api.md` (controller shape, envelope,
routes), `.claude/rules/validation.md` (validator structure, partial-update pattern),
`.claude/rules/auth.md` (policy layer), `.claude/rules/error-handling.md`.

## 3. Files to create

| File | Notes |
|---|---|
| `<feature>.repository.ts` | `<Feature>Query extends RepositoryAbstract<Entity>` + `get<Feature>Repository()` with `createQuery()`. Feature-specific filters live here, return `this`, and are named for what they mean (`filterByTarget`, `filterByOwner`, `filterByTerm`) |
| `<feature>.service.ts` | all business logic; `ValidatorOutput<Validator, 'action'>` for its inputs; multi-table writes in `dataSource.transaction`; export the singleton |
| `<feature>.validator.ts` | schemas named after controller actions; `validatorMessages` extends `sharedValidatorMessages`; `paramsUpdateList` + the `hasAtLeastOneValue` refine for `update`; `validateFind({ orderByEnum, filterSchema })` |
| `<feature>.policy.ts` | `extends PolicyAbstract` over `Entity.NAME`. Usually empty — the abstract carries `canCreate`/`canRead`/… A public controller has no permission gate and says so in the class doc |
| `<feature>.controller.ts` | dashboard actions, `BaseController`, every action `asyncHandler`, authorize → validate → delegate → output |
| `<feature>-public.controller.ts` + `-public.routes.ts` | only when the feature is reader-facing (§4) |
| `<feature>.routes.ts` | async factory, lazy `await import` of the controller, `validateParamsWhenId` / `validateParamsWhenEnum` handlers |
| `locales/en.json` | `validation.*`, `error.*`, `success.*` — every `getMessage` / `lang` key used anywhere in the slice |
| `database/<feature>.seed.ts` | required for any feature owning a table (`database.md` §5.4): top-up, natural keys, seeded `random`, `isDirectRun` block. Register it in `src/database/seed/index.ts` after its parents |
| `manifest.json` | `name`, `version`, `relativePath`, `entities`, `depends_on`, `required_by`; `is_core` only when true |

Reuse before writing: check `src/helpers/*`, `src/shared/abstracts/*` and the template feature for
anything you are about to hand-roll (`hashClientIp`, `assertValidStatusTransition`,
`isUniqueViolation`, `numericTransformer`, `runInBackground`).

## 4. The public/dashboard split

A feature is reader-facing when its entity has guest author columns (`guest_*`, nullable `user_id`,
`user_ip_hash`) or a public read of its own. Then it gets **two** controllers and **two** route
files, as `rating` does:

- `<feature>.routes.ts` — `basePath: '/<plural>'`, permission-gated through the policy.
- `<feature>-public.routes.ts` — `basePath: '/public/<plural>'`, open, gated by *identity* instead:
  the caller is resolved from the request (`hashClientIp` + `res.locals.auth`) and every query is
  scoped to what that identity owns via a `filterByOwner` in the repository.

**A public write never addresses a row by id.** The id is not the caller's to name — it forces an
ownership check afterwards, and getting that check wrong lets anyone edit anyone's row. Address by
target plus resolved identity, so the row the query resolves to is one the caller may write by
construction. Where params and body are merged, spread params **last**, or a body naming a different
target redirects the write.

`hashClientIp` returning null is a 400 (`error.ip_unresolved`), never a fallback hash.

## 5. Migration

`pnpm run migration:generate ./src/database/migrations/<feature>` inside the container, then **read
the generated file before running it** — generation drops columns it should not, and picks up
unrelated entity drift from other branches. Both `up()` and `down()` must be real.

## 6. Verify

Run from inside the container (`docker exec $DOCKER_CONTAINER sh -c "cd /var/www/html && …"`):

- `pnpm run typecheck`
- `pnpm run messages:check` — proves every `lang()` key resolves; a missing locale entry ships the
  raw key to the client.
- `pnpm run manifests:check` — the new `manifest.json` has to fit the graph.
- `pnpm run biome` — this is the "on demand" case CLAUDE.md's don't-run-biome rule leaves open: a
  new feature is a dozen fresh files and import order, formatting and cycle detection are exactly
  what a copied folder gets wrong. It writes in place, so re-read anything still open and report
  what changed.
- `pnpm run seed <feature>` against the dev database, then read a few rows back through the Postgres
  MCP tools to confirm the shape.
- Tests only if the user asks (CLAUDE.md restriction), and scoped to the new feature.

## 7. Report

- Entity review: indexes added and why, constraints the validator now mirrors, anything in the
  entity's doc comments the service had to honour.
- Files created, and the template feature each layer followed.
- **Porting** — `src/shared/**`, `src/config/**`, `src/middleware/**`, `src/providers/**`,
  `src/helpers/**` and core features are shared with `../star-api`: if you touched any, say so and
  offer to port.
- **Frontend** — new routes are a new API contract. Name the `../nready-ui` pieces that need to
  follow: the `src/services/*.service.ts`, `src/models/permission.model.ts`
  (`PermissionEntityType`), `src/models/log-history.model.ts` (the backend *table* name), and the
  dashboard page, which `/add-dashboard-feature <feature>` builds there.
- Anything deliberately left out, and why.
