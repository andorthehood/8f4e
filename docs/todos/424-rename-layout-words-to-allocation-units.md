---
title: 'TODO: Rename layout word fields to allocation-unit terminology'
priority: Medium
effort: 4-8h
created: 2026-05-26
issue: null
status: Open
completed: null
---

# TODO: Rename layout word fields to allocation-unit terminology

## Problem Description

The compiler uses a 4-byte allocation grid for memory layout, currently exposed as `GLOBAL_ALIGNMENT_BOUNDARY`. Several layout fields are named with "word", but those fields do not mean the same thing as `BASE_TYPE_METADATA.wordSize`.

`BASE_TYPE_METADATA.wordSize` is defensible as "the size of one typed word". For example, `float64.wordSize === 8` reads as "one float64 word is 8 bytes".

The confusing names are the layout fields that count or index into the compiler's 4-byte allocation grid:

- `wordAlignedAddress`
- `wordAlignedSize`
- `currentModuleNextWordOffset`
- `currentModuleWordAlignedSize`

For example, `wordAlignedSize` is not the byte size of a word and is not the storage size of a typed value. It is the number of 4-byte allocation units reserved after rounding and alignment. For an `int8[]` with four elements, it is `1`; for a scalar `float64`, it is usually `2`.

The overall goal is to use strict, descriptive interfaces where applicable instead of forcing readers and agents to infer units from runtime calculations.

## Proposed Solution

Rename the compiler's 4-byte layout grid to "allocation unit" terminology.

Suggested names:

- `GLOBAL_ALIGNMENT_BOUNDARY` -> `ALLOCATION_UNIT_BYTE_SIZE`
- `wordAlignedAddress` -> `allocationUnitAddress`
- `wordAlignedSize` -> `allocationUnitCount`
- `currentModuleNextWordOffset` -> `currentModuleNextAllocationUnitOffset`
- `currentModuleWordAlignedSize` -> `currentModuleAllocationUnitCount`

Keep `BASE_TYPE_METADATA.wordSize` unless there is a separate explicit decision to rename type word-size metadata. This todo is about separating typed word size from compiler allocation-unit layout.

Because the project is not released yet, update callers directly and do not keep compatibility aliases, duplicate fields, or migration shims.

## Anti-Patterns

- Do not keep old and new field names side by side.
- Do not add getters, aliases, re-exports, or wrapper types to preserve the old names.
- Do not rename `BASE_TYPE_METADATA.wordSize` as part of this task unless the team explicitly changes that decision.
- Do not use a name ending in `Size` for a value that is actually a count.
- Do not replace spec-derived size calculations with local hardcoded branches such as `type === 'float64' ? 8 : 4`.

## Implementation Plan

### Step 1: Rename the allocation-unit constant

- Rename `GLOBAL_ALIGNMENT_BOUNDARY` to `ALLOCATION_UNIT_BYTE_SIZE` in `packages/compiler-spec/src/constants.ts`.
- Update all imports and calculations that divide or multiply by the 4-byte allocation unit.
- Keep the numeric value unchanged.

### Step 2: Rename layout fields

- Rename `wordAlignedAddress` to `allocationUnitAddress`.
- Rename `wordAlignedSize` to `allocationUnitCount`.
- Update `DataStructure`, `InternalResource`, `MemoryValueChange`, compiled module metadata, and semantic context types.
- Update compiler consumers, tests, and snapshots directly.

### Step 3: Rename layout context counters

- Rename `currentModuleNextWordOffset` to `currentModuleNextAllocationUnitOffset`.
- Rename `currentModuleWordAlignedSize` to `currentModuleAllocationUnitCount`.
- Review helpers in `packages/compiler/src/semantic/layoutAddresses.ts` and rename function parameters where they use the old word-offset vocabulary.

### Step 4: Keep type word-size metadata separate

- Keep `BASE_TYPE_METADATA.wordSize` reads for typed storage size.
- Ensure allocation-unit counts are derived from type word sizes and `ALLOCATION_UNIT_BYTE_SIZE`, not from local type branches.

## Validation Checkpoints

- `rg -n "GLOBAL_ALIGNMENT_BOUNDARY|wordAlignedAddress|wordAlignedSize|currentModuleNextWordOffset|currentModuleWordAlignedSize" packages/compiler-spec/src packages/compiler/src packages/compiler/packages/tokenizer/src -g '*.ts'`
- `npx nx run @8f4e/compiler-spec:typecheck`
- `npx nx run compiler:typecheck`
- `npx nx run compiler:test`

## Success Criteria

- [ ] The 4-byte layout constant is named `ALLOCATION_UNIT_BYTE_SIZE`.
- [ ] Layout addresses/counts use allocation-unit terminology.
- [ ] Type storage metadata such as `BASE_TYPE_METADATA.wordSize` remains distinct from allocation-unit layout metadata.
- [ ] No compatibility aliases, duplicate fields, wrappers, or migration shims are introduced.
- [ ] Relevant typechecks and compiler tests pass.

## Affected Components

- `packages/compiler-spec/src/constants.ts` - allocation unit byte-size constant.
- `packages/compiler-spec/src/memory.ts` - memory and internal-resource layout metadata.
- `packages/compiler-spec/src/semantic.ts` - compilation context layout counters.
- `packages/compiler-spec/src/compiled.ts` - compiled module layout metadata.
- `packages/compiler/src/semantic/` - declaration layout and namespace construction.
- `packages/compiler/src/initialMemoryDataSegments/` - segment sizing from allocation-unit counts.
- `packages/compiler/src/**/__tests__` and `packages/compiler/tests/**` - tests that construct or assert layout metadata.

## Risks & Considerations

- **Broad rename**: These fields are widely used, so this will touch many tests and snapshots.
- **No compatibility preservation**: This project is not released yet. Delete old names instead of keeping aliases.
- **Terminology boundary**: This todo should not blur typed word size and allocation-unit layout again. `wordSize` can remain type metadata; `allocationUnit*` should describe layout-grid values.

## Related Items

- **Related**: `docs/todos/423-narrow-ast-line-metadata-interfaces.md`
- **Related**: `docs/todos/392-move-shared-compiler-constants-to-compiler-spec.md`

## Notes

- This todo came from reviewing internal resource allocation after removing local one-line helper wrappers. The cleanup exposed two separate concepts that need distinct names: type word size and compiler allocation-unit layout.
