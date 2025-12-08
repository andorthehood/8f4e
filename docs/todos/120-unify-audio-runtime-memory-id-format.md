---
title: 'TODO: Unify Audio Runtime Memory ID Format'
priority: Medium
effort: 4-6 hours
created: 2025-12-07
status: Open
completed: null
---

# TODO: Unify Audio Runtime Memory ID Format

## Problem Description

Currently, audio input/output buffers in the AudioWorklet runtime are configured with two separate fields, `moduleId` and `memoryId`. Examples like `src/examples/projects/audioLoopback.ts` and `src/examples/projects/audioBuffer.ts` use the config DSL to set these fields independently under `runtimeSettings[*].audioInputBuffers` and `runtimeSettings[*].audioOutputBuffers`. The runtime factory in `src/runtime-audio-worklet-factory.ts` then combines them to look up `state.compiler.compiledModules[moduleId]?.memoryMap[memoryId]`.

This split makes configuration more verbose and increases the chance of mismatches between module and memory identifiers. Elsewhere in the editor (e.g. `resolveMemoryIdentifier`), memory is already referenced using a unified `module.memory` syntax, so the audio runtime is inconsistent with the rest of the system.

## Proposed Solution

Adopt a single `memoryId` string for audio buffers that can encode both the module and memory identifier in the form `"<moduleId>.<memoryName>"`, e.g. `"audiooutL.buffer"`. This should align with the semantics already used by `resolveMemoryIdentifier` in `packages/editor/packages/editor-state/src/pureHelpers/resolveMemoryIdentifier.ts`.

Key points:
- Canonical format: `memoryId: 'module.memory'` for audio input and output buffers.
- Allow a "local" form: `memoryId: 'buffer'` combined with an optional `moduleId` for backward compatibility.
- Treat `moduleId` on audio buffers as deprecated but supported during a transition period.
- Use a small resolver helper (mirroring `resolveMemoryIdentifier` semantics) inside the audio runtime to derive `{ moduleId, memoryName }` from the unified `memoryId`.

## Implementation Plan

### Step 1: Update AudioWorkletRuntime Types
- In `packages/editor/packages/editor-state/src/types.ts`, update `AudioWorkletRuntime.audioInputBuffers` and `audioOutputBuffers` types to:
  - Require a single `memoryId: string` that may contain `module.memory`.
  - Make `moduleId?: string` optional and document it as deprecated.
- Add short documentation in the type definition explaining the unified format and transition plan.

### Step 2: Implement Resolver in Audio Runtime
- In `src/runtime-audio-worklet-factory.ts`, introduce a helper that:
  - Parses `memoryId` of the form `module.memory` and returns `{ moduleId, memoryName }`.
  - Falls back to using `moduleId` plus a simple `memoryId` when no `.` is present.
- Use this helper to compute the `audioBufferWordAddress` for both `audioInputBuffers` and `audioOutputBuffers`.
- Ensure behavior is consistent with `resolveMemoryIdentifier` (no support for operators like `&` or `*` in this first step unless needed).

### Step 3: Align UI/Debug Overlay
- In `packages/editor/packages/web-ui/src/drawers/infoOverlay.ts`, update the audio buffer rendering logic to:
  - Use the same resolver helper (or duplicated parsing logic) to derive module and memory names.
  - Display a unified representation (e.g. `Module: audiooutL Buffer: buffer` or `audiooutL.buffer`) based on the resolved parts.

### Step 4: Update Examples and Config Tests
- In `src/examples/projects/audioLoopback.ts` and `src/examples/projects/audioBuffer.ts`:
  - Replace separate `moduleId` and `memoryId` config scopes with a single `memoryId` scope using the combined format (e.g. `audiooutL.buffer`).
- In `packages/editor/packages/editor-state/src/pureHelpers/config/deepMergeConfig.ts` tests:
  - Update the sample `runtimeSettings` objects under `audioInputBuffers` and `audioOutputBuffers` to use only the unified `memoryId` field (optionally leaving `moduleId` to exercise legacy behavior if desired).

### Step 5: Deprecation and Cleanup
- Keep `moduleId` support and the resolver’s backward-compatible path for one release cycle.
- Document the deprecation in any relevant docs (`docs/usage.md` or a dedicated runtime config section).
- After migration:
  - Remove `moduleId` from `AudioWorkletRuntime` types.
  - Simplify the resolver helper to accept only unified `memoryId` strings.
  - Clean up any references that still assume separate `moduleId` and `memoryId` fields.

## Success Criteria

- [ ] AudioWorklet runtime correctly resolves buffers using `memoryId: 'module.memory'`.
- [ ] Existing projects that still use `moduleId` + `memoryId` continue to work during the transition.
- [ ] Examples in `src/examples/projects/` use the unified format exclusively.
- [ ] `deepMergeConfig` tests remain green with the updated sample config.
- [ ] Info overlay displays audio buffer targets using the unified format.

## Affected Components

- `packages/editor/packages/editor-state/src/types.ts` – update `AudioWorkletRuntime` types and docs.
- `src/runtime-audio-worklet-factory.ts` – add resolver and switch to unified `memoryId` handling.
- `packages/editor/packages/web-ui/src/drawers/infoOverlay.ts` – adjust debug rendering to the new format.
- `src/examples/projects/audioLoopback.ts` – update example config to use unified `memoryId`.
- `src/examples/projects/audioBuffer.ts` – update example config to use unified `memoryId`.
- `packages/editor/packages/editor-state/src/pureHelpers/config/deepMergeConfig.ts` – update tests that reference audio buffer runtime config.

## Risks & Considerations

- **Risk 1**: Breaking existing saved projects that rely on separate `moduleId` and `memoryId`.
  - Mitigation: Maintain backward-compatible resolver behavior and optional `moduleId` until a documented deprecation period ends.
- **Risk 2**: Inconsistent parsing semantics between the audio runtime and `resolveMemoryIdentifier`.
  - Mitigation: Mirror the `module.memory` parsing behavior closely and add tests.
- **Dependencies**: None hard, but ideally coordinate with any other runtime config changes to avoid churn.
- **Breaking Changes**: Final removal of `moduleId` from `AudioWorkletRuntime` and configs will be breaking; plan for a major/minor version bump when that happens.

## Related Items

- **Related**: `packages/editor/packages/editor-state/src/pureHelpers/resolveMemoryIdentifier.ts` – existing `module.memory` semantics.
- **Related**: `docs/todos/config-compilation-errors.md` – other config/runtime consistency work.

## References

- `src/runtime-audio-worklet-factory.ts`
- `src/examples/projects/audioLoopback.ts`
- `src/examples/projects/audioBuffer.ts`
- `packages/editor/packages/editor-state/src/types.ts`
- `packages/editor/packages/editor-state/src/pureHelpers/resolveMemoryIdentifier.ts`
- `packages/editor/packages/web-ui/src/drawers/infoOverlay.ts`
- `packages/editor/packages/editor-state/src/pureHelpers/config/deepMergeConfig.ts`

## Notes

- This TODO formalizes the existing design discussion about unifying `moduleId` and `memoryId` into a single field for audio runtime configuration.

