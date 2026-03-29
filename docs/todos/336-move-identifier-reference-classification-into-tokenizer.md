---
title: 'TODO: Move identifier reference classification into tokenizer'
priority: Medium
effort: 6-10 hours
created: 2026-03-27
status: Open
completed: null
---

# TODO: Move identifier reference classification into tokenizer

## Problem Description

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

Current compiler-side rediscovery still shows up in places like:

- `packages/compiler/src/semantic/buildNamespace.ts`
- `packages/compiler/src/semantic/normalization/helpers.ts`
- `packages/compiler/src/utils/resolveIntermodularReferenceValue.ts`
- `packages/compiler/src/graphOptimizer.ts`
- `packages/compiler/src/utils/memoryInstructionParser.ts`

That means syntax classification is still a mixed responsibility:

- tokenizer owns helper predicates
- compiler still calls those helpers and reconstructs meaning from raw strings

The goal of this todo is to end that mixed model. The compiler should consume classified AST data, not classify identifier syntax for itself.

## Proposed Solution

Make `@8f4e/tokenizer` the single owner of identifier/reference classification, so the compiler receives structured identifier arguments instead of repeatedly re-parsing raw strings.

### Classification Scope

The tokenizer should classify all currently supported identifier-shaped forms, including:

- plain memory identifier
- local identifier
- constant-style identifier
- pointer-dereference identifier
- local address reference
- intermodule memory address reference
- intermodule module-address reference
- element-count query
- element-word-size query
- element-max query
- element-min query
- pointee-address / pointee-query forms where syntax alone is sufficient to classify them

The argument should also carry syntax-derived details such as:

- `scope`: `local` or `intermodule`
- `targetModuleId`
- `targetMemoryId`
- `isStartAddress`
- `isEndAddress`
- `isPointee`

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

Update `parseArgument(...)` and the existing syntax helpers in `packages/tokenizer/src/syntax/` so identifier arguments are classified during AST generation instead of only exposing raw-string predicates.

This should include local and intermodule forms for:

- memory references
- address references
- module address references
- metadata queries
- pointer dereference forms

### 3. Stop re-classifying raw strings in compiler semantics/codegen

Replace repeated string-shape checks in compiler code with direct use of the structured identifier metadata coming from the AST.

Likely cleanup targets include places that currently re-detect or infer:

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

## Anti-Patterns

- Do not move semantic resolution into tokenizer.
- Do not keep raw-string fallback classification in compiler “for safety”.
- Do not treat this as complete if compiler code still branches on raw identifier string shape for syntax-only purposes.
- Do not solve this by merely exporting more tokenizer regex helpers to the compiler; the AST itself should carry the classification.

## Implementation Plan

### Step 1: Inventory current compiler-side syntax classification

- Audit compiler sites that still classify identifier strings by syntax alone.
- Separate true syntax classification from semantic lookup/resolution.
- Use the current hotspots as starting points:
  - `packages/compiler/src/semantic/buildNamespace.ts`
  - `packages/compiler/src/semantic/normalization/helpers.ts`
  - `packages/compiler/src/utils/resolveIntermodularReferenceValue.ts`
  - `packages/compiler/src/graphOptimizer.ts`
  - `packages/compiler/src/utils/memoryInstructionParser.ts`

### Step 2: Add tokenizer-owned classification fields to identifier arguments

- Extend tokenizer identifier argument shapes in:
  - `packages/tokenizer/src/types.ts`
  - `packages/tokenizer/src/syntax/parseArgument.ts`
- Reuse tokenizer syntax helpers only inside tokenizer.
- Emit classification metadata directly on the AST argument.

### Step 3: Migrate compiler consumers off raw-string classification

- Replace syntax-only branching in compiler with AST metadata reads.
- Leave semantic resolution, existence checks, and address/value computation in compiler.
- Delete compiler-side branches that only distinguish identifier syntax class.

### Step 4: Remove obsolete compiler-side syntax helpers

- Delete or narrow compiler helpers that only exist to classify identifier syntax from raw strings.
- Keep only semantic helpers that resolve already-classified forms.

## Validation Checkpoints

- `rg -n "isIntermodular|extract.*Base|isMemoryReference|isMemoryIdentifier|hasElement" packages/compiler/src`
- `npx nx run @8f4e/tokenizer:build --skipNxCache`
- `npx nx run @8f4e/compiler:typecheck --skipNxCache`
- `npx nx run compiler:test --skipNxCache`

## Success Criteria

- `@8f4e/tokenizer` emits structured identifier classification metadata.
- Compiler semantic/codegen layers stop re-parsing identifier strings to determine syntax class.
- Local vs intermodule and address/query/pointee forms are represented directly in AST arguments.
- The parser/compiler boundary becomes: syntax classification in parser, semantic resolution in compiler.
- This TODO is not complete while compiler code still performs syntax-only identifier classification from raw strings.

## Affected Components

- `packages/tokenizer/src/syntax/parseArgument.ts`
- `packages/tokenizer/src/types.ts`
- `packages/compiler/src/semantic/buildNamespace.ts`
- `packages/compiler/src/semantic/normalization/helpers.ts`
- `packages/compiler/src/utils/resolveIntermodularReferenceValue.ts`
- `packages/compiler/src/graphOptimizer.ts`
- `packages/compiler/src/utils/memoryInstructionParser.ts`

## Risks & Considerations

- **Risk 1**: pulling semantic meaning into tokenizer instead of only syntax classification.
- **Risk 2**: introducing new AST metadata but leaving compiler raw-string fallback paths in place, which would create dual ownership.
- **Dependency**: this should compose with `337` rather than duplicating the detailed extraction work there.

## Notes

This is a natural follow-up to:

- 332 `Extract syntax and AST parsing into a separate compiler package`

It also complements the semantic/codegen boundary cleanup by removing another class of syntax rediscovery from the compiler.
