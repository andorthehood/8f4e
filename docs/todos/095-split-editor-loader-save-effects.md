---
title: 'TODO: Split Loader and Save Effects Into Dedicated Modules'
priority: Medium
effort: 1-2 days
created: 2025-11-17
status: Open
completed: null
---

# TODO: Split Loader and Save Effects Into Dedicated Modules

## Problem Description

`packages/editor/packages/editor-state/src/effects/loader.ts` and `save.ts` have both become "god" effects that mix unrelated behaviors:

- Loader currently bootstraps editor settings, color schemes, project metadata, runtime buffers, and event bindings for importing projects. It directly mutates compiler/runtime state and dispatches multiple events before promises resolve, which makes it hard to test individual responsibilities.
- Save handles exporting JSON, exporting runtime-ready builds, persisting editor settings, updating storage quotas, and re-saving the session on any code edit. The mix of file export and persistent session state logic makes the callbacks difficult to stub and reason about.
- Because everything lives in two large files, we cannot selectively import logic (e.g., reusing project export without storage callbacks) and any regression requires exercising the entire loader/save pipeline.

This coupling has already caused regressions around session persistence, color scheme sync, and runtime-ready exports. Splitting the effects unlocks targeted tests and allows different hosting contexts (browser UI vs. automation) to wire only the behaviors they need. Instead of keeping a mega `loader.ts`, import smaller, focused modules directly inside `packages/editor/packages/editor-state/src/index.ts`.

## Proposed Solution

Break loader/save into three dedicated effects and register them directly in `index.ts`:

- `projectImport.ts` – owns session persistence and runtime-ready project hydration (callbacks like `loadSession`, `loadProject`, `loadProjectBySlug`, and import flows), emitting events once compiler state is in sync.
- `projectExport.ts` – contains `onExportProject` and `onExportRuntimeReadyProject`, owns JSON serialization, runtime-ready exports, filename generation, storage quota refresh, and error handling.
- `editorSettings.ts` – encapsulates loading and saving color schemes + editor settings; it dispatches `setFont`/`setColorScheme` events when values change and handles persistence callbacks.
- Remove `loader.ts` entirely and delete `save.ts`; move any remaining orchestration logic into the new modules or `index.ts` so each effect self-registers only the handlers it needs.
- Add Vitest coverage for each new effect file to ensure callbacks are invoked with the right payloads and events/subscriptions remain intact.

## Implementation Plan

### Step 1: Design Module Boundaries
- Document the exact responsibilities currently handled in `loader.ts` and `save.ts`.
- Define exported functions for `projectImport`, `projectExport`, and `editorSettings` (e.g., `register(events, store)` plus helpers for initial loads).
- Decide how promises (color schemes, session hydration) resolve before `projectLoaded` fires to avoid regressions.

### Step 2: Implement New Effects
- Create `projectImport.ts`, `projectExport.ts`, and `editorSettings.ts` under `packages/editor/packages/editor-state/src/effects/`.
- Move relevant logic from `save.ts`/`loader.ts` into the new files, ensuring shared helpers (serialization, base64 encoding) remain deduplicated.
- Update `packages/editor/packages/editor-state/src/index.ts` to import the new modules directly and drop the `loader`/`save` imports completely.

### Step 3: Add Tests and Documentation
- Write focused Vitest suites for each effect covering success/error paths and event/subscription wiring.
- Update docs (this TODO index, any architecture notes) to describe the new modules.
- Remove obsolete TODO comments inside `loader.ts`/`save.ts` once responsibilities are isolated.

## Success Criteria

- [ ] `loader.ts` and `save.ts` are fully removed; project import/export/editor settings logic live in their own modules registered via `index.ts`.
- [ ] Dedicated unit tests exist for `projectImport.ts`, `projectExport.ts`, and `editorSettings.ts` covering event wiring and callback usage.
- [ ] No regressions in persistent storage (session + editor settings) or project export flows when running `npm run dev` and smoke-testing export/import.

## Affected Components

- `packages/editor/packages/editor-state/src/effects/loader.ts` – removed entirely.
- `packages/editor/packages/editor-state/src/effects/save.ts` – removed entirely (logic split between `projectImport.ts` + `projectExport.ts`).
- `packages/editor/packages/editor-state/src/effects/editorSettings.ts` – new module encapsulating load/save of editor settings and color schemes.
- `packages/editor/packages/editor-state/src/index.ts` (or equivalent effect registration) – updated imports and registration order.
- Associated Vitest suites under `packages/editor/packages/editor-state/src/effects/__tests__`.

## Risks & Considerations

- **Event Ordering:** Settings/session promises currently resolve before `projectLoaded`; new modules must preserve that to avoid flashing default themes or losing last session state.
- **Callback Optionality:** Host apps may omit certain callbacks (e.g., `loadSession`); new modules must continue to guard against undefined callbacks just like loader/save do today.
- **Regression Testing:** Splitting files can hide subtle behaviors (e.g., code buffer reset). Tests need to assert these flows to prevent regressions.

## Related Items

- **Related:** `docs/todos/033-editor-state-effects-testing.md` – New modules should come with isolated tests to make this broader testing goal easier.
- **Related:** `docs/todos/062-editor-command-queue-refactor.md` – Cleaner effects boundaries reduce pressure on the command queue refactor.

## References

- Current implementations:
  - `packages/editor/packages/editor-state/src/effects/loader.ts`
  - `packages/editor/packages/editor-state/src/effects/save.ts`

## Notes

- Consider exporting helper functions (e.g., `loadProjectFromData`) so tests and other effects can reuse them without reinitializing the entire loader.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date.
2. Move it to the `docs/todos/archived/` folder to keep the main todo directory clean and organized.
3. Update `docs/todos/_index.md` to move the entry from "Active TODOs" to "Completed TODOs" with the completion date.
