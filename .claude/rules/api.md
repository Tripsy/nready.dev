---
paths:
  - "src/app.ts"
  - "src/config/routes.setup.ts"
  - "src/config/rate-limit.config.ts"
  - "src/features/**/*.routes.ts"
  - "src/features/**/*.controller.ts"
  - "src/middleware/output-handler.middleware.ts"
  - "src/middleware/validate-params.middleware.ts"
  - "src/shared/abstracts/controller.abstract.ts"
---

# API Protocol

**Scope:** Express app setup, route registration, controller structure, response format.

## 1. Core Philosophy

- **One response envelope, everywhere.** Every JSON response — success or error — goes through `res.locals.output` (an `OutputWrapper`, set by `outputHandler` middleware). Never `res.json({...})` with a hand-built object.
- **Thin controllers.** A controller action does exactly four things in order: authorize (`this.policy.canX(...)`), validate (`this.validate(...)`), delegate to the service, write the output. Business logic belongs in `*.service.ts`, not the controller.
- **No API version prefix.** Routes are plain (`/products`, `/account/login`, ...) — do not invent `/api/v1/...` prefixes; none exist in this codebase.

## 2. Response Envelope

`res.locals.output` (`OutputWrapper`, `src/middleware/output-handler.middleware.ts`) exposes:

- `.data(value, key?)` — result payload; merges under `key` if given, otherwise replaces the whole `data` object.
- `.message(value)` — message string (always via `lang('<feature>.success.*' | '<feature>.error.*')`).
- `.errors(value)` — zod issues or custom error objects (used by validation failures).
- `.meta(value, key?)` — auxiliary metadata (e.g. `isCached`, pagination hints).
- `.raw(filter?)` / `.toJSON()` — called implicitly by `res.json(res.locals.output)`. It auto-sets `success: true` for 2xx status codes and strips empty `errors`/`data`/`meta`.

A controller action ends with `res.json(res.locals.output)` — never manually construct `{ success, data, ... }`.

**Messages are English-only.** `lang()` resolves against `en.json` and nothing else — the client receives finished English text, not a key. The frontend displays it verbatim (falling back to its own generic copy where it prefers to). Never build a response message by concatenating strings or reading `res.locals.language`.

**The echoed `request` block is debug-only.** `raw()` drops `request` entirely unless `app.debug` is on, because `request.headers` carries the `Authorization` bearer token and the cookie jar. Never re-add an unconditional echo of request data, and don't rely on `request` being present in a response.

## 3. Status Codes

- `create` actions: `res.status(201).json(res.locals.output)`.
- Everything else: plain `res.json(res.locals.output)` (defaults to 200).
- Non-2xx outcomes are expressed by **throwing** a `CustomError` subclass (see `error-handling.md`), not by manually calling `res.status(4xx)` — the one exception is deliberate soft-failures like the "too many active sessions" case in `account.controller.ts`, which sets `res.status(403)` directly because it still returns a normal (non-error) payload.

## 4. Controller Structure

```typescript
class ProductController extends BaseController {
  constructor(
    private policy: ProductPolicy,
    private validator: ProductValidator,
    private cache: CacheProvider,
    private productService: ProductService,
  ) {
    super();
  }

  public create = asyncHandler(async (req: Request, res: Response) => {
    this.policy.canCreate(res.locals.auth);

    const data = this.validate(this.validator.create, req.body, res);

    const entry = await this.productService.create(data);

    res.locals.output.data(entry);
    res.locals.output.message(lang('product.success.create'));

    res.status(201).json(res.locals.output);
  });
}

export const productController = new ProductController(
  productPolicy,
  new ProductValidator('product'),
  cacheProvider,
  productService,
);
```

- Extend `BaseController`, inject dependencies (policy, validator, service, and anything else the feature needs — cache provider, other services) via the constructor.
- Every action is a class-field arrow function wrapped in `asyncHandler(...)` (`src/helpers/async.handler.ts`) — this forwards rejected promises to Express's error pipeline. An action not wrapped in `asyncHandler` will crash the process instead of returning an error response.
- Export a singleton instance at the bottom of the file (`export const productController = new ProductController(...)`), constructed with the feature's real policy/validator/service singletons.

## 5. Route Files

Every feature with HTTP endpoints has a `<feature>.routes.ts` that default-exports an **async factory** (routes are auto-discovered by scanning `**/*.routes.ts` under `src/features/`, see `src/config/routes.setup.ts`):

```typescript
export default async () => {
  const { productController } = await import('@/features/product/product.controller');

  const config: FeatureRoutesModule<typeof productController> = {
    basePath: '/products',
    controller: productController,
    routes: {
      create: { path: '', method: 'post' },
      read: { path: '/:id', method: 'get', handlers: [validateParamsWhenId('id')] },
      update: { path: '/:id', method: 'put', handlers: [validateParamsWhenId('id')] },
    },
  };

  return config;
};
```

- Lazy-import the controller inside the factory (`await import(...)`) — don't import it at module top-level, this keeps route registration decoupled from full controller instantiation order.
- `basePath` + each route's `path` form the full URL; `method` is one of `get`/`post`/`put`/`delete`/`patch`.
- `handlers` is an array of extra middleware run **before** the controller action — mainly the param pre-checks from `validate-params.middleware.ts` (`validateParamsWhenId`, `validateParamsWhenEnum`; see `validation.md` §6) and/or a specific rate limiter.
- A rate limiter is auto-attached to every route: if none of `handlers` is a function whose name ends in `RateLimiter`, `buildRoutes()` appends the default `apiRateLimiter`. For sensitive auth flows, pass `authLoginRateLimiter` / `authDefaultRateLimiter` explicitly instead (see `auth.md`).

## 6. Global Middleware Order (`src/app.ts`)

Don't reorder this chain without a specific reason — later middleware depends on earlier ones (`outputHandler` before anything that reads `res.locals.output`; `authMiddleware` before any route needs `res.locals.auth`):

`helmet` → `corsHandler` → `compression` → body parsers (`cookie-parser`, `express.json({limit:'10mb'})`, `express.urlencoded`) → request-id → request-timeout → `outputHandler` → `languageMiddleware` → `authMiddleware` → `requestContextMiddleware` → feature routes → `/health`, `/ready` → `notFoundHandler` → `errorHandler`.

- `languageMiddleware` sets `res.locals.language`, which selects **content** language (brand/address/place/template entries, email rendering) — it has no effect on response messages, which are English-only (see §2).
- `authMiddleware` is skipped when `Configuration.isEnvironment('test')` — auth is never real in tests (see `testing.md`).
- `/health` and `/ready` are defined directly in `app.ts`.
