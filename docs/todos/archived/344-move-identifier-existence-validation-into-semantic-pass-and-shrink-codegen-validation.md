---
title: 'TODO: Move identifier existence validation into semantic pass and shrink codegen validation'
priority: Medium
effort: 4-8h
created: '2026-03-28'
status: Completed
completed: '2026-03-29'
---

# 344 - Move identifier existence validation into semantic pass and shrink codegen validation

## Summary

The semantic pass should become the owner of identifier existence and semantic reference validation, so instruction compilers stop discovering undeclared const/memory/module errors during codegen.

## Problem

Even after syntax is parsed, instruction compilers still discover some errors that are already knowable before codegen, such as:

- undeclared constant
- undeclared memory item
- undeclared intermodule target
- invalid semantic reference target

This keeps codegen coupled to name-resolution concerns and makes instruction compilers carry error handling that should happen earlier.

## Progress

### Done

The following sites have been moved out of codegen and into the semantic pass (`normalizeCompileTimeArguments.ts`):

- **`map`/`default`**: Late `EXPECTED_VALUE` fallbacks removed from `packages/compiler/src/instructionCompilers/map.ts`; `normalizeCompileTimeArguments` now throws `UNDECLARED_IDENTIFIER` when a `map` or `default` argument is still an unresolved `IDENTIFIER` after normalization.
- **`localGet`/`localSet`**: `UNDECLARED_IDENTIFIER` existence checks removed from codegen; `normalizeCompileTimeArguments` now validates local existence before the per-line codegen step (by the time normalize runs, all preceding `local`/`param` declarations in the same compile pass have already populated `context.locals`).
- **`push` with undeclared identifier**: `UNDECLARED_IDENTIFIER` check removed from `pushLocal`; `normalizeCompileTimeArguments` now validates that a `push IDENTIFIER` argument resolves to a known memory item, memory pointer, memory reference, or declared local — anything else throws `UNDECLARED_IDENTIFIER`.
- **`pushMemoryIdentifier`/`pushMemoryPointer`**: Dead `UNDECLARED_IDENTIFIER` guards removed from codegen; existence is already guaranteed by `resolveIdentifierPushKind` routing (which checks `Object.hasOwn(memory, ...)` before dispatching).
- **`resolveIntermodularReferenceValue`**: `UNDECLARED_IDENTIFIER` throws removed and replaced with `undefined` returns when modules/memory aren't found; `normalizeCompileTimeArguments` now validates intermodule references (module existence and memory existence) after namespace collection is complete. Validation only runs when `context.namespace.namespaces` is populated (post-prepass), preserving the deferral mechanism used by `collectNamespacesFromASTs` during the initial discovery phase.

### Remaining

None — all identifier existence validation has been moved into the semantic pass.

## Goal

Move semantic validation earlier so the boundary becomes:

- tokenizer validates syntax and raw argument shape
- semantic pass validates identifier existence and reference legality
- codegen focuses on stack/type/lowering concerns only

After this refactor, instruction compilers should be able to assume:

- identifier-shaped arguments already refer to real semantic entities where required
- compile-time-normalizable values that must become literals/string-literals for lowering have already been normalized
- missing const/memory/module/reference targets are no longer discovered for the first time during codegen

## Scope

### Move into semantic pass

- const existence validation
- memory existence validation
- module/intermodule target existence validation
- local existence validation (post-declaration-collection)
- semantic validity of resolved references once namespaces/layout are known
- guarantees that compile-time-normalizable arguments have been normalized before codegen consumes them
- unresolved identifier/reference failures for syntax-valid AST inputs that are semantically invalid

### Keep in codegen

- stack validation
- resolved operand type compatibility
- lowering/runtime-specific constraints
- block/scope validation that still depends on active codegen block-stack state

## Acceptance Criteria

"Done" means: codegen no longer discovers `UNDECLARED_IDENTIFIER` errors for syntax-valid references that the semantic normalization/prepass should already have resolved.

- [x] `localGet`, `localSet`, and `pushLocal` no longer throw `UNDECLARED_IDENTIFIER` — local existence is validated by `normalizeCompileTimeArguments` before codegen.
- [x] `pushMemoryIdentifier` and `pushMemoryPointer` no longer throw `UNDECLARED_IDENTIFIER` — dead guards removed; existence is guaranteed by `resolveIdentifierPushKind` routing.
- [x] `push` with an unresolvable identifier throws `UNDECLARED_IDENTIFIER` in `normalizeCompileTimeArguments`, not in `pushLocal` codegen.
- [x] `resolveIntermodularReferenceValue` no longer throws `UNDECLARED_IDENTIFIER` for module/memory targets — intermodule reference legality is validated in the semantic normalization pass, post-namespace-collection.
- [x] Instruction compilers do not rediscover undeclared-identifier errors for any syntax-valid reference that the semantic pass now resolves.
- [x] Remaining codegen validation is limited to stack/type/lowering concerns.
- [x] Compiler tests reflect the earlier semantic error boundary (assertions on `ErrorCode.UNDECLARED_IDENTIFIER` live in `normalizeCompileTimeArguments` tests).
- [x] Another agent can identify the intended ownership boundary from this todo without needing chat history.

## References

- [packages/compiler/src/semantic](/packages/compiler/src/semantic)
- [packages/compiler/src/compiler.ts](/packages/compiler/src/compiler.ts)
- [packages/compiler/src/instructionCompilers](/packages/compiler/src/instructionCompilers)
- [packages/compiler/src/utils/memoryIdentifier.ts](/packages/compiler/src/utils/memoryIdentifier.ts)
- [packages/compiler/src/utils/resolveIntermodularReferenceValue.ts](/packages/compiler/src/utils/resolveIntermodularReferenceValue.ts)
