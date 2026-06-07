---
title: 'TODO: Migrate keyboard memory directives to config'
priority: Medium
effort: 4-8h
created: 2026-05-30
issue: null
status: Completed
completed: 2026-06-04
---

# TODO: Migrate keyboard memory directives to config

## Problem Description

`@keyCodeMemory` and `@keyPressedMemory` configure where the editor writes browser keyboard state into WebAssembly memory, but they are currently global editor directives outside the generic config system.

Current state:
- `; @keyCodeMemory <memoryId>` writes the latest USB HID usage id to the configured memory.
- `; @keyPressedMemory <memoryId>` writes pressed/released state to the configured memory.
- The global editor directive resolver stores these paths in `state.globalEditorDirectives`.
- The keyboard memory environment plugin reads `state.globalEditorDirectives`.

Why this is a problem:
- keyboard environment configuration is not schema-backed
- editor-state owns keyboard-specific directive state
- this creates another config-like vocabulary next to `@config`

## Proposed Solution

Move keyboard memory configuration to a keyboard-owned schema contribution.

Possible shape:

```txt
; @config keyboard.keyCodeMemory keyboard:keyCode
; @config keyboard.keyPressedMemory keyboard:keyPressed
```

The keyboard memory plugin should own this schema and read the resolved config instead of `state.globalEditorDirectives`.

## Anti-Patterns

- Do not add keyboard-specific fields to `EditorConfig`.
- Do not keep `@keyCodeMemory` or `@keyPressedMemory` as live supported directives after migration.
- Do not duplicate memory-id resolution rules in editor-state if shared config memory-address handling is suitable.
- Do not silently accept malformed memory ids without an editor diagnostic.

## Implementation Plan

### Step 1: Add keyboard config schema contribution
- Add a `keyboard` config root owned by the keyboard environment plugin.
- Add fields for key code and pressed-state memory targets.
- Decide whether the values should use the existing `memory-address` format or a module-qualified memory-id string.

### Step 2: Update plugin reads
- Replace `state.globalEditorDirectives.keyCodeMemoryId` and `keyPressedMemoryId` reads with resolved config values.
- Keep writes to memory behavior unchanged.
- Preserve blur/key-up/key-down semantics.

### Step 3: Migrate docs and tests
- Update keyboard memory tests to use config-backed state.
- Update `packages/editor/docs/editor-directives.md`.
- Remove old global directive plugins and tests.

## Validation Checkpoints

- `npx nx run app:test -- --run src/editorEnvironmentPlugins/keyboardMemory`
- `npx nx run @8f4e/editor-state:test -- --run src/features/global-editor-directives src/features/editor-config`
- `rg -n "@keyCodeMemory|@keyPressedMemory|keyCodeMemoryId|keyPressedMemoryId" packages src docs --glob '!docs/todos/**' --glob '!docs/brainstorming_notes/archived/**'`

## Success Criteria

- [ ] Keyboard memory targets are declared through `@config`.
- [ ] The keyboard memory plugin owns the keyboard config schema.
- [ ] `state.globalEditorDirectives` no longer carries keyboard memory ids.
- [ ] Old keyboard memory directives are removed from live docs and examples.
- [ ] Existing keyboard memory behavior is preserved.

## Affected Components

- `packages/editor/src/editorEnvironmentPlugins/keyboardMemory/`
- `packages/editor/packages/editor-state/src/features/global-editor-directives/`
- `packages/editor/packages/editor-state-types/src/features/global-editor-directives/types.ts`
- `packages/editor/docs/editor-directives.md`

## Risks & Considerations

- **Memory address format**: resolved numeric addresses are efficient, but storing module-qualified memory ids may be easier to re-resolve after recompilation.
- **Plugin activation**: if lazy plugin activation currently depends on directive presence, config-backed activation needs an equivalent signal.
- **Error ownership**: diagnostics should remain attached to the config line where the invalid memory target is declared.

## Related Items

- **Related**: `docs/todos/315-optimize-global-editor-directive-recomputation.md`
- **Related**: `docs/todos/326-unify-remaining-editor-runtime-memory-ids-to-module-memory-syntax.md`

## Notes

- This is separate from MIDI because keyboard memory writes are continuous browser input state, while MIDI routes callback invocations to exported Wasm functions.
- Completed by migrating keyboard memory targets to schema-backed `@config keyboard...` entries, removing live `@keyCodeMemory` / `@keyPressedMemory` support, and verifying the keyboard plugin activates from config paths.
