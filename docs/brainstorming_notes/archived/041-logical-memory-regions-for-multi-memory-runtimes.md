# Logical Memory Regions for Multi-Memory Runtimes

Date: 2026-05-04

This note captures a possible direction for using WebAssembly multi-memory in 8f4e without exposing hardware-specific memory details directly in the language.

## Short version

Some runtimes, especially microcontroller runtimes, may have physically different memory areas:

- small fast memory integrated closely with the CPU
- larger slower external memory
- memory intended for DMA, display, audio, or device buffers

WebAssembly multi-memory could let an 8f4e program use more than one linear memory. The compiler could assign modules or declarations to different logical memory regions, and the runtime could map those regions to physical memory.

The important boundary is:

- 8f4e source should talk about logical regions such as `fast`, `bulk`, `display`, or `audio`
- the runtime profile should decide what those regions mean on a target
- the compiler should translate logical regions to Wasm memory indices

## Why this is interesting

The current compiler effectively has one global linear memory arena. Every module and declaration is laid out inside that one arena.

That is simple and works well for the browser, but it cannot express target-specific memory placement. On a microcontroller, placement can matter a lot:

- control variables and hot signal state may belong in fast CPU-local memory
- large sample buffers may belong in slower bulk memory
- framebuffers may need to live in display-accessible memory
- DMA buffers may require special alignment or region placement

If 8f4e eventually targets these environments, memory placement should become part of the runtime contract.

## Possible source-level shape

Module-level placement:

```8f4e
#memoryRegion fast
module oscillator
float phase
float frequency
moduleEnd
```

Declaration-level placement:

```8f4e
module buffers
float[] samples 4096 @region(bulk)
float[] scratch 256 @region(fast)
moduleEnd
```

Runtime-oriented names:

```8f4e
float[] framebuffer 76800 @region(display)
int16[] audioRing 1024 @region(audio)
```

The exact syntax is not important yet. The main idea is that users choose a logical region, not a raw Wasm memory index.

## Runtime profile owns the mapping

A runtime profile could define regions like:

```text
default -> wasm memory 0
fast    -> wasm memory 0
bulk    -> wasm memory 1
display -> wasm memory 2
audio   -> wasm memory 3
```

On a browser runtime, the profile could initially collapse all regions into one memory:

```text
default -> wasm memory 0
fast    -> wasm memory 0
bulk    -> wasm memory 0
display -> wasm memory 0
audio   -> wasm memory 0
```

On a microcontroller runtime, the same logical names could map to physically distinct memory:

```text
fast    -> CPU-local SRAM / TCM
bulk    -> external RAM / PSRAM
display -> framebuffer-capable RAM
audio   -> DMA-capable audio buffer memory
```

This keeps 8f4e source portable while still letting target runtimes use hardware-specific placement.

## Compiler responsibilities

The compiler would need to:

- accept a runtime memory-region profile
- validate that referenced regions exist
- allocate each module or declaration into the correct logical region
- maintain a separate address allocator per region
- emit memory instructions with the correct Wasm memory index
- emit data segments and initialization code against the right memory index
- preserve region metadata in compiled output for tooling and runtimes

The current memory map would probably need to grow a `memoryRegion` or `memoryIndex` field so downstream systems can distinguish `address 0 in fast` from `address 0 in bulk`.

## Pointer implications

Pointers are the hardest part.

With one memory, a pointer can be just an integer address. With multiple memories, an address alone is ambiguous because each memory has its own address space.

There are two broad options:

### Static-region pointers

The compiler tracks which region a pointer targets. The runtime value remains an address, but the type/metadata says which memory to use.

Example idea:

```8f4e
int* @region(fast) fastPointer
```

Pros:

- keeps runtime values small
- fits the current compiler's metadata-heavy address tracking
- lets loads/stores still compile to direct memory-indexed instructions

Cons:

- pointers cannot freely point across arbitrary regions
- region information must be preserved through pointer-producing operations
- casts or generic pointer helpers become harder

### Fat pointers

A pointer becomes a pair: `(memoryRegion, address)` or `(memoryIndex, address)`.

Pros:

- can represent dynamic cross-region pointers
- more general for generic data structures

Cons:

- larger values
- more stack/type complexity
- more runtime checks
- less aligned with the current 8f4e compiler model

For 8f4e, static-region pointers look like the better first direction. They preserve the simple address-as-i32 runtime shape while making region correctness a compile-time concern where possible.

## Cross-region operations

If user-facing bulk memory instructions are added, multi-memory raises useful questions:

- should `copyBytes` support copying between regions?
- should region-crossing copies require explicit syntax?
- should `copyBytes` infer source and destination regions from address metadata?
- should region-crossing copies be rejected unless both addresses are statically known?

WebAssembly multi-memory allows memory operations to name memory indices. That makes region-aware `memory.copy` possible, but source-level behavior should stay explicit enough that users understand when data moves between fast and slow memory.

## Browser compatibility path

This idea should not force every runtime to use true multi-memory.

A portable path could be:

- source supports logical regions
- runtime profiles define which regions exist
- browser runtimes initially alias all regions to one Wasm memory
- microcontroller runtimes can map regions to separate memories when supported
- compiler tests cover both aliased and distinct-region layouts

This lets the language design mature before every runtime pays the full implementation cost.

## Open questions

- Should placement be module-level, declaration-level, or both?
- Should regions be declared in source, project config, runtime profile, or some combination?
- Should unknown regions be compiler errors or runtime-profile errors?
- What is the default region for declarations without an explicit region?
- Can a module contain declarations in multiple regions, or does that make module layout too hard to reason about?
- How should intermodule references include region information?
- How should editor memory inspectors display multiple memory regions?
- How should `init()` clear and restore multiple memories?
- Should region sizes be fixed by the runtime profile or inferred from compiled program requirements?

## Main takeaway

Multi-memory is not only about having more address space.

For 8f4e, the more interesting idea is logical memory placement: let source code express intent such as `fast`, `bulk`, `display`, or `audio`, then let the runtime map those names to the target's real memory layout.

That keeps the compiler portable and gives microcontroller runtimes room to exploit hardware-specific memory without leaking physical details into ordinary 8f4e source.
