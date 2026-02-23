---
title: 'TODO: Add storeBytes with explicit byte count argument'
priority: High
effort: 4-8h
created: 2026-02-23
status: Open
completed: null
---

# TODO: Add storeBytes with explicit byte count argument

## Problem Description

8f4e currently lacks a byte-oriented contiguous write instruction.

The previously discussed string-capture approach introduces hidden compiler state and ambiguity around when capture starts/stops. That increases implementation complexity and makes stack behavior harder to reason about.

## Proposed Solution

Add `storeBytes <count>` as an explicit memory instruction.

Semantics:
- Stack layout before call: `... , dstAddress , byte1 , byte2 , ... , byteN`
- `storeBytes N` pops `N` byte values from the top of the stack, then pops destination address.
- Writes bytes contiguously to memory in original push order:
  - `byte1 -> dstAddress + 0`
  - `byte2 -> dstAddress + 1`
  - ...
  - `byteN -> dstAddress + (N-1)`
- Each popped value is truncated to a byte (`value & 0xff`) before `i32.store8`.

Example:

```8f4e
push &startAddr
push 72
push 101
push 108
push 108
push 111
storeBytes 5
```

## Anti-Patterns

- Do not add hidden string-capture mode in this TODO.
- Do not make `storeBytes` infer count from stack metadata.
- Do not change existing `store` behavior.

## Implementation Plan

### Step 1: Add wasm byte-store helper
- Add `i32.store8` helper in `packages/compiler/src/wasmUtils/store/`.

### Step 2: Add `storeBytes` instruction compiler
- Implement `packages/compiler/src/instructionCompilers/storeBytes.ts`.
- Validate argument count (`<count>` required, integer, non-negative).
- Validate operand availability (`count + 1` stack items including destination address).
- Emit contiguous `i32.store8` writes in correct order.

### Step 3: Register and document instruction
- Register in `packages/compiler/src/instructionCompilers/index.ts`.
- Add docs in `packages/compiler/docs/instructions/memory.md`.
- Add link in `packages/compiler/docs/instructions.md`.

### Step 4: Tests
- Add happy-path tests for contiguous writes.
- Add operand-underflow and invalid-count tests.
- Add ordering test to verify push order is preserved.

## Validation Checkpoints

- `npx nx run @8f4e/compiler:test -- --run instructionCompilers`
- `rg -n "storeBytes|store8|i32store8" packages/compiler/src packages/compiler/docs`

## Success Criteria

- [ ] `storeBytes <count>` compiles and writes contiguous bytes using `i32.store8`.
- [ ] Byte write order matches push order.
- [ ] Invalid counts and insufficient operands produce compiler errors.
- [ ] Existing instructions (`push`, `store`, loads) remain unchanged.

## Affected Components

- `packages/compiler/src/instructionCompilers/storeBytes.ts` (new)
- `packages/compiler/src/instructionCompilers/index.ts`
- `packages/compiler/src/wasmUtils/store/i32store8.ts` (new)
- `packages/compiler/docs/instructions/memory.md`
- `packages/compiler/docs/instructions.md`

## Risks & Considerations

- **User ergonomics**: users must provide accurate `<count>`; mistakes can under/over-write intended payload.
- **Validation strictness**: ensure clear error messages for count/stack mismatches.
- **Bounds behavior**: define whether out-of-range writes are clamped, zeroed, or bounds-checked.

## Related Items

- **Related**: `docs/todos/146-investigate-index-arithmetic-support.md`
- **Related**: `docs/todos/271-add-f64-support-for-loadfloat.md`

## Notes

- This TODO intentionally prioritizes explicitness and simple implementation over implicit string capture semantics.
