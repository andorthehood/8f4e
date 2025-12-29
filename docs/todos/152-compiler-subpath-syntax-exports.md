---
title: 'TODO: Export Syntax Helpers via Compiler Subpath'
priority: Medium
effort: 1-2d
created: 2025-12-29
status: Completed
completed: 2025-12-29
---

# TODO: Export Syntax Helpers via Compiler Subpath

## Problem Description

The `@8f4e/syntax-rules` package is planned to be merged into `@8f4e/compiler`, but `@8f4e/editor-state` and other consumers should be able to import syntax-only helpers without bundling the full compiler.

## Proposed Solution

Move syntax-related helpers into a dedicated folder inside the compiler package and expose them via a subpath export so consumers can import `@8f4e/compiler/syntax` without pulling the main compiler entrypoint.

## Implementation Plan

### Step 1: Restructure compiler sources
- Create a `src/syntax/` folder in `packages/compiler`
- Move syntax-only helpers into that folder with a dedicated `src/syntax/index.ts`
- Ensure syntax helpers do not import compiler internals

### Step 2: Add subpath exports
- Update `packages/compiler/package.json` `exports` to include `./syntax`
- Emit `dist/syntax/*` outputs in the compiler build
- Confirm type resolution via `types`/`typesVersions` mappings

### Step 3: Update consumers
- Switch syntax-only imports to `@8f4e/compiler/syntax`
- Ensure `@8f4e/editor-state` and other packages do not import the compiler entrypoint

## Success Criteria

- [x] `@8f4e/compiler/syntax` can be imported without bundling the compiler entrypoint
- [x] Syntax helpers remain independently testable
- [x] `@8f4e/editor-state` uses syntax helpers without a compiler dependency

## Affected Components

- `packages/compiler` - New syntax subpath entrypoint and exports
- `packages/editor/packages/editor-state` - Import path updates
- `packages/syntax-rules` - **Removed** (merged into compiler)

## Risks & Considerations

- **Bundling risk**: Accidental imports from compiler entrypoint can pull the whole bundle
- **Build output**: Ensure compiler build emits separate `dist/syntax` artifacts
- **Breaking changes**: Consumers must update import paths

## Related Items

- **Supersedes**: docs/todos/archived/148-consolidate-syntax-logic-into-syntax-rules.md
- **Supersedes**: docs/todos/archived/149-extract-syntax-parsing-and-errors-into-syntax-rules.md

## Notes

- Goal is to merge syntax helpers into compiler while preserving lightweight consumption via subpath exports
- **Implementation completed on 2025-12-29**:
  - Created `packages/compiler/src/syntax/` directory with all syntax-related files from `@8f4e/syntax-rules`
  - Added `./syntax` subpath export to `packages/compiler/package.json`
  - Updated all internal compiler imports to use local `./syntax/` paths
  - Migrated all `@8f4e/editor-state` imports from `@8f4e/syntax-rules` to `@8f4e/compiler/syntax`
  - Removed `@8f4e/syntax-rules` dependency from both compiler and editor-state packages
  - Added `@8f4e/compiler/syntax` path alias to root `tsconfig.json`
  - Verified that syntax helpers have no dependencies on compiler internals
  - All tests pass for both compiler and editor-state packages
  - Full build successful with proper subpath export resolution in bundler context
  - **Removed `packages/syntax-rules` package entirely** as it's now integrated into compiler
