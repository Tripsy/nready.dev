---
paths:
  - "src/config/data-source.config.ts"
  - "src/database/migrations/*.ts"
  - "src/features/**/*.entity.ts"
  - "src/features/**/database/*.seed.ts"
  - "src/features/**/*.repository.ts"
  - "src/features/**/*.subscriber.ts"
  - "src/features/**/*.service.ts"
  - "src/shared/abstracts/entity.abstract.ts"
  - "src/shared/abstracts/repository.abstract.ts"
  - "src/shared/abstracts/subscriber.abstract.ts"
---

# Database Interaction Protocol

**Scope:** Entities, the repository/query layer, transactions, migrations and seeds.

**See also:** `product.md` — the `product` / `product_variant` / `product_option` split. The rules
here describe how to write an entity; that file describes which of those three tables a piece of
information belongs to, which the columns alone do not reveal. Read it before adding a column to any
`product*` entity or to `order_product`.

## 1. Core Philosophy

- **Never interpolate a value into SQL.** `filterBy` / `filterAny` / `filterById` parameterize
  automatically; `filterRaw` takes a parameters object. Building a condition with a template literal is
  the one thing in this layer that turns a bug into a vulnerability.
- **Migrations are the only way the schema changes.** No `synchronize`, no manual `ALTER` against a
  live database — a change that isn't in `src/database/migrations/` doesn't exist for the next
  environment.
- **Soft delete is the default.** Business entities carry `deleted_at` and are removed with
  `delete(true, ...)`; a hard delete is a deliberate exception, not a shortcut.
- **Go through `RepositoryAbstract`.** A service that holds a bare TypeORM `Repository<T>` loses the
  filter guards, soft-delete handling and standardized not-found errors that everything else relies on.

## 2. Entity Standards

### 2.1. Naming

- **Tables:** `snake_case`, singular (`user`, `order_item`).
- **Columns:** `snake_case`, singular. Property names match the DB column exactly — no camelCase with a
  `name:` mapping.
- **Primary keys:** `id`, auto-incrementing `int`, provided by `EntityAbstract`. Not UUIDs.
- **Foreign keys:** named after what they reference (`user_id`, `company_id`).
- **Timestamps:** `created_at` / `updated_at` on every table, `deleted_at` on anything soft-deletable —
  all three come from `EntityAbstract`.

### 2.2. Structure

Every entity extends `EntityAbstract` (`src/shared/abstracts/entity.abstract.ts`), which already
provides `id`, `created_at`, `updated_at` and `deleted_at`. Do not redeclare them.

```typescript
import { Column, Entity, Index, JoinColumn, ManyToOne } from 'typeorm';
import { EntityAbstract } from '@/shared/abstracts/entity.abstract';
import { SoftDeleteIndex } from '@/shared/decorators/soft-delete-index.decorator';

export const UserStatusEnum = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

export type UserStatus = (typeof UserStatusEnum)[keyof typeof UserStatusEnum];

const ENTITY_TABLE_NAME = 'user';

@Entity({
  name: ENTITY_TABLE_NAME,
  schema: 'public',
  comment: 'Store users',
})
@SoftDeleteIndex(ENTITY_TABLE_NAME) // Partial index scoped to deleted_at IS NULL
export default class UserEntity extends EntityAbstract {
  static readonly NAME: string = ENTITY_TABLE_NAME;
  static readonly HAS_CACHE: boolean = true;

  @Column('varchar', { nullable: false })
  @Index('IDX_user_email')
  email!: string;

  @Column({
    type: 'enum',
    enum: UserStatusEnum,
    default: UserStatusEnum.ACTIVE,
    nullable: false,
  })
  @Index('IDX_user_status')
  status!: UserStatus;

  // RELATIONS
  @Column('int', { nullable: true })
  @Index('IDX_user_company_id')
  company_id!: number | null;

  @ManyToOne('CompanyEntity', { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'company_id' })
  company!: CompanyEntity | null;
}
```

- Default-export the class; expose `static readonly NAME` (the table name, reused by policies and
  repositories) and `HAS_CACHE`.
- Enums are a const object plus a derived union, never a TypeScript `enum`.
- `ON DELETE CASCADE` sparingly — prefer `RESTRICT` or `SET NULL` unless the child has no meaning
  without its parent.
- Push invariants the database can hold into a `@Check` constraint rather than relying on application
  code alone; `cash-flow.entity.ts` is the reference (`@Check('(amount > 0)')` plus a direction/amount
  consistency check).

## 3. Repository & Query Layer

This is Express + TypeORM with plain module singletons — there is no DI container, so no `@Injectable()`
and no `@InjectRepository()`. A feature's `<feature>.repository.ts` exports **two** things: a query
class named `<Feature>Query` (not `<Feature>Repository`), and a factory that extends TypeORM's
repository with a `createQuery()` hook.

```typescript
import type { Repository } from 'typeorm';
import dataSource from '@/config/data-source.config';
import ProductEntity from '@/features/product/product.entity';
import RepositoryAbstract from '@/shared/abstracts/repository.abstract';

export class ProductQuery extends RepositoryAbstract<ProductEntity> {
  constructor(repository: Repository<ProductEntity>) {
    super(repository, ProductEntity.NAME);
  }

  // Feature-specific filters live here and return `this` so they stay chainable
  filterByTerm(term?: string): this {
    // ...
    return this;
  }
}

export const getProductRepository = () =>
  dataSource.getRepository(ProductEntity).extend({
    createQuery() {
      return new ProductQuery(this);
    },
  });
```

- Pass `Entity.NAME` to `super()`, not a hand-written string — the entity already owns its table name.
- A service takes the repository in its constructor, typed off the factory
  (`constructor(private repository: ReturnType<typeof getProductRepository>) {}`), and is exported as a
  singleton built with it (`export const productService = new ProductService(getProductRepository())`).
  Each query starts a fresh chain with `this.repository.createQuery()`.

### 3.1. Query Rules

```typescript
// ✅ SAFE - auto-parameterized
this.filterBy('email', userInput);

// ✅ SAFE - raw SQL with bound parameters
this.filterRaw(
  'to_tsvector(name) @@ plainto_tsquery(:term)',
  { term: searchInput },
);

// ❌ UNSAFE - never interpolate into filterRaw
this.filterRaw(`name = '${userInput}'`); // INJECTION RISK

// ✅ soft delete a single row: delete(isSoftDelete, multiple, force)
await this.repository.createQuery().filterById(userId).delete(true, false);

// ❌ throws `db_delete_missing_filter` — an unfiltered delete is refused
await this.repository.createQuery().delete();

// ⚠️ force bypasses that guard and deletes everything — admin scripts only
await this.repository.createQuery().delete(true, true, true);

// ✅ eager-load instead of querying in a loop (N+1)
const user = await this.repository
  .createQuery()
  .select(['id', 'name'])
  .joinAndSelect('user.profile', 'profile', 'LEFT')
  .filterById(userId)
  .first();

// ✅ paginated list with a total
const [data, total] = await this.repository
  .createQuery()
  .select(['id', 'email'])
  .filterBy('status', 'active')
  .pagination(1, 20)
  .all(true);
```

- `select(...)` explicit columns over loading whole rows, and `pagination(...)` on anything list-shaped
  — an unbounded `all()` on a growing table is a slow query waiting to happen.
- `first()` returns nullable; `firstOrFail()` throws a `<entity>.error.not_found`. Pick the one that
  matches the caller and don't null-check the result of `firstOrFail()` (see `error-handling.md` §5).
- `withDeleted()` opts a query into soft-deleted rows — drive it from `policy.allowDeleted(auth)`
  rather than deciding per call site.

## 4. Transactions

Wrap any operation that writes to several tables, or reads then writes, in
`dataSource.transaction(async (manager) => { ... })` — `brand.service.ts` and `image.service.ts` are the
references. Keep the body short: it holds locks for its whole duration.

In tests, `setupTransactionMock()` (`@/tests/jest-service.setup`) stubs this out — see `testing.md` §6.

## 5. Migrations

### 5.1. Naming

TypeORM's timestamp convention, `{timestamp}-{description}.ts` — `1782779682393-image.ts`. Never
sequential numbers (`001-init.sql`) or plain dates (`2026-07-18-add-column.sql`): the timestamp is what
keeps ordering deterministic and avoids collisions between branches.

### 5.2. Structure

Both directions are required — a migration without a working `down()` cannot be rolled back in
production.

```typescript
import { MigrationInterface, QueryRunner } from 'typeorm';

export class Image1782779682393 implements MigrationInterface {
  name = 'Image1782779682393';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "image" (
        "id" SERIAL NOT NULL,
        "url" character varying NOT NULL,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_image" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "image"`);
  }
}
```

### 5.3. Commands

```bash
# Generate from entity changes (recommended over hand-writing)
pnpm run migration:generate /var/www/html/src/database/migrations/UpdateUserEntity
pnpm run migration:run
pnpm run migration:revert

# Reset the schema (raw CLI, no npm script)
tsx ./node_modules/typeorm/cli.js schema:drop -d src/config/data-source.config.ts
```

### 5.4. Seeds

Three kinds, and they are not interchangeable:

**Reference data** — `template` and `permission`. A fixed canonical list, wipe-and-insert, each
owning its own connection lifecycle. Run them before the demo seeds.

```bash
tsx /var/www/html/src/features/template/database/template.seed.ts
tsx /var/www/html/src/features/permission/database/permission.seed.ts
```

A feature that sends its own email keeps its templates with itself, in
`features/<name>/database/<name>.templates.ts`, default-exporting a `TemplateSeedEntry[]`. The
template seed discovers those files and inserts them alongside its own list, so an additional
feature installed or removed through `cli/feature.ts` takes its templates with it and the core seed
needs no edit. Only templates the core features render belong in `template.seed.ts` itself.

**Bootstrap** — `account/database/admin.seed.ts`. Creates the first administrator so a freshly
migrated database has a way in. Credentials are read from `ADMIN_EMAIL` / `ADMIN_PASSWORD` and have
**no defaults**: a fallback would be a published administrator password the moment it runs anywhere
real. Keyed on email, so re-running is a no-op and never resets an existing admin's password.
Deliberately absent from the `seeds` array, so `pnpm run seed` stays runnable with no environment
configured.

**Demo data** — generated volume for local development, driven by `src/database/seed/`.

```bash
pnpm run seed            # every entity, in foreign-key order
pnpm run seed brand      # one entity
```

**Every new feature that owns a table ships with a demo seed.** It is part of the feature's
definition of done, alongside its entity and migration — not a later chore. The exceptions are
features with no table of their own and reference data with a fixed canonical list (`permission`,
`template`), which are wipe-and-insert and stay out of the orchestrator.

Conventions for a new demo seed:

- Live at `src/features/<entity>/database/<entity>.seed.ts`, export a `SeedDefinition`, and end with
  the `isDirectRun(import.meta.url)` block so the file stays runnable standalone while the
  orchestrator can import it.
- **Top up, never wipe.** Build candidate rows `0..target-1` as a pure function of the index, give
  each a natural key, and hand them to `topUp()` — it inserts only the keys not already stored.
  Clearing a table is not an option here: `order`, `invoice`, `product` and friends hold `RESTRICT`
  foreign keys, and the database holds rows worth keeping. Wipe-and-insert is reserved for closed
  reference lists like `template` and `permission`.
- Randomness comes from the injected `random`, a seeded PRNG. Never `Math.random` — a re-run has to
  reproduce the same rows or the top-up inserts duplicates.
- Register the seed in `src/database/seed/index.ts`, positioned after its parents.
- **Let the subscribers do their job.** `UserSubscriber.beforeInsert` hashes `password` and fills
  `password_updated_at`; a seed that pre-hashes ends up double-hashing and no login will match.
  Check `<entity>.subscriber.ts` before setting a column by hand.

## 6. Query Logging

`data-source.config.ts` sets `logging: false` in every environment. Turn it on locally to debug a
query, but revert it — TypeORM's query log goes to stdout unfiltered, so it carries parameter values
(emails, tokens, password hashes) into whatever collects the container's output.

## 7. Destructive Operations

Before running anything containing `DROP`, `TRUNCATE`, `ALTER`, or an `UPDATE`/`DELETE` without a
`WHERE`, stop and confirm with the user. For a complex update, show the matching `SELECT` first so the
affected rows are visible before they change.
