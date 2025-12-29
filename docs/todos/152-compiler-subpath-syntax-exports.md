---
title: 'TODO: Export Syntax Helpers via Compiler Subpath'
priority: Medium
effort: 1-2d
created: 2025-12-29
status: Open
completed: null
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

- [ ] `@8f4e/compiler/syntax` can be imported without bundling the compiler entrypoint
- [ ] Syntax helpers remain independently testable
- [ ] `@8f4e/editor-state` uses syntax helpers without a compiler dependency

## Affected Components

- `packages/compiler` - New syntax subpath entrypoint and exports
- `packages/editor/packages/editor-state` - Import path updates
- `packages/syntax-rules` - Merge or migration path into compiler

## Risks & Considerations

- **Bundling risk**: Accidental imports from compiler entrypoint can pull the whole bundle
- **Build output**: Ensure compiler build emits separate `dist/syntax` artifacts
- **Breaking changes**: Consumers must update import paths

## Related Items

- **Related**: docs/todos/149-extract-syntax-parsing-and-errors-into-syntax-rules.md

## Notes

- Goal is to merge syntax helpers into compiler while preserving lightweight consumption via subpath exports
