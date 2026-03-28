---
id: 343
title: 'TODO: Move arity and raw argument-shape validation into tokenizer'
status: Open
owner: []
created: '2026-03-28'
updated: '2026-03-28'
labels:
  - compiler
  - tokenizer
  - validation
dependencies:
  - 339
priority: medium
---

# 343 - Move arity and raw argument-shape validation into tokenizer

## Summary

Many instruction compilers still validate argument count and raw argument shape even when those checks depend only on instruction syntax. These checks should move into `@8f4e/tokenizer` so malformed instruction calls fail before semantic resolution or codegen.

## Problem

Instruction compilers are still responsible for some errors that should be discovered earlier, for example:

- wrong number of arguments
- malformed literal vs identifier vs string-literal shapes
- malformed syntax-only reference/query forms in argument positions

That makes the codegen layer heavier than it needs to be and weakens the tokenizer/compiler boundary.

## Goal

Make `@8f4e/tokenizer` the owner of:

- instruction arity validation
- raw per-position argument-shape validation
- syntax-only argument-rule errors

The compiler should receive AST lines whose argument count and raw argument shapes are already valid.

## Scope

### Move into tokenizer

- wrong number of arguments for known instructions
- required argument-shape checks that do not need semantic context
- malformed syntax-only argument forms

Examples:

- `add 1`
- `push` with no argument
- invalid raw string-literal form where a string literal is required
- malformed compile-time expression syntax

### Keep out of tokenizer

- identifier existence
- semantic scope validity that depends on collected context
- resolved operand type compatibility
- stack/codegen validation

## Steps

### 1. Define instruction arity and raw-shape metadata in tokenizer

Extend tokenizer-owned instruction metadata so AST generation can validate:

- min/max or exact arity
- allowed raw argument kinds per position

This should complement:

- [339-add-instruction-classification-metadata-to-ast-lines.md](/Users/andorpolgar/git/8f4e/docs/todos/339-add-instruction-classification-metadata-to-ast-lines.md)

### 2. Enforce syntax-only validation during parsing

Update tokenizer parsing so syntax-only invalid instruction calls throw tokenizer syntax errors before the compiler sees them.

### 3. Remove duplicate arity/raw-shape checks from instruction compilers

Delete instruction-compiler validation branches that only restate tokenizer-owned syntax rules.

## Acceptance Criteria

- [ ] Wrong-arity instruction calls fail in tokenizer, not instruction compilers.
- [ ] Raw argument-shape violations that do not need semantic context fail in tokenizer.
- [ ] Compiler instruction compilers stop duplicating tokenizer-owned syntax validation.
- [ ] Existing compiler tests are updated to assert tokenizer/parse-stage failures where appropriate.

## References

- [packages/tokenizer/src/parser.ts](/Users/andorpolgar/git/8f4e/packages/tokenizer/src/parser.ts)
- [packages/tokenizer/src/syntax/parseArgument.ts](/Users/andorpolgar/git/8f4e/packages/tokenizer/src/syntax/parseArgument.ts)
- [packages/tokenizer/src/syntax/instructionParser.ts](/Users/andorpolgar/git/8f4e/packages/tokenizer/src/syntax/instructionParser.ts)
- [packages/compiler/src/withValidation](/Users/andorpolgar/git/8f4e/packages/compiler/src/withValidation)
- [packages/compiler/src/instructionCompilers](/Users/andorpolgar/git/8f4e/packages/compiler/src/instructionCompilers)
