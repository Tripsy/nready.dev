---
paths:
  - "**/*.ts"
---

# TypeScript Conventions

**Scope:** Language-level conventions, type design, and lint rules — the baseline for every `.ts`
file in the repo. For the conventions of a specific subsystem, see the narrower sibling rules
(`api.md`, `auth.md`, `database.md`, `error-handling.md`, `validation.md`, `testing.md`), which
layer on top of this one.

# JavaScript Best Practices

- Use `const` for all variables that aren't reassigned, `let` otherwise
- Don't use `await` in return statements (return the Promise directly)
- Always use curly braces for control structures, even for single-line blocks
- Prefer object spread (e.g. `{ ...args }`) over `Object.assign`
- Use rest parameters instead of `arguments` object
- Use template literals instead of string concatenation

## Code Organization

- Document complex types with JSDoc comments
- Use `src/shared/types/*.type.ts` files for shared types
- Use `src/helpers` directory for shared helpers

## TypeScript Configuration
- Strict mode enabled
- No implicit any
- Strict null checks
- ES modules
- Use `// biome-ignore lint` with explanatory comments
- Use `--noEmitOnError` compiler flag to prevent generating JS files when TypeScript errors exist

# Coding Standards

- Use descriptive names for variables and methods (no single letters except loop indices)
- Do not use the non-null assertion operator
- Prefer nullish coalescing (??) over OR (||)
- Use optional chaining (?.) for safe property access
- Prefix unused variables with underscore (e.g., `_unusedParam`)
- Avoid `any` - use `unknown` if type is truly unknown
- Explicitly type function parameters, return types, and object literals.
- Avoid using Enums instead:
```typescript
export const BrandStatusEnum = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
} as const;

export type BrandStatus =
    (typeof BrandStatusEnum)[keyof typeof BrandStatusEnum];
```
- Use `readonly` modifiers for immutable properties and arrays
- Leverage TypeScript's utility types (`Partial`, `Required`, `Pick`, `Omit`, `Record`, etc.)
- Use discriminated unions with exhaustiveness checking for type narrowing
- Prefer type declarations over interfaces unless a real benefit exists
