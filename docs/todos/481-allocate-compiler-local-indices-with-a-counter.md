---
title: 'TODO: Allocate compiler local indices with a counter'
priority: Medium
effort: 2-4h
created: 2026-09-06
issue: null
status: Open
completed: null
---

# TODO: Allocate Compiler Local Indices With a Counter

## Problem Description

The compiler repeatedly enumerates all existing locals to assign the next local index. Parameter registration, local
declarations, and generated temporaries commonly use `Object.keys(context.locals).length`. Memory-guard allocation
uses `Math.max(-1, ...Object.values(context.locals).map(local => local.index)) + 1`.

As a function accumulates locals, each allocation scans a larger collection and creates temporary arrays. Allocating
N locals this way can require quadratic work. The pattern appears in semantic reference resolution, stack analysis,
and Wasm code generation.

## Proposed Solution

Add a per-context `nextLocalIndex` counter and a shared local-allocation helper, preferably in `@8f4e/semantic-utils`.
Keep the existing name-to-binding map for lookups. Allocate each new index in constant time and advance the counter
only when reserving a new slot.

Use the same helper contract across compiler stages, with independent allocator state for each context. Code generation
can allocate additional hidden temporaries; do not assume that every stage has identical local counts or indices.

- Assign parameters first, including expanded `paramShape` parameters, followed by ordinary locals and temporaries.
- Support reserving consecutive slots for operations such as integer min/max and map lowering.
- Return an existing binding without advancing the counter when a get-or-create operation reuses a local.
- Reset the allocator whenever the owning context's local table is reset.
- Define initialization for contexts seeded with existing bindings. Either derive the next index once at construction
  or require explicit allocator state and update callers; avoid rescanning on each allocation.

Internal context and helper APIs may change directly because the project has not been released. Keep language behavior
and existing declaration diagnostics unchanged; no compatibility shim or repeated internal invariant checks are needed.

## Implementation Plan

1. Add allocator state to the relevant shared context types and initialize it in `createCompilationContext`.
2. Introduce helpers for allocating new bindings or reserving slots, keeping counter and binding-map updates consistent.
3. Migrate parameter/local registration in semantic reference resolution and stack analysis.
4. Migrate Wasm codegen parameters, locals, loop counters, arithmetic temporaries, map temporaries, and memory guards.
5. Audit context resets, seeded test contexts, and direct writes to local maps so every new slot follows the contract.
6. Verify equivalent generated code and measure compilation with increasing numbers of locals and guarded operations.

## Success Criteria

- [ ] New local allocation performs no full enumeration of the local map.
- [ ] Parameters retain their leading indices and are excluded from emitted local declarations.
- [ ] Mixed int/float/float64 bindings and generated temporaries receive unique indices in declaration order.
- [ ] Reserving multiple slots advances the counter correctly; reusing a binding does not advance it.
- [ ] Function/module contexts remain independent, and local-table resets also reset allocator state.
- [ ] Seeded contexts cannot allocate an index already used by an existing binding, including sparse seeded indices.
- [ ] Runtime behavior and existing declaration diagnostics are preserved; ordinary dense-index fixtures emit identical
      Wasm when compared independently of other codegen changes.
- [ ] Benchmarks record compile-time results for both ordinary projects and functions with many locals or memory guards.

## Performance Expectations

This candidate came from the compiler scan on 2026-09-06 and has not yet been benchmarked. The expected benefit is lower
compilation cost and fewer temporary allocations, especially for large generated functions. It does not inherently
reduce local count, Wasm size, or generated-program runtime.

Measure several input sizes, use warmup and repeated samples, and compare both cold and warm AST-cache compilation.
Treat the measurements as evidence rather than imposing an unsupported percentage target.

## Affected Components

- `packages/compiler/packages/language-spec/src/semantic.ts` and relevant codegen context types
- `packages/compiler/packages/sub-program/packages/semantic-utils/src/createCompilationContext.ts`
- `packages/compiler/packages/sub-program/packages/semantic-reference-resolver/src/index.ts`
- `packages/compiler/packages/sub-program/packages/stack-analyzer/src/analyzeStack.ts`
- `packages/compiler/packages/wasm-codegen/src/instructionCompilers/` local and temporary allocation sites
- `packages/compiler/packages/wasm-codegen/src/instructionCompilers/utils/memoryAccessGuard.ts`

## Validation Checkpoints

- `npx nx run-many --target=test --projects=@8f4e/semantic-utils,@8f4e/semantic-reference-resolver,@8f4e/stack-analyzer,@8f4e/wasm-codegen,@8f4e/compiler`
- `npx nx run-many --target=typecheck --all`
- Inspect remaining local-map enumeration: final declaration emission may still enumerate once, but allocation must not.
- Validate emitted Wasm and run mixed parameter/local/temporary fixtures, including multiple functions and nested loops.

## Related Items

- [TODO 480: Simplify map codegen with reverse row order](480-simplify-map-codegen-with-reverse-row-order.md) — coordinate
  changes to map temporary allocation if both tasks are implemented together; neither depends on the other.
