---
title: 'TODO: Consolidate defaultFeatureFlags into a single source of truth'
priority: Medium
effort: 2-4h
created: 2026-02-21
status: Open
completed: null
---

# TODO: Consolidate defaultFeatureFlags into a single source of truth

## Problem Description

There are currently two `defaultFeatureFlags` definitions:
- `packages/editor/src/config/featureFlags.ts`
- `packages/editor/packages/editor-state/src/pureHelpers/state/featureFlags.ts`

This duplication creates drift risk and makes feature-flag changes easy to miss in one location.

## Proposed Solution

Keep one canonical `defaultFeatureFlags` definition and make the other package consume it instead of redefining it.

## Implementation Plan

### Step 1: Decide ownership
- Pick the canonical owner (`editor-state` or `editor`) for defaults.
- Confirm import direction constraints to avoid circular dependencies.

### Step 2: Remove duplicate definition
- Replace the non-canonical `defaultFeatureFlags` with an import/re-export from the canonical module.
- Keep `validateFeatureFlags` behavior unchanged.

### Step 3: Update tests and docs
- Update tests that assert defaults so they validate the shared source.
- Verify feature-flag docs reflect the single-source setup.

## Success Criteria

- [ ] Only one `defaultFeatureFlags` constant exists in the codebase
- [ ] `validateFeatureFlags` behavior remains unchanged across packages
- [ ] Editor and editor-state test suites remain green

## Affected Components

- `packages/editor/src/config/featureFlags.ts`
- `packages/editor/packages/editor-state/src/pureHelpers/state/featureFlags.ts`
- `packages/editor/src/config/featureFlags.test.ts`
- `packages/editor/src/integration/featureFlags.test.ts`

## Notes

- This is tracked as technical debt cleanup; behavior should not change.
