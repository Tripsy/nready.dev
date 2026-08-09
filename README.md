# NReady

![Node.js](https://img.shields.io/badge/Node.js-22-green)
![Express](https://img.shields.io/badge/Express-4.21-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)
![Docker](https://img.shields.io/badge/Docker-ready-blue)
![License](https://img.shields.io/badge/License-MIT-green)
![Redis](https://img.shields.io/badge/Redis-integrated-red)
![JWT](https://img.shields.io/badge/JWT-auth-orange)
![Zod](https://img.shields.io/badge/Zod-validation-3E6B9B)

# 📄 Description

NReady is a **Node.js - Express / TypeScript** boilerplate designed for complex, secure REST APIs.

This boilerplate can serve as a foundation to quickly build MVPs, CMS platforms, or E-commerce solutions.

It comes with a [solid structure](#Structure), it is fully modular and feature-based, and already contains a lot of useful [features](#Features),
and many [goodies](#Characteristics) including: 
- **Complete authentication system**;
- Multiple background workers (email, cron, etc.);
- Advanced logging and error handling;
- Custom middlewares;
- Multi-language support;
- Strong validation and policy-based authorization;
- Testsuite based on Jest and Supertest;
- Docker support;

The code follows **best practices** and **design principles** like SOLID, KISS, DRY, and strong security standards. 
The codebase is fully typed in **TypeScript**. **Biome** ensures code quality.

The recommended database is **PostgreSQL**, though it has also been tested with MariaDB, using **TypeORM** as the ORM layer. 

A ready-to-use Docker environment is provided for quick [setup](#Setup).

This project is still a work in progress, and the next goals are:
   - Add new [features](#Features) such as articles, images, products, orders, invoices,and subscriptions
   - Create documentation

Meanwhile, we're open to suggestions / feedback, and if you find this project useful, please consider giving it a star ⭐

> On a [separate project](https://github.com/Tripsy/dashboard.dev), powered by **React / Next.js** you can find a 
> working #FrontEnd interface which demonstrate the usability of the `authentification system` and 
> an **Administration Dashboard** with some features already included: Users, Permissions, Template, Logs, Clients, Cash-Flow, Places, etc

# 🚀 Tech Stack

## Core
- Language: TypeScript 5.9
- Runtime Environment: Node.js 22
- Runtime: Node.js 22
- Framework: Express.js 4.21

## Code Quality
- Linting & Formatting: Biome
- Circular Dependency Check: Madge
- Validation: Zod 4.3

## Security
- Authentication: JWT tokens
- Password Hashing: bcrypt
- Headers Security: Helmet
- Cross-Origin: CORS
- Rate Limiting: express-rate-limit
- Input Validation: Zod 4.3

## Database
- Primary: PostgreSQL 15
- Secondary: MariaDB 11
- ORM: TypeORM

## Logging
- Logger: Pino
- Transports: file, email, database

## Infrastructure
- Containerization: Docker
- Testing: Jest, Supertest

# ⚙️ Characteristics

- [x] Ready-to-use boilerplate with a modular, feature-based architecture
- [x] Best Practices: Clean architecture, TypeScript, error handling, async patterns, DRY, SOLID, KISS
- [x] Security: Helmet, rate limiting, input validation, CORS
- [x] Logging (powered by Pino)
- [x] Request validation (powered by Zod)
- [x] Standardized JSON Responses: Consistent response structures for better frontend integration
- [x] Caching (powered by ioredis)
- [x] Cron jobs provider with automatic discovery and registration
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
- [x] Internationalization / language management (powered by i18next)
- [x] Complete `Auth System`: Secure, modular auth layer supporting user registration, login (token-based authentication), etc.
- [x] Authorization policies based on user roles and permissions
- [x] Testing (powered by Jest & Supertest)
- [x] Documentation provided for APIs endpoints
- [x] Development environment available (Docker)

# ✨ Features

### Core features

- [x] account: register, login, removeToken, logout, passwordRecover, passwordRecoverChange, passwordUpdate, emailConfirm, emailUpdate, me, sessions, edit, delete
- [x] cron-history: read, delete, find
- [x] log-data: read, delete, find
- [x] log-history: read, delete, find
- [x] mail-queue: read, delete, find
- [x] permission (create, read, update, delete, restore, find
- [x] template (create, read, update, delete, restore, find)
- [x] user (create, read, update, delete, restore, find, statusUpdate)
- [x] user-permission (create, delete, restore, find)

### Modular features

- [ ] article: 
- [x] brand: create, read, update, delete, restore, find, statusUpdate, orderUpdate
- [x] carrier: create, read, update, delete, restore, find
- [x] cash-flow: create, read, update, delete, find, statusUpdate
- [x] category: create, read, update, delete, restore, find, statusUpdate
- [x] client: create, read, update, delete, restore, find, statusUpdate
- [x] client_address: create, read, update, delete, restore, find
- [x] discount: create, read, update, delete, restore, find
- [x] image: create, read, update, delete, restore, find, statusUpdate, orderUpdate
- [ ] invoice:
- [ ] order:
- [ ] order-shipping:
- [x] place: create, read, update, delete, restore, find
- [ ] product:
- [ ] subscription:
- [x] term: create, read, update, delete, restore, find

# 🛠 Setup

### 1. Add `hosts` record
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
docker exec -it nready.dev /bin/bash
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

# 🖥️ Commands

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
│   │   │   │   └── pending-account-reminder.cron.ts
│   │   │   ├── locales/
│   │   │   │   └── en.json
│   │   │   ├── tests/
│   │   │   │   └── user-controller.test.ts
│   │   │   │   └── user-service.test.ts
│   │   │   │   └── user-validator.test.ts
│   │   │   ├── user.controller.ts
│   │   │   ├── user.entity.ts
│   │   │   ├── user.mock.ts
│   │   │   ├── user.repository.ts
│   │   │   ├── user.routes.ts
│   │   │   ├── user.service.ts
│   │   │   ├── user.subscriber.ts
│   │   │   └── user.validator.ts
│   │   │   └── user.seed.ts 
│   │   │   └── manifest.json 
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
│   │   ├── types/         # Shared types
│   ├── templates/         # Email layout templates
│   └── tests/             # Jest & Supertest tests
│   └── workers/           # Background workers
│   └── app.ts          
│   └── bootstrap.ts          
│   └── server.ts          
├── .env
├── biome.json
├── docker-compose.yml
├── package.json
├── pnpm-lock.yaml
├── tsconfig.build.json
├── jest.config.js
└── tsconfig.json
```

# 📌 TODO

1. Go on FE → carrier, discount,
2. Go on FE → term
3. Go on FE → category
4. Prepared entities:
    - article
        - article-category
        - article-content
        - article-tag  
    - invoice
    - order
        - order-product
    - order-shipping
        - order-shipping-product
    - product
        - product-attribute
        - product-category
        - product-tag
        - product-content
    - subscription
        - subscription-evidence

# 📌 TODO - EXTRA

1. Implement kill all sessions except current
   // // This will actually remove all sessions - keep it for further implementation
   // await AccountTokenRepository.createQuery()
   //     .filterBy('user_id', policy.getUserId())
   //     .delete(false, true);
2. For template section
   - would be a nice idea to keep track of the last changes (maybe add a new column - prev version id and a button to restore to that version)
   - view presentation could be enhanced
4. Extend `article` 
     - parsing capabilities
     - `article_source` - list of available sources from where articles were parsed; `article`
       already carries `source_mode` (`input` / `parsed`) and a `source` jsonb holding the
       display side (`label`, `url`, `disclaimer`, `about`), so this only needs the table plus a
       nullable `source_id` FK on `article`. The jsonb then stays as the per-article override for
       one-off sources that don't deserve a row.
3. API documentation (`done` for discounts)
4. create CLI script which should generate something like:
   POST /discounts HTTP/1.1
   Host: nready.dev:3000
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
5. For reporting create separate DB table (in a new schema `reporting`). Hint: data could be updated via subscribers.
6. cron hanging / delaying / semaphore 

# 🔗 Dependencies
    
- [Pino](https://github.com/pinojs/pino) — Fast, low-overhead Node.js logger
- [Mysql2](https://github.com/sidorares/node-mysql2) — MySQL client for Node.js with TypeScript support
- [TypeORM](https://github.com/typeorm/typeorm) — ORM for TypeScript and JavaScript with support for multiple databases
- [i18next](https://github.com/i18next/i18next) — Internationalization framework for JavaScript/Node.js
- [nodemailer](https://nodemailer.com/) — Email sending library for Node.js
- [zod](https://zod.dev) — TypeScript-first schema validation with static type inference
- [helmet](https://helmetjs.github.io/) — Security middleware for Express.js
- [express-rate-limit](https://express-rate-limit.mintlify.app/overview) — Rate limiting middleware for Express.js
- [ioredis](https://github.com/luin/ioredis) — Robust Redis client for Node.js
- [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken) — JSON Web Token implementation
- [node-cron](https://github.com/node-cron/node-cron) — Task scheduler for Node.js
- [nodemailer](https://nodemailer.com/) — Email sending library
- [BullMQ](https://docs.bullmq.io/) — Redis-based message queue for Node.js
- [nunjucks](https://github.com/mozilla/nunjucks) — Templating engine for JavaScript
- [dayjs](https://day.js.org/) — Parses, validates, manipulates, and displays dates and times 

Dev only:

- [typescript](https://www.typescriptlang.org/) 
- [jest](https://jestjs.io/) — JavaScript testing framework
- [supertest](https://www.npmjs.com/package/supertest) — HTTP assertion library for testing Node.js servers
- [mailtrap](https://github.com/mailtrap/mailtrap-nodejs) — Mailtrap client for Node.js
- [tsc-alias](https://github.com/justkey007/tsc-alias) — Rewrites the `@/*` alias to relative paths in the build output
- [biome](https://biomejs.dev/) — Biome is a fast formatter for JavaScript, TypeScript, JSX, TSX, JSON, HTML, CSS and GraphQL 
