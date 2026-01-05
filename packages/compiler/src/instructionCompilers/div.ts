import { ErrorCode, getError } from '../errors';
import { areAllOperandsIntegers } from '../utils/operandTypes';
import { saveByteCode } from '../utils/compilation';
import { withValidation } from '../withValidation';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import createInstructionCompilerTestContext from '../utils/testUtils';
import { canOptimizeDivToPowerOfTwo } from '../utils/strengthReduction';
import i32const from '../wasmUtils/const/i32const';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `div`.
 * @see [Instruction docs](../../docs/instructions/arithmetic.md)
 */
const div: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 2,
		operandTypes: 'matching',
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation ensures 2 operands exist
		// Stack order: operand1 (top) = divisor, operand2 (bottom) = dividend
		const operand1 = context.stack.pop()!; // divisor
		const operand2 = context.stack.pop()!; // dividend

		if (!operand1.isNonZero) {
			throw getError(ErrorCode.DIVISION_BY_ZERO, line, context);
		}

		const isInteger = areAllOperandsIntegers(operand1, operand2);

		// Optimization: x / 2^n -> x >> n (strength reduction for integer division)
		// Only optimize when divisor (operand1) is a power-of-2 constant
		const shiftAmount = isInteger ? canOptimizeDivToPowerOfTwo(operand1) : null;
		if (shiftAmount !== null) {
			// Runtime WASM stack: [dividend, divisor_constant]
			// We want: [dividend, shift_amount] then SHR_S
			context.stack.push({ isInteger, isNonZero: true });
			return saveByteCode(context, [
				WASMInstruction.DROP, // Drop the constant divisor
				...i32const(shiftAmount), // Push shift amount
				WASMInstruction.I32_SHR_S, // Arithmetic shift right
			]);
		}

		context.stack.push({ isInteger, isNonZero: true });
		return saveByteCode(context, [isInteger ? WASMInstruction.I32_DIV_S : WASMInstruction.F32_DIV]);
	}
);

export default div;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('div instruction compiler', () => {
		it('emits I32_DIV_S for integer operands', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: true, isNonZero: true }, { isInteger: true, isNonZero: true });

			div({ lineNumber: 1, instruction: 'div', arguments: [] } as AST[number], context);

			expect({
				stack: context.stack,
				loopSegmentByteCode: context.loopSegmentByteCode,
			}).toMatchSnapshot();
		});

		it('emits F32_DIV for float operands', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: false, isNonZero: true }, { isInteger: false, isNonZero: true });

			div({ lineNumber: 1, instruction: 'div', arguments: [] } as AST[number], context);

			expect({
				stack: context.stack,
				loopSegmentByteCode: context.loopSegmentByteCode,
			}).toMatchSnapshot();
		});

		it('throws on division by zero', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: true, isNonZero: true }, { isInteger: true, isNonZero: false });

			expect(() => {
				div({ lineNumber: 1, instruction: 'div', arguments: [] } as AST[number], context);
			}).toThrowError();
		});
	});
}
