# NReady

![Node.js](https://img.shields.io/badge/Node.js-24-green)
![Express](https://img.shields.io/badge/Express-5.2-black)
![TypeScript](https://img.shields.io/badge/TypeScript-6.0-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-18-336791)
![Docker](https://img.shields.io/badge/Docker-ready-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Redis](https://img.shields.io/badge/Redis-integrated-red)
![JWT](https://img.shields.io/badge/JWT-auth-orange)
![Zod](https://img.shields.io/badge/Zod-validation-3E6B9B)

# 📄 Description

NReady is a **Node.js - Express / TypeScript** boilerplate designed for complex, secure REST APIs.

This boilerplate can serve as a foundation to quickly build MVPs, CMS platforms, CRMs and in the near future E-commerce solutions.

It comes with a [solid structure](#-structure), it is fully modular and feature-based, and already contains a lot of useful [features](#-features),
and many [goodies](#-characteristics) including:
- **Complete authentication system** — JWT access / refresh tokens, email confirmation, password recovery, session limits;
- Convention-based auto-discovery — drop in a `*.routes.ts`, `*.cron.ts`, `*.listener.ts` or `*.bootstrap.ts` and it is wired at startup;
- A feature installer (`cli/feature.ts`) with version-aware dependency resolution, so a slice can be packaged and moved between projects;
- Background processing — BullMQ queues, an email worker, and a cron provider that records every run;
- Advanced logging and error handling, with a destination per level (console, file, database, email, CloudWatch);
- Custom middlewares;
- Multi-language support for content and outgoing email;
- Strong validation and policy-based authorization;
- Testsuite based on Jest and Supertest;
- Docker support;

The code follows **best practices** and **design principles** like SOLID, KISS, DRY, and strong security standards. 
The codebase is fully typed in **TypeScript**. **Biome** ensures code quality.

The recommended database is **PostgreSQL**, though it has also been tested with MariaDB, using **TypeORM** as the ORM layer.
**Redis** backs both the cache and the queues.

A ready-to-use Docker environment is provided for quick [setup](#-setup).

This project is still a work in progress, and the next goals are:
   - Finish the commerce [features](#-features) — products, orders, invoices, stock and subscriptions are entity-only so far
   - Create documentation

Meanwhile, we're open to suggestions / feedback, and if you find this project useful, please consider giving it a star ⭐

> On a [separate project](https://github.com/Tripsy/nready-ui), powered by **React / Next.js** you can find a 
> working #FrontEnd interface which demonstrates the usability of the `authentication system` and 
> an **Administration Dashboard** with some features already included: Users, Permissions, Template, Logs, Clients, Cash-Flow, Places, etc

# 🚀 Tech Stack

## Core
- Language: TypeScript 6.0
- Runtime: Node.js 24 (Active LTS)
- Framework: Express.js 5.2
- Package manager: pnpm

## Code Quality
- Linting, Formatting, Import Cycles: Biome
- Validation: Zod 4.4

## Security
- Authentication: JWT tokens
- Password Hashing: bcrypt
- Headers Security: Helmet
- Cross-Origin: CORS
- Rate Limiting: express-rate-limit
- Input Validation: Zod 4.4
- HTML Sanitizing: sanitize-html

## Database
- Primary: PostgreSQL 18
- Secondary: MariaDB 11
- ORM: TypeORM
- Cache & Queues: Redis (ioredis, BullMQ)

## Logging
- Logger: Pino
- Destinations, selected per level: console, file, database, email, CloudWatch

## Infrastructure
- Containerization: Docker
- Email: SMTP (nodemailer) or AWS SES
- Testing: Jest, Supertest

# ⚙ Characteristics

- [x] Ready-to-use boilerplate with a modular, feature-based architecture
- [x] Best Practices: Clean architecture, TypeScript, error handling, async patterns, DRY, SOLID, KISS
- [x] Security: Helmet, rate limiting, input validation, CORS
- [x] Logging (powered by Pino)
- [x] Request validation (powered by Zod)
- [x] Standardized JSON Responses: Consistent response structures for better frontend integration
- [x] Caching (powered by ioredis)
- [x] Cron jobs provider with automatic discovery, registration and run history
- [x] Auto-registered event listeners
- [x] Email sending via queues (powered by BullMQ)
- [x] Template management for emails and pages
- [x] Subscribers (powered by TypeORM)
- [x] Custom Middlewares
    - Auth (auth.middleware → res.locals.auth)
    - Language
    - Query params validation, etc
    - API documentation displayed on error responses (development only)
    - API Output formatting
    - Params validation
- [x] Internationalization / language management (own `lang()` layer over per-feature `locales/*.json`)
- [x] Complete `Auth System`: Secure, modular auth layer supporting user registration, login (token-based authentication), etc.
- [x] Authorization policies based on user roles and permissions
- [x] Testing (powered by Jest & Supertest)
- [x] Documentation provided for APIs endpoints
- [x] Packaged features, installable via CLI with version-aware dependency resolution
- [x] Development environment available (Docker)

# ✨ Features

### Core features

- [x] account: register, login, removeToken, logout, passwordRecover, passwordRecoverChange, passwordUpdate, emailConfirm, emailUpdate, me, sessions, edit, delete
- [x] cron-history
- [x] log-data
- [x] log-history
- [x] mail-queue
- [x] permission
- [x] template
- [x] user
- [x] user-permission

### Modular features

- [x] address
- [x] article 
- [x] brand
- [x] carrier
- [x] cash-flow
- [x] category
- [x] client
- [x] comment
- [x] complaint
- [x] discount
- [x] document-series
- [ ] grn
- [x] image
- [ ] invoice
- [ ] order
- [ ] order-shipping
- [x] place
- [ ] product
- [x] rating
- [ ] review
- [ ] subscription
- [x] term
- [x] vendor
- [ ] warehouse

# 🛠 Setup

### 1. Add `hosts` record

sudo nano /private/etc/hosts

For configuration refer to this guide:  
[How to Edit the Host File on macOS](https://phoenixnap.com/kb/mac-hosts-file)

sudo nano /private/etc/hosts

### 2. Initialize Docker container
Start the Docker container using the following command:

```
docker compose up
```

### 3. Connect to the Docker container
Once the container is running, connect to it with:

```
docker exec -it nready-api.test /bin/bash
```

### 4. Install dependencies inside the container
Run the following command to install project dependencies:

```
$ pnpm install
```

### 5. Update .env

Start by copying the `.env.example` file to `.env` and update the environment variables accordingly.

### 6. Database

Create the database itself, then build the schema:

```
$ pnpx tsx src/database/migrate.ts
```

This creates the non-public schemas (`system`, `logs`) before applying the migrations, so it
works against an empty database. It is also the production entry point.

> **⚠ Warning**
> `pnpm run migration:run` drives the TypeORM CLI, which writes its `system.migrations`
> bookkeeping table *before* running any migration — on an empty database it fails with
> `schema "system" does not exist`. Use it only once the schemas exist, or create them by hand
> first:
>
> ```sql
> CREATE SCHEMA IF NOT EXISTS system;
> CREATE SCHEMA IF NOT EXISTS logs;
> ```

### 7. Run the application

```
$ pnpm run dev
```

### 8. Setup features

```
$ pnpx tsx cli/feature.ts [feature] install
$ pnpx tsx cli/feature.ts [feature] remove
$ pnpx tsx cli/feature.ts [feature] upgrade
```

# 🖥 Commands

> **⚠ Warning**
> Always check the migrations before run it, sometimes columns are dropped

> **⚠ Warning**
> A green test run can be a lie — read the test *count*, not just the colour. `bail: 3` stops
> the run after 3 failing files, and a SIGKILLed worker drops a whole file while the summary
> still looks plausible. For a trustworthy full run:
>
> ```bash
> $ docker exec -e NODE_OPTIONS=--experimental-vm-modules -e APP_DEBUG=false \
>     -e APP_ENV=test -e NODE_ENV=test $DOCKER_CONTAINER pnpm exec jest --bail=0
> ```
>
> `pnpm run test -- --bail=0` does **not** work: the `--` reaches jest as a literal test-path
> pattern and matches nothing.

```bash
// Generate migration file
$ pnpm run migration:generate /var/www/html/src/database/migrations/init

// Apply pending migrations - this is the production entry point and the one to use on an
// empty database, since it creates the `system` and `logs` schemas first
$ pnpx tsx src/database/migrate.ts

// Run new migrations - update DB structure
// Goes through the TypeORM CLI, which writes its `system.migrations` table before running
// anything, so it fails on a database where the schemas do not exist yet
$ pnpm run migration:run

// Revert last migration
$ pnpm run migration:revert

// Replace every migration with a single one generated from the entities
// Pre-production only; --baseline rewrites the migrations table of a database whose schema
// already matches. Use `pnpm exec`, since `pnpm run ... --` forwards `--` literally
$ pnpm exec tsx ./cli/migration-consolidate.ts --baseline

// Reset database
$ pnpx tsx ./node_modules/typeorm/cli.js schema:drop -d src/config/data-source.config.ts

// Import reference data - a fixed canonical list, wipe-and-insert; run these first
$ pnpx tsx /var/www/html/src/features/template/database/template.seed.ts  
$ pnpx tsx /var/www/html/src/features/permission/database/permission.seed.ts

// Create the first administrator - reads ADMIN_EMAIL / ADMIN_PASSWORD, which have no
// defaults; keyed on email, so re-running never resets an existing admin's password
$ pnpx tsx /var/www/html/src/features/account/database/admin.seed.ts

// Import demo data - every entity in foreign-key order, or a single one
$ pnpm run seed
$ pnpm run seed brand

// Run tests
$ pnpm run test
$ pnpm run test account-controller.test.ts
$ pnpm run test src/features/account --detectOpenHandles

// Code sanity (lint, format, circular dependencies)
$ pnpm run biome

// Production build (-> dist/src) and run it
$ pnpm run build
$ pnpm run start

// CLI
$ pnpx tsx cli/cron.ts list -s  
$ pnpx tsx cli/cron.ts run cron-time-check

```

# 📁 Structure

```
├── docker/
├── src/
│   ├── config/            # Configuration files
│   ├── database/
│   │   ├── migrations/    # TypeORM migrations
│   ├── exceptions/        # Custom error classes
│   ├── features/          # Feature-based modules
│   │   ├── user/
│   │   │   ├── cron-jobs/
│   │   │   ├── database/
│   │   │   │   └── user.seed.ts
│   │   │   ├── locales/
│   │   │   │   └── en.json
│   │   │   ├── tests/
│   │   │   │   └── user-controller.test.ts
│   │   │   │   └── user-service.test.ts
│   │   │   │   └── user-validator.test.ts
│   │   │   └── manifest.json 
│   │   │   ├── user.controller.ts
│   │   │   ├── user.entity.ts
│   │   │   ├── user.mock.ts
│   │   │   ├── user.policy.ts
│   │   │   ├── user.repository.ts
│   │   │   ├── user.routes.ts
│   │   │   ├── user.service.ts
│   │   │   ├── user.subscriber.ts
│   │   │   └── user.validator.ts
│   │   └── ...            # Other features (invoice, category, etc.)
│   ├── helpers/           # Utilities (date, string, object, etc.)
│   ├── middleware/        # Custom Express middlewares
│   ├── providers/         # Infrastructure (DB, Redis, logger, email, cron)
│   ├── queues/            # BullMQ queues
│   ├── shared/
│   │   ├── abstracts/     # Base / abstract classes
│   │   ├── cron-jobs/     # System cron-jobs
│   │   ├── decorators/    
│   │   ├── listeners/     # Core event listeners
│   │   ├── locales/       # Shared language
│   │   ├── transformers/  # Shared transformers
│   │   ├── types/         # Shared types
│   ├── templates/         # Email layout templates
│   └── tests/             # Jest & Supertest tests
│   └── workers/           # Background workers
│   └── app.ts          
│   └── bootstrap.ts          
│   └── server.ts          
├── .env
├── .gitignore
├── biome.json
├── docker-compose.yml
├── jest.config.js
├── package.json
├── pnpm-lock.yaml
├── tsconfig.build.json
└── tsconfig.json
```

# 📌 TODO

1. Go product, then reviews 
2. Prepared entities:
    - grn
        - grn-item
        - warehouse-movement
    - invoice
    - order
        - order-product
    - order-shipping
        - order-shipping-product
    - product
        - product-attribute
        - product-availability
        - product-bundle-group
        - product-bundle-item
        - product-bundle-item-price
        - product-category
        - product-content
        - product-option
        - product-option-group
        - product-option-price
        - product-price
        - product-tag
        - product-variant
        - product-variant-attribute
    - subscription
        - subscription-evidence
    - warehouse
    - reviews 
3. Comment edit, remove, moderation directly in front;
4. `stats` feature on the backend — the dashboard home widgets (expenses, revenues,
   recent activity) call `/stats/*`, which nready-api does not serve yet
    - show recent activity - log history
    - show a resume of previous day (new entries): users, addresses, clients
    - show expenses and revenues as in star-ui
    - show errors (log data, mail queue, cron-history) from last 24 hours
    - other stats: user activity in last 24 hours (if is relevant)

# 📌 TODO - EXTRA

1. Implement kill all sessions except current
   // // This will actually remove all sessions - keep it for further implementation
   // await AccountTokenRepository.createQuery()
   //     .filterBy('user_id', policy.getUserId())
   //     .delete(false, true);
2. For template section
   - would be a nice idea to keep track of the last changes (maybe add a new column - prev version id and a button to restore to that version)
   - view presentation could be enhanced
3. Extend `article` 
     - parsing capabilities
     - `article_source` - list of available sources from where articles were parsed; `article`
       already carries `source_mode` (`input` / `parsed`) and a `source` jsonb holding the
       display side (`label`, `url`, `disclaimer`, `about`), so this only needs the table plus a
       nullable `source_id` FK on `article`. The jsonb then stays as the per-article override for
       one-off sources that don't deserve a row.
4. API documentation (`done` for discounts)
5. create CLI script which should generate something like:
   POST /discounts HTTP/1.1
   Host: nready-api.test:3000
   Content-Type: application/json
   Authorization: Bearer ****
   Content-Length: 344
   {

        "scope": "order",
        "reason": "flash_sale",
        "reference": "#345",
        "type": "percent",
        "value": 7,
        "rules":     {
          "min_order_value": 101,
          "eligible_categories": [1, 2, 5],
          "applicable_countries": ["RO"]
        },
        "start_at": "2025-12-18",
        "end_at": "2025-12-28",
        "notes": "Lorem ipsum ..."
   }   
6. For reporting create separate DB table (in a new schema `reporting`). Hint: data could be updated via subscribers.
7. cron hanging / delaying / semaphore 
8. Revisit `discount` once `product` ships — the feature is complete except where it
   depends on products existing:
    - The dashboard target picker covers `client`, `category` and `brand` only. For the
      `product` and `variant` scopes it renders an explanatory note instead, because there
      is no product dashboard to search (`form-targets-discount.component.tsx`).
    - The "pick at least one target" rule applies to every scope except `order`, so until
      that picker exists a product- or variant-scoped discount cannot be saved from the
      form at all. The API accepts both.
    - `discount-target.seed.ts` skips the two scopes for the same reason, so nothing
      exercises them against real rows.
    - `DiscountLineContext` already carries `variantId`/`productId` and the resolver
      matches them; only the ways of *creating* those links are missing.
9. Stock handling — entities exist (`warehouse`, `grn`), the behaviour does not
   The tables are in place and documented on themselves; what is missing is every rule that makes
   them mean anything, since none of it can live in a constraint:
   - **Confirming a GRN** writes `warehouse_movement` rows, sets `qty_remaining = qty` on each lot,
     stamps `confirmed_at`, and recomputes `product_variant.cost_price` as a weighted moving
     average in base currency:
     `(qty_on_hand × cost_price + received_qty × unit_cost_base) / (qty_on_hand + received_qty)`.
     Inbound only — sales, write-offs and supplier returns must not move what the goods cost
   - **Cancelling a confirmed GRN** posts reversing movements and reduces `qty_remaining`; it never
     deletes. It must refuse when the lot has already been partly consumed
   - **FIFO allocation on shipment.** Oldest open lot first, splitting across lots as needed, one
     movement per lot, `source_type = order_shipping_product`. Fires on the `order_shipping` status
     transition, not on order confirmation — a lot cannot be picked before the warehouse is known.
     **Pick order is `(grn.received_at, grn_item.id)`** — two deliveries the same day tie on the
     timestamp, and an unordered pick reports a different cost of goods on replay
   - **The weighted average is global, not per warehouse.** `cost_price` lives on
     `product_variant`, so `qty_on_hand` in the formula is the total across every warehouse.
     Averaging against one warehouse's quantity while storing the result globally produces a
     number that looks right and is not. Per-warehouse costing would mean moving `cost_price` onto
     a per-warehouse row, which is a different design
   - **`order_shipping.warehouse_id` is `NOT NULL`** — everything shipped leaves from somewhere,
     and a kitchen is a warehouse for this purpose. `warehouse.is_default` covers the single-site
     case; `order-shipping` therefore `depends_on` `warehouse`
   - **Reconciliation cron** comparing `SUM(warehouse_movement.qty)` per lot against
     `grn_item.qty_remaining`, reporting drift rather than silently correcting it
   - **`track_stock` is not enforced.** Nothing stops a GRN line naming an untracked variant, or a
     shipment of a tracked one skipping allocation
   - **A repository that refuses to delete.** `warehouse_movement` extends
     `AppendOnlyEntityAbstract`, so there is no `deleted_at` to soft-delete into — but
     `RepositoryAbstract.delete` would still issue a hard delete. Its repository should override
     `delete`/`restore` to throw
   - **Cost never touches the selling price automatically.** A shelf price that moves because a
     supplier invoice arrived is impossible to explain to a customer who saw a different number
     yesterday. The GRN should instead flag when margin against `min_price` falls through a
     threshold
   - a demo seed for both features; `warehouse` needs its default row seeded — after `place` and
     `address`, since `warehouse.address_id` is `NOT NULL` — and `vendor` needs the "unknown"
     sentinel that day-one stock is received against
   - dropped from scope for now: reservations (only matter once there is a fulfilment gap), serial
     numbers, stocktake documents, landing costs, and the payable a
     confirmed GRN should raise in `cash-flow`
10. Named menus for `product_availability`
    - the recurring windows say *when* a product can be ordered, but nothing groups them into a
      named "lunch menu" / "brunch" a customer can be shown, and two products sharing one schedule
      repeat it row for row
    - would be a `menu` entity holding the schedule once, with products linked to it; the current
      per-product windows stay as the override
11. Document numbering — leftovers from the `document-series` feature
    - the entity, the atomic allocation and the CRUD surface are in place; what is not:
    - **nothing calls `documentSeriesService.allocate` yet.** `invoice`, `order`, `grn` and
      `subscription` are still entity-only, so the wiring happens when their services are written —
      inside the same transaction as the document insert, which is what keeps the series gapless
    - drafts still have nowhere to reserve a number from without consuming it. That needs a
      reservation row (series, number, expires_at) the draft can hold and either claim or release,
      not another counter
    - the number handed out never comes back. A canceled document leaves its number spent; a
      credit-note-style reuse would need an explicit release path
    - one series per document type, by design. Two concurrent invoice series (per company, per
      branch) would mean re-keying the table and giving `allocate` something to choose with
12. Run cron`s on a separate work / container 

# 🔗 Dependencies

### Runtime

- [express](https://expressjs.com/) — Web framework
- [TypeORM](https://github.com/typeorm/typeorm) — ORM for TypeScript and JavaScript with support for multiple databases
- [pg](https://github.com/brianc/node-postgres) — PostgreSQL client, the primary driver
- [mysql2](https://github.com/sidorares/node-mysql2) — MySQL / MariaDB client, for the secondary database
- [ioredis](https://github.com/redis/ioredis) — Robust Redis client, backing both the cache and the queues
- [BullMQ](https://docs.bullmq.io/) — Redis-based message queue
- [zod](https://zod.dev) — TypeScript-first schema validation with static type inference
- [Pino](https://github.com/pinojs/pino) — Fast, low-overhead logger, with `pino-abstract-transport` and `pino-pretty`
- [helmet](https://helmetjs.github.io/) — Security middleware for Express
- [express-rate-limit](https://express-rate-limit.mintlify.app/overview) — Rate limiting middleware for Express
- [cors](https://github.com/expressjs/cors) — Cross-origin resource sharing
- [compression](https://github.com/expressjs/compression) — Response compression
- [cookie-parser](https://github.com/expressjs/cookie-parser) — Cookie parsing
- [qs](https://github.com/ljharb/qs) — Query string parsing, for nested filter params
- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) — JSON Web Token implementation
- [bcrypt](https://github.com/kelektiv/node.bcrypt.js) — Password hashing
- [sanitize-html](https://github.com/apostrophecms/sanitize-html) — Strips untrusted HTML out of user-submitted content
- [nodemailer](https://nodemailer.com/) — Email sending over SMTP
- [@aws-sdk/client-ses](https://github.com/aws/aws-sdk-js-v3) — The alternative email transport
- [@aws-sdk/client-cloudwatch-logs](https://github.com/aws/aws-sdk-js-v3) — The remote log destination
- [nunjucks](https://github.com/mozilla/nunjucks) — Templating engine, for emails and pages
- [node-cron](https://github.com/node-cron/node-cron) — Task scheduler
- [file-stream-rotator](https://github.com/rogerc/file-stream-rotator) — Rotates the log files
- [dayjs](https://day.js.org/) — Parses, validates, manipulates, and displays dates and times
- [uuid](https://github.com/uuidjs/uuid) — Identifier generation
- [dotenv](https://github.com/motdotla/dotenv) — Loads `.env` in development
- [reflect-metadata](https://github.com/rbuckton/reflect-metadata) — Required by TypeORM's decorators

### Dev only

- [typescript](https://www.typescriptlang.org/)
- [tsx](https://github.com/privatenumber/tsx) — Runs the TypeScript entry points and CLI scripts directly
- [nodemon](https://nodemon.io/) — Restarts the dev server on change
- [jest](https://jestjs.io/) — JavaScript testing framework
- [ts-jest](https://kulshekhar.github.io/ts-jest/) — TypeScript preprocessor for Jest
- [supertest](https://www.npmjs.com/package/supertest) — HTTP assertion library for testing Node.js servers
- [node-mocks-http](https://github.com/eugef/node-mocks-http) — Mock `req` / `res` objects for unit tests
- [mailtrap](https://github.com/mailtrap/mailtrap-nodejs) — Mailtrap client, for inspecting outgoing email
- [commander](https://github.com/tj/commander.js) — Argument parsing for the `cli/` scripts
- [tsc-alias](https://github.com/justkey007/tsc-alias) — Rewrites the `@/*` alias to relative paths in the build output
- [biome](https://biomejs.dev/) — Fast formatter and linter for JavaScript, TypeScript, JSX, TSX, JSON, HTML, CSS and GraphQL
