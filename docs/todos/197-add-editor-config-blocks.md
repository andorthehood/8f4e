---
title: 'TODO: Add config editor blocks (non-project)'
priority: High
effort: 1-2 days
created: 2026-01-21
status: Open
completed: null
---

# TODO: Add config editor blocks (non-project)

## Problem Description

Editor settings are currently loaded/saved via callbacks and stored in editor state, but there is no config block for editor-only settings. We want a dedicated `config editor` block type that uses stack-config language, is validated with its own schema, and does not get saved into project files. The existing editor-settings logic can be removed without backward compatibility.

## Proposed Solution

Introduce `config editor` / `configEnd` blocks and a separate editor config schema. Compile editor config blocks using the existing stack-config compiler, apply the result to `state.editorSettings`, and persist via the existing `saveEditorSettings` callback. Persist the full editor config block source (including markers and comments) as the source of truth in local storage (store as `string[]`, e.g. `editorConfig_source`). Exclude `config editor` blocks from project serialization/import.

## Implementation Plan

### Step 1: Add editor config schema and compilation flow
- Define `getEditorConfigSchema` with fields like `colorScheme` and `font`
- Reuse the config combiner/error mapping utilities for `config editor` blocks
- Merge compiled editor config onto defaults and write to `state.editorSettings`

### Step 2: Add new block type and parsing
- Use `config editor` markers and store the config type on the block
- Update block-type detection to recognize `config <type>` and set `editor` when present
- Ensure `config editor` blocks are excluded from module compilation

### Step 3: Persistence and serialization rules
- Replace the existing editor-settings persistence logic with editor config persistence (no backwards compatibility)
- Persist the full editor config block source via callbacks (store as `string[]` including markers/comments)
- Exclude `config editor` blocks from project serialization
- Ignore `config editor` blocks on project import (or strip them)

## Success Criteria

- [ ] `config editor` blocks compile with a dedicated schema
- [ ] Editor settings update and persist via callbacks
- [ ] Project files do not include `config editor` blocks

## Affected Components

- `packages/editor/packages/editor-state/src/features/config-compiler/*` - shared compilation pipeline
- `packages/editor/packages/editor-state/src/features/editor-settings/*` - apply compiled editor settings
- `packages/editor/packages/editor-state/src/features/code-blocks/utils/codeParsers/getBlockType.ts` - new block markers
- `packages/editor/packages/editor-state/src/features/project-export/*` - serialization filtering

## Risks & Considerations

- **Separation**: Ensure editor config data never leaks into `compiledConfig`
- **Persistence**: Avoid unintended overwrites of editor settings from local storage
- **User Experience**: Define clear precedence between local settings and editor config blocks

## Related Items

- **Depends on**: `docs/todos/199-config-block-type-attribute-project.md`

## References

- `packages/editor/packages/editor-state/src/features/editor-settings/README.md`

## Notes

- Editor config blocks are session/editor-only and should not be part of runtime-ready exports.
