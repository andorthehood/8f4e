---
title: 'TODO: Move identifier reference classification into tokenizer'
priority: Medium
effort: 6-10 hours
created: 2026-03-27
status: Open
completed: null
---

# 336 - Move identifier reference classification into tokenizer

- Priority: 🟡 Medium
- Effort: 6-10h
- Created: 2026-03-27
- Status: Active

## Summary

The compiler still re-parses identifier-shaped argument strings in multiple places to determine what syntactic class they belong to, for example:

- memory identifier
- constant identifier
- pointer dereference identifier
- address identifier
- module-address identifier
- `count(...)`
- `sizeof(...)`
- `max(...)`
- `min(...)`

This logic belongs in `@8f4e/tokenizer`, because these classifications can be determined from token shape alone and should not be rediscovered by the semantic/compiler layer.

## Goal

Make `@8f4e/tokenizer` the single owner of identifier/reference classification, so the compiler receives structured identifier arguments instead of repeatedly re-parsing raw strings.

## Classification Scope

The AST parser should classify all currently supported identifier-shaped forms, including:

- `constant`
- `memory`
- `pointer-dereference`
- `address`
- `module-address`
- `element-count`
- `element-word-size`
- `element-max`
- `element-min`

The argument should also carry syntax-derived details such as:

- `scope`: `local` or `intermodule`
- `targetModuleId`
- `targetMemoryId`
- `isStartAddress`
- `isEndAddress`
- `isPointee`

## Proposed Refactor

### 1. Enrich `ArgumentType.IDENTIFIER`

Keep `ArgumentType.IDENTIFIER`, but extend the identifier argument object with explicit reference metadata instead of only storing `value`.

For example:

- `referenceKind`
- `scope`
- `targetModuleId`
- `targetMemoryId`
- `isStartAddress`
- `isEndAddress`
- `isPointee`

### 2. Move token-shape classification into tokenizer

Update `parseArgument(...)` and the existing syntax helpers in `packages/tokenizer/src/syntax/` so identifier arguments are classified during AST generation.

This should include local and intermodule forms for:

- memory references
- address references
- module address references
- metadata queries
- pointer dereference forms

### 3. Stop re-classifying raw strings in compiler semantics/codegen

Replace repeated string-shape checks in compiler code with direct use of the structured identifier metadata coming from the AST.

Likely cleanup targets include places that currently re-detect:

- constant-style names
- local vs intermodule references
- metadata query kinds
- address prefix/suffix forms
- pointee metadata forms

### 4. Keep semantic resolution in compiler

The compiler should still own semantic resolution:

- whether the referenced constant or memory item actually exists
- what address/value/metadata it resolves to
- semantic errors for unresolved or illegal references

Only the syntax classification should move.

## Success Criteria

- `@8f4e/tokenizer` emits structured identifier classification metadata.
- Compiler semantic/codegen layers stop re-parsing identifier strings to determine syntax class.
- Local vs intermodule and address/query/pointee forms are represented directly in AST arguments.
- The parser/compiler boundary becomes: syntax classification in parser, semantic resolution in compiler.

## Notes

This is a natural follow-up to:

- 332 `Extract syntax and AST parsing into a separate compiler package`

It also complements the semantic/codegen boundary cleanup by removing another class of syntax rediscovery from the compiler.
