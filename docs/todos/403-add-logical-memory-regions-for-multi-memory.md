---
title: 'TODO: Add logical memory regions for multi-memory'
priority: Medium
effort: 3-5d
created: 2026-05-19
issue: https://github.com/andorthehood/8f4e/issues/657
status: Open
completed: null
---

# TODO: Add logical memory regions for multi-memory

## Problem Description

8f4e currently lays all module declarations into one WebAssembly linear memory. WebAssembly multi-memory can support multiple linear memories, but 8f4e has no language-level way to assign declarations to a logical memory region or preserve region provenance through address references and pointer dereferences.

The desired source model is that a module can declare a memory region in its prologue. Declarations in that module are allocated in that region, defaulting to memory `0` when no region is specified.

Example target shape:

```8f4e
module foo
#region sampleMemory
int8[] samples 1024
moduleEnd

module bar
int8* ptr &foo:samples
push *ptr
moduleEnd
```

In this example, the pointer slot `ptr` belongs to `bar`'s own region, but its pointee region follows `&foo:samples`, so `push *ptr` loads the pointed-to byte from `sampleMemory`.

## Proposed Solution

Introduce logical memory regions as compiler metadata first, then lower them to WebAssembly memory indices through compiler options.

- Add a compile option such as `memoryRegions: ['sampleMemory', 'displayMemory']`.
- Treat Wasm memory index `0` as the implicit default region; it is not listed in compiler options.
- Resolve custom region indices from array position plus one: `sampleMemory -> 1`, `displayMemory -> 2`.
- Add a module prologue directive such as `#region <regionNameOrIndex>`.
- Support named references such as `#region sampleMemory` and numeric references such as `#region 1`.
- Default modules to implicit Wasm memory index `0` when no `#region` is specified.
- Store `memoryRegion` and resolved `memoryIndex` on declarations.
- Preserve region provenance on address stack metadata and pointer metadata.
- Make `load`, `store`, `memoryCopy`, automatic pointer dereference, guards, data initialization, and memory import/export codegen use the resolved memory index.
- Preserve region provenance through pointer arithmetic when the result is still an address.
- Treat raw addresses with no region provenance as implicit memory index `0`.

## Anti-Patterns

- Do not make `load` use the current module's region. It must use the region carried by the address or pointer provenance.
- Do not silently fall back to memory `0` for tracked addresses from another region.
- Do not introduce fat pointers as the first implementation unless static-region pointers prove insufficient.
- Do not prefer raw numeric region indices in examples when a stable logical region name can carry the intent.
- Do not include a custom `default` label in `memoryRegions`; memory index `0` is implicit.
- Do not add load/store/memoryCopy region override syntax in the first implementation; the address or pointer metadata should carry the region.
- Do not add a multi-memory feature flag for compatibility. Emit multi-memory when the program uses non-default regions.

## Implementation Plan

### Step 1: Land Directive Prologue Rules
- Complete `402-restrict-compiler-directives-to-block-prologue.md`.
- This makes `#region` non-retroactive and keeps region assignment readable.

### Step 1.5: Land First-Class Address Metadata
- Complete `404-refactor-address-metadata-into-first-class-shape.md`.
- Multi-memory region tracking should extend `AddressMetadata` instead of adding more loose address fields.

### Step 2: Add Region Directive Syntax
- Add `#region <identifier|non-negative-integer>` as a module compiler directive.
- Keep tokenizer/parser responsibility limited to argument shape: identifier or non-negative integer literal.
- Validate that it appears only in the module prologue.
- Resolve identifiers by name against the configured custom `memoryRegions` array.
- Resolve integer literals as direct Wasm memory indices, where `0` is the implicit default and `1..N` map to configured custom regions.
- Record the current module's logical region name and resolved memory index in compilation context and compiled module metadata.

### Step 3: Add Region Configuration
- Extend compiler options with an ordered `memoryRegions` array of custom region names.
- Default omitted options to `[]`, meaning only implicit memory index `0` exists.
- Reject `default` as a custom region name unless there is a deliberate later decision to reserve/alias it.
- Reject `memory` as a custom region name because the default memory import keeps using that label.
- Reject numeric-looking custom names so `#region 1` is always unambiguously an index.
- Validate that region names are unique.
- Validate that numeric `#region` references are in bounds.
- Prefer named region references in docs while allowing numeric references as a low-level escape hatch.

### Step 4: Add Region Metadata
- Extend `DataStructure` with `memoryIndex` and optional `memoryRegionName`.
- Extend pointer metadata with `pointeeMemoryIndex` and optional `pointeeMemoryRegionName`.
- Introduce a first-class internal `AddressMetadata` shape that carries `memoryIndex`, optional `memoryRegionName`, safe range, clamp range, and safe access width together.
- Replace the current loose stack address fields (`safeAddressRange`, `clampAddressRange`, `safeMemoryAccessByteWidth`) with `StackItem.address?: AddressMetadata`.
- Allow address-producing constants/literals from semantic normalization to carry the same `AddressMetadata` shape.
- Keep pointer declaration storage and pointee regions separate: `memoryIndex`/`memoryRegionName` describe where the pointer slot lives; `pointeeMemoryIndex`/`pointeeMemoryRegionName` describe where `*ptr` dereferences.
- Extend `MemoryAddressRange`, stack address metadata, constants produced from address references, and pointer metadata with region information as part of that API cleanup.
- Ensure intermodule references such as `&foo:samples` carry `foo.samples`'s region.
- Resolve declaration regions during semantic namespace/layout prepass, not during codegen.
- Propagate region metadata through semantic normalization for address-producing forms such as `&name` and `&module:item`.
- Preserve address region metadata through pointer arithmetic where the result remains an address, such as `address + int`, `int + address`, and `address - int`.
- Drop address region metadata when arithmetic no longer produces an address, such as `address - address`; reject or drop metadata for ambiguous forms such as `address + address`.

### Step 5: Split Layout By Region
- Replace the single global memory allocator with per-region allocation state.
- Keep byte addresses relative to their own region/memory.
- Compute required memory size per region.

### Step 6: Update Codegen
- Extend wasm-utils load/store memarg builders to encode non-zero memory indices.
- Update `load`, `load8s`, `load8u`, `load16s`, `load16u`, `loadFloat`, `store`, `storeBytes`, `memoryCopy`, `memoryFill`, `memoryInit`, bounds guards, and automatic pointer dereference to pass the correct memory index.
- Add the shared memory access target-selection helper as part of this step, after region metadata exists, so it can resolve targets from `AddressMetadata`, pointer pointee metadata, and `memoryCopy` destination/source metadata.
- Use operation precedence: tracked address/pointer provenance first, implicit memory `0` for raw addresses last.
- Treat codegen as a consumer of resolved region metadata; it should not rediscover or reinterpret module/declaration regions.
- Update guard helpers so `memory.size`, last-valid-address calculation, range checks, guarded loads, guarded stores, and guarded memory copies use the same memory index as the operation.
- Emit true multi-memory bytecode whenever non-default regions are used.

### Step 7: Update Runtime Contract
- Import or define one WebAssembly memory per resolved memory index.
- Import index `0` as the existing default memory and use custom region names from `memoryRegions` as import/export/runtime labels for indices `1..N`.
- Keep the existing `requiredMemoryBytes` for implicit default memory index `0`.
- Add a separate required-memory report for custom memory regions, for example `requiredMemoryBytesByRegion`.
- Keep editor memory views out of scope for this implementation.

### Step 8: Add Tests And Docs
- Add compiler tests for declaration placement, intermodule address references, pointer defaults, pointer dereference, and cross-region `memoryCopy`.
- Add tests for `#region sampleMemory`, `#region 1`, `#region 0`, unknown region names, out-of-bounds numeric regions, duplicate configured names, invalid custom `default` labels, invalid custom `memory` labels, and numeric-looking custom labels.
- Add tests for provenance-preserving pointer arithmetic and raw-address fallback to memory `0`.
- Add tests for cross-region `memoryCopy` inference and guard code using the destination/source memory indices.
- Add runtime-facing tests for multiple memory imports and data segment initialization.
- Update language docs with custom-region array configuration, named/numeric directive examples, raw-address fallback, pointer arithmetic, and pointer-provenance rules.

## Validation Checkpoints

- `npx nx run compiler:test`
- `npx nx run compiler:typecheck`
- `npx nx run-many --target=test --all`
- Manual WebAssembly validation for emitted modules that import more than one memory.

## Success Criteria

- [ ] Declarations in a `#region` module allocate into that logical region.
- [ ] `#region sampleMemory` resolves through the configured custom `memoryRegions` array.
- [ ] `#region 1` resolves to the region at index `1`.
- [ ] `#region 0` and omitted `#region` both target the implicit default memory.
- [ ] Unknown region names and out-of-bounds numeric region indices produce diagnostics.
- [ ] Modules without `#region` allocate into the default region / memory `0`.
- [ ] `push &module:item` carries the target item's region.
- [ ] `push *ptr` loads from the pointee region, not the pointer slot's storage region.
- [ ] Address-style pointer arithmetic preserves region metadata when the result remains an address.
- [ ] `load`, `store`, `storeBytes`, and `memoryCopy` use address provenance when available.
- [ ] Raw-address `load`, `store`, `storeBytes`, and `memoryCopy` sides without provenance use implicit memory `0`.
- [ ] Bounds guards use `memory.size` for the same memory index as the guarded operation.
- [ ] `requiredMemoryBytes` remains default-memory-only and custom regions are reported separately.
- [ ] Multi-memory codegen emits correct memory indices for non-default regions.
- [ ] Existing single-memory projects keep compiling unchanged.

## Affected Components

- `packages/compiler/packages/tokenizer/src` - directive argument validation for `#region`.
- `packages/compiler-spec/src` - memory, stack, compiled output, and error metadata.
- `packages/compiler/src/semantic` - region-aware namespace collection and layout.
- `packages/compiler/src/instructionCompilers` - region-aware memory operations and pointer dereference.
- `packages/compiler/packages/wasm-utils/src` - multi-memory memarg encoding and memory import helpers.
- `packages/compiler-worker/src` - memory creation/reuse by region.
- `src/compiler-callback.ts` and runtime packages - multiple memory buffers and memory views.
- `packages/compiler/docs` - language documentation.

## Risks & Considerations

- **Source stability**: Numeric region references depend on array order; docs should prefer names for ordinary code.
- **Default region**: Memory index `0` is implicit and should not need configuration.
- **Pointer semantics**: Static-region pointers are the recommended first version; dynamic fat pointers would be a larger language/runtime change.
- **Address ambiguity**: Raw integer addresses without provenance intentionally target implicit memory `0`.
- **Guard correctness**: Runtime bounds guards must use the target memory index for both `memory.size` and the guarded memory instruction.
- **Memory initialization**: Passive data segments and `init()` must target the correct memory index.
- **Editor UX**: Editor memory views are out of scope for this implementation and can follow separately.

## Related Items

- **Depends on**: `402-restrict-compiler-directives-to-block-prologue.md`
- **Depends on**: `404-refactor-address-metadata-into-first-class-shape.md`
- **Related**: `docs/brainstorming_notes/041-logical-memory-regions-for-multi-memory-runtimes.md`
- **Related**: `390-add-compiler-passive-data-inputs.md`
- **Related**: `305-reuse-wasm-instance-across-incremental-compiles.md`
