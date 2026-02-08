import { areAllOperandsIntegers } from '../utils/operandTypes';
import { withValidation } from '../withValidation';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `greaterOrEqual`.
 * @see [Instruction docs](../../docs/instructions/comparison.md)
 */
const greaterOrEqual: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 2,
		operandTypes: 'matching',
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation ensures 2 operands exist
		const operand2 = context.stack.pop()!;
		const operand1 = context.stack.pop()!;

		if (areAllOperandsIntegers(operand1, operand2)) {
			context.stack.push({ isInteger: true, isNonZero: false });
			context.byteCode.push(...[WASMInstruction.I32_GE_S]);
		return context;
		} else {
			context.stack.push({ isInteger: true, isNonZero: false });
			context.byteCode.push(...[WASMInstruction.F32_GE]);
		return context;
		}
	}
);

export default greaterOrEqual;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('greaterOrEqual instruction compiler', () => {
		it('emits I32_GE_S for integer operands', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: true, isNonZero: false }, { isInteger: true, isNonZero: false });

			greaterOrEqual({ lineNumber: 1, instruction: 'greaterOrEqual', arguments: [] } as AST[number], context);

			expect({
				stack: context.stack,
				loopSegmentByteCode: context.loopSegmentByteCode,
			}).toMatchSnapshot();
		});

		it('emits F32_GE for float operands', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: false, isNonZero: false }, { isInteger: false, isNonZero: false });

			greaterOrEqual({ lineNumber: 1, instruction: 'greaterOrEqual', arguments: [] } as AST[number], context);

			expect({
				stack: context.stack,
				loopSegmentByteCode: context.loopSegmentByteCode,
			}).toMatchSnapshot();
		});
	});
}
