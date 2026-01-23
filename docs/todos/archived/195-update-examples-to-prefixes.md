---
title: 'TODO: Update Example Code to Use %/^/! Prefixes'
priority: Medium
effort: 2-4h
created: 2026-01-21
status: Completed
completed: 2026-01-21
---

# TODO: Update Example Code to Use %/^/! Prefixes

## Problem Description

Examples currently use manual constants like `WORD_SIZE` and integer limit literals (e.g., `MAX_8U`) for memory math and bounds checks. Now that `%` (element word size) and `^`/`!` (max/lowest element values) prefixes are available, the examples should be updated to demonstrate those idioms, reduce magic numbers, and align with the language’s preferred style.

## Proposed Solution

Sweep example projects and modules to replace:
- `WORD_SIZE` usage with `%name` where the size is tied to a specific memory item.
- Manual integer limit constants (e.g., `MAX_8U`, `MIN_16S`, `MAX_32S`) with `^name` or `!name` when the limit corresponds to the element type of that memory item.

This should be done carefully so that uses of `WORD_SIZE` that are truly global (not tied to a specific memory item) are either kept or replaced with an equivalent element prefix that preserves behavior.

## Implementation Plan

### Step 1: Identify candidate examples
- Search `src/examples/projects` and `src/examples/modules` for `WORD_SIZE`, `MAX_`, `MIN_`, and related constants.
- Note where constants are used for buffer math vs. global configuration.

### Step 2: Replace with prefixes
- Replace memory-item-specific size math with `%memoryName`.
- Replace memory-item-specific bounds with `^memoryName` / `!memoryName`.
- Keep or adjust global constants if they are not tied to a memory item.
- If an example module lists `integerLimits` or the env constants block only to access `WORD_SIZE`, remove that dependency.
- If a project has an `integerLimits` block, remove it after migrating to `^`/`!` prefixes. Never remove the env constants block.
- Remove `WORD_SIZE` from `generateEnvConstantsBlock` and update its tests accordingly.

### Step 3: Verify examples still behave as intended
- Run existing example smoke checks if available.
- Manually inspect for semantic changes in pointer arithmetic and bounds logic.

## Success Criteria

- [ ] Example projects and modules prefer `%`, `^`, and `!` where appropriate.
- [ ] No behavior regressions in example outputs or expected logic.
- [ ] Examples clearly demonstrate the new prefix features.

## Affected Components

- `src/examples/projects/*`
- `src/examples/modules/*`
- `src/__tests__/*` and package tests that reference `WORD_SIZE`
- `docs/README.md` (optional: update snippets to match new style)

## Risks & Considerations

- **Semantic drift**: Replacing `WORD_SIZE` must preserve the intended base type (ensure the prefix targets the correct memory item).
- **Global constants**: Some uses may intentionally be global; don’t replace those without a clear memory target.
## Related Items

- **Related**: Completed TODO 193 (Add Min/Max Value Prefixes for Memory Items)
- **Related**: `packages/compiler/docs/prefixes.md`

## Notes

- Use `%buffer` when the arithmetic is about buffer element size.
- Use `^buffer` / `!buffer` when clamping or comparing to element type bounds.
