import createInstructionCompilerTestContext from '../utils/testUtils';
import { withValidation } from '../withValidation';
import WASMInstruction from '../wasmUtils/wasmInstruction';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `castToInt`.
 * @see [Instruction docs](../../docs/instructions/conversion.md)
 */
const castToInt: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'float',
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation ensures 1 operand exists
		const operand = context.stack.pop()!;

		context.stack.push({ isInteger: true, isNonZero: operand.isNonZero });

		context.byteCode.push(...[WASMInstruction.I32_TUNC_F32_S]);
		return context;
	}
);

export default castToInt;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('castToInt instruction compiler', () => {
		it('converts float operand to int', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: false, isNonZero: true });

			castToInt({ lineNumber: 1, instruction: 'castToInt', arguments: [] } as AST[number], context);

			expect({
				stack: context.stack,
				loopSegmentByteCode: context.loopSegmentByteCode,
			}).toMatchSnapshot();
		});
	});
}
