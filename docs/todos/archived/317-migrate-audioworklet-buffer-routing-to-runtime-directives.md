---
title: 'TODO: Migrate AudioWorklet buffer routing to runtime directives'
priority: Medium
effort: 1-2d
created: 2026-03-16
status: Completed
completed: 2026-03-17
---

# TODO: Migrate AudioWorklet buffer routing to runtime directives

## Problem Description

The AudioWorklet runtime still receives its buffer-routing configuration from project config through:

- `runtimeSettings.audioInputBuffers`
- `runtimeSettings.audioOutputBuffers`

That does not match the ownership model we now want:

- runtime host selection is editor-owned via `; @config runtime <id>`
- runtime-specific behavior should be authored as runtime directives
- project config is being phased out entirely

The current AudioWorklet buffer routing also repeats module context by storing `module.memory` style identifiers even when the mapping logically belongs to the module that owns the buffer.

## Proposed Solution

Move AudioWorklet buffer routing to runtime-owned directives and remove the corresponding project-config fields entirely.

Recommended directive syntax:

- `; ~audioInput <bufferName> <input> <channel>`
- `; ~audioOutput <bufferName> <output> <channel>`

These directives should be authored inside the module block that owns the buffer. The AudioWorklet runtime directive resolver can then derive the module context from the containing block, so authors only need to specify the local buffer name rather than `module.buffer`.

Example:

```txt
module audioout
; ~audioOutput buffer 0 0
; ~audioOutput buffer 0 1
float[] buffer AUDIO_BUFFER_SIZE
moduleEnd
```

## Anti-Patterns

- Do not keep AudioWorklet buffer routing in project config as a compatibility layer.
- Do not require `module.buffer` when the directive is attached to the owning module block.
- Do not hardcode AudioWorklet-specific directive parsing into the generic runtime-directives resolver.
- Do not preserve backward compatibility for the old config shape; the software has not been released yet.

## Implementation Plan

### Step 1: Add runtime-specific directive plugin support

- Extend the runtime-directives pipeline so runtimes can contribute their own directive plugins.
- Keep generic runtime-directive scanning/resolution as the engine, but let AudioWorklet own the semantics of `~audioInput` and `~audioOutput`.

### Step 2: Implement AudioWorklet routing directives

- Add AudioWorklet-owned runtime directive handlers for:
  - `~audioInput <bufferName> <input> <channel>`
  - `~audioOutput <bufferName> <output> <channel>`
- Restrict these directives to module blocks.
- Resolve the full buffer reference from:
  - containing module id
  - local buffer name argument

### Step 3: Store resolved routing in runtime-directive state

- Add a runtime-owned resolved state shape for AudioWorklet routing, for example under:
  - `state.runtimeDirectives.audioWorklet.audioInputs`
  - `state.runtimeDirectives.audioWorklet.audioOutputs`
- Keep `~sampleRate` alongside this in the runtime-directives system.

### Step 4: Remove AudioWorklet routing from project config

- Stop reading `runtimeSettings.audioInputBuffers` and `runtimeSettings.audioOutputBuffers`.
- Remove these fields from AudioWorklet runtime defaults and schema.
- Remove any project-config compilation behavior that still expects these fields.

### Step 5: Update runtime consumers

- Make the AudioWorklet runtime factory read its routing from resolved runtime directives instead of `compiledProjectConfig.runtimeSettings`.
- Update info/debug overlays if they display AudioWorklet routing.

### Step 6: Update examples and tests

- Migrate example projects away from stack-config AudioWorklet routing.
- Replace old project-config-based routing tests with directive-based coverage.

## Validation Checkpoints

- `rg -n "audioInputBuffers|audioOutputBuffers" packages/runtime-audio-worklet packages/editor packages/examples`
- `npx nx run @8f4e/editor-state:test`
- `npx nx run-many --target=typecheck --projects=@8f4e/runtime-audio-worklet,@8f4e/editor-state,@8f4e/web-ui`
- `npx nx run @8f4e/examples:build`

## Success Criteria

- [ ] AudioWorklet buffer routing is authored only through runtime directives.
- [ ] Buffer-routing directives only need local buffer names when placed in the owning module block.
- [ ] AudioWorklet runtime reads routing from runtime-directive state, not project config.
- [ ] `audioInputBuffers` and `audioOutputBuffers` are removed from project config/runtime config schemas.
- [ ] Example projects no longer use project config for AudioWorklet buffer routing.

## Affected Components

- `packages/editor/packages/editor-state/src/features/runtime-directives/`
- `packages/runtime-audio-worklet/`
- `packages/editor/packages/web-ui/src/drawers/infoOverlay.ts`
- `packages/examples/`
- project-config/runtime schema code that still includes AudioWorklet routing fields

## Risks & Considerations

- Runtime-directive resolution needs access to the containing module context for local buffer-name resolution.
- AudioWorklet-specific directives should report clear errors when used outside module blocks or when the referenced buffer does not exist.
- Since compatibility is not required, migration should remove the old config fields rather than supporting both systems in parallel.

## Related Items

- **Related**: `316-remove-runtime-packaging-concerns-from-cli.md`
- **Related**: runtime selection migration to editor config `@config runtime`

## Notes

- This migration should reinforce the long-term direction that runtimes own their own directive handling logic while project config is phased out.
