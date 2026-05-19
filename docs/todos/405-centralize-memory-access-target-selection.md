---
title: 'TODO: Centralize memory access target selection'
priority: Medium
effort: 4-8h
created: 2026-05-19
status: Open
completed: null
---

# TODO: Centralize memory access target selection

## Problem Description

Memory operation code currently decides access behavior across several separate paths: `load`, `store`, `storeBytes`, `memoryCopy`, pointer dereference, and memory guard helpers. That is manageable while the compiler only emits accesses to WebAssembly memory `0`, but logical memory-region support will need one consistent place to decide which memory index an operation targets.

Before adding regions, centralize the target-selection logic while it can still return memory index `0` for every operation.

## Proposed Solution

Introduce a small compiler-internal helper layer for resolving memory access targets from stack/address metadata.

Initial behavior should be intentionally boring:

```ts
type MemoryAccessTarget = {
	memoryIndex: 0;
};
```

Later, the multi-memory work can extend this to read `StackItem.address.memoryIndex`, pointer pointee metadata, and `memoryCopy` destination/source metadata without spreading region decisions through every instruction compiler.

## Anti-Patterns

- Do not add region support in this cleanup.
- Do not expose functions or non-serializable values through compiled output.
- Do not make each instruction compiler independently choose memory indices once this helper exists.

## Implementation Plan

### Step 1: Add Target Helper
- Add an internal helper such as `resolveMemoryAccessTarget(...)`.
- For now, return `{ memoryIndex: 0 }` for all memory operations.
- Keep the helper close to memory guard/codegen utilities so it is easy to reuse.

### Step 2: Migrate Load And Store
- Update `load`, load variants, `loadFloat`, `store`, and `storeBytes` to call the helper before emitting memory bytecode or guard bytecode.
- Preserve existing emitted bytecode for memory `0`.

### Step 3: Migrate Memory Copy And Pointer Dereference
- Update `memoryCopy` to resolve separate destination/source targets, both currently memory `0`.
- Update automatic pointer dereference helpers to resolve pointer-slot and pointee targets, both currently memory `0`.

### Step 4: Migrate Guards
- Thread resolved target metadata into guarded load/store/copy helpers even though the initial target is always memory `0`.
- Keep guard output byte-for-byte compatible where possible.

### Step 5: Add Tests
- Add focused tests that prove the helpers are called for memory operations where practical.
- Keep existing behavior snapshots stable unless unavoidable due to harmless refactoring.

## Validation Checkpoints

- `npx nx run compiler:test`
- `npx nx run compiler:typecheck`
- `rg -n "memoryIndex|resolveMemoryAccessTarget" packages/compiler/src/instructionCompilers`

## Success Criteria

- [ ] Memory operation compilers use a shared target-selection helper.
- [ ] Guard helpers receive target metadata instead of assuming an implicit hardcoded target internally.
- [ ] Pointer dereference code has clear pointer-slot vs pointee target call sites.
- [ ] Behavior remains single-memory and source-compatible.
- [ ] Compiler tests and typecheck pass.

## Affected Components

- `packages/compiler/src/instructionCompilers/load.ts` - memory access target resolution.
- `packages/compiler/src/instructionCompilers/loadFloat.ts` - memory access target resolution.
- `packages/compiler/src/instructionCompilers/store.ts` - memory access target resolution.
- `packages/compiler/src/instructionCompilers/storeBytes.ts` - memory access target resolution.
- `packages/compiler/src/instructionCompilers/memoryCopy.ts` - destination/source target resolution.
- `packages/compiler/src/instructionCompilers/push` - automatic pointer dereference target resolution.
- `packages/compiler/src/instructionCompilers/utils/memoryAccessGuard.ts` - guard target plumbing.

## Risks & Considerations

- **Scope control**: This is a pre-cleanup. Keep memory index `0` as the only behavior until logical regions are implemented.
- **Serializable output**: Do not add exported helper functions or runtime closures to compile results.
- **Follow-up dependency**: Multi-memory should extend this helper instead of adding direct memory-index decisions inside individual instruction compilers.

## Related Items

- **Blocks**: `403-add-logical-memory-regions-for-multi-memory.md`
- **Depends on**: `404-refactor-address-metadata-into-first-class-shape.md`

