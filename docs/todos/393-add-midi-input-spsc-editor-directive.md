---
title: 'TODO: Add MIDI input SPSC editor directive'
priority: Medium
effort: 1-2d
created: 2026-05-07
status: Open
completed: null
---

# TODO: Add MIDI input SPSC editor directive

## Problem Description

The editor can already show connected MIDI device names and port ids, but there is no editor directive that binds a selected MIDI input port to 8f4e program memory.

8f4e programs should be able to receive raw MIDI input without coupling the editor to MIDI parsing rules. The browser/editor side should only route `MIDIMessageEvent` data into a shared single-producer/single-consumer buffer. Filtering, message parsing, channel handling, note state, CC state, and musical interpretation should remain ordinary 8f4e program logic.

## Proposed Solution

Replace the current placeholder MIDI device-list plugin with a unified lazy MIDI editor environment plugin triggered by one directive:

```8f4e
; @midiInput <portId> <buffer> <readIndex> <writeIndex> <dropped>
```

Example:

```8f4e
module midiIn

int[] buffer 320
int readIndex 0
int writeIndex 0
int dropped 0

; @midiInput 1234567890 buffer readIndex writeIndex dropped

moduleEnd
```

The directive binds one Web MIDI input port id to one SPSC event buffer. The editor owns `writeIndex` and `dropped`; the 8f4e program owns `readIndex`.

The unified plugin should also keep the existing MIDI device-list behavior: when `@midiInput` is present, request MIDI access, publish connected device names/port ids to `state.info.midi`, and use the same `MIDIAccess` session for input listeners. Future MIDI output support should live in the same plugin, with output-specific responsibilities split into separate internal files.

Use fixed-width raw records:

```text
word 0: sequence
word 1: status
word 2: data1
word 3: data2
word 4: timestampMs
```

The editor should infer:

```text
recordWords = 5
capacity = count(buffer) / recordWords
```

No MIDI filtering or semantic message parsing should happen in the editor plugin. The plugin only copies raw MIDI bytes into records:

```text
status = data[0] ?? 0
data1 = data[1] ?? 0
data2 = data[2] ?? 0
```

## Decisions

- Use `MIDIPort.id` in source, not the device name. Names are for display and can be duplicated or contain whitespace.
- Keep v1 to one directive. Do not introduce a separate generic `@spscBuffer` directive.
- Replace the placeholder `@midi` activation directive with `@midiInput`; do not keep `@midi` as a separate discovery-only directive in v1.
- Use one unified MIDI editor environment plugin rather than separate `midiDevices`, `midiInput`, and future `midiOutput` plugins.
- Split responsibilities inside the plugin so discovery, directive parsing, input writing, and future output routing stay independently testable.
- Use a strict SPSC ownership model: producer writes only `writeIndex` and `dropped`; consumer writes only `readIndex`.
- When full, drop the newest incoming MIDI event and increment `dropped`. Do not advance `readIndex` from the editor, because that would break consumer ownership.
- Keep the record format raw and stable so MIDI parsing can be extracted into reusable 8f4e modules.
- Do not add filtering options to `@midiInput` in v1. Channel/type/device-name filtering belongs either in 8f4e or in a later explicit UX design.

## Implementation Plan

### Step 1: Add directive activation

- Replace the current `midi-devices` registry entry with a unified `midi` entry in `packages/editor/src/editorEnvironmentPlugins/registry.ts`.
- Trigger it from raw `@midiInput` directive records.
- Keep the registry lightweight and lazily import the implementation.

Suggested registry shape:

```ts
{
	id: 'midi',
	editorDirectives: ['midiInput'],
	load: () => import('./midi/plugin'),
}
```

### Step 2: Restructure the MIDI plugin package

- Move the existing `midiDevices` plugin behavior into `packages/editor/src/editorEnvironmentPlugins/midi/`.
- Keep device-list updates as an internal responsibility, not as a separate plugin activation path.
- Split the implementation into small modules where useful:
  - `plugin.ts` for lifecycle orchestration
  - `midiAccess.ts` for `requestMIDIAccess` and `statechange` handling
  - `midiDevices.ts` for publishing `state.info.midi`
  - `midiInputDirectives.ts` for parsing/validation
  - `midiInputWriter.ts` for SPSC memory writes
  - future `midiOutput.ts` for MIDI output routing

### Step 3: Parse and validate `@midiInput`

- Parse all active `@midiInput` directives from code blocks and the selected code block.
- Require exactly five arguments: `<portId> <buffer> <readIndex> <writeIndex> <dropped>`.
- Require the directive to be inside a module block.
- Resolve memory ids against the containing module.
- Validate that `buffer` is an integer array.
- Validate that `readIndex`, `writeIndex`, and `dropped` are integer scalar memory entries.
- Validate that `count(buffer) % 5 === 0` and `capacity >= 2`.
- Surface plugin-owned editor directive errors with `ownerId: 'midi'`.

### Step 4: Wire Web MIDI devices and input ports

- Request MIDI access when the plugin is active.
- Publish available MIDI input/output names and port ids to `state.info.midi`, preserving the current device-list behavior.
- Find input ports by `MIDIPort.id`.
- Attach `midimessage` listeners for configured ports.
- Listen to MIDI `statechange` so directives recover when a device appears after project load.
- Surface a directive warning or error when a referenced port id is unavailable.

### Step 5: Write SPSC records into memory

- For each MIDI message, read `readIndex` and `writeIndex` from memory.
- Compute `nextWriteIndex = (writeIndex + 1) % capacity`.
- If `nextWriteIndex === readIndex`, increment `dropped` and return.
- Otherwise write the five record words at `buffer + writeIndex * 5`.
- Publish `writeIndex = nextWriteIndex` only after the record words are written.
- Maintain a monotonically increasing integer `sequence` per plugin instance.

### Step 6: Add tests

- Preserve the current MIDI device-list behavior tests after moving the code.
- Unit test directive parsing and memory-target validation.
- Unit test unavailable port diagnostics.
- Unit test SPSC writes, cursor advancement, and full-buffer drops with mocked memory views.
- Unit test plugin cleanup removes MIDI listeners and clears plugin-owned errors.
- Unit test dynamic plugin lifecycle through the existing editor environment plugin manager where useful.

## Validation Checkpoints

- `npx nx run editor:test`
- `npx nx run editor:typecheck`
- `npx nx run app:build`
- Manual browser check with a connected MIDI input device:
  - device appears in the existing device/port UI
  - selecting or typing the port id into `@midiInput` starts filling the buffer
  - changing/removing the directive detaches listeners
  - unplugging/replugging the device updates diagnostics and reconnects when possible

## Success Criteria

- [ ] `@midiInput <portId> <buffer> <readIndex> <writeIndex> <dropped>` activates one unified lazy MIDI editor environment plugin.
- [ ] The old placeholder `@midi` discovery directive is replaced by `@midiInput`.
- [ ] The unified MIDI plugin preserves the existing connected device name/port-id publishing behavior through `state.info.midi`.
- [ ] The plugin writes raw five-word MIDI records into the specified SPSC buffer.
- [ ] The editor does not filter or semantically parse MIDI events beyond copying status/data bytes.
- [ ] Full buffers drop newest events and increment `dropped` without modifying `readIndex`.
- [ ] Unavailable or malformed port/memory targets produce clear plugin-owned editor directive errors.
- [ ] Removing the directive disposes MIDI listeners and clears plugin-owned diagnostics.

## Affected Components

- `packages/editor/src/editorEnvironmentPlugins/registry.ts` - replace placeholder `midi-devices` activation with unified `midi` plugin activation.
- `packages/editor/src/editorEnvironmentPlugins/midiDevices/` - move or replace with the unified MIDI plugin structure.
- `packages/editor/src/editorEnvironmentPlugins/midi/` - add unified MIDI plugin implementation and tests.
- `packages/editor/packages/editor-state-types/src/features/global-editor-directives/types.ts` - only if shared resolved state becomes necessary; prefer keeping parsing plugin-local for v1.
- Existing MIDI device/port UI - use displayed `MIDIPort.id` values as directive arguments.

## Risks & Considerations

- **Directive tokenization**: directive args are whitespace-split. Port ids must be single-token values. If real devices expose whitespace in ids, add an escaping or quoted-string strategy deliberately.
- **Concurrent memory access**: shared wasm memory is written from browser event handlers and read by the runtime. Use `Atomics.load/store` for cursor fields where supported by the typed view.
- **Memory recreation**: compilation can recreate wasm memory. The plugin must resolve addresses against current compiler state and write through current memory views.
- **Browser support**: Web MIDI availability and permission behavior vary by browser. The plugin should degrade with diagnostics instead of failing editor startup.
- **Multiple directives**: allow multiple `@midiInput` directives for different ports/buffers, but reject or warn on duplicate bindings to the same target buffer/cursors unless fan-in is intentionally designed.
- **Plugin growth**: a unified MIDI plugin can become too large if all concerns live in `plugin.ts`. Keep internal modules small so future output support has room without becoming mud.

## Related Items

- **Related**: `387` Add lazy editor environment plugins
- **Related**: `315` Optimize global editor directive recomputation

## Notes

- The intended companion 8f4e module is a generic SPSC consumer that copies one fixed-width item per cycle into a stable `item[]` output.
- MIDI parsing modules should consume the generic `item[]` output and interpret `status`, `data1`, `data2`, and channel/message type in 8f4e code.
