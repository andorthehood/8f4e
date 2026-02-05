---
title: 'TODO: Move Runtime Definitions into Runtime Packages'
priority: Medium
effort: 1-2d
created: 2026-01-23
status: Completed
completed: 2026-01-23
---

# TODO: Move Runtime Definitions into Runtime Packages

## Problem Description

Runtime factories and schemas currently live in the app layer, which makes them feel like glue code and creates duplication risk as new hosts (viewer) emerge. This also makes adding new runtimes feel incomplete unless the developer remembers to update a central registry and schema source.

## Proposed Solution

Move each runtime's factory + defaults + schema into its own runtime package, and export a single runtime definition object from each package. Hosts (root app, viewer) simply import runtime definitions and assemble their registry from the subset they want to support.
This is not a simple folder move inside the app; the ownership of factories/schemas must be transferred to the runtime packages themselves.
Use separate host vs worker entrypoints within each runtime package (single package, multiple exports) to keep worker code isolated while still avoiding extra glue packages.

## Anti-Patterns (Do NOT do this)

- Do NOT create `src/runtime-defs/` or any new host-layer folder to hold factories.
- Do NOT split metadata and factories; each runtime package must export a complete `RuntimeRegistryEntry`.
- Do NOT leave any factory code in `src/` once the move is complete.

## Implementation Plan

### Step 1: Define runtime definition shape and location [REQUIRED]
- Runtime packages must not import anything from `@8f4e/editor`.
- Define or move the minimal runtime-def types into a non-editor location that runtime packages can import without creating a cycle (e.g., a shared types module already in the runtime packages, or local types copied per package if necessary).
- Confirm runtime definition shape: `{ id, defaults, schema, factory }`.

### Step 2: Move factories into runtime packages [REQUIRED]
- Move these files from `src/` into their owning runtime packages (names can be adjusted, but keep consistent exports). Do not just relocate them into a new `src/runtime-defs/` folder inside the app:
  - `src/runtime-web-worker-logic-factory.ts` → `packages/runtime-web-worker-logic/src/runtimeDef.ts` (or `factory.ts`)
  - `src/runtime-main-thread-logic-factory.ts` → `packages/runtime-main-thread-logic/src/runtimeDef.ts`
  - `src/runtime-audio-worklet-factory.ts` → `packages/runtime-audio-worklet/src/runtimeDef.ts`
  - `src/runtime-web-worker-midi-factory.ts` → `packages/runtime-web-worker-midi/src/runtimeDef.ts`
- Keep any runtime-specific helpers (e.g. memory ID parsing for audio buffers) in the runtime package alongside the factory.
- Resolve `getCodeBuffer/getMemory` ownership explicitly:
  - Required: inject callbacks into the factory via parameters from the host registry (no direct import from app `src/`).
  - Do not import `src/compiler-callback.ts` from inside runtime packages (creates runtime → app dependency).

### Step 2a: Split host vs worker entrypoints [REQUIRED]
- Keep worker/runtime code in a worker-specific entrypoint (e.g. `src/worker.ts` or `src/worker/index.ts`).
- Keep host glue (runtimeDef + factory) in the host entrypoint (e.g. `src/index.ts` or `src/host/runtimeDef.ts`).
- Configure package exports to expose both:
  - `.` → `dist/index.js` (host entry)
  - `./worker` → `dist/worker.js` (worker entry)
- Ensure build outputs both entrypoints (multi-entry build or separate build config).
- Use the worker entrypoint in host code via `?worker`/`new URL()` patterns, not by importing internal paths.
- Exception: Main-thread runtime is not worker-based; it only needs the host entrypoint and does not require a `./worker` export.
- Keep factory and worker together in the same runtime package by having the host entrypoint import the worker entrypoint URL and pass it into the factory (no extra host-side glue layer).

### Step 3: Move schemas/defaults into runtime packages [REQUIRED]
- For each runtime, move the defaults and schema from `src/runtime-registry.ts` into the runtime package and export a single runtime definition:
  - `export const webWorkerLogicRuntimeDef: RuntimeRegistryEntry = { id, defaults, schema, factory }`
  - `export const mainThreadLogicRuntimeDef: RuntimeRegistryEntry = { ... }`
  - `export const audioWorkletRuntimeDef: RuntimeRegistryEntry = { ... }`
  - `export const webWorkerMIDIRuntimeDef: RuntimeRegistryEntry = { ... }`
- Keep schema JSON exactly the same to avoid config behavior changes.
- If a runtime package already exports its runtime function (e.g. `createMainThreadLogicRuntime`), keep that as-is and add the new `...RuntimeDef` export.

### Step 4: Update package entrypoints [REQUIRED]
- Update each runtime package `src/index.ts` to export the new runtime definition:
  - `export { audioWorkletRuntimeDef } from './runtimeDef';`
- Update `package.json` `exports` if needed to ensure the definition is reachable via the package root.
- Ensure any Nx project references or build config includes the new file.

### Step 5: Update host registry composition [REQUIRED]
- Update `src/runtime-registry.ts` to import the runtime defs from their packages and assemble a registry:
  - `import { webWorkerLogicRuntimeDef } from '@8f4e/runtime-web-worker-logic';`
  - `import { audioWorkletRuntimeDef } from '@8f4e/runtime-audio-worklet';`
- Build registry with `runtimeRegistry[def.id] = def` or an object literal keyed by id.
- Keep `DEFAULT_RUNTIME_ID` in the host (root app) so different hosts can choose their own default.

### Step 6: Add viewer registry [REQUIRED]
- Add a viewer-specific registry (e.g. `packages/viewer/src/runtime-registry.ts` or `src/viewer-runtime-registry.ts`) that imports only the runtimes the viewer supports.
- Viewer registry should exclude editor-only runtimes or any runtime that requires permissions or UI not present in the viewer.

### Step 7: Cleanup old files [REQUIRED]
- Delete the old `src/runtime-*-factory.ts` files after move.
- Remove schema/defaults from `src/runtime-registry.ts` (it should only compose defs now).
- Verify no remaining imports reference the old paths.

### Step 8: Update tests and build [REQUIRED]
- Run `nx run-many -t typecheck` or `npm run typecheck` to ensure TS references are updated.
- Run `nx run-many -t test` or `npm test` if runtime tests exist.
- Run `nx run <app>:build` if bundling or alias exports changed.

## Validation Checkpoints

- After Step 2:
  - `git status` shows deleted `src/runtime-*-factory.ts` files.
  - `ls packages/runtime-*/src/runtimeDef.ts` shows all four files.
  - `rg -n "runtime-defs" src` returns no new host folder.
- After Step 5:
  - `src/runtime-registry.ts` imports only runtime defs from packages.
- After Step 7:
  - `rg -n "runtime-.*-factory" src` returns nothing.

## Success Criteria

- [ ] Each runtime package exports a complete runtime definition object.
- [ ] Host registry only imports and assembles runtime defs (no schema/factory defined in host).
- [ ] No runtime factory code remains under `src/`.
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
- **Worker packaging**: runtime packages need explicit worker entrypoints and build outputs; ensure `exports` map includes `./worker`.
- **Bundle size**: ensure hosts only import the runtime defs they intend to ship.
- **Breaking changes**: runtime package public APIs will change; update import paths in host.
- **Permissions UX**: Audio runtime currently triggers dialog/permission flow; ensure viewer host handles that UX or disables it if not supported.

## Notes

- The runtime core already depends on Web APIs, so the adapter boundary should live at the runtime package level.
- Keep the host registry as a thin assembly layer to support different host subsets (app vs viewer).
- Default runtime ID should be host-specific; keep it in the host layer rather than in runtime packages.
