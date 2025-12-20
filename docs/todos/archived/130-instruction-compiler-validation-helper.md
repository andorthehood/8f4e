---
title: 'TODO: Add Instruction Compiler Validation Helper'
priority: Medium
effort: 1-2d
created: 2025-12-20
status: Completed
completed: 2025-12-20
---

# TODO: Add Instruction Compiler Validation Helper

## Problem Description

Instruction compilers repeat the same validation logic (scope checks, operand counts, operand type checks), making the code noisy and harder to maintain. This duplication increases the chance of inconsistency and slows down changes across instruction compilers.

## Proposed Solution

Add a shared `withValidation` helper that wraps an `InstructionCompiler` and performs common checks before delegating to instruction-specific logic. The helper should keep existing error codes intact by default and allow per-instruction overrides where needed.

## Implementation Plan

### Step 1: Define `withValidation` helper
- Add a validation wrapper with configuration for scope, operand counts, and operand type rules.
- Map defaults to current error codes (`INSTRUCTION_INVALID_OUTSIDE_BLOCK`, `INSUFFICIENT_OPERANDS`, `ONLY_INTEGERS`, `ONLY_FLOATS`, `UNMATCHING_OPERANDS`).

### Step 2: Prototype on a small set
- Refactor a few instructions (`add`, `abs`, `load`) to confirm API clarity and unchanged behavior.
- Keep instruction-specific errors inside their compilers where needed.

### Step 3: Incremental rollout
- Migrate remaining instruction compilers opportunistically.
- Ensure no behavior changes by comparing error handling and stack effects.

## Success Criteria

- [ ] `withValidation` exists and covers scope + operand count/type checks.
- [ ] At least 3 instruction compilers use the wrapper without changing error behavior.
- [ ] Remaining compilers can be migrated without new error codes or semantics.

## Examples

### Wrapper Shape

```ts
type OperandRule = 'int' | 'float' | 'any';
type ScopeRule = 'module' | 'function' | 'moduleOrFunction' | 'init' | 'block';

type ValidationSpec = {
	scope?: ScopeRule;
	minOperands?: number;
	operandTypes?: OperandRule[] | OperandRule;
	onInsufficientOperands?: ErrorCode;
	onInvalidScope?: ErrorCode;
	onInvalidTypes?: ErrorCode;
};

export function withValidation(spec: ValidationSpec, compiler: InstructionCompiler): InstructionCompiler
```

### add

```ts
const add: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 2,
		operandTypes: 'any',
		onInvalidTypes: ErrorCode.UNMATCHING_OPERANDS,
	},
	(line, context) => {
		const right = context.stack.pop()!;
		const left = context.stack.pop()!;
		const isInteger = right.isInteger && left.isInteger;

		context.stack.push({ isInteger, isNonZero: left.isNonZero || right.isNonZero });
		return saveByteCode(context, [isInteger ? WASMInstruction.I32_ADD : WASMInstruction.F32_ADD]);
	}
);
```

### load

```ts
const load: InstructionCompiler = withValidation(
	{
		scope: 'module',
		minOperands: 1,
		operandTypes: 'int',
		onInvalidTypes: ErrorCode.ONLY_INTEGERS,
	},
	(line, context) => {
		const operand = context.stack.pop()!;
		// existing safe/unsafe address branch
	}
);
```

## Affected Components

- `packages/compiler/src/instructionCompilers/*` - Update repeated validation logic
- `packages/compiler/src/utils.ts` or new helper module - Centralize validation logic
- `docs/brainstorming_notes/018-instruction-compiler-validation-helper.md` - Keep rationale up to date

## Risks & Considerations

- **Risk**: Subtle behavior changes in error selection when multiple checks fail.
- **Mitigation**: Preserve existing error order per instruction when wrapping.
- **Breaking Changes**: None expected if error mapping stays consistent.

## Related Items

- **Related**: `docs/brainstorming_notes/018-instruction-compiler-validation-helper.md`

## Notes

- Favor incremental adoption to keep diff sizes small.
