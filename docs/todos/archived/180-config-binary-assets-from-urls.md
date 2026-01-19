---
title: 'TODO: Load Binary Assets From Config URLs'
priority: Medium
effort: 1-2d
created: 2026-01-16
status: Completed
completed: 2026-01-17
---

# TODO: Load Binary Assets From Config URLs

## Problem Description

Config blocks cannot declare binary assets sourced from public URLs, nor can they target a specific `module.memory` location. Users want to preload external PCM or binary data at known memory addresses. Browser caching is also missing, so repeated loads can be slow and waste bandwidth. The existing manual import flow (menu + callbacks) is the only way to populate `state.binaryAssets`, but the goal is to remove that UI and make config the sole source.

## Proposed Solution

Extend the config schema to accept `binaryAssets` entries with `{ url, memoryId }`, where `memoryId` uses the unified `module.memory` format. Implement editor-side loading and caching (Cache Storage API) to fetch and write bytes into WASM memory. Use the existing `loadBinaryFilesIntoMemory` event to trigger loads, and update `state.binaryAssets` directly via `store.set` after successful loads. Remove the manual import UI and callbacks so config is the only source of binary assets.

## Implementation Plan

### Step 1: Extend config schema and defaults
- Add `binaryAssets` array to `ConfigObject` and default config
- Update config schema validation to accept `{ url, memoryId }` items
- Update tests/snapshots that assert compiled config shape

### Step 2: Editor-side loader and cache
- Use `loadBinaryFilesIntoMemory` to trigger loading of config-defined assets
- If an asset exists in Cache Storage, use it; otherwise fetch from the URL and cache the response
- Resolve `module.memory` to byte addresses and write bytes into memory views
- Handle load failures with logs/errors without mutating state

### Step 3: Record successfully loaded assets
- Update `state.binaryAssets` via `store.set` only after successful loads
- Keep config-driven assets separate from manual imports until loaded

### Step 4: Remove manual binary asset import flow
- Remove menu entries for importing binary assets
- Remove `importBinaryAsset` callback wiring in the editor host
- Update docs/tests that reference manual import

### Step 5: Add cache clearing menu item
- Add a menu item in the main menu to clear the binary asset cache
- Add a callback for cache clearing (implemented in the editor host)
- Implement editor-side cache purge logic and confirm state stays consistent
- Leave `state.binaryAssets` unchanged when clearing cache (memory contents remain loaded)

## Success Criteria

- [ ] Config blocks accept `binaryAssets` with `url` + `memoryId`
- [ ] URLs are cached in the browser and reused on subsequent loads
- [ ] Only successfully loaded assets appear in `state.binaryAssets`
- [ ] Memory contents match downloaded bytes at the target memory address

## Affected Components

- `packages/editor/packages/editor-state/src/features/config-compiler/configSchema.ts` - schema update
- `packages/editor/packages/editor-state/src/pureHelpers/state/createDefaultState.ts` - default config update
- `packages/editor/packages/editor-state/src/types.ts` - config types update
- `packages/editor/packages/editor-state/src/features/binary-assets/effect.ts` - respond to load event
- `src/storage-callbacks.ts` - editor-side cache + load implementation
- `src/editor.ts` - new callback wiring
- `packages/editor/packages/editor-state/src/features/menu/menus/mainMenu.ts` - remove import menu item
- `packages/editor/packages/editor-state/src/features/menu/menus/binaryAssetsMenu.ts` - remove binary assets submenu
- `packages/editor/packages/editor-state/src/features/binary-assets/effect.ts` - remove import handler
- `packages/editor/packages/editor-state/src/features/menu/menus/mainMenu.ts` - add cache clear menu item

## Risks & Considerations

- **Cache size**: Cache Storage can grow large without eviction; consider limits or future OPFS integration
- **Addressing**: `memoryId` resolution depends on compiled module memory maps
- **Race conditions**: Must avoid loading assets before memory is created or after memory is recreated
- **Security**: Public URLs must be CORS-accessible; failures should be surfaced clearly

## Related Items

- **Related**: `docs/todos/094-opfs-large-binary-asset-storage.md` (future large-asset storage)

## Notes

- Caching must be implemented in the editor layer, not editor-state.
- `state.binaryAssets` should only record assets after successful load.
- Use `loadBinaryFilesIntoMemory` as the trigger to load config-defined assets.
- Manual binary asset import UI should be removed so config is the only source.
