---
title: 'TODO: Add instruction classification metadata to AST lines'
priority: Medium
effort: 4-8 hours
created: 2026-03-27
status: Open
completed: null
---

# TODO: Add instruction classification metadata to AST lines

## Problem Description

The parser already assigns some syntax-level line metadata such as `isSemanticOnly`, but the compiler still relies on repeated instruction-name checks and local string sets to decide what role a parsed line has.

That means syntax-level facts about instructions are still being rediscovered in compiler code instead of being emitted by `@8f4e/tokenizer`.

Several instruction properties can be determined entirely from syntax and instruction identity, for example:

- whether an instruction is semantic-only
- whether it is a memory declaration
- whether it starts a block
- whether it ends a block
- whether it introduces named declarations
- whether it is only valid in certain structural scopes

Today those facts are still partly encoded in compiler-side string lists and helper logic.

Current hotspots include:

- `packages/compiler/src/semantic/buildNamespace.ts`
- `packages/compiler/src/semantic/declarations/index.ts`
- `packages/compiler/src/semantic/instructions/index.ts`
- instruction dispatch and block-routing code that still switches on instruction names for syntax-only categories

That means line-level syntax classification is still split between tokenizer and compiler instead of being parser-owned.

## Proposed Solution

Make the AST line objects carry richer instruction classification metadata so semantic and codegen layers can route lines based on parser-owned classification instead of repeated instruction-name matching.

Extend AST line objects with parser-owned classification metadata derived from instruction name and syntax shape.

Possible metadata includes:

- `isSemanticOnly`
- `isMemoryDeclaration`
- `isBlockStart`
- `isBlockEnd`
- `isDeclarationLike`
- `allowedScopes`

The exact field set can stay modest at first. The goal is to stop rediscovering syntax-level instruction categories in the compiler.

## Anti-Patterns

- Do not move semantic validation or scope-state validation into tokenizer.
- Do not add metadata that merely duplicates compiler runtime state.
- Do not keep compiler-side string-set routing as an active fallback once AST metadata exists.
- Do not mark this complete while core compiler routing still depends on syntax-only instruction-name checks.

## Implementation Plan

### Step 1: Inventory syntax-only instruction categories

- Identify which compiler-side instruction classifications are currently based only on instruction name/shape.
- Separate those from truly semantic checks.
- Start with:
  - `packages/compiler/src/semantic/buildNamespace.ts`
  - `packages/compiler/src/semantic/declarations/index.ts`
  - `packages/compiler/src/semantic/instructions/index.ts`
  - block-routing and structural dispatcher code

### Step 2: Emit parser-owned line classification metadata

- Add the chosen classification fields to AST line objects in `@8f4e/tokenizer`.
- Populate them during AST generation.

### Step 3: Replace compiler-side instruction-name routing where possible

- Update semantic/codegen routing to use AST metadata instead of repeated instruction-name lists.
- Keep only semantic validation in compiler.

### Step 4: Remove obsolete compiler-side syntax routing helpers

- Delete or narrow local instruction-name sets and “is this kind of line?” helpers once AST metadata replaces them.

## Validation Checkpoints

- `rg -n "instruction ===|switch \\(line\\.instruction\\)|isMemoryDeclarationInstruction|isParsedSemanticInstructionLine" packages/compiler/src`
- `npx nx run @8f4e/tokenizer:build --skipNxCache`
- `npx nx run @8f4e/compiler:typecheck --skipNxCache`
- `npx nx run compiler:test --skipNxCache`

## Success Criteria

- AST lines carry explicit instruction classification metadata for syntax-level categories.
- Compiler routing uses parser-owned metadata where classification is syntax-only.
- Repeated instruction-name string sets in compiler are reduced or removed.
- This TODO is not complete while compiler still uses syntax-only instruction-name matching for major routing decisions that tokenizer could classify.

## Affected Components

- `packages/tokenizer/src/types.ts`
- tokenizer AST generation / parser files
- `packages/compiler/src/semantic/buildNamespace.ts`
- `packages/compiler/src/semantic/declarations/index.ts`
- `packages/compiler/src/semantic/instructions/index.ts`
- any compiler dispatchers still routing by syntax-only instruction-name checks

## Risks & Considerations

- **Risk 1**: adding too much metadata too early instead of starting with the highest-value syntax-only categories.
- **Risk 2**: mixing syntax-level classification fields with semantic/runtime state fields.
- **Dependency**: this should compose with `336` and `337`, not duplicate identifier-specific work.

## Related Items

- Related: 336 `Move identifier reference classification into tokenizer`
- Related: 337 `Add structured address and query extraction to tokenizer`
- Related: 338 `Add richer compile-time expression AST nodes`

## Notes

This is the line-level counterpart to identifier/reference classification work.
It keeps the parser/compiler boundary consistent: parser classifies syntax, compiler resolves semantics.
