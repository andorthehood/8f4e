---
title: 'TODO: Add clipboard callbacks to editor-state'
priority: Medium
effort: 2-4h
created: 2026-01-08
status: Open
completed: null
---

# TODO: Add clipboard callbacks to editor-state

## Problem Description

The editor-state package currently uses `navigator.clipboard` directly when creating and copying code blocks. This ties the package to browser APIs and blocks portability to non-JS runtimes. We need a callback-based abstraction so the editor-state logic can be platform-agnostic.

## Proposed Solution

Introduce clipboard callbacks in the editor-state external API and wire them through effects so clipboard operations are performed by the host environment. If callbacks are not provided, clipboard-related menu actions should be disabled (no defaults) and should fail silently. Implement the clipboard API calls in `packages/editor/src/index.ts` by supplying callbacks there, without exporting them further outside the editor package.

## Implementation Plan

### Step 1: Define clipboard callbacks in types
- Add optional `readClipboardText` and `writeClipboardText` callbacks to editor-state options
- Document expected behavior and error handling semantics

### Step 2: Wire callbacks into code block creation
- Replace direct `navigator.clipboard` usage in `codeBlockCreator` with the new callbacks
- Disable `Paste Module` (main menu) when `readClipboardText` is missing
- Disable `Copy <block>` (module menu) when `writeClipboardText` is missing
- Implement callbacks in `packages/editor/src/index.ts` that call `navigator.clipboard` directly
- Hide or disable menu items when callbacks are missing
- Ensure failure paths are handled (e.g., callback rejected)

### Step 3: Tests and docs
- Update editor-state tests to mock the new callbacks
- Add usage notes to editor-state README or relevant docs

## Success Criteria

- [ ] No direct `navigator.clipboard` calls in editor-state runtime code
- [ ] Clipboard operations are routed through callbacks
- [ ] Menu items are unavailable when callbacks are undefined
- [ ] Missing callbacks are handled silently (no warnings/errors)
- [ ] Tests cover clipboard success and failure paths
- [ ] Documentation describes the new callbacks and expected behavior

## Affected Components

- `packages/editor/packages/editor-state/src/types.ts` - options and callback types
- `packages/editor/packages/editor-state/src/effects/codeBlocks/codeBlockCreator.ts` - clipboard integration
- `packages/editor/packages/editor-state/src/effects/menu/menus.ts` - menu item disabled state
- `packages/editor/packages/editor-state/src/effects` tests - callback mocking and assertions
- `packages/editor/src/index.ts` - in-editor callback handling
- `docs/brainstorming_notes/021-editor-state-portability-audit.md` - reference for portability context

## Risks & Considerations

- **Breaking Changes**: Menu items become unavailable when callbacks are missing
- **Error Handling**: Decide how rejected callbacks are surfaced to the user
- **Portability**: Keep the API minimal and not browser-specific

## Related Items

- **Related**: `docs/brainstorming_notes/021-editor-state-portability-audit.md`

## References

- `packages/editor/packages/editor-state/src/effects/codeBlocks/codeBlockCreator.ts`

## Notes

- This is a portability-driven change to remove browser API dependencies from editor-state

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context)
