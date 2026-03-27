---
title: 'TODO: Delete duplicate downstream compile-time resolution paths'
priority: High
effort: 4-8 hours
created: 2026-03-27
status: Open
completed: null
---

# TODO: Delete duplicate downstream compile-time resolution paths

## Problem Description

Even after namespace prepass and AST normalization exist, the compiler will still not be properly refactored until the old resolution paths are deleted. Right now compile-time logic is still spread across:

- `push` identifier routing
- declaration/default parsing helpers
- `const`, `init`, `skip`, `map`, `default`, and other instruction compilers
- parser fallback logic that protects expression-shaped identifiers

As long as these remain active, the codebase has two owners for the same concept.

## Proposed Solution

After 329 and 330 are complete, remove the downstream paths that still resolve compile-time expressions. Post-normalization code should expect literals in supported value positions and only handle:

- plain literals
- genuine runtime identifiers
- intentionally deferred symbolic forms

The result should be a net code deletion refactor.

## Anti-Patterns

- Keeping old resolver helpers “just in case” after normalization is trusted.
- Leaving `push` special-casing for compile-time expressions after those expressions already fold earlier.
- Retaining parser exceptions whose only job was to support the old distributed resolution model.

## Implementation Plan

### Step 1: Delete duplicate routing from instruction compilers
- Remove compile-time expression detection from `push` routing.
- Simplify instruction compilers that currently accept identifier-shaped compile-time values once normalization guarantees literals there.

### Step 2: Simplify memory/default helpers
- Reduce or remove compile-time expression resolution from memory instruction parsing when those values are already normalized.
- Keep only the truly deferred cases such as intermodule references that are resolved later by design.

### Step 3: Remove obsolete parser accommodations
- Delete parser exceptions that only exist to let mixed compile-time expressions survive until later phases.
- Re-evaluate whether `parseConstantMulDivExpression` remains a standalone public helper or becomes an internal normalization detail.

## Validation Checkpoints

- `rg -n "isCompileTimeValueOrExpression|tryResolveConstantValueOrExpression|resolveConstantValueOrExpressionOrThrow" packages/compiler/src`
- `git diff --stat` should show net code deletion in the downstream layers
- `npx nx run compiler:test`
- `npx nx run @8f4e/cli:test`

## Success Criteria

- [ ] Compile-time expression ownership is no longer duplicated across downstream instruction compilers
- [ ] `push` no longer needs compile-time expression routing
- [ ] Memory/default helpers are shorter and only handle genuinely deferred cases
- [ ] Net code in the downstream resolution path is reduced, not increased

## Affected Components

- `packages/compiler/src/instructionCompilers/push/resolveIdentifierPushKind.ts`
- `packages/compiler/src/utils/memoryInstructionParser.ts`
- `packages/compiler/src/instructionCompilers/*.ts`
- `packages/compiler/src/syntax/parseArgument.ts`

## Risks & Considerations

- **Risk**: Removing a downstream path before normalization covers that case will cause regressions.
- **Risk**: Some deferred forms may look like compile-time values but still need later-phase resolution.
- **Dependency**: Must happen only after 329 and 330 are complete and verified.

## Related Items

- **Depends on**: 329, 330
- **Related**: 308, 328

## Notes

- This is the step that makes the refactor real. If this deletion step does not happen, the compiler remains in a half-migrated state.
