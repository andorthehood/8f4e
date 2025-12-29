# Instruction Compiler Validation Helper

## Overview

This note captures brainstorming around reducing repeated validation logic in compiler instruction handlers (e.g., block scope checks, operand counts, and operand type checks).

## Options Considered

### 1) Lightweight Guards + Helpers

- Add small utility functions (e.g., `requireInside`, `popOperands`, `requireAllIntegers`, `requireAllFloats`, `pushResultType`).
- Instruction compilers stay explicit, but avoid repeating error boilerplate.
- Lowest refactor risk; incremental adoption.

### 2) Unary/Binary Operation Factories

- Introduce `createUnaryOp` / `createBinaryOp` helpers with configuration for scope, operand types, result types, and bytecode emitter.
- Most arithmetic/logic instructions reduce to a few lines.
- More constrained API; special cases still hand-written.

### 3) Config-Driven Compiler Factory

- Create `createInstructionCompiler({ scope, operands, result, emit })`.
- `emit` could be a bytecode array or function; `result` can be computed from operands.
- Higher abstraction; potential loss of readability for complex cases.

### 4) withValidation Wrapper (Preferred Direction)

- Keep existing `InstructionCompiler` functions, but wrap their core logic with a shared `withValidation(spec, compiler)` helper.
- Centralizes preamble checks (scope, operand count, operand types) while keeping custom logic in place.
- Low churn; can migrate instruction-by-instruction.

### 5) Metadata Table + compileWithSpec

- Define metadata per instruction (scope, operand types, result type, error codes) and run a shared validation step.
- Similar to `withValidation` but more data-driven.
- Good for consistency, but can feel indirect.

## Next Step

- Prototype a `withValidation` helper on a small set of instructions (e.g., `add`, `abs`, `load`) to evaluate clarity and reduction in boilerplate.

## withValidation Sketch + Examples

### Proposed Shape

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
		onInvalidTypes: ErrorCode.OPERANDS_MUST_MATCH_TYPES,
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

### abs

```ts
const abs: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'any',
	},
	(line, context) => {
		const operand = context.stack.pop()!;
		if (operand.isInteger) {
			context.stack.push({ isInteger: true, isNonZero: operand.isNonZero });
			return compileSegment([...], context);
		}
		context.stack.push({ isInteger: false, isNonZero: operand.isNonZero });
		return saveByteCode(context, [WASMInstruction.F32_ABS]);
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

## Error Consistency Defaults

Goal: keep the same error codes used today in each instruction, while centralizing the checks.

### Default Mapping

```
scope -> ErrorCode.INSTRUCTION_INVALID_OUTSIDE_BLOCK
missing operands -> ErrorCode.INSUFFICIENT_OPERANDS
type mismatch (ints) -> ErrorCode.ONLY_INTEGERS
type mismatch (floats) -> ErrorCode.ONLY_FLOATS
type mismatch (mixed required) -> ErrorCode.OPERANDS_MUST_MATCH_TYPES
```

### Notes

- `withValidation` should accept optional overrides to match any outliers.
- The wrapper should only validate; instruction-specific logic can still throw bespoke errors for special cases.

## Error Usage Snapshot (Instruction Compilers)

Counts from `packages/compiler/src/instructionCompilers`:

```
INSTRUCTION_INVALID_OUTSIDE_BLOCK: 61
INSUFFICIENT_OPERANDS: 44
MISSING_ARGUMENT: 16
UNDECLARED_IDENTIFIER: 14
EXPECTED_INTEGER_OPERAND: 11
UNMATCHING_OPERANDS: 10
EXPECTED_IDENTIFIER: 10
ONLY_INTEGERS: 9
MISSING_BLOCK_START_INSTRUCTION: 7
EXPECTED_FLOAT_OPERAND: 6
EXPECTED_VALUE: 4
UNRECOGNISED_INSTRUCTION: 2
TYPE_MISMATCH: 2
INVALID_FUNCTION_SIGNATURE: 2
FUNCTION_SIGNATURE_OVERFLOW: 2
DIVISION_BY_ZERO: 2
UNDEFINED_FUNCTION: 1
STACK_MISMATCH_FUNCTION_RETURN: 1
PARAM_AFTER_FUNCTION_BODY: 1
MISSING_FUNCTION_ID: 1
DUPLICATE_PARAMETER_NAME: 1
```

Notes:

- `withValidation` should cover the highest-frequency validation errors (scope + operand count/type).
- The remaining errors are instruction-specific and should stay within each compiler.
