---
title: 'TODO: Migrate @midiIn to config directive'
priority: Medium
effort: 1-2d
created: 2026-05-30
issue: null
status: Completed
completed: 2026-06-04
---

# TODO: Migrate @midiIn to config directive

## Problem Description

`@midiIn` configures browser MIDI input routing, but it is currently parsed as a standalone editor environment directive outside the generic editor config system.

Current state:
- MIDI bindings are declared with `; @midiIn <port> <callbackExportName>`.
- The MIDI environment plugin scans active code blocks for `@midiIn`.
- Validation, duplicate detection, and binding resolution are owned by plugin-specific directive parsing.
- The directive behaves like project/environment configuration, not like block-local rendering metadata.

Why this is a problem:
- config-like editor environment behavior is split across ad hoc directive parsers
- MIDI does not benefit from schema-backed validation or shared config diagnostics
- future host/plugin configuration will have two competing declaration paths

## Proposed Solution

Represent MIDI input bindings through `@config` paths owned by the MIDI environment plugin.

Possible shape:

```txt
; @config midi.inputs.0.callback onMidiIn
; @config midi.inputs.0.port 0
```

or a compact indexed path:

```txt
; @config midi.input.0 onMidiIn
```

The exact schema should be chosen during implementation. Prefer a shape that remains readable in code blocks and can support multiple bindings without path collisions.

## Anti-Patterns

- Do not keep `@midiIn` as a parallel live parser after migration.
- Do not make editor-state own MIDI-specific config fields.
- Do not hardcode MIDI config paths into `EditorConfig`.
- Do not require the MIDI plugin to scan raw source lines when parsed config entries are already available.

## Implementation Plan

### Step 1: Define a MIDI config schema contribution
- Add a MIDI-owned editor config schema contribution under a root such as `midi`.
- Register the contribution from the editor environment plugin path or host plugin setup.
- Preserve validation for port and callback export shape.

### Step 2: Read bindings from resolved editor config
- Replace `parseMidiInDirectives(...)` with config resolution.
- Keep duplicate binding diagnostics where applicable.
- Continue validating that callback exports exist before activating bindings.

### Step 3: Migrate examples and docs
- Replace `; @midiIn ...` uses with `; @config midi...` declarations.
- Update `packages/editor/docs/editor-directives.md`.
- Remove `@midiIn` from the supported live directive vocabulary.

### Step 4: Remove old directive support
- Delete or archive MIDI directive parsing tests.
- Ensure unknown `@midiIn` comments are ignored like plain unsupported editor metadata.

## Validation Checkpoints

- `npx nx run app:lint`
- `npx nx run @8f4e/editor-state:test -- --run src/features/editor-config`
- `npx nx run app:test -- --run src/editorEnvironmentPlugins/midi`
- `rg -n "@midiIn" packages src docs --glob '!docs/todos/**' --glob '!docs/brainstorming_notes/archived/**'`

## Success Criteria

- [ ] MIDI input bindings are declared through `@config`.
- [ ] The MIDI environment plugin owns the MIDI config schema.
- [ ] MIDI config validation uses the shared schema-backed config path.
- [ ] Existing MIDI callback/export validation still runs.
- [ ] No live examples or docs use `@midiIn`.

## Affected Components

- `packages/editor/src/editorEnvironmentPlugins/midi/`
- `packages/editor/packages/editor-state/src/features/editor-config/`
- `packages/editor/docs/editor-directives.md`
- `packages/examples/src/projects/midi/midiIn.8f4e`

## Risks & Considerations

- **Readability**: MIDI bindings should stay short enough to fit comfortably in code blocks.
- **Multiple bindings**: The schema shape must support multiple ports and callbacks without relying on duplicate `@config` last-write-wins behavior accidentally deleting bindings.
- **Plugin load trigger**: The lazy environment plugin currently activates from directives. Config schema contribution and plugin activation need a clear handoff.

## Related Items

- **Related**: `docs/todos/archived/396-add-midi-input-editor-environment-plugin.md`
- **Related**: `docs/todos/315-optimize-global-editor-directive-recomputation.md`

## Notes

- Created after identifying `@midiIn` as config-like editor environment behavior during the generic editor config schema contribution work.
- Completed by migrating MIDI input bindings to schema-backed `@config midi.inputs...` entries, removing live `@midiIn` support, and verifying no live examples/docs still use the old directive.
