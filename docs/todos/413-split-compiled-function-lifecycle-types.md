---
title: 'TODO: Split compiled function lifecycle types'
priority: Medium
effort: 2-4h
created: 2026-05-25
issue: https://github.com/andorthehood/8f4e/issues/682
status: Open
completed: null
---

# TODO: Split compiled function lifecycle types

## Problem Description

`CompiledFunction` currently represents both early function metadata and fully compiled function output. Fields such as `wasmIndex`, `typeIndex`, and `ast` are optional even in compiler phases where they are required.

That forces downstream code to use non-null assertions when creating function exports, collecting function type indices, and reporting duplicate export errors.

The broader goal is to make compiler-owned lifecycle invariants statically visible instead of handling internal ambiguity at runtime. Runtime checks should remain for invalid user programs and external API boundaries, but compiler phases should not repeatedly defend against states that only exist because an interface is too broad.

## Proposed Solution

Split the lifecycle into separate types:

- `FunctionMetadata` for pre-codegen function discovery.
- `CompiledFunction` for final compiled functions.
- Optionally `CompiledFunctionWithExport` or a type guard for export-bearing functions.

Keep the runtime shape stable unless an API change is intentional.

After this change, the type system should communicate which phase a function record belongs to. Code that receives a final compiled function should not need to ask whether compilation assigned a type index or preserved the source AST; those facts should be part of the contract.

## Implementation Plan

### Step 1: Add Lifecycle Types

- Add a metadata-only function type in `packages/compiler-spec/src/compiled.ts`.
- Make the final compiled function type require fields produced by `compileFunction`.
- Keep `CompiledFunctionLookup` pointed at the final type if callers only receive compiled output.

### Step 2: Update Function Collection

- Update `collectFunctionMetadataFromAsts(...)` to return the metadata lookup type.
- Update call-target normalization and stack analysis to accept metadata where that is the only data needed.
- Avoid widening final compiled functions just to satisfy metadata call sites.

### Step 3: Remove Assertions

- Remove `typeIndex!`, `wasmIndex!`, and `ast!` from final compile/export assembly paths.
- Replace export filtering with a typed helper if needed.

## Validation Checkpoints

- Run `npx nx run compiler-spec:typecheck`.
- Run `npx nx run compiler:typecheck`.
- Run `npx nx run compiler:test`.
- Check `rg -n "typeIndex!|wasmIndex!|ast!" packages/compiler/src packages/compiler-spec/src`.

## Success Criteria

- [ ] Final compiled functions require `wasmIndex`, `typeIndex`, and `ast` where compiler output depends on them.
- [ ] Pre-codegen function metadata no longer pretends to be a full compiled function.
- [ ] Non-null assertions for function lifecycle fields are removed from compiler assembly code.
- [ ] Compiler typecheck and tests pass.

## Affected Components

- `packages/compiler-spec/src/compiled.ts`
- `packages/compiler/src/semantic/buildNamespace.ts`
- `packages/compiler/src/compiler.ts`
- `packages/compiler/src/index.ts`
- function call normalization and stack analysis tests

## Risks & Considerations

- **API shape risk**: Confirm whether `CompiledFunctionLookup` is public API before changing its field optionality.
- **Metadata coupling risk**: Do not add empty bytecode fields to metadata just to preserve the old shape.
- **Wrong-goal risk**: Do not replace non-null assertions with runtime guards. The intent is to remove impossible internal ambiguity by hardening the type interfaces.
- **Migration order**: This is the safest first hardening task because it is mostly type-level and localized.

## Related Items

- **Related**: `397-finish-compiler-stack-analysis-codegen-separation.md`
- **Related**: `412-expose-compiler-stack-analysis-results.md`
