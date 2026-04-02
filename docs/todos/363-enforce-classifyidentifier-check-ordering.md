---
title: 'TODO: Enforce classifyIdentifier check ordering against misclassification'
priority: Low
effort: 1-2 hours
created: 2026-04-02
status: Open
completed: null
---

# TODO: Enforce classifyIdentifier check ordering against misclassification

## Problem Description

The `if`-chain in `classifyIdentifier` (`packages/compiler/packages/tokenizer/src/syntax/parseArgument.ts`) is order-dependent: earlier checks must run before later ones to avoid misclassification. There are currently three ordering constraints:

1. `intermodular-module-reference` (`&mod:`) before `intermodular-reference` (`&mod:mem`) — the module-base form would otherwise match the memory-reference regex.
2. `intermodular-module-nth-reference` (`&mod:0`) before `intermodular-reference` (`&mod:mem`) — digits are valid `[^\s&:.]+` characters, so `&mod:0` would silently classify as a named memory reference if the nth check came second.
3. All intermodular forms before the local `memory-reference` check (`&name`) — both start with `&`.

These constraints are implicit: comments explain some of them, but there is no compile-time or test-time guard. A future contributor adding or reordering a check could introduce a silent misclassification bug.

## Proposed Solution

Add a dedicated unit test suite for `classifyIdentifier` that asserts the correct `referenceKind` for tokens that are ambiguous across multiple checks. This makes the ordering constraints explicit and regression-safe without changing the runtime code.

Optionally, extract each guard into a clearly named helper and document the required order with an ordered list comment above the chain.

## Implementation Plan

### Step 1: Write ordering regression tests
- `&mod:` → `intermodular-module-reference`, not `intermodular-reference`.
- `&mod:0` → `intermodular-module-nth-reference`, not `intermodular-reference`.
- `&mod:mem` → `intermodular-reference`, not `memory-reference`.
- `&name` → `memory-reference`, not misclassified as any intermodular form.

### Step 2 (optional): Add an ordered-list comment
- Above the `if`-chain in `classifyIdentifier`, add a comment listing the required check order and the reason each constraint exists.

## Success Criteria

- [ ] Unit tests for `classifyIdentifier` cover all ambiguous token shapes.
- [ ] Tests fail if the ordering is violated (i.e., they are actually sensitive to the order).
- [ ] All existing tests continue to pass.

## Affected Components

- `packages/compiler/packages/tokenizer/src/syntax/parseArgument.ts`

## Risks & Considerations

- Low risk — tests only, no logic changes.

## Related Items

- Related: `362-refactor-argumentidentifier-to-discriminated-union.md`

## Notes

- None.
