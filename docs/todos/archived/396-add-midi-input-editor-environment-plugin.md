---
title: 'TODO: Add MIDI input editor environment plugin'
priority: Medium
effort: 1-2d
created: 2026-05-11
status: Completed
completed: 2026-05-11
---

# TODO: Add MIDI input editor environment plugin

## Problem Description

The current editor environment MIDI plugin is named `midiDevices` and only lists available MIDI inputs and outputs in `state.info.midi`. It is currently triggered by a placeholder `@midi` directive.

The next MIDI integration should let projects bind a MIDI input port to an exported 8f4e function. Browser MIDI events must be received on the main thread, but audio programs may run in an AudioWorklet. Sending every MIDI message through the AudioWorklet would add complexity and latency-sensitive message plumbing.

Because the compiled program already uses shared WebAssembly memory, a cleaner architecture is to instantiate the current Wasm program on the main thread as a MIDI event updater. The MIDI plugin can call an exported 8f4e function for each input event, and that function can write control state into shared memory for the audio runtime to read.

## Proposed Solution

Rename and broaden the editor environment MIDI plugin from `midiDevices` to `midi`, then add a directional MIDI input directive:

```8f4e
; @info midi
; @midiIn <port> <callbackExportName>
```

`@info midi` remains the discovery surface for available MIDI devices. Each `@midiIn` directive binds one MIDI input port to one exported 8f4e function. A project may declare many `@midiIn` directives, including multiple handlers for the same port; every handler bound to that port receives the same raw MIDI event data and can filter for the messages it cares about inside 8f4e.

Example:

```8f4e
; @midiIn 0 onMidiIn
; @midiIn 0 onNoteGate
; @midiIn 0 onPitchBend
```

Example callback shape:

```8f4e
function handleMidiIn
#export onMidiIn
	param int status
	param int data1
	param int data2
	; write note/control state into shared memory
functionEnd
```

The plugin calls the exported function with positional numeric MIDI bytes:

```ts
onMidiIn(status, data1, data2);
```

## Initial Decisions

- Use `@midiIn`, not `@midi`, so future `@midiOut` support has a clear place.
- Treat the current `@midi` plugin trigger as a placeholder and replace it with `midiIn`.
- Keep the plugin folder named `midi`, because it will eventually own both input and output concerns.
- Keep `@info midi` backed by `state.info.midi`.
- Keep both MIDI input and output devices visible in `@info midi`.
- Use raw MIDI input port numbers as the `<port>` argument for `@midiIn` in v1.
- Do not add port-name or port-id binding yet; that can be added later if numeric ports become too brittle.
- In v1, forward only `status`, `data1`, and `data2`.
- Allow many exported 8f4e MIDI handlers to be bound to the same input port.
- Allow the same callback export to be bound to multiple input ports.
- Let each handler receive the same raw MIDI event data and perform its own filtering in 8f4e.
- Do not add explicit handler ordering logic in v1; use the natural discovery/iteration order from the plugin implementation.
- Do not support quoted MIDI device names as directive arguments in v1; the directive parser currently splits on whitespace.
- Do not route MIDI input events through the AudioWorklet just to call updater functions.

## Proposed File Organization

```text
packages/editor/src/editorEnvironmentPlugins/midi/
  plugin.ts
  devices.ts
  midiIn.ts
  directives.ts
  types.ts
  plugin.test.ts
  devices.test.ts
  midiIn.test.ts
  directives.test.ts
```

Responsibilities:

- `plugin.ts` composes plugin lifecycle, starts device discovery, starts MIDI input bindings, and owns cleanup.
- `devices.ts` owns `navigator.requestMIDIAccess()`, builds `state.info.midi`, tracks `MIDIAccess.onstatechange`, and exposes current input ports.
- `directives.ts` parses active `@midiIn <port> <exportName>` directives from code blocks and returns plain binding data plus directive errors.
- `midiIn.ts` resolves input ports, attaches MIDI message handlers, instantiates the current Wasm program with shared memory, resolves exported callbacks, and forwards events.
- `types.ts` holds internal shared types such as MIDI binding records.

## Implementation Plan

### Step 1: Rename and re-register the plugin

- Move `packages/editor/src/editorEnvironmentPlugins/midiDevices` to `packages/editor/src/editorEnvironmentPlugins/midi`.
- Rename the plugin implementation and tests from `midiDevicesPlugin` to `midiPlugin`.
- Change the registry entry from:

```ts
{
	id: 'midi-devices',
	editorDirectives: ['midi'],
	load: () => import('./midiDevices/plugin'),
}
```

to:

```ts
{
	id: 'midi',
	editorDirectives: ['midiIn'],
	load: () => import('./midi/plugin'),
}
```

### Step 2: Separate device listing from input handling

- Extract current device discovery code into `devices.ts`.
- Preserve existing `state.info.midi` behavior and tests.
- Keep listing both MIDI inputs and outputs.
- Keep disconnected ports out of the info map.
- Expose raw port numbers clearly enough that users can copy them into `@midiIn <port> <callbackExportName>`.

### Step 3: Parse `@midiIn` bindings

- Add `directives.ts` to scan raw parsed editor directives for `@midiIn`.
- Require exactly two arguments: `<port>` and `<callbackExportName>`.
- Report plugin-owned editor directive errors for missing or malformed arguments.
- Allow multiple `@midiIn` bindings per port so one MIDI event can fan out to several exported 8f4e handlers.
- Allow the same callback export to appear on multiple ports.
- Reject exact duplicate `<port>, <callbackExportName>` pairs to avoid accidental double-calling the same handler for one event.

### Step 4: Expose current Wasm inputs to editor environment plugins

- Add a small editor/plugin context surface for retrieving:
  - the current shared `WebAssembly.Memory`
  - the current compiled `codeBuffer`
- Reuse the same memory and bytecode sources that runtime definitions already receive.
- Keep this as a host/editor boundary concern, not editor-state state.

### Step 5: Instantiate a MIDI updater Wasm instance

- In `midiIn.ts`, instantiate the current `codeBuffer` with the current shared memory.
- Resolve each configured callback export by name.
- On compile success, memory recreation, or binding change, recreate the MIDI updater instance.
- If the export is missing or is not callable, report a plugin-owned directive error.

### Step 6: Forward MIDI input events

- Attach `onmidimessage` handlers to selected MIDI input ports.
- For each message, extract `status`, `data1`, and `data2`, defaulting missing data bytes to `0`.
- Call every export bound to that input port with `(status, data1, data2)`.
- Do not add explicit handler ordering rules beyond the natural binding iteration order.
- Continue calling later handlers if one handler throws, and surface callback errors as plugin-owned errors without breaking device discovery cleanup.

### Step 7: Test and document

- Unit test device listing without involving Wasm.
- Unit test directive parsing without involving Web MIDI.
- Unit test MIDI input forwarding with mocked `MIDIAccess`, `MIDIInput`, shared memory, code buffer, and exported functions.
- Update editor directive docs with `@midiIn <port> <callbackExportName>` and the `@info midi` discovery workflow.

## Validation Checkpoints

- `npx nx run editor:test -- midi`
- `npx nx run editor:typecheck`
- `npx nx run app:build`

## Success Criteria

- [x] The MIDI editor environment plugin is named and organized as `midi`.
- [x] The plugin lazy-loads from `@midiIn` or `@info midi`, not placeholder `@midi`.
- [x] `@info midi` continues to list available MIDI devices.
- [x] `@midiIn <port> <callbackExportName>` binds a MIDI input port to a `#export`ed 8f4e function.
- [x] Multiple `@midiIn` handlers can be bound to the same port.
- [x] MIDI input messages call every exported function bound to the input port as `(status, data1, data2)`.
- [x] The MIDI updater Wasm instance imports the same shared memory as the active runtime.
- [x] Missing ports, malformed directives, and missing exports produce plugin-owned editor directive errors.
- [x] Device listing, directive parsing, and MIDI input forwarding have separated tests.

## Affected Components

- `packages/editor/src/editorEnvironmentPlugins/registry.ts` - replace placeholder MIDI trigger with `midiIn`.
- `packages/editor/src/editorEnvironmentPlugins/midi` - renamed and expanded MIDI plugin.
- `packages/editor/src/editorEnvironmentPlugins/types.ts` - add access to current Wasm memory/code buffer if needed.
- `packages/editor/src/index.ts` - pass current Wasm accessors into the plugin manager if needed.
- `src/compiler-callback.ts` - existing host-owned source for memory and code buffer access.
- `packages/editor/docs/editor-directives.md` - document `@midiIn` and `@info midi` workflow.

## Risks & Considerations

- **MIDI permissions**: Browser MIDI access may require user permission and can fail; errors should not leave stale info or handlers.
- **Port identity**: v1 uses raw MIDI input port numbers. Port-name or Web MIDI id binding can be added later if numeric ports prove too brittle.
- **Wasm lifecycle**: Recompiles and memory recreation must refresh the MIDI updater instance so callbacks and memory stay current.
- **AudioWorklet isolation**: MIDI events should stay on the main thread and update shared memory instead of being proxied through the AudioWorklet.
- **ABI scope**: Start with raw MIDI bytes only. Timestamps, port indices, and higher-level decoded events can be added later if needed.
- **Future MIDI output**: Keep input-specific code in `midiIn.ts` so `midiOut.ts` can be added without tangling device discovery or plugin lifecycle.

## Related Items

- **Related**: `docs/todos/387-add-lazy-editor-environment-plugins.md`
- **Related**: `docs/todos/archived/395-add-exported-8f4e-functions.md`

## Notes

- This TODO assumes `#export <exportedName>` support exists before MIDI input forwarding is implemented.
- The current `midiDevices` plugin should be treated as the seed for `devices.ts`, not as the final plugin shape.
- Completed on 2026-05-11 by renaming the MIDI plugin, splitting device/directive/input concerns, adding `@midiIn` forwarding to exported Wasm callbacks, documenting the directive, and adding focused editor plugin tests.
