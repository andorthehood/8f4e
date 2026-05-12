---
title: 'TODO: Add exported 8f4e functions'
priority: Medium
effort: 4-8h
created: 2026-05-10
status: Completed
completed: 2026-05-10
---

# TODO: Add exported 8f4e functions

## Problem Description

8f4e functions can currently be called from other 8f4e code, but user-defined functions are not exported from the generated WebAssembly module. This prevents runtimes and host integrations from calling small 8f4e-authored updater functions directly from JavaScript.

This blocks a simpler control-event architecture where external event sources, such as MIDI, UI controls, keyboard input, OSC, or WebSocket messages, can call a compiled 8f4e function that writes into shared WebAssembly memory. The audio runtime can then keep running `buffer()` normally and read the updated memory values without receiving event messages or dispatching handlers inside the AudioWorklet.

## Proposed Solution

Add a compiler directive for exporting user functions:

```8f4e
function onMidiCC
#export onMidiCC
param int channel
param int controller
param int value
functionEnd
```

The directive should export the enclosing 8f4e function under the provided WebAssembly export name. JavaScript can then call the export with positional numeric arguments:

```ts
(instance.exports.onMidiCC as CallableFunction)(channel, controller, value);
```

Initial ABI rules:

- `int` maps to Wasm `i32` and JS `number`.
- `float` maps to Wasm `f32` and JS `number`.
- `float64` maps to Wasm `f64` and JS `number`.
- Do not introduce object, array, or dynamic event payload arguments.
- Richer data should be passed through shared memory addresses in later work.
- Event/updater functions should usually return no values and communicate by writing shared memory.

## Anti-Patterns

- Do not make this MIDI-specific. MIDI should become one possible host integration that calls exported functions.
- Do not route main-thread events through the AudioWorklet just to call handlers there if shared-memory updater functions are enough.
- Do not introduce dynamic event objects or stringly typed payloads into the Wasm ABI.
- Do not export every function automatically; exported functions should be explicit source-level ABI.

## Implementation Plan

### Step 1: Add syntax support

- Add `#export` as a recognized compiler directive with one required argument.
- Allow `#export <exportedName>` only inside function blocks.
- Decide whether duplicate `#export` directives in one function are rejected or last-wins; prefer rejecting duplicates.

### Step 2: Carry export metadata through function compilation

- Extend compiled function metadata with an optional `exportName`.
- Collect the directive during function compilation without changing ordinary `call` behavior.
- Keep function-local stack, parameter, and return validation unchanged.

### Step 3: Emit additional Wasm exports

- Add `createFunctionExport(exportName, wasmIndex)` entries for exported user functions.
- Preserve the existing built-in exports: `init`, `cycle`, `initOnly`, and `buffer`.
- Ensure exported function indices continue to match the compiled function section ordering.

### Step 4: Add compiler tests

- Verify that `#export onMidiCC` exposes `instance.exports.onMidiCC`.
- Verify multiple positional arguments work by exporting a small function such as `add`.
- Verify float and float64 signatures still instantiate correctly.
- Verify `#export` outside a function reports a compiler error.
- Verify duplicate export names across functions are rejected.

### Step 5: Update docs

- Document `#export <exportedName>` in the function block docs.
- Add a short JS calling example.
- Note that functions with memory IO still need `#impure`.

## Validation Checkpoints

- `npx nx run compiler:test`
- `npx nx run compiler:typecheck`
- A focused WebAssembly instantiation test confirms exported user functions are callable from JS.

## Success Criteria

- [x] Users can mark a function with `#export <exportedName>`.
- [x] Generated Wasm exports the marked function under the requested name.
- [x] JS can call exported functions with multiple positional numeric arguments.
- [x] Existing module execution exports and internal function calls keep working.
- [x] Invalid export usage has targeted test coverage.

## Affected Components

- `packages/compiler/packages/tokenizer` - Recognize and validate `#export` directive shape.
- `packages/compiler/src` - Carry export metadata and emit Wasm export entries.
- `packages/compiler-spec/src/index.ts` - Add exported-function metadata fields as needed.
- `packages/compiler/docs/instructions/blocks/function.md` - Document function export syntax and ABI.
- `packages/compiler/tests` - Add integration coverage for exported functions.

## Risks & Considerations

- **Duplicate export names**: Must be rejected so the generated Wasm export section is unambiguous.
- **Runtime instance reuse**: Any future Wasm instance reuse must treat exported function layout changes as incompatible.
- **Shared-memory updates**: Exported updater functions that write memory should use `#impure`; synchronization for multi-word updates is a separate design concern.
- **Host ABI stability**: `#export <exportedName>` creates a public ABI. Renaming exports should be treated as a source-level breaking change for host integrations.

## Related Items

- **Related**: `docs/todos/305-reuse-wasm-instance-across-incremental-compiles.md`
- **Related**: `docs/todos/380-remove-hardcoded-audio-worklet-buffer-size-from-runtime-contract.md`

## Notes

- This TODO intentionally covers the compiler/export syntax first.
- A later runtime TODO can define a separate control/updater Wasm instantiation strategy that imports the same shared memory as the audio program and exposes host-callable event updater functions.
- Completed on 2026-05-10 by adding tokenizer validation, compiler metadata, Wasm export emission, docs, and compiler integration tests for `#export <exportedName>`.
