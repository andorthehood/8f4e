import { withValidation } from '../withValidation';
import WASMInstruction from '../wasmUtils/wasmInstruction';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `round`.
 * @see [Instruction docs](../../docs/instructions/math-helpers.md)
 */
const round: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'float',
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation ensures 1 operand exists
		context.stack.pop()!;

		context.stack.push({ isInteger: false, isNonZero: false });

		context.byteCode.push(...[WASMInstruction.F32_NEAREST]);
		return context;
	}
);

export default round;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('round instruction compiler', () => {
		it('rounds a float operand', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: false, isNonZero: true });

			round({ lineNumber: 1, instruction: 'round', arguments: [] } as AST[number], context);

			expect({
				stack: context.stack,
				loopSegmentByteCode: context.loopSegmentByteCode,
			}).toMatchSnapshot();
		});
	});
}
