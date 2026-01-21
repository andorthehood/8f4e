---
title: 'TODO: Fix highlighting for int8[] and int8u[]'
priority: Medium
effort: 2-4 hours
created: 2026-01-21
status: Open
completed: null
---

# TODO: Fix highlighting for int8[] and int8u[]

## Problem Description

The `int8[]`, `int8u[]`, and `int16u[]` instructions are not syntax-highlighted. `int8u[]` and `int16u[]` are missing from the instruction list, and the current regex uses word boundaries (`\\b`) that do not reliably match tokens containing `[]`, which can cause `int8[]` to be skipped even though it is listed.

## Proposed Solution

Update the instruction list in `packages/editor/packages/editor-state/src/features/code-editing/highlightSyntax8f4e.ts` to include `int8u[]` and `int16u[]`, and adjust the instruction matcher so tokens containing `[]` are matched reliably (avoid failing word-boundary rules).

## Implementation Plan

### Step 1: Locate instruction token parsing
- Identify how instruction tokens are extracted and matched
- Find any regex that restricts instruction names to letters/underscores

### Step 2: Expand the instruction matcher
- Update the regex or parser so bracketed tokens like `int8[]` are matched reliably
- Ensure it does not regress existing highlighting rules

### Step 3: Add/adjust tests
- Add a test case that includes `int8[]`, `int8u[]`, and `int16u[]`
- Confirm they are highlighted as instructions

## Success Criteria

- [ ] `int8[]`, `int8u[]`, and `int16u[]` are highlighted as instructions
- [ ] Existing instruction highlighting remains unchanged
- [ ] Tests cover the new cases

## Affected Components

- `packages/editor/packages/editor-state/src/features/code-editing/highlightSyntax8f4e.ts` - instruction parsing/highlighting
- `packages/editor/packages/editor-state/src/features/code-editing/*` tests or snapshots

## Risks & Considerations

- **Regex Scope**: Expanding the token matcher could accidentally highlight numeric literals as instructions
- **Regression**: Ensure GLSL/highlight logic remains unaffected

## Related Items

- **Related**: Any TODOs about instruction parsing or highlighting consistency

## References

- `packages/editor/packages/editor-state/src/features/code-editing/highlightSyntax8f4e.ts`
