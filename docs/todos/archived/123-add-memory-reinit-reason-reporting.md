---
title: 'TODO: Add Memory Reinit Reason Reporting'
priority: Medium
effort: 2-4 hours
created: 2025-12-14
status: Completed
completed: 2025-12-15
---

# TODO: Add Memory Reinit Reason Reporting

## Problem Description

`packages/compiler-worker/src/compileAndUpdateMemory.ts` currently decides whether to reuse or recreate `WebAssembly.Memory`, but it does not return a structured explanation for that decision. This makes it hard to debug “why did memory get recreated?” in the editor/runtime, and it blocks adding higher-level “reused vs recreated” reporting without immediately changing policy.

## Proposed Solution

Add a `MemoryReinitReason` type and have `compileAndUpdateMemory` return whether memory was reused or recreated, including a reason when recreated.

This change must be observational only:

- Do not change the current logic/policy that determines whether memory is reused/recreated.
- Do not change the existing heuristics in `didProgramOrMemoryStructureChange`.
- Do not change current reset/reinit behavior for the WASM instance.

Reference: `docs/brainstorming_notes/017-compile-and-update-memory-reinit-reasons.md`.

## Implementation Plan

### Step 1: Define the reason/result types

- Add `MemoryReinitReason` (and any minimal result wrapper) in the compiler-worker surface area where `compileAndUpdateMemory` is defined/exported.
- Keep the set of reasons aligned with what the current logic can already observe:
  - `no-instance`
  - `memory-size-changed`
  - `memory-structure-changed`

### Step 2: Plumb reasons from existing decisions

- Infer the reason from existing inputs/branches rather than adding new checks:
  - If there is no existing memory: `no-instance`
  - If the requested memory size differs from the existing memory: `memory-size-changed`
  - Else if `memoryStructureChange` is true: `memory-structure-changed`
  - Else: reused (no reason)

### Step 3: Add minimal unit tests

- Add tests that validate the reason mapping without asserting on any new behavior.
- Tests should focus on the returned result shape and the reason kind selection for each branch.

## Success Criteria

- [ ] `compileAndUpdateMemory` reports `memory.action` as `reused` or `recreated`.
- [ ] When `memory.action === 'recreated'`, the `MemoryReinitReason.kind` is populated based on the current decision path.
- [ ] No change in behavior: the same scenarios still reuse/recreate memory exactly as before.

## Affected Components

- `packages/compiler-worker/src/compileAndUpdateMemory.ts`
- `packages/compiler-worker/src/getOrCreateMemory.ts` (only to capture reason, not to change logic)
- `packages/compiler-worker/src/didProgramOrMemoryStructureChange.ts` (no behavioral changes; reference only)

## Risks & Considerations

- Adding return data may require updating call sites; avoid accidental behavioral changes.
- Keep the reasons strictly derived from current signals to avoid “papering over” policy issues that will be handled later.

## Related Items

- Related: `docs/brainstorming_notes/017-compile-and-update-memory-reinit-reasons.md`
- Related: `docs/todos/053-fix-runtime-reinitialization-on-code-change.md`
