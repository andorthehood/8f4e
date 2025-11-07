---
title: 'TODO: demo mode demo navigation'
priority: Medium
effort: 1-2 days
created: 2025-11-05
status: Completed
completed: 2025-11-04
---

# TODO: demo mode demo navigation

## Problem Description

- The editor currently lacks a presentation-friendly mode that automatically showcases code blocks.
- Without automated navigation the UI appears static during demos, requiring manual interaction.

## Proposed Solution

- Introduce a `demoMode` feature flag that, when enabled, selects an initial code block and triggers periodic navigation between blocks.
- Refactor `codeBlockNavigation` so the direction change logic can be reused by timer-driven automation.
- Ensure the viewport centers on the selected block and retains animation behavior for smooth demo transitions.

## Implementation Plan

### Step 1: Extend feature flag definitions
- Add `demoMode: boolean` with a default of `false` in editor-state and public config modules.
- Update validation utilities, docs, and the default flag set in `src/editor.ts`.
- Expected outcome: consumers can enable demo mode via initialization options.

### Step 2: Refactor navigation helper
- Extract the directional navigation logic from the keyboard handler into a reusable function.
- Reuse the helper for both keyboard events and demo automation.
- Expected outcome: single source of truth for code block navigation.

### Step 3: Implement automated demo behavior
- On project load (or `init`), pick a random code block if none is selected and center the viewport.
- Start a `setInterval` (2 s cadence) that chooses random directions and invokes the navigation helper while blocks exist.
- Store the interval reference for future teardown work when runtime toggles become supported.

### Step 4: Add tests and documentation
- Expand `codeBlockNavigation.test.ts` with fake timers to validate initial selection and periodic navigation when `demoMode` is true.
- Update feature flag configuration tests and `docs/feature-flags.md` with usage guidance.
- Expected outcome: regression coverage for the new behavior and guidance for presenters.

## Success Criteria

- [ ] Enabling `demoMode` results in automatic selection of a code block after project load.
- [ ] Editor cycles between code blocks every ~2 seconds while the flag is enabled.
- [ ] Unit and configuration tests cover the new flag and navigation automation.

## Affected Components

- `packages/editor/packages/editor-state/src/effects/codeBlockNavigation.ts` – refactor navigation and add demo timer.
- `packages/editor/src/config/featureFlags.ts` – append new flag and defaults.
- `docs/feature-flags.md` – document demo mode usage.
- `packages/editor/src/config/featureFlags.test.ts`, `packages/editor/packages/editor-state/src/effects/codeBlockNavigation.test.ts` – add coverage.

## Risks & Considerations

- **Async timing variance**: timers may drift; tests should use fake timers to avoid flakes.
- **Large projects**: random navigation might pick blocks outside the active viewport; ensure centering logic handles this gracefully.
- **Future toggles**: interval cleanup will be necessary if the flag becomes runtime-toggleable; keep interval handle accessible.

## Related Items

- **Depends on**: none
- **Related**: `docs/feature-flags.md`, `docs/todos/032-editor-test-coverage-plan.md` (testing expansion alignment)

## References

- `packages/editor/packages/editor-state/src/effects/codeBlockNavigation.ts`
- `packages/editor/src/config/featureFlags.ts`