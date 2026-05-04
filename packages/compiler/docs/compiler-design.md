# Compiler Design

Internal notes about compiler architecture and intended phase boundaries.

## Compile-Time Folding Pipeline

Compile-time resolution should be owned by one semantic stage instead of being spread across parser fallbacks, instruction routing, and codegen helpers.

The intended pipeline is:

1. Source code
2. Parsed AST
   - contains literals, identifiers, references, and compile-time expression forms
3. Semantic namespace pass
   - collects constants, memory declarations, `use` imports, and intermodule metadata availability
4. AST normalization / compile-time folding pass
   - rewrites compile-time-resolvable arguments to plain literals
5. Compilation / codegen
   - instruction compilers mostly see literals or true runtime identifiers
6. Late intermodule fixups only for forms that genuinely cannot be resolved earlier

In short:

- source code
- AST with literals and expressions
- AST with inlined values
- compilation

## Design Rule

Compile-time expressions should have one owner.

If a value can be resolved during semantic normalization, downstream instruction compilers and helper paths should not re-resolve it again.

## Memory Initialization

The compiler initializes declared program memory with WebAssembly bulk-memory instructions.

The exported `init` function is responsible for restoring the full declared initial memory image. Its expected sequence is:

1. Clear the declared memory range with one `memory.fill(0, 0, requiredMemoryBytes)`.
2. Copy passive data segments into memory with `memory.init`.
3. Run `initOnly` module calls.

The initial `memory.fill` is part of the contract. It makes implicit defaults cheap and gives repeated `init()` calls the same reset semantics as a fresh memory instance for declared program memory.

### Passive Data Segments

Passive data segments contain only bytes that must differ from the cleared zero image.

The compiler skips:
- implicit zero scalar defaults
- implicit arrays with no initializer values
- explicit array initializer entries whose encoded bytes are all zero
- zero-valued internal resources

The compiler retains:
- non-zero scalar defaults
- explicit zero scalar defaults
- non-zero internal resources
- non-zero explicit array initializer entries

Array declarations are encoded sparsely. For example:

```text
int[] huge 1000000 1
```

allocates one million `int` elements, but only emits passive data for the first element. The remaining elements are restored by the initial full-memory zero fill.

Initializer values are prefix-based: `int[] values 4 1 2` initializes elements `0` and `1`; elements `2` and `3` are zero after `init()`.

### Segment Coalescing

The segment builder emits small candidate segments for data that must be copied. A later merge pass sorts candidates by byte address and coalesces neighboring candidates.

The current coalescing policy merges gaps of up to `32` zero bytes. Those gap bytes are safe to include because the target memory has already been cleared before any passive data is copied.

This balances:
- fewer passive data entries and fewer `memory.init` calls
- avoiding large zero payloads for sparse arrays and buffers

The coalescing threshold is an implementation detail, not a language-level guarantee. Runtime-visible behavior is the restored memory image after `init()`, not the number or shape of passive data segments.

### Ownership Boundary

Memory clearing and passive data segmentation are separate responsibilities:

- `memory.fill` restores the zero baseline for the whole declared memory range.
- passive data segments restore non-zero/default bytes over that baseline.
- segment coalescing only optimizes byte payload shape.

Do not add per-array or per-range zero-fill logic unless a measured optimization requires changing this contract.
