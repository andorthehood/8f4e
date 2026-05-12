---
title: 'TODO: Extract compiler stack analysis into a separate pass'
priority: Medium
effort: 2-4d
created: 2026-05-08
status: Completed
completed: 2026-05-08
---

# TODO: Extract compiler stack analysis into a separate pass

## Problem Description

The compiler currently mixes stack analysis, stack-type validation, and bytecode emission inside instruction compilers.

Instruction compilers such as `add`, `push`, `call`, `store`, and control-flow instructions mutate `context.stack` while also emitting WebAssembly bytecode. That makes it harder to add higher-level behavior that depends on stack types, such as generic function specialization or automatic dispatch to typed function variants.

The recent removal of recursive `compileSegment` lowering makes the compiler pipeline simpler, but stack typing is still not a distinct compilation stage.

## Proposed Solution

Extract stack analysis into its own compiler pass that runs after semantic normalization and before code generation.

The pass should:

- Read normalized AST lines and semantic state.
- Validate stack availability and stack operand types.
- Produce per-line stack effects.
- Record stack inputs, consumed operands, produced stack items, and codegen hints.
- Own stack-type-related compiler errors.
- Allow codegen to trust analysis results instead of revalidating stack types.

The compiler-side `withValidation` argument checks were removed in the argument-validation cleanup because tokenizer syntax validation already owns raw argument shape. Do not reintroduce a second argument contract in the compiler.

For stack analysis, create a central compiler-owned instruction specification that extends the current validation spec. This should become the single source of truth for semantic/scope/stack contracts that multiple compiler passes need to share.

Do not preserve `withValidation` as a compatibility bridge in a merged state. This refactor should land as a clean stage-boundary change where stack validation has one owner.

## Stage Boundaries

The compiler should keep a clear no-duplicate-validation contract:

- **Tokenizer** validates raw syntax and argument shape.
- **Semantic normalization** resolves and narrows compile-time arguments.
- **Stack analysis** validates stack availability, stack operand types, function call stack signatures, and stack effects.
- **Codegen** trusts the analyzed result and emits bytecode.

Codegen must not re-check invariants already guaranteed by stack analysis. In particular, codegen should not repeat operand-count checks, matching-type checks, int/float checks, float32/float64 compatibility checks, or function return stack checks.

## No-Bridge Enforcement

The implementation must make duplicate validation mechanically visible and difficult to reintroduce.

Required guardrails:

- Delete `packages/compiler/src/withValidation/withValidation.ts` in the same change that introduces the stack-analysis pass.
- Remove all `withValidation(...)` calls and imports.
- Move stack validation helpers into a stack-analysis-owned folder, such as `packages/compiler/src/stackAnalysis/`.
- Prevent bytecode-emitting instruction code from importing stack-analysis validation helpers.
- Give codegen a narrowed context type that does not expose `stack`.
- Add a regression test or repository check that fails if old bridge APIs or stack validation appear in codegen files.

The implementation is not complete while any bridge path remains.

Suggested checks:

```sh
rg "withValidation" packages/compiler/src
rg "context\\.stack|validateOperandTypes|peekStackOperands" packages/compiler/src/instructionCompilers
```

The first command should return no matches. The second command should return no codegen matches after instruction compilers become bytecode emitters over analyzed lines.

## Instruction Contract Boundary

Introduce a central `instructionSpecs.ts` table that records compiler-owned instruction behavior shared by validation, stack analysis, and codegen orchestration.

After the argument-validation cleanup, compiler-owned instruction contracts should cover only semantic/scope/stack facts that cannot be known by the tokenizer:

- scope
- minimum operands
- operand type rules
- dynamic operand validation
- block allowances
- stack production/effect

Tokenizer-owned facts must stay in `packages/compiler/packages/tokenizer/src/syntax/validateInstructionArguments.ts` and must not be mirrored in compiler spec.

Preferred shape:

```ts
export interface InstructionSpec<TLine extends AST[number] = AST[number]> {
	scope?: ScopeRule;
	minOperands?: number;
	operandTypes?: OperandRule[] | OperandRule;
	validateOperands?: (line: TLine, context: StackAnalysisContext) => OperandValidationResult;
	stackEffect?: (line: TLine, context: StackAnalysisContext) => StackEffectResult;
	codegenHints?: (line: TLine, context: StackAnalysisContext) => AnalyzedLine['hints'];
}
```

The exact shape can change during implementation, but the important part is that stack analysis and codegen do not grow separate copies of the same contract.

## Analyzed Line Shape

The stack analysis pass should produce a typed result that codegen can consume directly.

Possible shape:

```ts
export interface AnalyzedLine<TLine extends AST[number] = AST[number]> {
	line: TLine;
	stackBefore: StackItem[];
	consumed: StackItem[];
	produced: StackItem[];
	stackAfter: StackItem[];
	hints: {
		valueType?: 'i32' | 'f32' | 'f64';
		accessByteWidth?: number;
	};
}
```

The `hints` object should carry only facts codegen needs to choose opcodes or memory access behavior. It should not become a second validation surface.

## Implementation Plan

### Step 1: Centralize the current instruction validation specs

- Move the current compiler validation spec shape into a global instruction-spec module.
- Move all existing per-instruction `withValidation` spec objects into that central table.
- Keep tokenizer-owned argument shape out of the compiler spec.
- Use the central table from the current wrapper as the first behavior-preserving step.

### Step 2: Add a stack analysis dispatcher

- Add a dispatcher that reads from the central instruction spec table.
- Complex instructions can attach custom stack-effect functions to their central spec entries.

### Step 3: Add a stack analysis pass

- Add a pass that walks normalized AST lines in source order before codegen.
- It should update a `StackAnalysisContext`, not the codegen `CompilationContext`.
- It should return analyzed lines and final stack state.
- It should throw stack-type-related errors.

### Step 4: Convert instruction compilers to codegen-only functions

- Change instruction compilers so they consume analyzed line data instead of mutating `context.stack`.
- Give codegen a context that does not expose the analysis stack.
- Remove stack-type validation and stack-shape checks from instruction compilers.
- Codegen should emit bytecode from facts produced by stack analysis.

### Step 5: Implement stack effects for simple instructions

Start with instructions whose stack effects are linear and type-local:

- `castToInt`
- `castToFloat`
- `castToFloat64`
- `add`
- `sub`
- `mul`
- comparisons
- `drop`
- `clearStack`

For these, analysis can produce straightforward `consumed`, `produced`, and opcode-selection hints.

### Step 6: Implement custom analysis for complex instructions

Handle instructions that need custom analysis:

- `push` because it resolves literals, locals, memory, pointers, strings, and address metadata.
- `call` because it consumes function signatures and produces typed returns.
- `load`, `loadFloat`, `store`, `storeBytes`, and `memoryCopy` because they depend on address/value metadata and access widths.
- `if`, `else`, `ifEnd`, `block`, `blockEnd`, `loop`, and `loopEnd` because they need block-stack tracking and stack-shape validation across control flow.
- `functionEnd` and `return` because they validate declared return signatures.

### Step 7: Add no-duplicate-validation regression coverage

- Add stack-analysis tests that focus on stack effects and stack-type errors without bytecode assertions.
- Keep existing compiler integration tests to verify bytecode output remains stable.
- Add repository-boundary tests or scripts that fail if:
  - `withValidation` exists.
  - instruction codegen imports stack-analysis validation helpers.
  - instruction codegen references `context.stack`.
  - stack validation helper names appear under `instructionCompilers`.

## Success Criteria

- [ ] Instruction stack contract behavior is represented in one central compiler instruction spec.
- [ ] Stack analysis runs as a distinct pass before codegen.
- [ ] Stack-type-related errors are owned by stack analysis.
- [ ] Codegen consumes analyzed stack effects and does not duplicate stack validation.
- [ ] `withValidation` and its old wrapper-based call sites are deleted.
- [ ] Codegen instruction functions cannot access `context.stack` through their context type.
- [ ] Automated checks fail if stack validation helpers reappear in codegen.
- [ ] Automated checks fail if stack validation is duplicated outside the central spec or stack-analysis pass.
- [ ] Existing compiler behavior and bytecode snapshots remain stable unless intentionally changed.
- [ ] Focused compiler tests and typechecks pass.

## Affected Components

- `packages/compiler-spec` - Shared analyzed-line and codegen-context contract types.
- `packages/compiler/src/withValidation` - Existing wrapper and private helpers to remove or relocate into stack analysis.
- `packages/compiler/src/instructionCompilers` - Codegen functions that currently mutate stack state.
- `packages/compiler/src/stackAnalysis` - New analysis pass and stack validation helpers.
- `packages/compiler/src/compiler.ts` - Pipeline orchestration for semantic normalization, stack analysis, and codegen.
- `packages/compiler/src/semantic` - Existing semantic normalization that should remain the owner of compile-time argument resolution.

## Notes

- This refactor is enabled by removing `compileSegment`; instruction lowering is no longer recursively compiling synthetic source.
- Avoid merging a hybrid state where both `withValidation` and stack analysis validate stack operands.
- The central risk is accidentally reintroducing duplicate validation across stages. The stage boundary should be documented and enforced through tests.
- Archived after the first stack-analysis extraction landed in `2aa72f020 fix(compiler): centralize instruction stack validation`: `withValidation` was removed, instruction stack validation moved behind `packages/compiler/src/stackAnalysis/`, and compiler-owned instruction contracts were centralized in `packages/compiler/src/instructionSpecs.ts`.
- Remaining separation work is tracked in `docs/todos/397-finish-compiler-stack-analysis-codegen-separation.md`.
