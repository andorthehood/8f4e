---
title: 'TODO: Remove intermodule default placeholder handling from memory parser'
priority: Medium
effort: 2-4h
created: 2026-03-30
status: Completed
completed: 2026-03-31
---

# TODO: Remove intermodule default placeholder handling from memory parser

## Problem Description

`342` moved intermodule address references such as `&module:memory`, `module:memory&`, `&module:`, and `module:&` into semantic compile-time resolution. That is the right ownership boundary, but one transitional behavior remains in `packages/compiler/src/utils/memoryInstructionParser.ts`:

- unresolved intermodule address-style defaults still return `0` from `resolveDefaultArgValue(...)`
- that placeholder exists only to let namespace/layout passes continue before the final address is known

Why this is a problem:
- it leaves one parser-stage helper fabricating a fake numeric value for an unresolved semantic state
- it hides the true ownership boundary by making the memory parser aware of deferred intermodule resolution
- it makes the pipeline harder to reason about because `0` is not a real default value here, just a temporary stand-in

This is now follow-up cleanup after `342`, not part of the main intermodule inlining work.

## Proposed Solution

Move the “not resolvable yet” state out of `packages/compiler/src/utils/memoryInstructionParser.ts` and into the earlier semantic/layout flow that already owns deferred intermodule handling.

High-level approach:
- stop having `parseMemoryInstructionArguments(...)` synthesize `0` for unresolved intermodule address references
- make the earlier namespace/layout pass represent that unresolved state explicitly
- keep `memoryInstructionParser.ts` focused on consuming concrete, already-decided defaults

## Anti-Patterns

- Do not add more runtime guards or fallback values in compiler internals.
- Do not move syntax validation into semantic/codegen while cleaning this up.
- Do not keep both the placeholder path and the explicit deferred path alive in parallel.
- Do not preserve the current internal API shape just for backward compatibility; internal contract changes are acceptable.

## Implementation Plan

### Step 1: Trace the placeholder path
- Identify the exact callers that rely on `resolveDefaultArgValue(...)` returning `0` for intermodule address references.
- Confirm whether this only happens during namespace/layout collection.

### Step 2: Move deferral ownership earlier
- Represent the unresolved-default state explicitly in the semantic/layout step that still runs before final module byte addresses are known.
- Remove the fake-value branch from `memoryInstructionParser.ts`.

### Step 3: Keep memory parsing concrete
- After the change, `parseMemoryInstructionArguments(...)` should only consume concrete default values or real compile-time-resolved identifiers that belong there.
- Intermodule address defaults should either already be literal or still be represented as an explicit deferred state outside the parser.

## Validation Checkpoints

- `sed -n '1,240p' packages/compiler/src/utils/memoryInstructionParser.ts`
- `rg -n "return 0;|intermodular-module-reference|intermodular-reference" packages/compiler/src`
- `npx nx run @8f4e/compiler:typecheck --skipNxCache`
- `npx nx run compiler:test --skipNxCache -- packages/compiler/src/utils/memoryInstructionParser.ts packages/compiler/tests/intermodular-references/startAddress.test.ts packages/compiler/tests/intermodular-references/endAddress.test.ts`

## Success Criteria

- [ ] `memoryInstructionParser.ts` no longer fabricates `0` for unresolved intermodule address defaults.
- [ ] The unresolved/deferred state is owned earlier in the semantic/layout pipeline.
- [ ] Memory parsing only consumes concrete defaults or valid non-deferred identifier forms.
- [ ] Compiler typecheck and focused intermodule-reference tests pass.

## Affected Components

- `packages/compiler/src/utils/memoryInstructionParser.ts` - remove the placeholder branch
- `packages/compiler/src/semantic/` - own the deferred state earlier
- `packages/compiler/tests/intermodular-references/` - ensure regression coverage stays intact

## Risks & Considerations

- **Layout ordering**: the cleanup must preserve the current namespace/layout deferral behavior until target module byte addresses are known.
- **False simplification**: removing the placeholder branch without moving the deferred state earlier would break intermodule default handling during pre-layout passes.
- **Internal contract changes**: acceptable if they make the pipeline clearer; the software is not released yet.

## Related Items

- **Follows**: `docs/todos/342-inline-intermodule-address-references-during-semantic-normalization.md`
- **Related**: `docs/todos/308-simplify-memory-instruction-default-value-resolution.md`

## Notes

- This is cleanup, not a reason to reopen `342`.
- The goal is to remove one remaining fake-value path now that semantic inlining owns the real intermodule address behavior.
