---
title: 'TODO: Add Disable Flag for Code Blocks'
priority: High
effort: 2-4 days
created: 2026-01-20
status: Completed
completed: 2026-01-20
---

# TODO: Add Disable Flag for Code Blocks

## Problem Description

The editor does not currently support disabling code blocks. The user wants a per-block flag that can be toggled from the context menu. Disabled blocks must:
- Be excluded from program compilation and config compilation.
- Persist in project JSON and runtime-ready export.
- Render with a transparent background so they are visually distinct.
- Remain editable (cursor and edits still allowed).

Current behavior: all blocks are compiled based on block type, and all blocks are rendered with the same module background fill sprite.

## Proposed Solution

Introduce a `disabled: boolean` flag on both:
- `CodeBlock` (persistent project format)
- `CodeBlockGraphicData` (runtime editor state)

Default it to `false` for new blocks and when loading a project without the flag.

Add a context menu action that toggles disabled state on the selected block. Use label variants:
- `Disable module`
- `Enable module`
Use the same label pattern for other block types (function/config/constants/shaders/comment) but label should still be “module” in the UI to match existing menu naming, unless the menu already uses the block-specific label (it does: moduleMenu derives blockLabel from blockType).

Exclude disabled blocks from:
- Program compiler input (modules/functions/constants)
- Config compiler input (config blocks)

Render disabled blocks with a transparent background (new fill sprite key). No other dimming required.

## Implementation Plan

### Step 1: Data model + defaults
- Add `disabled?: boolean` to `CodeBlock` in `packages/editor/packages/editor-state/src/features/code-blocks/types.ts`.
- Add `disabled: boolean` to `CodeBlockGraphicData` in the same file.
- Default `disabled` to `false` in:
  - `codeBlockCreator` when creating new `CodeBlockGraphicData`.
  - `graphicHelper` population from `initialProjectState` (map `codeBlock.disabled ?? false`).
  - `createMockCodeBlock` in `packages/editor/packages/editor-state/src/pureHelpers/testingUtils/testUtils.ts`.
- Ensure runtime-ready serialization still includes `disabled` in project JSON.

### Step 2: Serialization + import/export
- Update serialization:
  - `packages/editor/packages/editor-state/src/features/project-export/serializeCodeBlocks.ts` should include `disabled`.
  - `serializeToProject` and `serializeToRuntimeReadyProject` rely on the above.
- Update import:
  - `packages/editor/packages/editor-state/src/features/code-blocks/features/graphicHelper/effect.ts` should apply `disabled` from project blocks.
- Update snapshots:
  - `packages/editor/packages/editor-state/src/features/project-export/__snapshots__/serializeProject.ts.snap`
  - `packages/editor/packages/editor-state/src/features/project-export/__snapshots__/serializeRuntimeReadyProject.ts.snap`

### Step 3: Context menu + event handler
- Add a context menu item in `packages/editor/packages/editor-state/src/features/menu/menus/moduleMenu.ts`:
  - Title: `Disable ${blockLabel}` or `Enable ${blockLabel}` based on selected block’s `disabled` flag.
  - Action: `toggleCodeBlockDisabled`.
- Implement handler in `packages/editor/packages/editor-state/src/features/code-blocks/features/codeBlockCreator/effect.ts`:
  - Toggle `codeBlock.disabled`.
  - Update `codeBlock.lastUpdated` so cache invalidates.
  - Re-set `graphicHelper.codeBlocks` array to trigger store update.
- Only allow toggling if `featureFlags.editing` is true.

### Step 4: Compilation filters
- Update program compiler:
  - `packages/editor/packages/editor-state/src/features/program-compiler/effect.ts`
  - In `flattenProjectForCompiler`, filter out disabled blocks from modules/functions/constants.
- Update config compiler:
  - `packages/editor/packages/editor-state/src/features/config-compiler/collectConfigBlocks.ts`
  - Filter out disabled config blocks.
- Add/adjust tests to cover disabled filtering:
  - `packages/editor/packages/editor-state/src/features/code-blocks/creationIndex.test.ts` (compiler ordering test should ignore disabled).
  - `packages/editor/packages/editor-state/src/features/config-compiler/collectConfigBlocks.ts` tests should include disabled config block exclusion.

### Step 5: Rendering (transparent background)
- Add new fill color key:
  - `moduleBackgroundDisabled` to `packages/editor/packages/sprite-generator/src/types.ts`.
  - Add to `fillColors` list in `packages/editor/packages/sprite-generator/src/fillColors.ts`.
- Update color schemes:
  - `src/colorSchemes/default.ts`
  - `src/colorSchemes/hackerman.ts`
  - `src/colorSchemes/redalert.ts`
  - `packages/editor/packages/sprite-generator/src/defaultColorScheme.ts`
  - `packages/editor/packages/web-ui/screenshot-tests/utils/createMockStateWithColors.ts`
  - `packages/editor/packages/sprite-generator/tests/utils/testFixtures.ts`
- Update sprite-generator tests to include the new fill key:
  - `packages/editor/packages/sprite-generator/tests/types.test.ts` should assert `moduleBackgroundDisabled` exists.
- Update web UI rendering:
  - `packages/editor/packages/web-ui/src/drawers/codeBlocks/index.ts` should draw `moduleBackgroundDisabled` when `codeBlock.disabled` is true (dragged state should still use dragged sprite).
- Update screenshots if needed (web-ui screenshot tests).

## Success Criteria

- [ ] Disabled blocks persist in project JSON and runtime-ready export.
- [ ] Disabled blocks are not sent to program/config compilers.
- [ ] Context menu toggles disabled state with correct label.
- [ ] Disabled blocks render with transparent background.
- [ ] Tests updated/added and snapshots updated as needed.

## Affected Components

- `packages/editor/packages/editor-state/src/features/code-blocks/types.ts`
- `packages/editor/packages/editor-state/src/features/code-blocks/features/codeBlockCreator/effect.ts`
- `packages/editor/packages/editor-state/src/features/code-blocks/features/graphicHelper/effect.ts`
- `packages/editor/packages/editor-state/src/features/project-export/serializeCodeBlocks.ts`
- `packages/editor/packages/editor-state/src/features/program-compiler/effect.ts`
- `packages/editor/packages/editor-state/src/features/config-compiler/collectConfigBlocks.ts`
- `packages/editor/packages/editor-state/src/features/menu/menus/moduleMenu.ts`
- `packages/editor/packages/web-ui/src/drawers/codeBlocks/index.ts`
- `packages/editor/packages/sprite-generator/src/types.ts`
- `packages/editor/packages/sprite-generator/src/fillColors.ts`
- Color schemes and test fixtures listed in Step 5

## Risks & Considerations

- **Compiler errors**: Disabled modules are excluded; existing modules that reference them will fail to compile. This is expected.
- **Caching**: Must update `lastUpdated` to bust cached rendering for toggled blocks.
- **Backwards compatibility**: `disabled` is optional for older projects; treat missing as `false`.
- **Menu scope**: Make sure menu only appears for code blocks and uses existing `blockLabel` logic.

## Related Items

- **Blocks**: none
- **Depends on**: none
- **Related**: none

## Notes

- User requirements:
  - Disabled applies to all block types.
  - Blocks remain editable.
  - Visual change is only transparent background.
  - Menu label should be `Disable <label>` / `Enable <label>`.
  - Disabled state must be included in exported projects.
  - Compiler exclusion is acceptable even if it causes missing connections or compile errors for references.
