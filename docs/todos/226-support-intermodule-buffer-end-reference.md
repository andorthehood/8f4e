---
title: 'TODO: Support Inter-Module Buffer End Address References'
priority: Medium
effort: 4-6h
created: 2026-02-16
status: Open
completed: null
---

# TODO: Support Inter-Module Buffer End Address References

## Problem Description

Inter-module memory references currently support start-address lookup via `&module.memory` in declaration defaults and `init` values. The compiler does not support an inter-module equivalent of the existing local `buffer&` postfix behavior.

This blocks use cases where a module needs to initialize a pointer to the last word-aligned address of another module's buffer (or scalar). Today, users can only target the start address inter-modularly.

There is also an ambiguity in current syntax handling: inter-module parsing allows more than one dot segment (for example `&a.b.c`), while resolver logic only uses `module.memory` shape. This mismatch can hide invalid inputs.

## Proposed Solution

Add explicit support for inter-module buffer-end references with strict two-segment syntax.

- Keep current inter-module start form: `&module.memory`
- Add inter-module end form: `&module.memory&`
- Enforce exactly one dot separator in inter-module references (`module.memory` only)
- Resolve end form to:
  - `target.byteAddress + (target.wordAlignedSize - 1) * 4` for arrays/buffers
  - `target.byteAddress` for scalars (already true when `wordAlignedSize === 1`)

This should behave analogously to existing local `buffer&` handling, but across module boundaries during the deferred inter-module resolution pass.

## Anti-Patterns

- Do not accept `&module.path.to.memory` (multi-dot). Reject at syntax classification level.
- Do not add support for bare `module.memory&` without leading `&` in this task.
- Do not silently coerce invalid forms to start-address semantics.
- Do not duplicate parsing regexes across compiler stages without a shared helper or consistent rules.

## Implementation Plan

### Step 1: Tighten inter-module syntax shape
- Update `packages/compiler/src/syntax/isIntermodularReference.ts` to allow only:
  - `&<module>.<memory>`
  - `&<module>.<memory>&`
- Ensure names cannot contain additional dots.
- Add/adjust in-source tests to assert:
  - valid: `&notesMux2.out`, `&notesMux2.buffer&`
  - invalid: `&notesMux2.out.notes`, `&notesMux2.`, `notesMux2.out`, `&notesMux2.out&&`

### Step 2: Preserve classification and deferred semantics
- Keep `intermodular-reference` priority before local memory-reference parsing in:
  - `packages/compiler/src/syntax/memoryInstructionParser.ts`
  - `packages/compiler/src/utils/memoryInstructionParser.ts`
- Confirm second-argument intermodular references still defer resolution (`defaultValue` remains `0` until post-pass).
- Add utility tests for `&module.memory&` classification and deferred handling.

### Step 3: Extend resolver for postfix-end semantics
- Update `packages/compiler/src/index.ts` `resolveInterModularConnections`:
  - Parse inter-module reference into `{ moduleId, memoryId, isEndAddress }`
  - Validate module and memory existence
  - Compute resolved address:
    - start: `targetMemory.byteAddress`
    - end: `targetMemory.byteAddress + (targetMemory.wordAlignedSize - 1) * 4`
  - Write result into source memory item's `default`
- Ensure `init` path continues to work since it is resolved by the same pass.

### Step 4: Keep module sorting dependency extraction in sync
- Update `packages/compiler/src/graphOptimizer.ts` dependency detection regex/parsing so `&module.memory&` contributes dependency on `module`.
- Keep behavior identical for current start form.

### Step 5: Add regression tests
- Add tests covering:
  - pointer declaration with `&module.buffer&`
  - `init localPointer &module.buffer&`
  - scalar target end behavior equals start behavior
  - invalid multi-dot form fails (`&module.memory.extra`)
- Suggested test locations:
  - `packages/compiler/tests/utils/parseMemoryInstructionArguments.test.ts`
  - `packages/compiler/tests/intermodular-references/*`
  - in-source syntax test in `isIntermodularReference.ts`

## Validation Checkpoints

- `npx nx run compiler:test`
- `rg -n "isIntermodularReference|resolveInterModularConnections|intermod" packages/compiler/src -S`
- Verify no remaining code assumes `&(\S+)\.(\S+)` with unrestricted dot segments.

## Success Criteria

- [ ] `&module.memory&` is accepted for declaration/default and `init` second argument paths.
- [ ] End-address resolution matches local `buffer&` semantics (last word-aligned address).
- [ ] Scalar targets resolve to the same address for start/end forms.
- [ ] Multi-dot inter-module forms are rejected.
- [ ] Dependency sorting recognizes both `&module.memory` and `&module.memory&`.
- [ ] Compiler tests pass via Nx (`npx nx run compiler:test`).

## Affected Components

- `packages/compiler/src/syntax/isIntermodularReference.ts` - strict inter-module syntax matcher
- `packages/compiler/src/syntax/memoryInstructionParser.ts` - syntax-level argument classification
- `packages/compiler/src/utils/memoryInstructionParser.ts` - compiler-level deferred parsing path
- `packages/compiler/src/index.ts` - deferred inter-module connection resolver
- `packages/compiler/src/graphOptimizer.ts` - dependency detection/sorting
- `packages/compiler/tests/...` - coverage for new syntax and resolution behavior

## Risks & Considerations

- **Compatibility risk**: Existing code using multi-dot inter-module form (if any) will break. Mitigation: explicit release note and migration guidance.
- **Parser/resolver drift risk**: Syntax matcher and resolver can diverge. Mitigation: shared parsing helper or mirrored tests across both layers.
- **Sort-order risk**: Missing regex updates in graph sorting can cause unstable dependency order. Mitigation: add ordering test with `&module.memory&`.
- **Magic number risk**: Address math currently uses `4`; consider reusing `GLOBAL_ALIGNMENT_BOUNDARY` for consistency if practical in touched code.

## Related Items

- **Related**: `docs/todos/archived/214-support-buffer-end-address-in-declaration-initializers.md`
- **Related**: `docs/todos/217-add-first-compiler-directive-skip-module-execution.md` (documents preserved inter-module references during compile)
