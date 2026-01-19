---
title: 'TODO: Split Binary Asset Fetch and Memory Load'
priority: Medium
effort: 1-2d
created: 2026-01-19
status: Open
completed: null
---

# TODO: Split Binary Asset Fetch and Memory Load

## Problem Description

Binary asset loading currently couples network fetch + cache + response parsing with writing bytes into WASM memory and updating editor-state metadata. This makes testing harder, forces immediate memory writes even if the editor wants to stage assets, and prevents progress UI because editor-state cannot track fetch/load independently.

## Proposed Solution

Split the current single callback into two steps:
- A fetch callback that accepts a list of URLs, stores fetched assets in the editor (outside editor-state), and returns metadata for editor-state.
- A memory load callback that accepts a URL plus the resolved memory target and writes the pre-fetched ArrayBuffer into WASM memory.

Editor-state stores only metadata, with `isLoading` and `loadedIntoMemory` flags for progress and status UI.
The URL is the asset identifier; the same URL may be loaded into multiple memory targets.

## Implementation Plan

### Step 1: Add new types and callbacks
- Add `BinaryAssetMeta` with `url` (as the id), `fileName`, `mimeType`, `sizeBytes`, `isLoading`, `loadedIntoMemory`.
- Add callbacks: `fetchBinaryAssets(urls: string[])` and `loadBinaryAssetIntoMemory(url: string, target: ResolvedBinaryAsset)`.
- Deprecate or remove `loadBinaryFileIntoMemory` in editor-state types.

### Step 2: Update editor-state binary asset effect
- Call `fetchBinaryAssets` once with all config URLs (dedupe URLs before calling).
- Store returned metadata in `state.binaryAssets` (initialize `isLoading=false`, `loadedIntoMemory=false`).
- For each resolved asset, flip `isLoading=true`, call `loadBinaryAssetIntoMemory(url, target)`, then set `loadedIntoMemory=true`, `isLoading=false`.
- If load fails, log and set `isLoading=false` (optional future: `loadError` field).

### Step 3: Update editor implementation
- Maintain an in-memory map of fetched assets keyed by `url`, storing ArrayBuffers.
- Implement `fetchBinaryAssets` to fill map and return metadata only.
- Implement `loadBinaryAssetIntoMemory(url, target)` to write bytes from the map into memory and update metadata in state.

## Success Criteria

- [ ] Binary asset fetch and memory load are separate callbacks.
- [ ] Editor-state stores only metadata plus `isLoading` and `loadedIntoMemory`.
- [ ] Editor can preload assets without writing to WASM memory.

## Affected Components

- `packages/editor/src/binaryAssets/*` - split fetch vs memory write helpers
- `packages/editor/src/index.ts` - new callback wiring and editor-side asset store
- `packages/editor/packages/editor-state/src/types.ts` - new callback types and metadata shape
- `packages/editor/packages/editor-state/src/features/binary-assets/effect.ts` - updated control flow

## Risks & Considerations

- **Breaking change**: callback signature changes for integrators.
- **Memory usage**: holding ArrayBuffers in editor memory until loaded.
- **Asset id**: URL is the id; same URL can be written to multiple memory targets.
- **Error handling**: consider `loadError` field for UI feedback.

## Related Items

- **Related**: TODO 180 (Load Binary Assets From Config URLs)

## Notes

- Effect logic should remain source of truth for which assets load into memory.
