---
title: 'TODO: Add `^*name` pointee max value prefix for pointers'
priority: Medium
effort: 2-4h
created: 2026-03-26
issue: https://github.com/andorthehood/8f4e/issues/451
status: Open
completed: null
---

# TODO: Add `^*name` pointee max value prefix for pointers

## Problem Description

8f4e already supports `^name` to push the maximum finite value for the element type of a memory item. For pointer-typed memory items, that currently describes the pointer storage type rather than the pointed-to value type.

Current state:
- `^buffer` returns the max value for the memory item `buffer` itself
- for pointers, that means the pointer slot behaves like an integer-typed memory item
- there is no direct syntax to ask for the maximum value of the pointee type

Why this is a problem:
- pointer-aware generic code cannot ask for pointee numeric limits directly
- the metadata prefix family is asymmetric once pointers are involved
- users may reasonably expect a dereference-shaped form alongside the proposed `%*name`

## Proposed Solution

Add support for `^*name` as a compile-time identifier form meaning "maximum finite value of the type pointed to by `name`".

High-level approach:
- extend identifier parsing/classification to recognize `^*name`
- resolve it only for pointer-typed memory identifiers
- preserve current `^name` behavior for the memory item itself

Expected semantics with current type system:
- `^buffer` where `buffer` is `int*` keeps describing the pointer slot type
- `^*buffer` where `buffer` is `int*` returns the max finite value for `int`
- `^*buffer` where `buffer` is `float64*` returns the max finite value for `float64`

## Anti-Patterns

- Do not silently redefine `^name` for pointers.
- Do not implement `^*name` as a runtime dereference.
- Do not allow `^*name` on non-pointer identifiers without an explicit error path.

## Implementation Plan

### Step 1: Add syntax support for `^*name`
- Introduce a dedicated parser/helper for pointee max-value identifiers
- Ensure it is classified separately from `^name`

### Step 2: Resolve pointee numeric limits
- Derive pointee type limits from pointer metadata
- Reuse existing max-value helper rules where possible

### Step 3: Add tests
- Cover `int*`, `float*`, and `float64*`
- Cover invalid non-pointer usage
- Cover `push ^*name` and declaration initializer cases if supported

### Step 4: Update docs
- Document `^*name` beside `^name`
- Clarify the distinction between pointer-slot and pointee-type max values

## Validation Checkpoints

- `sed -n '1,220p' packages/compiler/docs/prefixes.md`
- `rg -n "\\^\\*|pointee max value" packages/compiler`
- `npx nx run @8f4e/compiler:test`

## Success Criteria

- [ ] `^*name` is accepted for pointer memory identifiers.
- [ ] `^name` keeps its existing meaning.
- [ ] `^*name` resolves to the correct max value for the pointee type.
- [ ] Invalid usage produces a clear error.
- [ ] Compiler docs explain the difference between `^name` and `^*name`.

## Affected Components

- `packages/compiler/src/syntax/` - identifier parsing and classification for `^*name`
- `packages/compiler/src/utils/memoryIdentifier.ts` - prefix-aware identifier checks
- `packages/compiler/src/utils/memoryData.ts` - pointee max-value lookup
- `packages/compiler/src/instructionCompilers/push/` - compile-time max-value push handling
- `packages/compiler/docs/prefixes.md` - language docs for identifier prefixes

## Risks & Considerations

- **Type-system limits**: coarse pointer base types bound how precise pointee max values can be.
- **Parser overlap**: `^*name` must not be misclassified as `^name` or `*name`.
- **Error boundary**: invalid usage should follow the repo's syntax-vs-compiler error guidance.

## Related Items

- **Related**: [319-add-pointee-element-word-size-prefix-for-pointers.md](/Users/andorpolgar/git/8f4e/docs/todos/319-add-pointee-element-word-size-prefix-for-pointers.md)
- **Related**: [321-add-pointee-end-address-suffix-for-pointers.md](/Users/andorpolgar/git/8f4e/docs/todos/321-add-pointee-end-address-suffix-for-pointers.md)

## Notes

- This TODO assumes pointee numeric-range metadata can be derived entirely from the declared pointer type.
- If typed narrow pointers are added later, `^*name` should follow the narrowed pointee type.
