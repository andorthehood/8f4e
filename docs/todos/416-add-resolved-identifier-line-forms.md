---
title: 'TODO: Add resolved identifier line forms'
priority: Medium
effort: 1-2d
created: 2026-05-25
issue: https://github.com/andorthehood/8f4e/issues/685
status: Open
completed: null
---

# TODO: Add resolved identifier line forms

## Problem Description

Semantic normalization validates identifiers, but later phases still index into memory, local, and function maps with non-null assertions. Examples include resolved `push` targets and `call` targets.

The current contract is "normalization already checked this"; the type system does not carry the proof into stack analysis and codegen.

The overall goal is to stop handling already-resolved compiler facts as runtime ambiguity. Once semantic normalization proves that an identifier refers to a specific memory item, local binding, pointer target, or function, that resolved target should travel with the normalized line. Later stages should consume the proof instead of repeating lookups or guarding against impossible misses.

## Project Compatibility Note

This project has not been released yet and we own the whole codebase. Do not add compatibility layers, legacy aliases, adapter shims, or fallback paths just to preserve broad internal interfaces. Prefer changing the type contracts directly and updating all call sites in the repo.

## Proposed Solution

Add normalized/resolved line forms that carry resolved bindings or a narrow resolved target kind:

- `ResolvedCallLine` with the target function metadata.
- `ResolvedMemoryPushLine` for memory reads.
- `ResolvedMemoryPointerPushLine` and `ResolvedLocalPointerPushLine` for pointer dereference paths.
- `ResolvedLocalPushLine` for local reads.

Stack analysis and codegen should consume these resolved forms instead of rediscovering map entries.

This keeps the compiler stage boundary honest: semantic normalization owns symbol resolution and user-facing undeclared-identifier errors; stack analysis and codegen own stack effects and bytecode emission from trusted resolved inputs.

## Implementation Plan

### Step 1: Model Resolved Targets

- Add target-specific normalized types in `packages/compiler-spec/src/semantic.ts` or a compiler-private type module based on ownership boundaries, not compatibility concerns.
- Keep source AST shape unchanged; this is an internal normalized/codegen contract.

### Step 2: Update Semantic Normalization

- Update `normalizePush` and `normalizeCall` to return resolved line forms once identifier existence has been validated.
- Continue to defer intermodule references during namespace discovery where needed.

### Step 3: Update Stack Analysis and Codegen

- Replace `getDataStructure(...)!`, `context.locals[...]!`, and `context.namespace.functions![...]!` in resolved paths with fields from the resolved line.
- Keep user-facing semantic errors in normalization, not codegen.

## Validation Checkpoints

- Run `npx nx run compiler-spec:typecheck`.
- Run `npx nx run compiler:typecheck`.
- Run `npx nx run compiler:test`.
- Check `rg -n "getDataStructure\\(.*\\)!|context\\.locals\\[.*\\]!|namespace\\.functions!" packages/compiler/src`.

## Success Criteria

- [ ] `push` codegen paths consume resolved target forms.
- [ ] `call` stack analysis and codegen consume a resolved function target.
- [ ] Non-null assertions around already-validated identifiers are removed from stack analysis and codegen.
- [ ] Compiler behavior and diagnostics remain stable.

## Affected Components

- `packages/compiler-spec/src/semantic.ts`
- `packages/compiler/src/semantic/normalization/push.ts`
- `packages/compiler/src/semantic/normalization/call.ts`
- `packages/compiler/src/stackAnalysis/analyzeInstruction.ts`
- `packages/compiler/src/instructionCompilers/call.ts`
- `packages/compiler/src/instructionCompilers/push/`

## Risks & Considerations

- **Ownership boundary**: Decide whether resolved line forms belong in `compiler-spec` or should remain compiler-internal. If exported types need to change, update all repo consumers directly instead of preserving old shapes with compatibility shims.
- **Deferral risk**: Intermodule namespace deferral must keep working during prepass.
- **Wrong-goal risk**: Do not replace `!` with extra late-stage runtime checks. If a target was already validated, carry the target through the type interface.
- **Dependency**: This is easier after TODO 414 because phase-specific context types clarify which maps are available.

## Related Items

- **Follows**: `414-split-compiler-context-phase-types.md`
- **Related**: `344` in archived todos moved identifier existence validation into semantic normalization.
