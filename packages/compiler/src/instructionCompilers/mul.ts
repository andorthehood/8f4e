import { areAllOperandsIntegers } from '../utils/operandTypes';
import { saveByteCode } from '../utils/compilation';
import { withValidation } from '../withValidation';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import createInstructionCompilerTestContext from '../utils/testUtils';
import { canOptimizeMulToPowerOfTwo, isIdentityMultiplication, isZeroMultiplication } from '../utils/strengthReduction';
import i32const from '../wasmUtils/const/i32const';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `mul`.
 * @see [Instruction docs](../../docs/instructions/arithmetic.md)
 */
const mul: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 2,
		operandTypes: 'matching',
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation ensures 2 operands exist
		const operand2 = context.stack.pop()!;
		const operand1 = context.stack.pop()!;

		const isInteger = areAllOperandsIntegers(operand1, operand2);

		// Optimization: x * 0 -> 0
		if (isInteger && isZeroMultiplication(operand1, operand2)) {
			// Both operands are on the runtime stack, we need to drop both and push 0
			context.stack.push({ isInteger: true, isNonZero: false, constantValue: 0 });
			return saveByteCode(context, [
				WASMInstruction.DROP, // Drop first operand
				WASMInstruction.DROP, // Drop second operand
				...i32const(0), // Push 0
			]);
		}

		// Optimization: x * 1 -> x (identity)
		// Only optimize when 1 is the second operand (on top of stack)
		// Multiplication is commutative, but handling swap adds unnecessary complexity
		if (isInteger && isIdentityMultiplication(operand1, operand2)) {
			// One operand is 1, the other is the value we want to keep
			// Stack: [value, 1] or [1, value]
			// We need to drop the 1 and keep the value
			const isOperand2Identity = operand2.constantValue === 1;

			if (isOperand2Identity) {
				// Runtime WASM stack: [value, 1] - drop the 1 on top
				const nonConstantOperand = operand1;
				context.stack.push(nonConstantOperand);
				return saveByteCode(context, [WASMInstruction.DROP]);
			} else {
				// Runtime WASM stack: [1, value]
				// Would need to swap operands - fall through to unoptimized multiplication
			}
		}

		// Optimization: x * 2^n -> x << n (strength reduction)
		// Only optimize when the constant is the second operand (on top of stack)
		// Handling the reverse case (constant first) would require stack manipulation
		// which adds complexity without significant benefit
		const shiftAmount = isInteger ? canOptimizeMulToPowerOfTwo(operand1, operand2) : null;
		if (shiftAmount !== null) {
			// Both operands are on the runtime WASM stack
			// One is a power-of-2 constant that we want to replace with a shift
			// We need to drop the constant operand and replace it with the shift amount
			const isOperand2Constant = operand2.constantValue !== undefined;

			if (isOperand2Constant) {
				// Runtime WASM stack: [value, constant]
				// We want: [value, shift_amount] then SHL
				context.stack.push({ isInteger: true, isNonZero: false });
				return saveByteCode(context, [
					WASMInstruction.DROP, // Drop the constant
					...i32const(shiftAmount), // Push shift amount
					WASMInstruction.I32_SHL, // Shift left
				]);
			} else {
				// Runtime WASM stack: [constant, value]
				// Would need to swap operands - complexity not justified for this case
				// Fall through to unoptimized multiplication
			}
		}

		context.stack.push({ isInteger, isNonZero: false });
		return saveByteCode(context, [isInteger ? WASMInstruction.I32_MUL : WASMInstruction.F32_MUL]);
	}
);

export default mul;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('mul instruction compiler', () => {
		it('emits I32_MUL for integer operands', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: true, isNonZero: false }, { isInteger: true, isNonZero: false });

			mul({ lineNumber: 1, instruction: 'mul', arguments: [] } as AST[number], context);

			expect({
				stack: context.stack,
				loopSegmentByteCode: context.loopSegmentByteCode,
			}).toMatchSnapshot();
		});

		it('emits F32_MUL for float operands', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: false, isNonZero: false }, { isInteger: false, isNonZero: false });

			mul({ lineNumber: 1, instruction: 'mul', arguments: [] } as AST[number], context);

			expect({
				stack: context.stack,
				loopSegmentByteCode: context.loopSegmentByteCode,
			}).toMatchSnapshot();
		});
	});
}
