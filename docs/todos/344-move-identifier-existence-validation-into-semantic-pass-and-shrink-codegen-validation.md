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

## Goal

Move semantic validation earlier so the boundary becomes:

- tokenizer validates syntax and raw argument shape
- semantic pass validates identifier existence and reference legality
- codegen focuses on stack/type/lowering concerns only

## Scope

### Move into semantic pass

- const existence validation
- memory existence validation
- module/intermodule target existence validation
- semantic validity of resolved references once namespaces/layout are known

### Keep in codegen

- stack validation
- resolved operand type compatibility
- lowering/runtime-specific constraints

## Steps

### 1. Identify codegen-time existence checks

Audit instruction compilers and helpers for undeclared-identifier/reference checks that should happen before lowering.

### 2. Move existence validation into semantic normalization / planning

Use the semantic pass to validate:

- constants
- memory references
- local vs intermodule targets
- address/query target existence

### 3. Remove duplicate existence checks from instruction compilers

After semantic validation owns those failures, simplify instruction compilers so they assume referenced entities already exist.

### 4. Leave only codegen-specific validation behind

Instruction compilers should retain only:

- stack/operand availability
- resolved operand type rules
- lowering constraints

## Acceptance Criteria

- [ ] Undeclared const/memory/module errors are raised during semantic processing, not codegen.
- [ ] Instruction compilers stop doing semantic existence validation that the semantic pass already guarantees.
- [ ] Remaining codegen validation is limited to stack/type/lowering concerns.
- [ ] Compiler tests reflect the earlier semantic error boundary.

## References

- [packages/compiler/src/semantic](/Users/andorpolgar/git/8f4e/packages/compiler/src/semantic)
- [packages/compiler/src/compiler.ts](/Users/andorpolgar/git/8f4e/packages/compiler/src/compiler.ts)
- [packages/compiler/src/instructionCompilers](/Users/andorpolgar/git/8f4e/packages/compiler/src/instructionCompilers)
- [packages/compiler/src/utils/memoryIdentifier.ts](/Users/andorpolgar/git/8f4e/packages/compiler/src/utils/memoryIdentifier.ts)
- [packages/compiler/src/utils/resolveIntermodularReferenceValue.ts](/Users/andorpolgar/git/8f4e/packages/compiler/src/utils/resolveIntermodularReferenceValue.ts)
