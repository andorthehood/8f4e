import { areAllOperandsFloat64, areAllOperandsIntegers, hasMixedFloatWidth } from '../utils/operandTypes';
import { saveByteCode } from '../utils/compilation';
import { withValidation } from '../withValidation';
import { ErrorCode, getError } from '../errors';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import createInstructionCompilerTestContext from '../utils/testUtils';

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

		if (hasMixedFloatWidth(operand1, operand2)) {
			throw getError(ErrorCode.MIXED_FLOAT_WIDTH, line, context);
		}

		const isInteger = areAllOperandsIntegers(operand1, operand2);
		const isFloat64 = areAllOperandsFloat64(operand1, operand2);

		context.stack.push({ isInteger, ...(isFloat64 ? { isFloat64: true } : {}), isNonZero: false });
		return saveByteCode(context, [
			isInteger ? WASMInstruction.I32_MUL : isFloat64 ? WASMInstruction.F64_MUL : WASMInstruction.F32_MUL,
		]);
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
				byteCode: context.byteCode,
			}).toMatchSnapshot();
		});

		it('emits F32_MUL for float32 operands', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: false, isNonZero: false }, { isInteger: false, isNonZero: false });

			mul({ lineNumber: 1, instruction: 'mul', arguments: [] } as AST[number], context);

			expect({
				stack: context.stack,
				byteCode: context.byteCode,
			}).toMatchSnapshot();
		});

		it('emits F64_MUL for float64 operands', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push(
				{ isInteger: false, isFloat64: true, isNonZero: false },
				{ isInteger: false, isFloat64: true, isNonZero: false }
			);

			mul({ lineNumber: 1, instruction: 'mul', arguments: [] } as AST[number], context);

			expect({
				stack: context.stack,
				byteCode: context.byteCode,
			}).toMatchSnapshot();
		});

		it('throws on mixed float32/float64 operands', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push(
				{ isInteger: false, isNonZero: false },
				{ isInteger: false, isFloat64: true, isNonZero: false }
			);

			expect(() => {
				mul({ lineNumber: 1, instruction: 'mul', arguments: [] } as AST[number], context);
			}).toThrowError();
		});
	});
}
