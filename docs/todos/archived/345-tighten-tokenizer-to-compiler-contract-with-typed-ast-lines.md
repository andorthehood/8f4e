---
title: 'TODO: Tighten tokenizer-to-compiler contract with typed AST lines'
priority: Medium
effort: 1-2d
created: '2026-03-28'
status: Completed
completed: '2026-03-29'
---

# 345 - Tighten tokenizer-to-compiler contract with typed AST lines

## Problem Description

The tokenizer currently guarantees a lot of syntax structure at runtime, but the TypeScript contract between tokenizer output and compiler consumers is still loose.

Current state:
- many compiler paths still cast `line.arguments[...]` into expected shapes manually
- instruction compilers often rely on comments like "existence guaranteed by normalizeCompileTimeArguments"
- the AST type is still broad enough that impossible instruction/argument combinations are representable in TypeScript
- semantic normalization and codegen do not yet consume distinct AST stages with different type guarantees

Why this is a problem:
- tokenizer/compiler boundary guarantees are not enforced at compile time
- downstream code still needs casts and non-null assertions
- refactors can silently widen instruction shapes without causing compiler type errors
- it is harder to see which guarantees belong to tokenizer, semantic normalization, and codegen

Impact:
- weaker compiler ergonomics
- more room for accidental defensive runtime checks
- harder future extraction of semantics into a separate package with a stable contract

## Proposed Solution

Introduce stricter TypeScript AST line and argument contracts so the compiler consumes a narrower, more explicit shape.

High-level approach:
- define a discriminated union of AST line types keyed by `instruction`
- give each instruction a tuple-typed `arguments` field with the exact arity and argument kinds expected at that stage
- introduce staged AST types rather than one universal type:
  - parsed/tokenizer AST
  - semantically normalized AST
- gradually update instruction compilers and semantic helpers to consume the narrower line types instead of broad `AST[number]` plus casts

Key changes required:
- split broad line typing into instruction-specific line variants
- model instruction arguments with tuple types
- define one or more post-normalization line variants for instructions whose codegen contract is narrower than tokenizer output
- thread these narrower types into instruction compiler signatures and semantic utilities

Alternative approaches considered:
- rely only on runtime validation in tokenizer and semantic passes
  - rejected because it does not tighten the compile-time contract
- add more comments and helper wrappers without changing AST types
  - rejected because it leaves impossible states representable in TypeScript

## Anti-Patterns

- Do not try to make raw source input "type safe" before parsing. This TODO is about the contract after tokenization, not replacing tokenizer validation.
- Do not use per-instruction defensive runtime guards to compensate for broad AST types when the invariant should be expressed in TypeScript.
- Do not force one universal AST shape for all phases if normalization materially changes valid argument kinds.

## Implementation Plan

### Step 1: Define instruction-specific parsed AST line types
- Introduce a discriminated union keyed by `instruction`
- Add exact tuple arity for instruction arguments where tokenizer already guarantees the shape
- Keep this stage aligned with tokenizer guarantees only, not semantic guarantees

### Step 2: Define semantically normalized AST line types
- Identify instructions whose codegen input is narrower after semantic normalization
- Add normalized line variants for cases like `map`, `default`, and later address/reference inlining work
- Make the distinction explicit in types rather than comments

### Step 3: Narrow compiler consumers
- Update instruction compiler signatures to consume the relevant line subtype instead of broad `AST[number]`
- Remove redundant casts and non-null assertions where type information now proves the shape
- Keep remaining runtime checks only for true semantic/codegen concerns

### Step 4: Tighten compiler entry boundaries
- Make tokenizer produce the parsed AST union
- Make semantic normalization produce the normalized AST union where applicable
- Ensure codegen helpers consume the normalized contract instead of broad parser output

## Validation Checkpoints

- `rg -n "as Extract<|as .*ArgumentType|!;" packages/compiler/src`
  - should shrink as typed AST contracts improve
- `rg -n "guaranteed by normalizeCompileTimeArguments|guaranteed by" packages/compiler/src`
  - comments should be reduced or replaced by actual type guarantees
- `npx nx run @8f4e/tokenizer:build --skipNxCache`
- `npx nx run compiler:test --skipNxCache`

## Success Criteria

- [x] Parsed AST lines are represented as a discriminated union with instruction-specific argument tuple types.
- [x] At least one semantically normalized AST stage is explicit in TypeScript for codegen-facing instructions whose argument contract narrows after normalization.
- [x] Instruction compilers rely on narrower line types instead of broad `AST[number]` plus repeated casts.
- [x] Refactoring an instruction argument shape in tokenizer causes compile-time failures in affected compiler consumers.
- [x] The tokenizer/semantic/codegen contract is clearer from types alone, not just comments and runtime assumptions.

## Affected Components

- `packages/tokenizer/src` - source of parsed AST types and tokenizer-facing line contracts
- `packages/compiler/src/types.ts` - likely home for shared or staged AST contracts unless moved elsewhere
- `packages/compiler/src/semantic` - semantic normalization stage that should define or produce narrower AST forms
- `packages/compiler/src/instructionCompilers` - consumers that should benefit from tighter line typing

## Risks & Considerations

- **Risk 1**: Trying to type every instruction at once could make the change too broad. Mitigation: land this incrementally, instruction family by instruction family.
- **Risk 2**: Mixing parsed-AST and normalized-AST contracts can create confusion. Mitigation: name stages explicitly and document which layer owns which guarantees.
- **Dependencies**: This complements tokenizer-classification and semantic-boundary work such as `336`, `337`, `338`, `339`, and `344`.
- **Breaking Changes**: Internal TypeScript API churn is expected across tokenizer/compiler boundaries, but external released compatibility is not a concern.

## Related Items

- **Blocks**: Future semantics-package extraction work
- **Depends on**: None strictly, but it pairs well with `336`, `337`, `338`, `339`, and `344`
- **Related**: `336`, `337`, `338`, `339`, `344`

## References

- [344-move-identifier-existence-validation-into-semantic-pass-and-shrink-codegen-validation.md](/docs/todos/344-move-identifier-existence-validation-into-semantic-pass-and-shrink-codegen-validation.md)
- [336-move-identifier-reference-classification-into-tokenizer.md](/docs/todos/336-move-identifier-reference-classification-into-tokenizer.md)
- [337-add-structured-address-and-query-extraction-to-tokenizer.md](/docs/todos/337-add-structured-address-and-query-extraction-to-tokenizer.md)
- [338-add-richer-compile-time-expression-ast-nodes.md](/docs/todos/338-add-richer-compile-time-expression-ast-nodes.md)
- [339-add-instruction-classification-metadata-to-ast-lines.md](/docs/todos/339-add-instruction-classification-metadata-to-ast-lines.md)

## Notes

- The goal is not to replace tokenizer or semantic validation with TypeScript.
- The goal is to make the validated output of those phases harder to misuse downstream.
- A likely good first slice is to type `push`, `localGet`, `localSet`, `map`, and `default` more strictly, since those are already central to the tokenizer/semantic boundary work.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context)
