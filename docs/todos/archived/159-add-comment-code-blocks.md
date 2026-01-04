---
title: 'TODO: Add Comment Code Blocks'
priority: Medium
effort: 1-2d
created: 2026-01-02
status: Completed
completed: 2026-01-03
---

# TODO: Add Comment Code Blocks

## Problem Description

The editor currently supports module, function, config, constants, and shader blocks, but there is no block type for long-form notes. Users end up creating dummy modules or leaving inline semicolon comments, which are tied to compiler syntax and do not behave as standalone editor blocks. This makes documentation noisy and risks accidental compilation or errors.

## Proposed Solution

Introduce a dedicated `comment` block type (`comment` / `commentEnd`) that behaves like other block types in the editor UI and project serialization but is explicitly excluded from compiler input. The block should:
- Be recognized by block type detection.
- Be creatable via the context menu.
- Persist in project files.
- Never be passed to compiler or shader effect derivation.

Alternative: store comment blocks as metadata outside the code block list, but this complicates serialization and block positioning.

## Implementation Plan

### Step 1: Define the block type and detection
- Add `comment` to code block type unions.
- Extend `getBlockType` to detect `comment` / `commentEnd`.
- Add or update unit tests for block type detection.

### Step 2: Editor workflows and UI
- Add a menu entry to create a comment block and template its default code.
- Ensure block creation does not require an ID.
- Keep default rendering (no special styling).

### Step 3: Compilation and serialization rules
- Exclude comment blocks from compiler input.
- Ensure project serialization/deserialization keeps comment blocks unchanged.
- Confirm shader effect derivation and other block filters ignore comment blocks.

## Success Criteria

- [ ] Comment blocks are detected and labeled correctly in the editor.
- [ ] Comment blocks persist in projects and export/import cycles.
- [ ] Compiler inputs never include comment blocks.
- [ ] Unit tests cover detection and filtering behavior.

## Affected Components

- `packages/editor/packages/editor-state/src/types.ts` - Add `comment` to block type union.
- `packages/editor/packages/editor-state/src/pureHelpers/shaderUtils/getBlockType.ts` - Block detection.
- `packages/editor/packages/editor-state/src/effects/codeBlocks/blockTypeUpdater.ts` - Block type sync.
- `packages/editor/packages/editor-state/src/effects/codeBlocks/codeBlockCreator.ts` - New block template.
- `packages/editor/packages/editor-state/src/effects/compiler.ts` - Filter out comment blocks.
- `packages/editor/packages/editor-state/src/effects/menu/menus.ts` - Menu entry for creation.
- `packages/editor/packages/web-ui/src/drawers/codeBlocks/index.ts` - Optional styling changes.
- `packages/compiler/src/syntax/getBlockType.ts` - Optional, if compiler-side detection must stay in sync.

## Risks & Considerations

- **Syntax overlap**: Ensure `comment` markers do not conflict with line-level semicolon comments.
- **UI clarity**: Default styling means comment blocks look like other blocks; confirm this is acceptable.
- **Filtering**: Verify all compiler and shader pipelines exclude comment blocks.
- **Breaking changes**: None expected; new block type should be backward compatible.

## Related Items

- **Related**: `docs/todos/156-add-glsl-shader-code-blocks.md`
- **Related**: `docs/todos/153-constants-blocks.md`

## References

- `packages/editor/packages/editor-state/src/effects/compiler.ts`
- `packages/editor/packages/editor-state/src/pureHelpers/shaderUtils/getBlockType.ts`

## Notes

- Comment blocks use `comment` / `commentEnd` markers and do not require IDs.
- Default rendering is acceptable; no special styling planned.
- Comment blocks can appear anywhere in block ordering.
