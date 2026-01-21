---
title: 'TODO: Add editorConfig blocks (non-project)'
priority: High
effort: 1-2 days
created: 2026-01-21
status: Open
completed: null
---

# TODO: Add editorConfig blocks (non-project)

## Problem Description

Editor settings are currently loaded/saved via callbacks and stored in editor state, but there is no config block for editor-only settings. We want a dedicated `editorConfig` block type that uses stack-config language, is validated with its own schema, and does not get saved into project files. The existing editor-settings logic can be removed without backward compatibility.

## Proposed Solution

Introduce `editorConfig` / `editorConfigEnd` blocks and a separate editor config schema. Compile editor config blocks using the existing stack-config compiler, apply the result to `state.editorSettings`, and persist via the existing `saveEditorSettings` callback. Persist the full editorConfig block source (including markers and comments) as the source of truth in local storage (store a single string, e.g. `editorConfig_source`). Exclude editorConfig blocks from project serialization/import.

## Implementation Plan

### Step 1: Add editorConfig schema and compilation flow
- Define `getEditorConfigSchema` with fields like `colorScheme` and `font`
- Reuse the config combiner/error mapping utilities for editorConfig blocks
- Merge compiled editor config onto defaults and write to `state.editorSettings`

### Step 2: Add new block type and parsing
- Add `editorConfig` to `CodeBlockType`
- Update block-type detection to recognize `editorConfig` / `editorConfigEnd`
- Ensure editorConfig blocks are excluded from module compilation

### Step 3: Persistence and serialization rules
- Replace the existing editor-settings persistence logic with editorConfig persistence (no backwards compatibility)
- Persist the full editorConfig block source via callbacks (store as one string including markers/comments)
- Exclude editorConfig blocks from project serialization
- Ignore editorConfig blocks on project import (or strip them)

## Success Criteria

- [ ] `editorConfig` blocks compile with a dedicated schema
- [ ] Editor settings update and persist via callbacks
- [ ] Project files do not include editorConfig blocks

## Affected Components

- `packages/editor/packages/editor-state/src/features/config-compiler/*` - shared compilation pipeline
- `packages/editor/packages/editor-state/src/features/editor-settings/*` - apply compiled editor settings
- `packages/editor/packages/editor-state/src/features/code-blocks/utils/codeParsers/getBlockType.ts` - new block markers
- `packages/editor/packages/editor-state/src/features/project-export/*` - serialization filtering

## Risks & Considerations

- **Separation**: Ensure editorConfig data never leaks into `compiledConfig`
- **Persistence**: Avoid unintended overwrites of editor settings from local storage
- **User Experience**: Define clear precedence between local settings and editorConfig blocks

## Related Items

- **Depends on**: Rename config blocks to projectConfig (TODO: 201)

## References

- `packages/editor/packages/editor-state/src/features/editor-settings/README.md`

## Notes

- EditorConfig blocks are session/editor-only and should not be part of runtime-ready exports.
