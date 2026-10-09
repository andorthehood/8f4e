# Compiler Design

Internal notes about compiler architecture and intended phase boundaries.

## Compile-Time Folding Pipeline

Compile-time resolution should be owned by one semantic stage instead of being spread across parser fallbacks, instruction routing, and codegen helpers.

The intended pipeline is:

1. Source code
2. Parsed AST
   - contains literals, identifiers, references, and compile-time expression forms
3. Constant namespace pass
   - resolves constants from literals, already-resolved constants, and constant-only expressions
   - does not consult memory declarations, memory metadata, or memory addresses
4. Semantic memory namespace pass
   - collects memory declarations, `use` imports, and intermodule metadata availability
5. AST normalization / compile-time folding pass
   - rewrites compile-time-resolvable arguments to plain literals
6. Compilation / codegen
   - instruction compilers mostly see literals or true runtime identifiers
7. Late intermodule fixups only for forms that genuinely cannot be resolved earlier

In short:

- source code
- AST with literals and expressions
- original AST plus resolved value reports
- compilation

## Declaration and Execution Handoff

Function registration resolves signatures, `paramShape` expansions, imports, exports, and impurity flags. Semantic
reference resolution then assigns source binding identities and produces executable bodies. These bodies exclude
parameter/local declarations, source block markers, memory declarations, and compiler directives. Loop defaults are
already explicit, and module execution directives are recorded as metadata.

Stack analysis consumes executable bodies and returns execution facts. Local pointer facts are keyed by binding
identity, without WebAssembly indexes. It validates returns against registered signatures and never reconstructs
imports, exports, parameters, or module execution metadata.

Function symbols contain no WebAssembly indices. After stack and assertion analysis, backend layout planning collects
user and native callback imports into one ordered list and assigns indices for imports, initialization, entry
dispatchers, defined functions, and module bodies. Codegen and binary emission consume this same layout rather than
adjusting symbol metadata or independently calculating offsets. Function signature types are registered during layout
planning; body codegen can add block signature types.

Codegen owns WebAssembly local indexes and generated temporary locals. It allocates source binding storage before
emitting a body. Original ASTs remain attached for source diagnostics and tooling; downstream stages do not replay
declarations from them. Composition produces `ComposedAST` types with required original source identity, and semantic
reference reports preserve that input type through their output.

Source-only function structure rules, including parameter ordering, duplicate directives, and imported function bodies,
are checked during tokenization. Duplicate symbols and resolved signature limits remain semantic checks.

## Design Rule

Compile-time expressions should have one owner.

If a value can be resolved during semantic normalization, downstream instruction compilers and helper paths should not re-resolve it again.

Constant expressions have a narrower owner than general compile-time expressions. `const` values should resolve in a constant-only pass; memory metadata queries and address references belong to later memory-aware normalization.

## Memory Initialization

The compiler initializes declared program memory with WebAssembly bulk-memory instructions.

The exported `initDefaults` function is responsible for restoring the full declared initial memory image. Its expected sequence is:

1. Clear the declared memory range with one `memory.fill(0, 0, requiredMemoryBytes)`.
2. Copy passive data segments into memory with `memory.init`.

The initial `memory.fill` is part of the contract. It makes implicit defaults cheap and gives repeated `initDefaults()` calls the same reset semantics as a fresh memory instance for declared program memory.

When a program uses logical memory regions, each WebAssembly memory has the same initialization contract independently. The compiler clears the required byte range for memory `0` and for each used custom region, then applies passive data segments with the matching memory index. The compile result keeps `requiredMemoryBytes` scoped to memory `0` and reports custom regions through `requiredMemoryBytesByRegion`.

### Passive Data Segments

Passive data segments contain only bytes that must differ from the cleared zero image.

The compiler skips:
- implicit zero scalar defaults
- implicit arrays with no initializer values
- explicit array initializer entries whose encoded bytes are all zero

The compiler retains:
- non-zero scalar defaults
- explicit zero scalar defaults
- non-zero explicit array initializer entries

Array declarations are encoded sparsely. For example:

```text
int[] huge 1000000 1
```

allocates one million `int` elements, but only emits passive data for the first element. The remaining elements are restored by the initial full-memory zero fill.

Initializer values are prefix-based: `int[] values 4 1 2` initializes elements `0` and `1`; elements `2` and `3` are zero after `initDefaults()`.

### Segment Coalescing

The segment builder emits small candidate segments for data that must be copied. A later merge pass sorts candidates by byte address and coalesces neighboring candidates.

The current coalescing policy merges gaps of up to `32` zero bytes. Those gap bytes are safe to include because the target memory has already been cleared before any passive data is copied.

This balances:
- fewer passive data entries and fewer `memory.init` calls
- avoiding large zero payloads for sparse arrays and buffers

The coalescing threshold is an implementation detail, not a language-level guarantee. Runtime-visible behavior is the restored memory image after `initDefaults()`, not the number or shape of passive data segments.

### Ownership Boundary

Memory clearing and passive data segmentation are separate responsibilities:

- `memory.fill` restores the zero baseline for the whole declared memory range.
- passive data segments restore non-zero/default bytes over that baseline.
- segment coalescing only optimizes byte payload shape.

Do not add per-array or per-range zero-fill logic unless a measured optimization requires changing this contract.


## Native Assertion Planning

Native assertions are recognized and stack-checked in either flag mode. With `enableAssertions: false`, codegen emits
operand drops. With the flag enabled, sub-program orchestration plans typed host imports and static assertion sites
from resolved executable bodies and stack facts. These are signature requests, without numeric function/type indices.
Backend layout planning then includes them with user imports and assigns final function indices once.

The composer records original block names and canonical group paths as required metadata on composed ASTs, alongside
qualified symbols. Assertion planning combines these identities with physical source lines, project block IDs, and
included-source provenance.
The emitted compiler result exposes that lookup only when assertions are enabled. Callbacks, result collection,
memory/reset policy, and execution scheduling belong to consumers.
