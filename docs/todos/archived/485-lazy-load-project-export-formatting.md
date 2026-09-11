---
title: 'TODO: Lazy-load project export formatting'
priority: Low
effort: 4-8h
created: 2026-09-06
issue: null
status: Cancelled
completed: 2026-09-07
---

# TODO: Lazy-load Project Export Formatting

## Problem Description

The project-export effect eagerly imports the `.8f4e` text serializer even when the user never exports a project.
The same effect also owns session saving, so deferring the entire effect would interfere with persistence.

## Proposed Solution

Load `serializeProjectTo8f4e` when exporting a `.8f4e` file. Keep state-to-project serialization, session saving,
configuration registration, and lightweight export event handlers available immediately.

## Implementation Plan

1. Measure the serializer's contribution and inspect its imports and public re-export from `editor-state`.
2. Defer text serialization through a cached module loader while keeping autosave independent. Preserve the intended
   project snapshot and filename if state changes while export code loads.
3. Preserve save-picker user activation: acquiring a file handle may need to happen synchronously from the user action,
   before waiting for a network import. Adjust the export callback flow only as required and document any API change.
4. Cover cancellation and failure, and measure the production bundle and first-export behavior.

## Success Criteria

- [ ] Normal startup and autosave do not load the `.8f4e` text formatter.
- [ ] First and subsequent exports produce equivalent content and filenames for the captured project.
- [ ] Session persistence, binary export, and screenshot export retain their behavior.
- [ ] Native save pickers and the download fallback still work, including cancellation and delayed module loading.
- [ ] Export errors are handled without unhandled rejections.
- [ ] Final bundle inspection confirms no alternate eager import retains the formatter, and savings are recorded.

## Affected Components

- `packages/editor/packages/editor-core/packages/editor-state/src/features/project-export/effect.ts`
- `packages/editor/packages/editor-core/packages/editor-state/src/features/project-export/serializeTo8f4e.ts`
- `packages/editor/packages/editor-core/packages/editor-state/src/index.ts`
- `packages/editor/packages/editor-default/src/storage-callbacks.ts`

## Risks & Considerations

This is expected to be a smaller saving. Preserve the existing synchronous public serializer API unless changing it is
necessary and justified; its re-export and intermediate library bundles must be checked in the final consumer build.
Browser user activation can expire during an asynchronous load, making the file-picker flow a key validation point.

## Validation Checkpoints

- Run `npx nx run-many --target=test --projects=@8f4e/editor-state,@8f4e/editor-default` and corresponding typechecks.
- Run `npx nx run @8f4e/editor-website:build` and compare initial static dependency sizes.
- Manually test cold-load export with a native save picker and with the download fallback.
- Verify autosave before any export and focused serialization regression tests.

## Related Items

- [TODO 486: Lazy-load editing features on entering edit mode](486-lazy-load-editing-features-on-edit-mode.md) — both must preserve shared session serialization.

## References

- [Project-export effect](../../packages/editor/packages/editor-core/packages/editor-state/src/features/project-export/effect.ts)

## Notes

Identified through source inspection on 2026-09-06. Prioritize background rendering and menu builders before this smaller split.

## Archive Instructions

Set `status: Completed` and the completion date, move this file to `docs/todos/archived/`, and update `docs/todos/_index.md`.
