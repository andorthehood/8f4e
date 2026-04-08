# Compiler Pipeline Blind-Spot Audit

This note records a quick audit of remaining compiler pipeline blind spots after cleaning the `push` path and declaration syntax revalidation.

## Goal

The audit looked for checks that still happen later in the pipeline even though they should already be owned by:

- tokenizer
- semantic prepass
- semantic normalization

The intent was to separate:

- real boundary leaks
- acceptable semantic checks
- acceptable codegen/runtime checks

## Confirmed Cleanups Already Done

Two real late-stage blind spots were already removed:

1. `push`
   - removed redundant compiler-side arity handling
   - removed the impossible fallback branch in codegen

2. memory declaration syntax revalidation
   - `packages/compiler/src/utils/memoryInstructionParser.ts` no longer catches tokenizer syntax errors and re-wraps them as compiler `MISSING_ARGUMENT`
   - tokenizer now remains the owner of declaration argument syntax failures

## High-Confidence Remaining Blind Spot

### `call` target existence is still discovered in codegen

File:

- `packages/compiler/src/instructionCompilers/call.ts`

Current issue:

- `call` still throws `UNDEFINED_FUNCTION` in codegen by looking up `context.namespace.functions`

Why this is a boundary leak:

- function names should be collected like other names during semantic prepass
- `call` target existence should be validated before codegen
- codegen should only handle:
  - scope
  - stack shape
  - parameter/return type compatibility
  - lowering

This blind spot is important enough to have its own todo:

- `docs/todos/347-move-function-name-collection-and-call-target-validation-into-semantic-prepass.md`

## Medium-Confidence Candidates

### Internal semantic routing guards

Files:

- `packages/compiler/src/semantic/buildNamespace.ts`
- `packages/compiler/src/instructionCompilers/load.ts`

These still contain `UNRECOGNISED_INSTRUCTION`-style guards.

Current assessment:

- these are not user-input validation duplicates
- they are internal routing/completeness guards
- they are lower priority than `call`

They should eventually shrink as stage typing and registry routing get tighter, but they are not the most urgent blind spots.

### Memory declaration semantic checks

File:

- `packages/compiler/src/utils/memoryInstructionParser.ts`

After removing syntax revalidation, this helper still performs:

- undeclared memory checks for address/query defaults
- undeclared identifier checks for plain default identifiers
- constant-style-name rejection

Current assessment:

- undeclared-memory / undeclared-identifier checks may still be movable earlier if declaration normalization becomes richer
- constant-style-name rejection looks more syntax-like, but the current parsing flow intentionally leaves that ambiguity unresolved

This is design debt, but not as clear a next cleanup target as `call`.

## Instruction Families That Look Structurally Correct

### `localGet` / `localSet`

Files:

- `packages/tokenizer/src/syntax/validateInstructionArguments.ts`
- `packages/compiler/src/semantic/normalization/localVariable.ts`
- `packages/compiler/src/instructionCompilers/localGet.ts`
- `packages/compiler/src/instructionCompilers/localSet.ts`

Current ownership is good:

- tokenizer owns arity and identifier shape
- semantic normalization owns local existence
- codegen owns scope, stack, and operand type compatibility

No cleanup was needed there.

### `map` / `mapEnd`

Files:

- `packages/compiler/src/instructionCompilers/map.ts`
- `packages/compiler/src/instructionCompilers/mapEnd.ts`

Current `ONLY_INTEGERS` / `ONLY_FLOATS` checks are real runtime/codegen type checks, not duplicate syntax validation.

## Practical Conclusion

The audit suggests:

1. the strongest remaining late-stage blind spot is `call`
2. the next tier is internal routing/completeness guards
3. `localGet` / `localSet` are now in a good state
4. declaration handling is improved, but still has some structural debt

So the next meaningful boundary cleanup is not another random grep pass. It is:

- move function-name collection and `call` target validation into semantic prepass

## Follow-Up Direction

If continuing this line of work, the most useful next step is:

- implement `docs/todos/347-move-function-name-collection-and-call-target-validation-into-semantic-prepass.md`

That will bring function target validation in line with the same tokenizer → semantic → codegen ownership model already established for locals, `push`, and several compile-time-value instructions.
