---
title: 'TODO: Add float64 support for store instruction'
priority: Medium
effort: 1-2d
created: 2026-02-20
status: Completed
completed: 2026-02-20
---

# TODO: Add float64 support for store instruction

## Problem Description

Float64 allocation and push support are being added, but `store` still follows 32-bit-oriented float paths (`f32.store`).

Without `f64` store support, float64 values cannot be written back to memory correctly.

## Proposed Solution

Extend `store` codegen and validation to support float64 memory writes:
- emit `f64.store` when target memory item is float64-backed,
- preserve existing int32 and float32 behavior,
- keep existing safe-address handling unchanged.

Scope:
- `store` instruction compiler behavior,
- wasm helper/opcode wiring for `f64.store`,
- tests for float64 target stores and type mismatches.

Out of scope:
- implicit cast/promotion logic,
- non-store instructions.

## Anti-Patterns

- Do not silently demote float64 values to float32 on store.
- Do not choose store opcode from operand shape alone; use memory metadata.
- Do not regress existing int32/float32 store behavior.

## Implementation Plan

### Step 1: Add/store f64 wasm primitive
- Ensure `f64store` helper exists and is used by `store` compiler path where appropriate.

### Step 2: Update store routing
- Route by target memory type/element size:
  - int -> `i32.store`
  - float32 -> `f32.store`
  - float64 -> `f64.store`
- Keep bounds-check/safe-address wrappers shared.

### Step 3: Add tests
- Add tests for:
  - storing float64 into float64 memory item,
  - existing int/float32 store paths unchanged,
  - invalid width/type combinations fail with explicit compiler error.

## Validation Checkpoints

- `rg -n "store|f64store|f64\\.store" /Users/andorpolgar/git/8f4e/packages/compiler/src`
- `npx nx run @8f4e/compiler:test -- --run "store|float|memory"`

## Success Criteria

- [ ] `store` emits `f64.store` for float64 memory targets.
- [ ] Existing int32 and float32 store behavior remains unchanged.
- [ ] Type/width mismatches are rejected with clear compiler errors.
- [ ] Tests cover float64 store path and regression cases.

## Affected Components

- `/Users/andorpolgar/git/8f4e/packages/compiler/src/instructionCompilers/store.ts`
- `/Users/andorpolgar/git/8f4e/packages/compiler/src/wasmUtils/store/f64store.ts` (or equivalent)
- `/Users/andorpolgar/git/8f4e/packages/compiler/src/types.ts` / validation helpers
- `/Users/andorpolgar/git/8f4e/packages/compiler/tests`

## Risks & Considerations

- **Risk 1**: Incorrect opcode routing for float memory kinds.
  - Mitigation: strict routing tests by memory metadata.
- **Risk 2**: Drift from push/arithmetic type-width handling.
  - Mitigation: share validation helpers where possible.

## Related Items

- **Depends on**: `/Users/andorpolgar/git/8f4e/docs/todos/250-add-f64-push-support.md`
- **Related**: `/Users/andorpolgar/git/8f4e/docs/todos/253-add-f64-support-for-basic-arithmetic.md`
- **Related**: `/Users/andorpolgar/git/8f4e/docs/todos/249-add-float64-allocation-support-on-4-byte-grid.md`

## Notes

- Keep this TODO narrowly focused on `store` so it can land independently and be verified in isolation.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context)
