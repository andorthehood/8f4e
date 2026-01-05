import createInstructionCompilerTestContext from '../utils/testUtils';
import { areAllOperandsIntegers } from '../utils/operandTypes';
import { saveByteCode } from '../utils/compilation';
import { withValidation } from '../withValidation';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import { isIdentityAddition } from '../utils/strengthReduction';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `add`.
 * @see [Instruction docs](../../docs/instructions/arithmetic.md)
 */
const add: InstructionCompiler = withValidation(
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

		// Optimization: x + 0 -> x (identity)
		if (isInteger && isIdentityAddition(operand1, operand2)) {
			// One operand is 0, drop it and keep the other
			const isOperand2Zero = operand2.constantValue === 0;

			if (isOperand2Zero) {
				// Stack: [value, 0] - drop the 0 on top
				const nonConstantOperand = operand1;
				context.stack.push(nonConstantOperand);
				return saveByteCode(context, [WASMInstruction.DROP]);
			} else {
				// Stack: [0, value] - need to swap then drop, complex so skip optimization
				context.stack.push({ isInteger, isNonZero: false });
				return saveByteCode(context, [isInteger ? WASMInstruction.I32_ADD : WASMInstruction.F32_ADD]);
			}
		}

		context.stack.push({ isInteger, isNonZero: false });
		return saveByteCode(context, [isInteger ? WASMInstruction.I32_ADD : WASMInstruction.F32_ADD]);
	}
);

export default add;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('add instruction compiler', () => {
		it('emits I32_ADD for integer operands', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: true, isNonZero: false }, { isInteger: true, isNonZero: false });

			add({ lineNumber: 1, instruction: 'add', arguments: [] } as AST[number], context);

			expect({
				stack: context.stack,
				loopSegmentByteCode: context.loopSegmentByteCode,
			}).toMatchSnapshot();
		});

		it('emits F32_ADD for float operands', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: false, isNonZero: false }, { isInteger: false, isNonZero: false });

			add({ lineNumber: 1, instruction: 'add', arguments: [] } as AST[number], context);

			expect({
				stack: context.stack,
				loopSegmentByteCode: context.loopSegmentByteCode,
			}).toMatchSnapshot();
		});
	});
}
