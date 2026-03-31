---
title: 'TODO: Simplify memory instruction default value resolution'
priority: Medium
effort: 4-8h
created: 2026-03-14
status: Completed
completed: 2026-03-31
---

# TODO: Simplify memory instruction default value resolution

## Problem Description

Memory instruction argument handling is now split between tokenizer-owned syntax classification and compiler-owned semantic resolution, but the semantic side still carries too much branching and repeated lookup/error logic in one place.

Current behavior:
- tokenizer classifies memory-related argument shapes up front
- `packages/compiler/src/utils/memoryInstructionParser.ts` then:
  - resolves anonymous vs named declarations
  - resolves split-byte defaults
  - resolves local memory-reference defaults
  - resolves `count(...)` defaults
  - special-cases constant-style identifiers
  - repeats undeclared-memory lookup/error logic in multiple branches

Why this is a problem:
- the control flow is harder to read than the actual semantics require
- repeated lookup/error logic increases maintenance cost
- it is still easy to miss a new resolved shape or let tokenizer/compiler responsibilities drift apart

## Proposed Solution

Refactor semantic memory default resolution into smaller helpers keyed off the already-classified AST argument shapes.

High-level approach:
- keep the current tokenizer/semantic split intact
- introduce helpers such as:
  - `resolveAnonymousOrNamedMemoryId(...)`
  - `resolveMemoryDefaultValue(...)`
  - `getMemoryItemOrThrow(...)`
- replace the current branch ladder with a narrower dispatch flow over already-classified argument kinds

Recommended behavior:
- tokenizer remains the only owner of syntax parsing/classification
- semantic lookups and compiler errors remain in `packages/compiler/src/utils/`
- `memoryInstructionParser.ts` should consume concrete, already-normalized arguments rather than carrying fallback parsing assumptions

## Anti-Patterns

- Do not move semantic memory lookups back into tokenizer.
- Do not collapse syntax and semantic error domains together.
- Do not reintroduce intermodule placeholder handling or other fake-value paths.
- Do not add new runtime checks for compiler-owned internal states just to make the refactor feel safer.
- Do not change the meaning of split-byte constants, memory references, or element counts as part of this cleanup.

## Implementation Plan

### Step 1: Extract semantic helpers
- Add small helpers for:
  - anonymous id/default resolution
  - memory item lookup with `UNDECLARED_IDENTIFIER`
  - second-argument default value resolution
- Keep each helper focused on one semantic concern

### Step 2: Replace the long second-argument branch ladder
- Route resolvable shapes through one shared resolver
- Remove repeated memory lookup/error code blocks
- Keep the supported semantic shapes explicit:
  - literal default
  - local memory-reference default
  - local `count(...)` default
  - split-byte default tokens
  - normalized constant-backed values that should already be literals by this phase

### Step 3: Clarify shape ownership
- Ensure tokenizer classification remains the single source of truth for argument kinds
- Keep semantic resolution limited to compiler-state-dependent behavior
- Review naming so the flow is obvious from classified AST argument to semantic resolver

### Step 4: Add regression tests
- Cover:
  - literal defaults
  - split-byte defaults
  - constant-backed defaults
  - memory-reference defaults
  - element-count defaults
  - undeclared memory identifiers

## Validation Checkpoints

- `sed -n '1,260p' packages/compiler/src/utils/memoryInstructionParser.ts`
- `rg -n "memory-reference|element-count|resolveDefaultArgValue|getError\\(ErrorCode.UNDECLARED_IDENTIFIER" packages/compiler/src/utils/memoryInstructionParser.ts`
- `npx nx run @8f4e/compiler:typecheck --skipNxCache`
- `npx nx run compiler:test --skipNxCache -- packages/compiler/src/utils/memoryInstructionParser.ts packages/compiler/tests/utils/parseMemoryInstructionArguments.test.ts`

## Success Criteria

- [x] Semantic memory default resolution no longer depends on one large branch ladder inside `memoryInstructionParser.ts`.
- [x] Repeated memory lookup and undeclared-identifier handling is centralized.
- [x] Syntax/semantic error boundaries stay intact.
- [x] Existing memory argument behavior remains unchanged.
- [x] Regression tests cover the main resolved shape families.

## Affected Components

- `packages/compiler/src/utils/memoryInstructionParser.ts` - main refactor target
- `packages/compiler/tests/utils/parseMemoryInstructionArguments.test.ts` - regression coverage
- `packages/compiler/src/compilerError.ts` - reused semantic error paths
- `packages/tokenizer/src/syntax/` - upstream classifier remains the source of truth but should not need semantic changes

## Risks & Considerations

- **Boundary erosion**: this refactor must preserve the repo’s documented separation between syntax errors and semantic compiler errors.
- **Shape coverage**: every currently supported resolved shape must still be handled explicitly.
- **Regression risk**: memory declaration parsing touches a broad part of the compiler surface and needs tight test coverage.
- **Stale assumptions**: this todo should not assume old intermodule placeholder behavior still exists; `342` and `350` already removed that path.

## Related Items

- **Follows**: `docs/todos/350-remove-intermodule-default-placeholder-from-memory-parser.md`
- **Related**: `docs/todos/290-add-constants-to-split-byte-memory-defaults-and-reserve-constant-style-identifiers.md`
- **Related**: `docs/todos/292-refactor-error-systems-and-document-syntax-vs-compiler-error-boundaries.md`

## Notes

- This is now mainly a maintainability refactor.
- The current two-phase structure is good; the goal is to make the semantic phase as structured as the syntax phase.
- This todo is not about intermodule address deferral anymore; that cleanup was handled by `342` and `350`.
