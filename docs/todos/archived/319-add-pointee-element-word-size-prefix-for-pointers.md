---
title: 'TODO: Add `sizeof(*name)` pointee element word size prefix for pointers'
priority: Medium
effort: 2-4h
created: 2026-03-26
status: Completed
completed: 2026-03-30
---

# TODO: Add `sizeof(*name)` pointee element word size prefix for pointers

## Problem Description

8f4e already supports `sizeof(name)` as an identifier prefix for "element word size in bytes". That works well for scalars and buffers, but it becomes ambiguous for pointer-typed memory items.

Current state:
- `sizeof(buffer)` returns the element word size of the memory item `buffer` itself
- for pointer-typed memory, that means the width of the pointer slot, not the width of the pointed-to value
- users coming from C-like pointer semantics may expect a way to ask for the pointee size directly

Why this is a problem:
- pointer arithmetic helpers become less expressive than the existing dereference syntax suggests
- users have to remember that `sizeof(ptr)` is about pointer storage rather than pointee width
- there is no direct syntax that mirrors the distinction between `sizeof(ptr)` and `sizeof(*ptr)` in C

## Proposed Solution

Add support for `sizeof(*name)` as a compile-time identifier form meaning "element word size of the value pointed to by `name`".

High-level approach:
- extend identifier classification and parsing to recognize `sizeof(*name)`
- resolve `sizeof(*name)` only for pointer-typed memory identifiers
- preserve existing `sizeof(name)` behavior so it continues to describe the memory item itself

Expected semantics with current type system:
- `sizeof(buffer)` where `buffer` is `int*` should keep returning `4`
- `sizeof(*buffer)` where `buffer` is `int*` should return `4`
- `sizeof(*buffer)` where `buffer` is `float64*` should return `8`

## Anti-Patterns

- Do not silently change `sizeof(name)` semantics for pointer types.
- Do not treat `sizeof(*name)` as a runtime dereference; this should stay a compile-time metadata lookup.
- Do not allow `sizeof(*name)` on non-pointer memory without an explicit compiler or syntax error path.

## Implementation Plan

### Step 1: Add syntax support for `sizeof(*name)`
- Introduce a dedicated parser/helper for the pointee element word size prefix
- Update identifier classification so `sizeof(*name)` is distinct from `sizeof(name)`

### Step 2: Resolve pointee size from pointer metadata
- Extend memory metadata lookup so pointer base type determines the returned element width
- Keep current pointer-slot width behavior for `sizeof(name)`

### Step 3: Add compiler tests
- Cover `int*`, `float*`, and `float64*`
- Cover rejection or error behavior for non-pointer identifiers
- Cover `push %*name` and declaration initializer cases if supported

### Step 4: Update docs
- Document `sizeof(*name)` alongside `sizeof(name)` in compiler prefix docs
- Clarify the difference using a pointer example

## Validation Checkpoints

- `sed -n '1,220p' packages/compiler/docs/prefixes.md`
- `rg -n "%\\*|pointee element word size|ELEMENT_WORD_SIZE" packages/compiler`
- `npx nx run @8f4e/compiler:test`

## Success Criteria

- [ ] `sizeof(*name)` is accepted for pointer memory identifiers.
- [ ] `sizeof(name)` keeps its existing meaning for all existing programs.
- [ ] Pointer pointee width is resolved correctly for `int*`, `float*`, and `float64*`.
- [ ] Invalid `sizeof(*name)` usage produces a clear error.
- [ ] Compiler docs explain the difference between `sizeof(name)` and `sizeof(*name)`.

## Affected Components

- `packages/compiler/src/syntax/` - identifier parsing and classification for `sizeof(*name)`
- `packages/compiler/src/utils/memoryIdentifier.ts` - prefix-aware identifier checks
- `packages/compiler/src/utils/memoryData.ts` - metadata lookup for pointee size
- `packages/compiler/src/instructionCompilers/push/` - push handling for compile-time size lookup
- `packages/compiler/docs/prefixes.md` - language docs for identifier prefixes

## Risks & Considerations

- **Grammar overlap**: `sizeof(*name)` must not be misclassified as `sizeof(name)` plus pointer dereference syntax.
- **Type-system limits**: current pointer types are coarse, so `int*` still implies 32-bit integer pointee size.
- **Error choice**: invalid non-pointer `sizeof(*name)` usage should follow the repo's syntax-vs-compiler error boundary rules.

## Related Items

- **Related**: `docs/todos/146-investigate-index-arithmetic-support.md`
- **Related**: `docs/todos/archived/309-extract-shared-module-memory-identifier-parser.md`

## Notes

- This TODO intentionally does not require adding new pointer base types such as `int16*`.
- If typed narrow pointers are introduced later, `sizeof(*name)` should follow the pointee type width rather than pointer slot width.
