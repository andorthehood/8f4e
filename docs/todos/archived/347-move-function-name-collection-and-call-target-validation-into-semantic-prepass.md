---
title: 'TODO: Move function name collection and call target validation into semantic prepass'
priority: Medium
effort: 4-8h
created: 2026-03-29
status: Completed
completed: 2026-03-29
---

# TODO: Move function name collection and call target validation into semantic prepass

## Problem Description

Function target discovery is still later than it should be. The compiler currently validates `call` targets in codegen in `packages/compiler/src/instructionCompilers/call.ts` by looking up `context.namespace.functions` and throwing `UNDEFINED_FUNCTION` there.

That is inconsistent with the current pipeline direction:
- tokenizer owns syntax, arity, and raw argument shape
- semantic prepass/normalization should own name collection and identifier existence validation
- codegen should assume syntax-valid, semantically validated input and only handle scope, stack, type, and lowering concerns

At the moment, function names are not treated like the other collected names (`module`, `const`, memory declarations). That leaves `call` as a boundary leak where undeclared targets are still discovered during codegen.

## Proposed Solution

Treat function names like any other collected name:
- collect function ids during semantic prepass, before codegen
- make function availability visible in semantic context early enough for `call` normalization/validation
- move `call` target existence validation out of `packages/compiler/src/instructionCompilers/call.ts`
- let codegen assume the target function exists and only validate stack shape, parameter/return types, and lowering details

The intended pipeline should be:
1. tokenization
2. semantic name collection
   - modules
   - consts
   - memory declarations
   - functions
3. semantic normalization / validation
   - including `call` target existence
4. codegen

## Anti-Patterns

- Do not add more runtime guards to `call.ts` or other codegen files.
- Do not keep late `UNDEFINED_FUNCTION` discovery in codegen and merely duplicate it earlier.
- Do not treat invalid internal compiler states as untrusted input. The compiler package rule is that tokenizer and semantic phases establish stage invariants; later phases trust those invariants.
- Do not mark this TODO complete if only one throw site was moved but function-name collection still is not clearly owned by the semantic prepass.

## Implementation Plan

### Step 1: Document current function collection flow
- Trace where function ids and signatures become available today.
- Identify the earliest point at which function ids can be collected independently of full function codegen.
- Confirm whether current namespace discovery/prepass already has enough information to collect names only.

### Step 2: Add function name collection to semantic prepass
- Extend semantic prepass collection so function ids are registered before codegen.
- Keep this aligned with existing name collection ownership in `packages/compiler/src/semantic/buildNamespace.ts`.
- Ensure this does not regress deferred namespace collection behavior or compiled function indexing.

### Step 3: Move `call` target validation into semantics
- Add a semantic normalization or prepass validation step for `call` that guarantees the target function exists before codegen.
- Remove the late function-existence failure from `packages/compiler/src/instructionCompilers/call.ts`.
- Preserve scope, stack, parameter-count, and type checks in codegen where they still belong.

### Step 4: Add verification coverage
- Add or update tests that prove undeclared `call` targets fail before codegen.
- Add or update tests that prove valid function targets still compile and lower correctly.
- Verify that function-only name collection does not break current ordering or signature behavior.

## Validation Checkpoints

- `npx nx run @8f4e/compiler:typecheck --skipNxCache`
- `npx nx run compiler:test --skipNxCache`
- `rg -n "UNDEFINED_FUNCTION" packages/compiler/src/instructionCompilers/call.ts`
  Expected result after completion: no codegen-side undeclared-target discovery remains there.

## Success Criteria

- [ ] Function ids are collected during semantic prepass, not discovered implicitly during codegen.
- [ ] `call` target existence is validated before codegen.
- [ ] `packages/compiler/src/instructionCompilers/call.ts` no longer throws undeclared/undefined-function errors.
- [ ] Codegen for `call` only handles scope, stack, parameter/return type compatibility, and lowering.
- [ ] `npx nx run @8f4e/compiler:typecheck --skipNxCache` passes.
- [ ] `npx nx run compiler:test --skipNxCache` passes.

## Affected Components

- `packages/compiler/src/semantic/buildNamespace.ts` - current prepass/namespace collection flow
- `packages/compiler/src/semantic/normalizeCompileTimeArguments.ts` and `packages/compiler/src/semantic/normalization/` - likely semantic validation location
- `packages/compiler/src/instructionCompilers/call.ts` - current late target existence check
- `packages/compiler/src/instructionCompilers/function.ts` - function declaration/codegen entry behavior
- `packages/compiler/src/types.ts` - if new staged semantic function-line types become useful

## Risks & Considerations

- **Collection timing**: function ids may need to be available earlier than signatures/body details. Separate name collection from full compile readiness if needed.
- **Ordering/deferral**: do not break namespace deferral or any flow that currently depends on prepass retry logic.
- **Partial collection trap**: moving only the `call` throw site without a clear earlier owner is not sufficient.

## Related Items

- **Related**: [344-move-identifier-existence-validation-into-semantic-pass-and-shrink-codegen-validation.md](./344-move-identifier-existence-validation-into-semantic-pass-and-shrink-codegen-validation.md)
- **Related**: [345-tighten-tokenizer-to-compiler-contract-with-typed-ast-lines.md](./archived/345-tighten-tokenizer-to-compiler-contract-with-typed-ast-lines.md)
- **Related**: [346-split-semantic-normalization-into-instruction-specific-files.md](./archived/346-split-semantic-normalization-into-instruction-specific-files.md)

## Notes

- This todo came out of tracing instructions through the tokenizer → semantic → codegen pipeline after cleaning similar blind spots in `push` and memory declaration parsing.
- The main goal is not “make `call` throw earlier by any means.” The goal is to make function names part of the semantic name-collection stage so `call` follows the same contract as other identifier-based instructions.

## Archive Instructions

When this TODO is completed:
1. Update the front matter to set `status: Completed` and provide the `completed` date
2. Move it to the `todo/archived/` folder to keep the main todo directory clean and organized
3. Update the `todo/_index.md` file to:
   - Move the TODO from the "Active TODOs" section to the "Completed TODOs" section
   - Add the completion date to the TODO entry (use `date +%Y-%m-%d` command if current date is not provided in the context)
