---
title: Config packages and self-contained packages
date: 2025-11-24
---

## Context

We have multiple packages (Nx workspace) that each carry their own tool configs (TypeScript, ESLint, Vite, Vitest, etc.). This keeps things explicit per package, but in practice it has already led to a lot of redundancy (similar `tsconfig.json` and `vite.config.*` files repeated across packages) and makes it harder to evolve shared conventions consistently. A common solution that often comes up (and that many developers pick by default) is to centralize configs at the repo root and have packages extend them, but here we are explicitly weighing that approach against dedicated config packages because of the desire for more self-contained packages.

## Problem

- Packages are not fully self-contained when they reach into `../../tsconfig.*.json`, root ESLint configs, or root Vite/Vitest presets.
- Moving a package out of the monorepo (or into another monorepo) requires rewiring all those relative paths and assumptions about the root.
- Extending root configs means the *shape of the repository* is an implicit dependency, which is brittle over time.

## Idea: a single dedicated config package

Introduce a single `@8f4e/config` package that holds our shared build/test/tooling configuration, with internal entrypoints for each tool we actively use:

- `@8f4e/config/ts` for base/app/lib/test `tsconfig` templates or helpers.
- `@8f4e/config/eslint` for shared rule sets and config composition helpers.
- `@8f4e/config/vite` and `@8f4e/config/vitest` for shared Vite/Vitest setup.
  - Jest is considered deprecated in this codebase (e.g. in `glugglug`) and will be migrated to Vitest, so we do not plan a dedicated Jest config entry.

Each feature/package would keep tiny local config entrypoints (for tool discovery and editor support) that import from this package:

- `tsconfig.json` extends JSON from `@8f4e/config/ts` or references its helper configs.
- `eslint.config.mjs` imports shared rule sets from `@8f4e/config/eslint`.
- `vite.config.ts` and `vitest.config.ts` import and spread shared configs from `@8f4e/config/vite` / `@8f4e/config/vitest`.

Only **shared/common defaults** (things we genuinely want to be the same everywhere) should live in `@8f4e/config`. Package-specific behavior (custom aliases, special environments, bespoke include/exclude patterns, etc.) should stay in each package's own config wrapper so packages remain understandable and independently tweakable.

## Why this helps

- **Self-contained packages**: A package depends on `@8f4e/config` through `node_modules`, not on `../../` paths or repo-specific layout. Copying the package + config package into another repo is straightforward.
- **Explicit dependency**: Tooling assumptions become explicit `package.json` dependencies rather than hidden filesystem relationships.
- **Aligned versioning (no juggling)**: We evolve all configs together via a single semantic version for `@8f4e/config`, explicitly avoiding the complexity of juggling multiple separate `@8f4e/config-*` package versions.
- **Cross-repo reuse**: Other repos can adopt the same configs by installing `@8f4e/config`, without needing the rest of this monorepo.

## Tradeoffs / considerations

- **Indirection when debugging**: Developers must look into `@8f4e/config-*` to understand why a rule or setting exists, instead of reading a single local config file.
- **Still need lightweight local configs**: Tools like TS/ESLint/Vite expect config files in the project tree. We keep these as thin wrappers that import/extend from the config packages.
- **Root configs still useful**: The repo root will likely still have minimal configs (for Nx and root-level tooling) that themselves depend on the config packages for consistency.

## Open questions

- How important is it for us (in practice) to lift individual packages into other repos or publish them as independent packages?
- Do we want to version config changes separately from application code changes?
- How much indirection are we comfortable adding to everyday config debugging?
