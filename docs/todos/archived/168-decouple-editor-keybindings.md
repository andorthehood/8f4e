---
title: 'TODO: Decouple Editor Keybindings from Editor-State'
priority: Medium
effort: 2-3d
created: 2026-01-13
status: Completed
completed: 2026-01-13
---

# TODO: Decouple Editor Keybindings from Editor-State

## Problem Description

Editor-state currently consumes raw `keydown` events and encodes platform-specific shortcut logic. This makes the editor-state package host-specific, prevents clean macOS vs Windows/Linux mappings, and forces keyboard behavior into the state layer instead of the editor package. Tests also need to simulate raw keyboard events rather than higher-level actions.

## Proposed Solution

Move key mapping and platform-aware shortcut handling into `packages/editor`, and have editor-state consume abstract action events. Define a small set of action events (navigation, caret movement, text input, delete, and high-level actions like save/undo/redo). This keeps editor-state portable and lets host apps supply key maps without touching state logic.

## Implementation Plan

### Step 1: Inventory current keyboard usage
- Identify keydown consumers in editor-state and their tests.
- Confirm all keyboard-driven behaviors that need abstract events.

### Step 2: Define abstract event payloads
- Add types for `navigateCodeBlock`, `moveCaret`, `insertText`, `deleteBackward`, `insertNewLine`, plus existing `saveSession`, `undo`, `redo`.
- Reuse or mirror existing direction types used by navigation helpers.

### Step 3: Refactor editor-state effects
- Replace keydown listeners with `events.on(...)` handlers for the abstract events.
- Remove the keyboard shortcuts effect from editor-state and any exported keyboard event types.

### Step 4: Implement key mapping in the editor package
- Add a keyboard mapping module that listens to DOM `keydown` and dispatches abstract events.
- Implement platform-aware modifier logic (`metaKey` on macOS, `ctrlKey` elsewhere).
- Handle redo mappings (`Cmd+Shift+Z`, `Ctrl+Y`, `Cmd+Y`).
- Remove keydown/keyup handling from `packages/editor/src/events/humanInterface.ts`.

### Step 5: Update tests
- Update editor-state tests to emit abstract events instead of `keydown`.
- Remove any test dependencies on `InternalKeyboardEvent` if no longer used.

### Step 6: Cleanup and verification
- Ensure editor-state no longer listens to `keydown`.
- Confirm editor-state public API still exports any required types.
- Run affected tests via Nx.

## Success Criteria

- [ ] Editor-state handles navigation and editing through abstract events only.
- [ ] Key mapping and platform shortcuts live solely in the editor package.
- [ ] Tests target abstract events instead of raw `keydown`.
- [ ] `keydown` is no longer dispatched into editor-state.

## Affected Components

- `packages/editor/packages/editor-state/src/effects/keyboardShortcuts.ts` - Remove keydown-based shortcuts.
- `packages/editor/packages/editor-state/src/effects/codeBlockNavigation.ts` - Listen for `navigateCodeBlock`.
- `packages/editor/packages/editor-state/src/effects/codeBlocks/codeEditing.ts` - Listen for edit action events.
- `packages/editor/packages/editor-state/src/types.ts` - Add abstract event payload types.
- `packages/editor/src/events/humanInterface.ts` - Remove keydown dispatch.
- `packages/editor/src/index.ts` - Wire new keyboard mapping module.

## Risks & Considerations

- **Behavior parity**: Ensure the abstract events preserve current shortcut semantics.
- **Platform mapping**: Validate macOS vs Windows/Linux modifier handling.
- **Breaking changes**: Removing keyboard event types from editor-state may impact downstream consumers.

## Related Items

- **Related**: `docs/todos/167-decouple-syntax-highlighting.md`

## References

- `packages/editor/packages/editor-state/src/effects/keyboardShortcuts.ts`
- `packages/editor/packages/editor-state/src/effects/codeBlocks/codeEditing.ts`

## Notes

- Abstract event payloads:
  - `navigateCodeBlock`: `{ direction: 'left' | 'right' | 'up' | 'down' }`
  - `moveCaret`: `{ direction: 'left' | 'right' | 'up' | 'down' }`
  - `insertText`: `{ text: string }`
  - `deleteBackward`: no payload
  - `insertNewLine`: no payload
- Open questions:
  - Should `moveCaret` be suppressed when a code block is not selected?
  - Should `insertText` allow multi-character paste or only single character input?
  - Should `deleteBackward` be disabled when editing feature flag is off, or handled earlier in mapping?

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context)
