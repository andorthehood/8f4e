---
title: 'TODO: Remove runtime-ready project export'
priority: Medium
effort: 0.5d
created: 2026-02-19
status: Open
completed: null
---

# TODO: Remove runtime-ready project export

## Problem Description

The runtime-ready export produced `project-runtime-ready.json` — a JSON file containing compiled WASM modules and a compiled project config, intended for embedding in a standalone page. Now that regular project export uses the `.8f4e` format as the source of truth, the runtime-ready export is no longer needed. Removing it simplifies the codebase and eliminates a separate export path that produces a different file format.

## Plan

### Remove

- `onExportRuntimeReadyProject` handler and `events.on('exportRuntimeReadyProject', ...)` from `effect.ts`
- `serializeToRuntimeReadyProject.ts` and its snapshot file
- `compileConfigForExport.ts` (only called from the runtime-ready path)
- "Export Runtime-Ready Project" menu item from `mainMenu.ts`
- "Export Runtime-Ready Project" entry from the screenshot test mock
- The `exportRuntimeReadyProject` describe block from `effect.test.ts` (3 tests + 1 event wiring test)
- `tests/runtimeReadyProject.test.ts` entirely

### Simplify

- `serializeToProject.ts` — remove the `includeCompiled` / `encodeToBase64` options and the test that exercises them; the function always returns without compiled modules
- Regenerate the `serializeToProject.ts` snapshot if it changes

## Critical Files

| File | Change |
|------|--------|
| `packages/editor/packages/editor-state/src/features/menu/menus/mainMenu.ts` | Remove menu item |
| `packages/editor/packages/editor-state/src/features/project-export/effect.ts` | Remove handler + import |
| `packages/editor/packages/editor-state/src/features/project-export/serializeToRuntimeReadyProject.ts` | **Delete** |
| `packages/editor/packages/editor-state/src/features/project-export/__snapshots__/serializeToRuntimeReadyProject.ts.snap` | **Delete** |
| `packages/editor/packages/editor-state/src/features/project-config/compileConfigForExport.ts` | **Delete** |
| `packages/editor/packages/editor-state/src/features/project-export/serializeToProject.ts` | Remove `includeCompiled` option |
| `packages/editor/packages/editor-state/src/features/project-export/__snapshots__/serializeToProject.ts.snap` | Regenerate if needed |
| `packages/editor/packages/web-ui/screenshot-tests/utils/generateContextMenuMock.ts` | Remove mock entry |
| `packages/editor/packages/editor-state/src/features/project-export/__tests__/effect.test.ts` | Remove runtime-ready tests |
| `packages/editor/packages/editor-state/tests/runtimeReadyProject.test.ts` | **Delete** |

## Verification

1. `npm run test` — all tests pass, no references to `exportRuntimeReadyProject` remain
2. `npm run typecheck` — no type errors
3. Dev server: the main menu no longer shows "Export Runtime-Ready Project"
4. Dev server: "Export Project" still downloads a valid `.8f4e` file
