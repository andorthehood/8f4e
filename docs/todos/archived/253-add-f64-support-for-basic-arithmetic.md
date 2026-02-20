---
title: 'TODO: Add float64 support for add/sub/mul/div'
priority: Medium
effort: 2-4d
created: 2026-02-19
status: Completed
completed: 2026-02-19
---

# TODO: Add float64 support for add/sub/mul/div

## Problem Description

After adding float64 allocation and push support, core arithmetic still cannot execute in 64-bit precision.

Current arithmetic compilers (`add`, `sub`, `mul`, `div`) are effectively typed around `int` vs `float32` and emit `f32.*` for float operations.

Without `f64` arithmetic support, float64 values cannot propagate through common numeric workflows.

## Proposed Solution

Extend arithmetic instruction compilers to support `float64` operands for:
- `add`
- `sub`
- `mul`
- `div`

Core behavior:
- `int32 + int32` -> existing integer path (unchanged)
- `float32 + float32` -> existing `f32.*` path (unchanged)
- `float64 + float64` -> new `f64.*` path
- mixed `float32`/`float64` -> explicit compile-time error (no implicit promotion in this TODO)

Scope:
- instruction compiler typing/routing for the four arithmetic operations,
- wasm opcode mapping for f64 variants,
- dedicated mixed-width validation error for arithmetic ops,
- tests and docs.

Out of scope:
- implicit promotion/demotion rules,
- non-arithmetic instructions (comparisons, abs, sqrt, etc.),
- editor UI changes.

## Anti-Patterns

- Do not auto-promote float32 to float64 silently.
- Do not fall back to f32 opcodes when both operands are float64.
- Do not implement per-instruction ad-hoc mixed-width checks; keep validation behavior consistent.

## Implementation Plan

### Step 1: Extend stack typing and shared operand checks
- Ensure stack metadata can distinguish `int32`, `float32`, and `float64`.
- Add shared helper(s) for arithmetic operand compatibility checks.
- Add dedicated error code/message for mixed float widths in arithmetic operations.

### Step 2: Add opcode routing for each arithmetic instruction
- Update `add`, `sub`, `mul`, and `div` compilers to route:
  - int -> `i32.*`
  - float32 -> `f32.*`
  - float64 -> `f64.*`
- Keep existing `div` non-zero guard behavior aligned with float64 path semantics.

### Step 3: Add tests and docs
- Add unit/snapshot tests for:
  - homogeneous int32, float32, float64 arithmetic
  - mixed float32/float64 rejection
  - existing int behavior unchanged
- Update docs for arithmetic instruction type requirements.

## Validation Checkpoints

- `rg -n "F64_ADD|F64_SUB|F64_MUL|F64_DIV|mixed float|add|sub|mul|div" /Users/andorpolgar/git/8f4e/packages/compiler/src`
- `npx nx run @8f4e/compiler:test -- --run "add|sub|mul|div|float|validation"`
- Confirm generated snapshots contain `f64.add`, `f64.sub`, `f64.mul`, `f64.div` in float64 cases.

## Success Criteria

- [ ] `add/sub/mul/div` emit correct f64 opcodes for float64 operands.
- [ ] Existing int32 and float32 behavior remains unchanged.
- [ ] Mixed float32/float64 arithmetic fails with a dedicated compile-time error.
- [ ] Tests cover homogeneous and mixed-width operand combinations for all four instructions.

## Affected Components

- `/Users/andorpolgar/git/8f4e/packages/compiler/src/instructionCompilers/add.ts`
- `/Users/andorpolgar/git/8f4e/packages/compiler/src/instructionCompilers/sub.ts`
- `/Users/andorpolgar/git/8f4e/packages/compiler/src/instructionCompilers/mul.ts`
- `/Users/andorpolgar/git/8f4e/packages/compiler/src/instructionCompilers/div.ts`
- `/Users/andorpolgar/git/8f4e/packages/compiler/src/types.ts` and operand utility helpers
- `/Users/andorpolgar/git/8f4e/packages/compiler/src/errors.ts`
- `/Users/andorpolgar/git/8f4e/packages/compiler/tests` and snapshots

## Risks & Considerations

- **Risk 1**: Regressing existing float32/int32 arithmetic.
  - Mitigation: keep current tests, add explicit parity tests, and verify unchanged snapshots where expected.
- **Risk 2**: Inconsistent mixed-width behavior across instructions.
  - Mitigation: shared compatibility helper + shared error code.
- **Risk 3**: Hidden coupling with push/type metadata rollout.
  - Mitigation: set explicit dependency and implement after TODO 250 foundations land.

## Related Items

- **Depends on**: `/Users/andorpolgar/git/8f4e/docs/todos/250-add-f64-push-support.md`
- **Related**: `/Users/andorpolgar/git/8f4e/docs/todos/252-add-float-promote-demote-instructions.md`
- **Related**: `/Users/andorpolgar/git/8f4e/docs/todos/249-add-float64-allocation-support-on-4-byte-grid.md`

## Notes

- Keep mixed-width arithmetic strict for now; explicit promote/demote instructions should be the only way to bridge widths.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context)
