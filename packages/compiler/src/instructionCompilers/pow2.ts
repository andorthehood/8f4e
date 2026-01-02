import { withValidation } from '../withValidation';
import { compileSegment } from '../compiler';
import createInstructionCompilerTestContext from '../utils/testUtils';

import type { AST, InstructionCompiler } from '../types';

/**
 * Instruction compiler for `pow2`.
 * @see [Instruction docs](../../docs/instructions/math-helpers.md)
 */
const pow2: InstructionCompiler = withValidation(
	{
		scope: 'moduleOrFunction',
		minOperands: 1,
		operandTypes: 'int',
	},
	(line, context) => {
		// Non-null assertion is safe: withValidation ensures 1 operand exists
		context.stack.pop()!;

		context.stack.push({ isInteger: true, isNonZero: false });

		return compileSegment(['push 2', 'push 1', 'sub', 'swap', 'shiftLeft'], context);
	}
);

export default pow2;

if (import.meta.vitest) {
	const { describe, it, expect } = import.meta.vitest;

	describe('pow2 instruction compiler', () => {
		it('computes power of two', () => {
			const context = createInstructionCompilerTestContext();
			context.stack.push({ isInteger: true, isNonZero: true });

			pow2({ lineNumber: 1, instruction: 'pow2', arguments: [] } as AST[number], context);

			expect({
				stack: context.stack,
				loopSegmentByteCode: context.loopSegmentByteCode,
			}).toMatchSnapshot();
		});
	});
}
