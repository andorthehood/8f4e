---
title: 'TODO: Toggle position offsetters via function key'
priority: Medium
effort: 1-2h
created: 2026-01-13
status: Completed
completed: 2026-01-22
---

# TODO: Toggle position offsetters via function key

## Problem Description

Position offsetters let the 8f4e program drive code block positions via memory. When mappings go wrong, the editor can become hard to read or navigate. We need a fast toggle to disable offsetters without relying on code edits.

## Proposed Solution

Add a dedicated event to toggle position offsetters at runtime and store the toggle as a feature flag. Bind a function key in the host layer to dispatch the event to the editor package, then have the editor package update the feature flag and web-ui gate offset application based on the flag.
- Keep key mapping outside editor-state (platform-specific).
- Update a feature flag in editor-state on toggle.
- In web-ui, skip reading memory offsets and force offsets to `0` when the flag is disabled.

## Implementation Plan

### Step 1: Add feature flag
- Introduce `featureFlags.positionOffsetters: boolean` with a default of `true`.

### Step 2: Add a toggle event
- Define `togglePositionOffsetters` and handle it in the editor package to flip the flag.

### Step 3: Respect the toggle in web-ui
- Gate memory reads for offsets in web-ui and force `offsetX/offsetY` to `0` when disabled.

### Step 4: Bind a function key in host
- Add a keydown handler (suggest `F10`) in the app layer to dispatch `togglePositionOffsetters`.

## Success Criteria

- [ ] Function key toggles position offsetters without requiring code edits.
- [ ] Offsets stop applying immediately when disabled.
- [ ] Re-enabling restores offset behavior without reload.

## Affected Components

- `packages/editor/packages/editor-state/src/types.ts` - add feature flag
- `packages/editor/packages/editor-state/src/pureHelpers/state/createDefaultState.ts` - default flag
- `packages/editor/packages/editor-state/src/pureHelpers/state/featureFlags.ts` - default flag wiring
- `packages/editor/packages/editor-state/src/effects/codeBlocks/positionOffsetters.ts` - apply toggle
- `packages/editor/packages/editor-state/src/effects/codeBlocks/graphicHelper.ts` - toggle hook
- `packages/editor/packages/web-ui/src/drawers/codeBlocks/index.ts` - gate offset reads when disabled
- `src/editor.ts` - host key binding

## Risks & Considerations

- **UX**: Pick a function key that avoids browser-reserved shortcuts.
- **State**: Ensure toggle does not mutate code blocks, only view state.
- **Parity**: Keep behavior consistent across platforms by exposing the event.

## Related Items

- **Related**: `docs/todos/168-decouple-editor-keybindings.md`

## Notes

- Prefer an event-based toggle to keep editor-state decoupled from key mapping.
