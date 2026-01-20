# Unify runtimeSettings shape to a singular runtime object

## Goal
- Replace the config schema shape so `runtimeSettings` is a single runtime config object (discriminated by `runtime`), not an array.
- Remove `selectedRuntime` entirely from config schema, types, defaults, runtime logic, examples, tests, and docs.
- No backward compatibility: all usage sites must be updated to the new shape.

## Requirements
- `runtimeSettings` stays a discriminated union based on the `runtime` field (same as today), just not wrapped in an array.
- Config DSL uses `scope "runtimeSettings"` (no `[0]`), and removes any `selectedRuntime` blocks.
- Update all usage sites across root `src/`, `packages/editor`, examples, tests, snapshots, and docs.

## High-level Plan
1. Inventory all `runtimeSettings`/`selectedRuntime` references across root `src/`, `packages/editor`, examples, tests, and docs.
2. Update config schema + types/defaults to singular `runtimeSettings` object and remove `selectedRuntime` everywhere.
3. Refactor runtime selection logic and factories, plus config compiler/merge paths to use the singular runtime settings.
4. Update examples, tests/snapshots, and docs/README content to match the new shape and DSL.

## Detailed TODO
### Config schema and types
- Update `packages/editor/packages/editor-state/src/features/config-compiler/configSchema.ts`:
  - Remove `selectedRuntime` property from schema.
  - Change `runtimeSettings` from array schema to the union schema directly.
- Update `packages/editor/packages/editor-state/src/features/config-compiler/types.ts`:
  - `ConfigObject` should have `runtimeSettings: Runtimes` (not `Runtimes[]`).
  - Remove `selectedRuntime`.
- Update default config:
  - `packages/editor/packages/editor-state/src/pureHelpers/state/createDefaultState.ts`:
    - `runtimeSettings` should be a single object (defaults) not an array.
    - Remove `selectedRuntime`.
- Update editor init defaults:
  - `packages/editor/packages/editor-state/src/index.ts`:
    - Set `compiledConfig.runtimeSettings` to the registry defaults directly (not in an array).
    - Remove `selectedRuntime` usage.

### Runtime usage sites
- Replace all runtime accesses of the form:
  - `state.compiledConfig.runtimeSettings[state.compiledConfig.selectedRuntime]`
  - With: `state.compiledConfig.runtimeSettings`
- Update runtime effect:
  - `packages/editor/packages/editor-state/src/features/runtime/effect.ts` should compare and initialize based on the singular runtime settings.
- Update runtime factories in root `src/`:
  - `src/runtime-web-worker-logic-factory.ts`
  - `src/runtime-main-thread-logic-factory.ts`
  - `src/runtime-audio-worklet-factory.ts`
  - `src/runtime-web-worker-midi-factory.ts`
- Update auto-env constants:
  - `packages/editor/packages/editor-state/src/features/code-blocks/features/auto-env-constants/effect.ts` to read sample rate from singular `runtimeSettings`.
- Update UI overlay:
  - `packages/editor/packages/web-ui/src/drawers/infoOverlay.ts` to use singular `runtimeSettings`.

### Config compiler merge behavior
- `packages/editor/packages/editor-state/src/features/config-compiler/deepMergeConfig.ts`:
  - The merge logic for arrays-of-objects should no longer be needed for `runtimeSettings`. Ensure merging works for object-shaped runtime settings.
  - Adjust tests in this file that assert `runtimeSettings` array merging.

### Tests and snapshots
- Update tests referencing `selectedRuntime` or array-shaped `runtimeSettings`:
  - `packages/editor/packages/editor-state/src/features/runtime/__tests__/effect.test.ts`
  - `packages/editor/packages/editor-state/src/features/program-compiler/disableCompilation.test.ts`
  - `packages/editor/packages/editor-state/src/features/code-blocks/features/auto-env-constants/effect.test.ts`
  - `packages/editor/packages/editor-state/src/features/project-import/__tests__/effect.test.ts`
- Update snapshots:
  - `packages/editor/packages/editor-state/src/features/project-export/__snapshots__/serializeToRuntimeReadyProject.ts.snap`

### Examples and docs
- Update example projects under `src/examples/projects` and archived examples:
  - Replace `scope "runtimeSettings[0]"` with `scope "runtimeSettings"`.
  - Remove any `selectedRuntime` config entries.
  - Update any JSON-like `compiledConfig` examples to the singular shape.
- Update docs:
  - `docs/usage.md` (and any other docs referencing runtime settings array or selectedRuntime).

## Notes
- No backward compatibility: do not accept the old array + `selectedRuntime` shape in schema or code.
- Keep `runtimeSettings` union schema discriminated by `runtime` (as in current `generateRuntimeSettingsSchema`).
- Follow repo guidelines: avoid inline implementation comments; JSDoc is okay if needed.
- Use Nx commands for tests/builds if you run them.
