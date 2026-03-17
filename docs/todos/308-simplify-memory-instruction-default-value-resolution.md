---
title: 'TODO: Simplify memory instruction default value resolution'
priority: Medium
effort: 4-8h
created: 2026-03-14
status: Open
completed: null
---

# TODO: Simplify memory instruction default value resolution

## Problem Description

Memory instruction argument handling is now split between a syntax-phase classifier and a semantic-phase resolver, but the semantic side still carries a long branch ladder with repeated lookup logic and several no-op cases.

Current behavior:
- [packages/compiler/src/syntax/memoryInstructionParser.ts](packages/compiler/src/syntax/memoryInstructionParser.ts) classifies argument shapes in detail
- [packages/compiler/src/utils/memoryInstructionParser.ts](packages/compiler/src/utils/memoryInstructionParser.ts) then:
  - resolves anonymous ids
  - resolves split-byte defaults
  - performs repeated memory lookups for `memory-reference` and `element-count`
  - contains a long `if/else` chain over `parsedArgs.secondArg.type`
  - carries several branches that intentionally do nothing for intermodular references

Why this is a problem:
- the control flow is harder to read than the actual semantics require
- repeated lookup/error logic increases maintenance cost
- it is easy to miss new shape types or let syntax and semantic handling drift apart

## Proposed Solution

Refactor semantic memory argument resolution into smaller helpers keyed off the syntax-level shape.

High-level approach:
- keep the existing syntax/semantic split
- introduce helpers such as:
  - `resolveAnonymousOrNamedMemoryId(...)`
  - `resolveMemoryDefaultValue(...)`
  - `getMemoryItemOrThrow(...)`
- replace the large branch ladder with a narrower dispatch flow

Recommended behavior:
- syntax-only concerns remain in `packages/compiler/src/syntax/`
- semantic lookups and compiler errors remain in `packages/compiler/src/utils/`
- intermodular-reference shapes that intentionally resolve later should be grouped clearly rather than repeated as separate empty branches

## Anti-Patterns

- Do not move semantic memory lookups back into the syntax parser.
- Do not collapse syntax and semantic error domains together.
- Do not change how split-byte constants, memory references, or element counts are interpreted as part of this cleanup.

## Implementation Plan

### Step 1: Extract semantic helpers
- Add small helpers for:
  - anonymous id/default resolution
  - memory item lookup with `UNDECLARED_IDENTIFIER`
  - second-argument default value resolution
- Keep each helper focused on one semantic concern

### Step 2: Replace the long second-argument branch ladder
- Group no-op deferred intermodular shapes together
- Route resolvable shapes through one shared resolver
- Remove repeated memory lookup/error code blocks

### Step 3: Clarify shape ownership
- Ensure syntax shape classification remains the single source of truth for argument kinds
- Keep semantic resolution limited to compiler-state-dependent behavior
- Review naming so the flow is obvious from parser to resolver

### Step 4: Add regression tests
- Cover:
  - literal defaults
  - split-byte defaults
  - constant-backed defaults
  - memory-reference defaults
  - element-count defaults
  - undeclared memory identifiers

## Validation Checkpoints

- `rg -n "parseMemoryInstructionArgumentsShape|memory-reference|element-count|split-byte" packages/compiler/src`
- `npx nx run compiler:test`
- `npx nx run compiler:typecheck`

## Success Criteria

- [ ] Semantic memory default resolution no longer depends on one large `if/else` chain.
- [ ] Repeated memory lookup and undeclared-identifier handling is centralized.
- [ ] Syntax/semantic error boundaries stay intact.
- [ ] Existing memory argument behavior remains unchanged.
- [ ] Regression tests cover the main resolved shape families.

## Affected Components

- `packages/compiler/src/utils/memoryInstructionParser.ts` - main refactor target
- `packages/compiler/src/syntax/memoryInstructionParser.ts` - upstream shape classifier that should remain the source of truth
- `packages/compiler/src/compilerError.ts` - reused semantic error paths
- `packages/compiler/src/syntax/syntaxError.ts` - related syntax error boundary

## Risks & Considerations

- **Boundary erosion**: this refactor must preserve the repo’s documented separation between syntax errors and semantic compiler errors.
- **Shape coverage**: every current `MemoryArgumentShape` variant must still be handled explicitly, even if some are deferred.
- **Regression risk**: memory declaration parsing touches a broad part of the compiler surface and needs tight test coverage.

## Related Items

- **Related**: `docs/todos/290-add-constants-to-split-byte-memory-defaults-and-reserve-constant-style-identifiers.md`
- **Related**: `docs/todos/292-refactor-error-systems-and-document-syntax-vs-compiler-error-boundaries.md`

## Notes

- This is mainly a maintainability refactor, with a small secondary benefit in reducing repeated semantic checks.
- The current two-phase structure is good; the goal is to make the semantic phase as structured as the syntax phase.
