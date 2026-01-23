---
title: 'TODO: Move Runtime Definitions into Runtime Packages'
priority: Medium
effort: 1-2d
created: 2026-01-23
status: Open
completed: null
---

# TODO: Move Runtime Definitions into Runtime Packages

## Problem Description

Runtime factories and schemas currently live in the app layer, which makes them feel like glue code and creates duplication risk as new hosts (viewer) emerge. This also makes adding new runtimes feel incomplete unless the developer remembers to update a central registry and schema source.

## Proposed Solution

Move each runtime's factory + defaults + schema into its own runtime package, and export a single runtime definition object from each package. Hosts (root app, viewer) simply import runtime definitions and assemble their registry from the subset they want to support.

## Implementation Plan

### Step 1: Define runtime definition shape and location
- Reuse existing `RuntimeRegistryEntry` and `JSONSchemaLike` types from `@8f4e/editor` if that dependency is acceptable.
- If package-level coupling to `@8f4e/editor` is undesirable, create a minimal host types export in a stable package (prefer `packages/editor` public types or `packages/editor/packages/editor-state` if already exposed) that includes only:
  - `RuntimeRegistryEntry`
  - `JSONSchemaLike`
  - `State` (if factories need `State`)
  - `EventDispatcher` (if factories need events)
- Confirm runtime definition shape: `{ id, defaults, schema, factory }`.

### Step 2: Move factories into runtime packages
- Move these files from `src/` into their owning runtime packages (names can be adjusted, but keep consistent exports):
  - `src/runtime-web-worker-logic-factory.ts` → `packages/runtime-web-worker-logic/src/runtimeDef.ts` (or `factory.ts`)
  - `src/runtime-main-thread-logic-factory.ts` → `packages/runtime-main-thread-logic/src/runtimeDef.ts`
  - `src/runtime-audio-worklet-factory.ts` → `packages/runtime-audio-worklet/src/runtimeDef.ts`
  - `src/runtime-web-worker-midi-factory.ts` → `packages/runtime-web-worker-midi/src/runtimeDef.ts`
- Keep any runtime-specific helpers (e.g. memory ID parsing for audio buffers) in the runtime package alongside the factory.
- Ensure each factory still imports `getCodeBuffer/getMemory` or equivalent from the host layer if that is the current pattern; if those callbacks live in the host app, consider moving them into a shared compiler-callback package or passing them into the factory via parameters.

### Step 3: Move schemas/defaults into runtime packages
- For each runtime, move the defaults and schema from `src/runtime-registry.ts` into the runtime package and export a single runtime definition:
  - `export const webWorkerLogicRuntimeDef: RuntimeRegistryEntry = { id, defaults, schema, factory }`
  - `export const mainThreadLogicRuntimeDef: RuntimeRegistryEntry = { ... }`
  - `export const audioWorkletRuntimeDef: RuntimeRegistryEntry = { ... }`
  - `export const webWorkerMIDIRuntimeDef: RuntimeRegistryEntry = { ... }`
- Keep schema JSON exactly the same to avoid config behavior changes.
- If a runtime package already exports its runtime function (e.g. `createMainThreadLogicRuntime`), keep that as-is and add the new `...RuntimeDef` export.

### Step 4: Update package entrypoints
- Update each runtime package `src/index.ts` to export the new runtime definition:
  - `export { audioWorkletRuntimeDef } from './runtimeDef';`
- Update `package.json` `exports` if needed to ensure the definition is reachable via the package root.
- Ensure any Nx project references or build config includes the new file.

### Step 5: Update host registry composition
- Update `src/runtime-registry.ts` to import the runtime defs from their packages and assemble a registry:
  - `import { webWorkerLogicRuntimeDef } from '@8f4e/runtime-web-worker-logic';`
  - `import { audioWorkletRuntimeDef } from '@8f4e/runtime-audio-worklet';`
- Build registry with `runtimeRegistry[def.id] = def` or an object literal keyed by id.
- Keep `DEFAULT_RUNTIME_ID` in the host (root app) so different hosts can choose their own default.

### Step 6: Add viewer registry
- Add a viewer-specific registry (e.g. `packages/viewer/src/runtime-registry.ts` or `src/viewer-runtime-registry.ts`) that imports only the runtimes the viewer supports.
- Viewer registry should exclude editor-only runtimes or any runtime that requires permissions or UI not present in the viewer.

### Step 7: Cleanup old files
- Delete the old `src/runtime-*-factory.ts` files after move.
- Remove schema/defaults from `src/runtime-registry.ts` (it should only compose defs now).
- Verify no remaining imports reference the old paths.

### Step 8: Update tests and build
- Run `nx run-many -t typecheck` or `npm run typecheck` to ensure TS references are updated.
- Run `nx run-many -t test` or `npm test` if runtime tests exist.
- Run `nx run <app>:build` if bundling or alias exports changed.

## Success Criteria

- [ ] Each runtime package exports a single runtime definition object.
- [ ] App runtime registry is assembled entirely from package exports.
- [ ] Viewer can assemble a smaller registry without duplicating schema/factory code.
- [ ] No web API code is introduced into editor-state.

## Affected Components

- `src/runtime-registry.ts` - Switch to imported definitions only.
- `src/runtime-*-factory.ts` - Remove after move into runtime packages.
- `packages/runtime-*/src` - Add runtime definition files and exports.
- `packages/runtime-*/package.json` - Update exports if necessary.
- `packages/editor/packages/editor-state` - No changes expected (should remain pure).

## Risks & Considerations

- **Type coupling**: runtime packages may depend on editor types; consider a thin host types export if needed.
- **Callback location**: runtime factories currently reference host callbacks like `getCodeBuffer/getMemory` in `src/compiler-callback.ts`. If those remain host-only, pass them into factories or move them to a shared package.
- **Bundle size**: ensure hosts only import the runtime defs they intend to ship.
- **Breaking changes**: runtime package public APIs will change; update import paths in host.
- **Permissions UX**: Audio runtime currently triggers dialog/permission flow; ensure viewer host handles that UX or disables it if not supported.

## Notes

- The runtime core already depends on Web APIs, so the adapter boundary should live at the runtime package level.
- Keep the host registry as a thin assembly layer to support different host subsets (app vs viewer).
- Default runtime ID should be host-specific; keep it in the host layer rather than in runtime packages.
