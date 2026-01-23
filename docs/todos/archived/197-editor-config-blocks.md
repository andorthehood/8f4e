---
title: 'TODO: Editor Config Blocks (Replace editorSettings)'
priority: Medium
effort: 1-2 days
created: 2026-01-22
status: Completed
completed: 2026-01-22
---

# Editor Config Blocks (Replace editorSettings)

## Goal
Introduce a new config type named `editor` in `@8f4e/editor-state` that replaces `editorSettings`. This should use the same stack‑config block language as project config, compile into state, and remain visible in the UI as regular code blocks. Unlike project config, editor config must be stored locally and excluded from project import/export. The storage format must preserve raw block code (including comments).

## Background: What is a config type?
Config blocks are special code blocks detected by markers in the block’s `code` array. A config block is defined by a `config <type>` line and a closing `configEnd` line, for example `config project` or `config editor`. The `<type>` token is called the config type. It is extracted from the code and used to decide how to compile the block and where the resulting configuration is stored.

You can see the current flow in these files:
`packages/editor/packages/editor-state/src/features/code-blocks/utils/codeParsers/getBlockType.ts` recognizes config blocks, `packages/editor/packages/editor-state/src/features/config-compiler/utils/extractConfigBody.ts` extracts the config type, and the project/editor config effects compile config blocks into state (`packages/editor/packages/editor-state/src/features/project-config/effect.ts` and `packages/editor/packages/editor-state/src/features/editor-config/effect.ts`). The config blocks are combined in `packages/editor/packages/editor-state/src/features/config-compiler/utils/combineConfigBlocks.ts` via `combineConfigBlocksByType`, and compilation helpers live in `packages/editor/packages/editor-state/src/features/config-compiler/utils/compileConfigBlocksByType.ts`. The project schema lives in `packages/editor/packages/editor-state/src/features/project-config/schema.ts` (editor schema in `features/editor-config/schema.ts`), and the output types are defined in `packages/editor/packages/editor-state/src/features/project-config/types.ts` and `packages/editor/packages/editor-state/src/features/editor-config/types.ts`.

This task adds a second config type named `editor`, which must be compiled separately from `project` config.

## Decisions Already Made
Backward compatibility is not required, so `editorSettings` and related usage/tests should be removed entirely. State should include `compiledEditorConfig`, while the current `compiledConfig` should be renamed to `compiledProjectConfig`. The schema file `configSchema.ts` should be renamed to `projectConfigSchema.ts`. Config errors should be split into `codeErrors.projectConfigErrors` and `codeErrors.editorConfigErrors`. Editor config blocks must remain in `graphicHelper.codeBlocks` for the UI, but they must not be included in project import/export. For local persistence, editor config blocks are stored as raw block code in the format `Array<{ code: string[]; disabled?: boolean }>` so comments are preserved.

## Scope of Editor Config (Initial)
The initial editor config surface includes `font` and `colorScheme` only.

## Required Callback Changes
Rename callbacks in `Callbacks` from `loadEditorSettings`/`saveEditorSettings` to `loadEditorConfigBlocks`/`saveEditorConfigBlocks`. These callbacks store raw config blocks, not the compiled config, and must remain optional because editor‑state cannot depend on browser APIs.

## High-Level Steps
First, rename the project config types and files so they are clearly scoped: `configSchema.ts` becomes `projectConfigSchema.ts`, `compiledConfig` becomes `compiledProjectConfig`, and `ConfigObject` becomes `ProjectConfig` (or an equivalent name) with all exports/usages updated.

Next, introduce editor config as its own type and defaults. Add an `EditorConfig` type (with `font` and `colorScheme`), add `compiledEditorConfig` to state in `createDefaultState`, and introduce an `editorConfigSchema.ts` used by stack‑config validation.

Then update the config compiler to recognize and compile both `project` and `editor` config types. They should compile separately into `compiledProjectConfig` and `compiledEditorConfig`, with errors recorded in `projectConfigErrors` and `editorConfigErrors`. Error mapping and combined source logic must be type‑specific.

After that, remove the editor settings feature and its menu. Delete `features/editor-settings` and its tests, remove any menu entries for editor settings, and replace references to `editorSettings` with `compiledEditorConfig`.

For persistence, wire the new callbacks. On initialization, load editor config blocks via `loadEditorConfigBlocks` and append them when `graphicHelper` populates project code blocks. When editor config blocks change, save the raw code via `saveEditorConfigBlocks`. Editor config blocks must be excluded from project import/export.

Finally, update UI/readers to use `compiledEditorConfig` (including sprite generation and any color/font reads), and update tests/snapshots that reference editor settings or the old project config names.

## Notes
Editor config blocks must remain visible and editable in the UI, but they are not part of project data. If both editor and project config blocks are present, compilation and error mapping must be type‑specific. Use Nx commands for tests/build per repo guidelines.
