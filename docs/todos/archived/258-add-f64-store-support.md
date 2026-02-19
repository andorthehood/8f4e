---
title: 'TODO: Add float64 support for store instruction'
priority: Medium
effort: 1-2d
created: 2026-02-20
status: Completed
completed: 2026-02-19
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

## Implementation Summary

- Added `F64 = 0x7c` to `Type` enum in `wasmUtils/type.ts`
- Added `isFloat64?: boolean` to `Namespace.locals` type in `types.ts`
- Updated `local.ts` instruction compiler to set `isFloat64: true` when type is `float64`
- Updated `compiler.ts` to emit `Type.F64` local declarations for float64 locals (both `compileModule` and `compileFunction`)
- Updated `store.ts` to:
  - Import and use `f64store` when `operand1Value.isFloat64 === true`
  - Use `local float64 <name>` for the temp value variable in the unsafe-address (bounds-check) path
  - Keep existing `i32store` and `f32store` paths unchanged
- Added in-file unit tests covering float64 safe/unsafe address paths and float64 local type tracking
- Added integration tests in `tests/instructions/store.test.ts` verifying the WASM output round-trips float64 values correctly

## Affected Files

- `packages/compiler/src/wasmUtils/type.ts`
- `packages/compiler/src/types.ts`
- `packages/compiler/src/instructionCompilers/local.ts`
- `packages/compiler/src/compiler.ts`
- `packages/compiler/src/instructionCompilers/store.ts`
- `packages/compiler/tests/instructions/store.test.ts` (new)
