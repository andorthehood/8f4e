---
title: 'TODO: Add Explicit Store Wait Helpers'
priority: Medium
effort: 2-4h
created: 2026-01-04
status: Open
completed: null
---

# TODO: Add Explicit Store Wait Helpers

## Problem Description

The state manager exposes `subscribe` and `unsubscribe`, but there is no Promise-based helper for awaiting a single change or a specific value. Call sites must hand-roll subscription setup, immediate value checks, and cleanup logic, which risks inconsistent behavior and leaks.

## Proposed Solution

Add explicit wait helpers to the state manager:
- `waitForChange(selector)` resolves on the next change of the selected path.
- `waitForValue(selector, expectedValue)` resolves immediately if the current value already matches, otherwise resolves when the value becomes `expectedValue`.

Both helpers should use strict equality and unsubscribe after resolving. They return a Promise of the selected value for easy `await` usage.

## Implementation Plan

### Step 1: Define API and types
- Confirm the public method names and signatures for `waitForChange` and `waitForValue`.
- Add method overloads and return types to the `StateManager` interface and supporting types, aligned with `Path`/`PathValue` typing.
- Document the immediate-resolution semantics for `waitForValue`.

### Step 2: Implement wait helpers in state-manager
- Add `waitForChange` and `waitForValue` to `createStateManager`.
- Reuse `subscribe`/`unsubscribe` to implement Promise resolution and ensure cleanup.
- For `waitForValue`, perform an immediate check using `getState` before subscribing.

### Step 3: Add unit tests
- Cover immediate resolution when the current value already matches.
- Cover resolution on next change for `waitForChange`.
- Cover resolution when the value changes to the expected value.
- Assert that subscriptions are removed after resolution (no repeated resolves).

### Step 4: Update docs/todos index
- Add this TODO to `docs/todos/_index.md` with summary metadata.

## Success Criteria

- [ ] `waitForChange` resolves on the next value change and cleans up subscriptions.
- [ ] `waitForValue` resolves immediately when current value matches and on future matches otherwise.
- [ ] Tests cover immediate resolution, change-driven resolution, and cleanup behavior.
- [ ] Types enforce correct value inference for both methods.

## Affected Components

- `packages/editor/packages/state-manager/src/index.ts` - Add helper methods and implementation.
- `packages/editor/packages/state-manager/src/types.ts` - Add or refine typing for new methods.
- `packages/editor/packages/state-manager/src/index.test.ts` - Add test coverage.
- `docs/todos/_index.md` - Track the TODO entry.

## Risks & Considerations

- **Immediate resolution**: Ensure `waitForValue` returns synchronously resolved promises without leaving subscriptions behind.
- **Subscription cleanup**: Avoid memory leaks by guaranteeing unsubscribe on resolve.
- **Strict equality**: Confirm that reference types (objects/arrays) are intended to match by reference.
- **Breaking changes**: Additive API only; no expected breaking changes.

## Related Items

- **Related**: None yet.

## References

- N/A

## Notes

- Keep behavior consistent with current `subscribe` semantics (parent/child notifications).
- Consider adding a future `waitFor` helper if call sites prefer a single method with overloads.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context) 
