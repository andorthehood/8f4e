---
title: 'TODO: Separate memory declaration id and default resolution'
priority: Medium
effort: 4-8h
created: 2026-04-03
status: Open
completed: null
---

# TODO: Separate memory declaration id and default resolution

## Problem Description

[`packages/compiler/src/utils/memoryInstructionParser.ts`](../../packages/compiler/src/utils/memoryInstructionParser.ts) currently handles several distinct concerns in one function:
- deciding whether a scalar declaration is named or anonymous
- interpreting anonymous declaration forms
- decoding split-byte defaults
- resolving default values against compiler state

This works, but it makes the code harder to evolve safely. Small feature changes such as adding bare anonymous scalar declarations require touching a function that already owns multiple rules with different responsibilities.

Why this is a problem:
- feature work is more likely to introduce regressions in unrelated declaration forms
- tests have to cover many branch combinations because the implementation is tightly coupled
- it is harder to identify which behavior belongs to syntax classification and which belongs to semantic resolution

## Proposed Solution

Refactor scalar declaration parsing into smaller helpers with explicit ownership:

1. id resolution
- decide whether the declaration is named or anonymous
- preserve the existing anonymous id convention based on source line number

2. declaration-form classification
- distinguish named declaration, anonymous literal, anonymous constant-style identifier, split-byte sequence, and bare anonymous zero-initialized form

3. semantic default resolution
- resolve the classified initializer into a numeric default value using compiler state where needed

The key goal is not to change user-visible behavior. The refactor should preserve all current declaration semantics while making future changes more localized.

## Anti-Patterns

- Do not mix syntax-shape interpretation and compiler-state resolution back together under different helper names.
- Do not change anonymous id generation as part of the refactor.
- Do not widen this into an array declaration refactor unless array behavior is directly affected.

## Implementation Plan

### Step 1: Identify and name the internal stages
- Define the internal stages currently hidden inside `parseMemoryInstructionArguments`.
- Introduce helper boundaries that reflect the actual responsibilities.

### Step 2: Extract helpers without changing behavior
- Extract id resolution into a dedicated helper.
- Extract default-form classification into a dedicated helper.
- Extract semantic default-value resolution into a dedicated helper.
- Keep tests green while preserving the same outputs and error behavior.

### Step 3: Tighten tests around behavior boundaries
- Add or update tests so each helper boundary is exercised through the public parser behavior.
- Cover:
- named implicit-zero declarations
- anonymous literal declarations
- anonymous constant-style declarations
- split-byte defaults
- memory-reference defaults
- bare anonymous zero-initialized scalar declarations

### Step 4: Re-check downstream declaration compilers
- Confirm `int`, `float`, `float64`, and scalar pointer declarations still rely on one shared parser contract.
- Avoid introducing instruction-specific parsing differences unless they already exist by design.

## Validation Checkpoints

- `npx nx run compiler:test`
- `npx nx run compiler:typecheck`
- `rg -n "parseMemoryInstructionArguments|resolveAnonymousOrNamedMemoryId|resolveMemoryDefaultValue" packages/compiler`

## Success Criteria

- [ ] Memory declaration parsing responsibilities are split into smaller helpers with clearer ownership.
- [ ] Behavior is unchanged for existing named and anonymous scalar declaration forms.
- [ ] The parser remains the single semantic entry point used by scalar declaration compilers.
- [ ] Tests cover the major declaration-form boundaries explicitly.

## Affected Components

- `packages/compiler/src/utils/memoryInstructionParser.ts` - main refactor target
- `packages/compiler/tests/utils/parseMemoryInstructionArguments.test.ts` - regression and boundary coverage
- `packages/compiler/src/semantic/declarations/` - validation that shared scalar declaration parsing still integrates cleanly

## Risks & Considerations

- **Behavior drift**: this file encodes subtle compatibility rules, so the refactor must be done under strong regression coverage.
- **Over-abstracting too early**: the goal is clearer boundaries, not a framework for every possible declaration kind.
- **Misplaced ownership**: some logic may belong in tokenizer classification rather than semantic parsing, so helper boundaries should make that easier to see rather than harder.

## Related Items

- **Related**: `367-add-bare-anonymous-zero-initialized-scalar-declarations.md`
- **Related**: `356-consolidate-declaration-compilers-into-factory.md`
- **Related**: `archived/308-simplify-memory-instruction-default-value-resolution.md`

## Notes

- This is a refactor TODO, not a behavior-change TODO.
- A good outcome is a parser that makes new declaration-form features obviously local rather than cross-cutting.
