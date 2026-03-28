---
title: 'TODO: Add structured address and query extraction to tokenizer'
priority: Medium
effort: 4-8 hours
created: 2026-03-27
status: Open
completed: null
---

# 337 - Add structured address and query extraction to tokenizer

- Priority: 🟡 Medium
- Effort: 4-8h
- Created: 2026-03-27
- Status: Active

## Summary

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

## Goal

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

## Proposed Refactor

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

This should eliminate the need for compiler-side “base extraction” logic for these syntax forms.

### 3. Remove compiler-side syntax reconstruction

Once the AST already contains the extracted structure, compiler semantic/codegen paths should stop doing:

- string slicing
- regex re-matching
- `extract...Base(...)` calls
- repeated local/intermodule detection

and instead consume the AST fields directly.

## Success Criteria

- Address/query identifier arguments carry their extracted target structure directly in the AST.
- Compiler code no longer needs dedicated helper functions just to recover module/memory ids or start/end/pointee flags from raw strings.
- The parser/compiler boundary becomes clearer: parser extracts syntax shape, compiler resolves meaning.

## Notes

This is a follow-up to:

- 336 `Move identifier reference classification into tokenizer`

336 is about identifying what class an identifier-shaped token belongs to.
337 is about embedding the parsed structure of those classified address/query forms directly into the AST.
