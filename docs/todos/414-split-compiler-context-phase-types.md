---
title: 'TODO: Split compiler context phase types'
priority: Medium
effort: 1-2d
created: 2026-05-25
issue: https://github.com/andorthehood/8f4e/issues/683
status: Open
completed: null
---

# TODO: Split compiler context phase types

## Problem Description

`CompilationContext` is shared across namespace prepass, module compilation, function compilation, stack analysis, and code generation. Many fields are optional even when a given phase requires them, including `mode`, function signature state, function type registry, and module layout fields.

That broad shape causes defensive checks and non-null assertions in function-specific compilers and final compile assembly.

The overall hardening goal is to encode phase-specific compiler guarantees in TypeScript. If a function-only instruction can only run while compiling a function, its context type should expose function state as required. If a module-only path requires module layout state, the type should say that directly. Runtime ambiguity should be reserved for source-level semantic errors, not compiler-internal phase contracts.

## Proposed Solution

Introduce phase-specific context types with a required discriminant:

- `NamespacePrepassContext`
- `ModuleCompilationContext`
- `FunctionCompilationContext`
- Keep `CodegenContext` derived from the relevant compilation context without stack-analysis-only state.

Function instruction compilers should receive a context where `currentFunctionSignature` and `functionTypeRegistry` are present by type. Module compilers should receive a context where module layout fields are present by type.

This should make the compiler pipeline read more like a set of typed stages: prepass builds layout metadata, stack analysis consumes normalized lines, and codegen receives already-analyzed lines plus the context fields that are valid for that stage.

## Implementation Plan

### Step 1: Define Phase Interfaces

- Keep the existing shared fields in a base context type.
- Add required `mode` values for module and function contexts.
- Move phase-only optional fields into the narrower interfaces.

### Step 2: Narrow Context Creation

- Update `createCompilationContext(...)` to either return the correct generic context or add dedicated creation helpers.
- Preserve test helpers by making their overrides explicit about the target phase.

### Step 3: Narrow Compiler Entrypoints

- Update `compileModule`, `compileFunction`, and namespace prepass functions to use the narrower types.
- Update instruction compiler signatures for function-only instructions such as `param`, `functionEnd`, `#export`, and `#impure` where useful.

### Step 4: Remove Defensive Checks

- Remove checks and assertions that only exist because required phase fields are optional in the shared type.
- Keep semantic user-code validation, such as invalid instruction scope errors.

## Validation Checkpoints

- Run `npx nx run compiler-spec:typecheck`.
- Run `npx nx run compiler:typecheck`.
- Run `npx nx run compiler:test`.
- Check `rg -n "currentFunctionSignature!|functionTypeRegistry\\)|functionTypeRegistry\\?" packages/compiler/src`.

## Success Criteria

- [ ] `mode` is required on phase-specific compiler contexts.
- [ ] Function compilation code can access function signature and type registry without non-null assertions.
- [ ] Module compilation code can access module layout fields without fallback defaults for internally guaranteed state.
- [ ] Compiler tests and typechecks pass.

## Affected Components

- `packages/compiler-spec/src/semantic.ts`
- `packages/compiler/src/semantic/createCompilationContext.ts`
- `packages/compiler/src/compiler.ts`
- `packages/compiler/src/instructionCompilers/param.ts`
- `packages/compiler/src/instructionCompilers/functionEnd.ts`
- compiler test utilities

## Risks & Considerations

- **Test fixture risk**: Many tests construct partial contexts; update helpers instead of weakening production types.
- **Scope validation risk**: Do not remove runtime validation that reports invalid user programs.
- **Wrong-goal risk**: Avoid adding more optional properties or runtime fallbacks to quiet TypeScript. The point is to make valid phase states explicit and invalid phase states unrepresentable.
- **Dependency**: This can follow TODO 413, but does not strictly depend on it.

## Related Items

- **Follows**: `413-split-compiled-function-lifecycle-types.md`
- **Related**: `397-finish-compiler-stack-analysis-codegen-separation.md`
