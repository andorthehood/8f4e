---
title: 'TODO: Add pointer-aware count and min metadata queries'
priority: Medium
effort: 2-4h
created: 2026-05-27
issue: null
status: Completed
completed: 2026-05-27
---

# TODO: Add pointer-aware count and min metadata queries

## Problem Description

Pointer-aware metadata queries are inconsistent across helper families. `sizeof(*name)` and `max(*name)` have
explicit pointee forms, but `min(*name)` and `count(*name)` do not.

Current state:
- `min(*ptr)` is classified like `min(name)` with target `*ptr`, so it fails unless a memory item literally has that id
- `count(*ptr)` behaves the same way
- an older todo tracks `min(*name)` only, but there is no combined tracking item for the broader pointer-helper gap

Why this is a problem:
- the helper family feels irregular once users learn pointer dereferencing syntax
- generic code has no direct way to ask for pointee lower bounds or pointee element count semantics
- future double-pointer helper work should not accidentally leave these forms undocumented or undefined

## Proposed Solution

Define and implement pointer-aware `min(*name)` and `count(*name)` semantics explicitly.

Suggested semantics:
- `min(*ptr)` returns the minimum finite value for the value reached by one dereference
- for double pointers, `min(*pptr)` describes the intermediate pointer slot and `min(**pptr)` describes the final pointee
- `count(*ptr)` should be designed deliberately before implementation, because a pointer value alone may not carry array length metadata

For `count(*name)`, choose one of these behaviors and document it:
- reject it with a clear semantic error unless the compiler has explicit pointee range/count metadata
- return `1` for scalar pointees and reserve array count support for future pointer range metadata
- support it only for pointers whose provenance can be traced to a known memory item with element count metadata

## Anti-Patterns

- Do not let `min(*ptr)` or `count(*ptr)` silently look for a memory item named `*ptr`.
- Do not invent array length information from a raw pointer address.
- Do not redefine existing `min(name)` or `count(name)` semantics for pointer-typed memory slots.

## Implementation Plan

### Step 1: Decide `count(*name)` semantics
- Pick an explicit behavior from the options above.
- Record the decision in this TODO and the language docs.

### Step 2: Extend parser support
- Add pointee query classifications for `min(*name)` and `count(*name)` if they are supported.
- Carry dereference depth if TODO 427 has already added that shape.

### Step 3: Add semantic resolution
- Resolve `min(*name)` from pointer metadata and requested depth.
- Resolve or reject `count(*name)` according to the chosen semantic model.

### Step 4: Add tests and docs
- Cover tokenizer classification.
- Cover semantic resolution or rejection.
- Cover public compiler behavior for supported forms.
- Update docs beside the existing `sizeof`, `count`, `max`, and `min` helper descriptions.

## Validation Checkpoints

- `npx nx run compiler:test -- --run packages/tokenizer/src/syntax/parseArgument.test.ts src/semantic/resolveCompileTimeArgument.test.ts src/utils/memoryData.test.ts`
- `npx nx run @8f4e/compiler:typecheck`

## Success Criteria

- [ ] `min(*ptr)` has explicit parser and semantic behavior.
- [ ] `count(*ptr)` has explicit parser and semantic behavior or an intentional clear rejection.
- [ ] Existing `min(name)` and `count(name)` behavior remains unchanged.
- [ ] Tests cover the chosen behavior for single pointers and double pointers where applicable.
- [ ] Language docs explain any limitations around pointer counts.

## Affected Components

- `packages/compiler-spec/src/arguments.ts` - argument metadata shape for any new pointee query kinds.
- `packages/compiler/packages/tokenizer/src/syntax/parseArgument.ts` - query classification.
- `packages/compiler/src/semantic/resolveCompileTimeArgument.ts` - compile-time query resolution.
- `packages/compiler/src/utils/memoryData.ts` - pointer metadata helpers.
- `packages/compiler/tests/instructions/` - public behavior tests if the forms are accepted.

## Risks & Considerations

- **Count ambiguity**: pointer addresses do not inherently encode the number of reachable elements.
- **Overlap with existing TODO 323**: this TODO broadens the older `min(*name)` item to include `count(*name)` and double-pointer consistency.
- **Breaking Changes**: Existing valid `min(name)` and `count(name)` code should not change.

## Related Items

- **Related**: `docs/todos/archived/323-add-pointee-min-value-prefix-for-pointers.md`
- **Related**: `docs/todos/427-add-depth-aware-pointer-metadata-query-dereferencing.md`

## Notes

- Created after reviewing helper behavior on 2026-05-27. At creation time, `min(*ptr)` and `count(*ptr)` classified
  as plain metadata queries against target `*ptr`, which was almost certainly not the intended long-term UX.
- Completed on 2026-05-27. Single-dereference `min(*ptr)` and `count(*ptr)` now classify explicitly and resolve from pointer metadata; `count(*ptr)` uses tracked memory-start pointee element counts when available and falls back to `1` for pointer values without count provenance.
