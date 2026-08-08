---
paths:
  - "src/exceptions/**/*.ts"
  - "src/middleware/error-handler.middleware.ts"
  - "src/middleware/not-found-handler.middleware.ts"
  - "src/helpers/async.handler.ts"
  - "src/helpers/system.helper.ts"
  - "src/shared/abstracts/controller.abstract.ts"
---

# Error Handling Protocol

**Scope:** Throwing, catching, logging, and formatting errors across the request lifecycle.

## 1. Core Philosophy

- **Throw, don't return.** An error condition is expressed by `throw`ing an `Error` (almost always a `CustomError` subclass), never by returning `{ error: ... }` from a service or controller.
- **One place formats errors.** `errorHandler` (`src/middleware/error-handler.middleware.ts`), registered last in `app.ts`, is the only place that turns a thrown error into an HTTP response. Don't `try`/`catch` an error in a controller just to reformat and `res.json()` it yourself — let it propagate.
- **HTTP status lives on the error, not at the throw site.** `CustomError` carries its own `statusCode`; callers never pass a status code to `res.status()` when handling a thrown error — `errorHandler` reads it off `err.statusCode`.

## 2. CustomError Hierarchy

All HTTP-facing errors extend `CustomError` (`src/exceptions/custom.error.ts`), which fixes a `statusCode` (from the `HttpStatusCode` union: 200/201/204/400/401/403/404/406/409/422/425/429/500) and a `message`.

| Class | Status | Use for |
|---|---|---|
| `BadRequestError` | 400 | Malformed/inconsistent request that isn't a schema failure (e.g. missing token on logout) |
| `UnauthorizedError` | 401 | Not authenticated / bad credentials |
| `NotAllowedError` | 403 | Authenticated but forbidden (permission denied, `notAuth()` violation) |
| `NotFoundError` | 404 | Entity/resource doesn't exist (or is soft-deleted and shouldn't be visible) |
| `UnprocessableContentError` | 422 | Schema validation failed (thrown internally by `BaseController.validate()`) |
| `new CustomError(statusCode, message)` | any | One-off codes not covered above — e.g. `409` (conflict, duplicate email), `425` (rate-limited recovery attempts), `406` (token verification failure) |

- Every subclass constructor takes an optional `message?: string` and falls back to a `lang('shared.error.*')` translation — always pass a feature-specific translated message (`lang('account.error.not_found')`) when you have one; only rely on the generic default when there's no more specific message to give.
- `UnauthorizedError` and `NotAllowedError` only reveal their real message when `Configuration.get('app.debug')` is on; otherwise they fall back to the generic translation regardless of what was passed in. Don't rely on a custom message reaching the client for these two in production.

## 3. Import Path

`@/exceptions` (the barrel `index.ts`) re-exports every error class — `BadRequestError`, `CustomError`, `NotAllowedError`, `NotFoundError`, `UnauthorizedError`, `UnprocessableContentError`, and `ModuleError`. Always import from the barrel (`@/exceptions`), never from a class's specific file path.

`ModuleError` is **not** an HTTP error (no `statusCode`) — it's for internal module/bootstrap failures (`cron.provider.ts`, `init-websocket.setup.ts`, `listeners.setup.ts`). Never throw it from a controller, service, or policy.

## 4. `asyncHandler` Is Mandatory

Every controller action must be wrapped in `asyncHandler` (`src/helpers/async.handler.ts`):

```typescript
public create = asyncHandler(async (req: Request, res: Response) => {
  // ...
});
```

It does `fn(req, res, next).catch(next)` — without it, a rejected promise inside the action becomes an unhandled rejection instead of reaching `errorHandler`.

## 5. Repository-Level 404s

**Do not null-check the result of a `firstOrFail()`-backed finder.** `userService.findById` returns `Promise<UserEntity>`, not `Promise<UserEntity | null>` — an `if (!user) throw new NotFoundError(...)` after it is unreachable, and the 404 it appears to produce actually comes from the repository with a `<entity>.error.not_found` message. Five such guards accumulated in `account.controller.ts` after `findById` was switched to `firstOrFail()` and were removed. If a call site needs a nullable result, use a `.first()`-backed finder instead of defending against an impossible one.

## 6. Validation Errors Are a Distinct Path

`BaseController.validate()` (`src/shared/abstracts/controller.abstract.ts`) already writes zod issues to `res.locals.output.errors(...)` and throws `UnprocessableContentError` on failure — or `BadRequestError` when `sourceData` itself is falsy. Don't catch or duplicate this — call `this.validate(...)` and let it throw (see `validation.md`).

## 7. 5xx Messages Are Masked Outside Debug

`errorHandler` replaces the message of **every** `>= 500` response with the generic `shared.error.server_error` unless `app.debug` is on. This covers both unplanned throws (TypeORM driver errors, `TypeError`, failed JSON parses — whose messages leak SQL fragments, column names and file paths) and deliberate `new CustomError(500, ...)`, whose messages describe internal repository state.

Consequences to design around:
- **Never rely on a 5xx message reaching the client.** If the user needs to act on a failure, it is a 4xx — model it as one (`BadRequestError`, `NotFoundError`, `CustomError(409, ...)`), don't throw a 500 with a helpful string.
- 4xx messages pass through untouched, so that is where feature-specific `lang('<feature>.error.*')` text belongs.
- Masking is response-shaping only — the real error is still logged in full (see §8). Debug it from the logs, not the response body.

## 8. Logging Behavior

`errorHandler` logs conditionally:
- Skips logging entirely for status `400`, `401`, `403`, `404`, `409` **unless** `app.debug` is enabled or the environment is `test`.
- `401` logs at `warn`; everything else logs at `error`.

This means expected flows (validation failures, permission denials, not-found lookups) are silent in production logs by design — if you need production visibility into a specific 4xx case, log explicitly in the service/controller rather than assuming `errorHandler` will surface it.

## 9. Never `void` a Promise

`server.ts` listens for `unhandledRejection` and responds by calling `shutdown()`. A bare `void somePromise()` therefore isn't a harmless "don't await" — it is a way for a failed background side effect to take the entire API down. A broken mail template, a Redis blip during a cache purge, an unwritable history row: any of them would stop the server.

Use `runInBackground(promise, context)` from `@/helpers/background.helper`, which catches and logs instead:

```typescript
runInBackground(
  this.accountEmailService.sendWelcomeEmail(user),
  `Failed to send the welcome email to user #${user.id}`,
);
```

- Prefer `await` when the caller is already async and *its* caller treats the whole thing as background work: handle the rejection once at the top rather than at each inner call (`account-email.service.ts` awaits `queueEmail` for this reason).
- An `async` event listener is the same trap in disguise — a synchronous `throw` inside it becomes a rejected promise nobody awaits. Keep listeners synchronous with a `try`/`catch`, or wrap the async work in `runInBackground`.

## 10. `getErrorMessage`

Use `getErrorMessage(error: unknown)` (`src/helpers/system.helper.ts`) instead of `error.message` whenever the caught value's type isn't guaranteed to be `Error` — generic `catch` blocks, logger calls, cron/queue/worker error handling. It safely falls back to `String(error)` for non-`Error` throws.
