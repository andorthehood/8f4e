---
title: 'TODO: Replace editor config modules with browser-local note blocks'
priority: Medium
effort: 3-5h
created: 2026-05-06
status: Completed
completed: 2026-05-06
---

# TODO: Replace editor config modules with browser-local note blocks

## Problem Description

The editor currently has a special `module editorConfig` block that is saved outside the normal project. This makes browser-local editor state look like compilable 8f4e code, even though it is not project-owned and should not be part of the compiled program.

The desired model is to support multiple browser-local code blocks tied to the user's browser rather than to the project. These blocks should be normal note blocks in the editor, not modules, and only specific notes should use this browser-local storage path.

## Proposed Solution

Represent browser-local blocks as named notes whose header starts with `local.`:

```8f4e
note local.editorConfig
; @favorite
; @config font ibmvga8x16
noteEnd
```

Use the `note local.` prefix as the discriminator. Do not add extra validation for the suffix beyond checking the prefix; names such as `local.foo`, `local.foo.bar`, and `local.editorConfig` should all be acceptable.

Because the software has not been released yet, do not add compatibility shims for the old `module editorConfig` format or old storage shape.

## Implementation Plan

### Step 1: Rename the editor config storage concept

- Replace `EditorConfigStorageBlock` naming with a more general browser-local note storage type.
- Rename callback names from `loadEditorConfigBlocks` / `saveEditorConfigBlocks` to browser-local note equivalents.
- Rename the app storage key away from `editorConfigBlocks_editor`.

### Step 2: Add local note helpers

- Add helpers that identify browser-local note code by checking for a first line that starts with `note local.`.
- Require the block to be a note before saving or injecting it.
- Avoid suffix validation so nested names like `local.foo.bar` remain valid.

### Step 3: Replace `module editorConfig`

- Change the default block from `module editorConfig` to `note local.editorConfig`.
- Keep existing editor config directives inside the note, including `; @config font ibmvga8x16`.
- Remove module-id based `editorConfig` detection.

### Step 4: Save and load multiple local notes

- Load all stored local note blocks and inject them after the project code blocks are populated.
- If no stored local notes exist, inject the default `note local.editorConfig` block.
- Place each loaded local note with the existing free-space mechanism so it does not collide with project blocks or with other local notes loaded in the same batch.
- Do not move local notes that have an `@viewport` editor directive; those blocks should keep their viewport-anchored positioning semantics.
- When computing free-space blockers, do not treat `@viewport` anchored coordinates as ordinary world-space grid coordinates. Either exclude viewport-anchored blocks from the collision scan or use their actual resolved world-space bounds.
- Save all current `note local.*` blocks to browser-local storage when one of those blocks changes.
- Save local notes when their `@pos` is updated through drag-end handling. This currently flows through `graphicHelper.selectedCodeBlockForProgrammaticEditWithoutCompilerTrigger.code`.
- Save local notes when the `graphicHelper.codeBlocks` array changes so deletes, additions, and bulk operations do not leave stale local notes in browser-local storage.

### Step 5: Exclude local notes from project export

- Update project serialization to exclude `note local.*` blocks.
- Keep ordinary notes and shader notes project-owned unless their header uses the `local.` prefix.

## Success Criteria

- [x] `module editorConfig` is no longer used for browser-local editor configuration.
- [x] `note local.editorConfig` is created by default when no local notes are stored.
- [x] Multiple `note local.*` blocks can be stored in browser-local storage.
- [x] Multiple loaded `note local.*` blocks are placed into free spots without overlapping project blocks or each other.
- [x] Loaded `note local.*` blocks with `@viewport` are not repositioned by free-space placement.
- [x] Free-space placement does not use viewport-anchored `gridX`/`gridY` offsets as if they were world-space coordinates.
- [x] Dragging a `note local.*` block persists its updated position.
- [x] Deleting a `note local.*` block removes it from browser-local storage.
- [x] Ordinary `note` blocks remain part of the project.
- [x] Shader notes such as `note fragmentShaderPostprocess` remain part of the project.
- [x] Project export excludes only `note local.*` blocks.
- [x] No compatibility shim is added for the old unreleased `module editorConfig` behavior.

## Affected Components

- `src/storage-callbacks.ts` - browser-local storage callbacks and storage key.
- `src/editor.ts` - callback wiring.
- `packages/editor/packages/editor-state-types/src/features/browser-local-notes/types.ts` - browser-local note storage type.
- `packages/editor/packages/editor-state/src/features/browser-local-notes/browserLocalNotes.ts` - local note detection and serialization.
- `packages/editor/packages/editor-state/src/features/browser-local-notes/effect.ts` - load/save behavior for multiple local notes.
- `packages/editor/packages/editor-state/src/features/code-blocks/utils/finders/findFirstFreeCodeBlockGridY.ts` - existing free-space placement helper reused or adjusted for batch placement.
- `packages/editor/packages/editor-state/src/features/project-export/serializeCodeBlocks.ts` - project export exclusion rule.

## Risks & Considerations

- **Name clarity**: Use `local.` rather than `session.` because these blocks are browser-local and persistent, not temporary session data.
- **Colon syntax**: Avoid `local:foo`; `:` already carries meaning in 8f4e inter-module references.
- **Validation creep**: Do not reject nested local names such as `local.foo.bar`; prefix matching is enough for this unreleased feature.
- **Viewport anchoring**: `@viewport` blocks intentionally use anchored coordinates, so free-space collision placement should not rewrite their position.
- **Collision coordinates**: For viewport-anchored blocks, `gridX`/`gridY` are offsets from the anchor, not world-space placement. Reusing the existing bounds helper blindly can produce incorrect collision decisions.
- **Save triggers**: Position changes may be programmatic edits without compiler triggers, and deletions may only appear as `graphicHelper.codeBlocks` array changes. Local-note persistence must cover both.
