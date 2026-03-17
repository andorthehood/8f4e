---
title: 'TODO: Reuse WASM instance across incremental compiles'
priority: High
effort: 3-6h
created: 2026-03-14
status: Open
completed: null
---

# TODO: Reuse WASM instance across incremental compiles

## Problem Description

The compiler worker currently recreates the WebAssembly instance on every compile, even when memory can be reused and the runtime shape has not changed.

Current behavior:
- [packages/compiler-worker/src/compileAndUpdateMemory.ts](packages/compiler-worker/src/compileAndUpdateMemory.ts) has a reuse helper, `getOrCreateWasmInstanceRef(...)`
- the call site passes `memoryWasRecreated || true`
- that makes the non-reset path unreachable
- the worker always reinstantiates the module even when only default values or compatible source changes occurred

Why this is a problem:
- it defeats the intended incremental update flow
- it adds unnecessary instantiation work on every compile
- it increases the chance of glitches or state loss in live runtime scenarios
- it makes the surrounding change-detection logic misleading because the reuse branch is effectively dead code

## Proposed Solution

Restore real instance reuse semantics in the compiler worker.

High-level approach:
- stop unconditionally forcing `memoryWasRecreated` to `true`
- distinguish between:
  - memory recreation
  - program shape changes that require a new instance
  - default-value-only changes that can be patched into existing memory
- keep initialization behavior explicit so `init` and `initOnly` still rerun only when needed

Likely implementation shape:
- add or reuse a helper that detects whether the compiled bytecode or executable structure changed in a way that invalidates the current instance
- pass the real reset condition into `getOrCreateWasmInstanceRef(...)`
- leave `getMemoryValueChanges(...)` as the fast path for default-value-only updates

## Anti-Patterns

- Do not replace `memoryWasRecreated || true` with just `memoryWasRecreated` unless code-shape invalidation is also considered.
- Do not silently reuse an instance when exported function layout or compiled code buffer changed incompatibly.
- Do not mix memory-patching logic with instance lifecycle decisions in one large branch.

## Implementation Plan

### Step 1: Define the actual reset condition
- Audit current worker helpers in `packages/compiler-worker/src/`
- Decide which changes require a fresh `WebAssembly.instantiate(...)`
- Capture that in a dedicated helper or well-named boolean

### Step 2: Restore the reuse path
- Update `compileAndUpdateMemory(...)` to pass the real reset condition
- Keep `getOrCreateWasmInstanceRef(...)` responsible only for reusing or recreating the instance
- Ensure `hasWasmInstanceBeenReset` remains accurate

### Step 3: Verify initialization and patching behavior
- Confirm `init()` still runs when memory is recreated or first created
- Confirm incremental default changes still patch memory and optionally rerun `initOnly`
- Confirm stable compiles do not force a full instance reset

### Step 4: Add regression tests
- Add worker tests for:
  - initial compile
  - recompilation with unchanged structure
  - recompilation with memory-size change
  - recompilation with code-shape change

## Validation Checkpoints

- `rg -n "memoryWasRecreated \\|\\| true|hasWasmInstanceBeenReset|getOrCreateWasmInstanceRef" packages/compiler-worker/src`
- `npx nx run compiler-worker:test`
- `npx nx run compiler-worker:typecheck`

## Success Criteria

- [ ] The compiler worker no longer reinstantiates WebAssembly on every compile by default.
- [ ] Instance reuse happens when memory and program structure are still compatible.
- [ ] Incompatible code or memory changes still force a safe reset.
- [ ] Incremental default-value patching remains intact.
- [ ] Tests cover both reuse and reset paths.

## Affected Components

- `packages/compiler-worker/src/compileAndUpdateMemory.ts` - current forced reset path
- `packages/compiler-worker/src/getOrCreateMemory.ts` - memory recreation logic
- `packages/compiler-worker/src/didProgramOrMemoryStructureChange.ts` - existing structure checks
- `packages/compiler-worker/src/getMemoryValueChanges.ts` - incremental patch path

## Risks & Considerations

- **Incorrect reuse detection**: reusing an incompatible instance could produce stale exports or invalid runtime behavior.
- **State semantics**: some callers may now observe preserved runtime state where they previously saw resets on every compile.
- **Test coverage gap**: the current dead-code path suggests reuse behavior may not be covered adequately today.

## Related Items

- **Related**: `docs/todos/123-add-memory-reinit-reason-reporting.md`
- **Related**: `docs/todos/238-add-rerun-init-only-modules-on-default-value-change.md`
- **Related**: `docs/todos/259-add-float64-live-memory-patching-in-compiler-worker.md`

## Notes

- The current code already contains the intended abstraction for reuse; the main issue is that the call site bypasses it.
- This is a good candidate for a small, high-leverage cleanup because it removes dead behavior and makes the worker lifecycle match its own API.
