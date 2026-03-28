---
id: 344
title: 'TODO: Move identifier existence validation into semantic pass and shrink codegen validation'
status: Open
owner: []
created: '2026-03-28'
updated: '2026-03-28'
labels:
  - compiler
  - semantic-pass
  - validation
dependencies:
  - 336
  - 337
  - 343
priority: medium
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

The remaining late fallback in `map` is an example of this boundary. It is no longer about malformed raw syntax getting past the tokenizer. It is about whether semantic normalization has resolved a value into a codegen-ready literal/string-literal before lowering:

- [packages/compiler/src/instructionCompilers/map.ts](/packages/compiler/src/instructionCompilers/map.ts)

That means it belongs here rather than in [343-move-arity-and-raw-argument-shape-validation-into-tokenizer.md](/docs/todos/343-move-arity-and-raw-argument-shape-validation-into-tokenizer.md).

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
- semantic validity of resolved references once namespaces/layout are known
- guarantees that compile-time-normalizable arguments have been normalized before codegen consumes them
- unresolved identifier/reference failures for syntax-valid AST inputs that are semantically invalid

### Keep in codegen

- stack validation
- resolved operand type compatibility
- lowering/runtime-specific constraints
- block/scope validation that still depends on active codegen block-stack state

## Concrete Targets

These are the main places another agent should inspect first:

- [packages/compiler/src/instructionCompilers/map.ts](/packages/compiler/src/instructionCompilers/map.ts)
  - remaining late `EXPECTED_VALUE` branch around semantically unresolved values
- [packages/compiler/src/instructionCompilers/push.ts](/packages/compiler/src/instructionCompilers/push.ts)
  - still a central downstream consumer of identifier-shaped arguments
- [packages/compiler/src/instructionCompilers/push/resolveIdentifierPushKind.ts](/packages/compiler/src/instructionCompilers/push/resolveIdentifierPushKind.ts)
  - likely to simplify as more semantic guarantees move earlier
- [packages/compiler/src/semantic/buildNamespace.ts](/packages/compiler/src/semantic/buildNamespace.ts)
  - semantic ownership point for name/reference validation
- [packages/compiler/src/semantic/normalizeCompileTimeArguments.ts](/packages/compiler/src/semantic/normalizeCompileTimeArguments.ts)
  - normalization boundary where unresolved values should start failing earlier
- [packages/compiler/src/semantic/resolveCompileTimeArgument.ts](/packages/compiler/src/semantic/resolveCompileTimeArgument.ts)
  - core semantic resolution logic for identifier-shaped compile-time values
- [packages/compiler/src/utils/resolveIntermodularReferenceValue.ts](/packages/compiler/src/utils/resolveIntermodularReferenceValue.ts)
  - intermodule reference legality and resolution path

Secondary likely consumers:

- [packages/compiler/src/instructionCompilers/default.ts](/packages/compiler/src/instructionCompilers/default.ts)
- [packages/compiler/src/semantic/instructions/init.ts](/packages/compiler/src/semantic/instructions/init.ts)
- [packages/compiler/src/utils/memoryIdentifier.ts](/packages/compiler/src/utils/memoryIdentifier.ts)

## Steps

### 1. Identify codegen-time existence checks

Audit instruction compilers and helpers for undeclared-identifier/reference checks that should happen before lowering.

Focus on checks that answer questions like:

- does this const exist?
- does this memory id exist?
- does this intermodule module or memory target exist?
- should this syntax-valid identifier/query/address form already have been normalized into a literal?

### 2. Move existence validation into semantic normalization / planning

Use the semantic pass to validate:

- constants
- memory references
- local vs intermodule targets
- address/query target existence
- map/default/init inputs that should already be resolved into codegen-ready forms

This step should prefer failing in semantic utilities rather than adding new downstream fallback branches.

### 3. Remove duplicate existence checks from instruction compilers

After semantic validation owns those failures, simplify instruction compilers so they assume referenced entities already exist.

If a failure can only happen because semantic normalization/planning failed to enforce its own invariant, fix the semantic layer rather than preserving a compensating codegen fallback.

### 4. Leave only codegen-specific validation behind

Instruction compilers should retain only:

- stack/operand availability
- resolved operand type rules
- lowering constraints

## Acceptance Criteria

- [ ] Undeclared const/memory/module errors are raised during semantic processing, not codegen.
- [ ] Instruction compilers stop doing semantic existence validation that the semantic pass already guarantees.
- [ ] Codegen no longer needs late fallback branches for semantically unresolved-but-syntax-valid values such as the remaining `map` case.
- [ ] Remaining codegen validation is limited to stack/type/lowering concerns.
- [ ] Compiler tests reflect the earlier semantic error boundary.
- [ ] Another agent can identify the intended ownership boundary from this todo without needing chat history.

## References

- [packages/compiler/src/semantic](/packages/compiler/src/semantic)
- [packages/compiler/src/compiler.ts](/packages/compiler/src/compiler.ts)
- [packages/compiler/src/instructionCompilers](/packages/compiler/src/instructionCompilers)
- [packages/compiler/src/utils/memoryIdentifier.ts](/packages/compiler/src/utils/memoryIdentifier.ts)
- [packages/compiler/src/utils/resolveIntermodularReferenceValue.ts](/packages/compiler/src/utils/resolveIntermodularReferenceValue.ts)
