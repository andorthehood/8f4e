---
title: 'TODO: Add configurable export filename in project config'
priority: Medium
effort: 2-4h
created: 2026-02-18
status: Open
completed: null
---

# TODO: Add configurable export filename in project config

## Problem Description

Export filenames are currently hardcoded in the editor-state export effect:
- `project.json`
- `project-runtime-ready.json`
- `project.wasm`

This prevents project authors from defining a project-specific export naming convention in the project config.

## Requested Behavior

- Add a new project config field: `exportFileName` (string, optional).
- Use this field as the base export filename when present.
- Export naming rules:
  - Standard JSON export: `{exportFileName}.json`
  - Runtime-ready export: `{exportFileName}-runtime-ready.json`
  - WASM export: `{exportFileName}.wasm`
- Keep fallback behavior unchanged when the field is missing:
  - `project.json`
  - `project-runtime-ready.json`
  - `project.wasm`

## Scope

- `@8f4e/editor-state` project config schema, types, and export effect.
- Unit tests for export behavior and schema acceptance.
- No UI/editor menu changes required.
- No callback signature changes required (`exportProject(data, fileName)`, `exportBinaryCode(fileName)` remain the same).

## Implementation Plan

### Step 1: Extend project config contract

- Add `exportFileName?: string` to:
  - `packages/editor/packages/editor-state/src/features/project-config/types.ts`
- Extend schema:
  - `packages/editor/packages/editor-state/src/features/project-config/schema.ts`
  - Add `exportFileName: { type: 'string' }` under `properties`.
- Keep it optional (no required key changes).

### Step 2: Add export filename derivation helper

- In `project-export/effect.ts`, add a helper that:
  - Reads latest `store.getState().compiledProjectConfig.exportFileName`.
  - Uses fallback base name `project` if absent/empty.
  - Normalizes accidental suffixes (e.g. strips trailing `.json` / `.wasm`) so generated names stay consistent.

### Step 3: Apply naming rules to all exports

- Standard export:
  - Replace hardcoded `project.json` with `${base}.json`.
- Runtime-ready export:
  - Replace hardcoded `project-runtime-ready.json` with `${base}-runtime-ready.json`.
- WASM export:
  - Replace hardcoded `project.wasm` with `${base}.wasm`.

### Step 4: Test coverage

- Update/add tests in:
  - `packages/editor/packages/editor-state/src/features/project-export/__tests__/effect.test.ts`
- Cases:
  - Uses fallback filenames when `exportFileName` is undefined.
  - Uses custom `exportFileName` for all three export events.
  - Handles suffix input (`demo.json`, `demo.wasm`) without double extensions.
- Add schema-focused test (or extend existing config compilation tests) to confirm `exportFileName` is accepted and typed as string.

### Step 5: Verify with Nx

- Run at minimum:
  - `npx nx run editor-state:test`
  - `npx nx run editor-state:typecheck`
- If project naming differs in Nx, run equivalent target via `npx nx run-many --target=test --all` limited as needed.

## Success Criteria

- [ ] `exportFileName` compiles in project config without schema errors.
- [ ] Standard export filename becomes `{base}.json` when configured.
- [ ] Runtime-ready export filename becomes `{base}-runtime-ready.json` when configured.
- [ ] WASM export filename becomes `{base}.wasm` when configured.
- [ ] Existing behavior remains unchanged when `exportFileName` is not set.

## Affected Components

- `packages/editor/packages/editor-state/src/features/project-config/types.ts`
- `packages/editor/packages/editor-state/src/features/project-config/schema.ts`
- `packages/editor/packages/editor-state/src/features/project-export/effect.ts`
- `packages/editor/packages/editor-state/src/features/project-export/__tests__/effect.test.ts`

