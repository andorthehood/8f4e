---
title: 'TODO: Refactor address metadata into first-class shape'
priority: Medium
effort: 1-2d
created: 2026-05-19
status: Completed
completed: 2026-05-19
---

# TODO: Refactor address metadata into first-class shape

## Problem Description

The compiler already tracks when some integer stack values are memory addresses, but that concept is spread across separate optional fields such as `safeAddressRange`, `clampAddressRange`, and `safeMemoryAccessByteWidth`. That makes memory-access logic harder to reason about and will make logical memory-region support more invasive.

Before adding multi-memory regions, address-ness should become a first-class internal metadata shape.

## Proposed Solution

Introduce an `AddressMetadata` type and move address-specific stack metadata under `StackItem.address`.

Target internal shape:

```ts
interface AddressMetadata {
	safeRange?: MemoryAddressRange;
	clampRange?: MemoryAddressRange;
	safeAccessByteWidth?: number;
}

interface StackItem {
	isInteger: boolean;
	isFloat64?: boolean;
	address?: AddressMetadata;
	pointeeBaseType?: DataStructure['pointeeBaseType'];
	isPointingToPointer?: boolean;
	isNonZero?: boolean;
	knownIntegerValue?: number;
}
```

This refactor should preserve current behavior and keep all memory implicitly in the existing single default WebAssembly memory. Region fields such as `memoryIndex` and `memoryRegionName` should be added later by the multi-memory TODO.

## Anti-Patterns

- Do not add multi-memory behavior in this refactor.
- Do not change the source language or emitted WebAssembly behavior.
- Do not keep writing new code against the old loose stack fields once `StackItem.address` exists.

## Implementation Plan

### Step 1: Add AddressMetadata
- Add `AddressMetadata` to compiler-spec.
- Add `StackItem.address?: AddressMetadata`.
- Keep old fields temporarily only if needed for incremental migration.

### Step 2: Migrate Address Producers
- Update semantic normalization for address-producing forms such as `&name`, `name&`, `&module:item`, and related compile-time address references.
- Ensure normalized address constants/literals carry `AddressMetadata`.
- Update `push` handlers that place address values on the stack.

### Step 3: Migrate Address Consumers
- Update `load`, `store`, `storeBytes`, `memoryCopy`, `clampAddress`, `clampModuleAddress`, `clampGlobalAddress`, and guard helpers to read `StackItem.address`.
- Preserve existing guarded/non-guarded behavior.

### Step 4: Migrate Address Arithmetic
- Update arithmetic/stack metadata propagation so address-safe ranges and clamp ranges continue to behave as they do today.
- Keep this refactor behavior-preserving; richer region-preserving arithmetic rules belong to the multi-memory TODO.

### Step 5: Remove Old Fields
- Remove direct `safeAddressRange`, `clampAddressRange`, and `safeMemoryAccessByteWidth` fields from `StackItem` and related normalized literal shapes once all call sites are migrated.
- Update tests and snapshots as needed.

## Validation Checkpoints

- `rg -n "safeAddressRange|clampAddressRange|safeMemoryAccessByteWidth" packages/compiler packages/compiler-spec`
- `npx nx run compiler:test`
- `npx nx run compiler:typecheck`

## Success Criteria

- [x] Address metadata is represented by `StackItem.address`.
- [x] Existing memory safety guard behavior is unchanged.
- [x] Address-producing normalized constants/literals carry the new metadata shape.
- [x] Old loose address fields are removed or limited to compatibility shims scheduled for deletion.
- [x] Compiler tests and typecheck pass.

## Affected Components

- `packages/compiler-spec/src/semantic.ts` - `AddressMetadata`, `StackItem`, and normalized literal metadata.
- `packages/compiler/src/semantic` - address-producing normalization.
- `packages/compiler/src/instructionCompilers` - address consumers, arithmetic propagation, guard helpers.
- `packages/compiler/src/stackAnalysis` - any stack metadata assumptions.
- `packages/compiler/src/utils/memoryData.ts` - helper types if needed.

## Risks & Considerations

- **Behavior preservation**: This should be a pure internal refactor, so tests should focus on proving existing guard/clamp behavior remains unchanged.
- **Migration size**: Address metadata is used across several compiler paths; keep the change mechanical and avoid mixing in region semantics.
- **Follow-up dependency**: Logical memory regions should build on this shape rather than reintroducing scattered fields.

## Related Items

- **Blocks**: `403-add-logical-memory-regions-for-multi-memory.md`
- **Related**: `397-finish-compiler-stack-analysis-codegen-separation.md`
