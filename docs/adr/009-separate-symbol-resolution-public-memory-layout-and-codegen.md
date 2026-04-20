# ADR-009: Separate Symbol Resolution, Public Memory Layout, and Codegen

**Date**: 2026-04-19

**Status**: Accepted

## Context

The compiler refactor around public memory layout has been moving toward three distinct concerns:

1. symbol resolution and constant evaluation
2. public memory layout generation
3. compiler codegen and hidden allocation

The original goal of extracting `@8f4e/compiler-memory-layout` was to make public addresses available as a first-class product of compilation so future tooling, including live memory inspection, can consume them directly without pulling in codegen behavior or hidden allocations.

During the extraction, the implementation improved ownership but still left some transitional coupling:

- the compiler still called memory-layout line-level hooks
- memory-layout still participated in some semantic handling that conceptually belongs earlier
- constants and memory layout could form a cycle when layout-dependent constants were allowed

The desired architecture is a pass-oriented pipeline where each stage produces durable facts for the next stage rather than exposing helper functions for downstream code to call line-by-line.

The software has not been released yet, so package and pass APIs are intentionally flexible during this refactor. We should prefer the correct ownership boundary over compatibility shims.

## Decision

We standardize on the following architecture.

### 1. `@8f4e/compiler-symbols` owns symbol resolution

The symbols pass is responsible for:

- resolving `const` values
- handling `use` / namespace imports needed for symbol lookup
- compile-time expression folding
- intermodule symbol/reference validation that belongs to symbol resolution
- producing symbol facts that later passes consume

Constants are part of the symbols pass, not the memory-layout pass.

### 2. Layout-dependent constants are not allowed

Constants must not depend on public memory layout or memory metadata.

Examples of disallowed forms:

- `const FOO sizeof(buffer)`
- `const START &buffer`
- `const END buffer&`
- any constant expression that depends on address or layout metadata, including intermodule layout references

This removes the cycle where memory layout depends on constants while constants also depend on memory layout.

### 3. `@8f4e/compiler-memory-layout` owns only public memory planning

The memory-layout pass is responsible for:

- consuming AST plus symbol facts
- computing public memory declarations and module offsets
- producing public addresses and layout metadata
- excluding codegen-only hidden allocations

Memory-layout should consume resolved constants. It should not own constant evaluation.

### 4. `@8f4e/compiler` owns codegen and hidden allocation

The compiler package remains responsible for:

- instruction lowering and WebAssembly emission
- stack/type/codegen validation that belongs to compiler execution semantics
- hidden/internal allocations appended after public memory
- combining symbol facts, public layout facts, and codegen results into the final compilation result

### 5. Pass outputs are preferred over line-level helper APIs

The target architecture is pass-based, not helper-based.

The compiler should not need to call memory-layout semantic helpers such as line-by-line normalization hooks in the long term. Instead, memory-layout should return enough information for downstream compiler phases to proceed without invoking layout-specific helper functions directly.

Compiler-facing line-level memory-layout helper entry points are not part of the intended design and should be removed rather than renamed or preserved.

### 6. Root package APIs should match their real audience

The root export of `@8f4e/compiler-memory-layout` is for public memory layout creation and querying.

Compiler-only integration hooks, when temporarily needed during migration, must not be exposed from the root package surface.

## Consequences

### Positive

1. **Cleaner ownership**: constants and symbol resolution live in one pass; public layout lives in another; codegen-specific allocation stays in the compiler.
2. **Better tooling path**: live memory inspection can depend on public layout without inheriting hidden allocations or compiler internals.
3. **Less phase coupling**: downstream phases consume stable pass outputs instead of reaching back into earlier-stage helpers.
4. **Removes a hard semantic cycle**: banning layout-dependent constants prevents constant evaluation from depending on layout planning.

### Negative

1. **More explicit pass contracts are required**: symbols and memory-layout must return structured outputs that later phases consume.
2. **Short-term migration overhead**: transitional helper entry points may still exist until the pass boundary is fully finished.
3. **Refactors need discipline**: code should be moved toward pass outputs rather than reintroducing cross-phase helper calls.

## Intended End State

The intended compilation flow is:

1. tokenizer/parser produces AST
2. symbols pass consumes AST and returns symbol facts
3. memory-layout pass consumes AST plus symbol facts and returns public layout facts
4. compiler/codegen consumes AST plus symbol facts plus layout facts and produces final executable output

At that end state:

- memory-layout does not evaluate constants
- compiler does not call layout line helpers
- public memory layout is a first-class product that tooling can consume directly

## Alternatives Considered

### 1. Keep constant evaluation inside memory-layout

Rejected because it blurs ownership and keeps layout planning responsible for facts that should already be resolved before layout runs.

### 2. Allow layout-dependent constants

Rejected because it creates a circular dependency between constants and memory planning and makes the pass boundary much harder to keep coherent.

### 3. Move layout helper functions into the compiler

Rejected because the behavior still belongs to memory-layout, and moving it back into the compiler would weaken the extraction instead of completing it.

### 4. Keep compiler-only hooks in memory-layout exports

Rejected because it makes compiler-facing implementation details look like package API instead of finishing the pass boundary.

## Related Decisions

- [ADR-005: Separate Syntax and Semantic Compiler Errors](005-separate-syntax-and-semantic-compiler-errors.md)
- [ADR-008: Provide a Syntax-Only Compiler Entry Point for Tooling](008-provide-a-syntax-only-compiler-entry-point-for-tooling.md)
