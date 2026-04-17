---
title: 'TODO: Reduce duplicate memory declaration rule encoding between tokenizer and compiler'
priority: Medium
effort: 1-2 days
created: 2026-04-03
status: Completed
completed: 2026-04-17
---

# TODO: Reduce duplicate memory declaration rule encoding between tokenizer and compiler

## Problem Description

Memory declaration rules are currently encoded in two places:
- tokenizer-side shape parsing in [`packages/compiler/packages/tokenizer/src/syntax/memoryInstructionParser.ts`](../../packages/compiler/packages/tokenizer/src/syntax/memoryInstructionParser.ts)
- compiler-side semantic parsing in [`packages/compiler/src/utils/memoryInstructionParser.ts`](../../packages/compiler/src/utils/memoryInstructionParser.ts)

These files do not do the same job, but they do encode overlapping knowledge about:
- anonymous vs named scalar declarations
- constant-style identifiers
- split-byte sequences
- which declaration forms are valid

Why this is a problem:
- declaration behavior is harder to reason about because the contract is split across stages
- changes to one stage can silently require changes in the other
- tests may still pass at one level while the stage boundary remains conceptually muddy

## Proposed Solution

Clarify and reduce duplication at the tokenizer/compiler boundary.

The desired direction is:
- tokenizer owns raw token-shape classification
- compiler owns semantic resolution against constants, memory layout, and namespaces
- shared rule concepts are represented once in a stage-appropriate form rather than being re-derived ad hoc

Possible implementation directions:

1. Richer typed declaration shapes from tokenizer
- have tokenizer emit a narrower declaration-form model for scalar memory declarations
- let compiler semantic parsing consume that structure directly

2. Shared internal rule helpers
- extract stage-neutral classification helpers where the logic is truly identical
- keep stage-specific validation and lookup separate

The preferred outcome is not necessarily less code, but less duplicated rule interpretation.

## Anti-Patterns

- Do not collapse tokenizer and compiler responsibilities into one giant shared utility.
- Do not move semantic lookup rules into tokenizer; tokenizer should stay free of compiler state.
- Do not preserve duplicate logic merely by renaming helpers in both places.

## Implementation Plan

### Step 1: Map the duplicated rule surface
- Document which declaration rules are currently encoded in both files.
- Separate true duplication from legitimate stage-specific behavior.

### Step 2: Choose a boundary strategy
- Decide whether the better fix is richer typed AST shapes, shared neutral helpers, or a smaller hybrid approach.
- Prefer the smallest change that makes ownership clear.

### Step 3: Refactor one declaration path end-to-end
- Apply the chosen approach to scalar memory declarations first.
- Preserve all current user-visible declaration semantics.

### Step 4: Lock the boundary down with tests
- Add tests that assert the tokenizer/compiler handoff contract more directly.
- Include anonymous declarations, named declarations, split-byte forms, and constant-style identifier forms.

## Validation Checkpoints

- `npx nx run compiler:test`
- `npx nx run compiler:typecheck`
- `rg -n "split-byte|constant-style|anonymous|named declaration" packages/compiler/packages/tokenizer packages/compiler/src`

## Success Criteria

- [x] The tokenizer/compiler boundary for scalar memory declarations is easier to explain and verify.
- [x] Overlapping declaration rules are no longer independently re-encoded without a clear reason.
- [x] Current declaration behavior remains unchanged.
- [x] Tests make the cross-stage contract explicit.

## Affected Components

- `packages/compiler/packages/tokenizer/src/syntax/memoryInstructionParser.ts` - tokenizer-side declaration classification
- `packages/compiler/src/utils/memoryInstructionParser.ts` - compiler-side semantic resolution
- `packages/compiler/packages/tokenizer/src/types.ts` - possible typed AST/declaration-shape changes
- `packages/compiler/src/types.ts` - possible consumption-side typing changes
- `packages/compiler/tests/` - boundary and regression coverage

## Risks & Considerations

- **Boundary churn**: changing AST contracts can ripple through parser and compiler code quickly.
- **False deduplication**: some duplication may actually reflect necessary stage separation; that distinction should be explicit before refactoring.
- **Typed-shape migration cost**: richer AST typing may be the cleanest answer, but it can cost more upfront than a narrowly targeted helper extraction.

## Related Items

- **Related**: `367-add-bare-anonymous-zero-initialized-scalar-declarations.md`
- **Related**: `368-separate-memory-declaration-id-and-default-resolution.md`
- **Related**: `362-refactor-argumentidentifier-to-discriminated-union.md`
- **Related**: `363-enforce-classifyidentifier-check-ordering.md`

## Notes

- This is primarily a maintainability and correctness-boundary task.
- If the duplication map shows only a small amount of real overlap, the right answer may be a more modest contract clarification plus tests rather than a large structural refactor.
