---
title: 'TODO: Nest tokenizer package under compiler'
priority: Medium
effort: 1-2d
created: 2026-03-31
status: Open
completed: null
---

# TODO: Nest tokenizer package under compiler

## Problem Description

`packages/tokenizer` is now effectively a compiler-internal package.

Current state:
- tokenizer exists as a top-level Nx package beside `packages/compiler`
- most of its consumers are compiler-owned or compiler-adjacent
- the parser/compiler boundary has already been tightened so tokenizer is no longer a general-purpose shared parsing layer

Why this is a problem:
- the repository structure still suggests tokenizer is a peer product rather than a compiler subpackage
- parser/compiler ownership is conceptually split across sibling packages even though tokenizer now exists mainly to support compiler internals
- future compiler-internal refactors still have to cross a top-level package boundary that no longer reflects the architecture

## Proposed Solution

Move tokenizer under the compiler package by introducing a nested package layout, for example:

- `packages/compiler/packages/tokenizer`

High-level approach:
- move tokenizer source, build config, and package metadata under `packages/compiler/packages/`
- keep the public import surface stable only where it is still genuinely needed
- update Nx project configuration, aliases, and package references to the new nested location

Breaking internal APIs and workspace structure is acceptable here if it leads to a cleaner architecture. The software is not released yet, so compatibility should not preserve an awkward package boundary.

## Anti-Patterns

- Do not keep two tokenizer packages alive in parallel longer than needed.
- Do not leave compatibility shims everywhere and then call the migration complete.
- Do not treat this as a simple path rename without updating Nx project ownership and package metadata.
- Do not move parsing behavior back into `packages/compiler/src`; tokenizer should stay a distinct subpackage, not dissolve back into compiler source.

## Implementation Plan

### Step 1: Move the package
- Create the nested package location under `packages/compiler/packages/`
- Move tokenizer `src/`, config, and package metadata there
- Preserve build/test behavior during the move

### Step 2: Update workspace wiring
- Update Nx project configuration and any affected target names
- Update TypeScript path aliases and package entry points
- Fix compiler/editor imports to the new location

### Step 3: Remove stale top-level assumptions
- Remove references that still assume tokenizer is a top-level sibling package
- Update docs and package guidance that describe the old structure
- Make package ownership explicit in any relevant `AGENTS.md` or package docs

### Step 4: Verify consumers
- Verify compiler builds and tests against the nested package
- Verify editor-state and other direct tokenizer consumers still resolve correctly

## Validation Checkpoints

- `rg -n "@8f4e/tokenizer|packages/tokenizer" .`
- `npx nx run @8f4e/tokenizer:build --skipNxCache`
- `npx nx run @8f4e/compiler:typecheck --skipNxCache`
- `npx nx run @8f4e/compiler:test --skipNxCache`

## Success Criteria

- [ ] Tokenizer lives under `packages/compiler/packages/` instead of as a top-level package.
- [ ] Nx and TypeScript path resolution work with the nested package layout.
- [ ] Compiler and editor consumers still build and test successfully.
- [ ] Repository docs no longer describe tokenizer as a top-level sibling package.

## Affected Components

- `packages/tokenizer/` - current package location
- `packages/compiler/` - new parent package scope
- workspace/Nx config referencing the tokenizer project
- TypeScript/Vite alias configuration that references `@8f4e/tokenizer`

## Risks & Considerations

- **Workspace wiring**: nested Nx package layout may require careful config updates.
- **Import churn**: even if the package name stays the same, many repo references to the old path may need cleanup.
- **Tooling assumptions**: scripts, docs, and tests may still assume tokenizer is top-level.

## Notes

- This is an architectural/package-layout refactor, not a parser behavior change.
- The goal is to make the repository structure reflect the ownership boundary that already exists in code.
