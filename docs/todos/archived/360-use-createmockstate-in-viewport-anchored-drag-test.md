---
title: 'TODO: Use createMockState in viewport-anchored dragging integration test'
priority: Low
effort: 30 minutes
created: 2026-04-02
status: Completed
completed: 2026-04-07
---

# TODO: Use createMockState in viewport-anchored dragging integration test

## Problem Description

`tests/code-blocks/viewportAnchoredDragging.test.ts` constructs the state object by hand. When new fields are added to the `Viewport` or other state slices, the manually built object silently omits them, which can cause tests to pass or fail for the wrong reasons.

This was observed when `roundedWidth`/`roundedHeight` were added: the test's hand-built state lacked these fields, causing `worldPositionToAnchoredPos` to receive `undefined` and the top-right anchor test to fail.

## Proposed Solution

Replace the inline state literal with `createMockState(overrides)`, which provides sensible defaults for all fields and only requires the test to specify the values it actually cares about.

```ts
// before
state = { featureFlags: ..., graphicHelper: ..., viewport: { x: 0, y: 0, vGrid: 10, ... } } as State;

// after
state = createMockState({
    featureFlags: { moduleDragging: true },
    viewport: { vGrid: 10, hGrid: 20, width: 800, height: 600, roundedWidth: 800, roundedHeight: 600 },
});
```

## Implementation Plan

### Step 1: Import createMockState
- Add import to `viewportAnchoredDragging.test.ts`

### Step 2: Replace the hand-built state literal
- Use `createMockState` with only the fields the tests need to control
- Remove fields that `createMockState` already provides correctly

## Success Criteria

- [ ] `viewportAnchoredDragging.test.ts` no longer builds state by hand
- [ ] All three tests continue to pass
- [ ] Adding new required viewport fields does not silently break this test file

## Affected Components

- `packages/editor/packages/editor-state/tests/code-blocks/viewportAnchoredDragging.test.ts`
