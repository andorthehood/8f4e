---
title: 'TODO: Document editor-state features with per-feature READMEs'
priority: Low
effort: 0.5-1d
created: 2026-01-14
status: Open
completed: null
---

# TODO: Document editor-state features with per-feature READMEs

## Problem Description

The editor-state feature set under `packages/editor/packages/editor-state/src/features` has no per-feature documentation.
This makes it hard to understand purpose, event wiring, and integration points (callbacks, runtime registry, project schema)
when onboarding or changing behavior.

## Proposed Solution

Add a `README.md` in each top-level feature folder (no nested subfeatures) describing:
- Feature purpose and scope.
- Key state fields and events it listens to or emits.
- Important integrations (callbacks, runtime registry, config compiler, project schema).
- Known limitations or dev-only status where applicable.

Keep `code-blocks` high level, but include a block types overview.

## Implementation Plan

### Step 1: Inventory features and confirm scope
- Confirm top-level features only under `packages/editor/packages/editor-state/src/features`.
- List the feature directories to document:
  `binary-assets`, `code-blocks`, `code-editing`, `config-compiler`, `demo-mode`, `edit-history`,
  `editor-settings`, `logger`, `menu`, `program-compiler`, `project-export`, `project-import`,
  `runtime`, `shader-effects`, `viewport`.
- Verify any existing docs to link (stack config compiler README, project serialization).

### Step 2: Define a lightweight README template
- Sections: Purpose, Key behaviors, Events/callbacks, State touched, Notes/limits, References.
- Keep language concise and user-facing for internal devs.
- Do not document nested subfeatures (e.g., `code-blocks/features/*`), just summarize.

### Step 3: Draft per-feature content (high-level)
- `binary-assets`: describe the WIP status; note `importBinaryAsset` and `loadBinaryFileIntoMemory` callbacks; mention asset collection lives in state and is fed into compiler/runtime memory loading.
- `code-blocks`: describe the code block lifecycle (create, select, drag, delete), how block graphics are derived, and how extras (inputs/outputs/buttons/switches/piano/debuggers/plotters) are computed from code; include a block types list (module/function/constants/config/comment/vertexShader/fragmentShader/unknown) and clarify that subfeatures are summarized only.
- `code-editing`: explain caret movement, insert/delete/newline operations, how gap calculations affect cursor/line mapping, and that syntax highlighting selects 8f4e vs GLSL based on block type.
- `config-compiler`: explain config blocks are combined into a single source, compiled via `@8f4e/stack-config-compiler`, errors are mapped back to block line ranges, and results are merged onto defaults.
- `demo-mode`: note dev-only presentation mode, random selection on init, and timed navigation between blocks; specify it is not intended for production UX.
- `edit-history`: explain debounce, fixed stack size (10), undo/redo semantics using serialized project snapshots, and which events trigger saves.
- `editor-settings`: describe current scope (color scheme list + selection), persistent storage callbacks, and runtime update flow for schemes.
- `logger`: describe how log entries are appended to `state.console.logs`, capped by maxLogs, and tagged with timestamp/category.
- `menu`: explain context menu event flow (open, highlight, action dispatch), state fields touched, and how menus are built without enumerating menu contents.
- `program-compiler`: document callback contract for `compileCode`, compiler options (memory size, env constants, ignored keywords), error mapping to code blocks, and the precompiled/disable-auto-compile paths.
- `project-export`: describe serialize-to-project vs runtime-ready export (includes compiled data + memory snapshot + config), session saving, and WASM export.
- `project-import`: describe initial load path (storage vs default), import-by-file and import-by-slug callbacks, and how initialProjectState is set.
- `runtime`: document runtime registry location at project root, runtime selection from compiled config, and lifecycle (destroy/recreate) tied to compile updates.
- `shader-effects`: describe deriving post-process effect descriptors from shader blocks to overlay visuals in the editor (algorave use), and that errors are surfaced alongside compilation errors.
- `viewport`: document dragging, resizing, snap-to-grid, and centering helpers as the basis for viewport interactions.

### Step 4: Add cross-links and references
- Link config compiler docs: `packages/stack-config-compiler/README.md`.
- Link project schema/serialization references:
  `packages/editor/packages/editor-state/src/features/project-export/serializeToProject.ts` and
  `packages/editor/packages/editor-state/src/features/project-export/serializeToRuntimeReadyProject.ts`.
- Note runtime registry location in project root.

### Step 5: Review and polish
- Ensure tone is consistent across features.
- Check for accurate event names and state fields.
- Keep content high-level and avoid internal implementation details.

## Success Criteria

- [ ] Each top-level feature directory has a concise `README.md`.
- [ ] READMEs include block types list, callbacks/events, and limitations where relevant.
- [ ] Config compiler and project schema references are linked.

## Affected Components

- `packages/editor/packages/editor-state/src/features/*` - new `README.md` files
- `packages/stack-config-compiler/README.md` - referenced by config-compiler docs
- `packages/editor/packages/editor-state/src/features/project-export/serializeToProject.ts` - reference for project schema

## Risks & Considerations

- **Drift**: Documentation can become stale if behavior changes; keep updates in sync.
- **Scope creep**: Avoid deep subfeature documentation for now.
- **WIP areas**: Call out binary assets as WIP to avoid overpromising.

## Related Items

- **Related**: `docs/todos/033-editor-state-effects-testing.md`
- **Related**: `packages/stack-config-compiler/README.md`

## References

- `packages/stack-config-compiler/README.md`
- `packages/editor/packages/editor-state/src/features/project-export/serializeToProject.ts`
- `packages/editor/packages/editor-state/src/features/project-export/serializeToRuntimeReadyProject.ts`

## Notes

- Scope and content clarified in conversation on 2026-01-14:
  top-level only, high-level code-blocks, include block types list,
  demo-mode is dev-only, shader-effects for editor overlay visuals.
