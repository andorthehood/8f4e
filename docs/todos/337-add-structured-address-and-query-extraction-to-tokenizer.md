---
title: 'TODO: Add structured address and query extraction to tokenizer'
priority: Medium
effort: 4-8 hours
created: 2026-03-27
status: Open
completed: null
---

# TODO: Add structured address and query extraction to tokenizer

## Problem Description

Even after identifier/reference classification moves into `@8f4e/tokenizer`, the compiler would still be doing unnecessary syntax reconstruction if address-style and metadata-query-style identifiers continue to flow through as mostly raw strings.

The parser should not only classify:

- `&buffer`
- `buffer&`
- `&module:buffer`
- `module:buffer&`
- `&module:`
- `module:&`
- `count(...)`
- `sizeof(...)`
- `max(...)`
- `min(...)`

but also extract their structured parts directly into the AST argument object.

Current reconstruction still shows up through compiler-side helpers and raw string handling in places like:

- `packages/compiler/src/semantic/buildNamespace.ts`
- `packages/compiler/src/semantic/normalization/helpers.ts`
- `packages/compiler/src/utils/resolveIntermodularReferenceValue.ts`
- `packages/compiler/src/graphOptimizer.ts`

That keeps syntax extraction spread across tokenizer and compiler instead of making tokenizer the single owner of syntax structure.

## Proposed Solution

Make the AST carry the parsed structure of address/query forms so the compiler no longer needs separate `extract...Base(...)`-style helpers to recover syntax information from raw strings.

## Scope

This TODO covers structured extraction for:

- local memory address references
- intermodule memory address references
- intermodule module-address references
- element-count queries
- element-word-size queries
- element-max queries
- element-min queries
- pointee metadata-query forms such as `sizeof(*ptr)` and `max(*ptr)`

### 1. Store parsed target information directly on identifier arguments

For relevant `ArgumentType.IDENTIFIER` nodes, the AST should carry the parsed fields directly, for example:

- `targetModuleId`
- `targetMemoryId`
- `scope`
- `isStartAddress`
- `isEndAddress`
- `isPointee`

### 2. Move extraction logic fully into tokenizer

Address/query extraction currently spread across helper functions should be owned by `packages/tokenizer/src/syntax/` and represented directly in the parsed argument output.

This should eliminate the need for compiler-side “base extraction” logic for these syntax forms rather than just sharing the extraction helpers across package boundaries.

### 3. Remove compiler-side syntax reconstruction

Once the AST already contains the extracted structure, compiler semantic/codegen paths should stop doing:

- string slicing
- regex re-matching
- `extract...Base(...)` calls
- repeated local/intermodule detection

and instead consume the AST fields directly.

## Anti-Patterns

- Do not leave extraction in tokenizer helpers while still calling those helpers from compiler code.
- Do not move semantic address/value resolution into tokenizer.
- Do not treat this as complete if compiler code still needs `extract...Base(...)`-style helpers just to understand syntax structure.
- Do not duplicate the extraction metadata in multiple parallel AST fields with overlapping meanings.

## Implementation Plan

### Step 1: Inventory current extraction helpers and consumers

- Identify which tokenizer helpers currently reconstruct structured parts from raw strings.
- Identify where compiler still depends on them directly.
- Start from:
  - `packages/tokenizer/src/syntax/`
  - `packages/compiler/src/semantic/buildNamespace.ts`
  - `packages/compiler/src/semantic/normalization/helpers.ts`
  - `packages/compiler/src/utils/resolveIntermodularReferenceValue.ts`
  - `packages/compiler/src/graphOptimizer.ts`

### Step 2: Add extracted address/query fields to AST identifier arguments

- Extend tokenizer AST types so classified address/query identifiers carry their parsed structure directly.
- Keep the field shape small and consistent with `336`.

### Step 3: Replace compiler-side extraction usage

- Update compiler consumers to read AST fields instead of calling extraction helpers or slicing strings.
- Keep only semantic resolution in compiler.

### Step 4: Remove obsolete extraction helpers from compiler-facing flow

- Delete or deprecate compiler-visible extraction dependencies that are no longer needed once AST carries the structure.

## Validation Checkpoints

- `rg -n "extract.*Base|split\\(':\\')|slice\\(0, -1\\)|slice\\(1\\)" packages/compiler/src`
- `npx nx run @8f4e/tokenizer:build --skipNxCache`
- `npx nx run @8f4e/compiler:typecheck --skipNxCache`
- `npx nx run compiler:test --skipNxCache`

## Success Criteria

- Address/query identifier arguments carry their extracted target structure directly in the AST.
- Compiler code no longer needs dedicated helper functions just to recover module/memory ids or start/end/pointee flags from raw strings.
- The parser/compiler boundary becomes clearer: parser extracts syntax shape, compiler resolves meaning.
- This TODO is not complete while compiler still reconstructs address/query structure from raw identifier strings.

## Affected Components

- `packages/tokenizer/src/syntax/`
- `packages/tokenizer/src/types.ts`
- `packages/compiler/src/semantic/buildNamespace.ts`
- `packages/compiler/src/semantic/normalization/helpers.ts`
- `packages/compiler/src/utils/resolveIntermodularReferenceValue.ts`
- `packages/compiler/src/graphOptimizer.ts`

## Risks & Considerations

- **Risk 1**: overfitting the AST to current syntax helpers instead of designing a coherent structured representation.
- **Risk 2**: partially moving extraction so both raw-string helpers and AST fields remain in active use.
- **Dependency**: this builds on the classification ownership from `336` and should not duplicate that todo’s scope.

## Notes

This is a follow-up to:

- 336 `Move identifier reference classification into tokenizer`

336 is about identifying what class an identifier-shaped token belongs to.
337 is about embedding the parsed structure of those classified address/query forms directly into the AST.
