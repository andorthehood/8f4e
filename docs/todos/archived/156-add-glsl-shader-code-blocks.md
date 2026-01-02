---
title: 'TODO: Add GLSL Shader Code Blocks for Post-Process Effects'
priority: Medium
effort: 2-4d
created: 2026-01-02
status: Completed
completed: 2026-01-02
---

# TODO: Add GLSL Shader Code Blocks for Post-Process Effects

## Problem Description

Post-process shaders are currently defined via `postProcessEffects` on the project data model. This makes shader edits disconnected from the editor's code block workflows, prevents shader code from living alongside other project code, and keeps shader edits out of the standard code block tooling (creation, editing, highlighting, error reporting).

## Proposed Solution

Introduce two new code block types for shader sources:
- `vertexShader <id>` ... `vertexShaderEnd`
- `fragmentShader <id>` ... `fragmentShaderEnd`

Shader blocks become the sole source of `postProcessEffects`. The editor derives `postProcessEffects` by pairing vertex and fragment blocks with the same `<id>`. On duplicate IDs, the last block in creation order wins. Paired effects default to `enabled: true`.

## Implementation Plan

### Step 1: Extend block-type detection and types
- Update `packages/compiler/src/syntax/getBlockType.ts` to recognize `vertexShader` and `fragmentShader` marker pairs.
- Extend `CodeBlockType` unions in compiler syntax and editor-state types.
- Add in-source tests for new block types and mixed-marker cases.

### Step 2: Add editor creation + menu entries
- Update `packages/editor/packages/editor-state/src/effects/menu/menus.ts` to add “New Vertex Shader” and “New Fragment Shader”.
- Update `packages/editor/packages/editor-state/src/effects/codeBlocks/codeBlockCreator.ts` to seed new shader blocks with markers and unique IDs.
- Add ID parsing helpers for shader blocks (similar to `getModuleId` / `getFunctionId`).

### Step 3: Update rendering and highlighting
- Add shader markers to `instructionsToHighlight` in `packages/editor/packages/editor-state/src/effects/codeBlocks/graphicHelper.ts`.
- Decide whether to add GLSL keyword highlighting (optional but improves readability).
- Update context menu labels so shader blocks are not labeled as module/function.

### Step 4: Derive post-process effects from shader blocks
- Add helpers to collect shader blocks and extract bodies between markers.
- Build `postProcessEffects` by pairing blocks with the same ID using last-wins resolution.
- Default `enabled: true` for paired effects.
- Surface errors for missing pairs via `codeErrors`.
- Recompute shader effects when shader block code changes and dispatch `loadPostProcessEffects`.

### Step 5: Update project import/export and examples
- Remove or ignore `postProcessEffects` as a persisted project field.
- Rebuild shader effects from code blocks on project load and code edits.
- Update example projects (e.g., CRT effect) to use shader code blocks instead of `postProcessEffects`.
- Add tests for pairing, last-wins behavior, and serialization round-trips.

## Success Criteria

- [ ] Shader blocks are recognized by `getBlockType` and editor-state.
- [ ] Users can create vertex/fragment shader blocks from the UI.
- [ ] `postProcessEffects` is derived solely from shader blocks with last-wins resolution.
- [ ] Example projects render correctly with shader blocks and without `postProcessEffects` fields.
- [ ] Tests cover pairing, missing pairs, and block extraction.

## Affected Components

- `packages/compiler/src/syntax/getBlockType.ts` - Block type detection for shaders
- `packages/compiler/src/syntax/index.ts` - Export updated types
- `packages/editor/packages/editor-state/src/types.ts` - Extend `CodeBlockType`
- `packages/editor/packages/editor-state/src/effects/codeBlocks/codeBlockCreator.ts` - Shader block creation and ID handling
- `packages/editor/packages/editor-state/src/effects/menu/menus.ts` - New shader block menu items
- `packages/editor/packages/editor-state/src/effects/codeBlocks/graphicHelper.ts` - Highlight shader markers/keywords
- `packages/editor/packages/editor-state/src/effects/projectImport.ts` - Recompute shader effects on load
- `packages/editor/packages/editor-state/src/pureHelpers/projectSerializing/serializeToProject.ts` - Remove `postProcessEffects` persistence
- `src/examples/projects/crtEffect.ts` - Example shader block usage

## Risks & Considerations

- **Pairing errors**: Missing vertex/fragment pairs could lead to silent failures; ensure errors are surfaced in editor UI.
- **Breaking change**: Removing `postProcessEffects` from project schema may break older saved projects unless migration is handled.
- **Duplicate IDs**: Last-wins behavior could surprise users; ensure predictable ordering and messaging.
- **Shader compilation**: Invalid GLSL should surface clear errors when compiling effects.

## Related Items

- **Related**: `docs/todos/archived/054-make-post-process-shaders-project-scoped.md`

## References

- `src/examples/projects/crtEffect.ts`
- `packages/editor/packages/glugglug/README.md`

## Notes

- Pairing rule: matching `<id>` in `vertexShader` and `fragmentShader` markers.
- Resolution rule: when duplicates exist, use the last block by creation order.
- Post-process effects are derived from code blocks only; project fields should not store shader strings.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context) 
