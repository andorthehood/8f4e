# Todo: decouple editor keybindings from editor-state

## Goal
Move all keyboard bindings and platform-specific shortcuts into `packages/editor`, and make `editor-state` consume abstract action events instead of raw keydown events. This will allow platform-specific key maps (macOS vs Windows/Linux) without leaking key combinations into state logic.

## Scope
- Remove keydown-based shortcut handling from `editor-state`.
- Stop dispatching `keydown` events from `packages/editor/src/events/humanInterface.ts`.
- Introduce abstract events for navigation and editing consumed by `editor-state` effects.
- Implement platform-aware key mapping in `packages/editor` and dispatch abstract events.
- Update tests in `packages/editor/packages/editor-state` to target abstract events.

## Proposed abstract events and payloads
- `navigateCodeBlock`: `{ direction: 'left' | 'right' | 'up' | 'down' }`
- `moveCaret`: `{ direction: 'left' | 'right' | 'up' | 'down' }`
- `insertText`: `{ text: string }`
- `deleteBackward`: no payload
- `insertNewLine`: no payload
- Existing high-level events remain: `saveSession`, `undo`, `redo`

## Implementation steps
1) Inventory existing keydown consumers in `editor-state`
   - `packages/editor/packages/editor-state/src/effects/keyboardShortcuts.ts`
   - `packages/editor/packages/editor-state/src/effects/codeBlockNavigation.ts`
   - `packages/editor/packages/editor-state/src/effects/codeBlocks/codeEditing.ts`
   - Related tests such as `codeBlockNavigation.test.ts`

2) Define new event payload types (in `packages/editor/packages/editor-state/src/types.ts` or a new shared types module)
   - Add a `Direction` payload type (already exists in `findClosestCodeBlockInDirection`, can be reused or duplicated in types)
   - Add event payload interfaces for `navigateCodeBlock`, `moveCaret`, and `insertText`
   - Ensure the editor package can import these types via existing alias exports

3) Refactor `editor-state` effects to consume abstract events
   - Replace `codeBlockNavigation` keydown handler with `events.on('navigateCodeBlock', ...)` and call `navigateToCodeBlockInDirection`.
   - Replace `codeEditing` keydown handler with:
     - `events.on('moveCaret', ...)` and use `moveCaret` helper
     - `events.on('deleteBackward', ...)` and `backSpace` helper
     - `events.on('insertNewLine', ...)` and `enter` helper
     - `events.on('insertText', ...)` and `type` helper
   - Remove `keyboardShortcuts` effect from `editor-state` and its import/usage in `packages/editor/packages/editor-state/src/index.ts`.

4) Move key mapping to `packages/editor`
   - Add a new `packages/editor/src/keyboardShortcuts.ts` (or similar) that:
     - Attaches DOM `keydown` listener directly (not via `humanInterface` dispatch)
     - Maps platform-specific modifier keys (macOS uses `metaKey`, others use `ctrlKey`)
     - Dispatches abstract events to `EventDispatcher`
     - Handles both redo mappings: `Cmd+Shift+Z` (mac) and `Ctrl+Y` / `Cmd+Y`
     - Sends `navigateCodeBlock` on modifier + arrow key
     - Sends `moveCaret`, `insertText`, `deleteBackward`, `insertNewLine` for editing when modifier not held
   - Wire this from `packages/editor/src/index.ts` during editor init.
   - Update `packages/editor/src/events/humanInterface.ts` to remove keydown/keyup handling entirely.

5) Update tests
   - Update `codeBlockNavigation.test.ts` to register and trigger `navigateCodeBlock` instead of `keydown`.
   - Add/adjust tests for `codeEditing` if needed to validate `moveCaret` and `insertText` events.
   - Remove references to `InternalKeyboardEvent` in tests if no longer used.

6) Cleanup and verification
   - Ensure no `keydown` events are dispatched or listened to in `editor-state`.
   - Confirm editor-state public API still exports needed types.
   - Run affected tests via Nx if desired: `npx nx run editor-state:test`.

## Open questions to confirm during implementation
- Should `moveCaret` be suppressed when a code block is not selected (current behavior)?
- Should `insertText` allow multi-character paste or only single character input?
- Should `deleteBackward` be disabled when editing feature flag is off (current behavior) or handled earlier at mapping time?
