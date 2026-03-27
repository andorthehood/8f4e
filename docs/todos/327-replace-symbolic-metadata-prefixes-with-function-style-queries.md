---
title: 'TODO: Replace symbolic metadata prefixes with function-style queries'
priority: Medium
effort: 1-2d
created: 2026-03-27
status: Open
completed: null
---

# TODO: Replace symbolic metadata prefixes with function-style queries

## Problem Description

8f4e currently uses a compact symbolic query family for memory metadata:

- `$name` for element count
- `%name` for element word size
- `^name` for element-type maximum
- `!name` for element-type minimum

This syntax is terse, but it is not very self-explanatory unless the user already knows the language. The `%` form in particular is easy to confuse with C modulo syntax, even though the intended meaning is closer to `sizeof(...)`.

Why this is a problem:
- the symbolic forms are harder to discover and teach than explicit query names
- `%name` is easy to misread for users with C/C++ background
- planned pointer-aware forms such as `%*buffer`, `^*buffer`, and `!*buffer` become harder to read as the syntax grows
- the language already has operator-like address/dereference forms (`&name`, `*name`) that map well to C intuition, so the metadata queries do not need to stay symbolic for consistency

Important design direction:
- keep `&name` and `*name` as operators
- move metadata queries to function-style syntax
- update examples/docs directly because the language is not released yet and backward compatibility is not required

## Proposed Solution

Replace the symbolic metadata operators with explicit function-style queries:

- `$name` -> `count(name)`
- `%name` -> `sizeof(name)`
- `^name` -> `max(name)`
- `!name` -> `min(name)`

Pointer-aware forms should follow the same pattern:

- `%*buffer` -> `sizeof(*buffer)`
- `^*buffer` -> `max(*buffer)`
- `!*buffer` -> `min(*buffer)`

Notes:
- `sizeof(...)` is intentionally modeled after C
- `max(...)` and `min(...)` are not direct C syntax, but they are clearer than the current symbolic forms
- `count(...)` is preferred over `length(...)` because the meaning is “number of elements in the declared memory item,” not string length or byte length

Open follow-up question:
- the current end-address form `name&` likely becomes the least readable symbolic survivor if metadata queries move to function forms
- this TODO should decide whether `name&` remains as-is or moves to an explicit form such as `endof(name)` in a separate pass

## Anti-Patterns

- Do not change `&name` and `*name` into function calls as part of this TODO.
- Do not partially migrate only one metadata operator family and leave the rest symbolic.
- Do not silently preserve the old symbolic query forms in docs/examples if the compiler syntax has already changed.
- Do not conflate runtime value queries with type-bound queries: `max(name)` and `min(name)` here mean type limits, not aggregate operations over data.

## Implementation Plan

### Step 1: Replace syntax parsing for metadata queries
- Update compiler syntax helpers that currently recognize `$`, `%`, `^`, and `!`
- Add parsing support for `count(...)`, `sizeof(...)`, `max(...)`, and `min(...)`
- Ensure local, pointer, and intermodule forms are supported where the symbolic equivalents currently work

### Step 2: Update pointer-aware query design
- Align existing/planned pointer-query todos with function syntax:
  - `sizeof(*name)`
  - `max(*name)`
  - `min(*name)`
- Ensure query parsing composes cleanly with dereference syntax

### Step 3: Update compiler resolution and code generation paths
- Replace symbolic query detection in push handlers and intermodule-resolution helpers
- Update tests that currently assert `$`, `%`, `^`, or `!` query forms
- Keep semantics unchanged while only changing the surface syntax

### Step 4: Update docs and examples
- Rewrite compiler docs and examples to use function-style queries
- Update any example code or tutorials that currently show symbolic metadata operators
- Decide and document the future of `name&` explicitly if it is not handled in the same pass

## Validation Checkpoints

- `rg -n "\\$[A-Za-z_]|%[A-Za-z_]|\\^[A-Za-z_]|![A-Za-z_]|\\$\\*|%\\*|\\^\\*|!\\*" packages/compiler docs src`
- `rg -n "element count|element word size|max value|min value|sizeof\\(|count\\(|max\\(|min\\(" packages/compiler/docs packages/compiler/src`
- `npx nx run compiler:test`

## Success Criteria

- [ ] `count(name)` replaces `$name` across compiler syntax, docs, and tests.
- [ ] `sizeof(name)` replaces `%name` across compiler syntax, docs, and tests.
- [ ] `max(name)` replaces `^name` across compiler syntax, docs, and tests.
- [ ] `min(name)` replaces `!name` across compiler syntax, docs, and tests.
- [ ] Pointer-aware query forms use `sizeof(*name)`, `max(*name)`, and `min(*name)` consistently.
- [ ] `&name` and `*name` remain operator syntax.
- [ ] Examples and user-facing docs no longer rely on the old symbolic metadata query forms.

## Affected Components

- `packages/compiler/src/syntax/` - metadata-query parsing and helper detection
- `packages/compiler/src/instructionCompilers/push/handlers/` - query resolution handlers
- `packages/compiler/tests/` - parser, intermodule, and push-handler coverage
- `packages/compiler/docs/` - language docs and examples
- `src/examples/` and other example sources - surface-syntax updates

## Risks & Considerations

- **Consistency risk**: migrating only some query forms will make the language more confusing, not less.
- **Readability tradeoff**: function-style queries are clearer but visually heavier than single-character prefixes.
- **Intermodule syntax**: `sizeof(module:buffer)` and related forms should be reviewed carefully so parser rules stay unambiguous.
- **End-address asymmetry**: once metadata queries become function-like, `name&` may stand out as an odd remaining symbolic special case.

## Related Items

- **Related**: [319-add-pointee-element-word-size-prefix-for-pointers.md](/Users/andorpolgar/git/8f4e/docs/todos/319-add-pointee-element-word-size-prefix-for-pointers.md)
- **Related**: [322-add-pointee-max-value-prefix-for-pointers.md](/Users/andorpolgar/git/8f4e/docs/todos/322-add-pointee-max-value-prefix-for-pointers.md)
- **Related**: [323-add-pointee-min-value-prefix-for-pointers.md](/Users/andorpolgar/git/8f4e/docs/todos/323-add-pointee-min-value-prefix-for-pointers.md)
- **Related**: [324-add-int16-pointer-types-to-compiler-and-runtime.md](/Users/andorpolgar/git/8f4e/docs/todos/324-add-int16-pointer-types-to-compiler-and-runtime.md)

## Notes

- This TODO intentionally treats explicit query names as a readability improvement, not a semantic change.
- The closest C analogue is `sizeof(...)`; `max(...)` and `min(...)` are language-specific names for type-bound queries.
