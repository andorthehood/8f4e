---
title: 'TODO: Handle Large Binary Assets with OPFS'
priority: Medium
effort: 1-2d
created: 2025-11-17
status: Open
completed: null
---

# TODO: Handle Large Binary Assets with OPFS

## Problem Description

Binary asset imports in `src/storage-callbacks.ts:158` always serialize the uploaded file into a base64 data URL via `arrayBufferToDataUrl`. That works for icons and other tiny blobs, but anything larger than ~1 MB explodes memory usage, blocks the UI thread during the string conversion loop, and bloats serialized editor state that must fit in storage quotas. Users who add multi-megabyte sprites or audio assets will see freezes and may lose their work when the browser refuses to persist the session. We need a size-aware storage strategy that keeps small files fast and ergonomic while routing large files into an Origin Private File System (OPFS) or similar backing store.

## Proposed Solution

- Define a configurable size threshold (e.g., 512 KB–1 MB) that determines when binary files should bypass data URL conversion.
- For files above the threshold, write the raw Blob or ArrayBuffer into OPFS (falling back to IndexedDB if OPFS is unavailable) and track lightweight handles/URLs in editor state.
- Maintain the existing data URL path for small assets to preserve simplicity where the cost is negligible.
- Extend project serialization to remember OPFS references (file handles, paths, or tokens) and revive them into Blob URLs when projects load.
- Update asset download/export routines to fetch from OPFS instead of assuming a data URL.

## Implementation Plan

### Step 1: Define storage policy & thresholds
- Add constants/config where binary asset imports can decide between data URL and OPFS.
- Document the threshold and expose overrides for tests or advanced users.
- Update `importBinaryFile` to branch on size before conversion.

### Step 2: Implement OPFS persistence path
- Use `navigator.storage.getDirectory()` to create/obtain an OPFS directory dedicated to binary assets.
- Write large files as `FileSystemFileHandle`s, store metadata (path, mime type, size) alongside the editor state entry, and generate Blob URLs on demand.
- Provide IndexedDB or in-memory fallback for browsers without OPFS support, ensuring the API surface stays consistent.

### Step 3: Wire up serialization, loading, and tests
- Update any persistence/export helpers so project saves reference OPFS-backed assets correctly and clean up files when assets are deleted.
- Add Vitest coverage for size threshold behavior plus integration tests that mock OPFS APIs to verify read/write flows.
- Document the behavior in editor docs so users know large assets persist outside the project JSON.

## Success Criteria

- [ ] Binary assets larger than the configured threshold never convert to data URLs and instead stream to OPFS (or fallback storage).
- [ ] Editor state serialization includes handles/paths for OPFS-backed assets and reloads them without manual intervention.
- [ ] Automated tests cover both sides of the threshold plus error handling for missing OPFS support.

## Affected Components

- `src/storage-callbacks.ts` – `importBinaryFile` branching logic and metadata returned to the editor.
- `packages/editor` persistence utilities – need to track OPFS references, cleanup, and export flows.
- `docs/editor` (or relevant user guide) – document new storage behavior and limits for binary assets.

## Risks & Considerations

- **Browser support**: OPFS is currently Chromium-only; must supply IndexedDB/memory fallback so Firefox/Safari users are not blocked.
- **Quota management**: OPFS space counts against site storage quotas; need logic to handle quota errors and inform users when they exceed limits.
- **Migration**: Existing projects already contain data URLs for large files; adding guards should not retroactively break or delete them.
- **Security**: Access to OPFS handles should remain scoped per project and cleared when users delete assets.

## Related Items

- **Related**: Inline TODO in `src/storage-callbacks.ts:158`.

## References

- [MDN: Origin Private File System](https://developer.mozilla.org/en-US/docs/Web/API/File_System_API/Origin_private_file_system)
- [Chromium blog on OPFS blob support](https://developer.chrome.com/blog/opfs/)

## Notes

- Align the size threshold with existing binary asset upload limits (if any) and surface a helpful message when files are rerouted to OPFS. 
- Consider chunked writes for very large files to avoid blocking the UI thread when streaming from FileReader.
- Document cleanup commands or UI affordances so users can reclaim space if OPFS storage gets large.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context)
