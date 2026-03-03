# 📄 Description

NReady is a production-ready **Node.js - Express / TypeScript** boilerplate designed for complex, secure REST APIs.

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
The codebase is fully typed in **TypeScript** — no as any shortcuts. **Biome** (on top of ESLint) ensures code quality.

The recommended database is **PostgreSQL**, though it has also been tested with MariaDB, using **TypeORM** as the ORM layer. 

At this date (e.g.: 2026 January), all [dependencies](#Dependencies) are updated to their latest versions, and Node.js 22 is supported.

A ready-to-use Docker environment is provided for quick [setup](#Setup).

This project is still a work in progress, and the next goals are:
   - Add new [features](#Features) such as articles, images, products, orders, invoices,and subscriptions
   - Create documentation

Meanwhile, we're open to suggestions / feedback, and if you find this project useful, please consider giving it a star ⭐

> On a [separate project](https://github.com/Tripsy/dashboard.dev), powered by **React / Next.js** you can find a 
> working #FrontEnd interface which demonstrate the usability of the `authentification system` and 
> an **Administration Dashboard** with some features already included: Users, Permissions, Template,
> Logs for data, mail queue, entity operations

# 🚀 Tech Stack

- Runtime: Node.js
- Framework: Express.js
- Database: PostgresSQL, MariaDB
- Language: TypeScript
- Security: Helmet, CORS, rate limiting, input validation (powered by Zod), JWT tokens, bcrypt hashing
- Logging: Pino (destinations: file, email, database)
- Containerization: Docker
- Testing: Jest, Supertest

# ⚙️ Characteristics

- [x] Ready-to-use boilerplate with a modular, feature-based architecture
- [x] Best Practices: Clean architecture, TypeScript, error handling, async patterns, DRY, SOLID, KISS
- [x] Security: Helmet, rate limiting, input validation, CORS
- [x] Logging (powered by Pino) to a file, db, or email
- [x] Request validation (powered by Zod)
- [x] Standardized JSON Responses: Consistent response structures for better frontend integration (e.g.: res.locals.output)
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
- [x] brand: create, read, update, delete, restore, find
- [x] carrier: create, read, update, delete, restore, find
- [x] cash-flow: create, read, update, delete, find, statusUpdate
- [x] category: create, read, update, delete, restore, find, statusUpdate
- [x] client: create, read, update, delete, restore, find, statusUpdate
- [x] discount: create, read, update, delete, restore, find
- [ ] image:
- [ ] invoice:
- [ ] order:
- [ ] order-shipping:
- [x] place: create, read, update, delete, restore, find
- [ ] product:
- [ ] subscription:
- [ ] term:

# 🛠 Setup

### 1. Add `hosts` record
For configuration refer to this guide:  
[How to Edit the Host File on macOS](https://phoenixnap.com/kb/mac-hosts-file)

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

For PostgreSQL only

 ```sql
CREATE SCHEMA IF NOT EXISTS system;
CREATE SCHEMA IF NOT EXISTS logs;
```  

Run the following commands to create the required database schemas:

```
$ pnpm run migration:run
```

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

```bash
// Generate migration file
$ pnpm run migration:generate /var/www/html/src/database/migrations/init

// Run new migrations - update DB structure
$ pnpm run migration:run

// Revert last migration
$ pnpm run migration:revert

// Reset database
$ pnpx tsx ./node_modules/typeorm/cli.js schema:drop -d src/config/data-source.config.ts

// Import seed data
$ pnpx tsx /var/www/html/src/features/template/database/template.seed.ts  
$ pnpx tsx /var/www/html/src/features/permission/database/permission.seed.ts

// Run tests
$ pnpm run test --testTimeout=60000
$ pnpm run test account.functional.ts --testTimeout=60000 --detectOpenHandles
$ pnpm run test account.unit.ts --detect-open-handles

// Code sanity
$ pnpm run biome
$ pnpm run madge

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
│   │   ├── listeners/     # Core event listeners
│   │   ├── locales/       # Shared language
│   ├── templates/         # Email layout templates
│   └── tests/             # Jest & Supertest tests
│   └── types/             # Global/shared TypeScript types
│   └── workers/           # Background workers
│   └── app.ts          
│   └── bootstrap.ts          
│   └── server.ts          
├── .env
├── .madgerc
├── biome.json
├── docker-compose.yml
├── package.json
├── pnpm-lock.yaml
├── jest.config.js
└── tsconfig.json
```

# 📌 TODO

1. Deploy on AWS
2. API documentation
    > done for discounts
    > do for: account, category, carrier, cash-flow, client, cron-history, log-history, mail-queue, permission, place, template, user-permission
3. create CLI script which should generate something like:
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
4. Tests for account-recovery.service.ts are missing 
5. feature - images  (image-content)
6. Go on FE → category, place, brand, client
7. Go on FE #3 → image (multer - File upload handling)
8. wip entities:
    - article
        - article-category
        - article-content
        - article-tag  
        - article-track
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
    - term
9. Go on FE #2 → carrier, discount,
10. For reporting create separate DB table (in a new schema `reporting`). This new table can be updated via subscribers.
11. cron hanging / delaying / semaphore 

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
- [madge](https://github.com/pahen/madge) — Helps finding circular dependencies
- [mailtrap](https://github.com/mailtrap/mailtrap-nodejs) — Mailtrap client for Node.js
- [biome](https://biomejs.dev/) — Biome is a fast formatter for JavaScript, TypeScript, JSX, TSX, JSON, HTML, CSS and GraphQL 