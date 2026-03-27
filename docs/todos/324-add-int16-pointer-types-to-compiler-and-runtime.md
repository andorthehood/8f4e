---
title: 'TODO: Add `int16*` pointer types to compiler and runtime'
priority: Medium
effort: 1-2d
created: 2026-03-26
issue: https://github.com/andorthehood/8f4e/issues/453
status: Open
completed: null
---

# TODO: Add `int16*` pointer types to compiler and runtime

## Problem Description

8f4e currently supports coarse pointer base types such as `int*`, `float*`, and `float64*`. That is enough to distinguish integer, float32, and float64 pointees, but it is not enough to represent narrower integer pointee widths such as `int16`.

Current state:
- `int*` implies a 32-bit integer pointee
- there is no `int16*` or `int16**`
- pointer-aware compile-time metadata features such as `%*name`, `^*name`, and `!*name` cannot express 16-bit integer pointee semantics with the current type system

Why this is a problem:
- pointer math cannot scale by 2-byte integer pointees directly from type information
- pointee range helpers cannot distinguish `int16` from `int`
- users must manually encode width assumptions instead of relying on pointer type metadata

## Proposed Solution

Add `int16*` pointer support first, without introducing a distinct `int16[]*` syntax.

Why prefer `int16*` over `int16[]*` initially:
- the immediate missing capability is pointee type width, not pointee shape metadata
- `int16*` is enough to express "this pointer points to 2-byte signed integers"
- whether the target happens to be an array or a single scalar is a separate concern from pointee element type
- introducing `int16[]*` now would likely blur element-type metadata with allocation-shape metadata before the compiler has a broader pointer-shape model

Follow-up work can add richer pointer-to-buffer metadata later if the language needs compile-time knowledge of pointee element count or allocation shape.

## Anti-Patterns

- Do not add `int16[]*` as a substitute for missing pointee type support if the actual need is just 16-bit pointee width.
- Do not overload existing `int*` semantics to sometimes mean 16-bit integers.
- Do not introduce narrow pointer syntax without updating both metadata helpers and runtime load/store handling.

## Implementation Plan

### Step 1: Extend pointer type definitions
- Add `int16*` and likely `int16**` to the compiler's supported memory types
- Update pointer-depth and memory-flag helpers as needed

### Step 2: Update memory metadata
- Ensure `elementWordSize` for `int16*` pointees is represented correctly in pointer-aware helper logic
- Keep pointer storage width at 4 bytes while distinguishing the pointee width from the slot width

### Step 3: Update push/load/store behavior
- Ensure dereference and pointer-aware compile-time metadata resolve `int16` semantics correctly
- Add any missing signed 16-bit load/store paths or conversions if they are not already available

### Step 4: Add tests and docs
- Cover declaration, dereference, and pointer metadata behavior for `int16*`
- Document the new pointer type and clarify that it describes pointee type, not pointee shape

## Validation Checkpoints

- `sed -n '1,180p' packages/compiler/src/types.ts`
- `rg -n "int16\\*|int16\\*\\*|pointer" packages/compiler/src`
- `npx nx run @8f4e/compiler:test`

## Success Criteria

- [ ] `int16*` declarations compile successfully.
- [ ] Pointer storage remains 4 bytes while pointee width is treated as 2 bytes.
- [ ] Pointer-aware metadata can distinguish `int16*` from `int*`.
- [ ] Dereference behavior is correct for signed 16-bit pointees.
- [ ] Compiler docs describe the new pointer type clearly.

## Affected Components

- `packages/compiler/src/types.ts` - supported memory types
- `packages/compiler/src/utils/memoryFlags.ts` - pointer metadata flags
- `packages/compiler/src/instructionCompilers/` - declaration and dereference handling
- `packages/compiler/src/utils/memoryData.ts` - pointer-aware metadata helpers
- `packages/compiler/docs/` - language documentation for pointer types

## Risks & Considerations

- **Runtime support gaps**: narrow integer dereference/store paths may require additional wasm load/store handling.
- **Type-system expansion**: adding `int16*` likely raises the question of `int8*`, `int16u*`, and `int8u*`.
- **Shape vs type**: this TODO deliberately avoids claiming compile-time knowledge about whether the pointee is a scalar or an array.

## Related Items

- **Related**: [319-add-pointee-element-word-size-prefix-for-pointers.md](/Users/andorpolgar/git/8f4e/docs/todos/319-add-pointee-element-word-size-prefix-for-pointers.md)
- **Related**: [322-add-pointee-max-value-prefix-for-pointers.md](/Users/andorpolgar/git/8f4e/docs/todos/322-add-pointee-max-value-prefix-for-pointers.md)
- **Related**: [323-add-pointee-min-value-prefix-for-pointers.md](/Users/andorpolgar/git/8f4e/docs/todos/323-add-pointee-min-value-prefix-for-pointers.md)

## Notes

- Start with `int16*`, not `int16[]*`.
- If the language later needs compile-time pointee-shape metadata, that should likely be introduced as a separate design rather than encoded directly into the pointer type spelling.
