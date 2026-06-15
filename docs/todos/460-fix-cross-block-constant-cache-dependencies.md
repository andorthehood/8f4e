---
title: 'TODO: Fix cross-block constant cache dependencies'
priority: Medium
effort: 4-8h
created: 2026-06-15
issue: null
status: Open
completed: null
---

# TODO: Fix Cross-Block Constant Cache Dependencies

## Problem Description

The compiler AST cache is keyed and validated per source block. It checks the block cache key, source line count, and
source hash before returning the cached parsed AST.

That is correct for tokenizer output, but constants introduce a cross-block semantic dependency:

- a module block can contain `int[] buffer SIZE`;
- a separate constants block can define `const SIZE 2`;
- if the user changes only the constants block to `const SIZE 4`, the module block source hash still matches.

Current compilation avoids stale user-visible output by preparing a per-compile AST copy before constant inlining mutates
arguments. The cached tokenizer AST remains source-shaped, while the inliner stays simple.

This TODO tracks a more deliberate cache model for any future work that wants to cache transformed or inlined ASTs.

## Proposed Solution

Keep constant inlining simple for now: it may mutate the AST it receives, and the compiler should continue passing it a
per-compile prepared AST.

Later, choose an explicit cache strategy for transformed ASTs:

- keep the tokenizer AST cache strictly source-shaped and immutable-by-convention;
- or add a separate inlined-AST cache whose key includes the resolved constant namespace state used by each block;
- or invalidate dependent module/function/prototype entries when any used constants namespace changes.

The chosen strategy should make cross-block dependencies visible in the cache layer instead of pushing that complexity
into the constant inliner.

## Anti-Patterns

- Do not make the constant inliner perform AST-wide reference rebinding just to protect the tokenizer cache.
- Do not cache inlined ASTs using only the module/function/prototype source hash.
- Do not treat an unchanged module source hash as proof that its inlined constant values are unchanged.
- Do not couple this to memory layout planning; `push sizeof(buffer)` and other memory metadata expressions are a
  separate semantic concern.

## Implementation Plan

### Step 1: Define Cache Layers

- Decide which cached values are source-shaped parser output and which are transformed compiler inputs.
- Document ownership and mutation rules for each cached value.
- Keep `@8f4e/constant-inliner` focused on constant collection and replacement.

### Step 2: Track Constant Dependencies

- Record which constants namespaces each block uses.
- Include a stable digest of those namespace values in any transformed/inlined AST cache key.
- Consider whether existing `use` lines and `referencedNamespaceIds` metadata are enough or whether a dedicated
  dependency record is needed.

### Step 3: Add Practical Regression Coverage

- Keep coverage for recompiling an unchanged module block after changing only a used constants block.
- Add coverage for functions/prototypes if transformed AST caching expands beyond modules.
- Verify cached parser ASTs remain source-shaped, or verify transformed cache keys change when constants change.

## Validation Checkpoints

- Add focused regression coverage before changing cache behavior.
- `npx nx run @8f4e/compiler:test -- --run tests/compilerOptionsAndCache.test.ts`
- `npx nx run @8f4e/constant-inliner:test`
- `npx nx run @8f4e/compiler:test`

## Success Criteria

- [ ] Cache behavior is explicit about source-shaped ASTs versus transformed ASTs.
- [ ] Recompiling after changing only a used constants block cannot reuse stale inlined values.
- [ ] The constant inliner does not own cache invalidation or AST graph-rebinding policy.
- [ ] Memory planning remains a separate pass after constant inlining.
- [ ] Regression tests cover the practical editor/dev-loop scenario.

## Affected Components

- `packages/compiler/packages/tokenizer/src/index.ts` - current source-block AST cache lookup and storage.
- `packages/compiler/src/compileSubProgram.ts` - current per-compile AST preparation and constant inlining integration.
- `packages/compiler/packages/constant-inliner` - should stay simple and avoid cache-specific responsibilities.
- `packages/compiler/tests/compilerOptionsAndCache.test.ts` - likely home for future practical cache dependency coverage.

## Risks & Considerations

- **Hidden dependencies**: constants are imported through `use` lines, so cache invalidation must account for namespace
  contents, not just local source text.
- **Over-caching**: caching inlined ASTs may add complexity without a measured benefit.
- **Mutation boundaries**: downstream passes should either receive disposable ASTs or operate immutably by contract.
- **Future memory-order work**: decoupling memory layout from execution order should not depend on this cache change.

## Related Items

- **Related**: `docs/todos/458-decouple-module-execution-order-from-memory-layout.md`
- **Related**: `docs/todos/459-extract-compiler-diagnostics-package.md`
- **Related**: PR #808, which decouples constants from memory and keeps constant inlining before memory planning.
