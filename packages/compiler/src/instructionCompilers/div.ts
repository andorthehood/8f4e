import { ErrorCode, getError } from '../errors';
import { areAllOperandsFloat64, areAllOperandsIntegers, hasMixedFloatWidth } from '../utils/operandTypes';
import { saveByteCode } from '../utils/compilation';
import { withValidation } from '../withValidation';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import createInstructionCompilerTestContext from '../utils/testUtils';

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
		const operand1 = context.stack.pop()!;
		const operand2 = context.stack.pop()!;

		if (!operand1.isNonZero) {
			throw getError(ErrorCode.DIVISION_BY_ZERO, line, context);
		}

		if (hasMixedFloatWidth(operand1, operand2)) {
			throw getError(ErrorCode.MIXED_FLOAT_WIDTH, line, context);
		}

		const isInteger = areAllOperandsIntegers(operand1, operand2);
		const isFloat64 = areAllOperandsFloat64(operand1, operand2);

		context.stack.push({ isInteger, ...(isFloat64 ? { isFloat64: true } : {}), isNonZero: true });
		return saveByteCode(context, [
			isInteger ? WASMInstruction.I32_DIV_S : isFloat64 ? WASMInstruction.F64_DIV : WASMInstruction.F32_DIV,
		]);
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
				byteCode: context.byteCode,
			}).toMatchSnapshot();
		});

		it('emits F32_DIV for float32 operands', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: false, isNonZero: true }, { isInteger: false, isNonZero: true });

			div({ lineNumber: 1, instruction: 'div', arguments: [] } as AST[number], context);

			expect({
				stack: context.stack,
				byteCode: context.byteCode,
			}).toMatchSnapshot();
		});

		it('emits F64_DIV for float64 operands', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push(
				{ isInteger: false, isFloat64: true, isNonZero: true },
				{ isInteger: false, isFloat64: true, isNonZero: true }
			);

			div({ lineNumber: 1, instruction: 'div', arguments: [] } as AST[number], context);

			expect({
				stack: context.stack,
				byteCode: context.byteCode,
			}).toMatchSnapshot();
		});

		it('throws on mixed float32/float64 operands', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: false, isNonZero: true }, { isInteger: false, isFloat64: true, isNonZero: true });

			expect(() => {
				div({ lineNumber: 1, instruction: 'div', arguments: [] } as AST[number], context);
			}).toThrowError();
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
