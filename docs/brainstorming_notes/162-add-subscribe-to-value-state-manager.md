---
title: 'TODO: Add subscribeToValue to State Manager'
priority: Medium
effort: 2-4h
created: 2026-01-07
status: Completed
completed: 2026-01-07
---

# TODO: Add subscribeToValue to State Manager

## Problem Description

The state manager supports `subscribe` and `waitForValue`, but there is no way to keep a subscription that fires only when a value matches a predicate or a specific primitive. Current subscribers must handle their own filtering and stay subscribed manually, which makes repetitive logic and increases risk of missed unsubscribe behavior.

## Proposed Solution

Add `subscribeToValue` to the state-manager API that accepts a path, a comparator function or a single primitive expected value, and a callback. The subscription should only fire when the new value matches the comparator or equals the expected primitive (`===`). The subscription stays active until `unsubscribe` is called with the same path and callback.

## Implementation Plan

### Step 1: Extend types and subscription payload
- Add matcher/primitive types to `types.ts`
- Extend `Subscription` to optionally store a matcher
- Update `StateManager` interface with `subscribeToValue`

### Step 2: Implement subscribeToValue and set logic
- Add `createSubscribeToValue` implementation
- Wire it in `createStateManager`
- Update `set` to evaluate matcher subscriptions on value changes

### Step 3: Tests and docs
- Add tests for primitive and predicate matching, including unsubscribe behavior
- Update `README.md` with usage examples and API reference

## Success Criteria

- [ ] `subscribeToValue` triggers only when comparator returns true or primitive matches using `===`
- [ ] Subscriptions remain active until explicit `unsubscribe(path, callback)`
- [ ] Unit tests cover matching, non-matching, and unsubscribe flows
- [ ] README documents the new API

## Affected Components

- `packages/editor/packages/state-manager/src/types.ts` - matcher types and subscription shape
- `packages/editor/packages/state-manager/src/subscribe.ts` - new subscribe function
- `packages/editor/packages/state-manager/src/set.ts` - matcher evaluation
- `packages/editor/packages/state-manager/src/index.ts` - API wiring
- `packages/editor/packages/state-manager/src/index.test.ts` - new tests
- `packages/editor/packages/state-manager/README.md` - documentation

## Risks & Considerations

- **Breaking Changes**: Ensure existing `subscribe` behavior is unchanged
- **Performance**: Matcher checks add overhead on `set`; keep logic minimal
- **Type Safety**: Restrict value matching to primitives for now

## Related Items

- **Related**: TODO 161 (completed wait helpers in state-manager)

## References

- `packages/editor/packages/state-manager/src/index.ts`
- `packages/editor/packages/state-manager/src/set.ts`

## Notes

- Keep value matching to strict primitive equality (`===`) when using the expected value form
