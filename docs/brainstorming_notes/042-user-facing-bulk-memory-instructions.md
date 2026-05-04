# User-Facing Bulk Memory Instructions

Date: 2026-05-04

This note captures a possible language direction for exposing WebAssembly bulk-memory operations in 8f4e source.

## Short version

The compiler already uses WebAssembly bulk-memory operations internally for program memory initialization. Users, however, cannot directly express bulk memory operations in source code.

That leaves common contiguous-memory tasks to repeated scalar loads/stores or specialized helpers such as `storeBytes <count>`.

Interesting source-level operations could include:

- `copyBytes` for copying one memory range to another
- `fillBytes` for filling a range with one byte value
- `clearBytes` as a zero-fill shorthand

The big design issue is bounds behavior. Existing 8f4e memory instructions are documented as non-trapping for out-of-bounds access, while raw WebAssembly `memory.copy` and `memory.fill` can trap when a range is invalid.

## Why this is interesting

Bulk memory maps well to several 8f4e use cases:

- clearing a buffer or scratch range
- copying bytes between buffers
- filling a range with a byte value
- resetting temporary memory during a cycle
- shifting or staging packed asset, audio, or visual data

These operations are already natural in WebAssembly. Exposing them carefully could reduce code size and avoid emitting long scalar store loops.

## Candidate source shape

Possible compile-time count form:

```8f4e
; ... dstAddress, srcAddress
copyBytes 128
```

```8f4e
; ... dstAddress, byteValue
fillBytes 128
```

```8f4e
; ... dstAddress
clearBytes 128
```

Possible runtime count form:

```8f4e
; ... dstAddress, srcAddress, count
copyBytes
```

```8f4e
; ... dstAddress, byteValue, count
fillBytes
```

Compile-time counts are easier to validate and optimize. Runtime counts are more flexible, but they make non-trapping range checks harder.

## Bounds behavior options

There are several plausible policies.

### Trap like WebAssembly

Expose `memory.copy` and `memory.fill` directly. Invalid ranges trap.

Pros:

- smallest generated code
- easiest compiler implementation
- matches Wasm semantics exactly

Cons:

- conflicts with 8f4e's current non-trapping memory-access contract
- a single bad address can stop the module
- users need to manually clamp or prove every range

### Full-range guard

Check that the entire range is valid before the bulk operation. If not valid, skip the whole operation.

Pros:

- remains non-trapping
- maps to one bulk instruction on the safe path
- simple behavior to explain

Cons:

- partially valid ranges do nothing
- runtime count checks add code
- needs careful overflow handling for `address + count`

### Clamp the range

Clamp the destination and/or source range so the operation writes or reads only valid bytes.

Pros:

- non-trapping
- makes best effort for partially valid ranges

Cons:

- source and destination clamping can make copy semantics surprising
- range length may change at runtime
- harder to reason about overlap behavior

### Scalar fallback for partial writes

Use bulk memory when the full range is known safe; otherwise expand to guarded byte loops.

Pros:

- can preserve partial-write behavior
- stays compatible with existing non-trapping expectations

Cons:

- larger code
- slower fallback path
- undermines the main point of exposing bulk memory directly

The full-range guard seems like the most coherent first non-trapping design if 8f4e wants these instructions to behave like the rest of its memory model.

## Address metadata

The compiler already tracks address-range metadata for some stack values and supports `clampAddress`-style instructions.

Bulk memory could use the same idea:

- if destination/source ranges are statically known safe for `count`, emit raw `memory.copy` or `memory.fill`
- if a previous clamp guarantees safety, emit raw bulk memory
- otherwise emit a full-range guard before the bulk operation

This preserves the fast path without requiring every program to be manually defensive.

## Overlap semantics

`memory.copy` is overlap-safe. If 8f4e exposes copy operations backed by `memory.copy`, the docs should state that in-place moves are allowed.

Example:

```8f4e
; Move bytes within the same buffer.
push &buffer[4]
push &buffer[0]
copyBytes 64
```

If multi-memory regions are added later, copy semantics need to say whether source and destination can live in different regions.

## Relationship to multi-memory

Bulk memory becomes more interesting with logical memory regions.

Open questions:

- should `copyBytes` support copying between regions?
- should region-crossing copies require explicit syntax?
- should `copyBytes` infer source and destination regions from address metadata?
- should region-crossing copies be rejected unless both addresses are statically known?

WebAssembly multi-memory can express memory-indexed copies, but 8f4e should expose logical regions rather than raw memory indices.

## Relationship to `storeBytes`

`storeBytes <count>` is a stack-to-memory literal write helper. It should stay separate.

Bulk instructions should be about memory-range operations:

- memory to memory
- byte value to memory range
- zero to memory range

Do not overload `storeBytes` into a general bulk-memory API.

## Possible implementation path

This should start as design/prototyping rather than a committed feature.

1. Add wasm-utils support for `memory.copy` if it is missing.
2. Reuse the existing `memory.fill` encoding for fill and clear experiments.
3. Prototype compile-time-count forms first.
4. Decide whether the first behavior is trapping, full-range guarded, or experimental-only.
5. Add generated-WAT and instantiated-memory tests for normal operation, overlap, zero-length ranges, and invalid ranges.
6. Only then promote the syntax into regular instruction docs.

## Main takeaway

User-facing bulk memory instructions are promising, but the feature should be designed around 8f4e's memory semantics, not just around the existence of Wasm opcodes.

The useful first question is not "can the compiler emit `memory.copy`?" It can. The useful question is what source-level promise `copyBytes`, `fillBytes`, and `clearBytes` should make when addresses or ranges are wrong.
