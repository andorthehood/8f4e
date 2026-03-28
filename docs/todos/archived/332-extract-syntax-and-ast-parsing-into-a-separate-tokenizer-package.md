---
title: 'TODO: Extract source-to-AST parsing into a separate tokenizer package'
priority: Medium
effort: 1-2d
created: 2026-03-27
status: Completed
completed: 2026-03-27
---

# TODO: Extract source-to-AST parsing into a separate tokenizer package

## Problem Description

The compiler currently mixes source-to-AST parsing concerns and semantic/codegen concerns inside the same package. `packages/compiler/src/syntax/` is already a partial boundary, but the rest of the compiler still imports syntax helpers directly and the package structure does not make the ownership line obvious.

That makes it easier for semantic logic to leak back into syntax-layer code and harder to preserve the intended phase boundary:

- syntax and AST construction
- semantic namespace building
- compile-time normalization
- codegen

Extracting source-to-AST parsing into its own sibling package under `packages/` would make the boundary explicit and reduce accidental coupling.

## Proposed Solution

Create a dedicated sibling package under `packages/`, for example `packages/tokenizer`, that owns:

- tokenization
- line parsing
- AST construction
- syntax-only validation
- syntax helper utilities and syntax error types

The main compiler package should then depend on that package and treat its output as parsed AST input, without importing syntax internals ad hoc.

This should happen only after the compile-time refactor todos are complete, so the package extraction follows a real architectural boundary instead of freezing the current mixed design into a new package layout.

## Anti-Patterns

- Extracting syntax code before the compile-time refactor is complete, which would likely preserve current semantic leakage in a new package.
- Moving semantic compile-time folding helpers into the syntax package just because they currently live near parser code.
- Nesting the new parser under `packages/compiler` so the package boundary remains informal.
- Creating a new package that still exports half-semantic convenience helpers.

## Implementation Plan

### Step 1: Finish semantic boundary cleanup first
- Complete the namespace prepass, compile-time normalization, and downstream deletion work so the syntax/semantic boundary is real.
- Confirm which helpers are truly syntax-only.

### Step 2: Define the new package surface
- Create the new sibling package and decide what it exports:
  - AST types
  - parser entry points
  - syntax-only helper predicates/extractors
  - syntax errors
- Keep semantic and codegen helpers out of that surface.

### Step 3: Move code and update imports
- Extract `source -> AST` code from `packages/compiler` into the new `tokenizer` package.
- Update `packages/compiler` to consume that package through a clear public API.
- Keep tests with the owning package or move them intentionally with the syntax code.

## Validation Checkpoints

- `rg -n "from './syntax|from '../syntax|from '@8f4e/compiler/syntax'" packages/compiler`
- `npx nx run-many --target=test --projects=@8f4e/compiler`
- `npx nx run-many --target=typecheck --all`

## Success Criteria

- [ ] Source-to-AST parsing lives in a dedicated sibling package under `packages/`
- [ ] The main compiler package depends on parsed AST input instead of syntax internals
- [ ] Semantic compile-time folding does not live in the syntax package
- [ ] Tests and docs reflect the new package boundary

## Affected Components

- `packages/tokenizer/` (new)
- `packages/compiler/src/syntax/`
- `packages/compiler/src/compiler.ts`
- `packages/compiler/src/index.ts`
- workspace package configuration for the new parser package

## Risks & Considerations

- **Risk**: Extracting too early will preserve the wrong boundary and force a second refactor later.
- **Risk**: AST type ownership may need to move with the parser package, which can touch many imports.
- **Dependency**: Should follow 329, 330, and 331.

## Related Items

- **Depends on**: 329, 330, 331
- **Related**: 301

## Notes

- This is a package-boundary cleanup, not a language feature.
- The goal is to make `source -> AST` a separate package-level responsibility, not just a folder inside the compiler.
