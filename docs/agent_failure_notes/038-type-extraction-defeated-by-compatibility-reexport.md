---
title: Agent Failure Note - Type extraction defeated by compatibility re-export
agent: Codex App Version 26.422.71525 (2210)
model: GPT-5.5 (High)
date: 2026-04-30
---

# Agent Failure Note - Type extraction defeated by compatibility re-export

## Short Summary

The agent correctly identified that type-only consumers should depend on a separate type package, but then preserved type re-exports from the original runtime package. That kept the original package in the dependency path and failed to solve the Nx cache invalidation problem the refactor was meant to address.

## Original Problem

Many packages depended on package A only because they needed interfaces exported from package A. Nx saw those imports as real project dependencies, so changing package A caused those packages to rebuild, retest, and release even when package A's public type contracts had not changed.

The intended fix was to move those stable type interfaces into a separate package. Former type-only consumers should import from the new type package directly, so changing runtime implementation in package A does not invalidate unrelated dependents.

The agent extracted the types, but also kept compatibility re-exports from package A:

```ts
// wrong direction
export type * from '@8f4e/editor-state-types';
```

That preserved the old import path and therefore preserved the old dependency shape for any consumer still importing types from package A. The implementation appeared migrated, but the architectural goal was not achieved.

## Anti-Patterns

- Preserving compatibility paths when the software has not been released and there is no compatibility requirement.
- Treating type extraction as complete because files moved, instead of verifying that consumers no longer depend on the runtime package for types.
- Optimizing for lower call-site churn while ignoring the stated Nx dependency graph problem.
- Keeping package A as a facade over the new type package, which makes the new package an implementation detail instead of the source of truth.
- Validating only TypeScript correctness instead of validating the project graph and affected-task behavior.

## Failure Pattern

Solving the code organization symptom while preserving the dependency edge that caused the build, test, and release invalidation problem.

## Correct Solution

The new type package must be the direct source of truth for shared interfaces:

1. Move stable type declarations into the type package.
2. Update all former type-only consumers to import from the type package directly.
3. Remove compatibility re-exports from the original runtime package.
4. Keep runtime values and runtime helpers in the runtime package.
5. Verify the Nx graph or affected output to confirm type-only consumers no longer depend on the runtime package.

Compatibility bridges are only appropriate when preserving a released public API is more important than changing the dependency graph. In this repository, the package was not released yet, so the bridge was unnecessary and harmful.
