---
title: 'TODO: Add compiler AST cache for incremental compiles'
priority: Medium
effort: 4-8h
created: 2026-05-04
status: Completed
completed: 2026-05-04
---

# TODO: Add compiler AST cache for incremental compiles

## Problem Description

The compiler currently reparses every module and function into AST form on each `compile()` call, even when most source blocks are unchanged between editor-driven incremental compiles.

This repeats tokenizer work, syntax validation, block pairing, argument parsing, and macro-expanded line metadata mapping for unchanged inputs. The first caching step should target this AST layer only, leaving semantic analysis and codegen recomputed each compile because those stages depend on the full compile set, options, namespace layout, intermodule references, and function metadata.

## Proposed Solution

Add an opaque compiler-owned cache object that `compile()` returns and accepts as an optional argument on a subsequent call. Callers that want caching pass the same object they received from a previous compile result.

Example shape:

```ts
const first = compile(modules, options, functions, macros);
const second = compile(nextModules, options, functions, macros, first.cache);
```

High-level behavior:

- `compile()` creates a fresh cache when none is supplied.
- `compile()` returns the cache it used in the compile result.
- Cache entries store parsed ASTs for expanded module and function code.
- Reuse an AST only when a fast hash of the expanded source and line metadata matches.
- Treat the cache object as internal and opaque. Do not deeply validate it.
- Do not add cache schema versioning for now; cache lifetime is one process/editor session and it is not intended to persist across releases.

## Implementation Plan

### Step 1: Define the cache contract

- Add a public `CompilerCache` type with an internal AST map shape.
- Add `cache` to the compile result type.
- Add an optional trailing `cache` argument to `compile()`.
- Keep the object compiler-owned; callers should only pass it back.

### Step 2: Add AST cache helpers

- Add a small non-cryptographic hash helper for expanded source plus `lineMetadata`.
- Extend `compileToAST(code, lineMetadata)` with optional cache and cache-key arguments.
- Keep module and function entries separate, either via separate maps or key prefixes.
- Key entries by stable position plus hash for the first implementation; do not parse ids just to decide whether parsing can be skipped.

### Step 3: Integrate after macro expansion

- Apply caching after macro expansion and `convertExpandedLinesToCode()`.
- Hash the exact expanded `code` and `lineMetadata` passed into `compileToAST()`, not the original source module.
- Preserve current behavior for non-macro compiles by treating `lineMetadata` as absent.

### Step 4: Add tests

- Verify unchanged modules reuse cached ASTs across compile calls.
- Verify changed module source recomputes only that module AST.
- Verify functions use the same cache behavior independently of modules.
- Verify macro-expanded source changes invalidate the cached AST.
- Verify compile output remains equivalent with and without a reused cache.

## Validation Checkpoints

- `npx nx run @8f4e/compiler:test`
- `npx nx run @8f4e/compiler:typecheck`
- `npx nx run app:typecheck`

## Success Criteria

- [ ] `compile()` returns an opaque cache object.
- [ ] `compile()` accepts a previously returned cache object as an optional argument.
- [ ] Unchanged expanded modules and functions skip `compileToAST()`.
- [ ] Changed expanded modules and functions are reparsed.
- [ ] Macro line metadata remains correct when cache hits occur.
- [ ] Semantic analysis, namespace collection, sorting, normalization, and codegen still run every compile.

## Affected Components

- `packages/compiler/src/index.ts` - compile API, AST caching integration, result shape.
- `packages/compiler-types/src/index.ts` - public cache and compile result types if needed.
- `packages/compiler/packages/tokenizer/src/parser.ts` - AST parsing boundary used by the cache wrapper.
- `packages/compiler/tests/` - integration tests for cache reuse and output equivalence.

## Risks & Considerations

- **AST mutability**: Parsed ASTs should remain immutable after parsing. If a later phase mutates parsed AST nodes, cache hits would need cloning or a stricter phase boundary.
- **Hash collisions**: A fast non-cryptographic hash is acceptable for an internal session cache, but include source length or metadata length if a cheap extra guard is useful.
- **Macro metadata**: Cache entries must include expanded line metadata in their hash input so diagnostics continue to point at the right original call site.
- **Limited scope**: This todo intentionally does not cache semantic normalization, namespace collection, graph sorting, or WebAssembly codegen.
- **Caller mutation**: Mutating the cache object is unsupported and may produce undefined behavior.

## Related Items

- **Related**: `docs/todos/305-reuse-wasm-instance-across-incremental-compiles.md`
- **Related**: `docs/todos/384-add-compiler-algorithmic-regression-metrics.md`
- **Related**: `packages/compiler/src/index.ts`
- **Related**: `packages/compiler/packages/tokenizer/src/parser.ts`
- **Related**: `packages/compiler/packages/tokenizer/src/cache/`

## Notes

- The cache is intended for live editor/session use only. It should not be serialized or reused across package releases.
- This is the first compiler caching layer. Broader incremental compilation can be considered later once AST caching is measured and stable.
