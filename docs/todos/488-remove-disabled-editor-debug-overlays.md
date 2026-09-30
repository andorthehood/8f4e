---
title: 'TODO: Remove disabled editor debug overlays'
priority: Medium
effort: 4-8h
created: 2026-09-30
issue: null
status: Open
completed: null
---

# TODO: Remove Disabled Editor Debug Overlays

## Problem Description

The editor still exposes `infoOverlay` and `consoleOverlay` feature flags, initializes defaults for them, carries their
state, and retains Web UI drawers for both overlays. Neither drawer is imported by the active renderer, so changing
either flag cannot display an overlay.

The overlays were deliberately disconnected from the render loop in commit `bd882a53b` (`fix(web-ui): disable debug
overlays`), but the surrounding feature surface was left in place. The feature-flag documentation still describes both
overlays as functional, including a debug-mode example. The console logger also continues collecting bounded log
entries in editor state even though the orphaned console drawer is the only in-repository reader of those entries.

This leaves nonfunctional public options, unnecessary runtime work, misleading documentation, and tests and fixtures
that must keep obsolete state shapes alive.

## Proposed Solution

Remove both overlay features completely, without compatibility fallbacks:

- Remove `infoOverlay` and `consoleOverlay` from the public feature-flag type, defaults, fixtures, and documentation.
- Delete the orphaned info and console overlay drawers and their dedicated tests or screenshot fixtures.
- Remove the internal console log state, logger helpers, and logging calls whose only purpose was feeding the console
  overlay.
- Preserve real runtime, compilation, and import behavior while removing the discarded logging side effects.

Keep the general `state.info` records, sampled render statistics, and the `@info` editor directive. Those have live
consumers independent of the removed info overlay. Also keep the mode overlay and its shared debug font and color
resources, and do not conflate the overlay logger with the separate `consoleLog` context-menu action that writes an
event to the browser console.

## Anti-Patterns

- Do not leave deprecated or ignored overlay flags in the public API.
- Do not reconnect the drawers to make the flags appear functional; the task is removal of features that were already
  intentionally disabled.
- Do not remove `state.info`, render-stat collection, `@info`, `modeOverlay`, or shared sprite colors still used by the
  mode overlay.
- Do not preserve `ConsoleState`, `LogMessage`, or logger calls solely for hypothetical future consumers.
- Do not rewrite archived TODOs or Git history to hide the earlier overlay implementation.

## Implementation Plan

### Step 1: Remove the public overlay switches

- Delete `infoOverlay` and `consoleOverlay` from `FeatureFlags`.
- Remove both defaults from the canonical feature-flag configuration.
- Update editor-state testing utilities, Web UI screenshot fixtures, and configuration examples that construct complete
  flag objects.
- Coordinate with TODO 274 so only the canonical live feature-flag implementation needs updating.

### Step 2: Remove the orphaned drawers

- Delete `drawers/infoOverlay.ts` and `drawers/consoleOverlay.ts`.
- Remove drawer-specific tests, exports, fixtures, and documentation.
- Confirm that the active Web UI render loop has no remaining overlay branches or imports.

### Step 3: Remove console logging state

- Remove `ConsoleState` and `LogMessage` from editor-state types and delete `state.console` initialization.
- Delete the editor-state logger helper and its README/tests.
- Remove logger imports and calls from project import, program compilation, and runtime effects while preserving their
  actual control flow, callbacks, state updates, and error handling.

### Step 4: Correct documentation and focused tests

- Remove the overlay flags and debug-mode example from `docs/feature-flags.md`.
- Update comments that describe the console state as part of the public editor state.
- Retain or add focused tests proving that the remaining mode overlay, render statistics, and `@info` directive are
  unaffected.

## Validation Checkpoints

- `rg -n "infoOverlay|consoleOverlay|ConsoleState|LogMessage|state\\.console" packages/editor docs/feature-flags.md`
- `npx nx run-many --target=test --projects=@8f4e/editor-state,@8f4e/web-ui,@8f4e/editor-core`
- `npx nx run-many --target=typecheck --projects=@8f4e/editor-state-types,@8f4e/editor-state,@8f4e/web-ui,@8f4e/editor-core`
- `npx nx run @8f4e/editor-website:build`
- Manually verify that edit/view mode hints still render and that `@info` blocks still display live information.

## Success Criteria

- [ ] The public feature-flag API contains neither `infoOverlay` nor `consoleOverlay`.
- [ ] The two orphaned Web UI drawers and their dedicated coverage are removed.
- [ ] Editor state no longer allocates or mutates an internal console log buffer.
- [ ] Project import, compilation, and runtime behavior remain unchanged apart from removal of invisible logging work.
- [ ] Feature-flag documentation no longer advertises either overlay.
- [ ] `state.info`, render statistics, `@info`, `modeOverlay`, and the browser-console menu action remain functional.
- [ ] Relevant tests, typechecks, and the editor website build pass.

## Affected Components

- `packages/editor/packages/editor-core/packages/editor-state-types/src/index.ts` - remove overlay flags and console types.
- `packages/editor/packages/editor-core/packages/editor-state/src/pureHelpers/state/featureFlags.ts` - remove canonical
  defaults.
- `packages/editor/packages/editor-core/packages/editor-state/src/features/logger/` - remove the unconsumed logging
  subsystem.
- `packages/editor/packages/editor-core/packages/editor-state/src/features/project-import/effect.ts` - remove overlay
  logger calls without changing import behavior.
- `packages/editor/packages/editor-core/packages/editor-state/src/features/program-compiler/effect.ts` - remove overlay
  logger calls without changing compilation behavior.
- `packages/editor/packages/editor-core/packages/editor-state/src/features/runtime/effect.ts` - remove overlay logger
  calls without changing runtime behavior.
- `packages/editor/packages/editor-core/packages/web-ui/src/drawers/infoOverlay.ts` - remove orphaned info rendering.
- `packages/editor/packages/editor-core/packages/web-ui/src/drawers/consoleOverlay.ts` - remove orphaned console rendering.
- `packages/editor/packages/editor-core/packages/editor-state-testing/src/index.ts` and editor test fixtures - narrow the
  complete feature-flag and state shapes.
- `docs/feature-flags.md` - remove stale overlay documentation and examples.

## Risks & Considerations

- **Shared visual resources**: `fontDebugInfo` and `debugInfoBackground` are still used by `modeOverlay`; remove only
  resources proven exclusive to the deleted drawers.
- **Logger call sites**: Some calls sit beside real failure handling. Remove the log side effect without swallowing,
  rethrowing, or otherwise changing errors.
- **Public state shape**: The editor exposes its state object. The project is unreleased, so no compatibility shim is
  required, but all internal fixtures must be updated consistently.
- **Historical documentation**: Archived TODOs may continue describing the old implementation as historical evidence.

## Related Items

- **Related**: `docs/todos/archived/274-consolidate-default-feature-flags-source.md`
- **Historical**: `docs/todos/archived/113-console-overlay.md`

## Notes

A repository audit on 2026-09-30 found no production read of either overlay flag and no import of either drawer. The
render-loop disconnection dates to 2026-04-24.

## Archive Instructions

Set `status: Completed` and the completion date, move this file to `docs/todos/archived/`, and update
`docs/todos/_index.md`.
