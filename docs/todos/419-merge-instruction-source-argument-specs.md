---
title: 'TODO: Merge instruction source argument specs into instruction specs'
priority: Medium
effort: 1-2d
created: 2026-05-26
issue: null
status: Open
completed: null
---

# TODO: Merge instruction source argument specs into instruction specs

## Problem Description

The compiler currently has two separate instruction spec systems:

- `packages/compiler-spec/src/instructionSpecs.ts` describes compiler-facing instruction behavior such as scope, stack operands, stack effects, documentation, block close behavior, and memory operation metadata.
- `packages/compiler/packages/tokenizer/src/syntax/validateInstructionArguments.ts` keeps tokenizer-owned `instructionArgumentSpecs` for source argument arity and argument-shape validation.

This split means instruction contracts are not fully spec-first. A contributor must update one object for semantic/compiler behavior and a different tokenizer-local object for source syntax. That also makes it awkward to derive helper sets such as no-source-argument instruction names without maintaining extra lists.

The overall goal is to use strict source and compiler types where applicable instead of handling ambiguity later during runtime or codegen. Source argument shape is part of the instruction contract, so it should live next to the rest of the instruction metadata.

## Proposed Solution

Move source argument specification into `instructionSpecs.ts` under a dedicated field such as `syntax` or `sourceArguments`.

Example shape:

```ts
ensureNonZero: {
	sourceArguments: {
		maxArguments: 1,
		argumentTypes: 'literal',
	},
	scope: 'moduleOrFunction',
	minOperands: 1,
	// existing docs/stack/effects metadata...
}
```

The tokenizer should import and use this shared source-argument metadata for arity and argument-shape validation. After the move, remove the tokenizer-local `instructionArgumentSpecs` table.

It is acceptable for this to be an API move. The project is not released yet, and we own the whole codebase, so do not preserve compatibility layers or duplicated fallback specs.

## Anti-Patterns

- Do not derive source argument arity from stack effects. Source arguments and stack operands are separate concepts.
- Do not keep `instructionArgumentSpecs` as a compatibility layer after moving the metadata into compiler-spec.
- Do not keep hand-maintained no-source-argument instruction lists when they can be derived from the shared source argument metadata.
- Do not broaden argument shapes to avoid updating tests. Tighten tests to the intended language contract instead.

## Implementation Plan

### Step 1: Add Source Argument Metadata Types

- Add compiler-spec types for source argument arity and shape rules.
- Move the rule names currently used by tokenizer validation into compiler-spec if they are part of the public language contract.
- Keep validation implementation details in tokenizer where possible; the shared spec should describe the contract, not parse tokens itself.

### Step 2: Annotate Instruction Specs

- Add source argument metadata to each relevant instruction in `instructionSpecs.ts`.
- Cover no-argument instructions, required-argument instructions, optional-argument instructions, and variadic cases such as `functionEnd`.
- Preserve intentional contracts such as `ensureNonZero` accepting no argument or one literal fallback.

### Step 3: Consume Shared Specs in Tokenizer Validation

- Replace tokenizer-local `instructionArgumentSpecs` with lookups against `instructionSpecs`.
- Keep memory declaration handling explicit if needed, but prefer a shared spec path for all regular language instructions.
- Make tokenizer syntax errors continue to own source argument shape failures.

### Step 4: Remove Duplicated Lists and Specs

- Remove `noArgumentCodegenInstructionNames` or derive the remaining helper from shared source argument metadata.
- Remove duplicated tokenizer source argument spec data.
- Update AST line typing only where the shared source metadata makes an existing manual type safer or simpler.

## Validation Checkpoints

- Run `npx nx run compiler-spec:typecheck`.
- Run `npx nx run tokenizer:typecheck`.
- Run `npx nx run tokenizer:test`.
- Run `npx nx run compiler:typecheck`.
- Run `npx nx run compiler:test`.
- Use `rg -n "instructionArgumentSpecs|noArgumentCodegenInstructionNames" packages/compiler-spec packages/compiler packages/compiler/packages/tokenizer` to confirm duplicates are removed or intentionally derived.

## Success Criteria

- [ ] Source argument metadata lives in `packages/compiler-spec/src/instructionSpecs.ts`.
- [ ] Tokenizer validation reads source argument contracts from compiler-spec.
- [ ] The tokenizer-local `instructionArgumentSpecs` table is removed.
- [ ] No-source-argument helper data is derived from source argument metadata or no longer needed.
- [ ] Existing language behavior is preserved, including optional arguments such as `ensureNonZero <literal>` and `clampAddress <width>`.
- [ ] No compatibility layer keeps old duplicated specs alive.

## Affected Components

- `packages/compiler-spec/src/instructionSpecs.ts`
- `packages/compiler-spec/src/ast.ts`
- `packages/compiler/packages/tokenizer/src/syntax/validateInstructionArguments.ts`
- tokenizer argument validation tests
- compiler instruction tests that depend on source argument contracts

## Risks & Considerations

- **Package boundary change**: source argument rule names move from tokenizer into compiler-spec. This is acceptable, but the boundary should stay declarative.
- **Over-derivation risk**: AST line unions may still need explicit manual types where TypeScript cannot safely infer tuple unions from metadata.
- **Behavior drift risk**: optional and variadic source arguments must be preserved exactly.
- **Compatibility risk**: do not add old-to-new shims; update internal callers and tests directly.

## Related Items

- **Related**: `417-tighten-compiler-ast-union-and-source-block-types.md`
- **Related**: `397-finish-compiler-stack-analysis-codegen-separation.md`
- **Related**: PR #692, which exposed the need to keep source argument contracts and AST line contracts aligned.
