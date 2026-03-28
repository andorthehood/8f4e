---
title: 'TODO: Move identifier existence validation into semantic pass and shrink codegen validation'
priority: Medium
effort: 4-8h
created: '2026-03-28'
status: Open
completed: null
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

The `map`/`default` late `EXPECTED_VALUE` fallbacks have been moved into the semantic pass:

- `packages/compiler/src/semantic/normalizeCompileTimeArguments.ts` now throws `UNDECLARED_IDENTIFIER` when a `map` or `default` argument is still an unresolved `IDENTIFIER` after normalization.
- The redundant `else { throw EXPECTED_VALUE }` branches have been removed from `packages/compiler/src/instructionCompilers/map.ts`.

### Remaining

The following sites still discover undeclared-identifier/reference errors at codegen time and should be moved to the semantic pass:

- [packages/compiler/src/instructionCompilers/localGet.ts](/packages/compiler/src/instructionCompilers/localGet.ts)
  - throws `UNDECLARED_IDENTIFIER` when the named local is not in `context.locals`
- [packages/compiler/src/instructionCompilers/localSet.ts](/packages/compiler/src/instructionCompilers/localSet.ts)
  - throws `UNDECLARED_IDENTIFIER` when the named local is not in `context.locals`
- [packages/compiler/src/instructionCompilers/push/handlers/pushMemoryIdentifier.ts](/packages/compiler/src/instructionCompilers/push/handlers/pushMemoryIdentifier.ts)
  - throws `UNDECLARED_IDENTIFIER` when the memory item is absent from the namespace
- [packages/compiler/src/instructionCompilers/push/handlers/pushMemoryPointer.ts](/packages/compiler/src/instructionCompilers/push/handlers/pushMemoryPointer.ts)
  - throws `UNDECLARED_IDENTIFIER` when the pointer base is absent from the namespace
- [packages/compiler/src/instructionCompilers/push/handlers/pushLocal.ts](/packages/compiler/src/instructionCompilers/push/handlers/pushLocal.ts)
  - throws `UNDECLARED_IDENTIFIER` when the local is not in `context.locals`
- [packages/compiler/src/utils/resolveIntermodularReferenceValue.ts](/packages/compiler/src/utils/resolveIntermodularReferenceValue.ts)
  - throws `UNDECLARED_IDENTIFIER` for missing module or memory targets in intermodule references; the module/memory existence checks at the intermodule level should be validated during the semantic prepass rather than on first codegen access

For locals (`localGet`, `localSet`, `pushLocal`), the right place to enforce existence is after the semantic prepass has collected all `local` declarations for the enclosing scope.

For memory identifiers and intermodule references, the right place is the existing `prepassNamespace`/`normalizeCompileTimeArguments` pipeline or a dedicated semantic validation step that runs before `compileModule`.

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

- [ ] `localGet`, `localSet`, and `pushLocal` no longer throw `UNDECLARED_IDENTIFIER` — local existence is validated before codegen.
- [ ] `pushMemoryIdentifier` and `pushMemoryPointer` no longer throw `UNDECLARED_IDENTIFIER` — memory existence is validated in the semantic prepass.
- [ ] `resolveIntermodularReferenceValue` no longer throws `UNDECLARED_IDENTIFIER` for module/memory targets — intermodule reference legality is validated in the semantic prepass.
- [ ] Instruction compilers do not rediscover undeclared-identifier errors for any syntax-valid reference that the semantic pass should already have resolved.
- [ ] Remaining codegen validation is limited to stack/type/lowering concerns.
- [ ] Compiler tests reflect the earlier semantic error boundary (assertions on `ErrorCode.UNDECLARED_IDENTIFIER` live in semantic-pass tests, not instruction-compiler tests).
- [ ] Another agent can identify the intended ownership boundary from this todo without needing chat history.

## References

- [packages/compiler/src/semantic](/packages/compiler/src/semantic)
- [packages/compiler/src/compiler.ts](/packages/compiler/src/compiler.ts)
- [packages/compiler/src/instructionCompilers](/packages/compiler/src/instructionCompilers)
- [packages/compiler/src/utils/memoryIdentifier.ts](/packages/compiler/src/utils/memoryIdentifier.ts)
- [packages/compiler/src/utils/resolveIntermodularReferenceValue.ts](/packages/compiler/src/utils/resolveIntermodularReferenceValue.ts)

