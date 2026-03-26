---
title: 'TODO: Add `%*name` pointee element word size prefix for pointers'
priority: Medium
effort: 2-4h
created: 2026-03-26
status: Open
completed: null
---

# TODO: Add `%*name` pointee element word size prefix for pointers

## Problem Description

8f4e already supports `%name` as an identifier prefix for "element word size in bytes". That works well for scalars and buffers, but it becomes ambiguous for pointer-typed memory items.

Current state:
- `%buffer` returns the element word size of the memory item `buffer` itself
- for pointer-typed memory, that means the width of the pointer slot, not the width of the pointed-to value
- users coming from C-like pointer semantics may expect a way to ask for the pointee size directly

Why this is a problem:
- pointer arithmetic helpers become less expressive than the existing dereference syntax suggests
- users have to remember that `%ptr` is about pointer storage rather than pointee width
- there is no direct syntax that mirrors the distinction between `sizeof(ptr)` and `sizeof(*ptr)` in C

## Proposed Solution

Add support for `%*name` as a compile-time identifier form meaning "element word size of the value pointed to by `name`".

High-level approach:
- extend identifier classification and parsing to recognize `%*name`
- resolve `%*name` only for pointer-typed memory identifiers
- preserve existing `%name` behavior so it continues to describe the memory item itself

Expected semantics with current type system:
- `%buffer` where `buffer` is `int*` should keep returning `4`
- `%*buffer` where `buffer` is `int*` should return `4`
- `%*buffer` where `buffer` is `float64*` should return `8`

## Anti-Patterns

- Do not silently change `%name` semantics for pointer types.
- Do not treat `%*name` as a runtime dereference; this should stay a compile-time metadata lookup.
- Do not allow `%*name` on non-pointer memory without an explicit compiler or syntax error path.

## Implementation Plan

### Step 1: Add syntax support for `%*name`
- Introduce a dedicated parser/helper for the pointee element word size prefix
- Update identifier classification so `%*name` is distinct from `%name`

### Step 2: Resolve pointee size from pointer metadata
- Extend memory metadata lookup so pointer base type determines the returned element width
- Keep current pointer-slot width behavior for `%name`

### Step 3: Add compiler tests
- Cover `int*`, `float*`, and `float64*`
- Cover rejection or error behavior for non-pointer identifiers
- Cover `push %*name` and declaration initializer cases if supported

### Step 4: Update docs
- Document `%*name` alongside `%name` in compiler prefix docs
- Clarify the difference using a pointer example

## Validation Checkpoints

- `sed -n '1,220p' packages/compiler/docs/prefixes.md`
- `rg -n "%\\*|pointee element word size|ELEMENT_WORD_SIZE" packages/compiler`
- `npx nx run @8f4e/compiler:test`

## Success Criteria

- [ ] `%*name` is accepted for pointer memory identifiers.
- [ ] `%name` keeps its existing meaning for all existing programs.
- [ ] Pointer pointee width is resolved correctly for `int*`, `float*`, and `float64*`.
- [ ] Invalid `%*name` usage produces a clear error.
- [ ] Compiler docs explain the difference between `%name` and `%*name`.

## Affected Components

- `packages/compiler/src/syntax/` - identifier parsing and classification for `%*name`
- `packages/compiler/src/utils/memoryIdentifier.ts` - prefix-aware identifier checks
- `packages/compiler/src/utils/memoryData.ts` - metadata lookup for pointee size
- `packages/compiler/src/instructionCompilers/push/` - push handling for compile-time size lookup
- `packages/compiler/docs/prefixes.md` - language docs for identifier prefixes

## Risks & Considerations

- **Grammar overlap**: `%*name` must not be misclassified as `%name` plus pointer dereference syntax.
- **Type-system limits**: current pointer types are coarse, so `int*` still implies 32-bit integer pointee size.
- **Error choice**: invalid non-pointer `%*name` usage should follow the repo's syntax-vs-compiler error boundary rules.

## Related Items

- **Related**: [146-investigate-index-arithmetic-support.md](/Users/andorpolgar/git/8f4e/docs/todos/146-investigate-index-arithmetic-support.md)
- **Related**: [309-extract-shared-module-memory-identifier-parser.md](/Users/andorpolgar/git/8f4e/docs/todos/309-extract-shared-module-memory-identifier-parser.md)

## Notes

- This TODO intentionally does not require adding new pointer base types such as `int16*`.
- If typed narrow pointers are introduced later, `%*name` should follow the pointee type width rather than pointer slot width.
