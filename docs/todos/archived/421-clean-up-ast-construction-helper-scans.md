---
title: 'TODO: Clean up AST construction helper scans'
priority: Medium
effort: 4-8h
created: 2026-05-26
issue: null
status: Done
completed: 2026-05-26
---

# TODO: Clean up AST construction helper scans

## Problem Description

TODO 420 introduced typed top-level AST objects such as `ModuleAST`, `FunctionAST`, and `ConstantsAST`, but the implementation still derives several fields by running separate helper scans over `CompilerASTLine[]` after the line array has already been built.

Examples from `packages/compiler/packages/tokenizer/src/parser.ts` include helpers like:

- `getReferencedModuleIds(lines)`
- `getRegionLine(lines)`
- `getMemoryDeclarationLines(lines)`
- `getExportLine(lines)`
- `getFunctionSignature(lines, functionEndLine)`

This is better than making later compiler phases rediscover those facts, but it is still not the intended final shape. The overall goal of the compiler type-interface work is to use strict, source-block-specific AST objects so ambiguity is resolved during parsing or coherent AST construction, not handled by scattered runtime discovery loops.

Future agents should not treat "move the loop from compiler code into tokenizer code" as the endpoint. The endpoint is a proper AST construction interface that owns module/function/constants metadata directly.

## Proposed Solution

Refactor AST construction so each source-block type is built through a cohesive, source-block-specific path instead of independent helper scans over generic line arrays.

The implementation should make it obvious which metadata belongs to which group:

- module construction owns `moduleLine`, optional `regionLine`, `memoryDeclarationLines`, and `referencedModuleIds`;
- function construction owns `functionLine`, `functionEndLine`, `signature`, optional `exportLine`, and optional `exportName`;
- constants construction owns `constantsLine`;
- line arrays remain available as `lines`, but metadata should not be repeatedly rediscovered through unrelated helpers.

If a field can be accumulated while parsing each line, prefer accumulating it there. If a single source-block construction pass is still simpler, make that pass explicit and group-specific rather than a collection of broad helper scans.

## Anti-Patterns

- Do not add more helpers that accept `readonly CompilerASTLine[]` and perform `.find`, `.filter`, `.some`, or manual loops to derive top-level AST metadata.
- Do not introduce compatibility aliases or wrapper types to preserve the old line-array mental model.
- Do not add fallback runtime checks in codegen for facts the tokenizer/parser should already guarantee.
- Do not make a generic metadata bag or optional-field-heavy AST object.
- Do not hide metadata from snapshots or serialized output to keep the PR visually small.

## Implementation Plan

### Step 1: Inventory AST construction scans

- Search tokenizer/parser code for helpers and inline loops that inspect `CompilerASTLine[]` after parsing.
- Classify each scan as either source-block metadata construction or legitimate sequential parsing/validation.
- Keep sequential validation loops that must process source order, but identify metadata extraction loops that should collapse into source-block construction.

### Step 2: Design source-block construction helpers

- Replace generic post-processing helpers with explicit construction paths for module, function, and constants ASTs.
- Keep metadata derivation local to the group constructor that owns the resulting fields.
- Prefer one coherent pass over `lines` per group if metadata cannot be accumulated during line parsing yet.

### Step 3: Remove scattered helper scans

- Delete or inline helpers such as `getReferencedModuleIds`, `getRegionLine`, `getMemoryDeclarationLines`, `getExportLine`, and `getFunctionSignature` once their responsibilities are owned by group construction.
- Make the remaining parser code read as "build module AST", "build function AST", or "build constants AST", not "build line array and decorate it with discovered fields."

### Step 4: Verify compiler consumers stayed simple

- Confirm compiler phases still consume typed AST fields rather than re-scanning `ast.lines`.
- Do not reintroduce downstream fallback searches to compensate for weaker parser construction.

## Validation Checkpoints

- `rg -n "function get.*\\(lines: readonly CompilerASTLine\\[\\]|\\.find\\(|\\.filter\\(|\\.some\\(|for \\(const .* of lines\\)" packages/compiler/packages/tokenizer/src/parser.ts`
- `rg -n "ModuleCompilationAST|CompilerASTGroup|compileToASTGroup" packages/compiler-spec/src packages/compiler/src packages/compiler/packages/tokenizer/src -g '*.ts'`
- `rg -n "ast\\.lines\\.find|ast\\.lines\\.filter|ast\\.lines\\.some" packages/compiler/src packages/compiler-spec/src -g '*.ts'`
- `npx nx run @8f4e/tokenizer:typecheck`
- `npx nx run compiler:typecheck`
- `npx nx run @8f4e/tokenizer:test`
- `npx nx run compiler:test`

## Success Criteria

- [x] Top-level AST metadata is constructed through source-block-specific code, not scattered generic line-array helper scans.
- [x] Helpers whose only job is post-processing `CompilerASTLine[]` for module/function metadata are removed.
- [x] Compiler phases continue reading typed AST fields rather than rediscovering ids, directives, declarations, signatures, or references.
- [x] No compatibility layers, hidden metadata, or fallback runtime checks are introduced.
- [x] The AST construction code makes the ownership of module/function/constants metadata obvious to a new agent.

## Affected Components

- `packages/compiler/packages/tokenizer/src/parser.ts` - source-block AST construction and helper cleanup.
- `packages/compiler-spec/src/ast.ts` - AST interface shape if any constructor-owned metadata needs tightening.
- `packages/compiler/src/graphOptimizer.ts` - should continue consuming `ModuleAST.referencedModuleIds`.
- `packages/compiler/src/semantic/` - should continue consuming typed AST metadata without rediscovery.
- `packages/compiler/packages/tokenizer/src/parser.test.ts` - coverage for module/function/constants AST metadata.

## Risks & Considerations

- **Do not regress into compatibility mode**: This project is not released yet; update callers directly and delete old names/paths instead of preserving aliases.
- **Avoid over-broad AST objects**: The fix should make metadata ownership more specific, not collect everything into a generic object.
- **Keep parser validation boundaries clear**: Syntax-shape errors belong in tokenizer/parser validation. Semantic checks still belong in compiler semantic phases.
- **Scope control**: This todo is about cleaning up AST construction metadata derivation, not solving every remaining namespace/prepass repetition.

## Related Items

- **Follows up**: `docs/todos/420-add-typed-compiler-ast-group-indexes.md`
- **Related**: `docs/agent_failure_notes/054-moving-runtime-discovery-into-ast-construction.md`
- **Related**: `docs/todos/378-make-parser-stateful-for-block-pairing-and-owning-block-context.md`
- **Related**: `docs/todos/406-review-compiler-namespace-prepass-repetition.md`

## Notes

- The lesson from TODO 420 is that removing downstream scans is not enough if the parser simply grows equivalent post-processing scans. The AST interface work should remove ambiguity, not relocate it.
- This todo should be handled as cleanup before adding more AST metadata fields, otherwise future agents may copy the same helper-scan pattern.
