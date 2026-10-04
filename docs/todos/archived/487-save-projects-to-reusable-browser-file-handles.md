---
title: 'TODO: Save projects to reusable browser file handles'
priority: Medium
effort: 1-2d
created: 2026-09-29
issue: null
status: Completed
completed: 2026-10-04
---

# TODO: Save Projects to Reusable Browser File Handles

## Problem Description

The editor already captures `Cmd+S` and `Ctrl+S`, but the shortcut currently dispatches `saveSession`. That callback
writes the current project object to browser storage, even though code changes already trigger the same session-saving
path automatically.

Filesystem operations are separate and do not retain a file association:

- `exportProject` uses `showSaveFilePicker()` when available, writes the `.8f4e` file, and then discards the returned
  file handle.
- `importProject` uses an `<input type="file">`, which can read the selected file but cannot provide a reusable writable
  handle.
- Consequently, the editor cannot save back to an opened file or reuse the destination selected by an earlier save.

Explicit filesystem saving and automatic recovery persistence should be independent. Autosave should continue updating
the browser session, while `Cmd+S` or `Ctrl+S` should save the `.8f4e` source to its associated file.

## Proposed Solution

Introduce an explicit project-file save path backed by the File System Access API where available:

- Keep `saveSession` dedicated to automatic browser-storage persistence.
- Add a distinct `saveProject` event and callback for explicit `.8f4e` file saves.
- Change the existing platform save shortcut to dispatch `saveProject` instead of `saveSession`.
- Retain the `FileSystemFileHandle` returned by opening or saving a project for the lifetime of the mounted editor.
- When saving, write through the active handle. If no handle exists, show the save picker and retain the selected
  handle after a successful write.
- Use the current upload/download behavior as a fallback when the picker APIs are unavailable. The fallback cannot
  provide repeated in-place writes.

The reusable handle belongs in `@8f4e/editor-default`, which owns browser persistence and filesystem integration. The
editor state and core keyboard layer should expose only host-neutral events and callbacks, without storing browser file
handle types in editor state.

Handle persistence across page reloads is out of scope for the first implementation. Supporting that later would
require storing structured-cloneable handles in IndexedDB and rechecking permissions after restoration.

## Anti-Patterns

- Do not make code-change autosave write to the filesystem; only an explicit save command should do that.
- Do not reuse `saveSession` for file output or serialize its JSON representation as an `.8f4e` file.
- Do not store `FileSystemFileHandle` in generic editor state or in `localStorage`.
- Do not keep an old handle after an unrelated project replaces the current project, because the next save could
  overwrite the wrong file.
- Do not clear the handle during undo or redo; those operations modify the currently associated project.
- Do not treat picker cancellation as a save failure.

## Implementation Plan

### Step 1: Separate explicit file saving from session autosave

- Add a `saveProject` callback to the public callback contract in `@8f4e/editor-state-types`.
- Change the focused editor canvas's `Cmd+S`/`Ctrl+S` keyboard branch to dispatch `saveProject` and continue preventing
  the browser's Save Page action.
- Keep the existing `saveSession` subscriptions for browser-storage autosave, but remove the shortcut's connection to
  the `saveSession` event.
- In the project-export effect, serialize the current project to canonical `.8f4e` text and invoke `saveProject` with
  the configured export filename.

### Step 2: Add an editor-default project-file controller

- Refactor the browser file functions into a per-editor controller rather than module-level stateless functions.
- Keep an in-memory active `FileSystemFileHandle` inside that controller.
- Implement `saveProject(data, fileName)` so it writes to the active handle or calls `showSaveFilePicker()` when no
  handle exists.
- Keep the existing export action as an explicit picker-based save-as operation. A successful save-as becomes the new
  active handle.
- Queue or coalesce overlapping saves so key repeat and rapid successive commands cannot race writes to the same file.
- Keep the handle isolated per mounted editor so multiple editors on one page cannot share destinations accidentally.

### Step 3: Retain handles when opening projects

- Use `showOpenFilePicker()` for Open From Disk when available and restrict selection to `.8f4e` files.
- Read and parse the selected file, then adopt its handle only after the open succeeds.
- Before the first write to an opened handle, query or request `readwrite` permission while the save command still has
  transient user activation.
- Preserve the current `<input type="file">` fallback. A fallback-opened project has no active writable handle, so its
  first explicit save must choose or download a destination.

### Step 4: Manage project identity and failure cases

- Clear the active handle when creating a new project or replacing the current project from a URL, example, restored
  session, or another unrelated source.
- Preserve the handle for edits, recompilation, navigation, undo, and redo within the current project.
- Treat `AbortError` from open/save pickers as cancellation with no state or handle change.
- Report permission denial, parsing errors, and write failures through the editor's existing error path without losing
  a previously valid handle unnecessarily.

### Step 5: Add regression coverage and documentation

- Document that the active file association lasts for the current page lifetime and depends on File System Access API
  support.
- Update project import/export documentation to distinguish session autosave, Save, and Save As/export behavior.
- Add focused tests at the keyboard, editor-state, and editor-default integration boundaries.

## Validation Checkpoints

- Run `npx nx run-many --target=test --projects=@8f4e/editor-state,@8f4e/editor-core,@8f4e/editor-default`.
- Run `npx nx run-many --target=typecheck --projects=@8f4e/editor-state-types,@8f4e/editor-state,@8f4e/editor-core,@8f4e/editor-default`.
- Run `npx nx run @8f4e/editor-website:build`.
- Manually verify the secure-context website flow in a browser that supports the picker APIs:
  - open a `.8f4e` file, edit it, and save back to the same file;
  - start without a handle, save once through the picker, and save again without another picker;
  - use Save As/export and confirm later saves target the newly selected file;
  - cancel each picker and confirm the project and prior handle remain unchanged;
  - switch to an unrelated project and confirm the next save cannot overwrite the old file.
- Verify the upload/download fallback in a browser without `showOpenFilePicker()` or `showSaveFilePicker()`.

## Success Criteria

- [x] `Cmd+S` and `Ctrl+S` save canonical `.8f4e` text through the explicit project-file path.
- [x] The shortcut no longer calls `saveSession`; code-change autosave continues updating browser storage.
- [x] A project opened through the File System Access API saves back to the opened file after write permission is
      granted.
- [x] The first save without a handle opens a save picker, and later saves reuse the resulting handle.
- [x] A successful Save As/export updates the active handle.
- [x] Unrelated project replacement clears the handle, while undo and redo preserve it.
- [x] Picker cancellation is silent and leaves the current handle unchanged.
- [x] Concurrent saves are serialized and cannot corrupt or reorder file contents.
- [x] Unsupported browsers retain functional upload/download behavior.
- [x] Tests cover keyboard dispatch, serialization, handle reuse, permission outcomes, cancellation, fallback behavior,
      and per-editor isolation.

## Affected Components

- `packages/editor/packages/editor-core/src/events/keyboardEvents.ts` - dispatch explicit project save from the existing
  platform shortcut.
- `packages/editor/packages/editor-core/src/events/keyboardEvents.test.ts` - cover both platform modifier variants and
  removal of the session-save dispatch.
- `packages/editor/packages/editor-core/packages/editor-state-types/src/index.ts` - add the host-neutral project-save
  callback contract.
- `packages/editor/packages/editor-core/packages/editor-state/src/features/project-export/effect.ts` - serialize and
  route explicit saves separately from session persistence.
- `packages/editor/packages/editor-core/packages/editor-state/src/features/project-export/__tests__/effect.test.ts` -
  verify separation between explicit saves and autosave.
- `packages/editor/packages/editor-core/packages/editor-state/src/features/project-import/` - signal project-source
  changes that must clear or establish the active file association.
- `packages/editor/packages/editor-default/src/storage-callbacks.ts` - own the per-editor file controller, handle
  lifecycle, permissions, writes, and fallbacks.
- `packages/editor/packages/editor-default/src/storage-callbacks.test.ts` - cover picker, handle, cancellation,
  permission, concurrency, and fallback behavior.
- `packages/editor/packages/editor-default/src/index.ts` - create and wire one project-file controller per editor mount.

## Risks & Considerations

- **Transient activation**: Permission requests and picker calls must begin synchronously from the keyboard or menu
  action before browser user activation expires.
- **Wrong-file overwrite**: Every project replacement path must deliberately preserve or clear the current handle.
- **Browser support**: Direct reusable handles are not universally available; fallback behavior must remain explicit
  and tested.
- **Concurrent writes**: Multiple save commands can overlap unless the controller serializes them.
- **Public API change**: Adding `saveProject` affects callback types and host integrations, although it can remain
  optional for custom editor compositions.
- **Reload behavior**: The handle is intentionally lost on reload in the initial implementation; browser session
  autosave still provides recovery.

## Related Items

- [TODO 245: Configurable export filename from project config](245-configurable-export-filename-from-project-config.md).
- [TODO 247: Remove runtime-ready project export](247-remove-runtime-ready-project-export.md).

## References

- [MDN: `showOpenFilePicker()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/showOpenFilePicker)
- [MDN: `showSaveFilePicker()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/showSaveFilePicker)
- [File System Access specification](https://wicg.github.io/file-system-access/)
- [Project export effect](../../../packages/editor/packages/editor-core/packages/editor-state/src/features/project-export/effect.ts)
- [Default storage callbacks](../../../packages/editor/packages/editor-default/src/storage-callbacks.ts)
- [Editor keyboard events](../../../packages/editor/packages/editor-core/src/events/keyboardEvents.ts)

## Notes

The desired behavior was clarified on 2026-09-29: automatic session saving already covers browser recovery, so the
existing `Cmd+S`/`Ctrl+S` capture should be disconnected from `saveSession` and used exclusively for filesystem saving.

## Implementation Notes

Implemented the host-neutral `saveProject` callback/event and the per-mounted-editor project-file controller.
Project replacements notify the controller through `projectLoaded`; undo/redo snapshots explicitly preserve the
file association. The New Project menu event now loads the empty project through that same replacement path.
Pending writes are serialized and share a pending save destination. Accepted saves finish with their captured
source and destination even if the project is replaced or the editor is disposed. A successful write adopts its
handle only if the original project is still loaded; a parsed disk import adopts its handle when loaded.

Validation completed:

- The three affected test suites, four package type checks, and editor website production build passed.
- Biome checks and `git diff --check` passed.
- A Chromium UI regression verified that Cmd+S followed by New Project during a delayed write completes the accepted save.
- A Chromium smoke check exercised both save shortcuts in the built editor, canonical source output, handle reuse,
  opening, Save As, cancellation, replacement, and native upload/download fallback. Picker dialogs were simulated;
  file reads and writes used real origin-private browser file handles. Native OS picker dialogs and interactive
  permission prompts still need manual verification.

## Archive Instructions

Set `status: Completed` and the completion date, move this file to `docs/todos/archived/`, and update
`docs/todos/_index.md`.
